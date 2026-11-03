/**
 * Script readings for display (P4b stage 5, task 4): the readings stored at
 * build time (stage 4: Word.reading and the lexicon index's `reading`)
 * laid out over the text the learner sees —
 *
 *  - ja: furigana ABOVE each kanji run (the stored furigana segments),
 *  - zh: pinyin UNDER each hanzi (one stored syllable per character),
 *  - ko: Revised Romanization UNDER each hangul word,
 *
 * and, for a Vietnamese-native course only, the Hán-Việt reading of a
 * Sino-Vietnamese word as a secondary line (QC 2026-11-03 §2: shown only
 * where it helps — a word the Hán-Việt tables list; never a native
 * Japanese kun word, a native Korean word or a loanword).
 *
 * Pure: the caller hands in the course's readings; nothing here reads
 * course content or learner state. A course without stored readings (every
 * Latin-script course) gets an empty index and therefore no reading at all.
 */
import { hanVietFor, hasHanViet, type HanVietLanguage } from "../languages/hanviet";
import { hepburn } from "../languages/ja-romaji";
import type { WordReading } from "../types";

/** One run of the displayed text with the reading shown over/under it (none on kana or punctuation). */
export type RubySegment = { base: string; ruby?: string };

export type ScriptReading = {
  segments: RubySegment[];
  /** Furigana sit above the text; pinyin and romanization sit under it. */
  position: "above" | "below";
  /** Hán-Việt reading of the whole text when it is one listed Sino-Vietnamese word (vi-native courses). */
  hanViet?: string;
  /**
   * P4c: the Hepburn romaji of the whole text (ja), shown as a line under it only while the course's profile says
   * `romajiUntilPrimer` and the learner has not passed the kana primer checkpoint. Absent when any kanji has no
   * stored reading — never a guessed reading.
   */
  romaji?: string;
};

/**
 * A word whose reading is stored (a pack word or a lexicon index entry); `pos` lets ja add its inflection keys.
 * `stem`: a ja inflection key (食べま, 行っ) — the kana after it is its ending, so the romaji line writes them as one word.
 */
export type ReadingSource = { surface: string; reading: WordReading; pos?: string; stem?: true };

export type ScriptReadingIndex = {
  readonly bySurface: ReadonlyMap<string, WordReading>;
  /** Longest surface, in code points. */
  readonly maxLength: number;
  /** P4c: surfaces that are ja inflection keys (see ReadingSource.stem). */
  readonly stems?: ReadonlySet<string>;
};

export const EMPTY_SCRIPT_INDEX: ScriptReadingIndex = { bySurface: new Map(), maxLength: 0 };

const HAN = /[\p{Script=Han}々〆]/u;

function hasReading(r: WordReading): boolean {
  return (r.furigana?.length ?? 0) > 0 || !!r.kana || !!r.pinyin || !!r.rr;
}

/** The first source of a surface wins (pack words are passed before lexicon entries). */
export function buildScriptReadingIndex(sources: Iterable<ReadingSource>): ScriptReadingIndex {
  const bySurface = new Map<string, WordReading>();
  const stems = new Set<string>();
  let maxLength = 0;
  for (const { surface, reading, stem } of sources) {
    const key = surface.trim();
    if (key.length === 0 || bySurface.has(key) || !hasReading(reading)) continue;
    bySurface.set(key, reading);
    if (stem) stems.add(key);
    maxLength = Math.max(maxLength, [...key].length);
  }
  return stems.size > 0 ? { bySurface, maxLength, stems } : { bySurface, maxLength };
}

type Kind = "kana" | "pinyin" | "rr";

/** Segments of one word under its stored reading, and which notation laid them out. */
export function wordSegments(surface: string, reading: WordReading): { segments: RubySegment[]; kind: Kind } | null {
  const furigana = reading.furigana ?? [];
  if (furigana.length > 0 && furigana.map((s) => s.base).join("") === surface) {
    return { segments: furigana.map((s) => (s.ruby ? { base: s.base, ruby: s.ruby } : { base: s.base })), kind: "kana" };
  }
  if (reading.kana) {
    // No usable furigana: the whole word's kana over it — only when it has kanji to read.
    return { segments: HAN.test(surface) ? [{ base: surface, ruby: reading.kana }] : [{ base: surface }], kind: "kana" };
  }
  if (reading.pinyin) {
    const syllables = reading.pinyin.trim().split(/\s+/);
    const chars = [...surface];
    const hanCount = chars.filter((c) => HAN.test(c)).length;
    if (hanCount === syllables.length) {
      let next = 0;
      return { segments: chars.map((c) => (HAN.test(c) ? { base: c, ruby: syllables[next++] } : { base: c })), kind: "pinyin" };
    }
    return { segments: [{ base: surface, ruby: reading.pinyin }], kind: "pinyin" };
  }
  if (reading.rr) return { segments: [{ base: surface, ruby: reading.rr }], kind: "rr" };
  return null;
}

