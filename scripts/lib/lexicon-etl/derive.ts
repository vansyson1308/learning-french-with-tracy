/**
 * Lexicon ETL v2 derivation (P3a). One deterministic pass per language
 * over the retrieved sources in a scratch directory, emitting the
 * committed evidence under content/<lang>/lexicon/derived/:
 *
 *   candidate-pool.json   top lemmas by measured frequency with everything
 *                         the authoring step needs (glosses en/vi, IPA,
 *                         gender, examples, topics, anchors, readings)
 *   frequency-stats.json  population quantiles → bands exactly as French
 *                         (very-common ≥ p99, common ≥ p95)
 *   morphology.json       verb forms → analysis atoms (paradigm evidence)
 *   gender-stats.json     noun gender × ending aggregates (gendered languages)
 *   anchors.json          exam / CEFR level per lemma (or the honest
 *                         "frequency-derived" record when no licence-clean list exists)
 *   readings.json         kana / romanisation / pinyin (ja, ko, zh)
 *   tatoeba-credits.json  contributor usernames of every Tatoeba sentence used
 *
 * Everything is pure over (files on disk, manifest pins); the runner-side
 * workflow and a local developer run produce identical bytes.
 */

import { existsSync } from "fs";
import path from "path";

import type { PartOfSpeech, SourceManifestV2 } from "../../../content/schema";
import { buildPlugin } from "../languages";
import { loadPacks, packsForTarget, readJson, safeResolve } from "../pipeline";

import { readCefrJ, readHsk30, readNgsl, readOpenJlpt, type AnchorTable } from "./adapters/anchors";
import { readCedict, readJmdict, type DictEntry } from "./adapters/dictionaries";
import { readFrequencyWords, readWordfreqCsv, type FrequencyList } from "./adapters/frequency";
import { scanKaikki, viGlossFromSense, type KaikkiLemma, type KaikkiScan } from "./adapters/kaikki";
import { isLearnerSentence, readTatoebaLinks, readTatoebaSentences } from "./adapters/tatoeba";
import { sourcesFor, type SourceSpec } from "./sources";
import { projectTopicFor } from "./topics";
import type { CandidateExample } from "./types";

export const POOL_SIZE = 3000;
/** Function-word entries listed after the content pool (pronouns, determiners, prepositions, conjunctions, interjections). */
export const FUNCTION_POOL_SIZE = 200;
export const CONTENT_POS: readonly PartOfSpeech[] = ["noun", "verb", "adjective", "adverb"];
export const FUNCTION_POS: readonly PartOfSpeech[] = ["pronoun", "determiner", "preposition", "conjunction", "interjection"];
export const POPULATION_DEFINITION =
  "lemma|pos pairs of the content parts of speech (noun, verb, adjective, adverb) that have a kaikki lemma entry and at least one word form in the FrequencyWords list; a word form shared by several lemma entries (any part of speech) splits its count in proportion to each entry's richness (lemma senses + examples + 5 when it has an inflection table), and a closed-class lemma identical to the form absorbs the whole count; lemmas with an upper-case initial (proper nouns, abbreviations — except German nouns), single letters and letter/note names are excluded; per-million is relative to the FrequencyWords list total";
export const BAND_RULE = "very-common = perMillion ≥ p99 of the population; common = ≥ p95; less-common = the rest (identical rule to the French Lexique derivation)";

/** Word shape per script: letters (with the language's diacritics), inner hyphen/apostrophe, no digits. */
const LATIN_SHAPE = /^\p{L}+(?:[-'’]\p{L}+)*$/u;
const CJK_SHAPE = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}ー]+$/u;

export function wordShapeFor(lang: string): RegExp {
  return ["ja", "zh", "ko"].includes(lang) ? CJK_SHAPE : LATIN_SHAPE;
}

/** Italian kaikki forms carry pedagogical stress marks (màngio); only final-syllable accents are orthographic. */
export function normalizeFormFor(lang: string, form: string): string {
  if (lang !== "it") return form;
  const chars = [...form.normalize("NFD")];
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if ((c === "̀" || c === "́") && i < chars.length - 1) {
      // keep the mark only when it sits on the final vowel (e.g. città, perché)
      const rest = chars.slice(i + 1).join("");
      if (/^\p{L}/u.test(rest)) continue;
    }
    out += c;
  }
  return out.normalize("NFC");
}

