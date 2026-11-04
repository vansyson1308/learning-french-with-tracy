/**
 * Revised Romanization of Korean (P4b stage 4) — our own deterministic rule
 * set, written from the official rule text (National Institute of Korean
 * Language, "Romanization of Korean", https://www.korean.go.kr/front_eng/roman/roman_01.do).
 * No data: every output is a function of the spelling.
 *
 * Chapter 3 Article 1 — sound changes the romanization reflects:
 *   1. assimilation of adjacent consonants (백마 baengma, 종로 jongno,
 *      왕십리 wangsimni, 별내 byeollae, 신라 silla);
 *   2. epenthetic ㄴ/ㄹ (학여울 hangnyeoul, 알약 allyak) — needs a compound
 *      boundary, see below;
 *   3. palatalization (해돋이 haedoji, 같이 gachi, 굳히다 guchida);
 *   4. ㄱ ㄷ ㅂ ㅈ next to ㅎ become aspirated (좋고 joko, 잡혀 japyeo) —
 *      EXCEPT in nouns where ㅎ follows ㄱ ㄷ ㅂ (묵호 Mukho, 집현전 Jiphyeonjeon):
 *      pass `{ noun: true }`.
 * Tensification is never reflected (압구정 apgujeong, 샛별 saetbyeol).
 * Chapter 2: ㄱ ㄷ ㅂ are g d b before a vowel, k t p before a consonant or at
 * the end; ㄹ is r before a vowel, l before a consonant or at the end, ㄹㄹ = ll;
 * ㅢ is always ui. Article 2: a hyphen where a syllable boundary could be
 * misread (중앙 jung-ang, 반구대 ban-gudae, 세운 se-un, 해운대 hae-undae).
 *
 * Morphology the spelling does not show is written into the INPUT, never
 * guessed: a `+` between two syllables marks a compound boundary, where
 * Standard Pronunciation inserts ㄴ before 이/야/여/요/유/얘/예 (학+여울
 * [항녀울]), a final is neutralised before it liaises (맛+없다 [마덥다]), and
 * ㄴ+ㄹ stays [ㄴㄴ] (신문+로 [신문노]). Output is lower case; proper nouns are
 * capitalised by the caller (capitalizeRr).
 */

const INITIALS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] as const;
const MEDIALS = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"] as const;
const FINALS = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] as const;

const INITIAL_RR: Readonly<Record<string, string>> = {
  ㄱ: "g", ㄲ: "kk", ㄴ: "n", ㄷ: "d", ㄸ: "tt", ㄹ: "r", ㅁ: "m", ㅂ: "b", ㅃ: "pp", ㅅ: "s",
  ㅆ: "ss", ㅇ: "", ㅈ: "j", ㅉ: "jj", ㅊ: "ch", ㅋ: "k", ㅌ: "t", ㅍ: "p", ㅎ: "h",
};
/** The seven representative finals (after neutralisation). */
const FINAL_RR: Readonly<Record<string, string>> = { ㄱ: "k", ㄴ: "n", ㄷ: "t", ㄹ: "l", ㅁ: "m", ㅂ: "p", ㅇ: "ng" };

/** Final before a consonant or at the end of a word. */
const NEUTRAL: Readonly<Record<string, string>> = {
  ㄱ: "ㄱ", ㄲ: "ㄱ", ㅋ: "ㄱ", ㄳ: "ㄱ", ㄺ: "ㄱ",
  ㄴ: "ㄴ", ㄵ: "ㄴ", ㄶ: "ㄴ",
  ㄷ: "ㄷ", ㅅ: "ㄷ", ㅆ: "ㄷ", ㅈ: "ㄷ", ㅊ: "ㄷ", ㅌ: "ㄷ", ㅎ: "ㄷ",
  ㄹ: "ㄹ", ㄼ: "ㄹ", ㄽ: "ㄹ", ㄾ: "ㄹ", ㅀ: "ㄹ",
  ㅁ: "ㅁ", ㄻ: "ㅁ",
  ㅂ: "ㅂ", ㅍ: "ㅂ", ㄿ: "ㅂ", ㅄ: "ㅂ",
  ㅇ: "ㅇ",
};
const CLUSTER: Readonly<Record<string, readonly [string, string]>> = {
  ㄳ: ["ㄱ", "ㅅ"], ㄵ: ["ㄴ", "ㅈ"], ㄶ: ["ㄴ", "ㅎ"], ㄺ: ["ㄹ", "ㄱ"], ㄻ: ["ㄹ", "ㅁ"], ㄼ: ["ㄹ", "ㅂ"],
  ㄽ: ["ㄹ", "ㅅ"], ㄾ: ["ㄹ", "ㅌ"], ㄿ: ["ㄹ", "ㅍ"], ㅀ: ["ㄹ", "ㅎ"], ㅄ: ["ㅂ", "ㅅ"],
};
const ASPIRATED: Readonly<Record<string, string>> = { ㄱ: "ㅋ", ㄷ: "ㅌ", ㅂ: "ㅍ", ㅈ: "ㅊ" };
const NASAL_OF: Readonly<Record<string, string>> = { ㄱ: "ㅇ", ㄷ: "ㄴ", ㅂ: "ㅁ" };
/** Stop class of a final before ㅎ (ㅈ ㅊ aspirate to ㅊ, the rest by place). */
const STOP_BEFORE_H: Readonly<Record<string, string>> = {
  ㄱ: "ㄱ", ㄲ: "ㄱ", ㅋ: "ㄱ", ㄷ: "ㄷ", ㅅ: "ㄷ", ㅆ: "ㄷ", ㅌ: "ㄷ", ㅈ: "ㅈ", ㅊ: "ㅈ", ㅂ: "ㅂ", ㅍ: "ㅂ",
};

