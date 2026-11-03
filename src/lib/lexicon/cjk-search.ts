/**
 * CJK lexicon search (P4b stage 5, task 7). The Latin search contract
 * (word-prefix tokens over unicode61 FTS) does not fit text without word
 * spaces, so a CJK lexicon database is built with the FTS5 `trigram`
 * tokenizer (substring matching, accelerated LIKE) and an extra `reading`
 * column holding each entry's search keys:
 *
 *  - ja: the kana reading, katakana folded to hiragana (ガクセイ finds 学生),
 *  - zh: the pinyin without tones or spaces (hanyu, han yu, hàn yǔ, han4 yu3
 *    all find 汉语),
 *  - ko: the keystroke jamo of the hangul surface (ㅎㅏㄱ … : a jamo prefix
 *    such as ㅎㅏ or 하 finds 학여울) and the RR.
 *
 * Both tiers fold with THESE functions (the build writes the keys, the
 * query side folds the input the same way) and rank with the same pure
 * scorer, so the SQLite and web-fallback answers agree. Every SQL pattern
 * is a bound parameter; LIKE wildcards in the input are escaped.
 */
import { koreanKeystrokes } from "../languages/ko";

/** Readings a lexicon entry can carry (index / web-fallback `reading`). */
export type CjkReading = { kana?: string; pinyin?: string; rr?: string };

const HANGUL = /[\uAC00-\uD7A3\u1100-\u11FF\u3131-\u318E]/;

/**
 * NFKC + lower case everywhere except hangul: NFKC would turn typed
 * compatibility jamo (ㄱ) into conjoining initials (ᄀ), breaking jamo search.
 */
function widthFold(text: string): string {
  return text
    .replace(/[^ᄀ-ᇿ㄰-㆏ꥠ-꥿가-힣ힰ-퟿]+/g, (s) => s.normalize("NFKC"))
    .normalize("NFC")
    .toLowerCase();
}

/** The search fold of a query or a key: width, case, kana type, hangul → jamo, tones, spaces. */
export function foldCjkSearch(text: string): string {
  return koreanKeystrokes(
    widthFold(text)
      .replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
  )
    .replace(/u:/g, "u")
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .normalize("NFC")
    .replace(/([a-z])[1-5]/g, "$1")
    .replace(/[\s'’·・-]+/g, "");
}

/** An entry's search keys, space-separated (the `reading` FTS column). */
export function cjkReadingKeys(entry: { surface: string; reading?: CjkReading }): string {
  const keys = new Set<string>();
  const add = (value: string | undefined) => {
    const folded = value === undefined ? "" : foldCjkSearch(value);
    if (folded.length > 0) keys.add(folded);
  };
  add(entry.reading?.kana);
  add(entry.reading?.pinyin);
  add(entry.reading?.rr);
  if (HANGUL.test(entry.surface)) add(entry.surface);
  return [...keys].join(" ");
}

/** The two LIKE patterns of a query (surface / gloss as typed, reading keys folded), or null for an empty query. */
export function cjkSearchPatterns(query: string): { text: string; reading: string } | null {
  const text = widthFold(query).trim();
  const reading = foldCjkSearch(query);
  if (text.length === 0 || reading.length === 0) return null;
  const like = (s: string) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return { text: like(text), reading: like(reading) };
}

export type CjkCandidate = { surface: string; gloss: string; readingKeys: string; ord: number };

/**
 * Ranking contract (both tiers): exact surface 100, surface prefix 80, a
 * reading key starting with the query 60, surface substring 50, reading
 * substring 40, gloss word-prefix 20, gloss substring 10; 0 = no match.
 * Ties keep course order.
 */
export function cjkScore(c: CjkCandidate, query: string): number {
  return scoreFolded(c, widthFold(query).trim(), foldCjkSearch(query));
}

function scoreFolded(c: CjkCandidate, text: string, reading: string): number {
  if (text.length === 0 || reading.length === 0) return 0;
  const surface = widthFold(c.surface);
  const keys = c.readingKeys.split(" ").filter((k) => k.length > 0);
  const gloss = widthFold(c.gloss);
  if (surface === text) return 100;
  if (surface.startsWith(text)) return 80;
  if (keys.some((k) => k.startsWith(reading))) return 60;
  if (surface.includes(text)) return 50;
  if (keys.some((k) => k.includes(reading))) return 40;
  if (gloss.split(/[^\p{L}\p{N}]+/u).some((w) => w.startsWith(text))) return 20;
  if (gloss.includes(text)) return 10;
  return 0;
}

export function rankCjk<T extends CjkCandidate>(candidates: T[], query: string): T[] {
  const text = widthFold(query).trim();
  const reading = foldCjkSearch(query);
  return candidates
    .map((c) => ({ c, score: scoreFolded(c, text, reading) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.c.ord - b.c.ord)
    .map((x) => x.c);
}
