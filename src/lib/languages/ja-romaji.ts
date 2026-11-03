/**
 * Hepburn reading of kana (P4c). One module for the kana primer — every table
 * cell's rōmaji is checked against it (scripts/lib/script-primer.ts) — and for
 * the romaji line the app shows under Japanese text until the learner passes
 * the primer checkpoint (learning/script-reading.ts).
 *
 * Kana-faithful Hepburn: each kana is spelt as the primer teaches it (し shi,
 * ち chi, つ tsu, ふ fu, を o, ぢ ji, づ zu); yōon join (きゃ kya, しゃ sha,
 * じゃ ja); っ doubles the next consonant (っち → tch); ん is n, n' before a
 * vowel or y; ー puts a macron on the vowel it lengthens. Vowel sequences the
 * kana spell out stay as written (とうきょう toukyou, おばあさん obaasan): a
 * macron there would need the word's morphology (思う is omou, not omō).
 * Romaji is a reading aid only — it is never accepted as an answer.
 */

/** Hepburn of every full-size kana (hiragana; katakana is folded to it first). */
const KANA: Readonly<Record<string, string>> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "o", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ゔ: "vu",
};

/** Small kana read on their own (a stray small kana in running text). */
const SMALL: Readonly<Record<string, string>> = { ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o", ゃ: "ya", ゅ: "yu", ょ: "yo", ゎ: "wa" };

const YOON: Readonly<Record<string, string>> = { ゃ: "a", ゅ: "u", ょ: "o" };

/** Kana + small vowel sounds of loanwords (ファ fa, ティ ti, ウィ wi, チェ che…). */
const EXTENDED: Readonly<Record<string, string>> = {
  ふぁ: "fa", ふぃ: "fi", ふぇ: "fe", ふぉ: "fo",
  てぃ: "ti", でぃ: "di", とぅ: "tu", どぅ: "du",
  うぃ: "wi", うぇ: "we", うぉ: "wo",
  ちぇ: "che", しぇ: "she", じぇ: "je", いぇ: "ye",
  ゔぁ: "va", ゔぃ: "vi", ゔぇ: "ve", ゔぉ: "vo",
};

const MACRON: Readonly<Record<string, string>> = { a: "ā", i: "ī", u: "ū", e: "ē", o: "ō" };

/** Katakana → hiragana (ヴ → ゔ); ー and everything else unchanged. */
function toHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/** One syllable starting at `i` of hiragana `cps`: its rōmaji and how many code points it takes; null when not kana. */
function syllableAt(cps: readonly string[], i: number): { romaji: string; length: number } | null {
  const ch = cps[i]!;
  const next = cps[i + 1];
  const pair = next === undefined ? undefined : EXTENDED[ch + next];
  if (pair !== undefined) return { romaji: pair, length: 2 };
  const base = KANA[ch];
  if (base === undefined) {
    const small = SMALL[ch];
    return small === undefined ? null : { romaji: small, length: 1 };
  }
  const yoon = next === undefined ? undefined : YOON[next];
  if (yoon !== undefined && base.length > 1 && base.endsWith("i")) {
    const stem = base.slice(0, -1);
    return { romaji: /^(sh|ch|j)$/.test(stem) ? stem + yoon : `${stem}y${yoon}`, length: 2 };
  }
  return { romaji: base, length: 1 };
}

/**
 * The Hepburn reading of a run of kana (hiragana, katakana, っ, ー), or
 * undefined when the text holds anything else (kanji, Latin, punctuation) —
 * the caller never shows a guessed reading.
 */
export function hepburn(kana: string): string | undefined {
  const cps = [...toHiragana(kana)];
  if (cps.length === 0) return undefined;
  let out = "";
  let geminate = false;
  let afterN = false;
  let i = 0;
  while (i < cps.length) {
    const ch = cps[i]!;
    if (ch === "ー") {
      const last = out.slice(-1);
      if (MACRON[last] !== undefined) out = out.slice(0, -1) + MACRON[last];
      i += 1;
      continue;
    }
    if (ch === "っ") {
      geminate = true;
      i += 1;
      continue;
    }
    const syllable = syllableAt(cps, i);
    if (syllable === null) return undefined;
    let romaji = syllable.romaji;
    if (geminate) {
      if (romaji.startsWith("ch")) romaji = `t${romaji}`;
      else if (/^[bcdfghjklmnpqrstvwxyz]/.test(romaji)) romaji = romaji[0] + romaji;
      geminate = false;
    }
    if (afterN && /^[aeiouy]/.test(romaji)) out += "'";
    afterN = ch === "ん";
    out += romaji;
    i += syllable.length;
  }
  return out.length > 0 ? out : undefined;
}

/**
 * The Hepburn reading of ONE primer cell: a single full-size kana, or a kana
 * with its small ゃ/ゅ/ょ or loanword small vowel (きゃ, ファ); undefined for
 * anything else (a word, a lone small kana, っ, ー, kanji, Latin).
 */
export function kanaHepburn(cell: string): string | undefined {
  const cps = [...toHiragana(cell)];
  if (cps.length === 0 || cps.length > 2 || KANA[cps[0]!] === undefined) return undefined;
  const syllable = syllableAt(cps, 0);
  return syllable !== null && syllable.length === cps.length ? syllable.romaji : undefined;
}
