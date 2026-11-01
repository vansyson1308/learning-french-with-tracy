/**
 * English course gates and the English build plugin: each rule fires on bad
 * English and stays quiet on good English (a gate that fires on correct English
 * is a bug), and the paradigms and story endings agree with the committed data.
 */
import { describe, expect, test } from "bun:test";

import type { PackSource } from "../../content/schema";
import { buildPlugin } from "../lib/languages";
import { en } from "../lib/languages/en";
import { englishCourseErrors, REQUIRED_CONCEPTS, scenarioRegisterErrors, targetTextErrors } from "../lib/languages/en-gates";
import { englishIng, englishParadigmCells, englishPastRegular, englishRegularPlural, englishThirdPerson } from "../lib/languages/en-morph";
import { readJson } from "../lib/pipeline";
import { buildLexemeIndex, loadVerbForms, resolveToken, type LexemeIndex } from "../lib/stories";

const verb = (lemma: string) => ({ id: `en:w:${lemma}`, surface: lemma, lemma, partOfSpeech: "verb" });
const lexicon = [
  ...["be", "can", "will", "have", "do", "go", "work", "like", "love", "want", "need", "live", "know", "see", "eat", "cost", "put", "read", "rain", "walk", "study", "stay", "rest", "find", "fall"].map(verb),
  ...["apple", "dog", "book", "hour", "teacher", "uniform"].map((lemma) => ({ id: `en:w:${lemma}`, surface: lemma, lemma, partOfSpeech: "noun" })),
  ...["old", "good"].map((lemma) => ({ id: `en:w:${lemma}`, surface: lemma, lemma, partOfSpeech: "adjective" })),
];
const irregular = {
  verbs: {
    "en:w:be": { past: "was, were", participle: "been" },
    "en:w:have": { past: "had", participle: "had" },
    "en:w:do": { past: "did", participle: "done" },
    "en:w:go": { past: "went", participle: "gone" },
    "en:w:know": { past: "knew", participle: "known" },
    "en:w:see": { past: "saw", participle: "seen" },
    "en:w:eat": { past: "ate", participle: "eaten" },
    "en:w:cost": { past: "cost", participle: "cost" },
    "en:w:put": { past: "put", participle: "put" },
    "en:w:read": { past: "read", participle: "read" },
    "en:w:find": { past: "found", participle: "found" },
    "en:w:fall": { past: "fell", participle: "fallen" },
  },
};
const data = { lexicon, irregular };
const ruleOf = (e: string) => e.split(": ")[0];
const errs = (text: string) => targetTextErrors(text, data).map(ruleOf);

const quiet = (rule: string, sentences: string[]) => {
  for (const s of sentences) {
    const hits = targetTextErrors(s, data);
    if (hits.some((h) => ruleOf(h) === rule)) throw new Error(`${rule} fired on correct English: ${s} → ${hits.join("; ")}`);
  }
};
const fires = (rule: string, sentences: string[]) => {
  for (const s of sentences) {
    if (!errs(s).includes(rule)) throw new Error(`${rule} did not fire: ${s}`);
  }
};

describe("a/an", () => {
  test("fires on the wrong article before a vowel or consonant sound", () => {
    fires("a-an", ["I have a apple.", "A apple is red.", "He is a old man.", "Eat an book.", "An dog is here.", "She is an teacher.", "It is an book.", "Wait a hour.", "a hour", "He is a honest man.", "It is an university.", "He is an European.", "She has an one-way ticket.", "It is an uniform.", "This is an useful book.", "a umbrella", "an house", "an year", "an TV", "a ATM", "a X-ray"]);
  });

  test("the sound decides, not the letter", () => {
    quiet("a-an", ["an hour", "An hour is enough.", "a university", "a uniform", "a useful book", "a European city", "an honest man", "an honor", "a one-way ticket", "a unit", "a union", "a euro", "an umbrella", "an uncle", "an unusual book", "an unhappy man", "an uninteresting book", "an unimportant book", "an unknown man", "a house", "a hotel", "a hospital", "a year", "a woman", "a TV", "a USB", "an ATM", "an MBA", "an ID card", "an HR manager", "a UK visa", "a U-turn", "an X-ray", "an only child", "an orange", "an old man"]);
  });

  test("usage that varies is left alone", () => {
    quiet("a-an", ["an hotel", "a hotel", "an historic day", "a historic day", "an herb", "a herb"]);
    quiet("a-an", ["a SIM card", "a PIN", "a NATO country", "an NGO", "a 5 dollar bill", "an 8 hour day", "a Ông", "an Đà Lạt trip"]);
  });

  test("a capital is a label or a name, not an article", () => {
    quiet("a-an", ["My name is An.", "An is a student.", "An goes to school.", "An works here.", "An teaches English.", "I see An today.", "Vitamin A is good.", "Plan A is good.", "Group A and group B.", "Mr. A is here.", "A is the first letter."]);
  });

  test("a word about the articles themselves is quiet", () => {
    quiet("a-an", ["Is it a or an?", "Use a or an.", "Say an before a vowel.", "a and the", "the a in apple", "the letter a is first", "a.m.", "at 8 a.m. every day", "a-ha"]);
  });
});

