/**
 * 54-core cross-check CLI (Phase 5A §13–15). Fully offline: consumes the
 * committed derived subset (produced runner-side by lexique-derive.ts) plus
 * the authored rich lexicon, writes the per-item field-by-field report to
 * content/fr/lexicon/derived/core-crosscheck.json and prints the
 * manual-investigation queue. Never mutates authored data.
 */
import { writeFileSync } from "fs";

import { loadRichLexicon, loadSourceManifest } from "./lib/lexicon";
import { crossCheckCore } from "./lib/lexicon-crosscheck";
import type { CoreLexemeRows } from "./lib/lexique-derive-lib";
import { canonicalJson, readJson, safeResolve } from "./lib/pipeline";

const manifest = loadSourceManifest();
if (manifest.retrieval.status !== "retrieved") {
  console.error("ERROR the source manifest is not retrieved — nothing to cross-check (fail-closed)");
  process.exit(1);
}

const subset = readJson("content/fr/lexicon/derived/lexique-subset.json") as {
  source?: { sha256?: string };
  audit?: CoreLexemeRows["audit"];
  entries?: CoreLexemeRows["entries"];
};
if (!subset.audit || !subset.entries) {
  console.error("ERROR derived/lexique-subset.json is missing audit/entries — re-run the derive step");
  process.exit(1);
}
if (subset.source?.sha256 !== manifest.retrieval.sha256) {
  console.error(
    `ERROR derived subset was produced from sha ${subset.source?.sha256} but the manifest pins ${manifest.retrieval.sha256} — stale derived data (fail-closed)`
  );
  process.exit(1);
}

const lexicon = loadRichLexicon();
const report = crossCheckCore(lexicon, { audit: subset.audit, entries: subset.entries });

const out = safeResolve("content/fr/lexicon/derived/core-crosscheck.json");
writeFileSync(
  out,
  canonicalJson({
    source: subset.source,
    generator: "scripts/lexicon-crosscheck.ts",
    ...report,
  })
);
console.log("wrote content/fr/lexicon/derived/core-crosscheck.json");
console.log(`items: ${JSON.stringify(report.summary.items)}`);
console.log(`fields: ${JSON.stringify(report.summary.fields)}`);

const attention = report.items.filter((i) => i.overall === "attention");
if (attention.length === 0) {
  console.log("manual-investigation queue is empty");
} else {
  console.log(`\nMANUAL-INVESTIGATION QUEUE (${attention.length}):`);
  for (const item of attention) {
    console.log(`  ${item.id} (${item.lookupForm}) — match ${item.matchStatus}`);
    for (const f of item.fields) {
      if (f.status === "disagree" || f.status === "ambiguous" || (f.field === "lookup" && f.status === "external-missing")) {
        console.log(`    ${f.field}: ${f.status} — authored ${JSON.stringify(f.authored)} vs external ${JSON.stringify(f.external)}${f.note ? ` (${f.note})` : ""}`);
      }
    }
  }
  console.log("\nEach item above needs a deliberate, documented disposition (REVIEW.md) — never a silent edit.");
}
