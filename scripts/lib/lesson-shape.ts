/**
 * Lesson shape (P3e): template defects the French course had and every
 * new course must not copy.
 *  - A teaching lesson has at least MIN_TEACHING_EXERCISES exercises. The
 *    only exemptions are lessons that ARE one conversation or one form,
 *    declared with `lessonKind: "scenario"` / `"form"` and holding exactly
 *    that single exercise.
 *  - No two exercises of a course share the same payload (everything but
 *    the id) — a repeat is a defect, not review.
 * Courses authored before P3e (French) are grandfathered explicitly in
 * their profile (`legacyLessonShapes: true`): their content stays
 * byte-identical (CLAUDE.md §4). Test-only packs are exempt.
 */

import type { PackSource } from "../../content/schema";

export const MIN_TEACHING_EXERCISES = 5;

/** Key-order-independent JSON (nested objects included). */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((k) => `${JSON.stringify(k)}:${stable((value as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function lessonShapeErrors(pack: PackSource): string[] {
  const errors: string[] = [];
  const payloads = new Map<string, string>();
  for (const section of pack.sections)
    for (const unit of section.units)
      for (const lesson of unit.lessons) {
        const kind = lesson.lessonKind ?? "teaching";
        if (kind === "teaching") {
          if (lesson.exercises.length < MIN_TEACHING_EXERCISES) {
            errors.push(`${pack.id}/${lesson.id}: ${lesson.exercises.length} exercise(s) — a teaching lesson needs ≥ ${MIN_TEACHING_EXERCISES} (or declare lessonKind "scenario"/"form" for a single conversation or form)`);
          }
        } else {
          const want = kind === "scenario" ? "interactionScenario" : "simpleForm";
          if (lesson.exercises.length !== 1 || lesson.exercises[0].type !== want) {
            errors.push(`${pack.id}/${lesson.id}: lessonKind "${kind}" is exactly one ${want} exercise`);
          }
        }
        for (const e of lesson.exercises) {
          const { id: _id, ...rest } = e as Record<string, unknown> & { id: string };
          const key = stable(rest);
          const first = payloads.get(key);
          if (first !== undefined) errors.push(`${pack.id}: ${e.id} repeats the payload of ${first}`);
          else payloads.set(key, e.id);
        }
      }
  return errors;
}

/** Punctuation and spaces dropped when asking "is this option the whole sentence?". */
const SENTENCE_NOISE = /[\s\p{P}]+/gu;
const bareText = (s: string) => s.replace(SENTENCE_NOISE, "");
const foldRoman = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z]+/g, " ").trim();
/** Crude English stem (plural/3rd person) so "pandas come" and "the panda comes" share words. */
const stem = (t: string) => (t.length > 3 ? t.replace(/s$/, "") : t);

/**
 * Inherited-template defects (P4a), checked on every shipped course:
 *  - a fillBlank has exactly one `___` and its correct option is a part of
 *    the sentence, not the whole sentence (the degenerate `___。` items);
 *  - a typeAnswer alternative is never the romanized target prompt (it
 *    used to accept typing the prompt's romanization as a "translation");
 *  - a basic pack lists each word in one unit only (authored courses
 *    re-list words on purpose in their skill sections).
 */
export function templateDefectErrors(pack: PackSource, opts: { checkWordRepeats: boolean }): string[] {
  const errors: string[] = [];
  const romanOf = new Map<string, string>();
  const unitOf = new Map<string, string>();
  for (const section of pack.sections)
    for (const unit of section.units)
      for (const w of unit.words) {
        if (w.romanization) romanOf.set(w.target, foldRoman(w.romanization));
        const first = unitOf.get(w.target);
        if (first === undefined) unitOf.set(w.target, unit.id);
        else if (opts.checkWordRepeats && first !== unit.id) errors.push(`${pack.id}/${unit.id}: word "${w.target}" is already listed in unit ${first}`);
      }
  for (const section of pack.sections)
    for (const unit of section.units)
      for (const lesson of unit.lessons)
        for (const e of lesson.exercises) {
          if (e.type === "fillBlank") {
            const blanks = e.sentence.split("___").length - 1;
            if (blanks !== 1) errors.push(`${pack.id}/${e.id}: fillBlank needs exactly one ___ (has ${blanks})`);
            else if (bareText(e.sentence.replace("___", "")) === "") errors.push(`${pack.id}/${e.id}: fillBlank blank is the whole sentence`);
          }
          if (e.type === "typeAnswer" && romanOf.size > 0) {
            const prompt = e.prompt.replace(/\s+/g, "");
            const romans = [...romanOf].filter(([target]) => prompt.includes(target)).map(([, r]) => r).filter((r) => r.length >= 3);
            const answerTokens = new Set(foldRoman(e.answer).split(" ").map(stem));
            for (const alt of e.alternatives) {
              const folded = foldRoman(alt);
              // A real translation shares most of its words with the answer;
              // a loanword ("hotel", "panda") alone does not make it a romanization.
              const tokens = folded.split(" ").filter(Boolean);
              const shared = tokens.filter((t) => answerTokens.has(stem(t))).length;
              if (shared * 2 < tokens.length && romans.some((r) => folded.replace(/ /g, "").includes(r.replace(/ /g, "")))) {
                errors.push(`${pack.id}/${e.id}: alternative "${alt}" is the romanized prompt, not a translation`);
              }
            }
          }
        }
  return errors;
}
