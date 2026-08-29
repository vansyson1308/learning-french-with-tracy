/**
 * Writing rubric engine battery (P9 §16-§19, §67, §77): the deterministic
 * tri-state grader for guided written production. Every case here is one
 * of the mandated attacks or requirements — none may be weakened.
 */
import { describe, expect, test } from "bun:test";

import {
  evaluateGuidedWriting,
  evaluateSimpleForm,
  normalizeWrittenFrench,
  type WritingRubric,
} from "../writing/rubric";

/** Small stand-in for the compiled known-French vocabulary. */
const KNOWN = new Set(
  (
    "je tu il elle suis es est ai as a m appelle habite j et un une le la " +
    "les de d a au ans dans c ce bonjour merci oui non moi vingt deux trois " +
    "douze paris nice travaille aime chat chats"
  ).split(" ")
);

const rubric: WritingRubric = {
  requiredSlots: [
    {
      id: "name",
      description: "your name",
      variants: ["je m'appelle Marie", "je suis Marie"],
      cueProvided: true,
    },
    {
      id: "age",
      description: "your age",
      variants: ["j'ai vingt et un ans"],
      cueProvided: true,
    },
    {
      id: "city",
      description: "where you live",
      variants: ["j'habite à Paris", "j'habite Paris"],
      cueProvided: true,
    },
  ],
  minTokens: 6,
  maxTokens: 30,
  requireSentenceVerbs: ["m'appelle", "suis", "ai", "habite"],
};

const PROMPT =
  "Introduce yourself in French. Name: Marie. Age: 21. City: Paris.";

function grade(text: string) {
  return evaluateGuidedWriting({ text, rubric, promptText: PROMPT, knownFrench: KNOWN });
}

describe("guided writing: acceptance (§77)", () => {
  test("a valid guided response meets the rubric", () => {
    const r = grade("Je m'appelle Marie, j'ai 21 ans et j'habite à Paris.");
    expect(r.verdict).toBe("meets_rubric");
    expect(r.missingSlots).toEqual([]);
    expect(r.feedback).toEqual([]);
  });

  test("multiple valid variants pass (je suis / digits / no accents / different order)", () => {
    expect(grade("J'habite Paris. Je suis Marie. J'ai vingt et un ans.").verdict).toBe(
      "meets_rubric"
    );
    expect(grade("je suis marie j ai 21 ans j habite a paris").verdict).toBe(
      "meets_rubric"
    );
  });

  test("punctuation, apostrophe forms and NBSP never change the outcome", () => {
    expect(
      grade("Je m’appelle  Marie ! J’ai 21 ans… j’habite à Paris.").verdict
    ).toBe("meets_rubric");
  });

  test("accent variation is typing, not communication: 'a Paris' == 'à Paris'", () => {
    expect(normalizeWrittenFrench("à École")).toBe("a ecole");
    expect(grade("Je m'appelle Marie, j'ai vingt et un ans, j'habite a Paris.").verdict).toBe(
      "meets_rubric"
    );
  });

  test("number forms: digits and words grade identically", () => {
    expect(normalizeWrittenFrench("21")).toBe("vingt et un");
    expect(grade("Je m'appelle Marie. J'ai vingt et un ans. J'habite à Paris.").verdict).toBe(
      "meets_rubric"
    );
  });
});

