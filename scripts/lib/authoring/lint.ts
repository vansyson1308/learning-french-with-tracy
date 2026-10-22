/**
 * Quality linters beyond the validators (P3c): answer-position balance,
 * duplicate exercise payloads, distractor plausibility (same part of
 * speech / topic through the lexicon), guidebook length floor/ceiling,
 * exercise-type mix per section against the blueprint, lexeme coverage
 * (taught ≥ 2 times, reviewed ≥ 1 time per skill), CEFR-descriptor leak
 * (banned phrases — the project never embeds descriptor text) and reading
 * level caps. Pure functions over loaded content; `lintCourse` reads the
 * committed files. Findings are advisory: the validators gate, the linters
 * inform the review.
 */

import { existsSync } from "fs";

import type { PackSource } from "../../../content/schema";
import { readJson, safeResolve } from "../pipeline";

export type LintFinding = { rule: string; severity: "error" | "warn" | "info"; where: string; message: string };
export type LintReport = { courseId: string; findings: LintFinding[]; stats: Record<string, unknown> };

type Exercise = Record<string, unknown> & { type: string; id: string };

const GUIDEBOOK_MIN = 600;
const GUIDEBOOK_MAX = 2200;
const READING_TOKEN_CAP_EARLY = 60;
const READING_TOKEN_CAP_LATE = 90;

/** Phrases that signal copied CEFR descriptor wording (the project paraphrases; it never reproduces the scales). */
export const CEFR_DESCRIPTOR_PHRASES: readonly string[] = [
  "can understand and use familiar everyday expressions",
  "very basic phrases aimed at the satisfaction of needs of a concrete type",
  "can introduce him/herself and others",
  "can interact in a simple way provided the other person talks slowly and clearly",
  "can understand sentences and frequently used expressions related to areas of most immediate relevance",
  "has a basic repertoire of words and simple phrases",
  "can establish basic social contact",
  "hiểu và sử dụng các cách diễn đạt quen thuộc hàng ngày",
  "có thể giới thiệu bản thân và người khác",
  "với điều kiện người đối thoại nói chậm và rõ",
];

/** English calques STYLE-vi §1 bans from learner-facing Vietnamese. */
export const CALQUE_PHRASES: readonly string[] = ["hiệu quả cao", "tần suất cao", "nền tảng cốt lõi"];

/** Blueprint exercise-type mix per section (French), used as the reference distribution. */
export const BLUEPRINT_MIX: Record<string, Record<string, number>> = {
  "section-1": { select: 120, wordBank: 40, fillBlank: 20, match: 20, typeAnswer: 20 },
  "section-2": { select: 101, conjugationCloze: 33, fillBlank: 23, articleSelect: 20, typeAnswer: 14 },
  "section-3": { listeningComprehension: 35, select: 32, readingComprehension: 24, dictation: 7, match: 6 },
  "section-4": { speakProduction: 20, speakRepetition: 9, select: 5 },
  "section-5": { guidedWriting: 16, wordBank: 6, simpleForm: 2 },
  "section-6": { select: 13, wordBank: 10, interactionScenario: 8 },
};

function sectionKey(sectionId: string): string {
  return sectionId.split(":")[1] ?? sectionId;
}

