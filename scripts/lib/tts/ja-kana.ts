/**
 * The spoken kana of a Japanese clip, built from the course's stored readings (P4c audio front-end; see
 * plan/reports/P4c-ja-audio-frontend.md). This takes MeCab's place in Kokoro's Japanese G2P: the text is read
 * through the same index the app's furigana and romaji line use (src/lib/learning/script-reading.ts — every
 * lexeme's kana + furigana, plus the inflection keys of src/lib/languages/ja-inflection.ts), particles are read
 * as particles (は wa, へ e, を o), and the long vowels are spelt as UniDic's pronunciation field spells them
 * (scripts/lib/tts/ja-phonemes.ts `pronunciationKana`). A kanji without a stored reading is an error — never a
 * guess: the plan reports the clip, and an author adds the word (or its reading) to the lexicon.
 *
 * Data: the readings are content/ja/lexicon/lexemes.json (JmdictFurigana / JMdict, CC BY-SA 4.0), then the
 * audio-only supplement content/audio/ja-spoken-readings.json (original). No MeCab dictionary, no BSD component.
 */

import { furiganaFromKana, japaneseInflectionSources } from "../../../src/lib/languages/ja-inflection";
import { buildScriptReadingIndex, romajiTokens, type ReadingSource, type ScriptReadingIndex } from "../../../src/lib/learning/script-reading";
import type { WordReading } from "../../../src/lib/types";

import { counterAt, countedKana, kanjiNumberValue, phoneKana } from "./ja-numbers";
import { isKana, KOKORO_MAX_PHONEMES, pronunciationKana, toHiragana, tokensToPhonemes, type SpokenToken } from "./ja-phonemes";

export type JaLexemeLike = { surface: string; lemma?: string; legacySurfaces?: string[]; partOfSpeech: string; reading?: { kana?: string; furigana?: { base: string; ruby?: string }[] } };

export type JaSpeechIndex = {
  readings: ScriptReadingIndex;
  /** Surfaces of verbs in their dictionary form (the final う of 思う is the verb ending, not a long vowel). */
  verbForms: ReadonlySet<string>;
  /** Every kanji some stored surface contains (to name the ones a failing clip lacks). */
  knownKanji: ReadonlySet<string>;
};

const HAN_CHAR = /[\p{Script=Han}々〆]/u;

/** The index the app builds for a ja course (use-reading-aid.ts scriptReadingIndexFor), from the rich lexicon. */
export function buildJaSpeechIndex(lexemes: readonly JaLexemeLike[]): JaSpeechIndex {
  const sources: ReadingSource[] = [];
  const verbForms = new Set<string>();
  for (const lex of lexemes) {
    const r = lex.reading;
    if (!r || (!r.kana && !(r.furigana && r.furigana.length > 0))) continue;
    const reading: WordReading = { ...(r.kana ? { kana: r.kana } : {}), ...(r.furigana ? { furigana: r.furigana } : {}) };
    // A legacy surface may be another word form (たべます for 食べる): kept only when the lexeme's kana spells it.
    const legacy = (lex.legacySurfaces ?? []).filter((s) => (HAN_CHAR.test(s) ? furiganaFromKana(s, r.kana ?? "") !== null : toHiragana(s) === toHiragana(r.kana ?? "")));
    for (const surface of [lex.surface, ...legacy]) {
      sources.push({ surface, reading, pos: lex.partOfSpeech });
      if (lex.partOfSpeech === "verb") verbForms.add(surface);
    }
    if (lex.partOfSpeech === "verb" && r.kana) verbForms.add(r.kana);
  }
  const inflected = japaneseInflectionSources(sources);
  const knownKanji = new Set<string>();
  for (const s of sources) for (const ch of s.surface) if (HAN_CHAR.test(ch)) knownKanji.add(ch);
  return { readings: buildScriptReadingIndex([...sources, ...inflected.map((s) => ({ ...s, stem: true as const }))]), verbForms, knownKanji };
}

/** content/audio/ja-spoken-readings.json: audio-only readings of words the lexicon does not store yet. */
export type SpokenReadingsDoc = { version: 1; language: "ja"; note: string; readings: { surface: string; partOfSpeech: string; kana: string }[] };