describe("third-person -s", () => {
  test("fires after he, she, it in the simple present", () => {
    fires("third-person", ["He work here.", "She like coffee.", "he go to school", "It rain a lot.", "She always go home.", "He never eat rice.", "I know he work here.", "He have a car.", "She study English.", "He do his work."]);
  });

  test("quiet on the third-person form and on every other subject", () => {
    quiet("third-person", ["He works here.", "She likes coffee.", "He goes to school.", "It rains a lot.", "She studies English.", "He has a car.", "He does his work.", "I work here.", "You go home.", "We like tea.", "They live here."]);
  });

  test("quiet after an auxiliary, modal or causative", () => {
    quiet("third-person", ["Does he work here?", "Where does she live?", "Did he go?", "What did she eat?", "Why did it rain?", "Does it rain?", "Doesn't she know?", "Can he go?", "Will she work?", "Should he go?", "Let it rain.", "Make it work.", "I saw it fall.", "He can go.", "She will work.", "He would like tea."]);
  });

  test("quiet where the base form is right", () => {
    quiet("third-person", [
      // Past tense identical to the base.
      "He put it here.",
      "She read a book.",
      "It cost ten dollars.",
      // Coordinated subject, plural.
      "He and she work here.",
      "She and he live here.",
      "You and he go home.",
      // Mandative subjunctive.
      "The doctor says that he rest.",
      "I suggest she rest.",
      "We recommend he stay.",
      // Not this verb.
      "IT work is hard.",
      // Semi-modal.
      "He need not go.",
    ]);
  });
});

describe("do and does", () => {
  test("no He don't, no Does he goes", () => {
    fires("do-support", ["He don't know.", "She don't work.", "It don't work.", "He do not know.", "she dont know", "I doesn't know.", "You doesn't know.", "We does not know.", "They doesn't work.", "They does know.", "Does he goes?", "Does she likes tea?", "Do they goes?", "Where does he lives?", "Does he always goes?", "Does you know?", "What does they want?", "Doesn't we know?", "Do he know?", "What do she want?", "Don't he know?", "Why do he go?", "He doesn't goes.", "She doesn't likes tea.", "He does not goes.", "I don't works.", "I do not likes tea."]);
  });

  test("past after did", () => {
    fires("do-support", ["Did he went?", "Did she saw it?", "Where did you went?", "Did you walked?", "Did he studied?", "He didn't went.", "I did not saw it.", "She didn't walked.", "Did he goes?", "He didn't goes."]);
  });

  test("correct English stays quiet", () => {
    quiet("do-support", ["He doesn't know.", "She does not work.", "I don't know.", "You do not know.", "They don't work.", "We do not know.", "Does he go?", "Does she like tea?", "Do they go?", "Where does he live?", "Does he always go?", "Do you know?", "Did he go?", "Did she see it?", "Where did you go?", "He didn't go.", "I did not see it.", "It does you good.", "What I do he does too.", "Do it now.", "Don't do it.", "Do it again.", "Does it work?", "I like it, don't you?", "Don't go.", "So does she.", "He does.", "She did.", "Did he read it?", "Did it cost much?", "Did he put it here?", "Did he found a company?", "Why don't works begin?", "Don't walks help?", "Did he fell a tree?"]);
  });
});

