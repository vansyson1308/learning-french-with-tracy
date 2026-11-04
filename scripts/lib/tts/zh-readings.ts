/**
 * The spoken pinyin of a Mandarin clip, built from the course's stored readings (P4d audio front-end; see
 * plan/reports/P4d-zh-audio-frontend.md). This takes the place of jieba + pypinyin in Kokoro's Chinese G2P (misaki
 * 0.9.4 legacy path):
 *
 *  1. Words: the clip is cut by the same longest-match walk over the course's words the app's pinyin line uses
 *     (src/lib/learning/script-reading.ts annotateText over buildScriptReadingIndex of the lexicon), so the audio says
 *     what the learner reads under the hanzi. Each word keeps its one stored CC-CEDICT reading in citation tones
 *     (zh-plan decisions 2–3). Digits are spelt in hanzi first (scripts/lib/tts/zh-numbers.ts).
 *  2. Tone sandhi, for audio only, over each phrase between punctuation marks (phraseSandhiTones of
 *     scripts/lib/zh-sandhi.ts): 不 bù → bú before a fourth tone; 一 yī → yí before a fourth tone, yì before the others,
 *     yī when counting (第一, 十一, 一月), at the end of a phrase and at the end of a stored word (星期一, 统一); third
 *     tones by word structure (你好 ní hǎo, 我很好 wó hén hǎo, 展览馆 zhán lán guǎn, 小老虎 xiǎo láo hǔ). A stored word of
 *     three or more syllables splits where a stored word ends (its longest stored first part, else its longest stored
 *     last part). Neutral tones stay as stored (的 de, 了 le, 吗 ma).
 *  3. 儿化: a stored r5 syllable (哪儿 nǎ r) is not a syllable of its own — it takes no part in the sandhi (哪儿有 nár
 *     yǒu) and is written onto the syllable before it, whose final -n it replaces (一点儿 diǎr, 玩儿 wár).
 *  4. Kokoro phonemes: misaki's pinyin → IPA table and tone arrows (scripts/lib/tts/zh-phonemes.ts); syllables of a word
 *     together, words spaced, punctuation as misaki maps it.
 *
 * A hanzi no stored word reads, a reading that does not align with its hanzi, a Latin letter or a symbol Kokoro cannot
 * say is an error that names the clip — never a guess. Data: content/zh/lexicon/lexemes.json (CC-CEDICT, CC BY-SA 4.0).
 */

import { parsePinyinReading } from "../../../src/lib/languages/zh";
import { buildScriptReadingIndex, type ReadingSource, type ScriptReadingIndex } from "../../../src/lib/learning/script-reading";
import { phraseSandhiTones, type SandhiWord, type ToneSyllable } from "../zh-sandhi";

import { spellArabicNumbers } from "./zh-numbers";
import { ERHUA_BASE, ERHUA_PHONEME, KOKORO_MAX_PHONEMES, PUNCTUATION, SPOKEN_ASCII, syllablePhonemes } from "./zh-phonemes";

export const ZH_LEXICON_REL = "content/zh/lexicon/lexemes.json";

export type ZhLexemeLike = { surface: string; reading?: { pinyin?: string } };

export type ZhSpeechIndex = {
  readings: ScriptReadingIndex;
  /** Every hanzi some stored surface contains (to name the ones a failing clip lacks). */
  knownHanzi: ReadonlySet<string>;
};

const HAN = /\p{Script=Han}/u;

/** The index the app builds for a zh course's pinyin line (use-reading-aid.ts scriptReadingIndexFor), from the lexicon. */
export function buildZhSpeechIndex(lexemes: readonly ZhLexemeLike[]): ZhSpeechIndex {
  const sources: ReadingSource[] = [];
  const knownHanzi = new Set<string>();
  for (const lex of lexemes) {
    const pinyin = lex.reading?.pinyin;
    if (!pinyin) continue;
    sources.push({ surface: lex.surface, reading: { pinyin } });
    for (const ch of lex.surface) if (HAN.test(ch)) knownHanzi.add(ch);
  }
  return { readings: buildScriptReadingIndex(sources), knownHanzi };
}

/** The committed speech index (the rich lexicon), or why it cannot be built. */
export function loadZhSpeechIndex(read: (rel: string) => unknown, exists: (rel: string) => boolean): { index: ZhSpeechIndex | null; problems: string[] } {
  if (!exists(ZH_LEXICON_REL)) return { index: null, problems: [`${ZH_LEXICON_REL} does not exist: the Mandarin front-end reads its words from it`] };
  return { index: buildZhSpeechIndex((read(ZH_LEXICON_REL) as { lexemes: ZhLexemeLike[] }).lexemes), problems: [] };
}

/**
 * One word of a clip: its surface, stored syllables (citation tones; 0 = neutral) and, for a word of three or more
 * syllables, its two stored parts as syllable counts (展览馆 → [2, 1] when 展览 is stored).
 */
