/**
 * Deterministic speech grader (P8 §12/§14, test program §28.D): engine
 * formatting normalizes away, learner differences never do. No confidence,
 * no edit distance, n-best finals only.
 */
import { describe, expect, test } from "bun:test";

import {
  gradeSpokenAttempt,
  normalizeSpoken,
  type SpeechGradingSpec,
} from "../speech/grader";
import { languageRules } from "../languages";

const finals = (best: string, ...alternatives: string[]) => ({
  finalTranscript: best,
  alternatives,
});

const spec = (variants: string[], concepts?: string[][]): SpeechGradingSpec => ({
  acceptedVariants: variants,
  requiredConcepts: concepts,
});

describe("normalizeSpoken — engine-formatting variance only", () => {
  test("case, punctuation, and French spacing collapse", () => {
    expect(normalizeSpoken("Bonjour !", languageRules("fr"))).toBe("bonjour");
    expect(normalizeSpoken("Ça va ?", languageRules("fr"))).toBe("ça va");
    expect(normalizeSpoken("  Merci,   beaucoup.  ", languageRules("fr"))).toBe("merci beaucoup");
    expect(normalizeSpoken("« Bonjour ! »", languageRules("fr"))).toBe("bonjour");
  });

  test("apostrophe forms and elision spacing compare equal", () => {
    expect(normalizeSpoken("j’ai", languageRules("fr"))).toBe(normalizeSpoken("j'ai", languageRules("fr")));
    expect(normalizeSpoken("j'ai", languageRules("fr"))).toBe(normalizeSpoken("j ai", languageRules("fr")));
    expect(normalizeSpoken("l’eau", languageRules("fr"))).toBe("l eau");
  });

  test("hyphen variants compare equal (est-ce que, rectified numbers)", () => {
    expect(normalizeSpoken("est-ce que", languageRules("fr"))).toBe(normalizeSpoken("est ce que", languageRules("fr")));
    expect(normalizeSpoken("vingt-et-un", languageRules("fr"))).toBe(normalizeSpoken("vingt et un", languageRules("fr")));
  });

  test("ligatures fold (sœur == soeur) but accents are KEPT", () => {
    expect(normalizeSpoken("ma sœur", languageRules("fr"))).toBe("ma soeur");
    expect(normalizeSpoken("café", languageRules("fr"))).toBe("café");
    expect(normalizeSpoken("a", languageRules("fr"))).not.toBe(normalizeSpoken("à", languageRules("fr")));
    expect(normalizeSpoken("ou", languageRules("fr"))).not.toBe(normalizeSpoken("où", languageRules("fr")));
  });

  test("standalone digits 0–100 become French words; larger stay verbatim", () => {
    expect(normalizeSpoken("2 chats", languageRules("fr"))).toBe("deux chats");
    expect(normalizeSpoken("J'ai 21 ans", languageRules("fr"))).toBe("j ai vingt et un ans");
    expect(normalizeSpoken("80", languageRules("fr"))).toBe("quatre vingts");
    expect(normalizeSpoken("il y a 250 pages", languageRules("fr"))).toBe("il y a 250 pages");
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
      expect(gradeSpokenAttempt(finals(heard), grading, languageRules("fr")).correct).toBe(true);
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
      expect(gradeSpokenAttempt(finals(heard), grading, languageRules("fr")).correct).toBe(false);
    }
  });

  test("homophone spellings pass ONLY when authored (chat vs chats)", () => {
    const strict = spec(["le chat"]);
    expect(gradeSpokenAttempt(finals("les chats"), strict, languageRules("fr")).correct).toBe(false);
    expect(gradeSpokenAttempt(finals("le chats"), strict, languageRules("fr")).correct).toBe(false);
    const authored = spec(["il a deux chats", "il a 2 chats"]);
    expect(gradeSpokenAttempt(finals("il a 2 chats"), authored, languageRules("fr")).correct).toBe(true);
  });

  test("n-best: a lower-ranked FINAL alternative may pass (§12)", () => {
    const grading = spec(["j'ai vingt et un ans"]);
    const result = gradeSpokenAttempt(
      finals("j'ai vin et un an", "j'ai vingt et un ans"),
      grading, languageRules("fr")
    );
    expect(result.correct).toBe(true);
    expect(result.matchedTranscriptIndex).toBe(1);
    expect(result.matchedVariant).toBe("j'ai vingt et un ans");
    // §14 honesty: "I heard" always shows the engine's BEST transcript.
    expect(result.heard).toBe("j'ai vin et un an");
  });

  test("empty and whitespace-only transcripts never match anything", () => {
    const grading = spec(["oui"]);
    expect(gradeSpokenAttempt(finals(""), grading, languageRules("fr")).correct).toBe(false);
    expect(gradeSpokenAttempt(finals("   ", ""), grading, languageRules("fr")).correct).toBe(false);
    // An empty AUTHORED variant can never make empty speech "correct".
    expect(gradeSpokenAttempt(finals(""), spec([""]), languageRules("fr")).correct).toBe(false);
  });
});