describe("very and object pronouns", () => {
  test("no I very like", () => {
    fires("very-verb", ["I very like coffee.", "We very love Hanoi.", "They very want tea.", "She very likes tea.", "Mai very loves him.", "very likes"]);
    quiet("very-verb", ["I like coffee very much.", "I very much like coffee.", "She is very like her mother.", "He looks very like his father.", "It is very good.", "She is very loved.", "He is very tired."]);
  });

  test("no Me is", () => {
    fires("object-subject", ["Me is a student.", "me am tired", "Him is here.", "Her is a nurse.", "Them are here.", "Us are late.", "Hello. Me is Lan."]);
    quiet("object-subject", ["What scares me is the dark.", "The thing that helps me is music.", "It is me.", "Her name is Lan.", "Her car is red.", "Me too.", "Help him.", "Show them."]);
  });
});

describe("countability", () => {
  test("no a water, no two money, within the closed list", () => {
    fires("countability", ["I want a water.", "A water, please.", "A water is cold.", "She has a money.", "It is an information.", "I have two money.", "Three rice, please.", "Many money is here.", "We have five luggage.", "Give me a bread and tea.", "Can I have informations?", "My luggages are here.", "He has homeworks."]);
  });

  test("quiet on correct uses and compounds", () => {
    quiet("countability", ["I want some water.", "A glass of water.", "a bottle of water", "I have a little money.", "a water bottle", "a rice cooker", "a money order", "a traffic light", "a weather report", "a music teacher", "a news report", "an information desk", "two water bottles", "much money", "Channel two news is on.", "One water, please.", "a good bread shop", "a cold water", "Group A water is clean."]);
  });
});

describe("no false alarm across a natural passage", () => {
  test("correct A1 English is silent", () => {
    const passage = [
      "Good morning! My name is Lan. I'm a nurse at a hospital in Hanoi.",
      "I don't work on Sunday. An hour ago, I ate an apple and a banana.",
      "Does he live near a university? Yes, he does. He doesn't have a car.",
      "What time is it? It's half past eight. The bus costs $2.",
      "She has a uniform, an old bag and some money. Where did you go yesterday?",
      "He went to the market. Did he buy rice? No, he didn't. I would like a coffee, please.",
      "Could you help me? I can't find the bank. There is a bank next to the post office.",
    ];
    for (const line of passage) expect(targetTextErrors(line, data)).toEqual([]);
  });
});

