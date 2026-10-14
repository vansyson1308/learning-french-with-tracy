/**
 * Per-course artifact registry (P1b). The compiler generates one module per
 * course under src/content/artifacts/<courseId>.ts with STATIC imports of
 * that course's compiled artifacts (Metro needs static requires), plus an
 * index. Content modules (assessment, reception, speech, writing,
 * interaction, concepts, lexicon index) resolve their data through
 * `artifactsFor(courseId)` and treat a missing artifact as "no such
 * content for this course" — never as an error.
 */

import { COURSE_ARTIFACTS } from "../content/artifacts";

export type CourseArtifacts = {
  ids?: unknown;
  lexiconIndex?: unknown;
  lexiconFallback?: unknown;
  concepts?: unknown;
  objectives?: unknown;
  checkpoints?: unknown;
  placement?: unknown;
  attainment?: unknown;
  claim?: unknown;
  listening?: unknown;
  reading?: unknown;
  /** clipId → bundled audio module (require()). */
  clipAssets?: Record<string, number>;
  speech?: unknown;
  writing?: unknown;
  scenarios?: unknown;
};

const EMPTY: CourseArtifacts = {};

/**
 * Test seam (P1c): artifacts of TEST-ONLY courses (compiled under
 * src/content/test-only, never bundled) are registered here by a test so
 * the synthetic language flows through the very same registry. Never
 * called by app code.
 */
const TEST_ARTIFACTS = new Map<string, CourseArtifacts>();

export function __registerCourseArtifactsForTests(courseId: string, artifacts: CourseArtifacts | null): void {
  if (artifacts === null) TEST_ARTIFACTS.delete(courseId);
  else TEST_ARTIFACTS.set(courseId, artifacts);
}

export function artifactsFor(courseId: string): CourseArtifacts {
  return TEST_ARTIFACTS.get(courseId) ?? (COURSE_ARTIFACTS as Record<string, CourseArtifacts>)[courseId] ?? EMPTY;
}

/** Small per-course memo for derived views (built once per course). */
export function memoByCourse<T>(build: (courseId: string) => T): (courseId: string) => T {
  const cache = new Map<string, T>();
  return (courseId) => {
    const hit = cache.get(courseId);
    if (hit !== undefined) return hit;
    const value = build(courseId);
    cache.set(courseId, value);
    return value;
  };
}
