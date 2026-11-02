/**
 * Hán-Việt (Sino-Vietnamese) readings — P4b stage 2, QC 2026-11-03 §2:
 * "show the reading only where it helps (Sino-Vietnamese compounds); never
 * for native Japanese kun words or Korean native words".
 *
 * The readings are an AUTHORED word table per language
 * (content/hanviet/{ja,zh,ko}.json), never picked from a character's first
 * Unihan reading: kVietnamese lists several readings per character and mixes
 * in Nôm readings. Unihan (content/hanviet/unihan-readings.json, derived by
 * scripts/hanviet-unihan.ts) is the CHECK:
 *
 *   - every syllable of a reading must be one of its character's kVietnamese
 *     readings, or of a one-hop variant's (traditional/simplified/semantic/Z
 *     variant, kJinmeiyoKanji kyūjitai ↔ shinjitai: 学 → 學, 気 → 氣 — see
 *     scripts/lib/hanviet-unihan.ts), compared after folding tone-mark placement
 *     (hoá = hóa) and the i/y spelling of an onset + i syllable (lí = lý);
 *   - ja: pure kanji words whose kana is a chain of the characters' on'yomi
 *     (kJapanese katakana), allowing rendaku and sokuon — a kun word (手紙
 *     てがみ) cannot pass;
 *   - ko: Sino-Korean words with hanja; every hangul syllable must be its
 *     hanja's kHangul reading (word-initial 두음법칙 allowed) — a native word
 *     has no hanja and cannot be entered;
 *   - zh: words in hanzi.
 *
 * A character a check cannot confirm is an error unless the entry's `note`
 * names that character and says why (Unihan 17.0.0 lacks kVietnamese for
 * basic characters such as 電, 問, 題, 食). Tables are canonical JSON, sorted
 * by word, one entry per word.
 */
import { existsSync, readFileSync } from "fs";

import { z } from "zod";

import { codePointCompare, hanChars, UNIHAN_MANIFEST_REL, UNIHAN_READINGS_REL, UnihanManifestSchema, UnihanReadingsSchema, type UnihanReadings } from "./hanviet-unihan";
import { canonicalJson, readJson, safeResolve, type CompiledFile } from "./pipeline";

export const HANVIET_DIR = "content/hanviet";
export const HANVIET_LANGS = ["ja", "ko", "zh"] as const;
export type HanVietLang = (typeof HANVIET_LANGS)[number];
export const HANVIET_REVIEW_REL = `${HANVIET_DIR}/REVIEW.md`;
export const HANVIET_ARTIFACT_ROOT = "src/content/hanviet";

export function hanVietTableRel(lang: HanVietLang): string {
  return `${HANVIET_DIR}/${lang}.json`;
}

const VI_LETTERS = "a-zàáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ";
const SYLLABLE = new RegExp(`^[${VI_LETTERS}]+$`, "u");

const base = {
  word: z.string().min(1),
  reading: z.string().regex(/^\S+( \S+)*$/, "syllables separated by single spaces"),
  kind: z.literal("sino"),
  note: z.string().min(10).optional(),
};
const JaEntrySchema = z.strictObject({ ...base, kana: z.string().regex(/^[ぁ-ゖー]+$/u, "hiragana only") });
const ZhEntrySchema = z.strictObject(base);
const KoEntrySchema = z.strictObject({ ...base, hanja: z.string().min(1) });
export type HanVietEntry = { word: string; reading: string; kind: "sino"; note?: string; kana?: string; hanja?: string };

const ENTRY_SCHEMAS = { ja: JaEntrySchema, zh: ZhEntrySchema, ko: KoEntrySchema } as const;

export function tableSchema(lang: HanVietLang) {
  return z.strictObject({ language: z.literal(lang), entries: z.array(ENTRY_SCHEMAS[lang]).min(1) });
}
export type HanVietTable = { language: HanVietLang; entries: HanVietEntry[] };