describe("course gates", () => {
  const concepts = [...REQUIRED_CONCEPTS];
  const ex = (id: string, extra: Record<string, unknown>) => ({ type: "typeAnswer", id, mode: "produceTarget", prompt: "x", answer: "Yes.", alternatives: [], ...extra });
  const flow = REQUIRED_CONCEPTS.map((concept) => ({ concept }));
  const pack = (exercises: unknown[], lessonFlow: unknown[] = flow): PackSource => ({ id: "en-vi", sections: [{ id: "s", units: [{ id: "u", words: [], lessons: [{ id: "l", exercises, flow: lessonFlow }] }] }] }) as unknown as PackSource;
  const run = (p: PackSource, conceptIds: string[] | null = concepts) => englishCourseErrors(p, { ...data, conceptIds });
  const rules = (errors: string[]) => errors.map((e) => e.split(": ")[1]);

  test("a clean pack passes", () => {
    expect(run(pack([ex("e1", { answer: "I have an apple." })]))).toEqual([]);
  });

  test("each required concept must exist and appear in a lesson", () => {
    expect(rules(run(pack([]), concepts.filter((c) => c !== "en:concept:articles")))).toEqual(["concept-card"]);
    expect(rules(run(pack([], flow.filter((f) => f.concept !== "en:concept:be"))))).toEqual(["concept-card"]);
    expect(rules(run(pack([], [])))).toEqual(REQUIRED_CONCEPTS.map(() => "concept-card"));
    expect(rules(run(pack([]), null))).toEqual(REQUIRED_CONCEPTS.map(() => "concept-card"));
    expect(run(pack([], [])).join()).toContain("en:concept:past-did");
    expect(REQUIRED_CONCEPTS).toEqual(["en:concept:articles", "en:concept:be", "en:concept:present-do-does", "en:concept:past-did", "en:concept:final-consonants", "en:concept:s-ed-pronunciation"]);
  });

  test("every target-facing string is read", () => {
    const bad = "He don't know.";
    const badExercises = [
      ex("a", { answer: bad }),
      ex("b", { alternatives: [bad] }),
      ex("c", { mode: "listen", answer: bad }),
      ex("d", { mode: "translate", prompt: bad, answer: "Anh ấy không biết." }),
      { type: "select", id: "e", mode: "nativeToTarget", prompt: "x", options: [{ text: bad }, { text: "He knows." }], correct: 0 },
      { type: "select", id: "f", mode: "targetToNative", prompt: bad, options: [{ text: "a" }, { text: "b" }], correct: 0 },
      { type: "wordBank", id: "g", direction: "nativeToTarget", prompt: "x", tokens: [], answer: bad.split(" ") },
      { type: "wordBank", id: "h", direction: "targetToNative", prompt: bad, tokens: [], answer: ["x"] },
      { type: "fillBlank", id: "i", sentence: "He ___ know.", translation: "x", options: ["don't", "doesn't"], correct: 0 },
      { type: "conjugationCloze", id: "j", sentence: "He ___ know.", translation: "x", verb: "do", cell: "pre:3s", answer: "don't", alternatives: [] },
      { type: "dictation", id: "k", clipId: "c", answer: bad, alternatives: [] },
      { type: "speakRepetition", id: "l", target: bad, acceptedVariants: [bad] },
      { type: "match", id: "m", pairs: [{ target: bad, native: "x" }, { target: "yes", native: "có" }] },
    ];
    for (const e of badExercises) expect(rules(run(pack([e]))).length).toBeGreaterThan(0);
    expect(rules(run(pack([{ type: "articleSelect", id: "n", articles: ["a", "an"], noun: "apple", gloss: "x", correct: 0 }])))).toEqual(["a-an"]);
  });

  test("Vietnamese text is never read as English", () => {
    const vi = [
      ex("a", { mode: "translate", prompt: "It is safe.", answer: "Nó an toàn." }),
      { type: "select", id: "b", mode: "targetToNative", prompt: "safe", options: [{ text: "an toàn" }, { text: "a lô" }], correct: 0 },
      { type: "wordBank", id: "c", direction: "targetToNative", prompt: "peace", tokens: [], answer: ["bình", "an", "nhé"] },
      { type: "select", id: "d", mode: "nativeToTarget", prompt: "an toàn", options: [{ text: "safe" }, { text: "sad" }], correct: 0 },
    ];
    expect(run(pack(vi))).toEqual([]);
  });

  test("a wrong distractor may teach the contrast: only the keyed option is read", () => {
    const select = { type: "select", id: "a", mode: "nativeToTarget", prompt: "x", options: [{ text: "He doesn't know." }, { text: "He don't know." }], correct: 0 };
    const fill = { type: "fillBlank", id: "b", sentence: "I have ___ apple.", translation: "x", options: ["a", "an"], correct: 1 };
    expect(run(pack([select, fill]))).toEqual([]);
  });
});

describe("scenario register", () => {
  const node = (text: string) => ({ kind: "partner", text });
  test("slang may not sit beside sir or madam", () => {
    expect(scenarioRegisterErrors([{ id: "s1", nodes: { a: node("Good morning, sir."), b: node("You wanna eat?") } }])).toHaveLength(1);
    expect(scenarioRegisterErrors([{ id: "s1", nodes: { a: { kind: "learner", expected: [{ acceptedVariants: ["I'm gonna go."] }] }, b: node("Yes, madam.") } }])).toHaveLength(1);
    expect(scenarioRegisterErrors([{ id: "s1", nodes: { a: node("Excuse me, sir."), b: node("Could you help me, please?") } }])).toEqual([]);
    expect(scenarioRegisterErrors([{ id: "s1", nodes: { a: node("Hi! You wanna eat?"), b: node("Yeah, I'm gonna eat.") } }])).toEqual([]);
  });
});

