/**
 * Lexique 4 one-pass derivation (Phase 5A, runner-side, dispatched via
 * .github/workflows/lexique-source.yml extract mode). NEVER run by CI —
 * CI validates the committed outputs offline.
 *
 * Fail-closed gates before any parsing: the source manifest must be
 * "retrieved", the artifact must hash to the pinned SHA-256 (a mismatch is
 * source-version drift), and the column layout must be confirmed. One pass
 * over the artifact then emits every derived dataset Phase 5A/5B needs,
 * because the raw TSV never reaches the offline build environment:
 *
 *   derived/lexique-subset.json       54-core evidence rows + match audit (§13–15)
 *   derived/candidate-pool.json       authoring-only pool + priority report (§21–23)
 *   derived/frequency-stats.json      population quantiles + scale evidence (§17–18)
 *   derived/gender-suffix-stats.json  noun gender × ending aggregates (§51–53)
 *   derived/verb-morphology.json      InfoVER inventory + verb inflection rows (§26, §60–68)
 */
import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import {
  authoredLemmaPosKeys,
  loadRichLexicon,
  loadSourceManifest,
  parseLexiqueTsv,
  selectCandidatePool,
} from "./lib/lexicon";
import {
  coreLexemeRows,
  frequencyStats,
  genderSuffixStats,
  verbMorphology,
} from "./lib/lexique-derive-lib";
import { canonicalJson, safeResolve } from "./lib/pipeline";

/**
 * Verb lemmas whose complete inflection rows are extracted for the Phase 5B
 * High-Yield Verbs unit (frequency/utility-researched shortlist; the unit
 * will teach a subset chosen from the real frequency data) plus every verb
 * already in the 54-core. Curriculum scope stays présent / futur proche /
 * passé composé — the rows carry all moods so distractor design and the
 * §26 sufficiency record work from complete evidence.
 */
const HIGH_YIELD_VERBS = [
  "être", "avoir", "aller", "faire", "dire", "pouvoir", "vouloir", "savoir",
  "devoir", "venir", "voir", "prendre", "mettre", "donner", "parler",
  "aimer", "passer", "croire", "attendre", "comprendre", "connaître",
  "penser", "arriver", "rester", "manger", "boire", "habiter", "travailler",
  "écouter", "regarder", "jouer", "acheter", "finir", "choisir", "dormir",
  "sortir", "partir", "appeler",
] as const;

function fail(message: string): never {
  console.error(`ERROR ${message}`);
  process.exit(1);
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const artifactPath = arg("artifact");
if (!artifactPath) fail("usage: lexique-derive.ts --artifact <path>");

let bytes: Buffer;
try {
  bytes = readFileSync(artifactPath);
} catch {
  fail(`cannot read artifact at ${artifactPath}`);
}
const sha256 = createHash("sha256").update(bytes).digest("hex");
const manifest = loadSourceManifest();

if (manifest.retrieval.status !== "retrieved") {
  fail('manifest retrieval.status is not "retrieved" — pin the artifact first (fail-closed)');
}
if (manifest.retrieval.sha256 !== sha256) {
  fail(
    `artifact hash ${sha256} does not match the pinned ${manifest.retrieval.sha256} — source-version drift, refusing to derive (fail-closed)`
  );
}
if (manifest.expectedColumns.toConfirm) {
  fail("expectedColumns.toConfirm is still true — confirm the real layout first (fail-closed)");
}

const rows = parseLexiqueTsv(bytes.toString("utf8"), manifest.expectedColumns.names);
console.log(`parsed ${rows.length} source rows (${manifest.expectedColumns.names.length} columns)`);

const lexicon = loadRichLexicon();
const source = {
  id: manifest.source.id,
  sha256,
  url: manifest.retrieval.url,
  retrievedAt: manifest.retrieval.retrievedAt,
};
const generator = "scripts/lexique-derive.ts";

const derivedDir = safeResolve("content/fr/lexicon/derived");
mkdirSync(derivedDir, { recursive: true });
const emit = (filename: string, payload: unknown) => {
  writeFileSync(path.join(derivedDir, filename), canonicalJson(payload));
  console.log(`wrote content/fr/lexicon/derived/${filename}`);
};

// 1. 54-core evidence rows + deterministic match audit.
const core = coreLexemeRows(lexicon, rows);
const auditCounts: Record<string, number> = {};
for (const row of core.audit) auditCounts[row.status] = (auditCounts[row.status] ?? 0) + 1;
emit("lexique-subset.json", { source, generator, ...core });
console.log(`match audit: ${JSON.stringify(auditCounts)}`);
for (const row of core.audit) {
  if (row.status === "ambiguous" || row.status === "unmatched") {
    console.log(
      `  ${row.status.toUpperCase()} ${row.id} (${row.lookupForm}, ${row.partOfSpeech}, ${row.candidateCount} candidates)`
    );
  }
}

// 2. Authoring-only candidate pool with the §23 priority-report fields.
const pool = selectCandidatePool(rows, undefined, authoredLemmaPosKeys(lexicon));
emit("candidate-pool.json", {
  source,
  generator,
  criteria: "see selectCandidatePool in scripts/lib/lexicon.ts (documented deterministic selection)",
  entries: pool,
});

// 3. Population frequency statistics (band-derivation evidence).
const stats = frequencyStats(rows);
emit("frequency-stats.json", { source, generator, ...stats });
console.log(
  `population ${stats.population.size} (${JSON.stringify(stats.population.byPos)}); ` +
    `freqLemme p50=${stats.freqLemme.quantiles.p50} p90=${stats.freqLemme.quantiles.p90}; ` +
    `cd max=${stats.cdOrtho.max}; preval range ${stats.preval.min}–${stats.preval.max}`
);
const unknownCount = Object.keys(stats.unknownCgramValues).length;
if (unknownCount > 0) {
  console.log(`unmapped 5_Cgram values (reported, never guessed): ${JSON.stringify(stats.unknownCgramValues)}`);
}

// 4. Gender × suffix aggregates over the noun lemma population.
const gender = genderSuffixStats(rows);
emit("gender-suffix-stats.json", { source, generator, ...gender });
console.log(
  `noun population ${gender.population.size} (${JSON.stringify(gender.population.byGenre)}); ` +
    `${gender.dataDrivenEndings.length} data-driven endings ≥${gender.minCount}`
);

// 5. Verb morphology: full-file InfoVER inventory + target-verb rows.
const coreVerbs = lexicon.lexemes.filter((l) => l.partOfSpeech === "verb").map((l) => l.lemma);
const verbTargets = [...new Set([...HIGH_YIELD_VERBS, ...coreVerbs])].sort((a, b) =>
  a.localeCompare(b, "fr")
);
const verbs = verbMorphology(rows, verbTargets);
emit("verb-morphology.json", { source, generator, ...verbs });
const missing = verbs.verbs.filter((v) => !v.found).map((v) => v.lemma);
console.log(
  `verb targets ${verbTargets.length}; infoVer inventory ${Object.keys(verbs.infoVerInventory).length} raw / ` +
    `${Object.keys(verbs.atomicAnalyses).length} atomic${missing.length ? `; MISSING: ${missing.join(", ")}` : ""}`
);

console.log("derivation complete — commit the derived outputs and cross-check locally (P5A.2).");
