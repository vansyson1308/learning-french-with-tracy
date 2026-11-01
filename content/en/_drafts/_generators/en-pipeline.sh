#!/usr/bin/env bash
# en-vi steps 1-7: regenerate the drafts and ingest them through the toolkit. Byte-deterministic.
# Everything lands in the staged layer (content/en/_drafts/staged/) until `author.ts promote`; the draft pack is
# content/en/_drafts/pack.json. While it has no lessons a copy of it is the staged content/courses/en-vi.json skeleton; the
# lessons step at the end writes the real one. Run from anywhere: bash content/en/_drafts/_generators/en-pipeline.sh
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
cd "$(dirname "$0")/../../../.."
G=content/en/_drafts/_generators
STAGED=content/en/_drafts/staged

# A step stops the pipeline only for a record that failed the schema. Validator errors may be transient here: a lexicon change
# reaches the layers that use it in the steps after it, and en-gates-draft.ts and author.ts validate judge the end result.
ingest() {
  local dir=$1 step=${2:-$1}
  bun scripts/author.ts ingest "$step" --target en --native vi || true
  grep -q "failed: 0 ·" "content/en/_drafts/$dir/REPORT.md"
}

python -I "$G/en-lex.py" .
# Full replacement, so a record the generators dropped does not linger. The draft pack is kept: it may hold lessons.
rm -f "$STAGED/content/en/assessment/objectives.json" "$STAGED/content/en/pedagogy/concepts.json" "$STAGED/content/en/pedagogy/paradigms.json" "$STAGED/content/courses/en-vi.json"
rm -f "$STAGED/content/en/reception/reading.json" "$STAGED/content/en/reception/listening.json" "$STAGED/content/en/speech/items.json" "$STAGED/content/en/writing/tasks.json" "$STAGED/content/en/interaction/scenarios.json"
rm -f "$STAGED/content/en/assessment/checkpoints.json" "$STAGED/content/en/assessment/placement.json" "$STAGED/content/en/exam/bac2-qd1481.json"
python -I "$G/en-objectives.py" .
python -I "$G/en-units.py" .
python -I "$G/en-concepts.py" .
ingest objectives
ingest units
ingest concepts
if ! python -I -c "import json,sys; p=json.load(open('content/en/_drafts/pack.json',encoding='utf-8')); sys.exit(0 if all(l['exercises'] for s in p['sections'] for u in s['units'] for l in u['lessons']) else 1)"; then
  mkdir -p "$STAGED/content/courses"
  cp content/en/_drafts/pack.json "$STAGED/content/courses/en-vi.json"
fi
bun scripts/en-draft.ts syllabus
python -I "$G/en-lex.py" . split
# Stories first: s3 takes the band-1 audio list from their reading order. Their ingest comes after the lessons, which set bands A1-0.
rm -rf content/en/_drafts/stories/batches
for story_batch in "$G"/en-stories-[0-9]*.py; do python -I "$story_batch" .; done
# Reception, speech, writing, scenarios. s3 writes the listening.json head with the voice cast; s4 and s6 append their clips.
python -I "$G/en-reception-s3.py" .
python -I "$G/en-speech-s4.py" .
python -I "$G/en-writing-s5.py" .
python -I "$G/en-scenarios-s6.py" .
# Checkpoints and placement use the reserved items above and write their own OUTPUT; the exam track appends its stimuli.
python -I "$G/en-assessment.py" .
python -I "$G/en-exam.py" .
ingest listening
ingest readings
ingest speech
ingest writing
ingest scenarios
# Lessons: s1 starts lessons/OUTPUT.jsonl, s2 and s3 append. The ingest writes the staged course, which now loads, so its exit
# status also counts what later steps still owe (audio): en-draft.ts validate reports those.
# Only a record that failed the schema stops the pipeline here. The same holds for the assessment steps after it.
python -I "$G/en-lessons-s1.py" .
python -I "$G/en-lessons-s2.py" .
python -I "$G/en-lessons-s3.py" .
ingest lessons
for step in checkpoints placement exam; do
  ingest "$step"
done
# The seed writes the head of the staged stories.json afresh: voice cast, function words, shared token map.
python -I "$G/en-stories-seed.py" .
ingest stories
