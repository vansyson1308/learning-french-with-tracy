#!/usr/bin/env bash
# Developer-side: fetch the pinned reading source of one CJK language
# (content/<lang>/lexicon/readings-manifest.json) with the repository's
# bounded downloader and derive content/<lang>/lexicon/derived/lexeme-readings.json.
# Never run by CI (CI validates the committed derived file offline). The
# download lands in a fresh temporary directory and is deleted afterwards;
# it is never committed. ko has no source (rules only).
#
# Usage: bash scripts/cjk-readings-source.sh <ja|zh|ko> [--check]
set -euo pipefail

cd "$(dirname "$0")/.."
lang="${1:?usage: cjk-readings-source.sh <ja|zh|ko> [--check]}"
shift
url=$(bun -e 'const m=JSON.parse(require("fs").readFileSync(`content/${process.argv[1]}/lexicon/readings-manifest.json`,"utf8")); console.log(m.sources[0]?.url ?? "")' "$lang")
if [ -z "$url" ]; then
  bun scripts/cjk-readings.ts derive --lang "$lang" "$@"
  exit 0
fi
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
file="$work/$(basename "${url%%\?*}")"
bash scripts/ci/fetch.sh "$url" "$file"
bun scripts/cjk-readings.ts derive --lang "$lang" --source "$file" "$@"
