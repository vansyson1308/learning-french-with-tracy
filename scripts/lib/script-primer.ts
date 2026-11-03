/**
 * Script primers (P4b stage 5, task 5): content/<lang>/primer/script-primer.json
 * for ja / zh / ko — kana tables, the four tones with minimal pairs and the
 * basic strokes, Hangul jamo and blocks — explained in Vietnamese (and
 * English) for the learner's first steps in Section 1.
 *
 * The schema (content/schema.ts ScriptPrimerSchema) fixes the shape; the
 * rules here check the CONTENT against the same machinery the app grades
 * with, so a primer can never teach a reading the engine would reject:
 *  - kana: every cell is the table's script, its rōmaji is the Hepburn
 *    reading of the kana, its audio voices exactly that kana;
 *  - tones: tones 1–4 each once (neutral optional), each example's single
 *    syllable carries its tone (parsed by the zh plugin); a minimal pair
 *    spells the same syllables with different tones;
 *  - hangul: basic jamo only, each consonant's initial / final and each
 *    vowel's RR is what the RR rules (cjk-readings/korean-rr.ts) give, and
 *    a block is exactly the keyboard composition of its parts (ko plugin);
 *  - every text has non-empty vi and en.
 *
 * Compiled to src/content/primer/<lang>.json (loaded by src/lib/script-primer.ts)
 * with a generated D-10 review sheet content/<lang>/primer/REVIEW.md, the
 * same review pattern as content/hanviet/REVIEW.md.
 */
import { existsSync, readFileSync } from "fs";

import { ScriptPrimerSchema, type ScriptPrimer } from "../../content/schema";
import { composeJamo } from "../../src/lib/languages/ko";
import { parsePinyinReading } from "../../src/lib/languages/zh";
import { romanizeKorean } from "./cjk-readings/korean-rr";
import { canonicalJson, safeResolve, type CompiledFile } from "./pipeline";

export const PRIMER_LANGS = ["ja", "zh", "ko"] as const;
export type PrimerLang = (typeof PRIMER_LANGS)[number];
export const PRIMER_ARTIFACT_ROOT = "src/content/primer";

export function primerSourceRel(lang: PrimerLang): string {
  return `content/${lang}/primer/script-primer.json`;
}

export function primerReviewRel(lang: PrimerLang): string {
  return `content/${lang}/primer/REVIEW.md`;
}

// --- kana -------------------------------------------------------------------

/** Hepburn readings of the basic hiragana (gojūon + ん). */
const HIRAGANA_ROMAJI: Readonly<Record<string, string>> = {
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
};

const isHiragana = (ch: string) => /^[ぁ-ゖ]$/.test(ch);
const isKatakana = (ch: string) => /^[ァ-ヺ]$/.test(ch);
const toHiragana = (ch: string) => String.fromCharCode(ch.charCodeAt(0) - 0x60);

/** The Hepburn reading of one basic kana (hiragana or katakana), or undefined. */
export function kanaRomaji(kana: string): string | undefined {
  if (isHiragana(kana)) return HIRAGANA_ROMAJI[kana];
  if (isKatakana(kana)) return HIRAGANA_ROMAJI[toHiragana(kana)];
  return undefined;
}

// --- hangul -----------------------------------------------------------------

export const BASIC_CONSONANTS = [..."ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ"];
export const BASIC_VOWELS = [..."ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ"];

/** RR of a consonant before a vowel (ㄱ → g; ㅇ → ""), from the RR rules on ㄱ+ㅏ. */
function initialRr(jamo: string): string {
  return romanizeKorean(composeJamo(`${jamo}ㅏ`)).replace(/a$/, "");
}

/** RR of a consonant closing a word (ㄱ → k, ㄷ ㅅ ㅈ ㅊ ㅌ → t), from the RR rules on 아+final. */
function finalRr(jamo: string): string {
  return romanizeKorean(composeJamo(`ㅇㅏ${jamo}`)).replace(/^a/, "");
}

function vowelRr(jamo: string): string {
  return romanizeKorean(composeJamo(`ㅇ${jamo}`));
}

// --- rules ------------------------------------------------------------------

type Text = { vi: string; en: string };

function texts(primer: ScriptPrimer): { where: string; text: Text }[] {
  const out: { where: string; text: Text }[] = [
    { where: "title", text: primer.title },
    { where: "intro", text: primer.intro },
  ];
  for (const s of primer.sections) {
    out.push({ where: `${s.id}.title`, text: s.title }, { where: `${s.id}.explanation`, text: s.explanation });
    if (s.kind === "tones") {
      for (const t of s.tones) out.push({ where: `${s.id}.tone${t.tone}`, text: t.description }, { where: `${s.id}.tone${t.tone}.gloss`, text: t.example.gloss });
      s.minimalPairs.forEach((p, i) => {
        out.push({ where: `${s.id}.pair${i + 1}.a`, text: p.a.gloss }, { where: `${s.id}.pair${i + 1}.b`, text: p.b.gloss });
        if (p.note) out.push({ where: `${s.id}.pair${i + 1}.note`, text: p.note });
      });
    }
    if (s.kind === "strokes") {
      for (const st of s.strokes) out.push({ where: `${s.id}.${st.name}`, text: st.description });
      s.rules.forEach((r, i) => out.push({ where: `${s.id}.rule${i + 1}`, text: r.rule }));
    }
    if (s.kind === "hangulBlocks") for (const b of s.blocks) out.push({ where: `${s.id}.${b.block}`, text: b.layout });
    if ("notes" in s) (s.notes ?? []).forEach((n, i) => out.push({ where: `${s.id}.note${i + 1}`, text: n }));
  }
  return out;
}

