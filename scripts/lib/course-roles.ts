/**
 * Course roles within one target language (P3d).
 *
 * A target's rich layers (lexicon, pedagogy, assessment, reception, speech,
 * writing, interaction) are compiled once, for its PRIMARY course; the
 * reports and claim gates count against that course's lessons. Every other
 * course of the target is either
 *
 *   - a MIRROR (the default, P2b): the same course in another native
 *     language, exercise for exercise through `<id>.map.json`, with its own
 *     native-language artifacts named by the course id (`fr-vi-*`); or
 *   - STANDALONE (`"role": "standalone"` in its profile): an independent,
 *     usually legacy, course that shares only the target's lexicon (its own
 *     native-language dictionary) and none of the rich layers.
 *
 * Without any explicit role the primary is the non-standalone course with
 * the smallest native code — `en` for French, so every pre-P3d artifact name
 * and byte is unchanged. A course marked `"role": "primary"` overrides that
 * (Spanish: the Vietnamese-first `es-vi` is primary, the legacy `es-en` is
 * standalone). Pure: the caller supplies the role reader.
 */

export type CourseRole = "primary" | "standalone";

export type CourseRef = { id: string; targetCode: string; nativeCode: string };

export type CourseRoles<T extends CourseRef> = {
  primary: T | undefined;
  mirrors: T[];
  standalone: T[];
  errors: string[];
};

const byNativeThenId = (a: CourseRef, b: CourseRef) => a.nativeCode.localeCompare(b.nativeCode) || a.id.localeCompare(b.id);
const byId = (a: CourseRef, b: CourseRef) => a.id.localeCompare(b.id);

export function resolveCourseRoles<T extends CourseRef>(
  targetCode: string,
  packs: readonly T[],
  roleOf: (courseId: string) => CourseRole | undefined
): CourseRoles<T> {
  const mine = packs.filter((p) => p.targetCode === targetCode);
  const errors: string[] = [];
  const explicit = mine.filter((p) => roleOf(p.id) === "primary").sort(byId);
  if (explicit.length > 1) {
    errors.push(`${targetCode}: ${explicit.map((p) => p.id).join(", ")} are all marked "role": "primary" — at most one course of a target can be`);
  }
  const standalone = mine.filter((p) => roleOf(p.id) === "standalone").sort(byId);
  const rest = mine.filter((p) => !standalone.includes(p));
  const primary = explicit[0] ?? [...rest].sort(byNativeThenId)[0];
  if (primary === undefined && mine.length > 0) {
    errors.push(`${targetCode}: every course is "role": "standalone" — one course must carry the target's rich layers`);
  }
  const mirrors = rest.filter((p) => p !== primary).sort(byId);
  const nativeOwners = new Map<string, string>();
  for (const p of primary ? [primary, ...mirrors] : mirrors) {
    const owner = nativeOwners.get(p.nativeCode);
    if (owner !== undefined) {
      errors.push(`${targetCode}: ${owner} and ${p.id} share native language "${p.nativeCode}" — mark one "role": "standalone"`);
    }
    nativeOwners.set(p.nativeCode, p.id);
  }
  return { primary, mirrors, standalone, errors };
}