export const SPOKEN_READINGS_REL = "content/audio/ja-spoken-readings.json";

/** Shape problems of the supplement (pure; tested): kana only, a kanji surface, and kana that fits it. */
export function spokenReadingsProblems(doc: SpokenReadingsDoc): string[] {
  const problems: string[] = [];
  if (doc.version !== 1 || doc.language !== "ja" || !Array.isArray(doc.readings)) return [`${SPOKEN_READINGS_REL}: version 1, language "ja" and a readings list are required`];
  const seen = new Set<string>();
  for (const r of doc.readings) {
    const at = `${SPOKEN_READINGS_REL} ${r.surface}`;
    if (seen.has(r.surface)) problems.push(`${at}: listed twice`);
    seen.add(r.surface);
    if (!HAN_CHAR.test(r.surface)) problems.push(`${at}: a kana word needs no reading`);
    if (!isKana(r.kana)) problems.push(`${at}: "${r.kana}" is not kana`);
    else if (furiganaFromKana(r.surface, r.kana) === null) problems.push(`${at}: "${r.kana}" does not fit the surface's kana`);
    if (!r.partOfSpeech) problems.push(`${at}: partOfSpeech is required`);
  }
  return problems;
}

/** The supplement as lexemes for buildJaSpeechIndex (passed AFTER the lexicon, so a lexicon reading wins). */
export function spokenReadingLexemes(doc: SpokenReadingsDoc): JaLexemeLike[] {
  return doc.readings.map((r) => ({ surface: r.surface, partOfSpeech: r.partOfSpeech, reading: { kana: r.kana, furigana: furiganaFromKana(r.surface, r.kana) ?? undefined } }));
}

export const JA_LEXICON_REL = "content/ja/lexicon/lexemes.json";

/** The committed speech index: the rich lexicon, then the audio supplement; problems of the supplement instead when it is malformed. */
export function loadJaSpeechIndex(read: (rel: string) => unknown, exists: (rel: string) => boolean): { index: JaSpeechIndex | null; problems: string[] } {
  if (!exists(JA_LEXICON_REL)) return { index: null, problems: [`${JA_LEXICON_REL} does not exist: the Japanese front-end reads its words from it`] };
  const lexemes = (read(JA_LEXICON_REL) as { lexemes: JaLexemeLike[] }).lexemes;
  const supplement = exists(SPOKEN_READINGS_REL) ? (read(SPOKEN_READINGS_REL) as SpokenReadingsDoc) : null;
  const problems = supplement === null ? [] : spokenReadingsProblems(supplement);
  if (problems.length > 0) return { index: null, problems };
  return { index: buildJaSpeechIndex([...lexemes, ...(supplement === null ? [] : spokenReadingLexemes(supplement))]), problems: [] };
}

const KANJI_NUMERAL = /^[〇零一二三四五六七八九十百千万]+/u;
const ARABIC_NUMBER = /^(?:\d+(?:-\d+)+|\d{1,3}(?:,\d{3})+(?!\d)|\d+)/u;

/** Whether a stored surface starting at `i` covers at least `length` code points (三つ, 十分, 一人 keep their stored reading). */
function storedCovers(cps: readonly string[], i: number, length: number, index: JaSpeechIndex): boolean {
  for (let len = Math.min(index.readings.maxLength, cps.length - i); len >= length; len--) {
    if (index.readings.bySurface.has(cps.slice(i, i + len).join(""))) return true;
  }
  return false;
}

/** A clip text cut into text to read through the index and numbers already spelt in kana. */
export type TextPart = { kind: "text"; text: string } | { kind: "number"; kana: string[] };

/**
 * Numbers spelt in kana before the text is read (MeCab's job in misaki): phone-style digit groups one digit at a
 * time, Arabic numerals with the counter after them (3000円 さんぜんえん, 4時 よじ), and kanji numerals before a
 * counter unless a stored word covers them (四時 よじ, 一匹 いっぴき; 三つ and 十分 keep their stored reading).
 * A spelt number is its own part, so the index never re-reads its kana as other words. A decimal or a time
 * written 8:30 is left as digits (the clip is then reported).
 */
