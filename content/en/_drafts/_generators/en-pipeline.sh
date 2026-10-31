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

python -I "$G/en-lex.py" .
# Full replacement, so a record the generators dropped does not linger. The draft pack is kept: it may hold lessons.
rm -f "$STAGED/content/en/assessment/objectives.json" "$STAGED/content/en/pedagogy/concepts.json" "$STAGED/content/en/pedagogy/paradigms.json" "$STAGED/content/courses/en-vi.json"
rm -f "$STAGED/content/en/reception/reading.json" "$STAGED/content/en/reception/listening.json" "$STAGED/content/en/speech/items.json" "$STAGED/content/en/writing/tasks.json" "$STAGED/content/en/interaction/scenarios.json"
rm -f "$STAGED/content/en/assessment/checkpoints.json" "$STAGED/content/en/assessment/placement.json" "$STAGED/content/en/exam/bac2-qd1481.json"
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
# Reception, speech, writing, scenarios. s3 writes the listening.json head with the voice cast; s4 and s6 append their clips.
python -I "$G/en-reception-s3.py" .
python -I "$G/en-speech-s4.py" .
python -I "$G/en-writing-s5.py" .
python -I "$G/en-scenarios-s6.py" .
# Checkpoints and placement use the reserved items above and write their own OUTPUT; the exam track appends its stimuli.
python -I "$G/en-assessment.py" .
python -I "$G/en-exam.py" .
bun scripts/author.ts ingest listening --target en --native vi
bun scripts/author.ts ingest readings --target en --native vi
bun scripts/author.ts ingest speech --target en --native vi
bun scripts/author.ts ingest writing --target en --native vi
bun scripts/author.ts ingest scenarios --target en --native vi
# Lessons: s1 starts lessons/OUTPUT.jsonl, s2 and s3 append. The ingest writes the staged course, which now loads, so its exit
# status also counts what later steps still owe (audio): en-draft.ts validate reports those.
# Only a record that failed the schema stops the pipeline here. The same holds for the assessment steps after it.
python -I "$G/en-lessons-s1.py" .
python -I "$G/en-lessons-s2.py" .
python -I "$G/en-lessons-s3.py" .
bun scripts/author.ts ingest lessons --target en --native vi || true
grep -q "failed: 0 ·" content/en/_drafts/lessons/REPORT.md
for step in checkpoints placement exam; do
  bun scripts/author.ts ingest "$step" --target en --native vi || true
  grep -q "failed: 0 ·" "content/en/_drafts/$step/REPORT.md"
done
