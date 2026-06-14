"""
Extract distinct categories from the DB-ready dataset and regenerate:
  1. categories.json                      (workspace root)
  2. backend/src/services/categories.ts   (hardcoded list used by Gemini)

Categories are lowercased+trimmed to EXACTLY match how seedProduct.js stores the
`category` field, so Gemini's returned keys validate and the DB queries match.
"""

import csv
import json
import os

CSV = "final_updated_categories.csv"
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
JSON_OUT = os.path.join(ROOT, "categories.json")
TS_OUT = os.path.join(ROOT, "backend", "src", "services", "categories.ts")

seen = set()
cats = []
with open(CSV, encoding="utf-8") as f:
    for row in csv.DictReader(f):
        c = (row.get("category") or "").strip().lower()
        if c and c != "other" and c not in seen:
            seen.add(c)
            cats.append(c)

cats.sort()

# 1) categories.json
with open(JSON_OUT, "w", encoding="utf-8") as f:
    json.dump(cats, f, indent=2, ensure_ascii=False)
    f.write("\n")

# 2) backend categories.ts
lines = []
lines.append("/**")
lines.append(" * Known product categories (generated from the seeded dataset).")
lines.append(" * Lowercased to match the stored `category` field and the values Gemini")
lines.append(" * is allowed to return. Regenerate via dataset/gen_categories.py.")
lines.append(" */")
lines.append("export const KNOWN_CATEGORIES: string[] = [")
for c in cats:
    safe = c.replace("\\", "\\\\").replace("'", "\\'")
    lines.append(f"  '{safe}',")
lines.append("];")
lines.append("")
lines.append("/** Fast membership lookup. */")
lines.append("export const KNOWN_CATEGORY_SET = new Set(KNOWN_CATEGORIES);")
lines.append("")
with open(TS_OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Distinct categories: {len(cats)}")
print(f"Wrote: {JSON_OUT}")
print(f"Wrote: {TS_OUT}")
print("Sample:", ", ".join(cats[:15]))