function checkKana(s: Extract<ScriptPrimer["sections"][number], { kind: "kanaTable" }>, err: (m: string) => void): void {
  const inScript = s.script === "hiragana" ? isHiragana : isKatakana;
  for (const row of s.rows) {
    if (row.cells.length !== s.columns.length) err(`${s.id}: row "${row.consonant}" has ${row.cells.length} cells for ${s.columns.length} columns`);
    for (const cell of row.cells) {
      if (cell === null) continue;
      if (![...cell.kana].every(inScript)) err(`${s.id}: ${cell.kana} is not ${s.script}`);
      const expected = kanaRomaji(cell.kana);
      if (expected === undefined) err(`${s.id}: ${cell.kana} is not a basic kana`);
      else if (expected !== cell.romaji) err(`${s.id}: ${cell.kana} reads "${expected}", not "${cell.romaji}"`);
      if (cell.audio.say !== cell.kana) err(`${s.id}: audio of ${cell.kana} says "${cell.audio.say}"`);
    }
  }
}

function syllablesOf(hanzi: string, pinyin: string, where: string, err: (m: string) => void) {
  const syllables = parsePinyinReading(pinyin);
  if (syllables === null) {
    err(`${where}: "${pinyin}" is not pinyin`);
    return null;
  }
  if (syllables.length !== [...hanzi].length) err(`${where}: ${hanzi} has ${[...hanzi].length} hanzi for ${syllables.length} syllables (${pinyin})`);
  return syllables;
}

function checkTones(s: Extract<ScriptPrimer["sections"][number], { kind: "tones" }>, err: (m: string) => void): void {
  const seen = s.tones.map((t) => t.tone);
  for (const tone of [1, 2, 3, 4]) if (!seen.includes(tone)) err(`${s.id}: tone ${tone} is missing`);
  if (new Set(seen).size !== seen.length) err(`${s.id}: a tone is listed twice`);
  for (const t of s.tones) {
    const where = `${s.id} tone ${t.tone}`;
    const mark = parsePinyinReading(t.mark);
    if (mark?.length !== 1 || mark[0]!.tone !== t.tone % 5) err(`${where}: mark "${t.mark}" is not tone ${t.tone}`);
    const syllables = syllablesOf(t.example.hanzi, t.example.pinyin, where, err);
    if (syllables && syllables.some((x) => x.tone !== t.tone % 5)) err(`${where}: example ${t.example.pinyin} is not tone ${t.tone}`);
    if (t.audio.say !== t.example.hanzi) err(`${where}: audio says "${t.audio.say}", not ${t.example.hanzi}`);
  }
  s.minimalPairs.forEach((p, i) => {
    const where = `${s.id} pair ${i + 1}`;
    const a = syllablesOf(p.a.hanzi, p.a.pinyin, where, err);
    const b = syllablesOf(p.b.hanzi, p.b.pinyin, where, err);
    if (!a || !b) return;
    if (a.map((x) => x.base).join(" ") !== b.map((x) => x.base).join(" ")) err(`${where}: ${p.a.pinyin} / ${p.b.pinyin} are not the same syllables`);
    if (a.map((x) => x.tone).join() === b.map((x) => x.tone).join()) err(`${where}: ${p.a.pinyin} / ${p.b.pinyin} have the same tones`);
    if (p.a.hanzi === p.b.hanzi) err(`${where}: the same hanzi twice`);
  });
}

function checkHangul(s: Extract<ScriptPrimer["sections"][number], { kind: "hangulBlocks" }>, err: (m: string) => void): void {
  const consonants = s.consonants.map((c) => c.jamo);
  if (new Set(consonants).size !== consonants.length) err(`${s.id}: a consonant is listed twice`);
  for (const c of s.consonants) {
    if (!BASIC_CONSONANTS.includes(c.jamo)) {
      err(`${s.id}: ${c.jamo} is not a basic consonant`);
      continue;
    }
    if (initialRr(c.jamo) !== c.initial) err(`${s.id}: ${c.jamo} before a vowel is "${initialRr(c.jamo)}" in RR, not "${c.initial}"`);
    if (c.final !== undefined && finalRr(c.jamo) !== c.final) err(`${s.id}: ${c.jamo} as a final is "${finalRr(c.jamo)}" in RR, not "${c.final}"`);
  }
  const vowels = s.vowels.map((v) => v.jamo);
  if (new Set(vowels).size !== vowels.length) err(`${s.id}: a vowel is listed twice`);
  for (const v of s.vowels) {
    if (!BASIC_VOWELS.includes(v.jamo)) err(`${s.id}: ${v.jamo} is not a basic vowel`);
    else if (vowelRr(v.jamo) !== v.rr) err(`${s.id}: ${v.jamo} is "${vowelRr(v.jamo)}" in RR, not "${v.rr}"`);
  }
  const known = new Set([...consonants, ...vowels]);
  for (const b of s.blocks) {
    if (composeJamo(b.parts.join("")) !== b.block) err(`${s.id}: ${b.parts.join(" + ")} does not compose ${b.block}`);
    for (const p of b.parts) if (!known.has(p)) err(`${s.id}: block ${b.block} uses ${p}, which the section does not teach`);
    if (romanizeKorean(b.block) !== b.rr) err(`${s.id}: ${b.block} is "${romanizeKorean(b.block)}" in RR, not "${b.rr}"`);
    if (b.audio.say !== b.block) err(`${s.id}: audio of ${b.block} says "${b.audio.say}"`);
  }
}