export function spellNumbers(text: string, index: JaSpeechIndex): TextPart[] {
  const cps = [...text.replace(/[０-９]/gu, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))];
  const parts: TextPart[] = [];
  let plain = "";
  const number = (kana: string[]) => {
    if (plain !== "") parts.push({ kind: "text", text: plain });
    plain = "";
    parts.push({ kind: "number", kana });
  };
  let i = 0;
  while (i < cps.length) {
    const rest = cps.slice(i).join("");
    const arabic = /\d/u.test(cps[i]!) && (i === 0 || !/[\d.,:]/u.test(cps[i - 1]!)) ? ARABIC_NUMBER.exec(rest) : null;
    if (arabic !== null && !/^[.:]\d/u.test(rest.slice(arabic[0].length))) {
      const m = arabic[0];
      const len = [...m].length;
      if (m.includes("-")) {
        number(phoneKana(m).split(" "));
        i += len;
        continue;
      }
      const n = Number(m.replace(/,/g, ""));
      if (Number.isSafeInteger(n) && n < 1e8) {
        const counter = counterAt(rest.slice(m.length));
        number([countedKana(n, counter)]);
        i += len + (counter === undefined ? 0 : [...counter].length);
        continue;
      }
    }
    const kanji = i === 0 || !KANJI_NUMERAL.test(cps[i - 1]!) ? KANJI_NUMERAL.exec(rest) : null;
    if (kanji !== null && kanji[0][0] !== "万") {
      const numeral = kanji[0];
      const counter = counterAt(rest.slice(numeral.length));
      const value = kanjiNumberValue(numeral);
      const span = [...numeral].length + (counter === undefined ? 0 : [...counter].length);
      if (counter !== undefined && value !== null && value < 1e8 && !storedCovers(cps, i, span, index)) {
        number([countedKana(value, counter)]);
        i += span;
        continue;
      }
      plain += numeral;
      i += [...numeral].length;
      continue;
    }
    plain += cps[i];
    i += 1;
  }
  if (plain !== "") parts.push({ kind: "text", text: plain });
  return parts;
}

/** Set expressions whose final は is the old particle, read wa (as the romaji line reads them). */
const WA_EXPRESSIONS: ReadonlySet<string> = new Set(["こんにちは", "こんばんは", "では", "それでは", "じゃあでは"]);

/** Function words a kana run may be made of (script-reading.ts FUNCTION_KANA), longest match first. */
const FUNCTION_KANA = ["から", "まで", "より", "だけ", "ごろ", "たち", "は", "が", "を", "に", "で", "へ", "と", "も", "の", "か", "ね", "よ", "や", "な"];

/** Particles spoken unlike their spelling. */
const PARTICLE_SPOKEN: Readonly<Record<string, string>> = { は: "わ", へ: "え", を: "お" };

/** The romaji line's ASCII punctuation back to the Japanese mark cutlet spaces by (「 」 〜). */
const PUNCT_BACK: Readonly<Record<string, string>> = { "“": "「", "”": "」", "~": "〜" };

/** A run of kana split into function words, or null when it is not made of them only. */
function functionWords(run: string): string[] | null {
  const parts: string[] = [];
  let rest = run;
  while (rest.length > 0) {
    const w = FUNCTION_KANA.find((f) => rest.startsWith(f));
    if (w === undefined) return null;
    parts.push(w);
    rest = rest.slice(w.length);
  }
  return parts;
}

/** A plain kana run split where the script changes (ナムは → ナム + は): a particle never shares a word with katakana. */
function scriptRuns(run: string): string[] {
  return run.match(/[ァ-ヺー]+|[^ァ-ヺー]+/gu) ?? [run];
}

type Raw = NonNullable<ReturnType<typeof romajiTokens>>[number];

/** The text a token was read from (a chunk has no whitespace, so the tokens spell it exactly). */
function tokenText(t: Raw, chunk: string, at: number): string {
  if ("kana" in t) return t.surface ?? t.kana;
  if (t.kind === "punct") return [...chunk.slice(at)][0] ?? "";
  return t.text;
}

