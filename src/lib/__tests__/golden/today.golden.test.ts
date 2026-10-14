/**
 * TODAY composer goldens (P1a): the composed plan for three personas at
 * every preset, with and without speaking. Seeded by a fixed day and a
 * fixed instant so the plan is identical in every timezone.
 */
import { describe, test } from "bun:test";

import { fsrsScheduler } from "../../learning/fsrs-adapter";
import type { FsrsCardState } from "../../learning/scheduler";
import { composeTodayFromSnapshot, TODAY_PRESETS, type TodayPreset } from "../../learning/today";
import { listenWordClipIndex } from "../../reception/content";
import { speakExerciseIndex } from "../../speech/content";
import { DAY_MS, GOLDEN_DAY, NOW_MS, PERSONA_NAMES, expectGolden, frPack, lessonRef, migratedPersona } from "./helpers";

function dueCard(daysOverdue: number): FsrsCardState {
  const due = NOW_MS - daysOverdue * DAY_MS;
  return {
    ...fsrsScheduler.initialCard(NOW_MS - 40 * DAY_MS),
    due,
    stability: 4,
    difficulty: 5,
    scheduled_days: 4,
    reps: 3,
    state: "review",
    last_review: due - 4 * DAY_MS,
  };
}

/**
 * A fourth persona the fixtures cannot provide: a learner three lessons in
 * with due recognize, listen AND speak cards, so the listening/speaking
 * shares and the "Can't speak now" toggle actually change the plan.
 */
function syntheticDuePersona() {
  const listenIds = Object.keys(listenWordClipIndex("fr-en")).slice(0, 4);
  const speakIds = Object.keys(speakExerciseIndex("fr-en")).slice(0, 4);
  const recognizeIds = [...new Set([...listenIds, ...speakIds, ...Object.keys(listenWordClipIndex("fr-en")).slice(4, 10)])];
  const cards: Record<string, FsrsCardState> = {};
  recognizeIds.forEach((id, i) => (cards[`${id}|recognize`] = dueCard(1 + (i % 5))));
  listenIds.forEach((id, i) => (cards[`${id}|listen`] = dueCard(2 + i)));
  speakIds.forEach((id, i) => (cards[`${id}|speak`] = dueCard(1 + i)));
  const completedLessons: Record<string, true> = {};
  for (const id of ["fr-en:u0-l0", "fr-en:u0-l1", "fr-en:u0-l2"]) if (lessonRef(id)) completedLessons[id] = true;
  return { courses: { "fr-en": { completedLessons, cards } }, assessment: undefined };
}

describe("today goldens (fr-en)", () => {
  for (const persona of [...PERSONA_NAMES, "synthetic-due"] as const) {
    for (const preset of Object.keys(TODAY_PRESETS) as TodayPreset[]) {
      for (const canSpeak of [true, false]) {
        test(`${persona} / ${preset} / ${canSpeak ? "speak" : "silent"}`, () => {
          const state = persona === "synthetic-due" ? syntheticDuePersona() : migratedPersona(persona);
          const course = state.courses["fr-en"];
          const plan = composeTodayFromSnapshot({ courseId: "fr-en", pack: frPack,
            completedLessons: course?.completedLessons ?? {},
            cards: course?.cards,
            preset,
            placementFloor: state.assessment?.placementFloor ?? 0,
            listenClips: listenWordClipIndex("fr-en"),
            speakExercises: canSpeak ? speakExerciseIndex("fr-en") : undefined,
            day: GOLDEN_DAY,
            now: NOW_MS,
          });
          expectGolden(`today/${persona}.${preset}.${canSpeak ? "speak" : "silent"}`, plan);
        });
      }
    }
  }
});
