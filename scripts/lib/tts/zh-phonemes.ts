/**
 * Mandarin pinyin → Kokoro-82M phonemes (P4d audio front-end; plan/reports/P4d-zh-audio-frontend.md).
 *
 * Kokoro v1.0 (`lang_code="z"`, repository hexgrad/Kokoro-82M) calls misaki 0.9.4 `zh.ZHG2P(version=None)`, the
 * "legacy" path: jieba cuts the text into words, pypinyin reads each word (TONE3, neutral tone 5, no tone sandhi),
 * `transcription.pinyin_to_ipa` spells every syllable in IPA with Chao tone letters, `ZHG2P.retone` turns the tone
 * letters into the four arrows the voices were trained on (→ ↗ ↓ ↘; neutral: none) and the syllabic marks into ɨ,
 * syllables of a word are written together, words are separated by a space, and the non-syllabic mark (U+032F) is
 * dropped. This module ports that spelling only; the pinyin comes from the course's stored CC-CEDICT readings with the
 * tone sandhi applied for audio (scripts/lib/tts/zh-readings.ts), never from jieba or pypinyin's dictionaries.
 *
 * ADAPTED from misaki 0.9.4 `misaki/transcription.py` and `misaki/zh.py` (https://github.com/hexgrad/misaki,
 * Apache-2.0, Copyright hexgrad); transcription.py is itself "ADAPTED from
 * https://github.com/stefantaubert/pinyin-to-ipa/blob/master/src/pinyin_to_ipa/transcription.py, Original License:
 * MIT" (Copyright Stefan Taubert). Ported: INITIAL_MAPPING, FINAL_MAPPING, FINAL_MAPPING_AFTER_ZH_CH_SH_R,
 * FINAL_MAPPING_AFTER_Z_C_S, INTERJECTION_MAPPINGS, SYLLABIC_CONSONANT_MAPPINGS and TONE_MAPPING (first variant of
 * each, as `pinyin_to_ipa(py)[0]` takes it), the order of `pinyin_to_ipa`, `ZHG2P.retone` and the U+032F clean-up
 * of `ZHG2P.legacy_call`. Rewritten: pypinyin's strict initial/final split (`to_initials` / `to_finals` with
 * `strict=True, v_to_u=True`) for the syllables CC-CEDICT stores. Added: 儿化 (CC-CEDICT `r5`, e.g. 哪儿 nǎ r) is the
 * toneless 儿 misaki spells, ɚ, written onto the syllable before it. Both licences are on the allowlist; the provenance
 * row is `misaki-zh-pinyin-ipa` in content/sources/registry.json.
 */

/** Chao tone letters of transcription.py TONE_MAPPING (5 = neutral). */
const TONE_MAPPING: Readonly<Record<number, string>> = { 1: "˥", 2: "˧˥", 3: "˧˩˧", 4: "˥˩", 5: "" };

const NON_SYLLABIC = "̯"; // chr(815), the non-syllabic mark (ai̯, au̯, ei̯, ou̯) — removed by legacy_call
const SYLLABIC = "̩"; // chr(809), the syllabic mark (ɻ̩, ɹ̩) — retone writes ɨ

/** INITIAL_MAPPING, first variant (ꭧ U+AB67 is tʂ). */
const INITIAL_MAPPING: Readonly<Record<string, string>> = {
  b: "p", c: "ʦʰ", ch: "ꭧʰ", d: "t", f: "f", g: "k", h: "x", j: "ʨ", k: "kʰ", l: "l", m: "m", n: "n",
  p: "pʰ", q: "ʨʰ", r: "ɻ", s: "s", sh: "ʂ", t: "tʰ", x: "ɕ", z: "ʦ", zh: "ꭧ",
};

/** SYLLABIC_CONSONANT_MAPPINGS, first variant; "0" is where the tone goes. */
const SYLLABIC_CONSONANT_MAPPINGS: Readonly<Record<string, readonly string[]>> = {
  hm: ["h", "m0"], hng: ["h", "ŋ0"], m: ["m0"], n: ["n0"], ng: ["ŋ0"],
};

