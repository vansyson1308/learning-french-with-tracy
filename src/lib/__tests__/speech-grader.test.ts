/**
 * Deterministic speech grader (P8 §12/§14, test program §28.D): engine
 * formatting normalizes away, learner differences never do. No confidence,
 * no edit distance, n-best finals only.
 */
import { describe, expect, test } from "bun:test";

import {
  gradeSpokenAttempt,
  normalizeSpokenFrench,
  type SpeechGradingSpec,
} from "../speech/grader";

const finals = (best: string, ...alternatives: string[]) => ({
  finalTranscript: best,
  alternatives,
});

const spec = (variants: string[], concepts?: string[][]): SpeechGradingSpec => ({
  acceptedVariants: variants,
  requiredConcepts: concepts,
});

describe("normalizeSpokenFrench — engine-formatting variance only", () => {
  test("case, punctuation, and French spacing collapse", () => {
    expect(normalizeSpokenFrench("Bonjour !")).toBe("bonjour");
    expect(normalizeSpokenFrench("Ça va ?")).toBe("ça va");
    expect(normalizeSpokenFrench("  Merci,   beaucoup.  ")).toBe("merci beaucoup");
    expect(normalizeSpokenFrench("« Bonjour ! »")).toBe("bonjour");
  });

  test("apostrophe forms and elision spacing compare equal", () => {
    expect(normalizeSpokenFrench("j’ai")).toBe(normalizeSpokenFrench("j'ai"));
    expect(normalizeSpokenFrench("j'ai")).toBe(normalizeSpokenFrench("j ai"));
    expect(normalizeSpokenFrench("l’eau")).toBe("l eau");
  });

  test("hyphen variants compare equal (est-ce que, rectified numbers)", () => {
    expect(normalizeSpokenFrench("est-ce que")).toBe(normalizeSpokenFrench("est ce que"));
    expect(normalizeSpokenFrench("vingt-et-un")).toBe(normalizeSpokenFrench("vingt et un"));
  });

  test("ligatures fold (sœur == soeur) but accents are KEPT", () => {
    expect(normalizeSpokenFrench("ma sœur")).toBe("ma soeur");
    expect(normalizeSpokenFrench("café")).toBe("café");
    expect(normalizeSpokenFrench("a")).not.toBe(normalizeSpokenFrench("à"));
    expect(normalizeSpokenFrench("ou")).not.toBe(normalizeSpokenFrench("où"));
  });

  test("standalone digits 0–100 become French words; larger stay verbatim", () => {
    expect(normalizeSpokenFrench("2 chats")).toBe("deux chats");
    expect(normalizeSpokenFrench("J'ai 21 ans")).toBe("j ai vingt et un ans");
    expect(normalizeSpokenFrench("80")).toBe("quatre vingts");
    expect(normalizeSpokenFrench("il y a 250 pages")).toBe("il y a 250 pages");
  });
});

describe("whole-variant grading", () => {
  test("engine formatting differences pass against one authored variant", () => {
    const grading = spec(["Je voudrais un café"]);
    for (const heard of [
      "je voudrais un café",
      "Je voudrais un café.",
      "je voudrais un café !",
    ]) {
      expect(gradeSpokenAttempt(finals(heard), grading).correct).toBe(true);
    }
  });

  test("near-misses NEVER pass: dropped article, wrong word, number disagreement", () => {
    const grading = spec(["Je voudrais un café"]);
    for (const heard of [
      "je voudrais café", // dropped article
      "je voudrais un thé", // wrong noun
      "je voudrais deux cafés", // wrong quantity
      "voudrais un café", // dropped subject
      "je voudrais un café s'il vous plaît", // extra content ≠ authored variant
    ]) {
      expect(gradeSpokenAttempt(finals(heard), grading).correct).toBe(false);
    }
  });

  test("homophone spellings pass ONLY when authored (chat vs chats)", () => {
    const strict = spec(["le chat"]);
    expect(gradeSpokenAttempt(finals("les chats"), strict).correct).toBe(false);
    expect(gradeSpokenAttempt(finals("le chats"), strict).correct).toBe(false);
    const authored = spec(["il a deux chats", "il a 2 chats"]);
    expect(gradeSpokenAttempt(finals("il a 2 chats"), authored).correct).toBe(true);
  });

  test("n-best: a lower-ranked FINAL alternative may pass (§12)", () => {
    const grading = spec(["j'ai vingt et un ans"]);
    const result = gradeSpokenAttempt(
      finals("j'ai vin et un an", "j'ai vingt et un ans"),
      grading
    );
    expect(result.correct).toBe(true);
    expect(result.matchedTranscriptIndex).toBe(1);
    expect(result.matchedVariant).toBe("j'ai vingt et un ans");
    // §14 honesty: "I heard" always shows the engine's BEST transcript.
    expect(result.heard).toBe("j'ai vin et un an");
  });

  test("empty and whitespace-only transcripts never match anything", () => {
    const grading = spec(["oui"]);
    expect(gradeSpokenAttempt(finals(""), grading).correct).toBe(false);
    expect(gradeSpokenAttempt(finals("   ", ""), grading).correct).toBe(false);
    // An empty AUTHORED variant can never make empty speech "correct".
    expect(gradeSpokenAttempt(finals(""), spec([""])).correct).toBe(false);
  });
});

