/**
 * Speech construct-validity validators (P8 §19, test program §28.C): a
 * construct-invalid spoken-production item must be REJECTED at authoring
 * time — scored repetition, French exposed in a production cue, an
 * ungradeable target, contextual bias on scored items, broken references.
 */
import { describe, expect, test } from "bun:test";

import { SpeechItemsSchema, type SpeechItem, type SpeechItems } from "../../content/schema";
import { FR_LEXEME_IDS } from "../../src/lib/learning/ids-fr";
import { loadCourseObjectives } from "../lib/assessment";
import { loadListening } from "../lib/reception";
import { loadSpeechItems, validateSpeech } from "../lib/speech";

const objectives = loadCourseObjectives();
const listening = loadListening();
const lexemeIds = new Set(Object.values(FR_LEXEME_IDS));
const OBJECTIVE = objectives.objectives[0].id;
const CLIP = listening!.clips[0].id;

function item(over: Partial<SpeechItem> = {}): SpeechItem {
  return {
    id: "fr.speak.test_cafe",
    taskFamily: "formulaic_exchange",
    elicitationType: "semantic_prompt",
    prompt: { instruction: "Say that you would like a coffee." },
    target: "Je voudrais un café",
    acceptedVariants: ["Je voudrais un café"],
    objectiveRefs: [OBJECTIVE],
    lexemeRefs: ["fr:w:cafe"],
    evidenceLexemeRefs: ["fr:w:cafe"],
    assistancePolicy: { allowContextualBias: false, revealTargetAfterAttempts: null },
    scoredEligibility: true,
    modelAudioRef: null,
    recognitionLocale: "fr-FR",
    allowedAttempts: 2,
    reserved: false,
    sourceRef: "original-project",
    ...over,
  };
}

function doc(...items: SpeechItem[]): SpeechItems {
  // Parse through the real schema so fixtures can never drift from it.
  return SpeechItemsSchema.parse({ version: 1, language: "fr", items });
}

function errorsOf(...items: SpeechItem[]): string[] {
  return validateSpeech({ speech: doc(...items), objectives, listening, lexemeIds }).errors;
}

describe("well-formed items pass", () => {
  test("a scored semantic-prompt production item is clean", () => {
    expect(errorsOf(item())).toEqual([]);
  });

  test("a practice repetition item with model audio is clean", () => {
    expect(
      errorsOf(
        item({
          elicitationType: "repetition",
          scoredEligibility: false,
          evidenceLexemeRefs: [],
          modelAudioRef: CLIP,
          assistancePolicy: { allowContextualBias: true, revealTargetAfterAttempts: null },
        })
      )
    ).toEqual([]);
  });

  test("a missing source (no speech content yet) validates clean", () => {
    expect(
      validateSpeech({ speech: null, objectives, listening, lexemeIds }).errors
    ).toEqual([]);
  });

  test("an information item may show the DIGIT its French answer encodes", () => {
    expect(
      errorsOf(
        item({
          elicitationType: "information_prompt",
          taskFamily: "information_giving",
          prompt: {
            instruction: "Say how many cats there are.",
            cueEmoji: "🐈",
            cueFacts: [{ label: "Cats", value: "2" }],
          },
          target: "Il y a deux chats",
          // "Il y a 2 chats" would be REDUNDANT: grading normalization
          // already converts digit transcripts (a duplicate is rejected).
          acceptedVariants: ["Il y a deux chats"],
          requiredConcepts: [["il y a"], ["deux", "2"], ["chats", "chat"]],
          lexemeRefs: ["fr:w:cafe"],
          evidenceLexemeRefs: [],
        })
      )
    ).toEqual([]);
  });
});

describe("construct contradictions are rejected (§11/§13)", () => {
  test("scored repetition can never exist", () => {
    const errors = errorsOf(
      item({ elicitationType: "repetition", modelAudioRef: CLIP, evidenceLexemeRefs: [] })
    );
    expect(errors.some((e) => e.includes("PRACTICE construct"))).toBe(true);
  });

  test("read-aloud claiming speak-card evidence is rejected", () => {
    const errors = errorsOf(
      item({ elicitationType: "read_aloud", scoredEligibility: false })
    );
    expect(errors.some((e) => e.includes("never produce speak-card evidence"))).toBe(true);
  });

  test("repetition without model audio has nothing to repeat", () => {
    const errors = errorsOf(
      item({
        elicitationType: "repetition",
        scoredEligibility: false,
        evidenceLexemeRefs: [],
        modelAudioRef: null,
      })
    );
    expect(errors.some((e) => e.includes("nothing to repeat"))).toBe(true);
  });

  test("a production prompt exposing the French answer is rejected", () => {
    const errors = errorsOf(
      item({ prompt: { instruction: 'Say "Je voudrais un café" politely.' } })
    );
    expect(errors.some((e) => e.includes("exposes the French answer"))).toBe(true);
  });

  test("French leaked through cueFacts is caught too", () => {
    const errors = errorsOf(
      item({
        elicitationType: "information_prompt",
        prompt: {
          instruction: "Give your order.",
          cueFacts: [{ label: "Order", value: "un café" }],
        },
        acceptedVariants: ["Je voudrais un café"],
      })
    );
    expect(errors.some((e) => e.includes("exposes the French answer"))).toBe(true);
  });

  test("word-boundary honesty: English containing French letters is NOT a leak", () => {
    // "un" inside "understand" or "café" inside "cafeteria" must not match:
    // containment is token-run based, never substring based.
    expect(
      errorsOf(
        item({
          prompt: { instruction: "Make yourself understood at the cafeteria counter." },
          acceptedVariants: ["Je voudrais un café"],
          target: "Je voudrais un café",
        })
      )
    ).toEqual([]);
  });

  test("contextual bias on a scored-eligible item is rejected", () => {
    const errors = errorsOf(
      item({
        assistancePolicy: { allowContextualBias: true, revealTargetAfterAttempts: null },
      })
    );
    expect(errors.some((e) => e.includes("contextual bias"))).toBe(true);
  });
});