describe("guided writing: rejection with named reasons (§67/§77)", () => {
  test("a missing fact is named in feedback", () => {
    const r = grade("Je m'appelle Marie et j'habite à Paris.");
    expect(r.verdict).toBe("does_not_meet_rubric");
    expect(r.missingSlots.map((m) => m.id)).toEqual(["age"]);
    expect(r.feedback.join(" ")).toContain("your age");
    expect(r.feedback.join(" ")).toContain("your name"); // the "included X but not Y" shape
  });

  test("a wrong fact (wrong number) is a missing slot, not a lucky pass", () => {
    const r = grade("Je m'appelle Marie, j'ai douze ans, j'habite à Paris.");
    expect(r.verdict).toBe("does_not_meet_rubric");
    expect(r.missingSlots.map((m) => m.id)).toEqual(["age"]);
  });

  test("wrong person never passes a first-person task", () => {
    const r = grade("Il s'appelle Marie, il a vingt et un ans, il habite à Paris.");
    expect(r.verdict).toBe("does_not_meet_rubric");
    expect(r.missingSlots.length).toBe(3);
  });

  test("prompt-copy attack: echoing the given facts is not writing", () => {
    const r = grade("Marie 21 Paris");
    expect(r.verdict).toBe("does_not_meet_rubric");
    expect(r.feedback[0]).toContain("don't copy the prompt");
  });

  test("too-short responses get the honest length feedback", () => {
    const r = grade("Je suis Marie");
    expect(r.verdict).toBe("does_not_meet_rubric");
    expect(r.feedback.join(" ")).toContain("at least 6 words");
  });

  test("keyword-stuffed over-length paste does not pass", () => {
    const padding = Array(30).fill("paris").join(" ");
    const r = grade(`Je m'appelle Marie j'ai 21 ans j'habite à Paris ${padding}`);
    expect(r.verdict).toBe("does_not_meet_rubric");
    expect(r.feedback.join(" ")).toContain("short and simple");
  });

  test("verb morphology: a task demanding a clause rejects a verbless list", () => {
    const verbless: WritingRubric = {
      ...rubric,
      requiredSlots: [rubric.requiredSlots[2]],
      minTokens: 2,
      requireSentenceVerbs: ["habite"],
    };
    const r = evaluateGuidedWriting({
      text: "moi à Paris",
      rubric: verbless,
      promptText: PROMPT,
      knownFrench: KNOWN,
    });
    expect(r.verdict).toBe("does_not_meet_rubric");
    expect(r.feedback.join(" ")).toContain("complete sentence");
    expect(r.feedback.join(" ")).toContain("habite");
  });

  test("an irrelevant French response fails on slots, in French-learner terms", () => {
    const r = grade("J'aime le chat et je travaille à Nice avec deux chats.");
    expect(r.verdict).toBe("does_not_meet_rubric");
    expect(r.missingSlots.length).toBe(3);
    expect(r.feedback.join(" ")).toContain("Don't forget");
  });
});

describe("guided writing: the insufficiently_scorable floor (§17/§67/§77)", () => {
  test("an empty response is unscorable, never wrong", () => {
    const r = grade("   ");
    expect(r.verdict).toBe("insufficiently_scorable");
  });

  test("an English sentence containing the French keywords NEVER passes", () => {
    const r = grade("My name is Marie and I live happily in Paris with friends");
    expect(r.verdict).toBe("insufficiently_scorable");
    expect(r.feedback[0]).toContain("French");
  });

  test("French/English mixture below the floor is unscorable, above it grades normally", () => {
    expect(grade("Well basically my answer is je suis Marie you know").verdict).toBe(
      "insufficiently_scorable"
    );
    expect(
      grade("Je m'appelle Marie, j'ai 21 ans, j'habite à Paris, ok").verdict
    ).toBe("meets_rubric");
  });

  test("tri-state determinism: identical input → identical full evaluation", () => {
    const a = grade("Je m'appelle Marie et j'habite à Paris.");
    const b = grade("Je m'appelle Marie et j'habite à Paris.");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe("simple form evaluation (§77)", () => {
  const fields = [
    { id: "prenom", label: "First name", slotId: "name" },
    { id: "age", label: "Age", slotId: "age" },
    { id: "ville", label: "City", slotId: "city" },
  ];
  const formRubric: WritingRubric = {
    requiredSlots: [
      { id: "name", description: "your name", variants: ["Marie"], cueProvided: true },
      { id: "age", description: "your age", variants: ["vingt et un"], cueProvided: true },
      { id: "city", description: "your city", variants: ["Paris"], cueProvided: true },
    ],
    minTokens: 2,
    maxTokens: 20,
  };

  test("a correctly filled form meets the rubric (digits accepted)", () => {
    const r = evaluateSimpleForm({
      values: { prenom: "Marie", age: "21", ville: "paris" },
      fields,
      rubric: formRubric,
    });
    expect(r.verdict).toBe("meets_rubric");
  });

  test("an empty form is unscorable; a partial form names the missing fields", () => {
    expect(
      evaluateSimpleForm({ values: {}, fields, rubric: formRubric }).verdict
    ).toBe("insufficiently_scorable");
    const r = evaluateSimpleForm({
      values: { prenom: "Marie", age: "", ville: "" },
      fields,
      rubric: formRubric,
    });
    expect(r.verdict).toBe("does_not_meet_rubric");
    expect(r.feedback.join(" ")).toContain("Age");
    expect(r.feedback.join(" ")).toContain("City");
  });

  test("a wrong field is named, not silently failed", () => {
    const r = evaluateSimpleForm({
      values: { prenom: "Marie", age: "douze", ville: "Paris" },
      fields,
      rubric: formRubric,
    });
    expect(r.verdict).toBe("does_not_meet_rubric");
    expect(r.feedback).toEqual(['Check the “Age” field.']);
  });
});