/** A token after which a particle may start: a stored word, an inflection key, を, or a katakana / honorific end. */
function particleMayFollow(t: Raw | undefined): boolean {
  if (t === undefined) return false;
  if (!("kana" in t)) return t.kind === "other";
  if (t.kind !== "plain") return true;
  return /[ァ-ヺー]$|さん$|ちゃん$|くん$|さま$/u.test(t.kana);
}

/** Particle combinations that may stand before は (には, では, とは, のは, からは, までは, へは). */
const BEFORE_WA: ReadonlySet<string> = new Set(["に", "で", "と", "の", "から", "まで", "へ", "より"]);

/**
 * Where a は or へ in a chunk is the particle, not part of a word: right after a word (お名前|は|なん, 弁当|は|あたためます,
 * わたし|は|すずき, さん|は|いつも), or after に/で/の… that follow one (青いの|は|ありません). The romaji tokenizer
 * reads the longest stored kana word first (はな, はい); MeCab knew better. Kana words starting with は written
 * right after a noun without a particle (毎日はたらきます) would be misread — course text writes those verbs in kanji.
 */
function particleOffset(chunk: string, raw: readonly Raw[], afterWord: boolean): number | null {
  let at = 0;
  for (let k = 0; k < raw.length; k++) {
    const t = raw[k]!;
    const text = tokenText(t, chunk, at);
    if ("kana" in t && (t.kind === "plain" || t.kind === "word")) {
      const cps = [...text];
      for (let j = 0; j < cps.length; j++) {
        if (t.kind === "word" && j > 0) break; // inside a stored word, は is the word's
        const ch = cps[j]!;
        if (ch !== "は" && ch !== "へ") continue;
        if (WA_EXPRESSIONS.has(text) || (j === 0 && cps.length === 1)) continue; // already a particle on its own
        const prefix = cps.slice(0, j).join("");
        const before = k === 0 ? afterWord : particleMayFollow(raw[k - 1]);
        const ok = j === 0 ? before : ch === "は" && BEFORE_WA.has(prefix) && before;
        if (ok) return [...chunk.slice(0, at)].length + j;
      }
    }
    at += text.length;
  }
  return null;
}

/**
 * A chunk (no whitespace) split so that each particle は / へ stands alone. `afterWord`: the chunk follows a
 * spelt number directly (3000円は), so a は at its start is a particle too.
 */
function particleChunks(chunk: string, index: JaSpeechIndex, afterWord = false, depth = 0): string[] {
  const raw = romajiTokens(chunk, index.readings);
  if (raw === null || depth > 16) return [chunk];
  const at = particleOffset(chunk, raw, afterWord);
  if (at === null) return [chunk];
  const cps = [...chunk];
  const left = cps.slice(0, at).join("");
  const right = cps.slice(at + 1).join("");
  return [...(left ? particleChunks(left, index, afterWord, depth + 1) : []), cps[at]!, ...(right ? particleChunks(right, index, false, depth + 1) : [])];
}

export type SpokenResult = { ok: true; tokens: SpokenToken[]; kana: string } | { ok: false; error: string };

