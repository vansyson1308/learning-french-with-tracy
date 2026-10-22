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
