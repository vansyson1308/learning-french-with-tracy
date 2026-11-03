import { useMemo } from "react";

import { getPack } from "./content";
import { artifactsFor } from "./content-registry";
import { courseProfile } from "./course-profile";
import { languageRules } from "./languages";
import { japaneseInflectionSources } from "./languages/ja-inflection";
import { lexemeMetaFor } from "./learning/lexicon-index";
import { primerPassedFor, type PrimerPassedRecord } from "./learning/primer-progress";
import { readingAidOn, readingFor, readingMap } from "./learning/reading-aid";
import {
  buildScriptReadingIndex,
  EMPTY_SCRIPT_INDEX,
  scriptReadingFor,
  type ReadingSource,
  type ScriptReading,
  type ScriptReadingIndex,
} from "./learning/script-reading";
import type { StoryPieceTuple } from "./stories/content";
import { storySentenceRomaji, storyTokenReading } from "./stories/story-reading";
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
  return buildScriptReadingIndex([...sources, ...inflected.map((s) => ({ ...s, stem: true as const }))]);
}

/**
 * P4c: whether a course shows the romaji line — its profile says `romajiUntilPrimer` and the learner has not
 * passed the course's kana primer checkpoint yet. Independent of the reading-aid switch (that one is furigana).
 */
export function romajiShown(courseId: string, record: PrimerPassedRecord | undefined): boolean {
  return courseProfile(courseId).romajiUntilPrimer === true && !primerPassedFor(record, courseId);
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
  const romaji = useProgress((s) => romajiShown(id, s.primerPassed));
  const pack = getPack(id);
  const index = useMemo(() => scriptReadingIndexFor(id, pack), [id, pack]);
  return useMemo(() => {
    if ((!on && !romaji) || index.bySurface.size === 0) return noScript;
    const profile = courseProfile(id);
    const opts = { targetCode: profile.targetCode, showHanViet: profile.nativeCode === "vi", furigana: on, romaji };
    return (text: string) => scriptReadingFor(text, index, opts);
  }, [on, romaji, index, id]);
}

/** The graded-story reader's reading display of a CJK course (see stories/story-reading.ts). */
export type StoryReadingAid = {
  /** Furigana / pinyin / RR over one word token; the token's own lexeme reading first. */
  token: (word: string, lexemeId?: string) => ScriptReading | undefined;
  /** The romaji line under a whole sentence, word-spaced by its pieces (P4c, until the kana primer is passed). */
  romaji: (pieces: readonly StoryPieceTuple[]) => string | undefined;
  /** A single word (the tap-to-gloss sheet): the lessons' reading, Hán-Việt included for a vi-native course. */
  word: (surface: string) => ScriptReading | undefined;
};

/**
 * The story reader's reading layer, behind the same switches as the lessons: the per-course reading aid
 * (furigana) and `romajiUntilPrimer` until the primer is passed (romaji). Null for a Latin-script course,
 * or when both are off — the reader then renders exactly as it did before the layer existed.
 */
export function useStoryReading(courseId: string): StoryReadingAid | null {
  const on = useProgress((s) => readingAidOn(s.readingAid, courseId));
  const romaji = useProgress((s) => romajiShown(courseId, s.primerPassed));
  const pack = getPack(courseId);
  const index = useMemo(() => scriptReadingIndexFor(courseId, pack), [courseId, pack]);
  return useMemo(() => {
    if ((!on && !romaji) || index.bySurface.size === 0) return null;
    const profile = courseProfile(courseId);
    const opts = { targetCode: profile.targetCode, furigana: on, romaji };
    const wordOpts = { targetCode: profile.targetCode, showHanViet: profile.nativeCode === "vi", furigana: on, romaji };
    return {
      token: (word, lexemeId) => storyTokenReading(word, lexemeId ? lexemeMetaFor(courseId, lexemeId) : undefined, index, opts),
      romaji: (pieces) => storySentenceRomaji(pieces, index, opts),
      word: (surface) => scriptReadingFor(surface, index, wordOpts),
    };
  }, [on, romaji, index, courseId]);
}

/** Whether a course has any reading aid to offer (the Profile switch shows only then). */
export function courseHasReadingAid(courseId: string): boolean {
  const pack = getPack(courseId);
  return (
    pack.sections.some((s) => s.units.some((u) => u.words.some((w) => w.romanization))) ||
    scriptReadingIndexFor(courseId, pack).bySurface.size > 0
  );
}
