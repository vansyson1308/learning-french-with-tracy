/**
 * Pure Lexique 4 derivation functions (Phase 5A). Everything here is
 * deterministic over (parsed rows, curriculum lexicon) so the runner-side
 * derive step and the local unit tests exercise the exact same logic.
 * Column semantics: content/fr/lexicon/LEXIQUE4_COLUMNS.md.
 *
 * The committed artifacts these functions produce are the ONLY Lexique data
 * the offline build environment ever sees (the raw 33 MB TSV never lands in
 * the repository), so each output must carry everything its downstream
 * consumer needs:
 *   - frequencyStats     → §18 population quantiles (band derivation input),
 *                          CD/prevalence scale evidence, unmapped-Cgram report;
 *   - genderSuffixStats  → §51–53 gender-pattern population study;
 *   - verbMorphology     → §26 sufficiency evidence + §60–68 conjugation data;
 *   - coreLexemeRows     → §13–15 cross-check evidence for the 54 core items.
 */
import type { PartOfSpeech, RichLexicon } from "../../content/schema";
import {
  CANDIDATE_POS,
  L4,
  LEXIQUE_WORD_SHAPE,
  lexiqueFormEquals,
  lexiquePosFor,
  matchLexemes,
  type LexiqueRow,
  type SourceMatchRow,
} from "./lexicon";

/** The committed projection of a source row (camelCase, used columns only). */
export type TrimmedRow = {
  mot: string;
  phono: string;
  ipa: string;
  lemme: string;
  cgram: string;
  cgramOrtho: string;
  genre: string;
  nombre: string;
  infoVer: string;
  freqMot: number | null;
  freqOrtho: number | null;
  freqLemme: number | null;
  cdOrtho: number | null;
  isLem: boolean;
  preval: number | null;
};

function num(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** The same Mot|Cgram|Genre|Nombre identity lexiqueRowKey builds, over the trimmed projection. */
export function trimmedRowKey(row: TrimmedRow): string {
  return [row.mot, row.cgram, row.genre, row.nombre].join("|");
}

export function trimRow(row: LexiqueRow): TrimmedRow {
  return {
    mot: row[L4.MOT] ?? "",
    phono: row[L4.PHONO] ?? "",
    ipa: row[L4.IPA] ?? "",
    lemme: row[L4.LEMME] ?? "",
    cgram: row[L4.CGRAM] ?? "",
    cgramOrtho: row[L4.CGRAM_ORTHO] ?? "",
    genre: row[L4.GENRE] ?? "",
    nombre: row[L4.NOMBRE] ?? "",
    infoVer: row[L4.INFOVER] ?? "",
    freqMot: num(row[L4.FREQ_MOT]),
    freqOrtho: num(row[L4.FREQ_ORTHO]),
    freqLemme: num(row[L4.FREQ_LEMME]),
    cdOrtho: num(row[L4.CD_ORTHO]),
    isLem: row[L4.IS_LEM] === "1",
    preval: num(row[L4.PREVAL]),
  };
}

// ---------------------------------------------------------------------------
// Eligible lemma population (§18 / §21 / §51 share one definition)
// ---------------------------------------------------------------------------

export const POPULATION_DEFINITION =
  "rows with 14_IsLem = 1 whose 5_Cgram maps to noun/verb/adjective/adverb and whose 1_Mot is a lowercase single word (letters/accents/œ/æ, internal hyphen or apostrophe allowed — proper nouns and multiword rows excluded), deduplicated by (1_Mot, mapped POS) keeping the highest 12_FreqLemme";

export type PopulationEntry = {
  lemma: string;
  partOfSpeech: PartOfSpeech;
  genre: string;
  freqLemme: number;
  cdOrtho: number | null;
  preval: number | null;
};

/** One entry per learnable (lemma, POS) pair, per POPULATION_DEFINITION. */
export function eligibleLemmaPopulation(rows: LexiqueRow[]): PopulationEntry[] {
  const best = new Map<string, PopulationEntry>();
  for (const row of rows) {
    if (row[L4.IS_LEM] !== "1") continue;
    const pos = lexiquePosFor(row[L4.CGRAM] ?? "");
    if (pos === null || !CANDIDATE_POS.includes(pos)) continue;
    const lemma = row[L4.MOT] ?? "";
    if (!LEXIQUE_WORD_SHAPE.test(lemma)) continue;
    const freqLemme = num(row[L4.FREQ_LEMME]);
    if (freqLemme === null) continue;
    const key = `${lemma}|${pos}`;
    const existing = best.get(key);
    if (existing === undefined || freqLemme > existing.freqLemme) {
      best.set(key, {
        lemma,
        partOfSpeech: pos,
        genre: row[L4.GENRE] ?? "",
        freqLemme,
        cdOrtho: num(row[L4.CD_ORTHO]),
        preval: num(row[L4.PREVAL]),
      });
    }
  }
  return [...best.values()].sort(
    (a, b) => b.freqLemme - a.freqLemme || a.lemma.localeCompare(b.lemma, "fr")
  );
}

// ---------------------------------------------------------------------------
// Frequency statistics (§17/§18) — the band-derivation evidence
// ---------------------------------------------------------------------------

/**
 * Nearest-rank quantile over a pre-sorted ascending array (deterministic,
 * no interpolation): the value at index ceil(p·n) − 1.
 */
export function quantileOf(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) throw new Error("quantile of an empty population");
  const idx = Math.max(0, Math.min(sortedAsc.length - 1, Math.ceil(p * sortedAsc.length) - 1));
  return sortedAsc[idx];
}