describe("gradability is enforced", () => {
  test("the canonical target must be accepted by its own variants", () => {
    const errors = errorsOf(item({ target: "Je veux un café" }));
    expect(errors.some((e) => e.includes("not accepted by its own variants"))).toBe(true);
  });

  test("variants that collapse to duplicates after normalization are authoring noise", () => {
    const errors = errorsOf(
      item({ acceptedVariants: ["Je voudrais un café", "je voudrais un café !"] })
    );
    expect(errors.some((e) => e.includes("duplicates after normalization"))).toBe(true);
  });

  test("a variant or concept form normalizing to nothing is rejected", () => {
    const errors = errorsOf(
      item({
        acceptedVariants: ["Je voudrais un café", "?!"],
        requiredConcepts: [["..."]],
      })
    );
    expect(errors.some((e) => e.includes("acceptedVariants[1] normalizes to nothing"))).toBe(
      true
    );
    expect(errors.some((e) => e.includes("requiredConcepts[0]"))).toBe(true);
  });
});

describe("reference integrity", () => {
  test("unknown objective, unknown lexeme, evidence outside lexemeRefs, unknown clip", () => {
    const errors = errorsOf(
      item({
        objectiveRefs: ["fr.obj.ghost.none"],
        lexemeRefs: ["fr:w:pas-un-mot"],
        evidenceLexemeRefs: ["fr:w:cafe"],
        modelAudioRef: "fr.clip.ghost_clip",
      })
    );
    expect(errors.some((e) => e.includes("unknown objective fr.obj.ghost.none"))).toBe(true);
    expect(errors.some((e) => e.includes("unknown lexeme fr:w:pas-un-mot"))).toBe(true);
    expect(errors.some((e) => e.includes("not in lexemeRefs"))).toBe(true);
    expect(errors.some((e) => e.includes("resolves to no listening clip"))).toBe(true);
  });

  test("duplicate item ids are rejected", () => {
    const errors = errorsOf(item(), item({ target: "Bonjour", acceptedVariants: ["Bonjour"], prompt: { instruction: "Greet someone." } }));
    expect(errors.some((e) => e.includes("duplicate item id"))).toBe(true);
  });
});

describe("assessment banks (§20 — reserved items only)", () => {
  const speakBankExercise = (item: SpeechItem) => ({
    type: "speakProduction" as const,
    id: "bank-x",
    speechItemId: item.id,
    instruction: item.prompt.instruction,
    target: item.target,
    acceptedVariants: item.acceptedVariants,
    evidenceLexemeRefs: item.evidenceLexemeRefs,
    revealTargetAfterAttempts: item.assistancePolicy.revealTargetAfterAttempts,
    allowContextualBias: item.assistancePolicy.allowContextualBias,
    modelClipId: item.modelAudioRef,
    allowedAttempts: item.allowedAttempts,
  });

  test("a NON-reserved item in a scored bank is rejected", () => {
    const teaching = item(); // reserved: false
    const errors = validateSpeech({
      speech: doc(teaching),
      objectives,
      listening,
      lexemeIds,
      assessmentSpeech: [speakBankExercise(teaching)],
    }).errors;
    expect(errors.some((e) => e.includes("must use RESERVED items"))).toBe(true);
  });

  test("a reserved item mirrored exactly is clean; a drifted copy is rejected", () => {
    const probe = item({
      id: "fr.speak.test_probe",
      reserved: true,
      modelAudioRef: null,
      assistancePolicy: { allowContextualBias: false, revealTargetAfterAttempts: null },
    });
    const clean = validateSpeech({
      speech: doc(probe),
      objectives,
      listening,
      lexemeIds,
      assessmentSpeech: [speakBankExercise(probe)],
    }).errors;
    expect(clean).toEqual([]);

    const drifted = { ...speakBankExercise(probe), target: "Je veux un café" };
    const errors = validateSpeech({
      speech: doc(probe),
      objectives,
      listening,
      lexemeIds,
      assessmentSpeech: [drifted],
    }).errors;
    expect(errors.some((e) => e.includes("target differs"))).toBe(true);
  });
});

describe("repository state", () => {
  test("the shipped speech content and scored banks validate clean", async () => {
    const { assessmentBankSpeechExercises } = await import("../lib/speech");
    const speech = loadSpeechItems();
    expect(
      validateSpeech({
        speech,
        objectives,
        listening,
        lexemeIds,
        assessmentSpeech: assessmentBankSpeechExercises(),
      }).errors
    ).toEqual([]);
  });
});