export type ZhWord = { surface: string; syllables: ToneSyllable[]; parts?: number[] };
export type ZhPiece = { kind: "word"; word: ZhWord } | { kind: "punct"; mark: string };

export type ZhPiecesResult = { ok: true; pieces: ZhPiece[] } | { ok: false; error: string };

/** Where a stored word of three or more hanzi splits: its longest stored first part, else its longest stored last part. */
export function wordParts(surface: string, index: ZhSpeechIndex): number[] | undefined {
  const chars = [...surface];
  const n = chars.length;
  if (n < 3) return undefined;
  const stored = (s: string) => index.readings.bySurface.get(s)?.pinyin !== undefined;
  for (let len = n - 1; len >= 2; len--) if (stored(chars.slice(0, len).join(""))) return [len, n - len];
  for (let len = n - 1; len >= 2; len--) if (stored(chars.slice(n - len).join(""))) return [n - len, len];
  return undefined;
}

/** The clip cut into stored words (longest stored surface first, left to right) and punctuation marks. */
export function zhSpokenPieces(text: string, index: ZhSpeechIndex): ZhPiecesResult {
  const spelt = spellArabicNumbers(text.normalize("NFC"));
  if (!spelt.ok) return spelt;
  const cps = [...spelt.text];
  const pieces: ZhPiece[] = [];
  const by = index.readings.bySurface;
  let i = 0;
  while (i < cps.length) {
    const ch = cps[i]!;
    if (/\s/u.test(ch)) {
      i += 1;
      continue;
    }
    const mark = PUNCTUATION[ch] ?? (SPOKEN_ASCII.has(ch) ? ch : undefined);
    if (mark !== undefined) {
      pieces.push({ kind: "punct", mark });
      i += 1;
      continue;
    }
    if (!HAN.test(ch)) return { ok: false, error: `"${ch}" in "${text}" is not a hanzi or a mark Kokoro's Chinese voices can say (write it in hanzi)` };
    let matched = false;
    for (let len = Math.min(index.readings.maxLength, cps.length - i); len >= 1; len--) {
      const surface = cps.slice(i, i + len).join("");
      const pinyin = by.get(surface)?.pinyin;
      if (pinyin === undefined) continue;
      const syllables = parsePinyinReading(pinyin);
      const chars = [...surface];
      if (syllables === null || !chars.every((c) => HAN.test(c)) || syllables.length !== chars.length) {
        return { ok: false, error: `the stored reading "${pinyin}" of ${surface} does not give one syllable per hanzi (in "${text}") — fix the lexicon reading` };
      }
      const parts = syllables.some((s) => s.base === ERHUA_BASE) ? undefined : wordParts(surface, index);
      pieces.push({ kind: "word", word: parts === undefined ? { surface, syllables } : { surface, syllables, parts } });
      i += len;
      matched = true;
      break;
    }
    if (!matched) {
      const missing = [...new Set(cps.filter((c) => HAN.test(c) && !index.knownHanzi.has(c)))];
      const what = missing.length > 0 ? `no stored word has ${missing.join("")}` : `no stored word reads ${ch} here`;
      return { ok: false, error: `${what} (in "${text}") — add the word or its reading to the lexicon` };
    }
  }
  return { ok: true, pieces };
}

/** A word as it is said: syllables with their spoken tones, and whether 儿化 colours them. */
export type SaidSyllable = { base: string; tone: number; erhua: boolean };
export type SaidWord = { surface: string; said: SaidSyllable[] };
export type SaidPiece = { kind: "word"; word: SaidWord } | { kind: "punct"; mark: string };

/** A word without its 儿化 syllables (they colour the syllable before them), for the sandhi. */
function sandhiWordOf(word: ZhWord): { sandhi: SandhiWord; erhua: boolean[] } | string {
  const chars = [...word.surface];
  const kept: ToneSyllable[] = [];
  const keptChars: string[] = [];
  const erhua: boolean[] = [];
  for (let k = 0; k < word.syllables.length; k++) {
    const syllable = word.syllables[k]!;
    if (syllable.base === ERHUA_BASE) {
      if (kept.length === 0) return `${word.surface}: 儿化 (r) without a syllable before it in the word`;
      erhua[erhua.length - 1] = true;
      continue;
    }
    kept.push(syllable);
    keptChars.push(chars[k]!);
    erhua.push(false);
  }
  const sandhi: SandhiWord = word.parts === undefined ? { hanzi: keptChars.join(""), syllables: kept } : { hanzi: keptChars.join(""), syllables: kept, parts: word.parts };
  return { sandhi, erhua };
}

