/**
 * Developer-side derivation of a CJK candidate pool's readings (P4b stage 4):
 * content/<lang>/lexicon/derived/lexeme-readings.json from the pool, its
 * existing derived readings and the pinned source of
 * content/<lang>/lexicon/readings-manifest.json. NEVER run by CI — CI
 * validates the committed file offline. Fail-closed: a source must hash to
 * its pinned sha256 and size before anything is parsed.
 *
 *   bash scripts/cjk-readings-source.sh <ja|zh|ko>       fetch (scripts/ci/fetch.sh) + derive
 *   bun scripts/cjk-readings.ts derive --lang ja --source <JmdictFurigana.json> [--check]
 *   bun scripts/cjk-readings.ts derive --lang zh --source <cedict_1_0_ts_utf-8_mdbg.txt.gz> [--check]
 *   bun scripts/cjk-readings.ts derive --lang ko [--check]          (rules only, no source)
 */
import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";

import { deriveChinese, deriveJapanese, deriveKorean, indexJmdictFurigana, type DerivedReadings, type JmdictFuriganaEntry } from "./lib/cjk-readings/derive";
import { parseCedict } from "./lib/cjk-readings/pinyin";
import { lexemeReadingsRel, loadPoolEntries, loadPoolReadings, loadReadingsManifest, renderLexemeReadings } from "./lib/cjk-readings/pool";
import { safeResolve } from "./lib/pipeline";

function fail(message: string): never {
  console.error(`ERROR ${message}`);
  process.exit(1);
}

const [, , command, ...rest] = process.argv;
const flag = (name: string) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
};
const lang = flag("--lang");
const sourcePath = flag("--source");
const checkOnly = rest.includes("--check");
if (command !== "derive" || lang === undefined || !["ja", "zh", "ko"].includes(lang)) fail("usage: cjk-readings.ts derive --lang <ja|zh|ko> [--source <file>] [--check]");

const manifest = loadReadingsManifest(lang);
if (manifest.sources.length > 1) fail(`${lang}: one pinned source per language is supported, the manifest lists ${manifest.sources.length}`);
const pinned = manifest.sources[0];
let bytes: Buffer | undefined;
if (pinned) {
  if (sourcePath === undefined) fail(`${lang}: --source <${pinned.url.split("/").pop()}> is required`);
  bytes = readFileSync(sourcePath);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== pinned.sha256 || bytes.length !== pinned.bytes) {
    fail(`${sourcePath}: sha256 ${sha256} (${bytes.length} bytes) — the manifest pins ${pinned.sha256} (${pinned.bytes} bytes). Source-version drift; nothing derived.`);
  }
}

const pool = loadPoolEntries(lang);
const existing = loadPoolReadings(lang);
const lemmas = new Set(pool.map((e) => e.lemma));
let derived: DerivedReadings;
if (lang === "ja") {
  const entries = JSON.parse(bytes!.toString("utf8").replace(/^﻿/, "")) as JmdictFuriganaEntry[];
  derived = deriveJapanese(pool, existing.readings, indexJmdictFurigana(entries, lemmas));
} else if (lang === "zh") {
  const text = Buffer.from(Bun.gunzipSync(new Uint8Array(bytes!))).toString("utf8");
  derived = deriveChinese(pool, existing.readings, parseCedict(text, lemmas));
} else {
  derived = deriveKorean(pool, existing.readings);
}

const text = renderLexemeReadings(lang, manifest, pool, derived, existing.sources.filter((s) => s.id === "kaikki-en" || s.id === "jmdict" || s.id === "cedict"));
const rel = lexemeReadingsRel(lang);
const target = safeResolve(rel);
const current = existsSync(target) ? readFileSync(target, "utf8") : undefined;
const confirmed = Object.keys(derived.readings).length;
const summary = `${confirmed}/${pool.length} confirmed, ${pool.length - confirmed} unresolved, ${Buffer.byteLength(text)} bytes`;
if (checkOnly) {
  if (current !== text) fail(`${rel} differs from a fresh derivation — re-run without --check`);
  console.log(`${rel} is up to date (${summary})`);
} else {
  writeFileSync(target, text);
  console.log(`wrote ${rel}: ${summary}`);
}
