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
 *  - P4d sound contrasts: two words whose pinyin spells different syllables;
 *    P4d tone sandhi: each example's spoken tones are scripts/lib/zh-sandhi.ts
 *    applied to its written (citation) tones, and every rule shows a change;
 *  - checkpoint: kana items in a kana primer (Hepburn keys), soundToPinyin
 *    items in a tones primer (the key is the pinyin the primer teaches for
 *    the word heard, the options are pinyin that read differently);
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
import { hepburn, kanaHepburn } from "../../src/lib/languages/ja-romaji";
import { composeJamo } from "../../src/lib/languages/ko";
import { parsePinyinReading } from "../../src/lib/languages/zh";
import { romanizeKorean } from "./cjk-readings/korean-rr";
import { canonicalJson, safeResolve, type CompiledFile } from "./pipeline";
import { sandhiTones } from "./zh-sandhi";

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
// P4c: the Hepburn rules live in the app (src/lib/languages/ja-romaji.ts), which also writes the romaji line shown
// until the primer checkpoint is passed — one set of rules for both.

const isHiragana = (ch: string) => /^[ぁ-ゖ]$/.test(ch);
const isKatakana = (ch: string) => /^[ァ-ヺ]$/.test(ch);

/** The Hepburn reading of one kana cell (a kana, or a kana with its small ゃ/ゅ/ょ), hiragana or katakana; else undefined. */
export function kanaRomaji(kana: string): string | undefined {
  return kanaHepburn(kana);
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
    if (s.kind === "soundContrasts") {
      s.contrasts.forEach((c, i) => {
        out.push({ where: `${s.id}.contrast${i + 1}.a`, text: c.a.gloss }, { where: `${s.id}.contrast${i + 1}.b`, text: c.b.gloss });
        if (c.note) out.push({ where: `${s.id}.contrast${i + 1}.note`, text: c.note });
      });
    }
    if (s.kind === "toneSandhi") {
      for (const r of s.rules) {
        out.push({ where: `${s.id}.${r.rule}`, text: r.text });
        r.examples.forEach((x, j) => out.push({ where: `${s.id}.${r.rule}.example${j + 1}`, text: x.gloss }));
      }
    }
    if (s.kind === "strokes") {
      for (const st of s.strokes) out.push({ where: `${s.id}.${st.name}`, text: st.description });
      s.rules.forEach((r, i) => out.push({ where: `${s.id}.rule${i + 1}`, text: r.rule }));
    }
    if (s.kind === "hangulBlocks") for (const b of s.blocks) out.push({ where: `${s.id}.${b.block}`, text: b.layout });
    if ("notes" in s) (s.notes ?? []).forEach((n, i) => out.push({ where: `${s.id}.note${i + 1}`, text: n }));
  }
  if (primer.checkpoint) out.push({ where: "checkpoint.title", text: primer.checkpoint.title }, { where: "checkpoint.intro", text: primer.checkpoint.intro });
  return out;
}

