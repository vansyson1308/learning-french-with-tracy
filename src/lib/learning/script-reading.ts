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
import type { WordReading } from "../types";

/** One run of the displayed text with the reading shown over/under it (none on kana or punctuation). */
export type RubySegment = { base: string; ruby?: string };

export type ScriptReading = {
  segments: RubySegment[];
  /** Furigana sit above the text; pinyin and romanization sit under it. */
  position: "above" | "below";
  /** Hán-Việt reading of the whole text when it is one listed Sino-Vietnamese word (vi-native courses). */
  hanViet?: string;
};

/** A word whose reading is stored (a pack word or a lexicon index entry); `pos` lets ja add its inflection keys. */
export type ReadingSource = { surface: string; reading: WordReading; pos?: string };

export type ScriptReadingIndex = {
  readonly bySurface: ReadonlyMap<string, WordReading>;
  /** Longest surface, in code points. */
  readonly maxLength: number;
};

export const EMPTY_SCRIPT_INDEX: ScriptReadingIndex = { bySurface: new Map(), maxLength: 0 };

const HAN = /[\p{Script=Han}々〆]/u;

function hasReading(r: WordReading): boolean {
  return (r.furigana?.length ?? 0) > 0 || !!r.kana || !!r.pinyin || !!r.rr;
}

/** The first source of a surface wins (pack words are passed before lexicon entries). */
export function buildScriptReadingIndex(sources: Iterable<ReadingSource>): ScriptReadingIndex {
  const bySurface = new Map<string, WordReading>();
  let maxLength = 0;
  for (const { surface, reading } of sources) {
    const key = surface.trim();
    if (key.length === 0 || bySurface.has(key) || !hasReading(reading)) continue;
    bySurface.set(key, reading);
    maxLength = Math.max(maxLength, [...key].length);
  }
  return { bySurface, maxLength };
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

/** The reading layout of a displayed text, or undefined when it has none. */
export function scriptReadingFor(
  text: string,
  index: ScriptReadingIndex,
  opts: { targetCode: string; showHanViet: boolean }
): ScriptReading | undefined {
  const annotated = annotateText(text, index);
  if (annotated === null) return undefined;
  const hanViet = opts.showHanViet ? hanVietOfWord(text, index, opts.targetCode) : null;
  return {
    segments: annotated.segments,
    position: annotated.kinds.has("kana") ? "above" : "below",
    ...(hanViet !== null ? { hanViet } : {}),
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
