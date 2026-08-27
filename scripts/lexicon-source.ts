/**
 * Developer-side Lexique 4 artifact verification. NEVER run by CI (CI
 * validates committed data only, fully offline). Fail-closed:
 *
 *   verify --artifact <path>   sha256 the local artifact and compare with
 *                              the pinned manifest hash. A mismatch against
 *                              a pinned hash is source-version drift and
 *                              exits non-zero; when no hash is pinned yet it
 *                              prints the hash for deliberate pinning.
 *
 * Derivation lives in scripts/lexique-derive.ts (one pass, runner-side),
 * which re-checks these same gates before parsing anything.
 */
import { createHash } from "crypto";
import { readFileSync } from "fs";

import { loadSourceManifest } from "./lib/lexicon";

function fail(message: string): never {
  console.error(`ERROR ${message}`);
  process.exit(1);
}

const [, , command, ...rest] = process.argv;
const artifactFlag = rest.indexOf("--artifact");
const artifactPath = artifactFlag >= 0 ? rest[artifactFlag + 1] : undefined;

if (command !== "verify") {
  fail("usage: lexicon-source.ts verify --artifact <path> (derivation: scripts/lexique-derive.ts)");
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

console.log(`artifact: ${artifactPath}`);
console.log(`sha256:   ${sha256}`);
if (manifest.retrieval.sha256 === null) {
  console.log(
    'manifest has no pinned hash yet — record this sha256 (with filename, url, retrievedAt and status "retrieved") in content/fr/lexicon/source-manifest.json after confirming the download came from an official location.'
  );
} else if (manifest.retrieval.sha256 === sha256) {
  console.log("MATCH: artifact hash equals the pinned manifest hash");
} else {
  fail(
    `hash mismatch — pinned ${manifest.retrieval.sha256}, artifact ${sha256}. This is source-version drift; do not derive from an unverified artifact.`
  );
}