/** Canonical bytes of a table (fixed key order, the order the entries have). */
export function renderHanVietTable(table: HanVietTable): string {
  const entries = table.entries.map((e) => ({
    word: e.word,
    ...(e.hanja !== undefined ? { hanja: e.hanja } : {}),
    ...(e.kana !== undefined ? { kana: e.kana } : {}),
    reading: e.reading,
    kind: e.kind,
    ...(e.note !== undefined ? { note: e.note } : {}),
  }));
  return `${canonicalJson({ language: table.language, entries })}\n`;
}

// ---------------------------------------------------------------------------
// Vietnamese syllable folding
// ---------------------------------------------------------------------------

const TONE_MARKS: Readonly<Record<string, string>> = { "̀": "2", "́": "3", "̉": "4", "̃": "5", "̣": "6" };

/**
 * Comparison key of one syllable: lower case, tone separated from the
 * letters (so hoá and hóa, the old and new tone placement, are one key),
 * and onset + y folded to onset + i (lý/lí, kỹ/kĩ, quý/quí).
 */
export function foldViSyllable(syllable: string): string {
  let tone = "1";
  let letters = "";
  for (const ch of syllable.normalize("NFD").toLowerCase()) {
    const t = TONE_MARKS[ch];
    if (t !== undefined) tone = t;
    else letters += ch;
  }
  const folded = letters.normalize("NFC").replace(/^(b|c|ch|d|đ|g|gh|h|k|kh|l|m|n|nh|p|ph|qu|r|s|t|th|tr|v|x)y$/u, "$1i");
  return `${folded}${tone}`;
}

// ---------------------------------------------------------------------------
// Unihan lookups
// ---------------------------------------------------------------------------

function tokens(value: string | undefined): string[] {
  return value === undefined ? [] : value.split(" ").filter((t) => t.length > 0);
}

/** The character and its one-hop variants (all present in the derived file by construction). */
function withVariants(ch: string, unihan: UnihanReadings): string[] {
  return [ch, ...[...(unihan.chars[ch]?.variants ?? "")]];
}

/** Folded kVietnamese readings of a character and its variants; null = not in the derived file. */
export function viReadingKeys(ch: string, unihan: UnihanReadings): Set<string> | null {
  if (unihan.chars[ch] === undefined) return null;
  const out = new Set<string>();
  for (const c of withVariants(ch, unihan)) for (const r of tokens(unihan.chars[c]?.kVietnamese)) out.add(foldViSyllable(r));
  return out;
}

function kataToHira(s: string): string {
  return [...s].map((ch) => {
    const cp = ch.codePointAt(0)!;
    return cp >= 0x30a1 && cp <= 0x30f6 ? String.fromCodePoint(cp - 0x60) : ch;
  }).join("");
}

/** On'yomi of a character in hiragana: the katakana readings of kJapanese (the character's own, else its variants'). */
export function onReadings(ch: string, unihan: UnihanReadings): string[] {
  for (const c of withVariants(ch, unihan)) {
    const on = tokens(unihan.chars[c]?.kJapanese).filter((t) => /^[ァ-ヶー]+$/u.test(t));
    if (on.length > 0) return on.map(kataToHira);
  }
  return [];
}

const VOICED: Readonly<Record<string, readonly string[]>> = {
  か: ["が"], き: ["ぎ"], く: ["ぐ"], け: ["げ"], こ: ["ご"],
  さ: ["ざ"], し: ["じ"], す: ["ず"], せ: ["ぜ"], そ: ["ぞ"],
  た: ["だ"], ち: ["ぢ", "じ"], つ: ["づ", "ず"], て: ["で"], と: ["ど"],
  は: ["ば", "ぱ"], ひ: ["び", "ぴ"], ふ: ["ぶ", "ぷ"], へ: ["べ", "ぺ"], ほ: ["ぼ", "ぽ"],
};

/** Surface forms an on'yomi may take at position i of n: rendaku (not first), sokuon (not last). */
function onForms(reading: string, i: number, n: number): string[] {
  const out = new Set([reading]);
  if (i > 0) for (const v of VOICED[reading[0] ?? ""] ?? []) out.add(v + reading.slice(1));
  if (i < n - 1) for (const f of [...out]) if (/[くきちつ]$/u.test(f)) out.add(`${f.slice(0, -1)}っ`);
  return [...out];
}