const QUANTILE_POINTS = [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99] as const;

function quantileTable(values: number[]): Record<string, number> {
  const sorted = [...values].sort((a, b) => a - b);
  const table: Record<string, number> = {};
  for (const p of QUANTILE_POINTS) table[`p${Math.round(p * 100)}`] = quantileOf(sorted, p);
  return table;
}

export type FrequencyStats = {
  population: {
    definition: string;
    size: number;
    byPos: Record<string, number>;
  };
  freqLemme: { min: number; max: number; quantiles: Record<string, number> };
  cdOrtho: { present: number; min: number; max: number; quantiles: Record<string, number> };
  preval: { present: number; min: number; max: number };
  /** CD scale evidence: the highest-frequency lemmas with their raw CD. */
  topByFreqLemme: { lemma: string; partOfSpeech: PartOfSpeech; freqLemme: number; cdOrtho: number | null }[];
  /** 5_Cgram values LEXIQUE_CGRAM_TO_POS does not map, with row counts. */
  unknownCgramValues: Record<string, number>;
  totalDataRows: number;
};

export function frequencyStats(rows: LexiqueRow[]): FrequencyStats {
  const population = eligibleLemmaPopulation(rows);
  if (population.length === 0) throw new Error("empty eligible lemma population — refusing to emit statistics");

  const byPos: Record<string, number> = {};
  for (const e of population) byPos[e.partOfSpeech] = (byPos[e.partOfSpeech] ?? 0) + 1;

  const freqs = population.map((e) => e.freqLemme);
  const cds = population.map((e) => e.cdOrtho).filter((v): v is number => v !== null);
  const prevals = population.map((e) => e.preval).filter((v): v is number => v !== null);

  const unknownCgramValues: Record<string, number> = {};
  for (const row of rows) {
    const cgram = row[L4.CGRAM] ?? "";
    if (lexiquePosFor(cgram) === null) {
      unknownCgramValues[cgram] = (unknownCgramValues[cgram] ?? 0) + 1;
    }
  }

  return {
    population: { definition: POPULATION_DEFINITION, size: population.length, byPos },
    freqLemme: {
      min: Math.min(...freqs),
      max: Math.max(...freqs),
      quantiles: quantileTable(freqs),
    },
    cdOrtho: {
      present: cds.length,
      min: cds.length ? Math.min(...cds) : 0,
      max: cds.length ? Math.max(...cds) : 0,
      quantiles: cds.length ? quantileTable(cds) : {},
    },
    preval: {
      present: prevals.length,
      min: prevals.length ? Math.min(...prevals) : 0,
      max: prevals.length ? Math.max(...prevals) : 0,
    },
    topByFreqLemme: population.slice(0, 20).map((e) => ({
      lemma: e.lemma,
      partOfSpeech: e.partOfSpeech,
      freqLemme: e.freqLemme,
      cdOrtho: e.cdOrtho,
    })),
    unknownCgramValues,
    totalDataRows: rows.length,
  };
}

// ---------------------------------------------------------------------------
// Gender × suffix statistics (§51–53) — pattern-derivation evidence
// ---------------------------------------------------------------------------

/**
 * Researched candidate suffixes for the Gender & Articles unit. The unit
 * teaches ONLY patterns this population study shows to be robust; listing a
 * suffix here guarantees its aggregate is recorded, nothing more.
 */
