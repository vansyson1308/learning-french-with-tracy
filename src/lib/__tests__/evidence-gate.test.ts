import { describe, expect, test } from "bun:test";

import { deriveGrade, gateEvidence } from "../learning/evidence-gate";
import type { ReviewEvidence, SrsRole } from "../learning/evidence";

function ev(overrides: Partial<ReviewEvidence> = {}): ReviewEvidence {
  return {
    cardKey: { itemId: "fr:w:pomme", skill: "recognize" },
    sessionId: "s1",
    exerciseId: "u1-l1-e1",
    modality: "recognizeText",
    srsRole: "assessment",
    correct: true,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 2500,
    attemptIndex: 0,
    ...overrides,
  };
}

describe("gateEvidence: only designated assessments mutate", () => {
  test.each([
    ["teach", "role-teach"],
    ["practice", "role-practice"],
    ["none", "role-none"],
  ] as [SrsRole, string][])(
    "role '%s' never mutates, even on a perfect first attempt",
    (srsRole, reason) => {
      expect(gateEvidence(ev({ srsRole }), false)).toEqual({
        mutate: false,
        reason: reason as never,
      });
    }
  );

  test("a retry is never an assessment (no positive review minutes after a lapse)", () => {
    const decision = gateEvidence(ev({ attemptIndex: 1, correct: true }), false);
    expect(decision).toEqual({ mutate: false, reason: "retry" });
  });

  test("assisted evidence is never an assessment — even when hinted would grade Again", () => {
    const decision = gateEvidence(ev({ assisted: true, hinted: true }), false);
    expect(decision).toEqual({ mutate: false, reason: "assisted" });
  });

  test("one mutation per card per session", () => {
    expect(gateEvidence(ev(), true)).toEqual({
      mutate: false,
      reason: "already-mutated-this-session",
    });
    expect(gateEvidence(ev(), false)).toEqual({ mutate: true, grade: "good" });
  });
});

describe("deriveGrade launch policy", () => {
  test("wrong → again", () => {
    expect(deriveGrade({ correct: false, hinted: false, toleranceUsed: false })).toBe("again");
    // wrong wins over everything else
    expect(deriveGrade({ correct: false, hinted: true, toleranceUsed: true })).toBe("again");
  });

  test("hint on a designated assessment forces again (hints count as failures)", () => {
    expect(deriveGrade({ correct: true, hinted: true, toleranceUsed: false })).toBe("again");
    const decision = gateEvidence(ev({ hinted: true }), false);
    expect(decision).toEqual({ mutate: true, grade: "again" }); // still mutates
  });

  test("tolerance consumed → hard", () => {
    expect(deriveGrade({ correct: true, hinted: false, toleranceUsed: true })).toBe("hard");
  });

  test("clean correct → good", () => {
    expect(deriveGrade({ correct: true, hinted: false, toleranceUsed: false })).toBe("good");
  });

  test("easy is never auto-derived, regardless of latency", () => {
    for (const correct of [true, false])
      for (const hinted of [true, false])
        for (const toleranceUsed of [true, false])
          for (const latencyMs of [1, 800, 60_000]) {
            const grade = deriveGrade({ correct, hinted, toleranceUsed });
            expect(grade).not.toBe("easy");
            const decision = gateEvidence(
              ev({ correct, hinted, toleranceUsed, latencyMs }),
              false
            );
            if (decision.mutate) expect(decision.grade).not.toBe("easy");
          }
  });
});
