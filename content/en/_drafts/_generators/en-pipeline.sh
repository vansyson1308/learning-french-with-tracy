#!/usr/bin/env bash
# en-vi steps 1-3: regenerate the drafts and ingest them through the toolkit. Byte-deterministic.
# Everything lands in the staged layer (content/en/_drafts/staged/) until `author.ts promote`; the draft pack is
# content/en/_drafts/pack.json, and a copy of it is the staged content/courses/en-vi.json skeleton until the lessons step
# writes the real one. Run from anywhere: bash content/en/_drafts/_generators/en-pipeline.sh
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
cd "$(dirname "$0")/../../../.."
G=content/en/_drafts/_generators
STAGED=content/en/_drafts/staged

python -I "$G/en-lex.py" .
# Full replacement, so a record the generators dropped does not linger. The draft pack is kept: it may hold lessons.
rm -f "$STAGED/content/en/assessment/objectives.json" "$STAGED/content/en/pedagogy/concepts.json" "$STAGED/content/en/pedagogy/paradigms.json" "$STAGED/content/courses/en-vi.json"
python -I "$G/en-objectives.py" .
python -I "$G/en-units.py" .
python -I "$G/en-concepts.py" .
bun scripts/author.ts ingest objectives --target en --native vi
bun scripts/author.ts ingest units --target en --native vi
bun scripts/author.ts ingest concepts --target en --native vi
if ! python -I -c "import json,sys; p=json.load(open('content/en/_drafts/pack.json',encoding='utf-8')); sys.exit(0 if all(l['exercises'] for s in p['sections'] for u in s['units'] for l in u['lessons']) else 1)"; then
  mkdir -p "$STAGED/content/courses"
  cp content/en/_drafts/pack.json "$STAGED/content/courses/en-vi.json"
fi
bun scripts/en-draft.ts syllabus
python -I "$G/en-lex.py" . split
