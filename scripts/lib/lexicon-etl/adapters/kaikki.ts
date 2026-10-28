/**
 * kaikki.org / Wiktextract adapter (P3a). Streams one per-language JSONL
 * dump (English edition: lemma, POS, forms, gender, IPA, English glosses,
 * examples with English translations; Vietnamese edition: Vietnamese
 * glosses and examples) and keeps only what the derivation needs:
 *
 *   - lemma entries of the candidate parts of speech (never `name`,
 *     affixes, characters, symbols);
 *   - the form-of index (inflected form → lemma) so the frequency list's
 *     word forms can be lemmatised;
 *   - for the English edition of the ENGLISH language only: the
 *     `translations[]` rows with `code: "vi"` (Vietnamese glosses of
 *     English words — the only edition where translation tables exist).
 *
 * Memory stays bounded by passing the set of words worth keeping (the
 * frequency list's forms); everything else is skipped while streaming.
 */

import type { PartOfSpeech } from "../../../../content/schema";
import { readJsonl } from "../jsonl";
import type { CandidateExample, CandidateForm, FormOfIndex, SourcedGloss } from "../types";

/** kaikki `pos` → the project's part-of-speech vocabulary (unmapped = skipped). */
export const KAIKKI_POS: Readonly<Record<string, PartOfSpeech>> = {
  noun: "noun",
  verb: "verb",
  adj: "adjective",
  adv: "adverb",
  pron: "pronoun",
  det: "determiner",
  article: "determiner",
  prep: "preposition",
  conj: "conjunction",
  intj: "interjection",
  num: "determiner",
  phrase: "expression",
  particle: "other",
  postp: "preposition",
  counter: "other",
  classifier: "other",
  adnominal: "determiner",
  adj_noun: "adjective",
  adv_phrase: "expression",
};

export type KaikkiSense = {
  glosses?: string[];
  raw_glosses?: string[];
  tags?: string[];
  topics?: string[];
  form_of?: { word: string }[];
  alt_of?: { word: string }[];
  examples?: { text?: string; english?: string; translation?: string; type?: string; ref?: string }[];
  categories?: { name?: string; orig?: string; kind?: string }[];
};

export type KaikkiEntry = {
  word: string;
  pos: string;
  lang_code: string;
  senses?: KaikkiSense[];
  forms?: { form: string; tags?: string[]; raw_tags?: string[]; roman?: string }[];
  sounds?: { ipa?: string; other?: string; zh_pron?: string; tags?: string[]; hangeul?: string }[];
  head_templates?: { name?: string; args?: Record<string, string> }[];
  translations?: { code?: string; lang?: string; word?: string; sense?: string }[];
  categories?: { name?: string; orig?: string; kind?: string }[];
  tags?: string[];
};

/** One kept kaikki entry, reduced to the derivation's needs. */
export type KaikkiLemma = {
  word: string;
  pos: PartOfSpeech;
  sourcePos: string;
  gender?: "masculine" | "feminine" | "neuter" | "both";
  ipa?: string;
  /** First-sense glosses (one string per sense, cleaned), in sense order. */
  glosses: string[];
  /** Number of lemma (non form-of) senses — the weight a shared word form's count is split by. */
  senseCount: number;
  examples: CandidateExample[];
  forms: CandidateForm[];
  topics: string[];
  usageTags: string[];
  /** Readings from head templates / sounds (ja kana, ko romanization, zh pinyin). */
  readings: Record<string, string>;
  /** English-edition `translations[]` with code vi (English target only). */
  viTranslations: string[];
};

export type KaikkiScan = {
  lemmas: Map<string, KaikkiLemma>; // key `${word}|${pos}`
  formOf: FormOfIndex;
  entriesRead: number;
  badLines: number;
};

const USAGE_TAGS = new Set([
  "vulgar",
  "offensive",
  "derogatory",
  "slang",
  "obsolete",
  "archaic",
  "dated",
  "rare",
  "abbreviation",
  "initialism",
  "acronym",
  "proper-noun",
  "misspelling",
  "alt-of",
  "nonstandard",
  "humorous",
  "pejorative",
  "ethnic",
  "historical",
  "in-plural",
  "letter",
  "symbol",
]);

/** Tags that mark an inflected-form entry (not a lemma). */
const FORM_TAGS = new Set(["form-of", "alt-of", "inflection"]);

function isFormOfSense(s: KaikkiSense): boolean {
  if (s.form_of && s.form_of.length > 0) return true;
  if (s.alt_of && s.alt_of.length > 0) return true;
  return (s.tags ?? []).some((t) => FORM_TAGS.has(t));
}