describe("requiredConcepts slot grading (information-giving tasks)", () => {
  const grading = spec(
    ["il y a deux chats"],
    [["il y a"], ["deux", "2"], ["chats", "chat"]]
  );

  test("all slots inside ONE transcript pass, any order of extra words", () => {
    expect(gradeSpokenAttempt(finals("alors il y a deux chats ici"), grading, languageRules("fr")).correct).toBe(
      true
    );
    const byConcepts = gradeSpokenAttempt(finals("il y a deux chats noirs"), grading, languageRules("fr"));
    expect(byConcepts.matchedByConcepts).toBe(true);
    expect(byConcepts.matchedVariant).toBeNull();
  });

  test("a missing slot fails — even with every other slot present", () => {
    expect(gradeSpokenAttempt(finals("il y a des chats"), grading, languageRules("fr")).correct).toBe(false);
    expect(gradeSpokenAttempt(finals("deux chats"), grading, languageRules("fr")).correct).toBe(false);
  });

  test("slots must be satisfied by a SINGLE transcript, not assembled across n-best", () => {
    const result = gradeSpokenAttempt(finals("il y a deux", "des chats"), grading, languageRules("fr"));
    expect(result.correct).toBe(false);
  });

  test("multi-word slot forms require the contiguous run", () => {
    expect(gradeSpokenAttempt(finals("il a deux chats"), grading, languageRules("fr")).correct).toBe(false);
    expect(gradeSpokenAttempt(finals("il y a bien deux chats"), grading, languageRules("fr")).correct).toBe(true);
  });

  test("whole-variant match still works alongside concepts and reports the variant", () => {
    const result = gradeSpokenAttempt(finals("Il y a deux chats."), grading, languageRules("fr"));
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
    expect(checkAnswer(exercise, spokenAnswer("je voudrais un café !"), "fr-en")).toBe(true);
    expect(checkAnswer(exercise, spokenAnswer("je voudrais un thé"), "fr-en")).toBe(false);
    expect(correctAnswerText(exercise)).toBe("Je voudrais un café");
    expect(answerIsReady(exercise, spokenAnswer("bonjour"))).toBe(true);
  });

  test("non-spoken answer shapes are never ready and never pass", async () => {
    const { answerIsReady, checkAnswer } = await import("../grading");
    for (const bad of [null, 0, "je voudrais un café", [1, 2]] as const) {
      expect(answerIsReady(exercise, bad as never)).toBe(false);
      expect(checkAnswer(exercise, bad as never, "fr-en")).toBe(false);
    }
  });
});

describe("determinism and honesty", () => {
  test("grading is a pure function of transcripts and spec", () => {
    const grading = spec(["bonjour"], [["bonjour"]]);
    const a = gradeSpokenAttempt(finals("Bonjour !"), grading, languageRules("fr"));
    const b = gradeSpokenAttempt(finals("Bonjour !"), grading, languageRules("fr"));
    expect(a).toEqual(b);
  });

  test("the result never invents content: heard is the verbatim best transcript", () => {
    const result = gradeSpokenAttempt(finals("au revoir"), spec(["bonjour"]), languageRules("fr"));
    expect(result.correct).toBe(false);
    expect(result.heard).toBe("au revoir");
  });
});
