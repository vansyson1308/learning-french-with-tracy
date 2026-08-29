/**
 * Speech step policy (P8 §11/§13, test program §28.C): the construct rules
 * the renderers must obey — target/model/partial exposure, bias, budgets,
 * assisted marking, gate states, honest outcome wording.
 */
import { describe, expect, test } from "bun:test";

import {
  attemptAssisted,
  attemptMode,
  canPlayModel,
  contextualStringsFor,
  gateFor,
  gateMessage,
  outcomeNotice,
  recordingBudget,
  showHeardBeforeCheck,
  showPartials,
  showTarget,
} from "../speech/step-policy";
import { unavailableCapability, type SpeechCapability } from "../speech/types";
import type { SpeakProductionExercise, SpeakRepetitionExercise } from "../types";

const repetition: SpeakRepetitionExercise = {
  type: "speakRepetition",
  id: "ex-rep",
  speechItemId: "fr.speak.rep",
  modelClipId: "fr.clip.model",
  target: "Bonjour, ça va ?",
  acceptedVariants: ["Bonjour, ça va ?"],
};

const production: SpeakProductionExercise = {
  type: "speakProduction",
  id: "ex-prod",
  speechItemId: "fr.speak.prod",
  instruction: "Say that you would like a coffee.",
  target: "Je voudrais un café",
  acceptedVariants: ["Je voudrais un café"],
  revealTargetAfterAttempts: 2,
  allowContextualBias: false,
  modelClipId: "fr.clip.model",
  allowedAttempts: 2,
};

const learning = { scored: false };
const scored = { scored: true };
const fresh = { wrongFinals: 0, answered: false };

describe("target exposure (§11/§13)", () => {
  test("repetition always shows its French — it is the practice stimulus", () => {
    expect(showTarget(repetition, learning, fresh)).toBe(true);
    expect(showTarget(repetition, scored, fresh)).toBe(true);
  });

  test("production NEVER shows French before a scored submission", () => {
    expect(showTarget(production, scored, fresh)).toBe(false);
    expect(showTarget(production, scored, { wrongFinals: 99, answered: false })).toBe(false);
  });

  test("learning production hides the target until the reveal threshold", () => {
    expect(showTarget(production, learning, fresh)).toBe(false);
    expect(showTarget(production, learning, { wrongFinals: 1, answered: false })).toBe(false);
    expect(showTarget(production, learning, { wrongFinals: 2, answered: false })).toBe(true);
  });

  test("a null reveal policy never reveals pre-grading", () => {
    const strict = { ...production, revealTargetAfterAttempts: null };
    expect(showTarget(strict, learning, { wrongFinals: 99, answered: false })).toBe(false);
    expect(showTarget(strict, learning, { wrongFinals: 0, answered: true })).toBe(true);
  });
});

describe("model answer playback (§10/§18)", () => {
  test("repetition may always play its model", () => {
    expect(canPlayModel(repetition, learning, { answered: false })).toBe(true);
  });

  test("production learning plays the model only AFTER grading", () => {
    expect(canPlayModel(production, learning, { answered: false })).toBe(false);
    expect(canPlayModel(production, learning, { answered: true })).toBe(true);
  });

  test("scored production never plays a model, answered or not", () => {
    expect(canPlayModel(production, scored, { answered: true })).toBe(false);
  });

  test("no clip, no playback", () => {
    const silent = { ...production, modelClipId: null };
    expect(canPlayModel(silent, learning, { answered: true })).toBe(false);
  });
});

describe("recognizer bias and partials (§13)", () => {
  test("scored attempts run in scored mode with no bias", () => {
    expect(attemptMode(production, scored)).toBe("scored");
    expect(contextualStringsFor(production, scored)).toBeUndefined();
    expect(showPartials(production, scored)).toBe(false);
    expect(showHeardBeforeCheck(scored)).toBe(false);
  });

  test("repetition practice biases toward its own target and may show partials", () => {
    expect(attemptMode(repetition, learning)).toBe("practice");
    expect(contextualStringsFor(repetition, learning)).toEqual(["Bonjour, ça va ?"]);
    expect(showPartials(repetition, learning)).toBe(true);
  });

  test("production without bias permission runs scored-mode capture even in learning", () => {
    expect(attemptMode(production, learning)).toBe("scored");
    expect(contextualStringsFor(production, learning)).toBeUndefined();
    expect(showPartials(production, learning)).toBe(false);
    expect(showHeardBeforeCheck(learning)).toBe(true);
  });

  test("production WITH bias permission is a practice-mode assisted flow", () => {
    const biased = { ...production, allowContextualBias: true };
    expect(attemptMode(biased, learning)).toBe("practice");
    expect(contextualStringsFor(biased, learning)).toEqual(["Je voudrais un café"]);
  });
});

