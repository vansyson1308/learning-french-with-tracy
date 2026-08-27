/**
 * French rich-lexicon pipeline core (Phase 4).
 *
 * content/fr/lexicon/lexemes.json is the authoritative rich source for the
 * 54 curriculum lexemes. The 54 stable ids are SACROSANCT: this module
 * enforces a triple lock — (rich lexicon → derived surface→id map)
 * ≡ content/fr/lexemes.json ≡ src/lib/learning/ids-fr.ts — so no edit
 * anywhere can drift an id without failing validation.
 *
 * External-source (Lexique 4) handling is fail-closed: the source manifest
 * must carry a pinned SHA-256 with status "retrieved" before any
 * lexique-derived field, sourceRef, or frequency may appear anywhere.
 * While the status is "not-retrieved", the matcher reports
 * "source-unavailable" and never invents matches.
 */

import {
  FrLexemeMapSchema,
  PackSchema,
  RichLexiconSchema,
  SourceManifestSchema,
  type PartOfSpeech,
  type RichLexeme,
  type RichLexicon,
  type SourceManifest,
} from "../../content/schema";
import { FR_COURSE_ID, FR_LEXEME_IDS } from "../../src/lib/learning/ids-fr";
import { loadRegistry, readJson, type ValidationResult } from "./pipeline";

export const LEXIQUE_SOURCE_ID = "lexique-4";

export function loadRichLexicon(): RichLexicon {
  return RichLexiconSchema.parse(readJson("content/fr/lexicon/lexemes.json"));
}

export function loadSourceManifest(): SourceManifest {
  return SourceManifestSchema.parse(readJson("content/fr/lexicon/source-manifest.json"));
}

/** surface → id map derived mechanically from the rich lexicon. */
export function derivedSurfaceMap(lexicon: RichLexicon): Record<string, string> {
  const map: Record<string, string> = {};
  for (const lex of lexicon.lexemes) map[lex.surface] = lex.id;
  return map;
}

// ---------------------------------------------------------------------------
// Article handling (data rules, not runtime heuristics)
// ---------------------------------------------------------------------------

export type SurfaceArticle = "le" | "la" | "l'" | null;

/**
 * Splits a course surface into its leading article (if any) and the rest.
 * Used only to VERIFY the authored lookupForm — the runtime never strips
 * articles on its own.
 */
export function splitSurfaceArticle(surface: string): { article: SurfaceArticle; rest: string } {
  if (surface.startsWith("le ")) return { article: "le", rest: surface.slice(3) };
  if (surface.startsWith("la ")) return { article: "la", rest: surface.slice(3) };
  if (surface.startsWith("l'")) return { article: "l'", rest: surface.slice(2) };
  return { article: null, rest: surface };
}

const ARTICLE_GENDER: Record<string, "masculine" | "feminine"> = {
  le: "masculine",
  la: "feminine",
  un: "masculine",
  une: "feminine",
};

/**
 * Gendered determiners immediately preceding the lookup form inside a text.
 * Word-boundary aware; case-insensitive; elided l' carries no gender.
 */
