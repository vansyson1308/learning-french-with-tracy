#!/usr/bin/env bash
# ko-vi, P4e sessions 1-2 (lexicon, objectives, units, syllabus; concept cards, paradigm tables, the Hangul primer and
# 108 lessons with the answer-key self-check): regenerate the drafts and ingest them through the toolkit.
# Byte-deterministic: run it twice, the outputs are identical. Offline: the Unihan subset with the ko-vi hanja was
# re-derived once from the pinned Unihan 17.0.0 zip (bun scripts/hanviet-unihan.ts derive) into the staged
# content/hanviet/unihan-readings.json; it is an input here, not a step.
# EVERYTHING lands in the staged layer (content/ko/_drafts/staged/) until `author.ts promote`, the lexicon, the Hán-Việt
# table, the primer and the source registry included, so src/content, the goldens and `content:validate` stay untouched
# while the course is built; `bun scripts/course-draft.ts validate --target ko` checks the course with the staged layer
# overlaid.
# Run from anywhere: bash content/ko/_drafts/_generators/ko-pipeline.sh
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
cd "$(dirname "$0")/../../../.."
G=content/ko/_drafts/_generators
STAGED=content/ko/_drafts/staged

# A step stops the pipeline only for a record that failed the schema; validator errors are expected while layers are
# missing (reception, speech, ...): course-draft.ts validate --target ko reports them.
ingest() {
  local dir=$1 step=${2:-$1}
  bun scripts/author.ts ingest "$step" --target ko --native vi > /dev/null || true
  grep -q "failed: 0 ·" "content/ko/_drafts/$dir/REPORT.md"
}

python -I "$G/ko-lex.py" .
# Session 2: the Hangul primer, staged (the committed content/ko/primer/script-primer.json of P4b is golden-pinned).
python -I "$G/ko-primer.py" .
# Full replacement, so a record the generators dropped does not linger. The draft pack is rebuilt from the units.
rm -f "$STAGED/content/ko/assessment/objectives.json" "$STAGED/content/courses/ko-vi.json" content/ko/_drafts/pack.json
rm -f "$STAGED/content/ko/pedagogy/concepts.json" "$STAGED/content/ko/pedagogy/paradigms.json"
python -I "$G/ko-objectives.py" .
python -I "$G/ko-units.py" .
# Session 2: concept cards and paradigm tables; also writes the staged source registry (original-korean-course).
python -I "$G/ko-concepts.py" .
ingest objectives
ingest units
ingest concepts
# QC 2026-11-05 §2.1: ko-vi bundles no audio; its listening is graded through the device voice (profile flag
# deviceVoiceScoredListening, written by ko-units.py). The pack records the policy and its reason.
python -I "$G/ko-pack-audio.py" .
# Lessons (session 2): each section's generator writes lessons/parts/<section>.jsonl; the self-check joins them into
# lessons/OUTPUT.jsonl and stops on an answer key it finds wrong or ambiguous (review/selfcheck.json).
rm -rf content/ko/_drafts/lessons/parts
for section in s1 s2 s3 s4 s5 s6; do
  python -I "$G/ko-lessons-$section.py" .
done
python -I "$G/ko-check-answers.py" .
ingest lessons
# The lessons ingest writes the staged course pack once every lesson has exercises; until then the draft pack is it.
if ! python -I -c "import json,sys; p=json.load(open('content/ko/_drafts/pack.json',encoding='utf-8')); sys.exit(0 if all(l['exercises'] for s in p['sections'] for u in s['units'] for l in u['lessons']) else 1)"; then
  mkdir -p "$STAGED/content/courses"
  cp content/ko/_drafts/pack.json "$STAGED/content/courses/ko-vi.json"
fi
bun scripts/course-draft.ts syllabus --target ko
python -I "$G/ko-lex.py" . split