export function lintPack(pack: PackSource, lexicon: { surface: string; partOfSpeech: string; topic?: string; glosses: Record<string, string> }[] | null, native: string): LintReport {
  const findings: LintFinding[] = [];
  const bySurface = new Map((lexicon ?? []).map((l) => [l.surface, l]));
  const byGloss = new Map((lexicon ?? []).flatMap((l) => (l.glosses[native] ? [[l.glosses[native], l] as const] : [])));
  const lookup = (text: string) => bySurface.get(text) ?? byGloss.get(text) ?? null;

  // 1. Answer-position balance per exercise type (select / fillBlank / listening / reading).
  const positions = new Map<string, number[]>();
  const payloads = new Map<string, string[]>();
  const typeMix = new Map<string, Record<string, number>>();
  const lexemeUse = new Map<string, { recognize: number; produce: number; total: number }>();
  const bump = (surface: string, skill: "recognize" | "produce") => {
    const u = lexemeUse.get(surface) ?? { recognize: 0, produce: 0, total: 0 };
    u[skill] += 1;
    u.total += 1;
    lexemeUse.set(surface, u);
  };
  for (const s of pack.sections) {
    const sk = sectionKey(s.id);
    const mix = typeMix.get(sk) ?? {};
    for (const u of s.units) {
      const gb = u.guidebook ?? "";
      if (gb.length > 0 && gb.length < GUIDEBOOK_MIN) findings.push({ rule: "guidebook-length", severity: "warn", where: u.id, message: `guidebook has ${gb.length} chars (< ${GUIDEBOOK_MIN})` });
      if (gb.length > GUIDEBOOK_MAX) findings.push({ rule: "guidebook-length", severity: "warn", where: u.id, message: `guidebook has ${gb.length} chars (> ${GUIDEBOOK_MAX})` });
      for (const w of u.words) bump(w.target, "recognize");
      for (const l of u.lessons) {
        for (const ex of l.exercises as Exercise[]) {
          mix[ex.type] = (mix[ex.type] ?? 0) + 1;
          const { id: _id, ...rest } = ex;
          const payload = JSON.stringify(rest);
          payloads.set(payload, [...(payloads.get(payload) ?? []), ex.id]);
          if (typeof ex.correct === "number" && Array.isArray(ex.options)) {
            positions.set(ex.type, [...(positions.get(ex.type) ?? []), ex.correct]);
            // Distractor plausibility: options that resolve to lexemes should share POS (and ideally topic) with the answer.
            const options = (ex.options as ({ text: string } | string)[]).map((o) => (typeof o === "string" ? o : o.text));
            const answer = lookup(options[ex.correct] ?? "");
            if (answer) {
              for (const [i, text] of options.entries()) {
                if (i === ex.correct) continue;
                const d = lookup(text);
                // Interjections and fixed expressions are one class for a learner (hola / buenos días / por favor).
                const cls = (pos: string) => (pos === "interjection" || pos === "expression" ? "formula" : pos);
                if (d && cls(d.partOfSpeech) !== cls(answer.partOfSpeech)) findings.push({ rule: "distractor-pos", severity: "info", where: ex.id, message: `distractor "${text}" is ${d.partOfSpeech}, answer "${options[ex.correct]}" is ${answer.partOfSpeech}` });
              }
            }
          }
          // Lexeme coverage: prompts (recognize) and answers typed/assembled (produce).
          if (typeof ex.prompt === "string" && bySurface.has(ex.prompt)) bump(ex.prompt, "recognize");
          if (ex.type === "typeAnswer" && typeof ex.answer === "string" && bySurface.has(ex.answer)) bump(ex.answer, "produce");
          if (ex.type === "wordBank" && Array.isArray(ex.answer)) {
            const joined = (ex.answer as string[]).join(" ");
            if (bySurface.has(joined)) bump(joined, "produce");
          }
          if (ex.type === "match" && Array.isArray(ex.pairs)) for (const p of ex.pairs as { target: string }[]) if (bySurface.has(p.target)) bump(p.target, "recognize");
          if (ex.type === "select" && ex.mode === "nativeToTarget" && Array.isArray(ex.options) && typeof ex.correct === "number") {
            const text = (ex.options as { text: string }[])[ex.correct]?.text;
            if (text && bySurface.has(text)) bump(text, "produce");
          }
        }
      }
    }
    typeMix.set(sk, mix);
  }
  for (const [type, list] of positions) {
    const n = list.length;
    if (n < 8) continue;
    const counts = new Map<number, number>();
    for (const p of list) counts.set(p, (counts.get(p) ?? 0) + 1);
    const [top, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topCount / n > 0.5) findings.push({ rule: "answer-position-bias", severity: "warn", where: type, message: `${topCount}/${n} correct answers sit at index ${top} (> 50 %) — shuffle at authoring or render time` });
  }
  for (const [, ids] of payloads) if (ids.length > 1) findings.push({ rule: "duplicate-payload", severity: "warn", where: ids.join(" = "), message: "identical exercise payload" });
  for (const [sk, mix] of typeMix) {
    const ref = BLUEPRINT_MIX[sk];
    if (!ref) continue;
    const missing = Object.keys(ref).filter((t) => !(t in mix));
    const extra = Object.keys(mix).filter((t) => !(t in ref));
    if (missing.length > 0 || extra.length > 0) findings.push({ rule: "type-mix", severity: "info", where: sk, message: `types vs blueprint — missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}` });
  }
  if (lexicon) {
    for (const [surface, u] of lexemeUse) {
      if (u.total < 2) findings.push({ rule: "lexeme-coverage", severity: "info", where: surface, message: `taught ${u.total} time(s) (< 2)` });
      if (u.recognize === 0 || u.produce === 0) findings.push({ rule: "lexeme-skill-coverage", severity: "info", where: surface, message: `recognize ${u.recognize} / produce ${u.produce} — one skill never exercised` });
    }
    for (const l of lexicon) if (!lexemeUse.has(l.surface)) findings.push({ rule: "lexeme-coverage", severity: "info", where: l.surface, message: "lexeme never appears in the pack" });
  }
  // CEFR descriptor leak over every string of the pack.
  const text = JSON.stringify(pack).toLowerCase();
  for (const phrase of CEFR_DESCRIPTOR_PHRASES) if (text.includes(phrase.toLowerCase())) findings.push({ rule: "cefr-descriptor-leak", severity: "warn", where: pack.id, message: `contains the descriptor phrase "${phrase}"` });
  for (const phrase of CALQUE_PHRASES) if (text.includes(phrase)) findings.push({ rule: "calque", severity: "warn", where: pack.id, message: `learner-facing text uses the calque "${phrase}" (STYLE-vi §1)` });
  return { courseId: pack.id, findings, stats: { positions: Object.fromEntries([...positions].map(([t, l]) => [t, l.length])), duplicates: [...payloads.values()].filter((v) => v.length > 1).length, lexemesTracked: lexemeUse.size } };
}

