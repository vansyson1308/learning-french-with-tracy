/**
 * Japanese kana → Kokoro-82M phonemes, without MeCab (P4c audio front-end, plan/reports/P4c-ja-audio-frontend.md).
 *
 * Kokoro's `lang_code="j"` pipeline (kokoro 0.9.4) calls misaki 0.9.4 `ja.JAG2P()`, whose default version is
 * "cutlet": fugashi + the UniDic dictionary (BSD) segment the text and give each word its pronunciation in
 * katakana, then a kana table spells it in the IPA alphabet the Japanese voices were trained on. Every MeCab
 * dictionary is BSD (not allowlisted), so this module ports only the dictionary-free half — the kana table and
 * its per-kana rules — and the course's own stored readings (scripts/lib/tts/ja-kana.ts) take MeCab's place.
 *
 * ADAPTED from misaki 0.9.4 `misaki/cutlet.py` (https://github.com/hexgrad/misaki, Apache-2.0,
 * Copyright hexgrad), itself "ADAPTED from https://github.com/polm/cutlet/blob/main/cutlet/cutlet.py, Original
 * License: MIT" (Copyright Paul O'Leary McCann). Ported: the HEPBURN table (generated from the file's text, not
 * retyped), `_get_single_mapping` (digraphs, small kana, ー, っ, ん assimilation, odoriji), the token spacing of
 * `_romaji_tokens` and the final clean-up of `Cutlet.__call__`. Changed: input is our kana, not MeCab output;
 * the long-vowel spelling UniDic's pronunciation field gives (とうきょう → トーキョー) is rebuilt by
 * `pronunciationKana`. Both licences are on the allowlist; the provenance row is `misaki-ja-kana-table` in
 * content/sources/registry.json.
 */

/** misaki 0.9.4 cutlet.py HEPBURN (164 kana entries + 25 symbols), generated from the source text. */
const TABLE: Readonly<Record<string, string>> = {
  "ぁ": "a", "あ": "a", "ぃ": "i", "い": "i", "ぅ": "ɯ", "う": "ɯ",
  "ぇ": "e", "え": "e", "ぉ": "o", "お": "o", "か": "ka", "が": "ɡa",
  "き": "kʲi", "ぎ": "ɡʲi", "く": "kɯ", "ぐ": "ɡɯ", "け": "ke", "げ": "ɡe",
  "こ": "ko", "ご": "ɡo", "さ": "sa", "ざ": "ʣa", "し": "ɕi", "じ": "ʥi",
  "す": "sɨ", "ず": "zɨ", "せ": "se", "ぜ": "ʣe", "そ": "so", "ぞ": "ʣo",
  "た": "ta", "だ": "da", "ち": "ʨi", "ぢ": "ʥi", "つ": "ʦɨ", "づ": "zɨ",
  "て": "te", "で": "de", "と": "to", "ど": "do", "な": "na", "に": "ɲi",
  "ぬ": "nɯ", "ね": "ne", "の": "no", "は": "ha", "ば": "ba", "ぱ": "pa",
  "ひ": "çi", "び": "bʲi", "ぴ": "pʲi", "ふ": "ɸɯ", "ぶ": "bɯ", "ぷ": "pɯ",
  "へ": "he", "べ": "be", "ぺ": "pe", "ほ": "ho", "ぼ": "bo", "ぽ": "po",
  "ま": "ma", "み": "mʲi", "む": "mɯ", "め": "me", "も": "mo", "ゃ": "ja",
  "や": "ja", "ゅ": "jɯ", "ゆ": "jɯ", "ょ": "jo", "よ": "jo", "ら": "ɾa",
  "り": "ɾʲi", "る": "ɾɯ", "れ": "ɾe", "ろ": "ɾo", "ゎ": "βa", "わ": "βa",
  "ゐ": "i", "ゑ": "e", "を": "o", "ゔ": "vɯ", "ゕ": "ka", "ゖ": "ke",
  "ヷ": "va", "ヸ": "vʲi", "ヹ": "ve", "ヺ": "vo", "いぇ": "je", "うぃ": "βi",
  "うぇ": "βe", "うぉ": "βo", "きぇ": "kʲe", "きゃ": "kʲa", "きゅ": "kʲɨ", "きょ": "kʲo",
  "ぎゃ": "ɡʲa", "ぎゅ": "ɡʲɨ", "ぎょ": "ɡʲo", "くぁ": "kᵝa", "くぃ": "kᵝi", "くぇ": "kᵝe",
  "くぉ": "kᵝo", "ぐぁ": "ɡᵝa", "ぐぃ": "ɡᵝi", "ぐぇ": "ɡᵝe", "ぐぉ": "ɡᵝo", "しぇ": "ɕe",
  "しゃ": "ɕa", "しゅ": "ɕɨ", "しょ": "ɕo", "じぇ": "ʥe", "じゃ": "ʥa", "じゅ": "ʥɨ",
  "じょ": "ʥo", "ちぇ": "ʨe", "ちゃ": "ʨa", "ちゅ": "ʨɨ", "ちょ": "ʨo", "ぢゃ": "ʥa",
  "ぢゅ": "ʥɨ", "ぢょ": "ʥo", "つぁ": "ʦa", "つぃ": "ʦʲi", "つぇ": "ʦe", "つぉ": "ʦo",
  "てぃ": "tʲi", "てゅ": "tʲɨ", "でぃ": "dʲi", "でゅ": "dʲɨ", "とぅ": "tɯ", "どぅ": "dɯ",
  "にぇ": "ɲe", "にゃ": "ɲa", "にゅ": "ɲɨ", "にょ": "ɲo", "ひぇ": "çe", "ひゃ": "ça",
  "ひゅ": "çɨ", "ひょ": "ço", "びゃ": "bʲa", "びゅ": "bʲɨ", "びょ": "bʲo", "ぴゃ": "pʲa",
  "ぴゅ": "pʲɨ", "ぴょ": "pʲo", "ふぁ": "ɸa", "ふぃ": "ɸʲi", "ふぇ": "ɸe", "ふぉ": "ɸo",
  "ふゅ": "ɸʲɨ", "ふょ": "ɸʲo", "みゃ": "mʲa", "みゅ": "mʲɨ", "みょ": "mʲo", "りゃ": "ɾʲa",
  "りゅ": "ɾʲɨ", "りょ": "ɾʲo", "ゔぁ": "va", "ゔぃ": "vʲi", "ゔぇ": "ve", "ゔぉ": "vo",
  "ゔゅ": "bʲɨ", "ゔょ": "bʲo", "。": ".", "、": ",", "？": "?", "！": "!",
  "「": "“", "」": "”", "『": "“", "』": "”", "：": ":", "；": ";",
  "（": "(", "）": ")", "《": "(", "》": ")", "【": "[", "】": "]",
  "・": " ", "，": ",", "～": "—", "〜": "—", "—": "—", "«": "“",
  "»": "”", "゚": "", "゙": "",
};