export function genderEvidenceInText(text: string, lookupForm: string): ("masculine" | "feminine")[] {
  const evidence: ("masculine" | "feminine")[] = [];
  const escaped = lookupForm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|[^\\p{L}])(le|la|un|une)\\s+${escaped}(?=$|[^\\p{L}])`, "giu");
  for (const m of text.matchAll(re)) {
    const g = ARTICLE_GENDER[m[1].toLowerCase()];
    if (g) evidence.push(g);
  }
  return evidence;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Pure rule engine — everything injected so tests can prove each rule fires. */
export function validateLexiconData(input: {
  lexicon: RichLexicon;
  manifest: SourceManifest;
  frozenMap: Record<string, string>;
  runtimeMap: Record<string, string>;
  registryIds: Set<string>;
  /** course surface → native gloss (first occurrence wins, as authored). */
  packGloss: Map<string, string>;
}): ValidationResult {
  const { lexicon, manifest, frozenMap, runtimeMap, registryIds, packGloss } = input;
  const errors: string[] = [];
  const err = (m: string) => errors.push(`lexicon: ${m}`);

  const sourceRetrieved = manifest.retrieval.status === "retrieved";
  const byId = new Map<string, RichLexeme>();

  // Uniqueness.
  for (const lex of lexicon.lexemes) {
    if (byId.has(lex.id)) err(`duplicate id ${lex.id}`);
    byId.set(lex.id, lex);
  }
  const surfaces = lexicon.lexemes.map((l) => l.surface);
  if (new Set(surfaces).size !== surfaces.length) err("duplicate surfaces");

  // Sacrosanct triple lock: rich-derived map ≡ frozen JSON map ≡ runtime map.
  const derived = derivedSurfaceMap(lexicon);
  const canon = (m: Record<string, string>) => JSON.stringify(Object.entries(m).sort());
  if (canon(derived) !== canon(frozenMap)) {
    err("rich lexicon drifted from the frozen surface→id map (content/fr/lexemes.json) — stable ids are frozen; fix the rich source, never the map");
  }
  if (canon(frozenMap) !== canon(runtimeMap)) {
    err("frozen map drifted from src/lib/learning/ids-fr.ts");
  }

  // Cross-check against the course pack: gloss identity and full coverage.
  for (const [target] of packGloss) {
    if (derived[target] === undefined) err(`pack word "${target}" missing from rich lexicon`);
  }
  for (const lex of lexicon.lexemes) {
    const packNative = packGloss.get(lex.surface);
    if (packNative !== undefined && packNative !== lex.nativeGloss) {
      err(`${lex.id}: nativeGloss "${lex.nativeGloss}" ≠ course gloss "${packNative}" — one truth, no drift`);
    }
  }

  // Per-lexeme rules.
  const exampleCorpus = lexicon.lexemes
    .flatMap((l) => l.examples.map((ex) => ex.fr))
    .join("\n");

  for (const lex of lexicon.lexemes) {
    const where = lex.id;

    // Gender ⟺ noun.
    if (lex.partOfSpeech === "noun" && lex.gender === undefined) {
      err(`${where}: nouns must carry gender (use "unknown" only when genuinely unknown)`);
    }
    if (lex.partOfSpeech !== "noun" && lex.gender !== undefined) {
      err(`${where}: gender is meaningful on nouns only`);
    }

    // lookupForm is the surface minus its leading article — stored, verified.
    const { article, rest } = splitSurfaceArticle(lex.surface);
    if (rest !== lex.lookupForm) {
      err(`${where}: lookupForm "${lex.lookupForm}" ≠ surface minus article ("${rest}")`);
    }
    if (article !== null && lex.partOfSpeech !== "noun") {
      err(`${where}: surface carries article "${article}" but part of speech is ${lex.partOfSpeech}`);
    }

    // Article-consistency audit (course display vs authored gender). A
    // contradiction FAILS the gate — display text is never silently "fixed".
    if (article === "le" && lex.gender !== "masculine") {
      err(`${where}: surface article "le" contradicts authored gender "${lex.gender}"`);
    }
    if (article === "la" && lex.gender !== "feminine") {
      err(`${where}: surface article "la" contradicts authored gender "${lex.gender}"`);
    }
    // Example-sentence evidence (un/une/le/la before the lookup form,
    // anywhere in the authored examples corpus) must agree too.
    if (lex.partOfSpeech === "noun" && (lex.gender === "masculine" || lex.gender === "feminine")) {
      for (const evidence of genderEvidenceInText(exampleCorpus, lex.lookupForm)) {
        if (evidence !== lex.gender) {
          err(`${where}: example text shows a ${evidence} article before "${lex.lookupForm}" but authored gender is ${lex.gender}`);
        }
      }
    }

    // Learner-facing completeness for this file.
    if (lex.examples.length === 0) err(`${where}: at least one example is required`);
    if (lex.topic === undefined) err(`${where}: topic is required for curriculum lexemes`);

    // Source discipline.
    const refSources = [
      ...lex.sourceRefs.map((r) => r.source),
      ...lex.examples.map((ex) => ex.source),
      ...(lex.pronunciation ? [lex.pronunciation.source] : []),
      ...(lex.frequency ? [lex.frequency.source] : []),
    ];
    for (const src of refSources) {
      if (src === LEXIQUE_SOURCE_ID) {
        if (!sourceRetrieved) {
          err(`${where}: references ${LEXIQUE_SOURCE_ID} but the source manifest is "not-retrieved" — fail-closed`);
        }
        if (!registryIds.has(src)) {
          err(`${where}: ${LEXIQUE_SOURCE_ID} data present but not registered in content/sources/registry.json`);
        }
      } else if (!registryIds.has(src)) {
        err(`${where}: source "${src}" is not registered`);
      }
    }
    if (lex.partOfSpeech === "expression") {
      if (refSources.includes(LEXIQUE_SOURCE_ID)) {
        err(`${where}: expressions are project-authored — a Lexique match here would be fabricated`);
      }
    }
    if (lex.pronunciation && lex.pronunciation.notation === "ipa" && lex.pronunciation.source === LEXIQUE_SOURCE_ID) {
      err(`${where}: Lexique phonology must not be labeled "ipa" without a documented, verified conversion`);
    }
    if (lex.frequency && lex.frequency.source !== LEXIQUE_SOURCE_ID) {
      err(`${where}: frequency must come from real ${LEXIQUE_SOURCE_ID} measurements only`);
    }

    // Relations: known ids, no self-reference, symmetric.
    for (const other of lex.relations?.confusables ?? []) {
      if (other === lex.id) err(`${where}: confusable self-reference`);
      const target = byId.get(other);
      if (!target) {
        err(`${where}: confusable ${other} does not exist`);
      } else if (!(target.relations?.confusables ?? []).includes(lex.id)) {
        err(`${where}: confusable ${other} is not symmetric`);
      }
    }
  }

  return { errors, warnings: [] };
}

/** Disk-reading wrapper used by the content:validate CLI. */
export function validateLexicon(): ValidationResult {
  let lexicon: RichLexicon;
  let manifest: SourceManifest;
  try {
    lexicon = loadRichLexicon();
  } catch (e) {
    return {
      errors: [`lexicon: lexemes.json failed schema validation — ${(e as Error).message.split("\n")[0]}`],
      warnings: [],
    };
  }
  try {
    manifest = loadSourceManifest();
  } catch (e) {
    return {
      errors: [`lexicon: source-manifest.json failed schema validation — ${(e as Error).message.split("\n")[0]}`],
      warnings: [],
    };
  }
  const frozenMap = FrLexemeMapSchema.parse(readJson("content/fr/lexemes.json"));
  const frPack = PackSchema.parse(readJson(`content/courses/${FR_COURSE_ID}.json`));
  const packGloss = new Map<string, string>();
  for (const section of frPack.sections)
    for (const unit of section.units)
      for (const word of unit.words) {
        if (!packGloss.has(word.target)) packGloss.set(word.target, word.native);
      }
  return validateLexiconData({
    lexicon,
    manifest,
    frozenMap,
    runtimeMap: FR_LEXEME_IDS,
    registryIds: new Set(loadRegistry().sources.map((s) => s.id)),
    packGloss,
  });
}

// ---------------------------------------------------------------------------
// Lexique 4 mapping (used by the developer-side extractor and its tests)
// ---------------------------------------------------------------------------

/**
 * Deterministic mapping from the Lexique `cgram` lineage to the app's POS
 * vocabulary. Declared from the Lexique 3.8x documentation; the Lexique 4
 * layout is to-confirm at retrieval (source-manifest.expectedColumns), and
 * any unknown value maps to null so the caller fails loudly instead of
 * guessing.
 */
export const LEXIQUE_CGRAM_TO_POS: Readonly<Record<string, PartOfSpeech>> = {
  NOM: "noun",
  VER: "verb",
  AUX: "verb",
  ADJ: "adjective",
  "ADJ:dem": "adjective",
  "ADJ:ind": "adjective",
  "ADJ:int": "adjective",
  "ADJ:num": "adjective",
  "ADJ:pos": "adjective",
  ADV: "adverb",
  "ART:def": "determiner",
  "ART:ind": "determiner",
  "PRO:dem": "pronoun",
  "PRO:ind": "pronoun",
  "PRO:int": "pronoun",
  "PRO:per": "pronoun",
  "PRO:pos": "pronoun",
  "PRO:rel": "pronoun",
  PRE: "preposition",
  CON: "conjunction",
  ONO: "interjection",
  INT: "interjection",
  LIA: "other",
};

export function lexiquePosFor(cgram: string): PartOfSpeech | null {
  return LEXIQUE_CGRAM_TO_POS[cgram] ?? null;
}

export function lexiqueGenderFor(genre: string): "masculine" | "feminine" | "unknown" {
  if (genre === "m") return "masculine";
  if (genre === "f") return "feminine";
  return "unknown";
}

/**
 * Frequency bands over occurrences-per-million-words (documented
 * derivation, applied only to real source measurements):
 *   ≥ 10 per million → "very-common"  (roughly the first few thousand words)
 *   ≥ 1 per million  → "common"
 *   otherwise        → "less-common"
 */
export function frequencyBandFor(perMillion: number): "very-common" | "common" | "less-common" {
  if (perMillion >= 10) return "very-common";
  if (perMillion >= 1) return "common";
  return "less-common";
}

export type LexiqueRow = Record<string, string>;

/** Strict TSV parse: every expected column must exist; no guessing. */
export function parseLexiqueTsv(text: string, expectedColumns: string[]): LexiqueRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) throw new Error("empty source artifact");
  const header = lines[0].split("\t");
  for (const col of expectedColumns) {
    if (!header.includes(col)) {
      throw new Error(`source artifact is missing expected column "${col}" — confirm the Lexique 4 layout and update the source manifest`);
    }
  }
  return lines.slice(1).map((line) => {
    const cells = line.split("\t");
    const row: LexiqueRow = {};
    header.forEach((name, i) => {
      row[name] = cells[i] ?? "";
    });
    return row;
  });
}

export type MatchStatus =
  | "matched"
  | "unmatched"
  | "ambiguous"
  | "not-applicable"
  | "source-unavailable";

export type SourceMatchRow = {
  id: string;
  surface: string;
  lookupForm: string;
  partOfSpeech: PartOfSpeech;
  status: MatchStatus;
  /** The matched source row key (ortho|cgram) when status is "matched". */
  matchKey: string | null;
  candidateCount: number;
};

/**
 * Deterministic, fail-closed matching of curriculum lexemes against source
 * rows. Disambiguation uses lemma + POS (+ gender for nouns) — NEVER
 * frequency alone; anything still ambiguous stays "ambiguous" and gets no
 * metadata. Expressions are project-authored and never matched.
 */
export function matchLexemes(
  lexicon: RichLexicon,
  rows: LexiqueRow[] | null
): SourceMatchRow[] {
  return lexicon.lexemes.map((lex) => {
    const base: Omit<SourceMatchRow, "status" | "matchKey" | "candidateCount"> = {
      id: lex.id,
      surface: lex.surface,
      lookupForm: lex.lookupForm,
      partOfSpeech: lex.partOfSpeech,
    };
    if (lex.partOfSpeech === "expression") {
      return { ...base, status: "not-applicable", matchKey: null, candidateCount: 0 };
    }
    if (rows === null) {
      return { ...base, status: "source-unavailable", matchKey: null, candidateCount: 0 };
    }
    const byForm = rows.filter((r) => r.ortho === lex.lookupForm);
    const byLemma = byForm.filter((r) => (r.lemme ?? r.ortho) === lex.lemma);
    const byPos = byLemma.filter((r) => lexiquePosFor(r.cgram ?? "") === lex.partOfSpeech);
    let candidates = byPos;
    if (candidates.length > 1 && lex.partOfSpeech === "noun" && lex.gender && lex.gender !== "unknown") {
      const byGender = candidates.filter((r) => lexiqueGenderFor(r.genre ?? "") === lex.gender);
      if (byGender.length > 0) candidates = byGender;
    }
    if (candidates.length === 1) {
      const row = candidates[0];
      return {
        ...base,
        status: "matched",
        matchKey: `${row.ortho}|${row.cgram}`,
        candidateCount: 1,
      };
    }
    return {
      ...base,
      status: candidates.length === 0 ? "unmatched" : "ambiguous",
      matchKey: null,
      candidateCount: candidates.length,
    };
  });
}

/**
 * The source-match audit. Without an artifact (the committed state while
 * the manifest is "not-retrieved") every matchable lexeme reports
 * "source-unavailable"; the developer-side extractor passes real parsed
 * rows and regenerates the committed audit at retrieval time.
 */
export function lexiconSourceAudit(rows: LexiqueRow[] | null = null): SourceMatchRow[] {
  return matchLexemes(loadRichLexicon(), rows);
}

// ---------------------------------------------------------------------------
// Authoring-only candidate pool (never learner-visible)
// ---------------------------------------------------------------------------

export type CandidateEntry = {
  lemma: string;
  partOfSpeech: PartOfSpeech;
  gender: "masculine" | "feminine" | "unknown" | null;
  perMillion: number;
};

export const CANDIDATE_POOL_SIZE = 1500;
const CANDIDATE_POS: readonly PartOfSpeech[] = ["noun", "verb", "adjective", "adverb"];

/**
 * Documented deterministic selection for the authoring-only candidate pool
 * (never curriculum, never cards, never learner-visible — no translations
 * are fabricated for it):
 *  1. keep rows whose cgram maps to noun/verb/adjective/adverb;
 *  2. keep lemma rows only (ortho === lemme) so the pool lists lemmas;
 *  3. keep single-word lowercase forms (letters, accents, œ/æ, internal
 *     hyphens or apostrophes) — filters proper nouns and multiword rows;
 *  4. dedupe by (lemma, POS) keeping the highest lemma film frequency;
 *  5. order by lemma film frequency (per million) descending, tie-broken
 *     alphabetically, and take the first CANDIDATE_POOL_SIZE entries.
 */
export function selectCandidatePool(rows: LexiqueRow[], size: number = CANDIDATE_POOL_SIZE): CandidateEntry[] {
  const wordShape = /^[a-zàâäéèêëîïôöùûüÿçœæ]+(?:[-'][a-zàâäéèêëîïôöùûüÿçœæ]+)*$/;
  const best = new Map<string, CandidateEntry>();
  for (const row of rows) {
    const pos = lexiquePosFor(row.cgram ?? "");
    if (pos === null || !CANDIDATE_POS.includes(pos)) continue;
    const lemma = row.lemme ?? "";
    if (lemma === "" || lemma !== row.ortho) continue;
    if (!wordShape.test(lemma)) continue;
    const perMillion = Number(row.freqlemfilms ?? "0");
    if (!Number.isFinite(perMillion)) continue;
    const key = `${lemma}|${pos}`;
    const existing = best.get(key);
    if (existing === undefined || perMillion > existing.perMillion) {
      best.set(key, {
        lemma,
        partOfSpeech: pos,
        gender: pos === "noun" ? lexiqueGenderFor(row.genre ?? "") : null,
        perMillion,
      });
    }
  }
  return [...best.values()]
    .sort((a, b) => b.perMillion - a.perMillion || a.lemma.localeCompare(b.lemma, "fr"))
    .slice(0, size);
}
