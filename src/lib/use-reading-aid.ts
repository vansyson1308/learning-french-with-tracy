import { useMemo } from "react";

import { getPack } from "./content";
import { artifactsFor } from "./content-registry";
import { courseProfile } from "./course-profile";
import { languageRules } from "./languages";
import { japaneseInflectionSources } from "./languages/ja-inflection";
import { readingAidOn, readingFor, readingMap } from "./learning/reading-aid";
import {
  buildScriptReadingIndex,
  EMPTY_SCRIPT_INDEX,
  scriptReadingFor,
  type ReadingSource,
  type ScriptReading,
  type ScriptReadingIndex,
} from "./learning/script-reading";
import { useProgress } from "./store";
import type { Pack, WordReading } from "./types";

const none = (): string | undefined => undefined;
const noScript = (): ScriptReading | undefined => undefined;

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

type IndexEntryLike = { surface?: unknown; reading?: WordReading; pos?: unknown };

/**
 * P4b stage 5: every stored reading of a course — its pack words first,
 * then its lexicon index — for a course whose script is not Latin. A
 * Latin-script course gets the empty index, so its renderers never change.
 * P4c: a kana-reading language (ja) appends the inflection keys of its
 * verbs and い-adjectives, so 食べます shows furigana over 食.
 */
export function scriptReadingIndexFor(courseId: string, pack: Pack): ScriptReadingIndex {
  const profile = courseProfile(courseId);
  if (profile.script === "latin") return EMPTY_SCRIPT_INDEX;
  const sources: ReadingSource[] = [];
  for (const section of pack.sections)
    for (const unit of section.units) for (const w of unit.words) if (w.reading) sources.push({ surface: w.target, reading: w.reading });
  const index = artifactsFor(courseId).lexiconIndex as { entries?: IndexEntryLike[] } | undefined;
  for (const e of index?.entries ?? []) {
    if (typeof e.surface === "string" && e.reading && typeof e.reading === "object") {
      sources.push({ surface: e.surface, reading: e.reading, ...(typeof e.pos === "string" ? { pos: e.pos } : {}) });
    }
  }
  const inflected = languageRules(profile.targetCode).readingInput === "kana" ? japaneseInflectionSources(sources) : [];
  return buildScriptReadingIndex([...sources, ...inflected]);
}

/**
 * P4b stage 5: the script reading (furigana / pinyin / RR, plus Hán-Việt
 * for a Vietnamese-native course) of a displayed target text, behind the
 * same per-course "reading aid" switch as the romanization. Undefined for
 * every text of a Latin-script course.
 */
export function useScriptReading(courseId?: string): (text: string) => ScriptReading | undefined {
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const id = courseId ?? activeCourseId;
  const on = useProgress((s) => readingAidOn(s.readingAid, id));
  const pack = getPack(id);
  const index = useMemo(() => scriptReadingIndexFor(id, pack), [id, pack]);
  return useMemo(() => {
    if (!on || index.bySurface.size === 0) return noScript;
    const profile = courseProfile(id);
    const opts = { targetCode: profile.targetCode, showHanViet: profile.nativeCode === "vi" };
    return (text: string) => scriptReadingFor(text, index, opts);
  }, [on, index, id]);
}

/** Whether a course has any reading aid to offer (the Profile switch shows only then). */
export function courseHasReadingAid(courseId: string): boolean {
  const pack = getPack(courseId);
  return (
    pack.sections.some((s) => s.units.some((u) => u.words.some((w) => w.romanization))) ||
    scriptReadingIndexFor(courseId, pack).bySurface.size > 0
  );
}