describe("English morphology", () => {
  test("third person", () => {
    const cases: [string, string][] = [["walk", "walks"], ["go", "goes"], ["do", "does"], ["watch", "watches"], ["wash", "washes"], ["fix", "fixes"], ["miss", "misses"], ["study", "studies"], ["play", "plays"], ["have", "has"], ["be", "is"], ["can", "can"]];
    for (const [lemma, form] of cases) expect(englishThirdPerson(lemma)).toBe(form);
  });

  test("-ing", () => {
    const cases: [string, string][] = [["walk", "walking"], ["live", "living"], ["stop", "stopping"], ["run", "running"], ["begin", "beginning"], ["forget", "forgetting"], ["visit", "visiting"], ["open", "opening"], ["see", "seeing"], ["agree", "agreeing"], ["die", "dying"], ["fix", "fixing"], ["play", "playing"], ["be", "being"], ["quit", "quitting"]];
    for (const [lemma, form] of cases) expect(englishIng(lemma)).toBe(form);
  });

  test("regular -ed", () => {
    const cases: [string, string][] = [["walk", "walked"], ["live", "lived"], ["stop", "stopped"], ["study", "studied"], ["play", "played"], ["visit", "visited"], ["travel", "traveled"], ["agree", "agreed"], ["fix", "fixed"], ["prefer", "preferred"]];
    for (const [lemma, form] of cases) expect(englishPastRegular(lemma)).toBe(form);
  });

  test("regular plurals", () => {
    const cases: [string, string][] = [["book", "books"], ["box", "boxes"], ["bus", "buses"], ["watch", "watches"], ["dish", "dishes"], ["baby", "babies"], ["day", "days"], ["photo", "photos"]];
    for (const [noun, form] of cases) expect(englishRegularPlural(noun)).toBe(form);
  });

  test("the paradigm of be, have and a regular verb", () => {
    expect(englishParadigmCells("be", { past: "was, were", participle: "been" })).toEqual({ inf: "be", "pre:1s": "am", "pre:2s": "are", "pre:3s": "is", "pre:1p": "are", "pre:2p": "are", "pre:3p": "are", "pas:s": "was", "pas:p": "were", participle: "been", ing: "being" });
    expect(englishParadigmCells("have", { past: "had", participle: "had" })["pre:3s"]).toBe("has");
    expect(englishParadigmCells("walk")).toEqual({ inf: "walk", "pre:1s": "walk", "pre:2s": "walk", "pre:3s": "walks", "pre:1p": "walk", "pre:2p": "walk", "pre:3p": "walk", "pas:s": "walked", "pas:p": "walked", participle: "walked", ing: "walking" });
  });
});

type Lex = { id: string; lemma: string; partOfSpeech: string };
const realLexicon = (readJson("content/en/lexicon/lexemes.json") as { lexemes: Lex[] }).lexemes;
const realIrregular = (readJson("content/en/lexicon/irregular-forms.json") as { verbs: Record<string, { past: string; participle: string }> }).verbs;
const MODALS = new Set(["can", "could", "will", "would", "should", "must", "may"]);
/** The evidence does not hold these four lexicon verbs: see the report; extend the derive verb list. */
const NO_EVIDENCE = new Set(["cross", "reply", "practice", "cut"]);

