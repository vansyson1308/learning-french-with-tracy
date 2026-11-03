#!/usr/bin/env bash
# Developer-side: fetch the pinned Unihan release (content/hanviet/source-manifest.json)
# with the repository's bounded downloader and derive content/hanviet/unihan-readings.json.
# Never run by CI (CI validates the committed derived file offline). The zip lands
# in a fresh temporary directory and is deleted afterwards; it is never committed.
#
# Usage: bash scripts/hanviet-source.sh [--check]
set -euo pipefail

cd "$(dirname "$0")/.."
url=$(bun -e 'console.log(JSON.parse(require("fs").readFileSync("content/hanviet/source-manifest.json","utf8")).source.url)')
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
bash scripts/ci/fetch.sh "$url" "$work/Unihan.zip"
bun scripts/hanviet-unihan.ts derive --zip "$work/Unihan.zip" "$@"
