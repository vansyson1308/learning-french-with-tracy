#!/usr/bin/env bash
# zh-vi, sessions 1-2 of P4d (lexicon, objectives, units; concept cards and lessons): regenerate the drafts and ingest
# them through the toolkit. Byte-deterministic: run it twice, the outputs are identical. Offline: zh-subset.py (the
# one-time slice of the pinned hsk30, CC-CEDICT and wordfreq files) is not part of it; its output
# content/zh/lexicon/derived/hsk-course.json is.
# Everything except the lexicon (content/zh/lexemes.json, content/zh/lexicon/*, content/hanviet/zh.json) lands in the
# staged layer (content/zh/_drafts/staged/) until `author.ts promote`. Once every lesson has exercises the lessons
# ingest writes the staged content/courses/zh-vi.json; before that a copy of the draft pack is the skeleton.
# Run from anywhere: bash content/zh/_drafts/_generators/zh-pipeline.sh
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
cd "$(dirname "$0")/../../../.."
G=content/zh/_drafts/_generators
STAGED=content/zh/_drafts/staged

# A step stops the pipeline only for a record that failed the schema; validator errors are expected while layers are
# missing (reception, speech, ...): course-draft.ts validate --target zh reports them.
ingest() {
  local dir=$1 step=${2:-$1}
  bun scripts/author.ts ingest "$step" --target zh --native vi > /dev/null || true
  grep -q "failed: 0 ·" "content/zh/_drafts/$dir/REPORT.md"
}

python -I "$G/zh-lex.py" .
# Full replacement, so a record the generators dropped does not linger. The draft pack is rebuilt from the units.
rm -f "$STAGED/content/zh/assessment/objectives.json" "$STAGED/content/courses/zh-vi.json" content/zh/_drafts/pack.json
rm -f "$STAGED/content/zh/pedagogy/concepts.json"
python -I "$G/zh-objectives.py" .
python -I "$G/zh-units.py" .
python -I "$G/zh-concepts.py" .
ingest objectives
ingest units
ingest concepts
# Lessons (session 2): each section's generator writes lessons/parts/<section>.jsonl; the self-check joins them into
# lessons/OUTPUT.jsonl and stops on an answer key it finds wrong or ambiguous (review/selfcheck.json).
rm -rf content/zh/_drafts/lessons/parts
for section in s1 s2 s3 s4 s5 s6; do
  if [ -f "$G/zh-lessons-$section.py" ]; then python -I "$G/zh-lessons-$section.py" .; fi
done
python -I "$G/zh-check-answers.py" .
ingest lessons
if ! python -I -c "import json,sys; p=json.load(open('content/zh/_drafts/pack.json',encoding='utf-8')); sys.exit(0 if all(l['exercises'] for s in p['sections'] for u in s['units'] for l in u['lessons']) else 1)"; then
  mkdir -p "$STAGED/content/courses"
  cp content/zh/_drafts/pack.json "$STAGED/content/courses/zh-vi.json"
fi
bun scripts/course-draft.ts syllabus --target zh
python -I "$G/zh-lex.py" . split