/** The first character whose on'yomi cannot continue the kana chain, or null when the kana is a chain of on'yomi. */
export function firstNonOnChar(word: string, kana: string, unihan: UnihanReadings): string | null {
  const chars = [...word];
  let offsets = new Set([0]);
  for (let i = 0; i < chars.length; i++) {
    const next = new Set<number>();
    const forms = onReadings(chars[i]!, unihan).flatMap((r) => onForms(r, i, chars.length));
    for (const at of offsets) for (const f of forms) if (kana.startsWith(f, at)) next.add(at + f.length);
    if (i === chars.length - 1) for (const at of [...next]) if (at !== kana.length) next.delete(at);
    if (next.size === 0) return chars[i]!;
    offsets = next;
  }
  return null;
}

const L_N = 2;
const L_R = 5;
const L_NULL = 11;
/** ㅑ ㅒ ㅕ ㅖ ㅛ ㅠ ㅣ (the vowels before which word-initial ㄴ/ㄹ become ㅇ). */
const IY_VOWELS = new Set([2, 3, 6, 7, 12, 17, 20]);

/** Word-initial form of a Sino-Korean syllable under 두음법칙 (려 → 여, 로 → 노, 녀 → 여). */
export function initialSoundLaw(syllable: string): string {
  const cp = syllable.codePointAt(0)!;
  if (syllable.length !== 1 || cp < 0xac00 || cp > 0xd7a3) return syllable;
  const code = cp - 0xac00;
  let l = Math.floor(code / 588);
  const v = Math.floor((code % 588) / 28);
  const t = code % 28;
  if (l === L_R) l = IY_VOWELS.has(v) ? L_NULL : L_N;
  else if (l === L_N && IY_VOWELS.has(v)) l = L_NULL;
  return String.fromCodePoint(0xac00 + l * 588 + v * 28 + t);
}

