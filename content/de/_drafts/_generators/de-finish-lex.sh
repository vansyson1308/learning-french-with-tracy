#!/usr/bin/env bash
# Apply the review + lexicon-add on top of a fresh lexicon-author run, then compile + validate.
set -euo pipefail
S="C:/Users/MSI/AppData/Local/Temp/claude/C--Users-MSI-Documents-app-hoc-ngoai-ngu/82ea6b33-e22d-4a2d-907b-9b4441f9e202/scratchpad"
export PATH="$HOME/.bun/bin:$PATH"
cd /c/src/lft
if [ ! -f "$S/de-lexicon-add-all.jsonl" ]; then cp content/de/_drafts/lexicon-add/OUTPUT.jsonl "$S/de-lexicon-add-all.jsonl"; fi
python -I "$S/de-review-core.py" "$S/de-review-core.jsonl"
cat "$S/de-carried.jsonl" "$S/de-review-core.jsonl" > content/de/_drafts/lexicon-review/OUTPUT.jsonl
echo "review records: $(wc -l < content/de/_drafts/lexicon-review/OUTPUT.jsonl)"
bun scripts/author.ts ingest lexicon-review --target de --native vi | tail -1
cp content/de/_drafts/staged/content/de/lexicon/lexemes.json content/de/lexicon/lexemes.json
rm content/de/_drafts/staged/content/de/lexicon/lexemes.json
python -I "$S/filter-add.py"
bun scripts/author.ts ingest lexicon-add --target de --native vi | tail -1
cp content/de/_drafts/staged/content/de/lexicon/lexemes.json content/de/lexicon/lexemes.json
cp content/de/_drafts/staged/content/de/lexemes.json content/de/lexemes.json
rm -r content/de/_drafts/staged/content/de/lexicon content/de/_drafts/staged/content/de/lexemes.json
bun run content:compile > "$S/compile.log" 2>&1 || { tail -8 "$S/compile.log"; exit 1; }
bun run content:validate 2>&1 | tail -4
