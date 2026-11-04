#!/usr/bin/env bash
# zh-vi, sessions 1-4 of P4d (lexicon, objectives, units; concept cards and lessons; the tone primer, reception,
# speech, writing and scenarios; checkpoints, placement and the HSK 1-2 tracks): regenerate the drafts and ingest
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
# The tone and pinyin primer (session 3) is language-level content like the lexicon: written to content/zh/primer/
# directly (its compiled copy and review sheet come from scripts/lib/script-primer.ts at compile time).
python -I "$G/zh-primer.py" .
# Full replacement, so a record the generators dropped does not linger. The draft pack is rebuilt from the units.
rm -f "$STAGED/content/zh/assessment/objectives.json" "$STAGED/content/courses/zh-vi.json" content/zh/_drafts/pack.json
rm -f "$STAGED/content/zh/pedagogy/concepts.json"
python -I "$G/zh-objectives.py" .
python -I "$G/zh-units.py" .
python -I "$G/zh-concepts.py" .
ingest objectives
ingest units
ingest concepts
# Reception, speech, writing, scenarios (session 3). s3 starts listening/OUTPUT.jsonl; s4 and s6 append their clips
# (speech models, partner turns); s6 also checks zh_lesson_refs.py. The ingest takes the voice cast from
# content/audio/voice-casts.json (zh: still pending its canary).
rm -f "$STAGED/content/zh/reception/reading.json" "$STAGED/content/zh/reception/listening.json" "$STAGED/content/zh/speech/items.json" "$STAGED/content/zh/writing/tasks.json" "$STAGED/content/zh/interaction/scenarios.json"
python -I "$G/zh-reception-s3.py" .
python -I "$G/zh-speech-s4.py" .
python -I "$G/zh-writing-s5.py" .
python -I "$G/zh-scenarios-s6.py" .
# Session 4: checkpoints and placement point at the reserved records above and write their own OUTPUT; the HSK 1 and
# HSK 2 tracks append their exam stimuli (use: "exam") to listening and readings. Both run before the lessons so that the
# self-check reads their items too.
rm -f "$STAGED/content/zh/assessment/checkpoints.json" "$STAGED/content/zh/assessment/placement.json" "$STAGED"/content/zh/exam/hsk-*.json
python -I "$G/zh-assessment.py" .
python -I "$G/zh-exam.py" .
# Lessons (session 2): each section's generator writes lessons/parts/<section>.jsonl; the self-check joins them into
# lessons/OUTPUT.jsonl and stops on an answer key it finds wrong or ambiguous (review/selfcheck.json). Sections 3-6
# point at the layer records above (zh_lesson_refs.py), so the layers run first.
rm -rf content/zh/_drafts/lessons/parts
for section in s1 s2 s3 s4 s5 s6; do
  if [ -f "$G/zh-lessons-$section.py" ]; then python -I "$G/zh-lessons-$section.py" .; fi
done
python -I "$G/zh-check-answers.py" .
ingest listening
ingest readings
ingest speech
ingest writing
ingest scenarios
ingest lessons
for step in checkpoints placement exam; do
  ingest "$step"
done
if ! python -I -c "import json,sys; p=json.load(open('content/zh/_drafts/pack.json',encoding='utf-8')); sys.exit(0 if all(l['exercises'] for s in p['sections'] for u in s['units'] for l in u['lessons']) else 1)"; then
  mkdir -p "$STAGED/content/courses"
  cp content/zh/_drafts/pack.json "$STAGED/content/courses/zh-vi.json"
fi
bun scripts/course-draft.ts syllabus --target zh
python -I "$G/zh-lex.py" . split