function hangulReadings(ch: string, unihan: UnihanReadings): string[] {
  for (const c of withVariants(ch, unihan)) {
    const h = tokens(unihan.chars[c]?.kHangul);
    if (h.length > 0) return h;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type EntryCheck = {
  /** Characters no kVietnamese reading (own or variant) confirms for their syllable. */
  unconfirmed: string[];
  errors: string[];
};

/** The script-side source of the reading: the word itself (ja, zh) or its hanja (ko). */
export function hanSourceOf(lang: HanVietLang, e: HanVietEntry): string {
  return lang === "ko" ? (e.hanja ?? "") : e.word;
}

/** Every rule of one entry (pure; the table-level rules live in validateHanVietTable). */
export function checkEntry(lang: HanVietLang, e: HanVietEntry, unihan: UnihanReadings): EntryCheck {
  const errors: string[] = [];
  const unconfirmed: string[] = [];
  const source = hanSourceOf(lang, e);
  const chars = [...source];
  const syllables = e.reading.split(" ");
  if (e.reading !== e.reading.normalize("NFC")) errors.push("reading is not NFC");
  for (const s of syllables) {
    if (!SYLLABLE.test(s.toLowerCase())) errors.push(`"${s}" is not a Vietnamese syllable`);
    else if (s !== s.toLowerCase() && s !== s[0]!.toUpperCase() + s.slice(1).toLowerCase()) errors.push(`"${s}": lower case, or capitalised for a proper noun`);
  }
  if (hanChars(source).length !== chars.length || chars.length === 0) {
    errors.push(lang === "ko" ? `hanja ${source} must be Han characters only` : `${e.word} must be Han characters only (no kana, no okurigana)`);
    return { errors, unconfirmed };
  }
  if (syllables.length !== chars.length) {
    errors.push(`${syllables.length} syllable(s) for ${chars.length} character(s)`);
    return { errors, unconfirmed };
  }
  chars.forEach((c, i) => {
    const keys = viReadingKeys(c, unihan);
    if (keys === null) errors.push(`${c} is not in ${UNIHAN_READINGS_REL} — re-derive it (bun scripts/hanviet-unihan.ts derive --zip <Unihan.zip>)`);
    else if (!keys.has(foldViSyllable(syllables[i]!))) unconfirmed.push(c);
  });
  if (lang === "ja" && e.kana !== undefined && errors.length === 0) {
    const off = firstNonOnChar(e.word, e.kana, unihan);
    if (off !== null && !unconfirmed.includes(off)) unconfirmed.push(off);
  }
  if (lang === "ko") {
    const hangul = [...e.word];
    if (!/^[가-힣]+$/u.test(e.word)) errors.push(`${e.word} must be hangul syllables only`);
    else if (hangul.length !== chars.length) errors.push(`${e.word} has ${hangul.length} syllable(s), hanja ${source} has ${chars.length}`);
    else {
      chars.forEach((c, i) => {
        const readings = hangulReadings(c, unihan);
        const ok = readings.includes(hangul[i]!) || (i === 0 && readings.some((r) => initialSoundLaw(r) === hangul[i]));
        if (!ok && !unconfirmed.includes(c)) unconfirmed.push(c);
      });
    }
  }
  if (unconfirmed.length > 0) {
    const named = unconfirmed.filter((c) => e.note?.includes(c));
    const missing = unconfirmed.filter((c) => !named.includes(c));
    if (missing.length > 0) {
      const why = lang === "ja" ? "kVietnamese / on'yomi" : lang === "ko" ? "kVietnamese / kHangul" : "kVietnamese";
      errors.push(`Unihan (${why}) does not confirm ${missing.join(", ")} — fix the reading, or name ${missing.join(", ")} in a note saying why`);
    }
  }
  return { errors, unconfirmed };
}

/** Table-level rules + every entry (pure). `raw` is the file's text. */
export function validateHanVietTable(lang: HanVietLang, raw: string, unihan: UnihanReadings): { errors: string[]; table: HanVietTable | null } {
  const where = `hanviet (${lang})`;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return { errors: [`${where}: ${hanVietTableRel(lang)} is not JSON — ${(e as Error).message}`], table: null };
  }
  const parsed = tableSchema(lang).safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { errors: [`${where}: ${issue?.path.join(".")} — ${issue?.message}`], table: null };
  }
  const table = parsed.data as HanVietTable;
  const errors: string[] = [];
  if (renderHanVietTable(table) !== raw.replace(/\r\n/g, "\n")) errors.push(`${where}: ${hanVietTableRel(lang)} is not canonical JSON (2-space, key order word, hanja, kana, reading, kind, note; trailing newline)`);
  const words = table.entries.map((e) => e.word);
  const sorted = [...words].sort(codePointCompare);
  if (words.some((w, i) => w !== sorted[i])) errors.push(`${where}: entries must be sorted by word (code-point order)`);
  const seen = new Set<string>();
  for (const w of words) {
    if (seen.has(w)) errors.push(`${where}: duplicate word ${w}`);
    seen.add(w);
  }
  for (const e of table.entries) for (const m of checkEntry(lang, e, unihan).errors) errors.push(`${where}: ${e.word}: ${m}`);
  return { errors, table };
}

export function loadUnihanReadings(): UnihanReadings {
  return UnihanReadingsSchema.parse(readJson(UNIHAN_READINGS_REL));
}

export function hasHanVietTables(): boolean {
  return existsSync(safeResolve(HANVIET_DIR));
}

