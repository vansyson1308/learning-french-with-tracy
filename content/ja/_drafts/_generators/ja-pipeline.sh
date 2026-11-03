#!/usr/bin/env bash
# ja-vi, sessions 1-4 of P4c (lexicon, objectives, units; concept cards and lessons; primer; reception, speech, writing,
# scenarios): regenerate the drafts and ingest
# them through the toolkit. Byte-deterministic: run it twice, the outputs are identical. Offline: ja-subset.py (the
# one-time slice of the pinned OpenJLPT and JmdictFurigana files) is not part of it; its output
# content/ja/lexicon/derived/jlpt-course.json is.
# Everything except the lexicon (content/ja/lexemes.json, content/ja/lexicon/*, content/hanviet/ja.json) lands in the
# staged layer (content/ja/_drafts/staged/) until `author.ts promote`. Once every lesson has exercises the lessons ingest
# writes the staged content/courses/ja-vi.json; before that a copy of the draft pack is the skeleton.
# Run from anywhere: bash content/ja/_drafts/_generators/ja-pipeline.sh
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
cd "$(dirname "$0")/../../../.."
G=content/ja/_drafts/_generators
STAGED=content/ja/_drafts/staged

# A step stops the pipeline only for a record that failed the schema; validator errors are expected while layers are
# missing (reception, speech, writing, ...): course-draft.ts validate --target ja reports them.
ingest() {
  local dir=$1 step=${2:-$1}
  bun scripts/author.ts ingest "$step" --target ja --native vi > /dev/null || true
  grep -q "failed: 0 ·" "content/ja/_drafts/$dir/REPORT.md"
}

python -I "$G/ja-lex.py" .
# The kana primer (session 3) is language-level content like the lexicon: written to content/ja/primer/ directly.
python -I "$G/ja-primer.py" .
# Full replacement, so a record the generators dropped does not linger. The draft pack is rebuilt from the units.
rm -f "$STAGED/content/ja/assessment/objectives.json" "$STAGED/content/courses/ja-vi.json" content/ja/_drafts/pack.json
rm -f "$STAGED/content/ja/pedagogy/concepts.json" "$STAGED/content/ja/pedagogy/paradigms.json"
python -I "$G/ja-objectives.py" .
python -I "$G/ja-units.py" .
python -I "$G/ja-concepts.py" .
ingest objectives
ingest units
ingest concepts
# Reception, speech, writing, scenarios (session 4). s3 starts listening/OUTPUT.jsonl; s4 and s6 append their clips (speech
# models, partner turns); s6 also checks ja_lesson_refs.py. The ingest takes the voice cast from content/audio/voice-casts.json.
rm -f "$STAGED/content/ja/reception/reading.json" "$STAGED/content/ja/reception/listening.json" "$STAGED/content/ja/speech/items.json" "$STAGED/content/ja/writing/tasks.json" "$STAGED/content/ja/interaction/scenarios.json"
python -I "$G/ja-reception-s3.py" .
python -I "$G/ja-speech-s4.py" .
python -I "$G/ja-writing-s5.py" .
python -I "$G/ja-scenarios-s6.py" .
# Lessons: each section's generator writes lessons/parts/<section>.jsonl; the self-check joins them into
# lessons/OUTPUT.jsonl and stops on an answer key it finds wrong or ambiguous (review/selfcheck.json).
rm -rf content/ja/_drafts/lessons/parts
for section in s1 s2 s3 s4 s5 s6; do
  if [ -f "$G/ja-lessons-$section.py" ]; then python -I "$G/ja-lessons-$section.py" .; fi
done
python -I "$G/ja-check-answers.py" .
ingest listening
ingest readings
ingest speech
ingest writing
ingest scenarios
ingest lessons
if ! python -I -c "import json,sys; p=json.load(open('content/ja/_drafts/pack.json',encoding='utf-8')); sys.exit(0 if all(l['exercises'] for s in p['sections'] for u in s['units'] for l in u['lessons']) else 1)"; then
  mkdir -p "$STAGED/content/courses"
  cp content/ja/_drafts/pack.json "$STAGED/content/courses/ja-vi.json"
fi
bun scripts/course-draft.ts syllabus --target ja
python -I "$G/ja-lex.py" . split
