#!/usr/bin/env python3
"""Extract NASA.gov articles into Markdown files with YAML front matter.

Standard library only (no bs4/markdownify needed).

Usage:
  # List the article links under the given section headings of an index page
  extract.py list <index_url> --section "Risks Involving Space Radiation" [--section ...]

  # Extract articles (from an index page's sections, or explicit URLs) to OUT_DIR
  extract.py extract --out plan/articles <index_url> --section "..." [--section ...]
  extract.py extract --out plan/articles --url <article_url> [--url ...]

Each output file gets front matter with `title`, `source`, `section`, and empty
`topics` / `summary` fields (marked TODO) for Claude to fill in after reading
the body. Existing files are skipped unless --force is given.
"""
import argparse
import html
import os
import re
import sys
import urllib.request
from urllib.parse import urljoin, urlparse
from html.parser import HTMLParser

UA = "Mozilla/5.0 (compatible; article-extractor)"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", errors="replace")


def strip_tags(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


# ---------------------------------------------------------------- index page
def list_sections(index_html, sections):
    """Return [(section, title, url)] for article links under each section heading.

    Walks headings in document order; a section runs until the next heading at the
    same or a higher level (e.g. the next <h2> after an <h2> section). Every
    NASA.gov article link inside the section is collected, titled by the nearest
    sub-heading above it (e.g. the <h3> card title).
    """
    wanted = {html.unescape(s).lower(): s for s in sections}
    i, j = index_html.find("<main"), index_html.find("</main>")
    if i != -1 and j != -1:
        index_html = index_html[i:j]
    tokens = re.finditer(
        r"<h([1-6])[^>]*>(.*?)</h\1>|<a\s[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>",
        index_html,
        re.S,
    )
    current, current_level = None, 0
    sub_title = None
    out, seen = [], set()
    for m in tokens:
        if m.group(1):
            level = int(m.group(1))
            text = strip_tags(m.group(2))
            if not text:
                continue
            if text.lower() in wanted:
                current, current_level, sub_title = wanted[text.lower()], level, None
            elif current and level <= current_level:
                current = None
            elif current:
                sub_title = text
        elif current:
            href = m.group(3)
            if href.startswith("/"):
                href = "https://www.nasa.gov" + href
            if not re.match(r"https://www\.nasa\.gov/.+", href) or href in seen:
                continue
            seen.add(href)
            out.append((current, sub_title or strip_tags(m.group(4)), href))
    return out


# ---------------------------------------------------------------- article body
SKIP_CLASSES = ("hds-card-carousel", "hds-related-articles", "wp-block-spacer", "hds-sidebar", "hds-social", "screen-reader",
                # Canada.ca / CSA (WET template)
                "pagedetails", "wb-inv", "hidden-print", "input-group")
SKIP_IDS = {"filters"}

# Per-site templates. "start" finds the article container; "headings" maps HTML
# heading tags to Markdown levels; "stop_headings" end the article body (links
# under them are still collected for --follow).
PROFILES = {
    "nasa": {
        "start": lambda tag, cls, a: tag == "div" and bool({"hds-entry-content", "entry-content"} & set(cls.split())),
        # page h2 is the article title; article sections use h1 -> map to ##
        "headings": {"h1": 2, "h2": 1, "h3": 3, "h4": 4, "h5": 5, "h6": 6},
        "stop_headings": {"related content"},
        "container": "div.hds-entry-content or div.entry-content",
    },
    "csa": {
        "start": lambda tag, cls, a: tag == "main",
        "headings": {"h1": 1, "h2": 2, "h3": 3, "h4": 4, "h5": 5, "h6": 6},
        "stop_headings": {"explore further", "follow us"},
        "end_comment": "FIN DU CONTENU",   # WET template marks the end of page content
        "container": "<main>",
    },
}


def absolute(base, href):
    """Resolve relative links; leave absolute ones exactly as written."""
    return href if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", href) else urljoin(base, href)


def profile_for(url):
    host = urlparse(url).netloc.lower()
    if host.endswith("asc-csa.gc.ca") or host.endswith("canada.ca"):
        return "csa"
    return "nasa"

BLOCK_TAGS = {"p", "div", "section", "figure", "figcaption", "blockquote", "ul", "ol", "li",
              "h1", "h2", "h3", "h4", "h5", "h6", "table", "tr"}
VOID_TAGS = {"img", "br", "hr", "meta", "link", "input", "source", "wbr"}


class BodyParser(HTMLParser):
    """Converts the article content container to Markdown."""

    def __init__(self, base_url="", profile="nasa"):
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.profile = PROFILES[profile]
        self.stopped = False      # past a stop heading: no output, still collect links
        self.links = []           # (absolute url, text) for every link in the container
        self.heading_start = 0
        self.depth = 0            # depth inside content container (0 = outside)
        self.skip_depth = 0       # >0 while inside a skipped subtree
        self.done = False
        self.out = []
        self.list_stack = []
        self.href = None
        self.link_text = []
        self.in_caption = False
        self.heading = None
        self.pending = ""       # opening emphasis markers waiting for text
        self.em_depth = {}      # open count per emphasis marker
        self.caption = []

    # helpers
    def emit(self, s):
        if self.in_caption:
            self.caption.append(s)
        elif self.href is not None:
            self.link_text.append(s)
        else:
            self.out.append(s)

    def no_emphasis(self):
        return bool(self.heading or self.in_caption or self.href is not None)

    def open_em(self, marker):
        if self.no_emphasis():
            return
        # nested same-kind tags (<em><em>…</em></em>) emit a single marker pair
        self.em_depth[marker] = self.em_depth.get(marker, 0) + 1
        if self.em_depth[marker] == 1:
            self.pending += marker

    def close_em(self, marker):
        if self.no_emphasis():
            return
        depth = self.em_depth.get(marker, 0)
        if depth == 0:
            return
        self.em_depth[marker] = depth - 1
        if depth > 1:
            return
        if self.pending.endswith(marker):   # empty emphasis: drop it
            self.pending = self.pending[: -len(marker)]
            return
        # move trailing whitespace outside the closing marker
        trail = ""
        while self.out and not self.out[-1].strip():
            trail = self.out.pop() + trail
        if self.out:
            last = self.out[-1]
            stripped = last.rstrip()
            trail = last[len(stripped):] + trail
            self.out[-1] = stripped
        self.out.append(marker + trail)

    def block_break(self):
        self.out.append("\n\n")

    def handle_starttag(self, tag, attrs):
        if self.done:
            return
        a = dict(attrs)
        cls = a.get("class") or ""
        if self.depth == 0:
            if self.profile["start"](tag, cls, a):
                self.depth = 1
            return
        if tag == "footer":
            self.done = True
            return
        if tag not in VOID_TAGS:
            self.depth += 1
        if self.skip_depth:
            if tag not in VOID_TAGS:
                self.skip_depth += 1
            return
        if tag == "a" and a.get("href") and self.stopped:
            self.links.append((absolute(self.base_url, a["href"]), ""))
        if self.stopped:
            return
        if (tag in ("script", "style", "svg", "button", "noscript", "iframe", "input", "label")
                or any(c in cls for c in SKIP_CLASSES) or a.get("id") in SKIP_IDS):
            if "hds-card-carousel" in cls:
                # "Related Content" marks the end of the article body
                self.done = True
                return
            if tag not in VOID_TAGS:
                self.skip_depth = 1
            return

        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.block_break()
            self.heading = tag
            self.heading_start = len(self.out)
            level = self.profile["headings"][tag]
            self.out.append("#" * level + " ")
        elif tag == "p":
            self.block_break()
        elif tag in ("ul", "ol"):
            self.list_stack.append([tag, 0])
            self.block_break()
        elif tag == "li":
            indent = "  " * (len(self.list_stack) - 1)
            if self.list_stack and self.list_stack[-1][0] == "ol":
                self.list_stack[-1][1] += 1
                self.out.append(f"\n{indent}{self.list_stack[-1][1]}. ")
            else:
                self.out.append(f"\n{indent}- ")
        elif tag == "blockquote":
            self.block_break()
            self.out.append("> ")
        elif tag in ("strong", "b"):
            self.open_em("**")
        elif tag in ("em", "i"):
            self.open_em("*")
        elif tag == "br":
            self.emit("  \n")
        elif tag == "a":
            if a.get("href") and self.href is None:
                self.href = absolute(self.base_url, a["href"])
                self.link_text = []
        elif tag == "img":
            src = (a.get("src") or "").split("?")[0]
            if src:
                src = absolute(self.base_url, src)
                self.block_break()
                self.out.append(f"![{a.get('alt', '')}]({src})")
        elif tag == "figcaption":
            self.in_caption = True
            self.caption = []
        elif tag in BLOCK_TAGS:
            pass

    def handle_endtag(self, tag):
        if self.done or self.depth == 0:
            return
        if tag not in VOID_TAGS:
            self.depth -= 1
            if self.depth == 0:
                self.done = True
                return
        if self.skip_depth:
            if tag not in VOID_TAGS:
                self.skip_depth -= 1
            return
        if self.stopped:
            return
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.heading = None
            text = re.sub(r"[#\s]+", " ", "".join(self.out[self.heading_start:])).strip().lower()
            if text in self.profile["stop_headings"]:
                del self.out[self.heading_start:]
                self.stopped = True
                return
            self.block_break()
        elif tag in ("ul", "ol"):
            if self.list_stack:
                self.list_stack.pop()
            self.block_break()
        elif tag in ("strong", "b"):
            self.close_em("**")
        elif tag in ("em", "i"):
            self.close_em("*")
        elif tag == "a" and self.href is not None:
            raw = "".join(self.link_text)
            text = raw.strip()
            href = self.href
            self.href = None
            self.links.append((href, text))
            if text:
                # keep spaces that sat inside the <a> tag outside the brackets
                lead = " " if raw[:1].isspace() else ""
                trail = " " if raw[-1:].isspace() else ""
                self.out.append(lead)
                self.flush_pending()
                self.out.append(f"[{text}]({href}){trail}")
        elif tag == "figcaption":
            self.in_caption = False
            text = re.sub(r"\s+", " ", "".join(self.caption)).strip()
            if text:
                self.block_break()
                self.out.append(f"*{text}*")
                self.block_break()
        elif tag in ("p", "blockquote"):
            self.block_break()

    def handle_data(self, data):
        if self.done or self.depth == 0 or self.skip_depth or self.stopped:
            return
        text = re.sub(r"\s+", " ", data)
        if not text.strip():
            if self.out or self.caption:
                self.emit(text)
            return
        if self.pending and not self.no_emphasis():
            lead = text[: len(text) - len(text.lstrip())]
            self.out.append(lead + self.pending)
            self.pending = ""
            text = text.lstrip()
        self.emit(text)

    def handle_comment(self, data):
        end = self.profile.get("end_comment")
        if end and self.depth and end in data:
            self.done = True

    def flush_pending(self):
        if self.pending:
            self.out.append(self.pending)
            self.pending = ""

    def markdown(self):
        md = "".join(self.out)
        md = md.replace("\xa0", " ")
        lines = []
        for ln in md.split("\n"):
            if not ln.strip():
                ln = ""
            elif not re.match(r"^\s+(-|\d+\.) ", ln):
                ln = ln.lstrip()
            hard = ln.endswith("  ")
            ln = ln.rstrip() + ("  " if hard else "")
            lines.append(ln)
        md = "\n".join(lines)
        md = re.sub(r"^(#{1,6})\s+", r"\1 ", md, flags=re.M)
        md = re.sub(r"^#{1,6}\s*$", "", md, flags=re.M)      # empty headings
        md = re.sub(r"^(\s*)-\s*$", "", md, flags=re.M)      # empty list items
        md = re.sub(r"^(\s*(?:-|\d+\.)) {2,}(?=\S)", r"\1 ", md, flags=re.M)
        md = re.sub(r"\n{3,}", "\n\n", md)
        return md.strip() + "\n"


def flatten_csa_cards(page):
    """CSA listing pages wrap each item in <article><a><figure>…<h3>Title</h3>…</figure></a>.
    Rewrite each card as '<a href>Title</a> (label)' so it becomes one list item."""
    def card(m):
        href, inner = m.group(1), m.group(2)
        t = re.search(r"<h[2-6][^>]*>(.*?)</h[2-6]>", inner, re.S)
        if not t:
            return m.group(0)
        label = re.search(r"<small>(.*?)</small>", inner, re.S)
        lab = f" ({strip_tags(label.group(1))})" if label else ""
        return f'<a href="{href}">{strip_tags(t.group(1))}</a>{lab}'
    return re.sub(r"<article[^>]*>\s*<a\s[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>\s*</article>", card, page, flags=re.S)


def extract_article(url):
    page = fetch(url)
    m = re.search(r"<title>(.*?)</title>", page, re.S)
    title = strip_tags(m.group(1)) if m else url
    title = re.sub(r"\s*[-–|]\s*(NASA|Canadian Space Agency)\s*$", "", title)
    prof = profile_for(url)
    if prof == "csa":
        page = flatten_csa_cards(page)
    p = BodyParser(url, prof)
    p.feed(page)
    body = p.markdown()
    if not body.strip():
        raise RuntimeError(f"no article body found at {url} (no {PROFILES[prof]['container']})")
    # drop the leading H1 duplicate of the title; front matter carries it
    # (the page's title heading may follow a lead image, so drop the first H1
    # if it appears before any section heading)
    m = re.search(r"^# [^\n]*\n+", body, re.M)
    first_sec = re.search(r"^## ", body, re.M)
    if m and (not first_sec or m.start() < first_sec.start()):
        body = body[: m.start()] + body[m.end():]
    # reference pages use an H1 (rendered "##") for the title instead; drop the
    # first heading of any level if it repeats the title. If that heading is the
    # fuller name (e.g. "Human Research Program Omics Archive" vs <title>
    # "Omics archive"), use it as the title.
    m = re.search(r"^#{1,6} ([^\n]*)\n+", body, re.M)
    if m:
        heading = m.group(1).strip()
        h, t = heading.lower(), title.lower()
        if h == t or t in h or h in t:
            body = body[: m.start()] + body[m.end():]
            if len(heading) > len(title) and t in h:
                title = heading
    return title, body, p.links


def slugify(s):
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
    return s[:80]


def yaml_str(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def article_links(page_url, links):
    """Links from an article worth following: same site, HTML pages, not media/search."""
    host = urlparse(page_url).netloc
    out, seen = [], {page_url.split("#")[0]}
    for href, _ in links:
        u = href.split("#")[0]
        pu = urlparse(u)
        if pu.scheme not in ("http", "https") or pu.netloc != host or u in seen:
            continue
        if re.search(r"\.(jpe?g|png|gif|pdf|xml|mp4|zip)$", pu.path, re.I):
            continue
        if re.search(r"/(multimedia|search|wp-content|rss)/", pu.path) or pu.path in ("", "/"):
            continue
        seen.add(u)
        out.append(u)
    return out


def write_article(out_dir, url, section, force):
    title, body, links = extract_article(url)
    path = os.path.join(out_dir, slugify(title) + ".md")
    if os.path.exists(path) and not force:
        print(f"skip (exists): {path}")
        return title, links
    fm = ["---", f"title: {yaml_str(title)}", "topics: []  # TODO: fill with keywords",
          'summary: ""  # TODO: fill with a 2-4 sentence summary', f"source: {url}"]
    if section:
        fm.append(f"section: {yaml_str(section)}")
    fm.append("---")
    with open(path, "w") as f:
        f.write("\n".join(fm) + "\n\n" + body)
    print(f"wrote: {path}")
    return title, links


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    l = sub.add_parser("list")
    l.add_argument("index_url")
    l.add_argument("--section", action="append", required=True)
    e = sub.add_parser("extract")
    e.add_argument("index_url", nargs="?")
    e.add_argument("--section", action="append", default=[])
    e.add_argument("--url", action="append", default=[])
    e.add_argument("--out", required=True)
    e.add_argument("--force", action="store_true")
    e.add_argument("--follow", action="store_true",
                   help="also extract same-site articles linked from each extracted article (one level)")
    args = ap.parse_args()

    if args.cmd == "list":
        for sec, title, href in list_sections(fetch(args.index_url), args.section):
            print(f"{sec}\t{title}\t{href}")
        return

    os.makedirs(args.out, exist_ok=True)
    jobs = [(None, u) for u in args.url]
    if args.index_url:
        if not args.section:
            sys.exit("--section is required with an index_url")
        found = list_sections(fetch(args.index_url), args.section)
        missing = set(args.section) - {s for s, _, _ in found}
        for s in missing:
            print(f"warning: no articles found under section {s!r}", file=sys.stderr)
        jobs += [(sec, href) for sec, _, href in found]
    failures = 0
    done = set()
    followed = []
    for sec, url in jobs:
        done.add(url)
        try:
            title, links = write_article(args.out, url, sec, args.force)
            if args.follow:
                followed += [(f"Linked from: {title}", u) for u in article_links(url, links)]
        except Exception as ex:  # keep going; report at end
            failures += 1
            print(f"error: {url}: {ex}", file=sys.stderr)
    for sec, url in followed:
        if url in done:
            continue
        done.add(url)
        try:
            write_article(args.out, url, sec, args.force)
        except Exception as ex:
            failures += 1
            print(f"error: {url}: {ex}", file=sys.stderr)
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
