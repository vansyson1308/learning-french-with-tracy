/**
 * Pedagogy pipeline tests (Phase 5B): the committed concepts validate, and
 * mutation fixtures prove every concept rule and lesson-flow integrity
 * rule actually fires.
 */
import { describe, expect, test } from "bun:test";

import { PackSchema, type PackSource, type PedagogyConcepts } from "../../content/schema";
import {
  compileConceptsArtifact,
  loadPedagogyConcepts,
  validateLessonFlows,
  validatePedagogy,
  validatePedagogyData,
} from "../lib/pedagogy";

describe("committed pedagogy data", () => {
  test("validatePedagogy passes on the real content", () => {
    expect(validatePedagogy().errors).toEqual([]);
  });

  test("the compiled artifact keys every concept and keeps authored order", () => {
    const concepts = loadPedagogyConcepts();
    const artifact = JSON.parse(compileConceptsArtifact(concepts)) as {
      order: string[];
      byId: Record<string, { id: string }>;
    };
    expect(artifact.order).toEqual(concepts.concepts.map((c) => c.id));
    for (const id of artifact.order) expect(artifact.byId[id]?.id).toBe(id);
  });
});

function fixtureConcepts(): PedagogyConcepts {
  return {
    version: 1,
    language: "fr",
    concepts: [
      {
        id: "fr:concept:test-rule",
        title: "A teachable rule",
        shortRule: "Short rule.",
        explanation: "Longer explanation.",
        examples: [{ fr: "le chat", en: "the cat" }],
        exceptions: [],
        sourceRefs: [{ source: "original-french-pedagogy" }],
      },
    ],
  };
}

const REGISTRY = new Set(["original-french-pedagogy", "lexique-4"]);

describe("validatePedagogyData — every rule fires", () => {
  test("fixture baseline is valid", () => {
    expect(validatePedagogyData({ concepts: fixtureConcepts(), registryIds: REGISTRY }).errors).toEqual([]);
  });

  test("duplicate ids fail", () => {
    const concepts = fixtureConcepts();
    concepts.concepts.push({ ...concepts.concepts[0] });
    expect(
      validatePedagogyData({ concepts, registryIds: REGISTRY }).errors.join("\n")
    ).toContain("duplicate concept id");
  });

  test("unregistered sources fail", () => {
    const concepts = fixtureConcepts();
    concepts.concepts[0].sourceRefs = [{ source: "wikipedia" }];
    expect(
      validatePedagogyData({ concepts, registryIds: REGISTRY }).errors.join("\n")
    ).toContain('source "wikipedia" is not registered');
  });

  test("CEFR labels in learner-facing titles fail (program rule)", () => {
    const concepts = fixtureConcepts();
    concepts.concepts[0].title = "Gender basics (A1)";
    expect(
      validatePedagogyData({ concepts, registryIds: REGISTRY }).errors.join("\n")
    ).toContain("CEFR");
  });
});

function fixturePack(flow?: unknown): PackSource {
  return PackSchema.parse({
    id: "fr-en",
    version: 1,
    targetLanguage: "French",
    targetCode: "fr",
    nativeLanguage: "English",
    nativeCode: "en",
    flag: "x",
    sections: [
      {
        id: "s1",
        title: "S",
        units: [
          {
            id: "u1",
            title: "U",
            description: "d",
            guidebook: "g",
            words: [{ target: "chat", native: "cat", emoji: "🐱" }],
            lessons: [
              {
                id: "l1",
                title: "L",
                exercises: [
                  {
                    type: "select",
                    id: "e1",
                    mode: "targetToNative",
                    prompt: "chat",
                    audioTarget: "chat",
                    options: [{ text: "cat" }, { text: "dog" }, { text: "hat" }, { text: "bat" }],
                    correct: 0,
                  },
                ],
                ...(flow !== undefined ? { flow } : {}),
              },
            ],
          },
        ],
      },
    ],
  });
}

const CONCEPT_IDS = new Set(["fr:concept:test-rule"]);

function flowErrors(courseId: string, flow?: unknown): string[] {
  return validateLessonFlows({
    packs: [{ courseId, pack: fixturePack(flow) }],
    conceptIds: CONCEPT_IDS,
  }).errors;
}

describe("validateLessonFlows — every rule fires", () => {
  test("a complete interleaved flow passes", () => {
    expect(flowErrors("fr-en", [{ concept: "fr:concept:test-rule" }, { exercise: "e1" }])).toEqual([]);
  });

  test("lessons without a flow are untouched", () => {
    expect(flowErrors("fr-en", undefined)).toEqual([]);
  });

  test("unknown concept references fail", () => {
    expect(
      flowErrors("fr-en", [{ concept: "fr:concept:ghost" }, { exercise: "e1" }]).join("\n")
    ).toContain("unknown concept");
  });

  test("missing and duplicate exercise references fail", () => {
    expect(flowErrors("fr-en", [{ exercise: "ghost" }, { exercise: "e1" }]).join("\n")).toContain(
      "missing exercise ghost"
    );
    expect(
      flowErrors("fr-en", [{ exercise: "e1" }, { exercise: "e1" }]).join("\n")
    ).toContain("more than once");
  });

  test("a flow that drops a graded exercise fails", () => {
    expect(flowErrors("fr-en", [{ concept: "fr:concept:test-rule" }]).join("\n")).toContain(
      "drops exercise e1"
    );
  });

  test("concept steps outside the French course fail", () => {
    expect(
      flowErrors("es-en", [{ concept: "fr:concept:test-rule" }, { exercise: "e1" }]).join("\n")
    ).toContain("French pedagogy");
  });
});