export type PoolEntry = {
  /** content = noun/verb/adjective/adverb (the ranked population); function = pronoun/determiner/preposition/conjunction/interjection. */
  kind: "content" | "function";
  lemma: string;
  partOfSpeech: PartOfSpeech;
  sourcePos: string;
  gender: "masculine" | "feminine" | "neuter" | "both" | "unknown" | null;
  /** Definite-article form when it differs from the lemma (German adjectival nouns: Deutscher → der Deutsche). */
  definiteForm?: string;
  ipa: string | null;
  glosses: { en: string[]; vi: string[] };
  examples: CandidateExample[];
  /** null for a course-pack word forced into the pool without any frequency-list form (no measurement). */
  frequency: { rank: number; perMillion: number; count: number; band: "very-common" | "common" | "less-common"; zipf: number | null } | null;
  /** Why the entry is in the pool: ranked, or forced because a course pack teaches it. */
  reason: "ranked" | "pack";
  topic: string;
  topicMatched: string | null;
  rawTopics: string[];
  usageTags: string[];
  anchors: Record<string, string>;
  readings: Record<string, string>;
  /** Already authored in content/<lang>/lexicon/lexemes.json (surface→id map) when the run started. */
  alreadyAuthored: boolean;
  forms: number;
};

export type DeriveResult = {
  files: Record<string, unknown>;
  summary: Record<string, number | string>;
};

type AggregatedLemma = {
  key: string;
  lemma: string;
  pos: PartOfSpeech;
  count: number;
  /** Best (lowest) form rank. */
  rank: number;
  forms: Set<string>;
};

function quantile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.ceil(p * sortedAsc.length) - 1));
  return sortedAsc[idx];
}

function round(n: number, digits = 4): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export type DeriveOptions = {
  lang: string;
  /** <sources-dir>/<lang> */
  dir: string;
  manifest: SourceManifestV2;
  log?: (line: string) => void;
  poolSize?: number;
};

function artifact(dir: string, spec: SourceSpec): string {
  return path.join(dir, spec.artifactFilename);
}

function retrievedSpecs(opts: DeriveOptions, role?: SourceSpec["role"]): SourceSpec[] {
  const pinned = new Set(opts.manifest.sources.filter((s) => s.retrieval.status === "retrieved").map((s) => s.artifactFilename));
  return sourcesFor(opts.lang).filter((s) => pinned.has(s.artifactFilename) && existsSync(artifact(opts.dir, s)) && (role === undefined || s.role === role));
}

function sourceStamp(opts: DeriveOptions, id: string) {
  const s = opts.manifest.sources.find((x) => x.id === id && x.retrieval.status === "retrieved");
  return s ? { id, sha256: s.retrieval.sha256, url: s.url, retrievedAt: s.retrieval.retrievedAt } : { id, sha256: null, url: null, retrievedAt: null };
}