const SUTEGANA: ReadonlySet<string> = new Set("ゃゅょぁぃぅぇぉ");
const ODORI: ReadonlySet<string> = new Set("〃々ゝゞヽ");

/** Katakana → hiragana as jaconv.kata2hira (ァ–ヶ; ヷ–ヺ, ー and everything else unchanged). */
export function toHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

function addDakuten(kk: string): string | null {
  const i = "かきくけこさしすせそたちつてとはひふへほ".indexOf(kk);
  return i < 0 ? null : "がぎぐげござじずぜぞだぢづでどばびぶべぼ"[i]!;
}

/** cutlet `_get_single_mapping`: one kana with its neighbours → its phonemes. */
function singleMapping(pk: string | undefined, kk: string, nk: string | undefined): string {
  if (ODORI.has(kk)) {
    if (kk === "ゝ" || kk === "ヽ") return pk ?? "";
    if (kk === "ゞ" || kk === "ヾ") {
      const vv = pk ? addDakuten(pk) : null;
      return vv ? TABLE[vv]! : "";
    }
    return "";
  }
  if (pk !== undefined && TABLE[pk + kk] !== undefined) return TABLE[pk + kk]!;
  if (nk !== undefined && TABLE[kk + nk] !== undefined) return "";
  if (nk !== undefined && SUTEGANA.has(nk)) {
    if (kk === "っ") return "";
    const base = TABLE[kk];
    return base === undefined ? "" : base.slice(0, -1) + TABLE[nk]!;
  }
  if (SUTEGANA.has(kk)) return "";
  if (kk === "ー") return "ː";
  if (kk === "っ") return "ʔ";
  if (kk === "ん") {
    // m before m/p/b, ŋ before k/ɡ, ɲ before ɲ/ʨ/ʥ, n before n/t/d/ɾ/z, ɴ otherwise (cutlet; Wikipedia "N (kana)").
    const tnk = nk === undefined ? undefined : TABLE[nk];
    if (tnk) {
      if ("mpb".includes(tnk[0]!)) return "m";
      if ("kɡ".includes(tnk[0]!)) return "ŋ";
      if (["ɲ", "ʨ", "ʥ"].some((p) => tnk.startsWith(p))) return "ɲ";
      if ("ntdɾz".includes(tnk[0]!)) return "n";
    }
    return "ɴ";
  }
  return TABLE[kk] ?? "";
}

const KANA_ONLY = /^[ぁ-ゖァ-ヺーゝゞヽヾ]+$/u;

/** Whether a string is kana only (hiragana, katakana, ー, iteration marks) — what `kanaToPhonemes` accepts. */
export function isKana(text: string): boolean {
  return KANA_ONLY.test(text);
}

