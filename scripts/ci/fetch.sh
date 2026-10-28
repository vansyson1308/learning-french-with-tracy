#!/usr/bin/env bash
# Bounded download: the only way a workflow fetches a file from the network.
#
# 2026-10-28: the German lexicon ETL sat 2 h 49 min in one download
# (downloads.tatoeba.org trickled bytes, so the "no data for 120 s" guard never
# fired). Every transfer now aborts when it stays under 50 kB/s for 2 min,
# retries 5 times resuming the partial file, and prints a progress line every
# 30 s so a slow transfer is visible in the log. The calling step carries a
# `timeout-minutes` as the last bound (scripts/__tests__/workflow-hygiene.test.ts).
#
# Usage: scripts/ci/fetch.sh <url> <out>
#   FETCH_SPEED_LIMIT (bytes/s, default 50000) lowers the floor for a host
#   that is known to be slow but steady.
set -euo pipefail

url="${1:?usage: fetch.sh <url> <out>}"
out="${2:?usage: fetch.sh <url> <out>}"
mkdir -p "$(dirname "$out")"
part="$out.part"
start=$SECONDS

(
  while sleep 30; do
    printf 'fetch: %s — %s bytes after %ss\n' "$url" "$(stat -c %s "$part" 2>/dev/null || echo 0)" "$((SECONDS - start))"
  done
) &
ticker=$!
# The ticker's pending `sleep` goes too, so no orphan holds the step's output open.
trap 'pkill -P "$ticker" 2>/dev/null; kill "$ticker" 2>/dev/null || true' EXIT

curl --fail --location --silent --show-error \
  --retry 5 --retry-all-errors --retry-delay 10 \
  --connect-timeout 20 \
  --speed-limit "${FETCH_SPEED_LIMIT:-50000}" --speed-time 120 \
  -C - -o "$part" "$url"
mv -f "$part" "$out"
echo "fetch: $url → $out ($(stat -c %s "$out") bytes, $((SECONDS - start)) s)"
