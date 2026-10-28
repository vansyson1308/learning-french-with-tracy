import { useMemo } from "react";

import { getPack } from "./content";
import { readingAidOn, readingFor, readingMap } from "./learning/reading-aid";
import { useProgress } from "./store";

const none = (): string | undefined => undefined;

/**
 * The reading (romanization) to show under a target text in `courseId`
 * (default: the active course), or nothing when the course authors none
 * or the learner switched the aid off.
 */
export function useReadingAid(courseId?: string): (text: string) => string | undefined {
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const id = courseId ?? activeCourseId;
  const on = useProgress((s) => readingAidOn(s.readingAid, id));
  const pack = getPack(id);
  const map = useMemo(() => readingMap(pack.sections.flatMap((s) => s.units.flatMap((u) => u.words))), [pack]);
  return useMemo(() => (on && map.size > 0 ? (text: string) => readingFor(map, text) : none), [on, map]);
}

/** Whether a course has any reading aid to offer (the Profile switch shows only then). */
export function courseHasReadingAid(courseId: string): boolean {
  return getPack(courseId).sections.some((s) => s.units.some((u) => u.words.some((w) => w.romanization)));
}
