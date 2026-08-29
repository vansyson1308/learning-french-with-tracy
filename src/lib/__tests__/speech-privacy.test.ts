/**
 * Speech privacy pins (P8 §8, §27, §28-J): what a learner SAYS never crosses
 * the persistence boundary. Transcripts and recording URIs exist only in
 * transient attempt/session state; the persisted store (and therefore every
 * backup export, which is a snapshot of that store) carries card keys,
 * verdicts, and timings — never utterance content, never file paths.
 *
 * The tests are sentinel-based: a distinctive spoken phrase demonstrably
 * exists on the transient side of the boundary, then the ENTIRE store state
 * is serialized and scanned. Structural typing already forbids transcript
 * fields on ReviewEvidence/ReviewLogEntry; these pins keep it that way.
 */
import { beforeEach, describe, expect, test } from "bun:test";

import { checkAnswer, isSpokenAnswer, type SpokenAnswer } from "../grading";
import type { ReviewEvidence } from "../learning/evidence";
import { gradeSpokenAttempt } from "../speech/grader";
import { useProgress } from "../store";
import type { SpeakProductionExercise } from "../types";

/** Nobody legitimately stores this string; if it shows up, speech leaked. */
const SENTINEL = "je m'appelle sentinelle privée";
const RECORDING_URI = "file:///cache/speech-attempts/attempt-77.wav";

const exercise: SpeakProductionExercise = {
  type: "speakProduction",
  id: "sp-privacy",
  speechItemId: "fr.speak.privacy",
  instruction: "Introduce yourself.",
  target: SENTINEL,
  acceptedVariants: [SENTINEL],
  evidenceLexemeRefs: ["fr:w:cafe"],
  revealTargetAfterAttempts: null,
  allowContextualBias: false,
  modelClipId: null,
  allowedAttempts: 2,
};

function spokenAnswer(): SpokenAnswer {
  return {
    spoken: true,
    finalTranscript: SENTINEL,
    alternatives: [`${SENTINEL} euh`],
    assisted: false,
  };
}

function speakEvidence(): ReviewEvidence {
  return {
    cardKey: { itemId: "fr:w:cafe", skill: "speak" },
    sessionId: "s-privacy",
    exerciseId: exercise.id,
    modality: "speak",
    srsRole: "assessment",
    source: "review",
    correct: true,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 1800,
    attemptIndex: 0,
  };
}

beforeEach(() => {
  useProgress.setState({
    activeCourseId: "fr-en",
    assessment: { checkpointAttempts: [], placementFloor: 0 },
    courses: {
      "fr-en": {
        xp: 0,
        completedLessons: {},
        mistakes: [],
        wordStats: {},
        srs: {},
        cards: {},
      },
    },
    reviewLog: [],
  } as never);
});

describe("speech privacy boundary (§8/§27)", () => {
  test("the sentinel demonstrably exists on the transient side", () => {
    // The answer union and the grader both SEE the utterance — the boundary
    // test below is only meaningful because of this sensitivity check.
    const answer = spokenAnswer();
    expect(isSpokenAnswer(answer)).toBe(true);
    expect(checkAnswer(exercise, answer)).toBe(true);
    const grade = gradeSpokenAttempt(
      { finalTranscript: answer.finalTranscript, alternatives: answer.alternatives },
      { acceptedVariants: exercise.acceptedVariants }
    );
    expect(grade.correct).toBe(true);
    expect(grade.heard).toBe(SENTINEL);
  });

  test("submitting speak evidence persists NO transcript and NO recording URI", () => {
    const mutated = useProgress.getState().submitEvidence(speakEvidence());
    expect(mutated).toBe(true);

    const state = useProgress.getState();
    // The evidence really landed: card created, log appended…
    expect(state.courses["fr-en"].cards!["fr:w:cafe|speak"]).toBeDefined();
    expect(state.reviewLog.length).toBe(1);

    // …but the WHOLE store — a superset of the persisted snapshot every
    // backup exports — contains no utterance content and no file path.
    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain("sentinelle");
    expect(serialized).not.toContain(SENTINEL);
    expect(serialized).not.toContain("file://");
    expect(serialized).not.toContain("speech-attempts");
    expect(serialized).not.toContain(".wav");
    expect(serialized).not.toContain("finalTranscript");
  });

  test("a recorded checkpoint attempt carries verdicts only — never what was said", () => {
    useProgress.getState().recordCheckpointAttempt({
      checkpointId: "fr.checkpoint.section-4",
      checkpointVersion: 1,
      startedAt: 1,
      completedAt: 2,
      itemResults: [{ itemId: "fr.cpi.s4.speak-1", correct: false }],
      objectiveResults: [
        {
          objectiveId: "fr.obj.speaking.self_intro",
          result: "needs_practice",
          correct: 1,
          total: 3,
        },
      ],
      overallCorrectShare: 1 / 3,
    });
    const serialized = JSON.stringify(useProgress.getState());
    expect(serialized).toContain("fr.cpi.s4.speak-1"); // the attempt is there
    expect(serialized).not.toContain("sentinelle");
    expect(serialized).not.toContain("file://");
  });

  test("the review log entry for speak evidence is structurally utterance-free", () => {
    useProgress.getState().submitEvidence(speakEvidence());
    const entry = useProgress.getState().reviewLog[0];
    // Exhaustive key pin: adding ANY new field to the persisted log entry
    // (e.g. a transcript "for debugging") must consciously break this test.
    expect(Object.keys(entry).sort()).toEqual([
      "assisted",
      "at",
      "attemptIndex",
      "cardKey",
      "correct",
      "courseId",
      "exerciseId",
      "hinted",
      "latencyMs",
      "modality",
      "mutation",
      "sessionId",
      "source",
      "srsRole",
      "toleranceUsed",
    ]);
    expect(entry.cardKey).toBe("fr:w:cafe|speak");
  });

  test("recording URIs never have a pathway into evidence or the store", () => {
    // The URI type-level pathway does not exist; this pins the runtime too:
    // even a hostile caller smuggling a URI through an unchecked cast finds
    // nothing in the store afterwards, because the engine copies known
    // fields instead of spreading evidence into persisted state.
    const hostile = {
      ...speakEvidence(),
      recordingUri: RECORDING_URI,
      transcript: SENTINEL,
    } as unknown as ReviewEvidence;
    useProgress.getState().submitEvidence(hostile);
    const serialized = JSON.stringify(useProgress.getState());
    expect(serialized).not.toContain("file://");
    expect(serialized).not.toContain("sentinelle");
    expect(serialized).not.toContain("recordingUri");
  });
});