/** Strip wiki noise from a gloss: labels in parentheses at the start, trailing qualifiers. */
export function cleanGloss(gloss: string): string {
  let g = gloss.trim();
  g = g.replace(/^\([^)]*\)\s*/, ""); // leading (label)
  g = g.replace(/\s*\((?:Classifier|classifier)[^)]*\)/g, ""); // zh classifiers
  g = g.replace(/\s*\[[^\]]*\]/g, "");
  g = g.replace(/\s+/g, " ").trim();
  g = g.replace(/[.;:]\s*$/, "");
  return g;
}

/** First usable gloss text of a sense (joined sub-glosses are kaikki's "gloss tree"; keep the leaf). */
function senseGloss(s: KaikkiSense): string | null {
  const list = s.glosses ?? [];
  if (list.length === 0) return null;
  const leaf = list[list.length - 1];
  const cleaned = cleanGloss(leaf);
  return cleaned.length > 0 ? cleaned : null;
}

function genderFromTags(tags: Iterable<string>): KaikkiLemma["gender"] | undefined {
  let m = false;
  let f = false;
  let n = false;
  for (const t of tags) {
    if (t === "masculine") m = true;
    else if (t === "feminine") f = true;
    else if (t === "neuter") n = true;
  }
  if (n && !m && !f) return "neuter";
  if (m && f) return "both";
  if (m) return "masculine";
  if (f) return "feminine";
  return undefined;
}

/** `es-noun`/`it-noun`/`pt-noun` head templates carry the gender as arg 1 (`m`, `f`, `mf`, `m-p`…). */
function genderFromHead(entry: KaikkiEntry): KaikkiLemma["gender"] | undefined {
  for (const h of entry.head_templates ?? []) {
    const arg = h.args?.["1"];
    if (!arg || !/-noun$/.test(h.name ?? "")) continue;
    const g = arg.split(",")[0].split("-")[0];
    if (g === "mf" || g === "mfbysense" || g === "mfequiv") return "both";
    if (g === "m") return "masculine";
    if (g === "f") return "feminine";
    if (g === "n") return "neuter";
  }
  return undefined;
}

/**
 * Analysis atoms of an inflected form from kaikki tags, in the notation
 * the paradigm plugins consume (French Lexique style): `ind:pre:1`,
 * `sub:pre:3`, `imp:pre:2`, `ind:pas:1` (preterite / simple past),
 * `ind:imp:1` (imperfect), `ind:fut:1`, `con:pre:1`, `inf`, `par:pas`,
 * `ger`; number as a separate atom `sg` / `pl`; nominal atoms `f`, `pl`.
 * Tags outside the vocabulary are kept raw for audit, never guessed.
 */
export function atomsFromTags(tags: readonly string[]): string[] {
  const set = new Set(tags);
  const atoms: string[] = [];
  if (set.has("combined-form") || set.has("table-tags") || set.has("inflection-template") || set.has("canonical") || set.has("romanization")) {
    return [];
  }
  if (set.has("infinitive") && !set.has("object-third-person")) atoms.push("inf");
  if (set.has("participle") && set.has("past")) atoms.push("par:pas");
  if (set.has("participle") && set.has("present")) atoms.push("par:pre");
  if (set.has("gerund")) atoms.push("ger");
  const person = set.has("first-person") ? "1" : set.has("second-person") ? "2" : set.has("third-person") ? "3" : null;
  if (person !== null && !set.has("participle")) {
    const mood = set.has("subjunctive") ? "sub" : set.has("imperative") ? "imp" : set.has("conditional") ? "con" : "ind";
    const tense = set.has("present")
      ? "pre"
      : set.has("preterite") || (set.has("past") && !set.has("imperfect") && !set.has("participle"))
        ? "pas"
        : set.has("imperfect")
          ? "imp"
          : set.has("future")
            ? "fut"
            : mood === "imp"
              ? "pre"
              : null;
    if (tense !== null) atoms.push(`${mood}:${tense}:${person}`);
  }
  if (set.has("plural")) atoms.push("pl");
  else if (set.has("singular")) atoms.push("sg");
  if (set.has("feminine")) atoms.push("f");
  if (set.has("masculine")) atoms.push("m");
  if (set.has("neuter")) atoms.push("n");
  if (set.has("genitive")) atoms.push("gen");
  if (set.has("dative")) atoms.push("dat");
  if (set.has("accusative")) atoms.push("acc");
  if (set.has("nominative")) atoms.push("nom");
  if (set.has("comparative")) atoms.push("comp");
  if (set.has("superlative")) atoms.push("sup");
  if (set.has("formal")) atoms.push("formal");
  if (set.has("informal")) atoms.push("informal");
  return atoms;
}

