import { describe, expect, test } from "bun:test";

import {
  appendToReviewLog,
  cardMutatedInSession,
  lastMutationIndex,
  REVIEW_LOG_CAP,
  type ReviewLogEntry,
} from "../learning/review-log";

function entry(overrides: Partial<ReviewLogEntry> = {}): ReviewLogEntry {
  return {
    at: 1_700_000_000_000,
    courseId: "fr-en",
    cardKey: "fr:w:pomme|recognize",
    sessionId: "s1",
    exerciseId: "e1",
    modality: "recognizeText",
    srsRole: "assessment",
    source: "review",
    correct: true,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 2000,
    attemptIndex: 0,
    ...overrides,
  };
}

const mutation = {
  grade: "good" as const,
  prevCard: {
    due: 0,
    stability: 0,
    difficulty: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: 0,
    lapses: 0,
    state: "new" as const,
  },
};

describe("appendToReviewLog (ring buffer)", () => {
  test("appends without mutating the input array", () => {
    const log: ReviewLogEntry[] = [];
    const next = appendToReviewLog(log, entry());
    expect(log).toHaveLength(0);
    expect(next).toHaveLength(1);
  });

  test("caps at REVIEW_LOG_CAP by dropping the oldest entries", () => {
    expect(REVIEW_LOG_CAP).toBe(10_000);
    let log: ReviewLogEntry[] = [];
    for (let i = 0; i < 5; i++) {
      log = appendToReviewLog(log, entry({ exerciseId: `e${i}` }), 3);
    }
    expect(log).toHaveLength(3);
    expect(log.map((e) => e.exerciseId)).toEqual(["e2", "e3", "e4"]);
  });
});

describe("cardMutatedInSession", () => {
  test("true only for a mutation-carrying entry with the same card AND session", () => {
    const log = [
      entry({ sessionId: "s1", cardKey: "a|recognize", mutation }),
      entry({ sessionId: "s1", cardKey: "b|recognize" }), // logged, no mutation
      entry({ sessionId: "s2", cardKey: "c|recognize", mutation }),
    ];
    expect(cardMutatedInSession(log, "a|recognize", "s1")).toBe(true);
    expect(cardMutatedInSession(log, "b|recognize", "s1")).toBe(false); // practice only
    expect(cardMutatedInSession(log, "c|recognize", "s1")).toBe(false); // other session
    expect(cardMutatedInSession(log, "a|recognize", "s2")).toBe(false);
    expect(cardMutatedInSession([], "a|recognize", "s1")).toBe(false);
  });
});

describe("lastMutationIndex", () => {
  test("finds the most recent mutation for the course, skipping log-only entries", () => {
    const log = [
      entry({ courseId: "fr-en", exerciseId: "e0", mutation }),
      entry({ courseId: "es-en", exerciseId: "e1", mutation }),
      entry({ courseId: "fr-en", exerciseId: "e2", mutation }),
      entry({ courseId: "fr-en", exerciseId: "e3" }), // no mutation
    ];
    expect(lastMutationIndex(log, "fr-en")).toBe(2);
    expect(lastMutationIndex(log, "es-en")).toBe(1);
    expect(lastMutationIndex(log, "ja-en")).toBe(-1);
    expect(lastMutationIndex([], "fr-en")).toBe(-1);
  });
});