/** INTERJECTION_MAPPINGS, first variant (er = 二, 耳, 儿 said on their own). */
const INTERJECTION_MAPPINGS: Readonly<Record<string, readonly string[]>> = {
  io: ["j", "ɔ0"], ê: ["ɛ0"], er: ["ɚ0"], o: ["ɔ0"],
};

/** FINAL_MAPPING, first variant; keys are pypinyin's strict finals (ü spelt ü). */
const FINAL_MAPPING: Readonly<Record<string, readonly string[]>> = {
  a: ["a0"], ai: [`ai${NON_SYLLABIC}0`], an: ["a0", "n"], ang: ["a0", "ŋ"], ao: [`au${NON_SYLLABIC}0`], e: ["ɤ0"],
  ei: [`ei${NON_SYLLABIC}0`], en: ["ə0", "n"], eng: ["ə0", "ŋ"], i: ["i0"], ia: ["j", "a0"], ian: ["j", "ɛ0", "n"],
  iang: ["j", "a0", "ŋ"], iao: ["j", `au${NON_SYLLABIC}0`], ie: ["j", "e0"], in: ["i0", "n"], iou: ["j", `ou${NON_SYLLABIC}0`],
  ing: ["i0", "ŋ"], iong: ["j", "ʊ0", "ŋ"], ong: ["ʊ0", "ŋ"], ou: [`ou${NON_SYLLABIC}0`], u: ["u0"],
  uei: ["w", `ei${NON_SYLLABIC}0`], ua: ["w", "a0"], uai: ["w", `ai${NON_SYLLABIC}0`], uan: ["w", "a0", "n"],
  uen: ["w", "ə0", "n"], uang: ["w", "a0", "ŋ"], ueng: ["w", "ə0", "ŋ"], uo: ["w", "o0"], o: ["w", "o0"],
  ü: ["y0"], üe: ["ɥ", "e0"], üan: ["ɥ", "ɛ0", "n"], ün: ["y0", "n"],
};

/** FINAL_MAPPING_AFTER_ZH_CH_SH_R and FINAL_MAPPING_AFTER_Z_C_S (first variants). */
const FINAL_AFTER_RETROFLEX: Readonly<Record<string, readonly string[]>> = { i: [`ɻ${SYLLABIC}0`] };
const FINAL_AFTER_DENTAL: Readonly<Record<string, readonly string[]>> = { i: [`ɹ${SYLLABIC}0`] };

/** misaki zh.py `ZHG2P.retone`: tone letters → arrows, syllabic ɻ̩ / ɹ̩ → ɨ. */
function retone(p: string): string {
  const out = p
    .replace(/˧˩˧/g, "↓") // third tone
    .replace(/˧˥/g, "↗") // second tone
    .replace(/˥˩/g, "↘") // fourth tone
    .replace(/˥/g, "→") // first tone
    .replace(new RegExp(`ɻ${SYLLABIC}`, "g"), "ɨ")
    .replace(new RegExp(`ɹ${SYLLABIC}`, "g"), "ɨ");
  if (out.includes(SYLLABIC)) throw new Error(`retone: ${p}`);
  return out;
}

const INITIALS_LONGEST_FIRST = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "r", "z", "c", "s"];

/**
 * pypinyin's strict split (`to_initials(strict=True)`, `to_finals(strict=True, v_to_u=True)`) of a toneless syllable
 * spelt as parsePinyinReading gives it (ü as v): y and w are not initials (yi → i, you → iou, wu → u, wei → uei),
 * u after j q x y is ü, and iu / ui / un are iou / uei / uen. Null when the syllable is not one pinyin spells.
 */
