/**
 * Generates src/lib/__fixtures__/progress/v3-assessed.json — a persist-v3
 * persona (the last pre-P1d shape) with everything v4 moves: French FSRS
 * cards in three skills, a review log with mutations, a placement result
 * with an accepted floor, checkpoint attempts with and without form
 * stamps, plus a legacy Spanish course. Deterministic (fixed clock); run
 * once with `bun scripts/__fixtures__/make-v3-assessed.ts` and commit the
 * output — the fixture is frozen history afterwards.
 */
import { writeFileSync } from "fs";

import richFixture from "../../src/lib/__fixtures__/progress/v0-rich.json";
import type { ReviewLogEntry } from "../../src/lib/learning/review-log";
import type { FsrsCardState } from "../../src/lib/learning/scheduler";
import { migrateProgress } from "../../src/lib/persistence/migrations";
import { safeResolve } from "../lib/pipeline";

const NOW = new Date(Date.UTC(2026, 5, 15, 12));
const DAY = 86_400_000;
const state = migrateProgress(JSON.parse(JSON.stringify(richFixture.state)), 0, NOW, 3);
const fr = state.courses["fr-en"];
const card = (due: number, reps: number, stability: number): FsrsCardState => ({
  due,
  stability,
  difficulty: 5.5,
  scheduled_days: Math.max(1, Math.round(stability)),
  learning_steps: 0,
  reps,
  lapses: 0,
  state: "review",
  last_review: due - Math.round(stability) * DAY,
});
fr.cards = {
  ...fr.cards,
  "fr:w:pomme|recognize": card(NOW.getTime() - DAY, 4, 6),
  "fr:w:pomme|listen": card(NOW.getTime() + 2 * DAY, 2, 3),
  "fr:w:bonjour|speak": card(NOW.getTime() + 5 * DAY, 3, 8),
};
const log: ReviewLogEntry[] = [
  {
    at: NOW.getTime() - 7 * DAY,
    courseId: "fr-en",
    cardKey: "fr:w:pomme|recognize",
    sessionId: "lesson-a",
    exerciseId: "fr-en:u0-l0-e1",
    modality: "recognizeText",
    srsRole: "assessment",
    source: "lesson",
    correct: true,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 1400,
    attemptIndex: 0,
    mutation: {
      grade: "good",
      prevCard: { ...card(NOW.getTime() - 8 * DAY, 3, 4), state: "review" },
    },
  },
  {
    at: NOW.getTime() - 7 * DAY + 60_000,
    courseId: "fr-en",
    cardKey: "fr:w:pomme|recognize",
    sessionId: "lesson-a",
    exerciseId: "fr-en:u0-l0-e2",
    modality: "recognizeText",
    srsRole: "practice",
    source: "lesson",
    correct: false,
    hinted: true,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 2100,
    attemptIndex: 1,
  },
  {
    at: NOW.getTime() - DAY,
    courseId: "fr-en",
    cardKey: "fr:w:bonjour|speak",
    sessionId: "today-b",
    exerciseId: "speak-fr:w:bonjour",
    modality: "speak",
    srsRole: "assessment",
    source: "today",
    correct: true,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 3300,
    attemptIndex: 0,
    mutation: { grade: "easy", prevCard: card(NOW.getTime() - 2 * DAY, 2, 5) },
  },
];
state.reviewLog = log;
state.assessment = {
  placementFloor: 20,
  placement: {
    placementVersion: 3,
    completedAt: NOW.getTime() - 10 * DAY,
    recommendedLessonId: "fr-en:ua-l0",
    recommendedFloorIndex: 20,
    objectiveEstimates: [
      { objectiveId: "fr.obj.vocab.everyday_basics", estimate: "comfortable" },
      { objectiveId: "fr.obj.greetings.basic", estimate: "gap" },
    ],
    itemResults: [{ itemId: "fr.pli.s1.greet", correct: true }],
  },
  checkpointAttempts: [
    {
      checkpointId: "fr.checkpoint.section-1",
      checkpointVersion: 1,
      startedAt: NOW.getTime() - 9 * DAY,
      completedAt: NOW.getTime() - 9 * DAY + 600_000,
      itemResults: [{ itemId: "fr.cpi.s1.greet_evening", correct: true }],
      objectiveResults: [{ objectiveId: "fr.obj.greetings.basic", result: "demonstrated", correct: 3, total: 3 }],
      overallCorrectShare: 1,
    },
    {
      checkpointId: "fr.checkpoint.a1-capstone",
      checkpointVersion: 1,
      formId: "a",
      formVersion: 1,
      startedAt: NOW.getTime() - DAY,
      completedAt: NOW.getTime() - DAY + 900_000,
      itemResults: [{ itemId: "fr.cpi.a1cap.l1", correct: true }],
      objectiveResults: [
        { objectiveId: "fr.obj.listening.short_info", result: "demonstrated", correct: 2, total: 2 },
        { objectiveId: "fr.obj.speaking.give_info", result: "insufficient_evidence", correct: 0, total: 0 },
      ],
      overallCorrectShare: 0.5,
    },
  ],
};
state.speechNoticeAckAt = NOW.getTime() - 3 * DAY;

const out = safeResolve("src/lib/__fixtures__/progress/v3-assessed.json");
writeFileSync(out, `${JSON.stringify({ state, version: 3 }, null, 2)}\n`);
console.log(`wrote ${out}`);