function checkKana(s: Extract<ScriptPrimer["sections"][number], { kind: "kanaTable" }>, err: (m: string) => void): void {
  // ー lengthens a vowel in katakana words; every other character is the table's script.
  const inScript = s.script === "hiragana" ? isHiragana : (ch: string) => isKatakana(ch) || ch === "ー";
  for (const row of s.rows) {
    if (row.cells.length !== s.columns.length) err(`${s.id}: row "${row.consonant}" has ${row.cells.length} cells for ${s.columns.length} columns`);
    for (const cell of row.cells) {
      if (cell === null) continue;
      if (![...cell.kana].every(inScript)) err(`${s.id}: ${cell.kana} is not ${s.script}`);
      // A cell is one kana (or a yōon pair), or a word of the っ / long-vowel rows: both read by the app's Hepburn rules.
      const expected = kanaRomaji(cell.kana) ?? hepburn(cell.kana);
      if (expected === undefined) err(`${s.id}: ${cell.kana} is not kana`);
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

const syllableKey = (syllables: readonly { base: string; tone: number }[]) => syllables.map((x) => `${x.base}${x.tone}`).join(" ");
const lettersKey = (syllables: readonly { base: string }[]) => syllables.map((x) => x.base).join(" ");

/** P4d: a contrast is two words whose pinyin spells different syllables (a tone-only pair belongs to minimalPairs). */
function checkSoundContrasts(s: Extract<ScriptPrimer["sections"][number], { kind: "soundContrasts" }>, err: (m: string) => void): void {
  s.contrasts.forEach((c, i) => {
    const where = `${s.id} contrast ${i + 1}`;
    const a = syllablesOf(c.a.hanzi, c.a.pinyin, where, err);
    const b = syllablesOf(c.b.hanzi, c.b.pinyin, where, err);
    if (c.a.hanzi === c.b.hanzi) err(`${where}: the same hanzi twice`);
    if (a && b && lettersKey(a) === lettersKey(b)) err(`${where}: ${c.a.pinyin} / ${c.b.pinyin} spell the same syllables (a tone pair is a minimal pair)`);
  });
}

/** P4d: every example's spoken tones are the sandhi of its written (citation) tones, and the rule it sits under fires. */
function checkSandhi(s: Extract<ScriptPrimer["sections"][number], { kind: "toneSandhi" }>, err: (m: string) => void): void {
  for (const r of s.rules) {
    let fires = false;
    r.examples.forEach((x, j) => {
      const where = `${s.id} ${r.rule} example ${j + 1}`;
      const written = syllablesOf(x.hanzi, x.written, where, err);
      const spoken = syllablesOf(x.hanzi, x.spoken, where, err);
      if (x.audio.say !== x.hanzi) err(`${where}: audio says "${x.audio.say}", not ${x.hanzi}`);
      if (!written || !spoken || written.length !== [...x.hanzi].length || spoken.length !== written.length) return;
      if (lettersKey(written) !== lettersKey(spoken)) err(`${where}: ${x.written} / ${x.spoken} are not the same syllables`);
      const tones = sandhiTones(x.hanzi, written);
      if (tones.join() !== spoken.map((y) => y.tone).join()) err(`${where}: ${x.hanzi} ${x.written} is said with tones ${tones.join("-")}, not as "${x.spoken}"`);
      const marker = r.rule === "bu" ? "不" : r.rule === "yi" ? "一" : null;
      if (marker !== null && !x.hanzi.includes(marker)) err(`${where}: ${x.hanzi} has no ${marker}`);
      if (tones.join() !== written.map((y) => y.tone).join()) fires = true;
    });
    if (!fires) err(`${s.id} ${r.rule}: no example shows the rule changing a tone`);
  }
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

/** Every kana the primer's tables teach (each character of every cell). */
function taughtKana(primer: ScriptPrimer): Set<string> {
  const out = new Set<string>();
  for (const s of primer.sections) {
    if (s.kind !== "kanaTable") continue;
    for (const row of s.rows) for (const cell of row.cells) if (cell) for (const ch of cell.kana) out.add(ch);
  }
  return out;
}

/** P4d: every word a tones primer teaches with its pinyin (tone examples, minimal pairs, sound contrasts). */
function taughtWords(primer: ScriptPrimer): Map<string, string> {
  const out = new Map<string, string>();
  const add = (w: { hanzi: string; pinyin: string }) => {
    if (!out.has(w.hanzi)) out.set(w.hanzi, w.pinyin);
  };
  for (const s of primer.sections) {
    if (s.kind === "tones") {
      for (const t of s.tones) add(t.example);
      for (const p of s.minimalPairs) [p.a, p.b].forEach(add);
    }
    if (s.kind === "soundContrasts") for (const c of s.contrasts) [c.a, c.b].forEach(add);
  }
  return out;
}

/**
 * P4d: a tones primer's item — hear a word the primer teaches and pick its pinyin. The key is the taught pinyin
 * (tone-exact); every option is pinyin of as many syllables, and no two options read alike.
 */
function checkPinyinItem(item: Extract<NonNullable<ScriptPrimer["checkpoint"]>["items"][number], { kind: "soundToPinyin" }>, taught: Map<string, string>, where: string, err: (m: string) => void): void {
  const key = taught.get(item.audio.say);
  const options = item.options.map((o) => parsePinyinReading(o));
  item.options.forEach((o, i) => {
    if (options[i] === null) err(`${where}: option "${o}" is not pinyin`);
  });
  if (key === undefined) {
    err(`${where}: ${item.audio.say} is not a word the primer teaches`);
    return;
  }
  const keySyllables = parsePinyinReading(key);
  const chosen = options[item.correct];
  if (keySyllables && chosen && syllableKey(chosen) !== syllableKey(keySyllables)) err(`${where}: ${item.audio.say} is ${key}, not "${item.options[item.correct]}"`);
  if (keySyllables && options.some((o) => o !== null && o.length !== keySyllables.length)) err(`${where}: every option has ${keySyllables.length} syllable(s), as ${key}`);
  const read = options.filter((o) => o !== null).map((o) => syllableKey(o!));
  if (new Set(read).size !== read.length) err(`${where}: two options read the same (${item.options.join(", ")})`);
}

/**
 * The checkpoint. Kana primers (P4c): each key is the app's Hepburn reading, no two options read alike, every kana is
 * taught. Tones primers (P4d): checkPinyinItem. An item of the other primer's kind is refused.
 */
function checkCheckpoint(primer: ScriptPrimer, err: (m: string) => void): void {
  const cp = primer.checkpoint;
  if (cp === undefined) return;
  const kana = primer.sections.some((s) => s.kind === "kanaTable");
  const tones = primer.sections.some((s) => s.kind === "tones");
  if (!kana && !tones) {
    err("checkpoint: only a kana or a tones primer has a checkpoint");
    return;
  }
  const words = taughtWords(primer);
  const ids = cp.items.map((i) => i.id);
  if (new Set(ids).size !== ids.length) err("checkpoint: item ids repeat");
  if (cp.passMark > cp.items.length) err(`checkpoint: passMark ${cp.passMark} is more than the ${cp.items.length} items`);
  if (cp.passMark < Math.ceil(cp.items.length * 0.75)) err(`checkpoint: passMark ${cp.passMark} is below 75% of ${cp.items.length} items`);
  const taught = taughtKana(primer);
  const untaught = (text: string) => [...text].filter((ch) => !taught.has(ch));
  const keyPositions = new Set<number>();
  for (const item of cp.items) {
    const where = `checkpoint ${item.id}`;
    if (item.correct >= item.options.length) {
      err(`${where}: correct ${item.correct} is not an option`);
      continue;
    }
    keyPositions.add(item.correct);
    if (new Set(item.options).size !== item.options.length) err(`${where}: options repeat`);
    if ((item.kind === "soundToPinyin") !== tones || (item.kind !== "soundToPinyin") !== kana) {
      err(`${where}: a ${item.kind} item belongs to a ${item.kind === "soundToPinyin" ? "tones" : "kana"} primer`);
      continue;
    }
    if (item.kind === "soundToPinyin") {
      checkPinyinItem(item, words, where, err);
    } else if (item.kind === "kanaToRomaji") {
      const reading = kanaHepburn(item.kana) ?? hepburn(item.kana);
      if (reading === undefined) err(`${where}: ${item.kana} is not kana`);
      else if (item.options[item.correct] !== reading) err(`${where}: ${item.kana} reads "${reading}", not "${item.options[item.correct]}"`);
      for (const o of item.options) if (!/^[a-zāīūēō']+$/.test(o)) err(`${where}: option "${o}" is not rōmaji`);
      for (const ch of untaught(item.kana)) err(`${where}: ${ch} is not taught by the tables`);
    } else {
      if (item.audio.say !== item.options[item.correct]) err(`${where}: audio says "${item.audio.say}", the key is "${item.options[item.correct]}"`);
      const readings = item.options.map((o) => hepburn(o));
      item.options.forEach((o, i) => {
        if (readings[i] === undefined) err(`${where}: option ${o} is not kana`);
        for (const ch of untaught(o)) err(`${where}: ${ch} is not taught by the tables`);
      });
      if (new Set(readings).size !== readings.length) err(`${where}: two options sound the same (${readings.join(", ")})`);
    }
  }
  if (cp.items.length >= 4 && keyPositions.size < 2) err("checkpoint: the key is always in the same position");
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
    else if (s.kind === "soundContrasts") checkSoundContrasts(s, err);
    else if (s.kind === "toneSandhi") checkSandhi(s, err);
    else if (s.kind === "hangulBlocks") checkHangul(s, err);
  }
  checkCheckpoint(primer, err);
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