export function strictInitialFinal(base: string): { initial: string | null; final: string } | null {
  const b = base.replace(/v/g, "ü");
  let initial: string | null = null;
  let final: string;
  if (b.startsWith("y")) {
    if (b.startsWith("yu")) final = `ü${b.slice(2)}`;
    else if (b.startsWith("yi")) final = b.slice(1);
    else final = `i${b.slice(1)}`;
  } else if (b.startsWith("w")) {
    final = b === "wu" ? "u" : `u${b.slice(1)}`;
  } else {
    initial = INITIALS_LONGEST_FIRST.find((i) => b.startsWith(i) && b.length > i.length) ?? null;
    final = initial === null ? b : b.slice(initial.length);
    if (initial !== null && "jqx".includes(initial) && final.startsWith("u")) final = `ü${final.slice(1)}`;
    else if (final === "iu") final = "iou";
    else if (final === "ui") final = "uei";
    else if (final === "un") final = "uen";
  }
  return FINAL_MAPPING[final] !== undefined ? { initial, final } : null;
}

/** The base of a 儿化 syllable (CC-CEDICT r5): not said on its own, it colours the syllable before it. */
export const ERHUA_BASE = "r";
/** What misaki spells for a toneless 儿 (er5 → ɚ), written onto the syllable before it. */
export const ERHUA_PHONEME = "ɚ";

/**
 * misaki `pinyin_to_ipa(py)[0]` + `retone`, with legacy_call's U+032F removal: the Kokoro phonemes of one syllable.
 * `base`: toneless letters (ü as v); `tone`: 1–4, 0 for the neutral tone. Null when the syllable cannot be spelt.
 */
export function syllablePhonemes(base: string, tone: number): string | null {
  if (!Number.isInteger(tone) || tone < 0 || tone > 4) return null;
  const toneIpa = TONE_MAPPING[tone === 0 ? 5 : tone]!;
  const normal = base.replace(/v/g, "ü");
  let parts: readonly string[];
  const interjection = INTERJECTION_MAPPINGS[normal];
  const syllabic = SYLLABIC_CONSONANT_MAPPINGS[normal];
  if (interjection !== undefined) parts = interjection;
  else if (syllabic !== undefined) parts = syllabic;
  else {
    const split = strictInitialFinal(base);
    if (split === null) return null;
    const { initial, final } = split;
    const finalParts =
      initial !== null && ["zh", "ch", "sh", "r"].includes(initial) && FINAL_AFTER_RETROFLEX[final]
        ? FINAL_AFTER_RETROFLEX[final]!
        : initial !== null && ["z", "c", "s"].includes(initial) && FINAL_AFTER_DENTAL[final]
          ? FINAL_AFTER_DENTAL[final]!
          : FINAL_MAPPING[final]!;
    parts = initial === null ? finalParts : [INITIAL_MAPPING[initial]!, ...finalParts];
  }
  return parts
    .map((p) => retone(p.replace("0", toneIpa)))
    .join("")
    .replaceAll(NON_SYLLABIC, "");
}

/**
 * misaki zh.py `map_punctuation`: Chinese marks → the ASCII marks (and curly quotes) of the Kokoro vocabulary. A mark
 * in this table or in SPOKEN_ASCII is kept as a phrase boundary; any other non-hanzi character stops the clip.
 */
export const PUNCTUATION: Readonly<Record<string, string>> = {
  "、": ",", "，": ",", "。": ".", "．": ".", "！": "!", "：": ":", "；": ";", "？": "?",
  "«": "“", "»": "”", "《": "“", "》": "”", "「": "“", "」": "”", "【": "“", "】": "”", "（": "(", "）": ")",
};
/** Marks of the Kokoro vocabulary passed through as they are (config.json `vocab`). */
export const SPOKEN_ASCII: ReadonlySet<string> = new Set([",", ".", "!", "?", ":", ";", "“", "”", "(", ")", "…", "—"]);

/** kokoro 0.9.4 pipeline.py: a phoneme string longer than 510 is truncated; the helper splits at sentence ends. */
export const KOKORO_MAX_PHONEMES = 510;