function pushPlain(out: RubySegment[], text: string): void {
  const last = out[out.length - 1];
  if (last !== undefined && last.ruby === undefined) out[out.length - 1] = { base: last.base + text };
  else out.push({ base: text });
}

/**
 * The displayed text segmented by the course's words (longest stored
 * surface first, left to right; other characters stay plain), or null when
 * no part of it has a reading to show.
 */
export function annotateText(text: string, index: ScriptReadingIndex): { segments: RubySegment[]; kinds: Set<Kind> } | null {
  if (index.bySurface.size === 0 || text.length === 0) return null;
  const cps = [...text];
  const out: RubySegment[] = [];
  const kinds = new Set<Kind>();
  let i = 0;
  while (i < cps.length) {
    let matched = false;
    for (let len = Math.min(index.maxLength, cps.length - i); len >= 1; len--) {
      const word = cps.slice(i, i + len).join("");
      const reading = index.bySurface.get(word);
      const laid = reading ? wordSegments(word, reading) : null;
      if (laid === null) continue;
      for (const s of laid.segments) {
        if (s.ruby === undefined) pushPlain(out, s.base);
        else out.push(s);
      }
      kinds.add(laid.kind);
      i += len;
      matched = true;
      break;
    }
    if (!matched) {
      pushPlain(out, cps[i]!);
      i += 1;
    }
  }
  return out.some((s) => s.ruby !== undefined) ? { segments: out, kinds } : null;
}

const LANGUAGE_OF_KIND: Readonly<Record<Kind, HanVietLanguage>> = { kana: "ja", pinyin: "zh", rr: "ko" };

/**
 * Hán-Việt of a text that is exactly one stored word: by the course's
 * target language when it has tables, else by the notation of the word's
 * reading. Japanese needs the word's kana so a kun reading of the same
 * spelling never gets an on'yomi gloss.
 */
export function hanVietOfWord(text: string, index: ScriptReadingIndex, targetCode: string): string | null {
  const word = text.trim();
  const reading = index.bySurface.get(word);
  if (reading === undefined) return null;
  const laid = wordSegments(word, reading);
  if (laid === null) return null;
  const lang: HanVietLanguage = hasHanViet(targetCode) ? targetCode : LANGUAGE_OF_KIND[laid.kind];
  if (lang === "ja") return reading.kana ? hanVietFor("ja", word, { kana: reading.kana }) : null;
  return hanVietFor(lang, word);
}

// --- P4c: the romaji line ------------------------------------------------------

const KANA_CHAR = /[ぁ-ゖァ-ヺー]/;
const PUNCTUATION: Readonly<Record<string, string>> = {
  "。": ".", "、": ",", "，": ",", "．": ".", "？": "?", "?": "?", "！": "!", "!": "!", "「": "“", "」": "”", "『": "“", "』": "”",
  "・": " ", "…": "…", "〜": "~", "～": "~", "：": ":", "（": "(", "）": ")",
};
/** Set expressions whose final は is the old particle, read wa. */
const WA_EXPRESSIONS: Readonly<Record<string, string>> = { こんにちは: "konnichiwa", こんばんは: "konbanwa", では: "dewa", それでは: "soredewa" };
/** A particle written alone between words: は reads wa, へ reads e (を is o by its own spelling). */
const PARTICLE_ROMAJI: Readonly<Record<string, string>> = { は: "wa", へ: "e" };

type RomajiToken = { kana: string; kind: "word" | "stem" | "plain" } | { kind: "punct" | "other"; text: string };

/** The kana of one stored word: its kana, else its furigana spelt through. */
function kanaOfReading(surface: string, reading: WordReading): string | undefined {
  if (reading.kana) return reading.kana;
  const furigana = reading.furigana ?? [];
  if (furigana.length > 0 && furigana.map((s) => s.base).join("") === surface) return furigana.map((s) => s.ruby ?? s.base).join("");
  return undefined;
}

const KANA_WORDS = new WeakMap<ScriptReadingIndex, { words: ReadonlySet<string>; maxLength: number }>();

/** The kana spellings of an index's words (わたし for 私), built once per index. */
function kanaWordsOf(index: ScriptReadingIndex): { words: ReadonlySet<string>; maxLength: number } {
  const cached = KANA_WORDS.get(index);
  if (cached) return cached;
  const words = new Set<string>();
  let maxLength = index.maxLength;
  for (const [surface, reading] of index.bySurface) {
    const kana = kanaOfReading(surface, reading);
    if (kana === undefined || index.stems?.has(surface)) continue;
    words.add(kana);
    maxLength = Math.max(maxLength, [...kana].length);
  }
  const built = { words, maxLength };
  KANA_WORDS.set(index, built);
  return built;
}

