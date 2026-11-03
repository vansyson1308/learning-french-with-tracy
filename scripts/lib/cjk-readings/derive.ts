/**
 * Readings of a CJK candidate pool, precomputed at build time (P4b stage 4).
 * Pure over (pool, the pool's existing derived readings, one pinned source
 * text); scripts/cjk-readings.ts reads the files, checks the pins and writes
 * content/<lang>/lexicon/derived/lexeme-readings.json.
 *
 *  ja  kana + furigana from JmdictFurigana (per JMdict text/reading pair).
 *      A reading is CONFIRMED when the pool's kana (kaikki, else JMdict —
 *      derived/readings.json) is one of JMdict's readings of the lemma, or,
 *      with no pool kana, when JMdict has exactly one reading. Kana-only
 *      lemmas are their own reading.
 *  zh  tone-marked pinyin, one syllable per hanzi, and the traditional
 *      spelling, from CC-CEDICT. Confirmed when kaikki's pinyin picks one
 *      CC-CEDICT reading (exact, else toneless; common-word readings before
 *      proper-name ones), or, with no kaikki pinyin, when CC-CEDICT has
 *      exactly one. A pool lemma written in traditional characters keeps
 *      its simplified spelling in `simplified`.
 *  ko  Revised Romanization by our rule set (korean-rr.ts). Confirmed when
 *      it agrees with kaikki's (Wiktionary's) romanization, letters only;
 *      a single `+` compound boundary is tried when the plain spelling
 *      disagrees (Standard Pronunciation's ㄴ insertion and [ㄴㄴ]), and
 *      kept when exactly one placement agrees.
 * Everything not confirmed is listed in `unresolved` with its reason —
 * never guessed.
 */

import { katakanaToHiragana } from "../../../src/lib/languages/ja";

import { romanizeKorean } from "./korean-rr";
import { cedictPinyin, compactPinyin, foldPinyin, hanCount, isProperName, type CedictEntry } from "./pinyin";
import { readingErrors, type FuriganaSegment, type ReadingNotation, type StoredReading } from "./validate";

export type PoolKeyEntry = { lemma: string; partOfSpeech: string };
export type PoolReadings = Record<string, { kana?: string; romanization?: string; pinyin?: string }>;

export type DerivedReadings = {
  readings: Record<string, StoredReading>;
  unresolved: Record<string, string>;
  /** zh: simplified lemmas whose CC-CEDICT reading maps to more than one traditional spelling. */
  traditionalAmbiguous?: Record<string, string[]>;
};

export const NOTATION_OF: Readonly<Record<string, ReadingNotation>> = { ja: "kana", zh: "pinyin", ko: "rr" };

const KANA_ONLY = /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u;

export const poolKey = (e: PoolKeyEntry) => `${e.lemma}|${e.partOfSpeech}`;

// --- ja -----------------------------------------------------------------------

export type JmdictFuriganaEntry = { text: string; reading: string; furigana: { ruby: string; rt?: string }[] };

export function indexJmdictFurigana(entries: readonly JmdictFuriganaEntry[], wanted: ReadonlySet<string>): Map<string, JmdictFuriganaEntry[]> {
  const out = new Map<string, JmdictFuriganaEntry[]>();
  for (const e of entries) {
    if (!wanted.has(e.text)) continue;
    const list = out.get(e.text) ?? [];
    if (!list.some((x) => x.reading === e.reading)) list.push(e);
    out.set(e.text, list);
  }
  return out;
}

const E_ROW = new Set([..."えけせてねへめれげぜでべぺぇ"]);
const O_ROW = new Set([..."おこそとのほもよろごぞどぼぽぉょ"]);
const VOWEL_OF_KANA = new Map<string, string>(
  [
    ["あ", "あかさたなはまやらわがざだばぱぁゃ"],
    ["い", "いきしちにひみりぎじぢびぴぃ"],
    ["う", "うくすつぬふむゆるぐずづぶぷぅゅ"],
    ["え", "えけせてねへめれげぜでべぺぇ"],
    ["お", "おこそとのほもよろごぞどぼぽぉょ"],
  ].flatMap(([v, row]) => [...row!].map((c) => [c, v!] as const))
);

/**
 * Does a pronunciation-style kana with ー (kaikki: えーご, とーぜん) spell
 * the same word as a dictionary reading (えいご, とうぜん)? ー stands for the
 * vowel it lengthens, or い after an e-row kana, う after an o-row kana.
 */