/** Readings (reception) and native-text documents: descriptor leak + reading-level caps. */
export function lintRich(lang: string, native: string): LintFinding[] {
  const findings: LintFinding[] = [];
  const readRel = `content/${lang}/reception/reading.json`;
  if (existsSync(safeResolve(readRel))) {
    // Exam texts (use: "exam") follow the exam format's own word bands (validated there).
    const readings = (readJson(readRel) as { readings: { id: string; blocks: { text: string }[]; use?: string }[] }).readings.filter((r) => r.use !== "exam");
    readings.forEach((r, i) => {
      const tokens = r.blocks.reduce((n, b) => n + b.text.split(/\s+/).filter(Boolean).length, 0);
      const cap = i < readings.length / 2 ? READING_TOKEN_CAP_EARLY : READING_TOKEN_CAP_LATE;
      if (tokens > cap) findings.push({ rule: "reading-level", severity: "warn", where: r.id, message: `${tokens} tokens (> ${cap})` });
    });
  }
  for (const rel of [`content/${lang}/assessment/objectives.json`, `content/${lang}/pedagogy/concepts.json`, `content/${lang}/assessment/checkpoints.json`]) {
    if (!existsSync(safeResolve(rel))) continue;
    const text = JSON.stringify(readJson(rel)).toLowerCase();
    for (const phrase of CEFR_DESCRIPTOR_PHRASES) if (text.includes(phrase.toLowerCase())) findings.push({ rule: "cefr-descriptor-leak", severity: "warn", where: rel, message: `contains the descriptor phrase "${phrase}"` });
  }
  const conceptsRel = `content/${lang}/pedagogy/concepts.json`;
  if (existsSync(safeResolve(conceptsRel))) {
    for (const c of (readJson(conceptsRel) as { concepts: { id: string; explanation: Record<string, string> }[] }).concepts) {
      const e = c.explanation[native] ?? "";
      if (e.length > 700) findings.push({ rule: "concept-length", severity: "info", where: c.id, message: `explanation ${e.length} chars (> 700)` });
    }
  }
  return findings;
}

