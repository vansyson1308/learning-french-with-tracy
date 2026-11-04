#!/usr/bin/env bash
# ko-vi, P4e session 1 (lexicon, objectives, units, syllabus): regenerate the drafts and ingest them through the toolkit.
# Byte-deterministic: run it twice, the outputs are identical. Offline: the Unihan subset with the ko-vi hanja was
# re-derived once from the pinned Unihan 17.0.0 zip (bun scripts/hanviet-unihan.ts derive) into the staged
# content/hanviet/unihan-readings.json; it is an input here, not a step.
# EVERYTHING lands in the staged layer (content/ko/_drafts/staged/) until `author.ts promote`, the lexicon and the
# Hán-Việt table included, so src/content, the goldens and `content:validate` stay untouched while the course is built;
# `bun scripts/course-draft.ts validate --target ko` checks the course with the staged layer overlaid.
# Run from anywhere: bash content/ko/_drafts/_generators/ko-pipeline.sh
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
cd "$(dirname "$0")/../../../.."
G=content/ko/_drafts/_generators
STAGED=content/ko/_drafts/staged

# A step stops the pipeline only for a record that failed the schema; validator errors are expected while layers are
# missing (lessons, reception, speech, ...): course-draft.ts validate --target ko reports them.
ingest() {
  local dir=$1 step=${2:-$1}
  bun scripts/author.ts ingest "$step" --target ko --native vi > /dev/null || true
  grep -q "failed: 0 ·" "content/ko/_drafts/$dir/REPORT.md"
}

python -I "$G/ko-lex.py" .
# Full replacement, so a record the generators dropped does not linger. The draft pack is rebuilt from the units.
rm -f "$STAGED/content/ko/assessment/objectives.json" "$STAGED/content/courses/ko-vi.json" content/ko/_drafts/pack.json
python -I "$G/ko-objectives.py" .
python -I "$G/ko-units.py" .
ingest objectives
ingest units
# QC 2026-11-05 §2.1: ko-vi bundles no audio; its listening is graded through the device voice (profile flag
# deviceVoiceScoredListening, written by ko-units.py). The pack records the policy and its reason.
python -I "$G/ko-pack-audio.py" .
# Until every lesson has exercises the course pack is the draft pack (lessons ingest writes it from then on).
mkdir -p "$STAGED/content/courses"
cp content/ko/_drafts/pack.json "$STAGED/content/courses/ko-vi.json"
bun scripts/course-draft.ts syllabus --target ko
python -I "$G/ko-lex.py" . split