const V_I = 20; // ㅣ
/** ㅣ, ㅑ, ㅕ, ㅛ, ㅠ, ㅒ, ㅖ: the vowels before which a compound boundary inserts ㄴ. */
const N_INSERTION_VOWELS = new Set([20, 2, 6, 12, 17, 3, 7]);

type Syllable = { kind: "syl"; i: string; v: number; f: string; compoundBefore: boolean };
type Other = { kind: "other"; text: string };
type Unit = Syllable | Other;

export type RrOptions = {
  /** The word is a noun: ㄱ ㄷ ㅂ before ㅎ are not aspirated (Article 1 item 4 note). */
  noun?: boolean;
  /** Article 2 hyphen where a boundary could be misread (default true). */
  hyphenate?: boolean;
};

const HANGUL_FIRST = 0xac00;
const HANGUL_LAST = 0xd7a3;

export function isHangulSyllable(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  return cp >= HANGUL_FIRST && cp <= HANGUL_LAST;
}

function parse(text: string): Unit[] {
  const units: Unit[] = [];
  let compound = false;
  for (const ch of text.normalize("NFC")) {
    if (ch === "+") {
      compound = true;
      continue;
    }
    if (isHangulSyllable(ch)) {
      const n = ch.codePointAt(0)! - HANGUL_FIRST;
      units.push({ kind: "syl", i: INITIALS[Math.floor(n / 588)]!, v: Math.floor((n % 588) / 28), f: FINALS[n % 28]!, compoundBefore: compound });
    } else {
      units.push({ kind: "other", text: ch });
    }
    compound = false;
  }
  return units;
}

/** Sound changes across one syllable boundary, in place (a = before, b = after). */
function boundary(a: Syllable, b: Syllable, opts: RrOptions): void {
  const compound = b.compoundBefore;
  let F = a.f;
  if (F === "") return;
  // Epenthetic ㄴ at a compound boundary (학+여울 → 항녀울, 알+약 → 알냑 → 알략).
  if (compound && b.i === "ㅇ" && N_INSERTION_VOWELS.has(b.v)) b.i = "ㄴ";
  const I = b.i;

  if (I === "ㅇ") {
    if (compound) {
      // A final liaises only after neutralisation across a compound boundary (맛+없다 → 마덥다).
      const n = NEUTRAL[F]!;
      if (n === "ㅇ") return;
      a.f = "";
      b.i = n;
      return;
    }
    if (F === "ㅇ") return;
    if (F === "ㅎ") {
      a.f = "";
      return;
    }
    if (F === "ㄶ" || F === "ㅀ") {
      a.f = "";
      b.i = F === "ㄶ" ? "ㄴ" : "ㄹ";
      return;
    }
    const cluster = CLUSTER[F];
    let moved = F;
    if (cluster) {
      a.f = cluster[0];
      moved = cluster[1];
    } else {
      a.f = "";
    }
    if (b.v === V_I) moved = moved === "ㄷ" ? "ㅈ" : moved === "ㅌ" ? "ㅊ" : moved;
    b.i = moved;
    return;
  }

  // ㅎ as (part of) the final: aspiration, ㅎ+ㅅ, ㅎ+ㄴ.
  if (F === "ㅎ" || F === "ㄶ" || F === "ㅀ") {
    const rest = F === "ㅎ" ? "" : F === "ㄶ" ? "ㄴ" : "ㄹ";
    if (I === "ㄱ" || I === "ㄷ" || I === "ㅈ") {
      b.i = ASPIRATED[I]!;
      a.f = rest;
      return;
    }
    if (I === "ㅅ") {
      b.i = "ㅆ";
      a.f = rest;
      return;
    }
    if (I === "ㄴ") {
      if (F === "ㅀ") {
        a.f = "ㄹ";
        b.i = "ㄹ";
      } else {
        a.f = "ㄴ";
      }
      return;
    }
    a.f = rest === "" ? "ㄷ" : rest;
    F = a.f;
  }

  // ㅎ as the next initial after a stop: aspiration (not in nouns after ㄱ ㄷ ㅂ).
  if (I === "ㅎ") {
    const cluster = CLUSTER[F];
    const keep = cluster && STOP_BEFORE_H[cluster[1]] !== undefined ? cluster[0] : "";
    const stop = cluster ? STOP_BEFORE_H[cluster[1]] : STOP_BEFORE_H[F];
    if (stop === undefined) {
      a.f = NEUTRAL[F]!;
      return;
    }
    if (opts.noun && stop !== "ㅈ" && keep === "") {
      a.f = NEUTRAL[F]!;
      return;
    }
    a.f = keep;
    let asp = ASPIRATED[stop]!;
    if (asp === "ㅌ" && b.v === V_I) asp = "ㅊ";
    b.i = asp;
    return;
  }

  // 표준 발음법 11항 다만: ㄺ reads ㄹ before ㄱ only in a verb or adjective stem (읽고 [일꼬]); a noun reads ㄱ (닭고기 [닥꼬기]).
  const n = F === "ㄺ" && I === "ㄱ" && opts.noun !== true ? "ㄹ" : NEUTRAL[F]!;
  a.f = n;
  if (I === "ㄴ" || I === "ㅁ") {
    if (NASAL_OF[n]) a.f = NASAL_OF[n]!;
    if (I === "ㄴ" && n === "ㄹ") b.i = "ㄹ";
    return;
  }
  if (I === "ㄹ") {
    if (n === "ㄴ") {
      if (compound) b.i = "ㄴ";
      else a.f = "ㄹ";
    } else if (n === "ㅁ" || n === "ㅇ") {
      b.i = "ㄴ";
    } else if (NASAL_OF[n]) {
      b.i = "ㄴ";
      a.f = NASAL_OF[n]!;
    }
  }
}