describe("English plugin against the committed data", () => {
  test("the registry serves it", () => {
    expect(buildPlugin("en")).toBe(en);
    expect(en.recognitionLocale).toBe("en-US");
    expect(en.flagAsset).toBe("us");
    expect(en.articleRules?.neutral).toEqual(["a", "an", "the"]);
    expect(en.articleRules?.genderless).toBe(true);
    // No gender, and no leading word is taken off a surface.
    expect(en.splitSurfaceArticle("a few")).toEqual({ article: null, rest: "a few" });
    expect(en.splitSurfaceArticle("the")).toEqual({ article: null, rest: "the" });
    expect(en.genderEvidenceInText("The apple is a fruit.", "apple")).toEqual([]);
    expect(en.numberWords?.(21)).toBe("twenty-one");
    expect(en.targetLanguageName).toBe("English");
    expect(en.functionWords).toContain("the");
  });

  test("every generated paradigm cell of every lexicon verb is evidenced by kaikki", () => {
    const spec = en.paradigm!;
    const evidence = new Map((spec.loadEvidence() ?? []).map((v) => [v.lemma, v.rows]));
    const missing: string[] = [];
    for (const lex of realLexicon) {
      if (lex.partOfSpeech !== "verb" || MODALS.has(lex.lemma) || NO_EVIDENCE.has(lex.lemma)) continue;
      const rows = evidence.get(lex.lemma);
      if (!rows) {
        missing.push(`${lex.lemma}: no rows`);
        continue;
      }
      const cells = englishParadigmCells(lex.lemma, realIrregular[lex.id]);
      for (const cell of spec.cellIds) {
        const form = cells[cell];
        const ok = rows.some((r) => r.mot === form && r.infoVer.split(",").some((atom) => spec.cellEvidencedBy(cell, atom)));
        if (!ok) missing.push(`${lex.lemma} ${cell}=${form}`);
      }
    }
    // The only gap: kaikki's row for fall lacks "fell". A fall table cannot validate until the derive is extended.
    expect(missing).toEqual(["fall pas:s=fell", "fall pas:p=fell"]);
  });

  test("the group rules fire on a wrong form", () => {
    const errors: string[] = [];
    const cells = { ...englishParadigmCells("walk"), "pre:3s": "walkes" };
    en.paradigm!.groupRules!({ lemma: "walk", group: "regular", cells }, (m) => errors.push(m));
    expect(errors).toHaveLength(1);
    const quietErrors: string[] = [];
    for (const lemma of ["walk", "live", "study", "stop"]) en.paradigm!.groupRules!({ lemma, group: "regular", cells: englishParadigmCells(lemma) }, (m) => quietErrors.push(m));
    en.paradigm!.groupRules!({ lemma: "be", group: "irregular", cells: englishParadigmCells("be", { past: "was, were", participle: "been" }) }, (m) => quietErrors.push(m));
    en.paradigm!.groupRules!({ lemma: "go", group: "irregular", cells: englishParadigmCells("go", { past: "went", participle: "gone" }) }, (m) => quietErrors.push(m));
    expect(quietErrors).toEqual([]);
  });

  describe("stories resolve inflected tokens", () => {
    const index: LexemeIndex = buildLexemeIndex("en", { lexemes: realLexicon } as unknown as Parameters<typeof buildLexemeIndex>[1], loadVerbForms("en"));
    const resolve = (key: string) => resolveToken(key, { index, functionWords: new Set(en.functionWords), tokenMap: {}, endings: en.storyEndings });
    const lexemeOf = (key: string) => {
      const r = resolve(key);
      return r.kind === "lexeme" ? r.lexemeId : r.kind;
    };

    test("verbs through the morphology evidence", () => {
      const cases: [string, string][] = [["walks", "en:w:walk"], ["walked", "en:w:walk"], ["walking", "en:w:walk"], ["went", "en:w:go"], ["goes", "en:w:go"], ["studies", "en:w:study"], ["stopped", "en:w:stop"], ["wrote", "en:w:write"]];
      for (const [key, id] of cases) expect(lexemeOf(key)).toBe(id);
    });

    test("noun plurals, regular and irregular", () => {
      const cases: [string, string][] = [["boxes", "en:w:box"], ["books", "en:w:book"], ["buses", "en:w:bus"], ["babies", "en:w:baby"], ["shoes", "en:w:shoe"], ["houses", "en:w:house"], ["children", "en:w:child"], ["men", "en:w:man"], ["women", "en:w:woman"], ["feet", "en:w:foot"], ["teeth", "en:w:tooth"], ["knives", "en:w:knife"], ["wives", "en:w:wife"], ["thieves", "en:w:thief"], ["halves", "en:w:half"], ["tomatoes", "en:w:tomato"]];
      for (const [key, id] of cases) expect(lexemeOf(key)).toBe(id);
    });

    test("comparatives and superlatives", () => {
      const cases: [string, string][] = [["bigger", "en:w:big"], ["biggest", "en:w:big"], ["taller", "en:w:tall"], ["nicer", "en:w:nice"], ["nicest", "en:w:nice"], ["easier", "en:w:easy"], ["better", "en:w:good"], ["best", "en:w:good"], ["worse", "en:w:bad"], ["worst", "en:w:bad"]];
      for (const [key, id] of cases) expect(lexemeOf(key)).toBe(id);
    });

    test("function words, and a word with no entry stays unresolved", () => {
      expect(lexemeOf("the")).toBe("function");
      expect(lexemeOf("zebras")).toBe("unresolved");
    });
  });
});
