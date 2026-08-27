/**
 * Lexique 4 reconnaissance (Phase 5A, runner-side, developer-dispatched).
 * First contact with the OFFICIAL artifact: records identity (bytes,
 * SHA-256), the REAL header, a per-column profile and a few sample rows so
 * the column mapping can be written deliberately from evidence instead of
 * assumed from Lexique-3 lore. Never extracts learner-facing data — that
 * is the extract mode's job, gated on the pinned manifest.
 */
import { createHash } from "crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "fs";

import { canonicalJson, safeResolve } from "./lib/pipeline";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const artifactPath = arg("artifact");
const url = arg("url") ?? "https://www.lexique.org/databases/Lexique400/Lexique400.tsv";
if (!artifactPath) {
  console.error("usage: lexique-recon.ts --artifact <path> [--url <official-url>]");
  process.exit(1);
}

const bytes = statSync(artifactPath).size;
const buffer = readFileSync(artifactPath);
const sha256 = createHash("sha256").update(buffer).digest("hex");
const bomHex = buffer.subarray(0, 3).toString("hex");

const text = buffer.toString("utf8");
const lines = text.split(/\r?\n/);
while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
const header = lines[0].replace(/^﻿/, "").split("\t");
const dataRows = lines.length - 1;

const PROFILE_SAMPLE = 5000;
const sample = lines.slice(1, 1 + PROFILE_SAMPLE).map((l) => l.split("\t"));
const replacementCharsInSample = sample
  .slice(0, 500)
  .reduce((n, row) => n + row.join("\t").split("�").length - 1, 0);

const columnProfile = header.map((name, idx) => {
  const values = sample.map((row) => row[idx] ?? "");
  const nonEmpty = values.filter((v) => v !== "");
  const distinct = new Set(nonEmpty);
  const samples: string[] = [];
  for (const v of distinct) {
    samples.push(v.length > 40 ? `${v.slice(0, 40)}…` : v);
    if (samples.length >= 6) break;
  }
  return {
    index: idx,
    name,
    emptyPct: Number(((100 * (values.length - nonEmpty.length)) / values.length).toFixed(1)),
    distinctInSample: distinct.size,
    samples,
  };
});

const report = {
  source: {
    url,
    filename: "Lexique400.tsv",
    retrievedAt: new Date().toISOString().slice(0, 10),
  },
  bytes,
  sha256,
  encodingProbe: { bomHex, replacementCharsInSample },
  columnCount: header.length,
  dataRows,
  header,
  profileSampleSize: sample.length,
  sampleRows: sample.slice(0, 3),
  columnProfile,
};

mkdirSync(safeResolve("content/fr/lexicon/derived"), { recursive: true });
const out = safeResolve("content/fr/lexicon/derived/lexique4-recon.json");
writeFileSync(out, canonicalJson(report));
console.log(`recon written: ${out}`);
console.log(`bytes=${bytes} sha256=${sha256} rows=${dataRows} cols=${header.length}`);
console.log(`header: ${header.join(" | ")}`);