const VOWEL_LETTERS = /[aeiouwy]$/;
const DIGRAPHS = new Set(["ae", "eo", "eu", "oe", "ui", "wa", "wo", "we", "wi", "ya", "ye", "yo", "yu"]);

/** Article 2: would the joined letters read across this boundary differently? */
function ambiguous(prev: string, next: string): boolean {
  if (prev.length === 0 || next.length === 0) return false;
  if (prev.endsWith("n") && next.startsWith("g")) return true; // ban-gu ≠ bang-u
  if (prev.endsWith("ng") && /^[aeiouwy]/.test(next)) return true; // jung-ang ≠ jun-gang
  if (VOWEL_LETTERS.test(prev) && /^[aeiouwy]/.test(next)) return DIGRAPHS.has(prev.slice(-1) + next[0]); // se-un ≠ seu-n
  return false;
}

/** Revised Romanization of a hangul text (lower case). Non-hangul characters pass through and end a word. */
export function romanizeKorean(text: string, opts: RrOptions = {}): string {
  const units = parse(text);
  for (let k = 0; k + 1 < units.length; k++) {
    const a = units[k]!;
    const b = units[k + 1]!;
    if (a.kind === "syl" && b.kind === "syl") boundary(a, b, opts);
  }
  // Word-final (or before a non-hangul character): neutralise.
  for (let k = 0; k < units.length; k++) {
    const u = units[k]!;
    const next = units[k + 1];
    if (u.kind === "syl" && u.f !== "" && (next === undefined || next.kind !== "syl")) u.f = NEUTRAL[u.f]!;
  }
  let out = "";
  let prevRoman = "";
  let prevFinal = "";
  for (const u of units) {
    if (u.kind === "other") {
      out += u.text;
      prevRoman = "";
      prevFinal = "";
      continue;
    }
    const initial = u.i === "ㄹ" ? (prevFinal === "ㄹ" ? "l" : "r") : INITIAL_RR[u.i]!;
    const syllable = initial + MEDIALS[u.v]! + (u.f === "" ? "" : FINAL_RR[u.f]!);
    if ((opts.hyphenate ?? true) && ambiguous(prevRoman, syllable)) out += "-";
    out += syllable;
    prevRoman = syllable;
    prevFinal = u.f;
  }
  return out;
}

/** Capitalised form for proper nouns (Article 3–5 examples: Silla, Jongno). */
export function capitalizeRr(rr: string): string {
  return rr.length === 0 ? rr : rr[0]!.toUpperCase() + rr.slice(1);
}

/** The spelling a `+`-marked rule input stands for. */
export function stripRrBoundaries(spelling: string): string {
  return spelling.replace(/\+/g, "");
}