/** One word's kana (after `pronunciationKana`) in the Kokoro alphabet (cutlet `_romaji_word` for a kana word). */
export function kanaToPhonemes(kana: string): string {
  if (!isKana(kana)) throw new Error(`ja phonemes: not kana: "${kana}"`);
  const hira = [...toHiragana(kana)];
  let out = "";
  for (let i = 0; i < hira.length; i++) out += singleMapping(hira[i - 1], hira[i]!, hira[i + 1]);
  return out;
}

/** The vowel a hiragana mora ends in (a/i/u/e/o), or null (ん, っ, ー, small kana handled with their mora). */
function moraVowel(hira: string): string | null {
  const p = TABLE[hira];
  if (p === undefined) return null;
  const last = p.slice(-1);
  if (last === "ɯ" || last === "ɨ") return "u";
  return "aeio".includes(last) ? last : null;
}

const BARE_VOWEL: Readonly<Record<string, string>> = { あ: "a", い: "i", う: "u", え: "e", お: "o" };

/**
 * The pronunciation spelling UniDic's `pron` field gives and Kokoro was trained on: inside one hiragana word a
 * vowel kana that repeats the vowel before it, い after an e-row mora and う after an o-row mora are written ー
 * (せんせい → せんせー, とうきょう → とーきょー, おかあさん → おかーさん, おおきい → おーきー). Katakana is
 * left as written (loanwords already spell their long vowels with ー). `keepFinalU`: a verb's dictionary form,
 * whose final う is the verb ending (思う omou, not omō).
 */
export function pronunciationKana(kana: string, opts: { keepFinalU?: boolean } = {}): string {
  const cps = [...kana];
  const out: string[] = [];
  let prevVowel: string | null = null;
  for (let i = 0; i < cps.length; i++) {
    const ch = cps[i]!;
    const next = cps[i + 1];
    const bare = BARE_VOWEL[ch];
    // A vowel kana followed by a small kana is a digraph head (うぃ, いぇ), never a lengthening.
    const digraphHead = next !== undefined && SUTEGANA.has(next);
    const finalU = opts.keepFinalU === true && ch === "う" && i === cps.length - 1;
    if (bare !== undefined && prevVowel !== null && !digraphHead && !finalU && (bare === prevVowel || (bare === "i" && prevVowel === "e") || (bare === "u" && prevVowel === "o"))) {
      out.push("ー");
      continue;
    }
    out.push(ch);
    if (/[ぁ-ゖ]/u.test(ch)) {
      if (SUTEGANA.has(ch)) prevVowel = moraVowel(ch) ?? prevVowel;
      else prevVowel = digraphHead ? null : moraVowel(ch);
      if (ch === "ん" || ch === "っ") prevVowel = null;
    } else if (ch !== "ー") prevVowel = null;
  }
  return out.join("");
}

/** One spoken token: a word's kana (pronunciation spelling), a punctuation mark, or text passed through (Latin, digits). */
export type SpokenToken = { kind: "kana"; kana: string } | { kind: "punct"; text: string } | { kind: "other"; text: string };

type Tok = { surface: string; roma: string; space: boolean };

/**
 * The phoneme string of a sentence's tokens, spaced as cutlet `_romaji_tokens` + `Cutlet.__call__` space them:
 * a space after every word, none before closing punctuation, ( ) as « », and no space next to ʔ.
 */
export function tokensToPhonemes(tokens: readonly SpokenToken[]): string {
  const out: Tok[] = [];
  for (const t of tokens) {
    const surface = t.kind === "kana" ? t.kana : t.text;
    let roma: string;
    if (t.kind === "kana") roma = kanaToPhonemes(t.kana);
    else if (t.kind === "punct") roma = [...t.text].map((c) => TABLE[c] ?? c).join("");
    else roma = /^[\x00-\x7f]*$/.test(t.text) ? t.text : "";
    const tok: Tok = { surface, roma, space: false };
    const po = out[out.length - 1];
    // Python's `x in '(['` is a substring test (true for ''); String.includes is the same test.
    if ("「『«".includes(surface) || "([".includes(roma)) {
      if (po) po.space = true;
    } else if ("」』»".includes(surface) || "]).,?!:".includes(roma)) {
      if (po) po.space = false;
      tok.space = true;
    } else if (roma === " ") {
      tok.space = false;
    } else {
      tok.space = true;
    }
    out.push(tok);
  }
  const joined = out.map((t) => `${t.roma.replace(/っ/g, "")}${t.space ? " " : ""}`).join("");
  return joined
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\(/g, "«")
    .replace(/\)/g, "»")
    .replace(/(?<![!",.:;?»—…”]) (?=ʔ)|(?<=ʔ) (?!["«“])/g, "");
}

/** Kokoro's context limit (kokoro 0.9.4 pipeline.py: a phoneme string longer than 510 is refused or truncated). */
export const KOKORO_MAX_PHONEMES = 510;