export function longVowelEquivalent(withChoon: string, reading: string): boolean {
  const a = [...katakanaToHiragana(withChoon)];
  const b = [...katakanaToHiragana(reading)];
  if (a.length !== b.length || !a.includes("ー")) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (a[i] !== "ー" || i === 0) return false;
    const prev = b[i - 1]!;
    const allowed = new Set([VOWEL_OF_KANA.get(prev)]);
    if (E_ROW.has(prev)) allowed.add("い");
    if (O_ROW.has(prev)) allowed.add("う");
    if (!allowed.has(b[i])) return false;
  }
  return true;
}

function toSegments(e: JmdictFuriganaEntry): FuriganaSegment[] {
  // Adjacent kana parts merge; a kanji part keeps its own ruby.
  const out: FuriganaSegment[] = [];
  for (const part of e.furigana) {
    const last = out[out.length - 1];
    if (part.rt === undefined && last !== undefined && last.ruby === undefined) last.base += part.ruby;
    else out.push(part.rt === undefined ? { base: part.ruby } : { base: part.ruby, ruby: part.rt });
  }
  return out;
}

export function deriveJapanese(pool: readonly PoolKeyEntry[], existing: PoolReadings, furigana: Map<string, JmdictFuriganaEntry[]>): DerivedReadings {
  const readings: Record<string, StoredReading> = {};
  const unresolved: Record<string, string> = {};
  for (const e of pool) {
    const key = poolKey(e);
    if (KANA_ONLY.test(e.lemma)) {
      readings[key] = { kana: e.lemma };
      continue;
    }
    const candidates = furigana.get(e.lemma) ?? [];
    const poolKana = existing[key]?.kana;
    let chosen: JmdictFuriganaEntry | undefined;
    if (candidates.length === 0) {
      unresolved[key] = `no JMdict (JmdictFurigana) entry is written "${e.lemma}"`;
      continue;
    }
    if (poolKana !== undefined) {
      chosen = candidates.find((c) => katakanaToHiragana(c.reading) === katakanaToHiragana(poolKana));
      if (!chosen) {
        // kaikki writes some readings as pronounced (えーご): one long-vowel match picks JMdict's spelling (えいご).
        const choon = candidates.filter((c) => longVowelEquivalent(poolKana, c.reading));
        if (choon.length === 1) chosen = choon[0];
      }
      if (!chosen) {
        unresolved[key] = `the pool's kana "${poolKana}" is not one of JMdict's readings of "${e.lemma}" (${candidates.map((c) => c.reading).join(", ")})`;
        continue;
      }
    } else if (candidates.length === 1) {
      chosen = candidates[0];
    } else {
      unresolved[key] = `no pool kana and JMdict has ${candidates.length} readings of "${e.lemma}" (${candidates.map((c) => c.reading).join(", ")})`;
      continue;
    }
    const reading: StoredReading = { kana: chosen!.reading, furigana: toSegments(chosen!) };
    const errors = readingErrors("kana", e.lemma, e.partOfSpeech, reading);
    if (errors.length > 0) unresolved[key] = `JmdictFurigana segments fail the reading contract: ${errors.join("; ")}`;
    else readings[key] = reading;
  }
  return { readings, unresolved };
}

// --- zh -----------------------------------------------------------------------

