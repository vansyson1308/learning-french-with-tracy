/**
 * "Từ mới mỗi ngày" — the daily new-words stream (P3e). TODAY introduces
 * up to N lexemes a day (learner setting 0–15, default 5) from the target's
 * syllabus (compiled `<lang>-daily.json`: delivery order + the unit that
 * unlocks each lexeme), but only lexemes whose unit the learner has
 * reached, and never one that already has a memory card. Each is a teach
 * card from the lexicon index (gloss, gender, IPA, one example with its
 * translation) followed by the usual FSRS recognition probe (+ listening
 * when a word clip is bundled) — the normal evidence gate, nothing
 * special, and never an input to the CEFR estimate.
 *
 * Pure: the route resolves artifacts and passes them in.
 */

import { artifactsFor, memoByCourse } from "../content-registry";
import type { Pack, Word } from "../types";

import { lexemeMetaFor, type LexemeMeta } from "./lexicon-index";
import type { FsrsCardState } from "./scheduler";

import { DAILY_NEW_WORDS_MAX } from "./daily-words-setting";

export { DAILY_NEW_WORDS_DEFAULT, DAILY_NEW_WORDS_MAX, normalizeDailyNewWords } from "./daily-words-setting";

export type DailyWordEntry = { id: string; unitId: string };
type DailyArtifact = { version: number; language: string; level: string; entries: DailyWordEntry[] };

const entriesOf = memoByCourse<readonly DailyWordEntry[]>(
  (courseId) => (artifactsFor(courseId).dailyWords as DailyArtifact | undefined)?.entries ?? []
);

export function dailyWordEntries(courseId: string): readonly DailyWordEntry[] {
  return entriesOf(courseId);
}

/**
 * Index (in course unit order) of the furthest unit the learner has reached:
 * the unit of the PATH frontier (first incomplete lesson at or after the
 * placement floor), or the last unit when everything is done.
 */
export function reachedUnitIndex(pack: Pack, completedLessons: Record<string, true>, placementFloor = 0): number {
  let unitIdx = -1;
  let lessonIdx = -1;
  for (const section of pack.sections) {
    for (const unit of section.units) {
      unitIdx += 1;
      for (const lesson of unit.lessons) {
        lessonIdx += 1;
        if (lessonIdx < placementFloor) continue;
        if (!completedLessons[lesson.id]) return unitIdx;
      }
    }
  }
  return unitIdx;
}

const TOPIC_EMOJI: Record<string, string> = {
  people: "🧑",
  family: "👪",
  food: "🍽️",
  places: "🏙️",
  travel: "🧳",
  time: "🕒",
  numbers: "🔢",
  body: "🫀",
  school: "🏫",
  shopping: "🛍️",
  nature: "🌳",
  greetings: "👋",
  leisure: "🎨",
  ideas: "💡",
  everyday: "📘",
};

/** A daily word as the session's Word shape (target = surface, native = gloss). */
export function dailyWordFromMeta(meta: LexemeMeta): Word {
  return { target: meta.surface, native: meta.gloss, emoji: TOPIC_EMOJI[meta.topic ?? ""] ?? "📘" };
}

/**
 * The candidates in delivery order: unlocked (unit reached), not yet a
 * recognition card, renderable from the lexicon index. The composer takes
 * the first N of them that it does not already teach from the frontier.
 */
export function dailyWordCandidates(args: {
  courseId: string;
  pack: Pack;
  completedLessons: Record<string, true>;
  placementFloor?: number;
  cards: Record<string, FsrsCardState> | undefined;
  entries?: readonly DailyWordEntry[];
  lookup?: (itemId: string) => LexemeMeta | undefined;
  max?: number;
}): { itemId: string; word: Word }[] {
  const entries = args.entries ?? dailyWordEntries(args.courseId);
  if (entries.length === 0) return [];
  const lookup = args.lookup ?? ((id: string) => lexemeMetaFor(args.courseId, id));
  const unitIndex = new Map<string, number>();
  let i = 0;
  for (const section of args.pack.sections) for (const unit of section.units) unitIndex.set(unit.id, i++);
  const reached = reachedUnitIndex(args.pack, args.completedLessons, args.placementFloor ?? 0);
  const out: { itemId: string; word: Word }[] = [];
  for (const e of entries) {
    if (out.length >= (args.max ?? DAILY_NEW_WORDS_MAX)) break;
    const idx = unitIndex.get(e.unitId);
    if (idx === undefined || idx > reached) continue;
    if (args.cards?.[`${e.id}|recognize`]) continue;
    const meta = lookup(e.id);
    if (!meta || !meta.gloss) continue;
    out.push({ itemId: e.id, word: dailyWordFromMeta(meta) });
  }
  return out;
}

/** Every syllabus lexeme as a Word (renders daily-word cards in reviews; distractor pool). */
export const syllabusWords = memoByCourse<Word[]>((courseId) =>
  dailyWordEntries(courseId)
    .map((e) => lexemeMetaFor(courseId, e.id))
    .filter((m): m is LexemeMeta => m !== undefined && !!m.gloss)
    .map(dailyWordFromMeta)
);
