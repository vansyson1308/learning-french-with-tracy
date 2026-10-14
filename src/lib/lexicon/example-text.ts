/**
 * Example sentences are compiled keyed by LANGUAGE CODE (`{ fr: "…",
 * en: "…" }` for a French course with English native) so one artifact
 * shape serves every course. The runtime never assumes the key names: it
 * resolves the pair through the course profile's target and native codes.
 */

import { courseProfile } from "../course-profile";

export type ExampleTexts = { target: string; native: string };

/** The (target, native) texts of a code-keyed example for a course, or undefined when either is missing. */
export function exampleTexts(
  courseId: string,
  example: Record<string, string | undefined> | undefined | null
): ExampleTexts | undefined {
  if (!example) return undefined;
  const { targetCode, nativeCode } = courseProfile(courseId);
  const target = example[targetCode];
  const native = example[nativeCode];
  if (typeof target !== "string" || typeof native !== "string") return undefined;
  return { target, native };
}
