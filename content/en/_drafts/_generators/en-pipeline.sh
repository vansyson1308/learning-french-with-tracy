#!/usr/bin/env bash
# en-vi steps 1-3 and 5-7: regenerate the drafts and ingest them through the toolkit. Byte-deterministic.
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
rm -f "$STAGED/content/en/reception/reading.json" "$STAGED/content/en/reception/listening.json" "$STAGED/content/en/speech/items.json" "$STAGED/content/en/writing/tasks.json" "$STAGED/content/en/interaction/scenarios.json"
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
bun scripts/author.ts ingest listening --target en --native vi
bun scripts/author.ts ingest readings --target en --native vi
bun scripts/author.ts ingest speech --target en --native vi
bun scripts/author.ts ingest writing --target en --native vi
bun scripts/author.ts ingest scenarios --target en --native vi