/** Words of a text for the romaji line: stored words (and their kana spellings) longest first; other kana runs plain. */
function romajiTokens(text: string, index: ScriptReadingIndex): RomajiToken[] | null {
  const { words: kanaWords, maxLength } = kanaWordsOf(index);
  const cps = [...text];
  const out: RomajiToken[] = [];
  let i = 0;
  while (i < cps.length) {
    let matched = false;
    for (let len = Math.min(maxLength, cps.length - i); len >= 1; len--) {
      const word = cps.slice(i, i + len).join("");
      // One kana alone is never a word here: a particle or a stray kana stays in the plain run.
      if (len === 1 && !HAN.test(word)) break;
      const reading = index.bySurface.get(word);
      const kana = reading ? kanaOfReading(word, reading) : kanaWords.has(word) ? word : undefined;
      if (kana === undefined) continue;
      out.push({ kana, kind: index.stems?.has(word) ? "stem" : "word" });
      i += len;
      matched = true;
      break;
    }
    if (matched) continue;
    const ch = cps[i]!;
    const last = out[out.length - 1];
    if (KANA_CHAR.test(ch)) {
      if (last !== undefined && last.kind === "plain") out[out.length - 1] = { kana: last.kana + ch, kind: "plain" };
      else out.push({ kana: ch, kind: "plain" });
    } else if (HAN.test(ch)) {
      return null; // a kanji without a stored reading: no line rather than a guess
    } else if (PUNCTUATION[ch] !== undefined) {
      out.push({ kind: "punct", text: PUNCTUATION[ch]! });
    } else if (/\s/.test(ch)) {
      if (last !== undefined && !(last.kind === "other" && last.text === "")) out.push({ kind: "other", text: "" });
    } else if (last !== undefined && last.kind === "other" && last.text !== "") {
      out[out.length - 1] = { kind: "other", text: last.text + ch };
    } else {
      out.push({ kind: "other", text: ch });
    }
    i += 1;
  }
  return out;
}

/**
 * P4c: the Hepburn romaji of a Japanese text, read from the stored kana of its words (the same index the furigana
 * come from; rules in languages/ja-romaji.ts): words separated by spaces, an ending glued to its inflection key
 * (食べます → tabemasu), a lone は / へ read wa / e. Undefined when any kanji has no stored reading.
 */
export function romajiLine(text: string, index: ScriptReadingIndex): string | undefined {
  if (!KANA_CHAR.test(text) && !HAN.test(text)) return undefined; // not Japanese text (a native-language prompt or option)
  const tokens = romajiTokens(text, index);
  if (tokens === null || tokens.length === 0) return undefined;
  let out = "";
  let glue = false;
  for (const token of tokens) {
    if (token.kind === "punct") {
      out = out.trimEnd() + token.text;
      glue = false;
      continue;
    }
    if (token.kind === "other") {
      if (token.text !== "") out += `${out.length > 0 && !out.endsWith(" ") ? " " : ""}${token.text}`;
      glue = false;
      continue;
    }
    if (!("kana" in token)) continue;
    const { kana } = token;
    const romaji = token.kind === "plain" && !glue && PARTICLE_ROMAJI[kana] !== undefined ? PARTICLE_ROMAJI[kana] : (WA_EXPRESSIONS[kana] ?? hepburn(kana));
    if (romaji === undefined) return undefined;
    out += (glue && token.kind === "plain") || out.length === 0 || out.endsWith(" ") ? romaji : ` ${romaji}`;
    glue = token.kind === "stem";
  }
  const line = out.replace(/\s+/g, " ").trim();
  return line.length > 0 ? line : undefined;
}

/**
 * The reading layout of a displayed text, or undefined when it has none. `furigana: false` (the learner's reading
 * aid switch is off) drops the furigana / pinyin / RR and Hán-Việt; `romaji` (P4c) adds the romaji line, which a
 * text without kanji can carry on its own.
 */
export function scriptReadingFor(
  text: string,
  index: ScriptReadingIndex,
  opts: { targetCode: string; showHanViet: boolean; furigana?: boolean; romaji?: boolean }
): ScriptReading | undefined {
  const annotated = opts.furigana === false ? null : annotateText(text, index);
  const romaji = opts.romaji === true ? romajiLine(text, index) : undefined;
  if (annotated === null && romaji === undefined) return undefined;
  const hanViet = annotated !== null && opts.showHanViet ? hanVietOfWord(text, index, opts.targetCode) : null;
  return {
    segments: annotated?.segments ?? [{ base: text }],
    position: annotated === null || annotated.kinds.has("kana") ? "above" : "below",
    ...(hanViet !== null ? { hanViet } : {}),
    ...(romaji !== undefined ? { romaji } : {}),
  };
}

/** The reading as one line (accessibility label): kana spelt through, pinyin/RR syllables spaced. */
export function readingLine(reading: ScriptReading): string {
  if (reading.position === "above") return reading.segments.map((s) => s.ruby ?? s.base).join("");
  return reading.segments
    .filter((s) => s.ruby !== undefined)
    .map((s) => s.ruby)
    .join(" ");
}
