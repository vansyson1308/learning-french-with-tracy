/**
 * Pedagogy pipeline tests (Phase 5B): the committed concepts validate, and
 * mutation fixtures prove every concept rule and lesson-flow integrity
 * rule actually fires.
 */
import { describe, expect, test } from "bun:test";

import {
  PackSchema,
  type Conjugations,
  type PackSource,
  type PedagogyConcepts,
} from "../../content/schema";
import {
  compileConceptsArtifact,
  loadConjugations,
  loadPedagogyConcepts,
  validateConjugationClozes,
  validateConjugationsData,
  validateLessonFlows,
  validatePedagogy,
  validatePedagogyData,
} from "../lib/pedagogy";
import { readJson } from "../lib/pipeline";

type MorphologyFile = {
  verbs: { lemma: string; rows: { mot: string; infoVer: string }[] }[];
};

function realMorphology(): MorphologyFile {
  return readJson("content/fr/lexicon/derived/verb-morphology.json") as MorphologyFile;
}

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

describe("validateConjugationsData — the evidence chain bites", () => {
  test("all 8 committed tables are evidenced by the real morphology rows", () => {
    const result = validateConjugationsData({
      conjugations: loadConjugations(),
      morphologyVerbs: realMorphology().verbs,
    });
    expect(result.errors).toEqual([]);
  });

  test("corrupting a REAL cell (êtes → étes) is caught against the real evidence", () => {
    const conjugations = loadConjugations();
    const etre = conjugations.verbs.find((v) => v.lemma === "être");
    if (!etre) throw new Error("être table missing");
    etre.cells["pre:2p"] = "étes";
    const result = validateConjugationsData({
      conjugations,
      morphologyVerbs: realMorphology().verbs,
    });
    expect(result.errors.join("\n")).toContain('être: cell pre:2p = "étes" is not evidenced');
  });

  test("a form that exists but under the wrong analysis is rejected (sont as participle)", () => {
    const conjugations = loadConjugations();
    const etre = conjugations.verbs.find((v) => v.lemma === "être");
    if (!etre) throw new Error("être table missing");
    // "sont" is a real être row (ind:pre:3p) — but it is NOT participle
    // evidence, so mood/tense atoms must gate, not mere form existence.
    etre.cells.participle = "sont";
    const result = validateConjugationsData({
      conjugations,
      morphologyVerbs: realMorphology().verbs,
    });
    expect(result.errors.join("\n")).toContain('être: cell participle = "sont" is not evidenced');
  });

  function fixtureVerb(): Conjugations {
    return {
      version: 1,
      language: "fr",
      verbs: [
        {
          lemma: "parler",
          english: "to speak",
          group: "er-regular",
          auxiliary: "avoir",
          cells: {
            inf: "parler",
            "pre:1s": "parle",
            "pre:2s": "parles",
            "pre:3s": "parle",
            "pre:1p": "parlons",
            "pre:2p": "parlez",
            "pre:3p": "parlent",
            participle: "parlé",
          },
        },
      ],
    };
  }

  // Real derived-atom shape: mood:tense:person with NO number suffix —
  // number is the separate noisy field and never gates (§26 contract).
  const FIXTURE_MORPH = [
    {
      lemma: "parler",
      rows: [
        { mot: "parler", infoVer: "inf" },
        { mot: "parle", infoVer: "ind:pre:1,ind:pre:3,sub:pre:1,sub:pre:3" },
        { mot: "parles", infoVer: "ind:pre:2,sub:pre:2" },
        { mot: "parlons", infoVer: "ind:pre:1,imp:pre:1" },
        { mot: "parlez", infoVer: "ind:pre:2,imp:pre:2" },
        { mot: "parlent", infoVer: "ind:pre:3,sub:pre:3" },
        { mot: "parlé", infoVer: "par:pas" },
      ],
    },
  ];

  test("fixture baseline passes", () => {
    expect(
      validateConjugationsData({ conjugations: fixtureVerb(), morphologyVerbs: FIXTURE_MORPH }).errors
    ).toEqual([]);
  });

  test("a verb with no morphology evidence rows fails closed", () => {
    expect(
      validateConjugationsData({ conjugations: fixtureVerb(), morphologyVerbs: [] }).errors.join("\n")
    ).toContain("no verb-morphology evidence rows");
  });

  test("an incomplete table fails", () => {
    const conjugations = fixtureVerb();
    // The schema itself enforces completeness (exhaustive enum record); the
    // validator's own check covers direct-constructed input like this.
    delete (conjugations.verbs[0].cells as Partial<(typeof conjugations.verbs)[0]["cells"]>)["pre:1p"];
    expect(
      validateConjugationsData({ conjugations, morphologyVerbs: FIXTURE_MORPH }).errors.join("\n")
    ).toContain("cell pre:1p is missing");
  });

  test("duplicate verb tables fail", () => {
    const conjugations = fixtureVerb();
    conjugations.verbs.push(structuredClone(conjugations.verbs[0]));
    expect(
      validateConjugationsData({ conjugations, morphologyVerbs: FIXTURE_MORPH }).errors.join("\n")
    ).toContain("duplicate verb parler");
  });

  test("every er-regular paradigm rule fires (2s, 3s, 3p, 2p)", () => {
    // Paradigm-only mutations need matching evidence rows so ONLY the
    // paradigm rule fires — extend the fixture evidence with decoy rows.
    const morph = [
      {
        lemma: "parler",
        rows: [
          ...FIXTURE_MORPH[0].rows,
          { mot: "parlex", infoVer: "ind:pre:2,ind:pre:3" },
        ],
      },
    ];
    for (const [cell, expected] of [
      ["pre:2s", "er-regular 2s must be 1s + s"],
      ["pre:3s", "er-regular 3s must equal 1s"],
      ["pre:3p", "er-regular 3p must be 1s + nt"],
      ["pre:2p", "er-regular 2p must be stem + ez"],
    ] as const) {
      const conjugations = fixtureVerb();
      conjugations.verbs[0].cells[cell] = "parlex";
      expect(
        validateConjugationsData({ conjugations, morphologyVerbs: morph }).errors.join("\n")
      ).toContain(expected);
    }
  });
});

