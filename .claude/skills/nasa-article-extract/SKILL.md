---
name: nasa-article-extract
description: Extract articles from a NASA.gov index page (e.g. https://www.nasa.gov/hrp/risks/ or https://www.nasa.gov/hrp/hazards/) or from individual NASA.gov article URLs into Markdown files with YAML front matter (title, topics, summary) and the article body kept as written. Use when the user asks to extract, scrape, save or convert NASA articles or reference pages into markdown, especially for specific sections of an index page.
---

# NASA article extraction

Turns NASA.gov articles into one Markdown file each:

```markdown
---
title: "Risk of Hypoxia"
topics: ["hypoxia", "oxygen levels", "spacewalk", ...]
summary: "2-4 sentence summary of the article."
source: https://www.nasa.gov/reference/risk-of-hypoxia/
section: "Risks Involving Human Physiology"
---

<article body, as written on the page, in Markdown>
```

- **title**: the article title (from the page `<title>`, without the " - NASA" suffix).
- **topics**: keywords. Use 8-12 short, lowercase-where-natural terms covering the health condition, causes, symptoms, measurements and countermeasures named in the article.
- **summary**: 2-4 plain sentences you write after reading the body. Use only facts that are in the article, and keep the key numbers (rates, percentages, durations).
- **body**: the article itself, with no rewording. Headings, paragraphs, lists, links, emphasis, lead images and captions are kept. Site chrome and the "Related Content" carousel are dropped.
- `source` and `section` are added for traceability.

## Inputs to confirm

1. **Source**: an index page plus the exact section headings to take articles from, or a list of article URLs.
2. **Output folder**: default `plan/articles/` in this repo unless the user names another.

If the user's section names don't exactly match the page headings, run the `list` step first and use the exact heading text.

## Steps

Scripts are in `scripts/` next to this file and use only the Python standard library.

1. **Preview the article list** (index pages only):
   ```bash
   python3 .claude/skills/nasa-article-extract/scripts/extract.py list <index_url> \
     --section "<Section heading 1>" --section "<Section heading 2>"
   ```
   Each line is `section<TAB>title<TAB>url`. Check that every requested section produced articles.

2. **Extract the bodies** (writes files with `topics`/`summary` marked TODO):
   ```bash
   python3 .claude/skills/nasa-article-extract/scripts/extract.py extract --out <out_dir> \
     <index_url> --section "<Section 1>" --section "<Section 2>"
   # or individual articles:
   python3 .claude/skills/nasa-article-extract/scripts/extract.py extract --out <out_dir> --url <article_url> ...
   ```
   Existing files are skipped. Add `--force` to re-extract, which also resets their topics and summary.

3. **Read every extracted body**, then write a JSON file in the scratchpad that maps each file name to its metadata:
   ```json
   {"risk-of-hypoxia": {"topics": ["hypoxia", "..."], "summary": "..."}}
   ```
   Apply it:
   ```bash
   python3 .claude/skills/nasa-article-extract/scripts/fill_frontmatter.py <meta.json> <out_dir>
   ```
   The script exits non-zero and lists any file that still has TODO placeholders.

4. **Verify** before reporting back:
   - The file count matches the number of articles listed in step 1.
   - No body contains leftover HTML (`<`), "Related Content" or "Read More".
   - Spot-check one file against the live page to confirm the body is complete. Each NASA HRP risk page has the sections "What are the top risks?", "What can be done about it?" and "Did you know?".

## Notes

- The extractor reads the article from `div.hds-entry-content`, the NASA.gov WordPress template. If a page has no such container, the script reports `no article body found`. Inspect that page's HTML and adjust `BodyParser` rather than hand-copying the text.
- Section matching expects the section names as headings, with article links (`/reference/...`) beneath them, until the next `Risks ...` / `Discover More` heading. Other index layouts may need the stop rule in `list_sections` adjusted.
- Don't reword or summarize inside the body. The summary belongs only in the front matter.