/** Every content rule of one parsed primer (pure). */
export function validateScriptPrimerData(lang: PrimerLang, primer: ScriptPrimer): string[] {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`primer (${lang}): ${m}`);
  if (primer.language !== lang) err(`language "${primer.language}" ≠ folder "${lang}"`);
  if (primer.id !== `${lang}.primer.script`) err(`id "${primer.id}" must be ${lang}.primer.script`);
  const ids = primer.sections.map((s) => s.id);
  if (new Set(ids).size !== ids.length) err("section ids repeat");
  for (const { where, text } of texts(primer)) {
    if (text.vi.trim() !== text.vi || text.en.trim() !== text.en) err(`${where}: text has leading/trailing spaces`);
  }
  for (const s of primer.sections) {
    if (s.kind === "kanaTable") checkKana(s, err);
    else if (s.kind === "tones") checkTones(s, err);
    else if (s.kind === "hangulBlocks") checkHangul(s, err);
  }
  // Each language teaches its own script.
  const kinds = new Set(primer.sections.map((s) => s.kind));
  const needs: Record<PrimerLang, string> = { ja: "kanaTable", zh: "tones", ko: "hangulBlocks" };
  if (!kinds.has(needs[lang] as never)) err(`a ${lang} primer needs a ${needs[lang]} section`);
  return errors;
}

function parsePrimer(lang: PrimerLang): { primer: ScriptPrimer | null; errors: string[] } {
  const rel = primerSourceRel(lang);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(safeResolve(rel), "utf8"));
  } catch (e) {
    return { primer: null, errors: [`primer (${lang}): ${rel} is not JSON — ${(e as Error).message}`] };
  }
  const parsed = ScriptPrimerSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { primer: null, errors: [`primer (${lang}): ${rel} — ${issue?.path.join(".")}: ${issue?.message}`] };
  }
  return { primer: parsed.data, errors: [] };
}

function presentLangs(): PrimerLang[] {
  return PRIMER_LANGS.filter((lang) => existsSync(safeResolve(primerSourceRel(lang))));
}

/** content:validate — every authored primer (none authored = nothing to check). */
export function validateScriptPrimers(): string[] {
  const errors: string[] = [];
  for (const lang of presentLangs()) {
    const { primer, errors: parseErrors } = parsePrimer(lang);
    errors.push(...parseErrors);
    if (primer) errors.push(...validateScriptPrimerData(lang, primer));
  }
  return errors;
}

/** The D-10 review sheet of one primer: every Vietnamese text beside its English. */
export function renderPrimerReview(primer: ScriptPrimer): string {
  const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const lines = [
    `<!-- Generated by scripts/compile-content.ts from ${primerSourceRel(primer.language)} — do not edit by hand. -->`,
    "",
    `# Script primer (${primer.language}) — D-10 review sheet`,
    "",
    "Duyệt từng dòng tiếng Việt: đúng, tự nhiên, dễ hiểu với người mới học không? Sửa trong",
    `\`${primerSourceRel(primer.language)}\`, rồi \`bun run content:compile\`. Âm thanh (audio) đang ở trạng thái pending: app đọc bằng giọng của máy.`,
    "",
    "Review every Vietnamese line: correct, natural, clear for a beginner? The kana / pinyin / RR facts are machine-checked",
    "(scripts/lib/script-primer.ts); the explanations are not.",
    "",
    "| where | vi | en |",
    "|---|---|---|",
    ...texts(primer).map(({ where, text }) => `| ${cell(where)} | ${cell(text.vi)} | ${cell(text.en)} |`),
    "",
  ];
  return lines.join("\n");
}

/** Generated files: the runtime primer per language + its review sheet. */
export function compileScriptPrimerFiles(): CompiledFile[] {
  const files: CompiledFile[] = [];
  for (const lang of presentLangs()) {
    const { primer } = parsePrimer(lang);
    if (!primer) continue; // validate reports it
    files.push(
      { relPath: `${PRIMER_ARTIFACT_ROOT}/${lang}.json`, contents: canonicalJson(primer) },
      { relPath: primerReviewRel(lang), contents: renderPrimerReview(primer) }
    );
  }
  return files;
}