export const RESEARCHED_SUFFIXES = [
  "tion", "sion", "té", "eau", "age", "isme", "ette", "ence", "ance",
  "ure", "oir", "eur", "euse", "ie", "aison", "ment", "esse", "ude",
  "ade", "ine", "elle", "ier", "ière", "et", "on", "in", "al",
] as const;

export type SuffixAggregate = {
  ending: string;
  m: number;
  f: number;
  e: number;
  total: number;
};

export type GenderSuffixStats = {
  population: {
    definition: string;
    size: number;
    byGenre: Record<string, number>;
  };
  researchedSuffixes: SuffixAggregate[];
  /** Every word-final 2- and 3-letter ending with ≥ minCount lemmas. */
  dataDrivenEndings: SuffixAggregate[];
  minCount: number;
};

const NOUN_POPULATION_DEFINITION =
  "rows with 14_IsLem = 1 whose 5_Cgram maps to noun, whose 1_Mot is a lowercase single word (proper nouns and multiword rows excluded) and which carry a 7_Genre value (m, f or e); one entry per (lemma, gender), so a genuinely two-gender noun counts once per gender";

export function genderSuffixStats(rows: LexiqueRow[], minCount = 30): GenderSuffixStats {
  // One entry per (lemma, genre): a genuinely two-gender noun ("tour" m/f)
  // counts once per gender; épicène rows count once as "e". This pass runs
  // over raw rows (not eligibleLemmaPopulation) because that population
  // dedupes to one entry per (lemma, POS) and would drop the second gender.
  const seen = new Map<string, { lemma: string; genre: string }>();
  for (const row of rows) {
    if (row[L4.IS_LEM] !== "1") continue;
    if (lexiquePosFor(row[L4.CGRAM] ?? "") !== "noun") continue;
    const lemma = row[L4.MOT] ?? "";
    if (!LEXIQUE_WORD_SHAPE.test(lemma)) continue;
    const genre = row[L4.GENRE] ?? "";
    if (genre !== "m" && genre !== "f" && genre !== "e") continue;
    seen.set(`${lemma}|${genre}`, { lemma, genre });
  }

  const population = [...seen.values()].sort(
    (a, b) => a.lemma.localeCompare(b.lemma, "fr") || a.genre.localeCompare(b.genre)
  );
  const byGenre: Record<string, number> = { m: 0, f: 0, e: 0 };
  for (const { genre } of population) byGenre[genre] += 1;

  const aggregate = (predicate: (lemma: string) => boolean): Omit<SuffixAggregate, "ending"> => {
    const out = { m: 0, f: 0, e: 0, total: 0 };
    for (const { lemma, genre } of population) {
      if (!predicate(lemma)) continue;
      out[genre as "m" | "f" | "e"] += 1;
      out.total += 1;
    }
    return out;
  };

  const researchedSuffixes: SuffixAggregate[] = RESEARCHED_SUFFIXES.map((suffix) => ({
    ending: suffix,
    ...aggregate((lemma) => lemma.endsWith(suffix)),
  }));

  const endingCounts = new Map<string, { m: number; f: number; e: number; total: number }>();
  for (const { lemma, genre } of population) {
    for (const len of [2, 3]) {
      if (lemma.length <= len) continue;
      const ending = lemma.slice(-len);
      const agg = endingCounts.get(ending) ?? { m: 0, f: 0, e: 0, total: 0 };
      agg[genre as "m" | "f" | "e"] += 1;
      agg.total += 1;
      endingCounts.set(ending, agg);
    }
  }
  const dataDrivenEndings: SuffixAggregate[] = [...endingCounts.entries()]
    .filter(([, agg]) => agg.total >= minCount)
    .map(([ending, agg]) => ({ ending, ...agg }))
    .sort((a, b) => b.total - a.total || a.ending.localeCompare(b.ending, "fr"));

  return {
    population: { definition: NOUN_POPULATION_DEFINITION, size: population.length, byGenre },
    researchedSuffixes,
    dataDrivenEndings,
    minCount,
  };
}

// ---------------------------------------------------------------------------
// Verb morphology (§26 sufficiency + §60–68 conjugation source)
// ---------------------------------------------------------------------------

