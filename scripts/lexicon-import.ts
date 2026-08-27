/**
 * Phase 5A.3 Lexique 4 import — the DELIBERATE content change that merges
 * real source measurements into content/fr/lexicon/lexemes.json. Fully
 * offline over committed derived data; every change is printed; the result
 * must pass schema validation before a byte is written.
 *
 * Per effectively-matched lexeme (strict matcher + validated overrides):
 *  - frequency: rawValue = the matched row's 12_FreqLemme; rank = the
 *    lemma's 1-based rank in the FULL eligible population (core-ranks);
 *    band from the §18 population-quantile thresholds (frequency-stats).
 *  - pronunciation: the matched row's 3_Phono_IPA verbatim (genuine IPA),
 *    source lexique-4 — the REVIEW.md pass-3 disposition. Changed values
 *    are listed in the output.
 *  - sourceRefs: gains { source: "lexique-4", key: <matchKey> }.
 * Everything else (expressions, unmatched-without-override) is untouched.
 *
 * Fail-closed gates: manifest retrieved; subset/stats/ranks artifacts must
 * all carry the pinned sha; matched rows and ranks must exist for every
 * effective match; IPA and freqLemme must be present on adopted rows.
 */
import { writeFileSync } from "fs";

import { RichLexiconSchema } from "../content/schema";
import {
  CANDIDATE_POS,
  bandThresholdsFromStats,
  effectiveMatchKeys,
  frequencyBandFor,
  lexiquePosFor,
  loadMatchOverrides,
  loadSourceManifest,
  type SourceMatchRow,
} from "./lib/lexicon";
import type { CoreLexemeRows, TrimmedRow } from "./lib/lexique-derive-lib";
import { trimmedRowKey } from "./lib/lexique-derive-lib";
import { readJson, safeResolve } from "./lib/pipeline";

function fail(message: string): never {
  console.error(`ERROR ${message}`);
  process.exit(1);
}

const manifest = loadSourceManifest();
if (manifest.retrieval.status !== "retrieved") fail("manifest is not retrieved (fail-closed)");
const pinned = manifest.retrieval.sha256;

function loadDerived<T extends { source?: { sha256?: string } }>(rel: string): T {
  const data = readJson(rel) as T;
  if (data.source?.sha256 !== pinned) {
    fail(`${rel} was derived from sha ${data.source?.sha256}, but the manifest pins ${pinned} — stale derived data`);
  }
  return data;
}

const subset = loadDerived<{ source: { sha256: string }; audit: SourceMatchRow[]; entries: CoreLexemeRows["entries"] }>(
  "content/fr/lexicon/derived/lexique-subset.json"
);
const stats = loadDerived<{ source: { sha256: string }; freqLemme: { quantiles: Record<string, number> } }>(
  "content/fr/lexicon/derived/frequency-stats.json"
);
const ranksFile = loadDerived<{ source: { sha256: string }; ranks: Record<string, number> }>(
  "content/fr/lexicon/derived/core-ranks.json"
);

const overrides = loadMatchOverrides();
const effective = effectiveMatchKeys(subset.audit, overrides);
const thresholds = bandThresholdsFromStats(stats);
console.log(
  `band thresholds from population quantiles: very-common ≥ ${thresholds.veryCommon}/M (p99), common ≥ ${thresholds.common}/M (p95)`
);

const rowsById = new Map<string, TrimmedRow[]>(subset.entries.map((e) => [e.id, e.formRows]));

type RawLexeme = {
  id: string;
  pronunciation?: { value: string; notation: string; source: string };
  frequency?: { source: string; rawValue: number; rank?: number; band: string };
  sourceRefs?: { source: string; key?: string }[];
  [key: string]: unknown;
};
const raw = readJson("content/fr/lexicon/lexemes.json") as { lexemes: RawLexeme[] };

const changes: string[] = [];
let imported = 0;
for (const lexeme of raw.lexemes) {
  const match = effective.get(lexeme.id);
  if (!match) continue;
  const row = (rowsById.get(lexeme.id) ?? []).find((r) => trimmedRowKey(r) === match.matchKey);
  if (!row) fail(`${lexeme.id}: matched row ${match.matchKey} not found in the committed subset`);
  if (row.freqLemme === null) fail(`${lexeme.id}: adopted row has no parseable 12_FreqLemme`);
  if (row.ipa === "") fail(`${lexeme.id}: adopted row has an empty 3_Phono_IPA`);
  const pos = lexiquePosFor(row.cgram);
  if (pos === null) fail(`${lexeme.id}: adopted row cgram ${row.cgram} is unmapped`);
  // Rank exists only for categories inside the ranked population; the three
  // ONO-category greetings (merci/salut/pardon) legitimately have none.
  const rank = ranksFile.ranks[`${row.mot}|${pos}`];
  if (rank === undefined && CANDIDATE_POS.includes(pos)) {
    fail(`${lexeme.id}: no population rank for in-population category ${row.mot}|${pos} — regenerate core-ranks`);
  }

  const band = frequencyBandFor(row.freqLemme, thresholds);
  const before = lexeme.frequency;
  lexeme.frequency = {
    source: "lexique-4",
    rawValue: row.freqLemme,
    ...(rank !== undefined ? { rank } : {}),
    band,
  };
  if (JSON.stringify(before) !== JSON.stringify(lexeme.frequency)) {
    changes.push(
      `${lexeme.id}: frequency ${before ? JSON.stringify(before) : "∅"} → ${row.freqLemme}/M ${rank !== undefined ? `rank ${rank} ` : "(unranked category) "}${band}`
    );
  }

  const oldPron = lexeme.pronunciation;
  const newPron = { value: row.ipa, notation: "ipa", source: "lexique-4" };
  if (!oldPron || oldPron.value !== newPron.value || oldPron.source !== newPron.source) {
    changes.push(
      `${lexeme.id}: pronunciation ${oldPron ? `/${oldPron.value}/ (${oldPron.source})` : "∅"} → /${newPron.value}/ (lexique-4, via ${match.via})`
    );
  }
  lexeme.pronunciation = newPron;

  const refs = lexeme.sourceRefs ?? [];
  if (!refs.some((r) => r.source === "lexique-4")) {
    refs.push({ source: "lexique-4", key: match.matchKey });
    lexeme.sourceRefs = refs;
    changes.push(`${lexeme.id}: sourceRefs += lexique-4 (${match.matchKey}, via ${match.via})`);
  }
  imported += 1;
}

// The full result must be schema-valid BEFORE anything is written.
RichLexiconSchema.parse(raw);

writeFileSync(safeResolve("content/fr/lexicon/lexemes.json"), `${JSON.stringify(raw, null, 2)}\n`);
console.log(`imported measurements into ${imported} lexemes (${effective.size} effective matches)`);
for (const line of changes) console.log(`  ${line}`);
console.log("next: bun run lexicon:build && bun run lexicon:validate && bun run test");
