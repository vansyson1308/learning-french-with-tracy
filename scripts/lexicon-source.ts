/**
 * Developer-side Lexique 4 source tooling. NEVER run by CI (CI validates
 * committed data only, fully offline). Fail-closed at every step:
 *
 *   verify  --artifact <path>   sha256 the local artifact and compare with
 *                               the pinned manifest hash (prints the hash
 *                               for pinning when none is recorded yet).
 *   extract --artifact <path>   requires manifest status "retrieved" with a
 *                               matching sha256 and a confirmed column
 *                               layout; parses, runs the deterministic
 *                               matcher, writes the derived subset and the
 *                               authoring-only candidate pool under
 *                               content/fr/lexicon/derived/, and prints the
 *                               source-match audit summary. Merging matched
 *                               metadata into lexemes.json remains a
 *                               deliberate, reviewed content change.
 */
import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import {
  loadRichLexicon,
  loadSourceManifest,
  matchLexemes,
  parseLexiqueTsv,
  selectCandidatePool,
} from "./lib/lexicon";
import { canonicalJson, safeResolve } from "./lib/pipeline";

function fail(message: string): never {
  console.error(`ERROR ${message}`);
  process.exit(1);
}

const [, , command, ...rest] = process.argv;
const artifactFlag = rest.indexOf("--artifact");
const artifactPath = artifactFlag >= 0 ? rest[artifactFlag + 1] : undefined;

if (command !== "verify" && command !== "extract") {
  fail("usage: lexicon-source.ts <verify|extract> --artifact <path>");
}
if (!artifactPath) fail("--artifact <path> is required (the locally downloaded official Lexique 4 export)");

let bytes: Buffer;
try {
  bytes = readFileSync(artifactPath);
} catch {
  fail(`cannot read artifact at ${artifactPath}`);
}
const sha256 = createHash("sha256").update(bytes).digest("hex");
const manifest = loadSourceManifest();

if (command === "verify") {
  console.log(`artifact: ${artifactPath}`);
  console.log(`sha256:   ${sha256}`);
  if (manifest.retrieval.sha256 === null) {
    console.log(
      'manifest has no pinned hash yet — record this sha256 (with filename, url, retrievedAt and status "retrieved") in content/fr/lexicon/source-manifest.json after confirming the download came from an official location.'
    );
  } else if (manifest.retrieval.sha256 === sha256) {
    console.log("MATCH: artifact hash equals the pinned manifest hash");
  } else {
    fail(`hash mismatch — pinned ${manifest.retrieval.sha256}, artifact ${sha256}. Do not extract from an unverified artifact.`);
  }
  process.exit(0);
}

// extract — every gate must hold.
if (manifest.retrieval.status !== "retrieved") {
  fail('manifest retrieval.status is "not-retrieved" — pin the artifact via `verify` and update the manifest first (fail-closed)');
}
if (manifest.retrieval.sha256 !== sha256) {
  fail(`artifact hash ${sha256} does not match the pinned ${manifest.retrieval.sha256} (fail-closed)`);
}
if (manifest.expectedColumns.toConfirm) {
  fail("expectedColumns.toConfirm is still true — confirm the real Lexique 4 column layout against the official documentation and update the manifest");
}

const rows = parseLexiqueTsv(bytes.toString("utf8"), manifest.expectedColumns.names);
console.log(`parsed ${rows.length} source rows`);

const audit = matchLexemes(loadRichLexicon(), rows);
const counts: Record<string, number> = {};
for (const row of audit) counts[row.status] = (counts[row.status] ?? 0) + 1;
console.log(`source-match audit: ${JSON.stringify(counts)}`);
for (const row of audit) {
  if (row.status === "ambiguous" || row.status === "unmatched") {
    console.log(`  ${row.status.toUpperCase()} ${row.id} (${row.lookupForm}, ${row.partOfSpeech}, ${row.candidateCount} candidates) — resolve by lemma/POS/gender/meaning or leave metadata absent; never pick by frequency`);
  }
}

const derivedDir = safeResolve("content/fr/lexicon/derived");
mkdirSync(derivedDir, { recursive: true });
const subset = audit
  .filter((r) => r.status === "matched")
  .map((r) => {
    const source = rows.find((row) => `${row.ortho}|${row.cgram}` === r.matchKey);
    return { id: r.id, matchKey: r.matchKey, row: source };
  });
writeFileSync(path.join(derivedDir, "lexique-subset.json"), canonicalJson({ sha256, entries: subset }));
writeFileSync(
  path.join(derivedDir, "candidate-pool.json"),
  canonicalJson({ sha256, criteria: "see selectCandidatePool in scripts/lib/lexicon.ts", entries: selectCandidatePool(rows) })
);
console.log("wrote content/fr/lexicon/derived/{lexique-subset,candidate-pool}.json");
console.log("next: review the audit, then merge matched metadata into content/fr/lexicon/lexemes.json as a deliberate content change (lexique-4 sourceRefs, phonology-labeled pronunciation unless a verified IPA conversion is documented, real frequency values).");