export function deriveChinese(pool: readonly PoolKeyEntry[], existing: PoolReadings, cedict: Map<string, CedictEntry[]>): DerivedReadings {
  const readings: Record<string, StoredReading> = {};
  const unresolved: Record<string, string> = {};
  const traditionalAmbiguous: Record<string, string[]> = {};
  for (const e of pool) {
    const key = poolKey(e);
    const all = cedict.get(e.lemma) ?? [];
    // The lemma as a simplified headword first; a pool lemma written in traditional characters (大學) reads through its traditional headword.
    const asSimplified = all.filter((x) => x.simplified === e.lemma);
    const lemmaIsTraditional = asSimplified.length === 0 && all.some((x) => x.traditional === e.lemma);
    const headword = lemmaIsTraditional ? all.filter((x) => x.traditional === e.lemma) : asSimplified;
    const usable = headword
      .map((entry) => ({ entry, pinyin: cedictPinyin(entry), proper: isProperName(entry) }))
      .filter((x): x is { entry: CedictEntry; pinyin: string; proper: boolean } => x.pinyin !== null && x.pinyin.split(" ").length === hanCount(e.lemma));
    if (usable.length === 0) {
      unresolved[key] = all.length === 0 ? `no CC-CEDICT entry for "${e.lemma}"` : `CC-CEDICT's entries for "${e.lemma}" are not one pinyin syllable per hanzi`;
      continue;
    }
    // Common-word readings before proper-name readings (行 xíng/háng before the surname Háng).
    const common = usable.filter((u) => !u.proper);
    const ranked = common.length > 0 ? [common, usable] : [usable];
    const kaikki = existing[key]?.pinyin;
    let pinyin: string | undefined;
    let reason = "";
    for (const group of ranked) {
      const distinct = [...new Set(group.map((u) => u.pinyin))];
      if (kaikki !== undefined) {
        const exact = distinct.filter((p) => compactPinyin(p) === compactPinyin(kaikki));
        const toneless = distinct.filter((p) => foldPinyin(p) === foldPinyin(kaikki));
        if (exact.length === 1) pinyin = exact[0];
        else if (toneless.length === 1) pinyin = toneless[0];
        else
          reason =
            toneless.length === 0
              ? `kaikki's pinyin "${kaikki}" matches none of CC-CEDICT's readings (${distinct.join(" | ")})`
              : `kaikki's pinyin "${kaikki}" matches several CC-CEDICT readings toneless (${toneless.join(" | ")})`;
      } else if (distinct.length === 1) {
        pinyin = distinct[0];
      } else {
        reason = `no kaikki pinyin and CC-CEDICT has ${distinct.length} readings (${distinct.join(" | ")})`;
      }
      if (pinyin !== undefined) break;
    }
    if (pinyin === undefined) {
      unresolved[key] = reason;
      continue;
    }
    const matching = usable.filter((u) => u.pinyin === pinyin);
    let reading: StoredReading;
    if (lemmaIsTraditional) {
      const simplified = [...new Set(matching.map((u) => u.entry.simplified))];
      if (simplified.length !== 1) {
        unresolved[key] = `"${e.lemma}" is a traditional spelling with ${simplified.length} simplified forms in CC-CEDICT (${simplified.join(", ")})`;
        continue;
      }
      reading = { pinyin, traditional: e.lemma, simplified: simplified[0]! };
    } else {
      const traditionals = [...new Set(matching.map((u) => u.entry.traditional))];
      reading = traditionals.length === 1 ? { pinyin, traditional: traditionals[0]! } : { pinyin };
      if (traditionals.length > 1) traditionalAmbiguous[key] = traditionals;
    }
    const errors = readingErrors("pinyin", e.lemma, e.partOfSpeech, reading);
    if (errors.length > 0) {
      unresolved[key] = `CC-CEDICT reading fails the reading contract: ${errors.join("; ")}`;
      delete traditionalAmbiguous[key];
    } else readings[key] = reading;
  }
  return { readings, unresolved, traditionalAmbiguous };
}

// --- ko -----------------------------------------------------------------------

/** Letters only, lower case: hyphens, apostrophes and spaces are presentation, not reading. */
export function foldRomanization(value: string): string {
  return value.normalize("NFC").toLowerCase().replace(/[^a-z]/g, "");
}

export function deriveKorean(pool: readonly PoolKeyEntry[], existing: PoolReadings): DerivedReadings {
  const readings: Record<string, StoredReading> = {};
  const unresolved: Record<string, string> = {};
  for (const e of pool) {
    const key = poolKey(e);
    const noun = e.partOfSpeech === "noun";
    const plain = romanizeKorean(e.lemma, { noun });
    const wiktionary = existing[key]?.romanization;
    if (wiktionary === undefined) {
      unresolved[key] = `no independent romanization (kaikki) to confirm the rule output "${plain}"`;
      continue;
    }
    const target = foldRomanization(wiktionary);
    if (foldRomanization(plain) === target) {
      readings[key] = { rr: plain };
      continue;
    }
    const chars = [...e.lemma];
    const hits: { spelling: string; rr: string }[] = [];
    for (let k = 1; k < chars.length; k++) {
      const spelling = `${chars.slice(0, k).join("")}+${chars.slice(k).join("")}`;
      const out = romanizeKorean(spelling, { noun });
      if (foldRomanization(out) === target) hits.push({ spelling, rr: out });
    }
    const outputs = [...new Set(hits.map((h) => h.rr))];
    if (outputs.length === 1) readings[key] = { rr: hits[0]!.rr, rrSpelling: hits[0]!.spelling };
    else if (e.partOfSpeech !== "noun" && foldRomanization(romanizeKorean(e.lemma, { noun: true })) === target)
      unresolved[key] = `the rule output "${plain}" aspirates ㄱ/ㄷ/ㅂ+ㅎ; Wiktionary's "${wiktionary}" keeps ㅎ as after a noun root (the official exception names nouns only — the root boundary is not in the spelling)`;
    else unresolved[key] = `the rule output "${plain}" disagrees with Wiktionary's "${wiktionary}"${hits.length > 1 ? " (several compound boundaries would agree)" : ""}`;
  }
  return { readings, unresolved };
}
