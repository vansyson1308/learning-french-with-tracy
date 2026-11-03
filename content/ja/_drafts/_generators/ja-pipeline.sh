#!/usr/bin/env bash
# ja-vi, session 1 of P4c (lexicon, objectives, units): regenerate the drafts and ingest them through the toolkit.
# Byte-deterministic: run it twice, the outputs are identical. Offline: ja-subset.py (the one-time slice of the pinned
# OpenJLPT and JmdictFurigana files) is not part of it; its output content/ja/lexicon/derived/jlpt-course.json is.
# Everything except the lexicon (content/ja/lexemes.json, content/ja/lexicon/*, content/hanviet/ja.json) lands in the
# staged layer (content/ja/_drafts/staged/) until `author.ts promote`. While the course has no lessons, a copy of the
# draft pack (content/ja/_drafts/pack.json) is the staged content/courses/ja-vi.json skeleton.
# Run from anywhere: bash content/ja/_drafts/_generators/ja-pipeline.sh
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
cd "$(dirname "$0")/../../../.."
G=content/ja/_drafts/_generators
STAGED=content/ja/_drafts/staged

# A step stops the pipeline only for a record that failed the schema; validator errors are expected while layers are
# missing (lessons, reception, ...): author.ts validate --target ja reports them.
ingest() {
  local dir=$1 step=${2:-$1}
  bun scripts/author.ts ingest "$step" --target ja --native vi > /dev/null || true
  grep -q "failed: 0 ·" "content/ja/_drafts/$dir/REPORT.md"
}

python -I "$G/ja-lex.py" .
# Full replacement, so a record the generators dropped does not linger. The draft pack is rebuilt from the units.
rm -f "$STAGED/content/ja/assessment/objectives.json" "$STAGED/content/courses/ja-vi.json" content/ja/_drafts/pack.json
python -I "$G/ja-objectives.py" .
python -I "$G/ja-units.py" .
ingest objectives
ingest units
if ! python -I -c "import json,sys; p=json.load(open('content/ja/_drafts/pack.json',encoding='utf-8')); sys.exit(0 if all(l['exercises'] for s in p['sections'] for u in s['units'] for l in u['lessons']) else 1)"; then
  mkdir -p "$STAGED/content/courses"
  cp content/ja/_drafts/pack.json "$STAGED/content/courses/ja-vi.json"
fi
bun scripts/course-draft.ts syllabus --target ja
python -I "$G/ja-lex.py" . split