/** The spoken tokens of a text: stored words by their kana, particles as spoken, punctuation kept. */
export function spokenTokens(text: string, index: JaSpeechIndex): SpokenResult {
  const parts = spellNumbers(text.normalize("NFC"), index);
  const chunks: ({ number: string[] } | { chunk: string })[] = [];
  parts.forEach((part, p) => {
    if (part.kind === "number") return void chunks.push({ number: part.kana });
    const afterNumber = p > 0 && !/^\s/u.test(part.text);
    part.text
      .split(/\s+/u)
      .filter(Boolean)
      .forEach((c, n) => chunks.push(...particleChunks(c, index, afterNumber && n === 0).map((chunk) => ({ chunk }))));
  });
  const out: SpokenToken[] = [];
  const word = (kana: string) => out.push({ kind: "kana", kana });
  for (const item of chunks) {
    if ("number" in item) {
      for (const kana of item.number) word(pronunciationKana(kana));
      continue;
    }
    const chunk = item.chunk;
    const raw = romajiTokens(chunk, index.readings);
    if (raw === null) {
      const missing = [...new Set([...text].filter((c) => HAN_CHAR.test(c) && !index.knownKanji.has(c)))];
      const what = missing.length > 0 ? `no stored word has ${missing.join("")}` : `no stored word reads "${chunk}"`;
      return { ok: false, error: `${what} (in "${text}") — add the word or its reading to the lexicon` };
    }
    raw.forEach((t, i) => {
      if (!("kana" in t)) {
        if (t.kind === "punct") out.push({ kind: "punct", text: PUNCT_BACK[t.text] ?? t.text });
        else if (t.text !== "") out.push({ kind: "other", text: t.text });
        return;
      }
      if (t.kind === "particle") return void word(PARTICLE_SPOKEN[t.kana] ?? t.kana);
      if (t.kind === "word" || t.kind === "stem") {
        const surface = t.surface ?? t.kana;
        if (WA_EXPRESSIONS.has(t.kana)) return void word(pronunciationKana(`${t.kana.slice(0, -1)}わ`));
        const keepFinalU = t.kind === "word" && index.verbForms.has(surface);
        return void word(pronunciationKana(t.kana, { keepFinalU }));
      }
      // A plain run: kana the index does not store as a word (particles, names written in kana, endings).
      for (const run of scriptRuns(t.kana)) {
        if (WA_EXPRESSIONS.has(run)) {
          word(pronunciationKana(`${run.slice(0, -1)}わ`));
          continue;
        }
        const fw = /^[ァ-ヺー]+$/u.test(run) ? null : functionWords(run);
        if (fw !== null) {
          for (const f of fw) word(PARTICLE_SPOKEN[f] ?? f);
          continue;
        }
        // A run ending in は/へ before a stored word, punctuation or the end: the particle after a word the index
        // does not store (すずきは, うちへ). A kana word ending in は/へ is stored (はは, へへ are not A1 text).
        const next = raw[i + 1];
        const beforeBoundary = next === undefined || !("kana" in next) || next.kind !== "plain";
        const tail = run.slice(-1);
        if (run.length > 1 && beforeBoundary && (tail === "は" || tail === "へ")) {
          word(pronunciationKana(run.slice(0, -1)));
          word(PARTICLE_SPOKEN[tail]!);
          continue;
        }
        word(pronunciationKana(run));
      }
    });
  }
  const kana = out.map((t) => (t.kind === "kana" ? t.kana : t.text)).join(" ");
  return { ok: true, tokens: out, kana };
}

/** Problems of a clip's spoken form that Kokoro would get wrong silently (digits, Latin letters, unknown marks). */
function spokenProblems(tokens: readonly SpokenToken[], text: string): string[] {
  const problems: string[] = [];
  for (const t of tokens) {
    if (t.kind !== "other") continue;
    if (/\p{N}/u.test(t.text)) problems.push(`digits "${t.text}" in "${text}" (write the number in kanji or kana)`);
    else if (/\p{L}/u.test(t.text)) problems.push(`Latin letters "${t.text}" in "${text}" (Kokoro's Japanese voices read kana only)`);
  }
  return problems;
}

export type ClipPhonemes = { ok: true; phonemes: string; kana: string } | { ok: false; error: string };

/** The Kokoro phoneme string of one Japanese clip text, or why it cannot be built without a guess. */
export function jaClipPhonemes(text: string, index: JaSpeechIndex): ClipPhonemes {
  const spoken = spokenTokens(text, index);
  if (!spoken.ok) return spoken;
  const problems = spokenProblems(spoken.tokens, text);
  if (problems.length > 0) return { ok: false, error: problems.join("; ") };
  const phonemes = tokensToPhonemes(spoken.tokens);
  if (phonemes.length === 0) return { ok: false, error: `no phonemes for "${text}"` };
  if (phonemes.length > KOKORO_MAX_PHONEMES * 4) return { ok: false, error: `"${text}" is too long for one clip (${phonemes.length} phonemes)` };
  return { ok: true, phonemes, kana: spoken.kana };
}
