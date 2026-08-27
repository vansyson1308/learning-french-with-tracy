/**
 * Course capabilities (Phase 3): PRODUCT rollout flags, hand-set — the
 * smallest mechanism that keeps `if (courseId === "fr-en")` out of UI
 * files. Content-derived capabilities (lexicon, pronunciation, …) belong
 * to the future richer catalog; a rollout decision is not computable from
 * content, so it lives here until then.
 */

export type CourseCapabilities = {
  /** TODAY tab + guided daily session (French-first rollout). */
  dailySession: boolean;
  /** Rich lexicon + vocabulary browser (Phase 4, French-first). */
  lexicon: boolean;
};

const FLAGS: Record<string, Partial<CourseCapabilities>> = {
  "fr-en": { dailySession: true, lexicon: true },
};

export function courseCapabilities(courseId: string): CourseCapabilities {
  return { dailySession: false, lexicon: false, ...FLAGS[courseId] };
}
