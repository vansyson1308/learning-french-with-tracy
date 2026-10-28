#!/usr/bin/env bash
# Re-author the German lexicon from the committed pool and re-apply the review.
set -euo pipefail
S="C:/Users/MSI/AppData/Local/Temp/claude/C--Users-MSI-Documents-app-hoc-ngoai-ngu/82ea6b33-e22d-4a2d-907b-9b4441f9e202/scratchpad"
export PATH="$HOME/.bun/bin:$PATH"
cd /c/src/lft
cp "$S/de-lexemes-reviewed-old.json" content/de/lexicon/lexemes.json
PYTHONIOENCODING=utf-8 python -I "$S/restore-frozen.py" "$S/de-frozen-reviewed.json" .
bun scripts/lexicon-author.ts --lang de --size 960 | tail -1
bun scripts/author.ts ingest lexicon-review --target de --native vi | tail -1
cp content/de/_drafts/staged/content/de/lexicon/lexemes.json content/de/lexicon/lexemes.json
rm content/de/_drafts/staged/content/de/lexicon/lexemes.json
bun scripts/author.ts ingest lexicon-add --target de --native vi | tail -1
cp content/de/_drafts/staged/content/de/lexicon/lexemes.json content/de/lexicon/lexemes.json
cp content/de/_drafts/staged/content/de/lexemes.json content/de/lexemes.json
rm -r content/de/_drafts/staged/content/de/lexicon content/de/_drafts/staged/content/de/lexemes.json
bun run content:compile > "$S/compile.log" 2>&1 || { tail -20 "$S/compile.log"; exit 1; }
bun run content:validate 2>&1 | grep -E "ERROR|error\(s\)|valid" | head -30 || true
