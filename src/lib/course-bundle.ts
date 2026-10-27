/**
 * On-demand course content (P3g B). A course's pack, artifacts and bundled
 * audio arrive as one bundle (src/content/courses/<id>.ts) through
 * `loadCourse`, which the root layout awaits for the active course before
 * rendering (and again when the learner switches course). The synchronous
 * readers — getPack, artifactsFor, speakTarget — read the loaded bundles,
 * so screens stay synchronous. Tests and scripts register every bundle up
 * front (src/content/course-bundles.ts).
 */

import { COURSE_LOADERS } from "../content/course-loaders";
import type { CourseArtifacts } from "./content-registry";
import type { Pack } from "./types";

export type CourseBundle = {
  id: string;
  pack: Pack;
  artifacts: CourseArtifacts;
  /** `<audioCourseId>:<text>` → bundled clip (require()). */
  audio: Record<string, number>;
};

const LOADED = new Map<string, CourseBundle>();
const PENDING = new Map<string, Promise<CourseBundle>>();
const listeners = new Set<() => void>();

export function registerCourseBundle(bundle: CourseBundle): void {
  LOADED.set(bundle.id, bundle);
  for (const l of listeners) l();
}

export function courseBundle(courseId: string): CourseBundle | undefined {
  return LOADED.get(courseId);
}

export function isCourseLoaded(courseId: string): boolean {
  return LOADED.has(courseId);
}

export function hasCourse(courseId: string): boolean {
  return LOADED.has(courseId) || courseId in COURSE_LOADERS;
}

/** Load a course's bundle once; concurrent calls share the same promise. */
export function loadCourse(courseId: string): Promise<CourseBundle> {
  const hit = LOADED.get(courseId);
  if (hit) return Promise.resolve(hit);
  const pending = PENDING.get(courseId);
  if (pending) return pending;
  const loader = COURSE_LOADERS[courseId];
  if (!loader) return Promise.reject(new Error(`Unknown course: ${courseId}`));
  const p = loader()
    .then((bundle) => {
      registerCourseBundle(bundle);
      return bundle;
    })
    .finally(() => PENDING.delete(courseId));
  PENDING.set(courseId, p);
  return p;
}

/** Re-render hook seam: called whenever a bundle registers. */
export function onCourseLoaded(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