describe("requiredConcepts slot grading (information-giving tasks)", () => {
  const grading = spec(
    ["il y a deux chats"],
    [["il y a"], ["deux", "2"], ["chats", "chat"]]
  );

  test("all slots inside ONE transcript pass, any order of extra words", () => {
    expect(gradeSpokenAttempt(finals("alors il y a deux chats ici"), grading).correct).toBe(
      true
    );
    const byConcepts = gradeSpokenAttempt(finals("il y a deux chats noirs"), grading);
    expect(byConcepts.matchedByConcepts).toBe(true);
    expect(byConcepts.matchedVariant).toBeNull();
  });

  test("a missing slot fails — even with every other slot present", () => {
    expect(gradeSpokenAttempt(finals("il y a des chats"), grading).correct).toBe(false);
    expect(gradeSpokenAttempt(finals("deux chats"), grading).correct).toBe(false);
  });

  test("slots must be satisfied by a SINGLE transcript, not assembled across n-best", () => {
    const result = gradeSpokenAttempt(finals("il y a deux", "des chats"), grading);
    expect(result.correct).toBe(false);
  });

  test("multi-word slot forms require the contiguous run", () => {
    expect(gradeSpokenAttempt(finals("il a deux chats"), grading).correct).toBe(false);
    expect(gradeSpokenAttempt(finals("il y a bien deux chats"), grading).correct).toBe(true);
  });

  test("whole-variant match still works alongside concepts and reports the variant", () => {
    const result = gradeSpokenAttempt(finals("Il y a deux chats."), grading);
    expect(result.correct).toBe(true);
    expect(result.matchedByConcepts).toBe(false);
    expect(result.matchedVariant).toBe("il y a deux chats");
  });
});

describe("session grading dispatch (checkAnswer over SpokenAnswer)", () => {
  const exercise: import("../types").SpeakProductionExercise = {
    type: "speakProduction",
    id: "x",
    speechItemId: "fr.speak.x",
    instruction: "Say that you would like a coffee.",
    target: "Je voudrais un café",
    acceptedVariants: ["Je voudrais un café"],
    evidenceLexemeRefs: ["fr:w:cafe"],
    revealTargetAfterAttempts: null,
    allowContextualBias: false,
    modelClipId: null,
    allowedAttempts: 2,
  };
  const spokenAnswer = (finalTranscript: string) => ({
    spoken: true as const,
    finalTranscript,
    alternatives: [],
    assisted: false,
  });

  test("a spoken answer grades through the deterministic grader", async () => {
    const { answerIsReady, checkAnswer, correctAnswerText } = await import("../grading");
    expect(checkAnswer(exercise, spokenAnswer("je voudrais un café !"))).toBe(true);
    expect(checkAnswer(exercise, spokenAnswer("je voudrais un thé"))).toBe(false);
    expect(correctAnswerText(exercise)).toBe("Je voudrais un café");
    expect(answerIsReady(exercise, spokenAnswer("bonjour"))).toBe(true);
  });

  test("non-spoken answer shapes are never ready and never pass", async () => {
    const { answerIsReady, checkAnswer } = await import("../grading");
    for (const bad of [null, 0, "je voudrais un café", [1, 2]] as const) {
      expect(answerIsReady(exercise, bad as never)).toBe(false);
      expect(checkAnswer(exercise, bad as never)).toBe(false);
    }
  });
});

describe("determinism and honesty", () => {
  test("grading is a pure function of transcripts and spec", () => {
    const grading = spec(["bonjour"], [["bonjour"]]);
    const a = gradeSpokenAttempt(finals("Bonjour !"), grading);
    const b = gradeSpokenAttempt(finals("Bonjour !"), grading);
    expect(a).toEqual(b);
  });

  test("the result never invents content: heard is the verbatim best transcript", () => {
    const result = gradeSpokenAttempt(finals("au revoir"), spec(["bonjour"]));
    expect(result.correct).toBe(false);
    expect(result.heard).toBe("au revoir");
  });
});