/** The spoken tones of one phrase (the words between two marks): phraseSandhiTones over the words, 儿化 set aside. */
function sayPhrase(words: readonly ZhWord[]): SaidWord[] | string {
  const prepared: { sandhi: SandhiWord; erhua: boolean[] }[] = [];
  for (const word of words) {
    const p = sandhiWordOf(word);
    if (typeof p === "string") return p;
    prepared.push(p);
  }
  let tones: number[][];
  try {
    tones = phraseSandhiTones(prepared.map((p) => p.sandhi));
  } catch (e) {
    return (e as Error).message;
  }
  return words.map((w, n) => ({
    surface: w.surface,
    said: prepared[n]!.sandhi.syllables.map((s, k) => ({ base: s.base, tone: tones[n]![k]!, erhua: prepared[n]!.erhua[k]! })),
  }));
}

export type SaidResult = { ok: true; pieces: SaidPiece[] } | { ok: false; error: string };

/** The clip as it is said: stored words with the audio's tone sandhi and 儿化, and its punctuation. */
export function zhSaidPieces(text: string, index: ZhSpeechIndex): SaidResult {
  const cut = zhSpokenPieces(text, index);
  if (!cut.ok) return cut;
  const out: SaidPiece[] = [];
  let phrase: ZhWord[] = [];
  const flush = (): string | null => {
    if (phrase.length === 0) return null;
    const said = sayPhrase(phrase);
    if (typeof said === "string") return said;
    for (const word of said) out.push({ kind: "word", word });
    phrase = [];
    return null;
  };
  for (const piece of cut.pieces) {
    if (piece.kind === "word") {
      phrase.push(piece.word);
      continue;
    }
    const error = flush();
    if (error !== null) return { ok: false, error: `${error} (in "${text}")` };
    out.push(piece);
  }
  const error = flush();
  if (error !== null) return { ok: false, error: `${error} (in "${text}")` };
  return { ok: true, pieces: out };
}

/** The said pinyin in tone numbers (5 = neutral; 儿化 as a trailing r), words spaced — for reports and tests. */
export function saidPinyin(pieces: readonly SaidPiece[]): string {
  return pieces
    .map((p) => (p.kind === "punct" ? p.mark : p.word.said.map((s) => `${s.base}${s.erhua ? "r" : ""}${s.tone === 0 ? 5 : s.tone}`).join("")))
    .join(" ");
}

/** Marks that close a phrase: glued to the word before them and followed by a space (misaki's map_punctuation). */
const CLOSING = new Set([",", ".", "!", "?", ":", ";", "”", ")", "…"]);
const OPENING = new Set(["“", "("]);
/** Where kokoro_synth.py may split a long clip (after a sentence mark and a space). */
const SENTENCE_BREAK = /(?<=[.!?…])\s+/u;

export type ClipPhonemes = { ok: true; phonemes: string; pinyin: string } | { ok: false; error: string };

/** The phonemes of one said syllable; 儿化 replaces a final -n (一点儿 diǎr) and is written on after the tone. */
function saidSyllablePhonemes(s: SaidSyllable): string | null {
  const p = syllablePhonemes(s.base, s.tone);
  if (p === null || !s.erhua) return p;
  return `${p.endsWith("n") ? p.slice(0, -1) : p}${ERHUA_PHONEME}`;
}

/** The Kokoro phoneme string of one Mandarin clip text, or why it cannot be built without a guess. */
export function zhClipPhonemes(text: string, index: ZhSpeechIndex): ClipPhonemes {
  const said = zhSaidPieces(text, index);
  if (!said.ok) return said;
  let out = "";
  let glue = false; // the previous token was an opening mark
  for (const piece of said.pieces) {
    if (piece.kind === "punct") {
      if (CLOSING.has(piece.mark)) out = `${out.trimEnd()}${piece.mark} `;
      else if (OPENING.has(piece.mark)) {
        out = `${out}${out.length > 0 && !out.endsWith(" ") ? " " : ""}${piece.mark}`;
        glue = true;
        continue;
      } else out = `${out.trimEnd()} ${piece.mark} `;
      glue = false;
      continue;
    }
    const spelt: string[] = [];
    for (const s of piece.word.said) {
      const p = saidSyllablePhonemes(s);
      if (p === null) return { ok: false, error: `"${s.base}" of ${piece.word.surface} is not a pinyin syllable Kokoro's table spells (in "${text}")` };
      spelt.push(p);
    }
    out = `${out}${out.length > 0 && !out.endsWith(" ") && !glue ? " " : ""}${spelt.join("")}`;
    glue = false;
  }
  const phonemes = out.replace(/\s+/gu, " ").trim();
  if (!/[^\s\p{P}]/u.test(phonemes)) return { ok: false, error: `no phonemes for "${text}"` };
  const longest = Math.max(...phonemes.split(SENTENCE_BREAK).map((s) => s.length));
  if (longest > KOKORO_MAX_PHONEMES) return { ok: false, error: `a sentence of "${text}" has ${longest} phonemes (Kokoro reads at most ${KOKORO_MAX_PHONEMES}) — split it` };
  return { ok: true, phonemes, pinyin: saidPinyin(said.pieces) };
}