/** Every Hán-Việt rule over the committed files (schema failures reported, never thrown). */
export function validateHanViet(): string[] {
  if (!hasHanVietTables()) return [];
  const errors: string[] = [];
  let unihan: UnihanReadings;
  try {
    const manifest = UnihanManifestSchema.parse(readJson(UNIHAN_MANIFEST_REL));
    unihan = loadUnihanReadings();
    if (unihan.source.sha256 !== manifest.source.sha256 || unihan.source.url !== manifest.source.url) {
      errors.push(`hanviet: ${UNIHAN_READINGS_REL} was derived from ${unihan.source.url} (${unihan.source.sha256}), the manifest pins ${manifest.source.url} (${manifest.source.sha256})`);
    }
  } catch (e) {
    return [`hanviet: Unihan data — ${(e as Error).message.split("\n")[0]}`];
  }
  for (const lang of HANVIET_LANGS) {
    const rel = hanVietTableRel(lang);
    if (!existsSync(safeResolve(rel))) {
      errors.push(`hanviet (${lang}): ${rel} is missing`);
      continue;
    }
    errors.push(...validateHanVietTable(lang, readFileSync(safeResolve(rel), "utf8"), unihan).errors);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Compilation: runtime tables + the D-10 review sheet
// ---------------------------------------------------------------------------

function loadTables(): HanVietTable[] {
  return HANVIET_LANGS.map((lang) => tableSchema(lang).parse(readJson(hanVietTableRel(lang))) as HanVietTable);
}

/** Runtime artifact of one table: word → reading (+ kana / hanja); notes stay build-side. */
export function compileHanVietArtifact(table: HanVietTable): string {
  const readings: Record<string, { reading: string; kana?: string; hanja?: string }> = {};
  for (const e of table.entries) {
    readings[e.word] = { reading: e.reading, ...(e.kana !== undefined ? { kana: e.kana } : {}), ...(e.hanja !== undefined ? { hanja: e.hanja } : {}) };
  }
  return `${canonicalJson({ generator: "scripts/compile-content.ts", language: table.language, readings })}\n`;
}

const LANG_NAMES: Readonly<Record<HanVietLang, string>> = { ja: "Tiếng Nhật / Japanese", ko: "Tiếng Hàn / Korean", zh: "Tiếng Trung / Chinese" };

/** content/hanviet/REVIEW.md — every pair, for the D-10 review pass. */
export function renderHanVietReview(tables: HanVietTable[], unihan: UnihanReadings): string {
  const lines = [
    "<!-- Generated by scripts/compile-content.ts from content/hanviet/{ja,ko,zh}.json — do not edit by hand. -->",
    "",
    "# Hán-Việt readings — D-10 review sheet",
    "",
    "Duyệt từng dòng: âm Hán-Việt có đúng và có giúp người học không (QC 2026-11-03 §2). Chỉ từ Hán-Việt —",
    "không có từ kun thuần Nhật, không có từ thuần Hàn, không có từ mượn katakana. Sửa trong `content/hanviet/<lang>.json`, rồi `bun run content:compile`.",
    "",
    "Review every line: is the Sino-Vietnamese reading right, and does it help? `Unihan` = every syllable is one of the",
    "character's kVietnamese readings (own or variant) and the kana/hangul is its on'yomi/kHangul; `note` = the validator",
    "could not confirm the characters the note names — those lines need the reviewer's eye most.",
    "",
  ];
  for (const table of tables) {
    lines.push(`## ${table.language} — ${LANG_NAMES[table.language]} (${table.entries.length})`, "");
    const extra = table.language === "ja" ? " kana |" : table.language === "ko" ? " hanja |" : "";
    lines.push(`| word |${extra} Hán-Việt | check | note |`, `|---|${extra ? "---|" : ""}---|---|---|`);
    for (const e of table.entries) {
      const check = checkEntry(table.language, e, unihan);
      const cell = table.language === "ja" ? ` ${e.kana} |` : table.language === "ko" ? ` ${e.hanja} |` : "";
      const status = check.unconfirmed.length === 0 ? "Unihan" : `note (${check.unconfirmed.join(" ")})`;
      lines.push(`| ${e.word} |${cell} ${e.reading} | ${status} | ${(e.note ?? "").replace(/\|/g, "\\|")} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

/** Generated files of the Hán-Việt layer (none when content/hanviet/ does not exist). */
export function compileHanVietFiles(): CompiledFile[] {
  if (!hasHanVietTables()) return [];
  const tables = loadTables();
  const unihan = loadUnihanReadings();
  return [
    ...tables.map((t) => ({ relPath: `${HANVIET_ARTIFACT_ROOT}/${t.language}.json`, contents: compileHanVietArtifact(t) })),
    { relPath: HANVIET_REVIEW_REL, contents: renderHanVietReview(tables, unihan) },
  ];
}
