/**
 * Session goldens (P1a): the full SessionDefinition every French route
 * builds, and the reducer trace of a scripted sitting (correct, wrong,
 * retry, undo, skip where allowed). Pinned so P1b–P1d cannot change what a
 * learner sees or how a session is scored without a re-bless.
 */
import { describe, test } from "bun:test";

import { checkpointFor } from "../../assessment/content";
import { listenWordClipIndex } from "../../reception/content";
import { fsrsScheduler } from "../../learning/fsrs-adapter";
import type { FsrsCardState } from "../../learning/scheduler";
import {
  buildCheckpointSessionDefinition,
  buildConversationPracticeSessionDefinition,
  buildListeningReviewSessionDefinition,
  buildMistakesSessionDefinition,
  buildPathSessionDefinition,
  buildPlacementStageSessionDefinition,
  buildReviewSessionDefinition,
  buildSpeakingReviewSessionDefinition,
  buildWritingPracticeSessionDefinition,
} from "../../session/sources";
import type { SessionDefinition } from "../../session/types";
import { speakExerciseIndex } from "../../speech/content";
import placementJson from "../../../content/assessment/fr-placement.json";
import {
  DAY_MS,
  GOLDEN_DAY,
  NOW_MS,
  allFrWords,
  cyclingScript,
  expectGolden,
  frPack,
  getLesson,
  lessonRef,
  migratedPersona,
  traceSession,
} from "./helpers";

function dueCard(daysOverdue: number): FsrsCardState {
  const due = NOW_MS - daysOverdue * DAY_MS;
  return {
    ...fsrsScheduler.initialCard(NOW_MS - 30 * DAY_MS),
    due,
    stability: 3,
    difficulty: 6,
    scheduled_days: 3,
    reps: 2,
    state: "review",
    last_review: due - 3 * DAY_MS,
  };
}

function dueCards(itemIds: string[], skill: "recognize" | "listen" | "speak"): Record<string, FsrsCardState> {
  return Object.fromEntries(itemIds.map((id, i) => [`${id}|${skill}`, dueCard(i + 1)]));
}

function pin(name: string, def: SessionDefinition, allowSkip = false) {
  expectGolden(`session/${name}.definition`, def);
  expectGolden(
    `session/${name}.trace`,
    traceSession(def.steps, def.retryPolicy ?? "untilCorrect", cyclingScript(allowSkip))
  );
}

describe("session goldens (fr-en)", () => {
  const first = lessonRef("fr-en:u0-l0")!.lesson;
  const flowLesson = lessonRef("fr-en:ua-l0")!.lesson;
  const rich = migratedPersona("v0-rich");
  const richCourse = rich.courses["fr-en"];

  test("path: first lesson, first sitting", () => {
    pin("path-u0-l0-first", buildPathSessionDefinition({ courseId: "fr-en", lesson: first, alreadyCompleted: false, attempt: "first" }));
  });

  test("path: first lesson, replay", () => {
    pin("path-u0-l0-replay", buildPathSessionDefinition({ courseId: "fr-en", lesson: first, alreadyCompleted: true, attempt: `replay:${GOLDEN_DAY}` }));
  });

  test("path: Section 2 lesson with an authored flow (concept steps)", () => {
    pin("path-ua-l0-flow", buildPathSessionDefinition({ courseId: "fr-en", lesson: flowLesson, alreadyCompleted: false, attempt: "first" }));
  });

  test("mistakes re-drill from the v0-rich persona", () => {
    pin(
      "mistakes-v0-rich",
      buildMistakesSessionDefinition({ courseId: "fr-en", mistakes: richCourse.mistakes, getLesson })
    );
  });

  test("srs review over the v0-rich persona's migrated FSRS cards", () => {
    pin(
      "srs-v0-rich",
      buildReviewSessionDefinition({ courseId: "fr-en", course: richCourse, pool: allFrWords(), now: NOW_MS })
    );
  });

  test("srs review with a synthetic due set (6 recognize cards)", () => {
    const ids = Object.keys(listenWordClipIndex()).slice(0, 6);
    pin(
      "srs-synthetic",
      buildReviewSessionDefinition({
        courseId: "fr-en",
        course: { cards: dueCards(ids, "recognize"), srs: undefined },
        pool: allFrWords(),
        now: NOW_MS,
      })
    );
  });

  test("srs-listening over due listen cards with bundled clips", () => {
    const ids = Object.keys(listenWordClipIndex()).slice(0, 5);
    pin(
      "srs-listening",
      buildListeningReviewSessionDefinition({ course: { cards: dueCards(ids, "listen") }, pool: allFrWords(), now: NOW_MS })
    );
  });

  test("srs-speaking over due speak cards with authored probes", () => {
    const ids = Object.keys(speakExerciseIndex()).slice(0, 5);
    pin("srs-speaking", buildSpeakingReviewSessionDefinition({ course: { cards: dueCards(ids, "speak") }, now: NOW_MS }));
  });

  test("writing-practice for a fixed day", () => {
    pin("writing-practice", buildWritingPracticeSessionDefinition({ pack: frPack, seedKey: GOLDEN_DAY }));
  });

  test("conversation practice for a fixed day", () => {
    pin("conversation", buildConversationPracticeSessionDefinition({ seedKey: GOLDEN_DAY }));
  });

  test("section-3 checkpoint, first and second administration", () => {
    const cp = checkpointFor("fr.checkpoint.section-3")!;
    pin("checkpoint-section-3-attempt0", buildCheckpointSessionDefinition(cp, 0));
    pin("checkpoint-section-3-attempt1", buildCheckpointSessionDefinition(cp, 1));
  });

  test("placement stage 1 for a fixed run seed", () => {
    const stage = (placementJson as { stages: Parameters<typeof buildPlacementStageSessionDefinition>[0][] }).stages[0];
    pin("placement-stage-1", buildPlacementStageSessionDefinition(stage, "golden-run"), true);
  });
});
