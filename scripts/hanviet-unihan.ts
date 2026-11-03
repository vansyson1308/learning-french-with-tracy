/**
 * Developer-side derivation of content/hanviet/unihan-readings.json from the
 * pinned Unihan release (content/hanviet/source-manifest.json). NEVER run by
 * CI — CI validates the committed derived file offline. Fail-closed: the zip
 * must hash to the pinned sha256 and size before anything is parsed.
 *
 *   bash scripts/hanviet-source.sh               fetch (scripts/ci/fetch.sh) + derive
 *   bun scripts/hanviet-unihan.ts derive --zip <Unihan.zip> [--check]
 *
 * Characters kept: every Han character of the ja/zh candidate-pool lemmas
 * (the vocabulary later courses author from) and of the Hán-Việt tables,
 * plus their one-hop variants. Re-run after adding a table word whose
 * character the validator reports as missing.
 */
import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";

import { HANVIET_LANGS, hanSourceOf, hanVietTableRel, type HanVietEntry } from "./lib/hanviet";
import {
  buildVariantGraph,
  deriveUnihanReadings,
  jinmeiyoLinks,
  hanChars,
  parseUnihanText,
  renderUnihanReadings,
  UNIHAN_MANIFEST_REL,
  UNIHAN_READING_FIELDS,
  UNIHAN_READINGS_REL,
  UNIHAN_VARIANT_FIELDS,
  UnihanManifestSchema,
} from "./lib/hanviet-unihan";
import { readJson, safeResolve } from "./lib/pipeline";

function fail(message: string): never {
  console.error(`ERROR ${message}`);
  process.exit(1);
}

const [, , command, ...rest] = process.argv;
const zipFlag = rest.indexOf("--zip");
const zipPath = zipFlag >= 0 ? rest[zipFlag + 1] : undefined;
const checkOnly = rest.includes("--check");
if (command !== "derive" || zipPath === undefined) fail("usage: hanviet-unihan.ts derive --zip <Unihan.zip> [--check]");

const manifest = UnihanManifestSchema.parse(readJson(UNIHAN_MANIFEST_REL));
const bytes = readFileSync(zipPath);
const sha256 = createHash("sha256").update(bytes).digest("hex");
if (sha256 !== manifest.source.sha256 || bytes.length !== manifest.source.bytes) {
  fail(`${zipPath}: sha256 ${sha256} (${bytes.length} bytes) — the manifest pins ${manifest.source.sha256} (${manifest.source.bytes} bytes). Source-version drift; nothing derived.`);
}

function unzipMember(member: string): string {
  const proc = Bun.spawnSync(["unzip", "-p", zipPath!, member], { stdout: "pipe", stderr: "pipe" });
  if (proc.exitCode !== 0) fail(`unzip ${member}: ${proc.stderr.toString()}`);
  return proc.stdout.toString();
}

const readings = parseUnihanText(unzipMember("Unihan_Readings.txt"), new Set(UNIHAN_READING_FIELDS));
const variants = parseUnihanText(unzipMember("Unihan_Variants.txt"), new Set(UNIHAN_VARIANT_FIELDS));
const graph = buildVariantGraph(variants, jinmeiyoLinks(parseUnihanText(unzipMember("Unihan_OtherMappings.txt"), new Set(["kJinmeiyoKanji"]))));

const chars = new Set<string>();
for (const lang of ["ja", "zh"]) {
  const pool = readJson(`content/${lang}/lexicon/derived/candidate-pool.json`) as { entries: { lemma: string }[] };
  for (const e of pool.entries) for (const c of hanChars(e.lemma)) chars.add(c);
}
for (const lang of HANVIET_LANGS) {
  const rel = hanVietTableRel(lang);
  if (!existsSync(safeResolve(rel))) continue;
  for (const e of (readJson(rel) as { entries: HanVietEntry[] }).entries) for (const c of hanChars(hanSourceOf(lang, e))) chars.add(c);
}

const text = renderUnihanReadings(deriveUnihanReadings({ readings, graph, chars, manifest }));
const target = safeResolve(UNIHAN_READINGS_REL);
const current = existsSync(target) ? readFileSync(target, "utf8") : undefined;
const count = (text.match(/^ {4}"/gm) ?? []).length;
if (checkOnly) {
  if (current !== text) fail(`${UNIHAN_READINGS_REL} differs from a fresh derivation — re-run without --check`);
  console.log(`${UNIHAN_READINGS_REL} is up to date (${count} characters, ${text.length} chars of JSON)`);
} else {
  writeFileSync(target, text);
  console.log(`wrote ${UNIHAN_READINGS_REL}: ${count} characters, ${Buffer.byteLength(text)} bytes`);
}