function ipaOf(entry: KaikkiEntry): string | undefined {
  // Prefer the broad transcription /…/, then narrow […]; pt prefers Brazil.
  const sounds = entry.sounds ?? [];
  const ipa = sounds.filter((s) => typeof s.ipa === "string" && s.ipa.length > 0);
  if (ipa.length === 0) return undefined;
  const brazil = ipa.find((s) => (s.tags ?? []).includes("Brazil") && s.ipa!.startsWith("/"));
  const broad = brazil ?? ipa.find((s) => s.ipa!.startsWith("/"));
  const chosen = (broad ?? ipa[0]).ipa!;
  return chosen.replace(/^[/[]|[/\]]$/g, "");
}

function readingsOf(entry: KaikkiEntry): Record<string, string> {
  const out: Record<string, string> = {};
  for (const h of entry.head_templates ?? []) {
    if (/^ja-/.test(h.name ?? "") && h.args?.["1"] && /^[぀-ヿ・ー]+$/.test(h.args["1"])) out.kana = h.args["1"];
  }
  for (const f of entry.forms ?? []) {
    const tags = f.tags ?? [];
    if (tags.includes("romanization") && !out.romanization && /^[A-Za-zāēīōūâêîôû' -]+$/.test(f.form)) out.romanization = f.form;
    if (tags.includes("hiragana") && !tags.includes("historical") && !out.kana) out.kana = f.form;
  }
  for (const s of entry.sounds ?? []) {
    const tags = s.tags ?? [];
    if (s.zh_pron && tags.includes("Mandarin") && tags.includes("Standard") && tags.includes("Pinyin") && !out.pinyin) out.pinyin = s.zh_pron;
    if (s.other && !out.kana && /^[぀-ヿ・ー]+$/.test(s.other)) out.kana = s.other;
  }
  return out;
}

function topicsOf(entry: KaikkiEntry, lang: string): string[] {
  const topics = new Set<string>();
  const addCat = (c: { orig?: string; name?: string } | undefined) => {
    if (!c) return;
    const orig = c.orig ?? "";
    if (orig.startsWith(`${lang}:`)) topics.add(orig.slice(lang.length + 1).toLowerCase());
  };
  for (const c of entry.categories ?? []) addCat(c);
  for (const s of entry.senses ?? []) {
    for (const t of s.topics ?? []) topics.add(t.toLowerCase());
    for (const c of s.categories ?? []) addCat(c);
  }
  return [...topics].sort();
}

export type KaikkiScanOptions = {
  lang: string;
  /** Keep a lemma entry only when its word is in this set (undefined = keep all). */
  keepWords?: ReadonlySet<string>;
  /** Also keep form-of entries whose target lemma is in `keepWords` (to lemmatise the frequency list). */
  keepFormsOf?: boolean;
  /** Maximum examples per lemma kept from the senses. */
  maxExamples?: number;
  /** The source id written into examples (kaikki-en / kaikki-vi). */
  sourceId: string;
  /** Native code the senses are written in (en for the English edition, vi for the Vietnamese one). */
  glossLanguage: string;
  /** English-edition translations[] to keep (code), English target only. */
  keepTranslationCode?: string;
  /** Optional progress callback every N entries. */
  onProgress?: (entries: number) => void;
};

/** Stream a kaikki dump and collect lemmas + the form-of index. */
export async function scanKaikki(path: string, opts: KaikkiScanOptions): Promise<KaikkiScan> {
  const lemmas = new Map<string, KaikkiLemma>();
  const formOf: FormOfIndex = new Map();
  let entriesRead = 0;
  let badLines = 0;
  const maxExamples = opts.maxExamples ?? 4;
  for await (const entry of readJsonl<KaikkiEntry>(path, () => (badLines += 1))) {
    entriesRead += 1;
    if (opts.onProgress && entriesRead % 100_000 === 0) opts.onProgress(entriesRead);
    if (entry.lang_code !== opts.lang || typeof entry.word !== "string") continue;
    const pos = KAIKKI_POS[entry.pos];
    const senses = entry.senses ?? [];
    // Form-of index: every sense pointing at a lemma.
    for (const s of senses) {
      for (const target of [...(s.form_of ?? []), ...(s.alt_of ?? [])]) {
        if (typeof target.word !== "string") continue;
        if (opts.keepWords && !opts.keepWords.has(target.word) && !opts.keepWords.has(entry.word)) continue;
        let set = formOf.get(entry.word);
        if (!set) {
          set = new Set();
          formOf.set(entry.word, set);
        }
        set.add(target.word);
      }
    }
    if (pos === undefined) continue;
    if (opts.keepWords && !opts.keepWords.has(entry.word)) continue;
    const lemmaSenses = senses.filter((s) => !isFormOfSense(s));
    if (lemmaSenses.length === 0) continue;
    const key = `${entry.word}|${pos}`;
    const existing = lemmas.get(key);
    const glosses: string[] = [];
    const examples: CandidateExample[] = [];
    const usage = new Set<string>();
    const senseTags = new Set<string>();
    // A usage tag (dated, slang…) restricts one sense, not the word: the lemma is restricted only
    // when every sense is, and beside plain senses the tagged ones contribute no gloss or example.
    const isRestricted = (s: KaikkiSense) => (s.tags ?? []).some((t) => USAGE_TAGS.has(t));
    const hasPlainSense = lemmaSenses.some((s) => !isRestricted(s));
    lemmaSenses.forEach((s, i) => {
      for (const t of s.tags ?? []) {
        senseTags.add(t);
        if (!hasPlainSense && USAGE_TAGS.has(t)) usage.add(t);
      }
      if (hasPlainSense && isRestricted(s)) return;
      const g = senseGloss(s);
      if (g) glosses.push(g);
      for (const ex of s.examples ?? []) {
        if (examples.length >= maxExamples) break;
        if (typeof ex.text !== "string" || ex.type === "quotation" || ex.ref) continue;
        const text = ex.text.replace(/\s+/g, " ").trim();
        const translation = (ex.english ?? ex.translation ?? "").replace(/\s+/g, " ").trim();
        if (text.length === 0 || translation.length === 0) continue;
        examples.push({
          target: text,
          translations: { [opts.glossLanguage]: translation },
          source: opts.sourceId,
          key: `${entry.word}|${entry.pos}|${i}`,
        });
      }
    });
    for (const t of entry.tags ?? []) if (USAGE_TAGS.has(t)) usage.add(t);
    const forms: CandidateForm[] = [];
    for (const f of entry.forms ?? []) {
      if (typeof f.form !== "string") continue;
      const tags = f.tags ?? [];
      const atoms = atomsFromTags(tags);
      if (atoms.length === 0) continue;
      forms.push({ form: f.form, atoms, rawTags: tags });
    }
    const viTranslations: string[] = [];
    if (opts.keepTranslationCode) {
      for (const t of entry.translations ?? []) {
        if (t.code === opts.keepTranslationCode && typeof t.word === "string") viTranslations.push(t.word);
      }
    }
    const record: KaikkiLemma = {
      word: entry.word,
      pos,
      sourcePos: entry.pos,
      gender: pos === "noun" ? (genderFromTags(senseTags) ?? genderFromHead(entry)) : undefined,
      ipa: ipaOf(entry),
      glosses,
      senseCount: lemmaSenses.length,
      examples,
      forms,
      topics: topicsOf(entry, opts.lang),
      usageTags: [...usage].sort(),
      readings: readingsOf(entry),
      viTranslations,
    };
    if (existing) {
      // Several etymologies of the same word|pos: merge, first entry wins on scalars. A restricted
      // etymology beside a plain one adds no gloss or example and does not restrict the lemma.
      const existingPlain = existing.usageTags.length === 0;
      const recordPlain = record.usageTags.length === 0;
      if (!existingPlain && recordPlain) {
        existing.glosses = [];
        existing.examples = [];
        existing.usageTags = [];
      }
      if (existingPlain === recordPlain || recordPlain) {
        existing.glosses.push(...record.glosses);
        existing.examples.push(...record.examples.slice(0, Math.max(0, maxExamples - existing.examples.length)));
      }
      if (!existingPlain && !recordPlain) existing.usageTags = [...new Set([...existing.usageTags, ...record.usageTags])].sort();
      existing.senseCount += record.senseCount;
      existing.forms.push(...record.forms);
      existing.topics = [...new Set([...existing.topics, ...record.topics])].sort();
      existing.viTranslations.push(...record.viTranslations);
      if (!existing.gender && record.gender) existing.gender = record.gender;
      if (!existing.ipa && record.ipa) existing.ipa = record.ipa;
      for (const [k, v] of Object.entries(record.readings)) if (!existing.readings[k]) existing.readings[k] = v;
    } else {
      lemmas.set(key, record);
    }
  }
  return { lemmas, formOf, entriesRead, badLines };
}

/** Vietnamese-edition gloss → one short learner gloss ("Nhà ở, căn nhà, tòa nhà; chỗ ở." → "nhà ở"). */
export function viGlossFromSense(gloss: string): string | null {
  let g = cleanGloss(gloss);
  if (/^xem\s/i.test(g) || /^dạng biến tố/i.test(g) || g.includes("\n")) return null;
  g = g.replace(/^(?:gđ|gc|đph|nth|ng|thgt|kng|vch|cng|tngữ|đg|dt|tt|pt|lt|gt|đt|cd)\s+/i, "");
  g = g.replace(/^\([^)]*\)\s*/, "");
  const first = g.split(/[;,]/)[0].trim();
  if (first.length === 0) return null;
  return first.charAt(0).toLowerCase() + first.slice(1);
}

export function sourcedGlosses(glosses: string[], source: string): SourcedGloss[] {
  return glosses.map((text) => ({ text, source }));
}
