#!/usr/bin/env python3
"""Fill `topics` and `summary` in extracted article front matter.

Usage: fill_frontmatter.py <metadata.json> <out_dir>

metadata.json maps a file name (with or without .md) to
  {"topics": ["keyword", ...], "summary": "2-4 sentences"}

Only the `topics:` and `summary:` lines inside the front matter are rewritten;
the body is left untouched.
"""
import json
import os
import re
import sys


def yaml_str(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def main():
    meta_path, out_dir = sys.argv[1], sys.argv[2]
    meta = json.load(open(meta_path))
    missing = 0
    for name, m in meta.items():
        path = os.path.join(out_dir, name if name.endswith(".md") else name + ".md")
        if not os.path.exists(path):
            print(f"missing: {path}", file=sys.stderr)
            missing += 1
            continue
        text = open(path).read()
        fm_match = re.match(r"---\n(.*?)\n---\n", text, re.S)
        if not fm_match:
            print(f"no front matter: {path}", file=sys.stderr)
            missing += 1
            continue
        fm = fm_match.group(1)
        topics = "topics: [" + ", ".join(yaml_str(t) for t in m["topics"]) + "]"
        summary = "summary: " + yaml_str(m["summary"].strip())
        fm = re.sub(r"^topics:.*$", lambda _: topics, fm, count=1, flags=re.M)
        fm = re.sub(r"^summary:.*$", lambda _: summary, fm, count=1, flags=re.M)
        open(path, "w").write("---\n" + fm + "\n---\n" + text[fm_match.end():])
        print(f"filled: {path}")
    # report any files still holding TODO placeholders
    for f in sorted(os.listdir(out_dir)):
        if f.endswith(".md") and "# TODO" in open(os.path.join(out_dir, f)).read().split("\n---\n", 1)[0]:
            print(f"still TODO: {f}", file=sys.stderr)
            missing += 1
    sys.exit(1 if missing else 0)


if __name__ == "__main__":
    main()