function clozePack(overrides: Partial<Record<string, unknown>> = {}): PackSource {
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
            words: [{ target: "parler", native: "to speak", emoji: "🗣️" }],
            lessons: [
              {
                id: "l1",
                title: "L",
                exercises: [
                  {
                    type: "conjugationCloze",
                    id: "c1",
                    sentence: "Je ___ français.",
                    translation: "I speak French.",
                    verb: "parler",
                    cell: "pre:1s",
                    answer: "parle",
                    alternatives: [],
                    ...overrides,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
}

describe("validateConjugationClozes — every rule fires", () => {
  const CONJUGATIONS: Conjugations = {
    version: 1,
    language: "fr",
    verbs: [
      {
        lemma: "parler",
        english: "to speak",
        group: "er-regular",
        auxiliary: "avoir",
        cells: {
          inf: "parler",
          "pre:1s": "parle",
          "pre:2s": "parles",
          "pre:3s": "parle",
          "pre:1p": "parlons",
          "pre:2p": "parlez",
          "pre:3p": "parlent",
          participle: "parlé",
        },
      },
    ],
  };

  function clozeErrors(courseId: string, overrides: Partial<Record<string, unknown>> = {}) {
    return validateConjugationClozes({
      packs: [{ courseId, pack: clozePack(overrides) }],
      conjugations: CONJUGATIONS,
    }).errors;
  }

  test("a correct cloze passes", () => {
    expect(clozeErrors("fr-en")).toEqual([]);
  });

  test("answer ≠ authored cell fails (no drill can teach an unsupported form)", () => {
    expect(clozeErrors("fr-en", { answer: "parles" }).join("\n")).toContain(
      '"parles" ≠ authored cell pre:1s = "parle"'
    );
  });

  test("a verb without an authored table fails", () => {
    expect(clozeErrors("fr-en", { verb: "chanter", answer: "chante" }).join("\n")).toContain(
      "verb chanter has no authored conjugation table"
    );
  });

  test("a sentence without a blank fails", () => {
    expect(clozeErrors("fr-en", { sentence: "Je parle français." }).join("\n")).toContain(
      "no ___ blank"
    );
  });

  test("the answer duplicated in alternatives fails", () => {
    expect(clozeErrors("fr-en", { alternatives: ["parle"] }).join("\n")).toContain(
      "answer duplicated in alternatives"
    );
  });

  test("conjugationCloze outside the French course fails", () => {
    expect(clozeErrors("es-en").join("\n")).toContain("French pedagogy");
  });
});