export async function deriveLanguage(opts: DeriveOptions): Promise<DeriveResult> {
  const { lang, dir } = opts;
  const log = opts.log ?? (() => {});
  const poolSize = opts.poolSize ?? POOL_SIZE;
  const generator = "scripts/lib/lexicon-etl/derive.ts";
  const shape = wordShapeFor(lang);

  // ---- 1. frequency (primary + secondary) ----------------------------------
  const freqSpec = retrievedSpecs(opts, "frequency")[0];
  if (!freqSpec) throw new Error(`${lang}: the frequency source is not retrieved — nothing to derive (fail-closed)`);
  const freq: FrequencyList = await readFrequencyWords(artifact(dir, freqSpec));
  log(`frequency: ${freq.rows.length} forms, list total ${freq.total}`);
  const wordfreqSpec = retrievedSpecs(opts, "frequency-secondary")[0];
  const zipf = wordfreqSpec ? await readWordfreqCsv(artifact(dir, wordfreqSpec)) : new Map<string, number>();
  if (wordfreqSpec) log(`wordfreq: ${zipf.size} words`);

  // ---- 2. kaikki English edition: lemmas + form-of index (two passes) ------
  const kaikkiSpec = retrievedSpecs(opts, "lexicon")[0];
  if (!kaikkiSpec) throw new Error(`${lang}: the kaikki lexicon source is not retrieved (fail-closed)`);
  // German capitalises every noun, while FrequencyWords lists are lower case:
  // each form is also tried capitalised ("haus" → Haus, "tagen" → Tagen → Tag),
  // or the whole noun class would be lost to verb homographs.
  const caseVariants = (word: string): string[] =>
    lang === "de" && word.length > 0 ? [...new Set([word, word.charAt(0).toUpperCase() + word.slice(1)])] : [word];
  const freqWords = new Set(freq.rows.flatMap((r) => caseVariants(r.word)));
  const pass1: KaikkiScan = await scanKaikki(artifact(dir, kaikkiSpec), {
    lang,
    keepWords: freqWords,
    sourceId: "kaikki-en",
    glossLanguage: "en",
    keepTranslationCode: lang === "en" ? "vi" : undefined,
    onProgress: (n) => log(`kaikki pass 1: ${n} entries`),
  });
  log(`kaikki pass 1: ${pass1.entriesRead} entries read, ${pass1.lemmas.size} lemma entries kept, ${pass1.formOf.size} forms indexed, ${pass1.badLines} bad lines`);
  // Lemmas targeted by a frequency form but absent from the frequency list themselves.
  const missing = new Set<string>();
  for (const targets of pass1.formOf.values()) for (const t of targets) if (!freqWords.has(t)) missing.add(t);
  let lemmas = pass1.lemmas;
  if (missing.size > 0) {
    const pass2 = await scanKaikki(artifact(dir, kaikkiSpec), { lang, keepWords: missing, sourceId: "kaikki-en", glossLanguage: "en", keepTranslationCode: lang === "en" ? "vi" : undefined });
    for (const [k, v] of pass2.lemmas) if (!lemmas.has(k)) lemmas.set(k, v);
    log(`kaikki pass 2: ${missing.size} form targets looked up, ${pass2.lemmas.size} lemma entries added`);
  }

  // ---- 3. lemmatise the frequency list -------------------------------------
  const aggregated = new Map<string, AggregatedLemma>();
  const ALL_POS: readonly PartOfSpeech[] = [...CONTENT_POS, ...FUNCTION_POS, "expression", "other"];
  const posOf = (word: string): PartOfSpeech[] => {
    const out: PartOfSpeech[] = [];
    for (const pos of ALL_POS) if (lemmas.has(`${word}|${pos}`)) out.push(pos);
    return out;
  };
  const letterLike = (entry: KaikkiLemma) =>
    entry.word.length <= 1 || /\b(letter|note of the scale|solfège|alphabet)\b/i.test(entry.glosses[0] ?? "");
  const properLike = (lemma: string, pos: PartOfSpeech) => lang !== "de" && !["ja", "zh", "ko"].includes(lang) && /^\p{Lu}/u.test(lemma) && pos !== "pronoun";
  for (const row of freq.rows) {
    const candidates = new Set<string>();
    for (const word of caseVariants(row.word)) {
      for (const pos of posOf(word)) candidates.add(`${word}|${pos}`);
      for (const target of pass1.formOf.get(word) ?? []) for (const pos of posOf(target)) candidates.add(`${target}|${pos}`);
    }
    if (candidates.size === 0) continue;
    // A closed-class (function) lemma identical to the form absorbs the
    // count of its NOUN homographs: "yo", "no", "que" are pronouns/adverbs/
    // conjunctions first, never "el yo"; German nominalisations (das Ich,
    // das Ja, das Aus) never ride on the lower-case form either. Only a
    // PLAIN function reading absorbs (not the dated interjection "nicht?"),
    // and adverbs / adjectives / verbs keep their share (auch, noch, nur
    // beside their interjection or conjunction readings). Known cost: the
    // archaic preposition "zeit" leaves the noun Zeit only its other forms.
    const functionDirect = [...candidates].some((key) => {
      const entry = lemmas.get(key)!;
      return entry.word === row.word && FUNCTION_POS.includes(entry.pos) && entry.usageTags.length === 0;
    });
    const weights = [...candidates].map((key) => {
      const entry = lemmas.get(key)!;
      // Letter / note readings and proper-noun homographs never absorb the count of an ordinary word.
      if (letterLike(entry) || properLike(entry.word, entry.pos)) return 0;
      if (functionDirect && entry.pos === "noun") return 0;
      // Richness of the reading: senses, examples and an inflection table (a verb with 200 forms
      // outweighs the nominalised infinitive "ser (a being)" that shares its bare form).
      return Math.max(1, entry.senseCount) + entry.examples.length + (entry.forms.length > 0 ? 5 : 0);
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    [...candidates].forEach((key, i) => {
      if (totalWeight === 0 || weights[i] === 0) return;
      const share = (row.count * weights[i]) / totalWeight;
      const [lemma, pos] = key.split("|") as [string, PartOfSpeech];
      const agg = aggregated.get(key) ?? { key, lemma, pos, count: 0, rank: Number.POSITIVE_INFINITY, forms: new Set<string>() };
      agg.count += share;
      agg.rank = Math.min(agg.rank, row.rank);
      agg.forms.add(row.word);
      aggregated.set(key, agg);
    });
  }
  const eligible = [...aggregated.values()]
    .filter((a) => shape.test(a.lemma) && !letterLike(lemmas.get(a.key)!) && !properLike(a.lemma, a.pos))
    .map((a) => ({ ...a, perMillion: (a.count / freq.total) * 1e6 }))
    .sort((a, b) => b.perMillion - a.perMillion || a.lemma.localeCompare(b.lemma) || a.pos.localeCompare(b.pos));
  const population = eligible.filter((a) => CONTENT_POS.includes(a.pos));
  population.forEach((p, i) => (p.rank = i + 1));
  const functionWords = eligible.filter((a) => FUNCTION_POS.includes(a.pos)).slice(0, FUNCTION_POOL_SIZE);
  functionWords.forEach((p, i) => (p.rank = i + 1));
  const perMillionAsc = population.map((p) => p.perMillion).sort((a, b) => a - b);
  const quantiles = { p50: round(quantile(perMillionAsc, 0.5)), p90: round(quantile(perMillionAsc, 0.9)), p95: round(quantile(perMillionAsc, 0.95)), p99: round(quantile(perMillionAsc, 0.99)) };
  // Bands are decided on the ROUNDED per-million (the value the lexeme stores and the validator recomputes from).
  const bandOf = (pm: number) => (round(pm) >= quantiles.p99 ? "very-common" : round(pm) >= quantiles.p95 ? "common" : "less-common") as "very-common" | "common" | "less-common";
  const byPos: Record<string, number> = {};
  for (const p of population) byPos[p.pos] = (byPos[p.pos] ?? 0) + 1;
  log(`population: ${population.length} lemmas (${JSON.stringify(byPos)}); p95=${quantiles.p95} p99=${quantiles.p99}`);

  // ---- 4. Vietnamese edition glosses + examples ----------------------------
  const viSpec = retrievedSpecs(opts, "gloss-vi")[0];
  const viLemmas = new Map<string, KaikkiLemma>();
  if (viSpec) {
    const scan = await scanKaikki(artifact(dir, viSpec), { lang, sourceId: "kaikki-vi", glossLanguage: "vi", maxExamples: 3 });
    for (const [k, v] of scan.lemmas) viLemmas.set(k, v);
    log(`kaikki-vi: ${scan.lemmas.size} lemma entries`);
  }

  // ---- 5. anchors + dictionaries --------------------------------------------
  const anchorTables: AnchorTable[] = [];
  const dictionaries = new Map<string, Map<string, DictEntry>>();
  // Course-pack words of the target are always in the pool (the authoring step must cover them):
  // their lookup forms (and, for plural surfaces, the kaikki form-of lemma) that the ranking left out.
  const plugin = buildPlugin(lang);
  const packLookups = new Set<string>();
  for (const { pack } of packsForTarget(lang, loadPacks())) {
    if (pack.testOnly) continue;
    for (const section of pack.sections) for (const unit of section.units) for (const w of unit.words ?? []) {
      const rest = plugin.splitSurfaceArticle(w.target).rest;
      packLookups.add(rest);
      for (const target of pass1.formOf.get(rest) ?? []) packLookups.add(target);
    }
  }
  const ranked = [...population.slice(0, poolSize), ...functionWords];
  const rankedKeys = new Set(ranked.map((p) => p.key));
  const forced: typeof ranked = [];
  for (const lookup of packLookups) {
    for (const pos of ALL_POS) {
      const key = `${lookup}|${pos}`;
      if (rankedKeys.has(key) || !lemmas.has(key)) continue;
      const agg = aggregated.get(key);
      const inPopulation = eligible.find((e) => e.key === key);
      forced.push(inPopulation ?? { key, lemma: lookup, pos, count: agg?.count ?? 0, rank: Number.POSITIVE_INFINITY, forms: agg?.forms ?? new Set<string>(), perMillion: agg ? (agg.count / freq.total) * 1e6 : 0 });
      rankedKeys.add(key);
    }
  }
  forced.sort((a, b) => a.lemma.localeCompare(b.lemma) || a.pos.localeCompare(b.pos));
  const poolCandidates = [...ranked, ...forced];
  const forcedKeys = new Set(forced.map((p) => p.key));
  const poolWords = new Set(poolCandidates.map((p) => p.lemma));
  for (const spec of retrievedSpecs(opts)) {
    const file = artifact(dir, spec);
    if (spec.id === "openjlpt") anchorTables.push(readOpenJlpt(file.replace(/\.tar\.gz$/, "")));
    else if (spec.id === "hsk30") anchorTables.push(readHsk30(file));
    else if (spec.id === "cefr-j") anchorTables.push(readCefrJ(file));
    else if (spec.id === "ngsl") anchorTables.push(readNgsl(file));
    else if (spec.id === "jmdict") dictionaries.set("jmdict", readJmdict(file, poolWords));
    else if (spec.id === "cedict") dictionaries.set("cedict", await readCedict(file, poolWords));
  }
  for (const t of anchorTables) log(`anchor ${t.source}: ${t.levels.size} entries`);
  for (const [id, d] of dictionaries) log(`dictionary ${id}: ${d.size} pool entries matched`);

  // ---- 6. Tatoeba fallback examples for pool lemmas without any -----------
  const tatoebaCredits: Record<string, string> = {};
  const tatoebaExamples = new Map<string, CandidateExample[]>();
  const sentencesSpec = sourcesFor(lang).find((s) => s.id === "tatoeba" && s.artifactFilename === `tatoeba-${lang}-sentences.tsv`);
  const linksEnSpec = sourcesFor(lang).find((s) => s.artifactFilename === `tatoeba-${lang}-links-en.tsv`);
  const linksViSpec = sourcesFor(lang).find((s) => s.artifactFilename === `tatoeba-${lang}-links-vi.tsv`);
  const engSpec = sourcesFor(lang).find((s) => s.artifactFilename === "tatoeba-eng-sentences.tsv");
  const vieSpec = sourcesFor(lang).find((s) => s.artifactFilename === "tatoeba-vie-sentences.tsv");
  const retrievedFiles = new Set(retrievedSpecs(opts).map((s) => s.artifactFilename));
  if (sentencesSpec && retrievedFiles.has(sentencesSpec.artifactFilename)) {
    const needing = poolCandidates.filter((p) => (lemmas.get(p.key)?.examples.length ?? 0) === 0);
    const formToKeys = new Map<string, string[]>();
    for (const p of needing) {
      const forms = new Set<string>([p.lemma, ...p.forms]);
      for (const f of forms) {
        const list = formToKeys.get(f.toLowerCase()) ?? [];
        list.push(p.key);
        formToKeys.set(f.toLowerCase(), list);
      }
    }
    const tokenRe = ["ja", "zh"].includes(lang) ? null : /[\p{L}'’-]+/gu;
    const perKey = new Map<string, { id: number; text: string; username: string }[]>();
    const sentences = await readTatoebaSentences(artifact(dir, sentencesSpec), (text) => {
      if (!isLearnerSentence(text)) return false;
      if (tokenRe === null) {
        for (const [form, keys] of formToKeys) if (text.includes(form)) return keys.length > 0;
        return false;
      }
      for (const m of text.matchAll(tokenRe)) if (formToKeys.has(m[0].toLowerCase())) return true;
      return false;
    });
    for (const s of sentences.values()) {
      const hit = new Set<string>();
      if (tokenRe === null) {
        for (const [form, keys] of formToKeys) if (s.text.includes(form)) keys.forEach((k) => hit.add(k));
      } else {
        for (const m of s.text.matchAll(tokenRe)) for (const k of formToKeys.get(m[0].toLowerCase()) ?? []) hit.add(k);
      }
      for (const k of hit) {
        const list = perKey.get(k) ?? [];
        if (list.length < 6) list.push(s);
        perKey.set(k, list);
      }
    }
    const wantedIds = new Set<number>();
    for (const list of perKey.values()) for (const s of list) wantedIds.add(s.id);
    const linksEn = linksEnSpec && retrievedFiles.has(linksEnSpec.artifactFilename) ? await readTatoebaLinks(artifact(dir, linksEnSpec), wantedIds) : new Map<number, number[]>();
    const linksVi = linksViSpec && retrievedFiles.has(linksViSpec.artifactFilename) ? await readTatoebaLinks(artifact(dir, linksViSpec), wantedIds) : new Map<number, number[]>();
    const engIds = new Set<number>();
    for (const l of linksEn.values()) l.forEach((id) => engIds.add(id));
    const vieIds = new Set<number>();
    for (const l of linksVi.values()) l.forEach((id) => vieIds.add(id));
    const eng = engSpec && retrievedFiles.has(engSpec.artifactFilename) && engIds.size > 0 ? await readTatoebaSentences(artifact(dir, engSpec), () => true, engIds) : new Map();
    const vie = vieSpec && retrievedFiles.has(vieSpec.artifactFilename) && vieIds.size > 0 ? await readTatoebaSentences(artifact(dir, vieSpec), () => true, vieIds) : new Map();
    for (const [key, list] of perKey) {
      const examples: CandidateExample[] = [];
      for (const s of [...list].sort((a, b) => a.text.length - b.text.length || a.id - b.id)) {
        const en = lang === "en" ? s : (linksEn.get(s.id) ?? []).map((id) => eng.get(id)).find((x) => x && isLearnerSentence(x.text, 90));
        if (!en) continue;
        const vi = (linksVi.get(s.id) ?? []).map((id) => vie.get(id)).find((x) => x);
        examples.push({ target: s.text, translations: { en: en.text, ...(vi ? { vi: vi.text } : {}) }, source: "tatoeba", key: `${s.id}|${en.id}${vi ? `|${vi.id}` : ""}` });
        tatoebaCredits[String(s.id)] = s.username;
        tatoebaCredits[String(en.id)] = en.username;
        if (vi) tatoebaCredits[String(vi.id)] = vi.username;
        if (examples.length >= 2) break;
      }
      if (examples.length > 0) tatoebaExamples.set(key, examples);
    }
    log(`tatoeba: ${needing.length} pool lemmas without kaikki examples, ${tatoebaExamples.size} got sentence pairs`);
  }

  // ---- 7. the pool ------------------------------------------------------------
  const authoredPath = `content/${lang}/lexemes.json`;
  const authored = existsSync(safeResolve(authoredPath)) ? new Set(Object.values(readJson(authoredPath) as Record<string, string>)) : new Set<string>();
  const slugOf = (lemma: string) => lemma.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const pool: PoolEntry[] = [];
  for (const p of poolCandidates) {
    const entry = lemmas.get(p.key)!;
    const vi = viLemmas.get(p.key);
    const viGlosses = vi ? vi.glosses.map(viGlossFromSense).filter((g): g is string => g !== null) : [];
    if (lang === "en") viGlosses.push(...entry.viTranslations);
    const anchors: Record<string, string> = {};
    for (const t of anchorTables) {
      const lvl = t.levels.get(`${p.lemma}|${p.pos}`) ?? t.levels.get(p.lemma);
      if (lvl) anchors[t.source] = lvl;
    }
    const readings = { ...entry.readings };
    const jm = dictionaries.get("jmdict")?.get(p.lemma);
    if (jm && !readings.kana) readings.kana = jm.reading;
    const cd = dictionaries.get("cedict")?.get(p.lemma);
    if (cd && !readings.pinyin) readings.pinyin = cd.reading;
    const enGlosses = entry.glosses.length > 0 ? entry.glosses : (jm?.glosses ?? cd?.glosses ?? []);
    const examples: CandidateExample[] = [...entry.examples, ...(vi?.examples ?? []), ...(tatoebaExamples.get(p.key) ?? [])];
    const { topic, matched } = projectTopicFor(entry.topics);
    pool.push({
      kind: CONTENT_POS.includes(p.pos) ? "content" : "function",
      lemma: p.lemma,
      partOfSpeech: p.pos,
      sourcePos: entry.sourcePos,
      gender: p.pos === "noun" ? (entry.gender ?? "unknown") : null,
      ...(p.pos === "noun" && entry.definiteForm ? { definiteForm: entry.definiteForm } : {}),
      ipa: entry.ipa ?? null,
      glosses: { en: [...new Set(enGlosses)].slice(0, 3), vi: [...new Set(viGlosses)].slice(0, 3) },
      examples: examples.slice(0, 4),
      frequency: Number.isFinite(p.rank) ? { rank: p.rank, perMillion: round(p.perMillion), count: round(p.count, 1), band: bandOf(p.perMillion), zipf: zipf.get(p.lemma) ?? null } : null,
      reason: forcedKeys.has(p.key) ? "pack" : "ranked",
      topic,
      topicMatched: matched,
      rawTopics: entry.topics,
      usageTags: entry.usageTags,
      anchors,
      readings,
      alreadyAuthored: authored.has(`${lang}:w:${slugOf(p.lemma)}`),
      forms: entry.forms.length,
    });
  }

  // ---- 8. morphology (verbs of the pool) ---------------------------------------
  const verbs = pool
    .filter((p) => p.partOfSpeech === "verb")
    .map((p) => {
      const entry = lemmas.get(`${p.lemma}|verb`)!;
      const rows = entry.forms.map((f) => ({ mot: normalizeFormFor(lang, f.form), infoVer: f.atoms.join(",") }));
      rows.unshift({ mot: p.lemma, infoVer: "inf" });
      const seen = new Set<string>();
      return { lemma: p.lemma, rows: rows.filter((r) => (seen.has(`${r.mot}|${r.infoVer}`) ? false : (seen.add(`${r.mot}|${r.infoVer}`), true))) };
    });
  const atomInventory: Record<string, number> = {};
  for (const v of verbs) for (const r of v.rows) for (const a of r.infoVer.split(",")) atomInventory[a] = (atomInventory[a] ?? 0) + 1;

  // ---- 9. gender × ending ---------------------------------------------------------
  const genderNouns = population.filter((p) => p.pos === "noun" && lemmas.get(p.key)?.gender);
  const endings: Record<string, Record<string, number>> = {};
  for (const p of genderNouns) {
    const g = lemmas.get(p.key)!.gender!;
    for (const n of [1, 2, 3]) {
      if (p.lemma.length <= n) continue;
      const e = p.lemma.slice(-n).toLowerCase();
      endings[e] = endings[e] ?? {};
      endings[e][g] = (endings[e][g] ?? 0) + 1;
    }
  }
  const dataDrivenEndings = Object.entries(endings)
    .map(([ending, counts]) => ({ ending, total: Object.values(counts).reduce((a, b) => a + b, 0), counts }))
    .filter((e) => e.total >= 20)
    .sort((a, b) => b.total - a.total || a.ending.localeCompare(b.ending));

  // ---- 10. anchors + readings files -------------------------------------------------
  const anchorLevels: Record<string, Record<string, string>> = {};
  for (const t of anchorTables) {
    const levels: Record<string, string> = {};
    for (const p of pool) {
      const lvl = t.levels.get(`${p.lemma}|${p.partOfSpeech}`) ?? t.levels.get(p.lemma);
      if (lvl) levels[`${p.lemma}|${p.partOfSpeech}`] = lvl;
    }
    anchorLevels[t.source] = levels;
  }
  const readingsFile: Record<string, Record<string, string>> = {};
  if (["ja", "ko", "zh"].includes(lang)) for (const p of pool) if (Object.keys(p.readings).length > 0) readingsFile[`${p.lemma}|${p.partOfSpeech}`] = p.readings;

  const stamp = (id: string) => sourceStamp(opts, id);
  const files: Record<string, unknown> = {
    "candidate-pool.json": {
      generator,
      language: lang,
      sources: [...new Set(["frequencywords", "kaikki-en", ...(viSpec ? ["kaikki-vi"] : []), ...(wordfreqSpec ? ["wordfreq"] : []), ...(tatoebaExamples.size ? ["tatoeba"] : []), ...anchorTables.map((t) => t.source), ...dictionaries.keys()])].map(stamp),
      criteria: `top ${poolSize} of the population by per-million, then the top ${FUNCTION_POOL_SIZE} function-word entries (${POPULATION_DEFINITION}); bands: ${BAND_RULE}; function-word ranks are within their own list and bands use the content population thresholds`,
      entries: pool,
    },
    "frequency-stats.json": {
      source: stamp("frequencywords"),
      generator,
      population: { definition: POPULATION_DEFINITION, size: population.length, byPos, listForms: freq.rows.length, listTotal: freq.total },
      freqLemme: { unit: "occurrences per million words of the FrequencyWords list", quantiles },
      bandRule: BAND_RULE,
      ...(wordfreqSpec ? { secondary: { ...stamp("wordfreq"), words: zipf.size, unit: "Zipf (log10 per billion)" } } : {}),
    },
    "morphology.json": {
      source: stamp("kaikki-en"),
      generator,
      notation: "atoms per form: mood:tense:person (ind|sub|imp|con : pre|pas|imp|fut : 1|2|3), inf, par:pas, par:pre, ger, sg|pl, f|m|n, case atoms; comma-joined in infoVer (French Lexique style)",
      atomInventory,
      verbs,
    },
    "gender-stats.json": {
      source: stamp("kaikki-en"),
      generator,
      population: { definition: "nouns of the frequency population whose kaikki entry carries a gender", size: genderNouns.length },
      minCount: 20,
      dataDrivenEndings,
    },
    "anchors.json": {
      generator,
      sources: anchorTables.map((t) => stamp(t.source)),
      status: anchorTables.length > 0 ? "anchored" : "frequency-derived",
      note:
        anchorTables.length > 0
          ? "levels are facts about the cited lists; no list text ships"
          : "no licence-clean CEFR/exam list exists for this language (plan/06-RESEARCH-OPEN-RESOURCES.md §1): bands come from the frequency population only; exam syllabi are human selectors, never copied",
      levels: anchorLevels,
    },
    ...(lang === "en"
      ? {
          "vi-bridge.json": {
            sources: [stamp("kaikki-en"), ...(viSpec ? [stamp("kaikki-vi")] : [])],
            generator,
            note: "English lemma|pos -> Vietnamese drafts: the English Wiktionary translation tables (code vi) and the Vietnamese Wiktionary's senses of the English word, over the whole eligible frequency population; the authoring step of OTHER target languages may bridge an English gloss to a Vietnamese draft through this table (always flagged for review, never silent)",
            entries: Object.fromEntries(
              eligible
                .map((e) => {
                  const fromTables = lemmas.get(e.key)?.viTranslations ?? [];
                  const fromVi = (viLemmas.get(e.key)?.glosses ?? []).map(viGlossFromSense).filter((g): g is string => g !== null);
                  const drafts = [...new Set([...fromVi, ...fromTables])].slice(0, 6);
                  return [e.key, drafts] as const;
                })
                .filter(([, drafts]) => drafts.length > 0)
            ),
          },
        }
      : {}),
    ...(Object.keys(readingsFile).length > 0 ? { "readings.json": { generator, sources: [...dictionaries.keys(), "kaikki-en"].map(stamp), readings: readingsFile } } : {}),
    ...(Object.keys(tatoebaCredits).length > 0 ? { "tatoeba-credits.json": { source: stamp("tatoeba"), generator, license: "CC-BY-2.0-FR", credits: tatoebaCredits } } : {}),
  };
  const summary: Record<string, number | string> = {
    population: population.length,
    pool: pool.length,
    functionWords: functionWords.length,
    forcedPackWords: forced.length,
    poolWithEnGloss: pool.filter((p) => p.glosses.en.length > 0).length,
    poolWithViGloss: pool.filter((p) => p.glosses.vi.length > 0).length,
    poolWithExample: pool.filter((p) => p.examples.length > 0).length,
    poolWithIpa: pool.filter((p) => p.ipa !== null).length,
    verbsWithMorphology: verbs.filter((v) => v.rows.length > 1).length,
    anchored: pool.filter((p) => Object.keys(p.anchors).length > 0).length,
    p95: quantiles.p95,
    p99: quantiles.p99,
  };
  return { files, summary };
}