export type VerbMorphology = {
  /** Distinct raw 9_InfoVER values over all VER/AUX rows, with counts. */
  infoVerInventory: Record<string, number>;
  /** Distinct atomic mood:tense:person analyses (comma-splits), with counts. */
  atomicAnalyses: Record<string, number>;
  verbs: {
    lemma: string;
    found: boolean;
    rows: {
      mot: string;
      cgram: string;
      infoVer: string;
      nombre: string;
      phono: string;
      ipa: string;
      freqMot: number | null;
      isLem: boolean;
    }[];
  }[];
};

/**
 * Collects the complete inflection row set for each requested verb lemma
 * (5_Cgram VER or AUX — Lexique's auxiliary readings of être/avoir must not
 * be dropped) plus the whole-file InfoVER inventory, so conjugation
 * modeling works from the real value system rather than assumptions.
 */
export function verbMorphology(rows: LexiqueRow[], lemmas: readonly string[]): VerbMorphology {
  const infoVerInventory: Record<string, number> = {};
  const atomicAnalyses: Record<string, number> = {};
  const byLemma = new Map<string, VerbMorphology["verbs"][number]["rows"]>();
  for (const lemma of lemmas) byLemma.set(lemma, []);

  for (const row of rows) {
    const cgram = row[L4.CGRAM] ?? "";
    if (cgram !== "VER" && cgram !== "AUX") continue;
    const info = row[L4.INFOVER] ?? "";
    if (info !== "") {
      infoVerInventory[info] = (infoVerInventory[info] ?? 0) + 1;
      for (const atom of info.split(",")) {
        if (atom === "") continue;
        atomicAnalyses[atom] = (atomicAnalyses[atom] ?? 0) + 1;
      }
    }
    const bucket = byLemma.get(row[L4.LEMME] ?? "");
    if (bucket) {
      bucket.push({
        mot: row[L4.MOT] ?? "",
        cgram,
        infoVer: info,
        nombre: row[L4.NOMBRE] ?? "",
        phono: row[L4.PHONO] ?? "",
        ipa: row[L4.IPA] ?? "",
        freqMot: num(row[L4.FREQ_MOT]),
        isLem: row[L4.IS_LEM] === "1",
      });
    }
  }

  return {
    infoVerInventory,
    atomicAnalyses,
    verbs: [...byLemma.entries()]
      .map(([lemma, verbRows]) => ({
        lemma,
        found: verbRows.length > 0,
        rows: verbRows.sort((a, b) => a.mot.localeCompare(b.mot, "fr") || a.infoVer.localeCompare(b.infoVer)),
      }))
      .sort((a, b) => a.lemma.localeCompare(b.lemma, "fr")),
  };
}

// ---------------------------------------------------------------------------
// 54-core evidence rows (§13–15 cross-check input)
// ---------------------------------------------------------------------------

export type CoreLexemeRows = {
  audit: SourceMatchRow[];
  entries: {
    id: string;
    lookupForm: string;
    lemma: string;
    partOfSpeech: PartOfSpeech;
    /** All source rows whose 1_Mot equals the lookup form, trimmed. */
    formRows: TrimmedRow[];
    /** Other rows of the same 4_Lemme (inflections), non-expressions only. */
    lemmaRows: TrimmedRow[];
  }[];
};

export function coreLexemeRows(lexicon: RichLexicon, rows: LexiqueRow[]): CoreLexemeRows {
  const audit = matchLexemes(lexicon, rows);
  const entries = lexicon.lexemes.map((lex) => {
    // lexiqueFormEquals applies the documented ligature fold (œuf ↔ oeuf).
    const formRows = rows.filter((r) => lexiqueFormEquals(r[L4.MOT], lex.lookupForm)).map(trimRow);
    const lemmaRows =
      lex.partOfSpeech === "expression"
        ? []
        : rows
            .filter(
              (r) =>
                lexiqueFormEquals(r[L4.LEMME], lex.lemma) &&
                !lexiqueFormEquals(r[L4.MOT], lex.lookupForm)
            )
            .map(trimRow);
    const sortKey = (t: TrimmedRow) =>
      `${t.mot}|${t.cgram}|${t.genre}|${t.nombre}`;
    formRows.sort((a, b) => sortKey(a).localeCompare(sortKey(b), "fr"));
    lemmaRows.sort((a, b) => sortKey(a).localeCompare(sortKey(b), "fr"));
    return {
      id: lex.id,
      lookupForm: lex.lookupForm,
      lemma: lex.lemma,
      partOfSpeech: lex.partOfSpeech,
      formRows,
      lemmaRows,
    };
  });
  return { audit, entries };
}