/**
 * P3e syllabus coverage: every lexeme of the level's syllabus is delivered
 * either by the lessons (used ≥ 2 times across exercises) or by the daily
 * new-words stream (in the syllabus with a gloss and a translated example
 * in the course's native language). Anything else is UNCOVERED — an error.
 */
export function lintSyllabusCoverage(
  pack: PackSource,
  syllabus: { entries: { lexemeId: string }[] } | null,
  lexicon: { id: string; surface: string; glosses: Record<string, string>; examples?: { translations: Record<string, string> }[] }[] | null,
  native: string
): { findings: LintFinding[]; stats: { lessons: number; daily: number; uncovered: number } } {
  const findings: LintFinding[] = [];
  const stats = { lessons: 0, daily: 0, uncovered: 0 };
  if (!syllabus || !lexicon) return { findings, stats };
  const byId = new Map(lexicon.map((l) => [l.id, l]));
  // Authored packs carry no gradeTargets: count exercises whose text uses the
  // lexeme's head word (article stripped, whole word, case-insensitive).
  const texts = pack.sections.flatMap((s) => s.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises.map((ex) => JSON.stringify(ex).toLowerCase()))));
  const head = (surface: string) => surface.toLowerCase().replace(/^(el|la|los|las|le|les|l'|un|une|der|die|das|il|lo|gli|o|a|os|as) /, "");
  const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const usesOf = (surface: string) => {
    const re = new RegExp(`(^|[^\\p{L}])${escape(head(surface))}([^\\p{L}]|$)`, "u");
    return texts.filter((t) => re.test(t)).length;
  };
  for (const e of syllabus.entries) {
    const lex = byId.get(e.lexemeId);
    if (lex && usesOf(lex.surface) >= 2) {
      stats.lessons += 1;
    } else if (lex && lex.glosses[native] && (lex.examples ?? []).some((x) => x.translations[native])) {
      stats.daily += 1;
    } else {
      stats.uncovered += 1;
      findings.push({ rule: "syllabus-coverage", severity: "error", where: e.lexemeId, message: "in the syllabus but neither taught ≥ 2 times nor deliverable by the daily stream (no gloss / translated example)" });
    }
  }
  return { findings, stats };
}

export function lintCourse(courseId: string): LintReport {
  const pack = readJson(`content/courses/${courseId}.json`) as PackSource;
  const lang = pack.targetCode;
  const lexRel = `content/${lang}/lexicon/lexemes.json`;
  const lexicon = existsSync(safeResolve(lexRel)) ? (readJson(lexRel) as { lexemes: { id: string; surface: string; partOfSpeech: string; topic?: string; glosses: Record<string, string>; examples?: { translations: Record<string, string> }[] }[] }).lexemes : null;
  const report = lintPack(pack, lexicon, pack.nativeCode);
  report.findings.push(...lintRich(lang, pack.nativeCode));
  const sylRel = `content/${lang}/lexicon/syllabus.json`;
  const syllabus = existsSync(safeResolve(sylRel)) ? (readJson(sylRel) as { entries: { lexemeId: string }[] }) : null;
  const coverage = lintSyllabusCoverage(pack, syllabus, lexicon, pack.nativeCode);
  report.findings.push(...coverage.findings);
  report.stats = { ...report.stats, syllabusCoverage: coverage.stats };
  return report;
}

export function renderLintReport(r: LintReport): string {
  const by = new Map<string, LintFinding[]>();
  for (const f of r.findings) by.set(f.rule, [...(by.get(f.rule) ?? []), f]);
  const lines = [`# Lint — ${r.courseId}`, "", `Findings: ${r.findings.length} (${[...by].map(([k, v]) => `${k} ${v.length}`).join(", ") || "none"})`, ""];
  for (const [rule, list] of [...by].sort()) {
    lines.push(`## ${rule} (${list.length})`, "");
    for (const f of list.slice(0, 40)) lines.push(`- ${f.severity === "error" ? "❌" : f.severity === "warn" ? "⚠️" : "ℹ️"} \`${f.where}\`: ${f.message}`);
    if (list.length > 40) lines.push(`- … ${list.length - 40} more`);
    lines.push("");
  }
  return lines.join("\n");
}