describe("attempt budgets and assisted marking (§13/§23)", () => {
  test("learning records without limits; scored is bounded by the item", () => {
    expect(recordingBudget(production, learning)).toBeNull();
    expect(recordingBudget(production, scored)).toBe(2);
  });

  test("repetition is ALWAYS assisted; clean production is not", () => {
    expect(attemptAssisted(repetition, learning, { targetVisibleAtStart: true })).toBe(true);
    expect(attemptAssisted(production, learning, { targetVisibleAtStart: false })).toBe(false);
  });

  test("a revealed target or bias makes the production attempt assisted", () => {
    expect(attemptAssisted(production, learning, { targetVisibleAtStart: true })).toBe(true);
    const biased = { ...production, allowContextualBias: true };
    expect(attemptAssisted(biased, learning, { targetVisibleAtStart: false })).toBe(true);
  });
});

describe("outcome wording (§14 — honest, never scores)", () => {
  test("silence is described as silence, retryable", () => {
    const notice = outcomeNotice({ kind: "no_speech" });
    expect(notice?.retryable).toBe(true);
    expect(notice?.message).toContain("didn't hear");
  });

  test("technical failure is never blamed on the answer", () => {
    const notice = outcomeNotice({ kind: "technical", reason: "unknown" });
    expect(notice?.retryable).toBe(true);
    expect(notice?.message.toLowerCase()).not.toContain("wrong answer");
  });

  test("abort and final say nothing", () => {
    expect(outcomeNotice({ kind: "aborted" })).toBeNull();
    expect(outcomeNotice(null)).toBeNull();
  });

  test("no message ever claims a score or percentage", () => {
    const all = [
      outcomeNotice({ kind: "no_speech" }),
      outcomeNotice({ kind: "permission_denied" }),
      outcomeNotice({ kind: "technical", reason: "backgrounded" }),
      outcomeNotice({ kind: "technical", reason: "network_failed" }),
      outcomeNotice({ kind: "technical", reason: "audio_capture" }),
    ];
    for (const notice of all) {
      if (!notice) continue;
      expect(notice.message).not.toMatch(/\d+\s*%|pronunciation score/i);
    }
  });
});

describe("capability gate (§24/§25)", () => {
  const ready: SpeechCapability = {
    platform: "ios",
    available: true,
    microphonePermission: "granted",
    speechPermission: "granted",
    frenchRecognitionAvailable: true,
    onDeviceRecognitionAvailable: true,
    frenchOnDeviceModelInstalled: true,
    networkBackedRecognitionPossible: false,
    recordingPersistenceAvailable: true,
    provider: "expo-speech-recognition",
    providerVersion: "56.0.4",
    scoredEligible: true,
  };

  test("granted everything → ready", () => {
    expect(gateFor(ready, learning)).toEqual({ kind: "ready" });
    expect(gateFor(ready, scored)).toEqual({ kind: "ready" });
  });

  test("null capability is still probing", () => {
    expect(gateFor(null, learning)).toEqual({ kind: "probing" });
  });

  test("undetermined permissions ask at point of use", () => {
    const gate = gateFor(
      { ...ready, microphonePermission: "undetermined", scoredEligible: false },
      learning
    );
    expect(gate).toEqual({ kind: "needsPermission" });
  });

  test("denied/cannotAskAgain/restricted block with the Settings path", () => {
    for (const state of ["denied", "cannotAskAgain", "restricted"] as const) {
      const gate = gateFor(
        { ...ready, speechPermission: state, scoredEligible: false },
        learning
      );
      expect(gate).toEqual({ kind: "blocked", reason: "permission" });
      expect(gateMessage(gate)).toContain("Settings");
    }
  });

  test("no recognizer / no French → blocked with a skip path", () => {
    expect(gateFor(unavailableCapability("ios"), learning)).toEqual({
      kind: "blocked",
      reason: "unavailable",
    });
    const noFrench = { ...ready, frenchRecognitionAvailable: false };
    expect(gateFor(noFrench, learning)).toEqual({ kind: "blocked", reason: "noFrench" });
  });

  test("web can practice but is NEVER scored (§25)", () => {
    const web: SpeechCapability = { ...ready, platform: "web", scoredEligible: false };
    expect(gateFor(web, learning)).toEqual({ kind: "ready" });
    expect(gateFor(web, scored)).toEqual({ kind: "blocked", reason: "unavailable" });
  });
});
