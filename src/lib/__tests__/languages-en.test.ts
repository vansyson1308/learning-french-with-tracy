/** English rules (P4 en-vi): contractions, spoken numbers, en-GB spellings, labels. */
import { describe, expect, test } from "bun:test";

import { en as rules, englishNumber, spellEnglishDigits } from "../languages/en";
import { gradeSpokenAttempt, normalizeSpoken } from "../speech/grader";

const typed = (a: string, b: string) => rules.normalizeLenient(a) === rules.normalizeLenient(b);
const spoken = (a: string, b: string) => normalizeSpoken(a, rules) === normalizeSpoken(b, rules);
const strict = (a: string, b: string) => rules.normalizeStrict(a) === rules.normalizeStrict(b);

describe("English number speller", () => {
  test("0–100 in standard spelling", () => {
    const cases: [number, string][] = [
      [0, "zero"],
      [1, "one"],
      [12, "twelve"],
      [13, "thirteen"],
      [15, "fifteen"],
      [18, "eighteen"],
      [20, "twenty"],
      [21, "twenty-one"],
      [40, "forty"],
      [58, "fifty-eight"],
      [99, "ninety-nine"],
      [100, "one hundred"],
    ];
    for (const [n, word] of cases) expect(englishNumber(n)).toBe(word);
    expect(() => englishNumber(101)).toThrow(RangeError);
    expect(() => englishNumber(1.5)).toThrow(RangeError);
  });

  test("standalone digits are spelled with the hyphen folded; every other token is unchanged", () => {
    expect(spellEnglishDigits("8")).toBe("eight");
    expect(spellEnglishDigits("21")).toBe("twenty one");
    expect(spellEnglishDigits("100")).toBe("one hundred");
    expect(spellEnglishDigits("101")).toBe("101");
    expect(spellEnglishDigits("eight")).toBe("eight");
    expect(spellEnglishDigits("8th")).toBe("8th");
  });

  test("digits and words grade the same when spoken, hyphen or not", () => {
    expect(spoken("21", "twenty-one")).toBe(true);
    expect(spoken("21", "twenty one")).toBe(true);
    expect(spoken("100", "a hundred")).toBe(true);
    expect(spoken("2 cats", "two cats")).toBe(true);
    expect(spoken("2 cats", "three cats")).toBe(false);
  });

  test("foldSpoken itself spells nothing", () => {
    expect(rules.foldSpoken("8 o'clock")).toBe("8 o clock");
    expect(rules.foldSpoken("2 cats")).toBe("2 cats");
  });

  test("a typed number takes the hyphen or the space", () => {
    expect(typed("twenty one", "twenty-one")).toBe(true);
    expect(typed("well known", "well-known")).toBe(false);
  });
});

describe("English clock formats", () => {
  test("the hour", () => {
    expect(spoken("8 o'clock", "eight o'clock")).toBe(true);
    expect(spoken("8:00", "eight o'clock")).toBe(true);
    expect(spoken("8 a.m.", "eight am")).toBe(true);
    expect(spoken("8am", "eight am")).toBe(true);
    expect(spoken("8:00 AM", "eight a.m.")).toBe(true);
    expect(spoken("8 p.m.", "eight a.m.")).toBe(false);
  });

  test("half past and quarter past, quarter to of the next hour", () => {
    expect(spoken("half past eight", "8:30")).toBe(true);
    expect(spoken("half past 8", "8:30")).toBe(true);
    expect(spoken("eight thirty", "8:30")).toBe(true);
    expect(spoken("quarter past eight", "8:15")).toBe(true);
    expect(spoken("a quarter past eight", "eight fifteen")).toBe(true);
    expect(spoken("quarter after eight", "8:15")).toBe(true);
    expect(spoken("quarter to nine", "8:45")).toBe(true);
    expect(spoken("a quarter to nine", "eight forty-five")).toBe(true);
    expect(spoken("quarter to one", "12:45")).toBe(true);
    expect(spoken("half past twelve", "12:30")).toBe(true);
  });

  test("other times and their limits", () => {
    expect(spoken("8:05", "eight oh five")).toBe(true);
    expect(spoken("10:20", "ten twenty")).toBe(true);
    expect(spoken("18:30", "eighteen thirty")).toBe(true);
    expect(spoken("half past eight", "half past nine")).toBe(false);
    expect(spoken("8:15", "8:45")).toBe(false);
    expect(spoken("quarter to nine", "quarter past nine")).toBe(false);
    // Not a time: the idiom needs an hour after it.
    expect(rules.foldSpoken("half past the door")).toBe("half past the door");
    expect(rules.foldSpoken("a quarter to the bank")).toBe("a quarter to the bank");
  });
});

describe("English price formats", () => {
  test("dollars, in the singular for one", () => {
    expect(spoken("$10", "10 dollars")).toBe(true);
    expect(spoken("$10", "ten dollars")).toBe(true);
    expect(spoken("$1", "one dollar")).toBe(true);
    expect(spoken("$1", "a dollar")).toBe(true);
    expect(spoken("$1.00", "one dollar")).toBe(true);
    expect(spoken("$10", "ten euros")).toBe(false);
  });

  test("dollars and cents", () => {
    expect(spoken("$3.50", "three dollars fifty")).toBe(true);
    expect(spoken("$3.50", "three dollars and fifty cents")).toBe(true);
    expect(spoken("$3.25", "three dollars and twenty-five cents")).toBe(true);
    expect(spoken("$0.50", "fifty cents")).toBe(true);
    expect(spoken("50¢", "fifty cents")).toBe(true);
    expect(spoken("$3.50", "three dollars sixty")).toBe(false);
  });

  test("pounds and euros", () => {
    expect(spoken("£5", "five pounds")).toBe(true);
    expect(spoken("€1", "one euro")).toBe(true);
  });
});

describe("English contractions in typed answers", () => {
  test("accepted both ways, where the meaning is the same", () => {
    const same: [string, string][] = [
      ["I'm a student.", "I am a student."],
      ["I don't know.", "I do not know."],
      ["She doesn't work here.", "She does not work here."],
      ["We didn't go.", "We did not go."],
      ["I can't swim.", "I cannot swim."],
      ["I can't swim.", "I can not swim."],
      ["I cannot swim.", "I can not swim."],
      ["He's a doctor.", "He is a doctor."],
      ["She isn't here.", "She is not here."],
      ["She's not here.", "She is not here."],
      ["She's not here.", "She isn't here."],
      ["They're late.", "They are late."],
      ["They aren't late.", "They're not late."],
      ["What's your name?", "What is your name?"],
      ["Where's the bank?", "Where is the bank?"],
      ["There's a bus.", "There is a bus."],
      ["I'll call you.", "I will call you."],
      ["I won't go.", "I will not go."],
      ["I've finished.", "I have finished."],
      ["I'd like a coffee.", "I would like a coffee."],
      ["He's got a car.", "He has got a car."],
      ["She's been here.", "She has been here."],
      ["No, he isn't.", "No, he is not."],
    ];
    for (const [a, b] of same) {
      expect(typed(a, b)).toBe(true);
      expect(typed(b, a)).toBe(true);
    }
  });

  test("curly and straight apostrophes, and no apostrophe where no other word results", () => {
    expect(typed("I’m a student", "I'm a student")).toBe(true);
    expect(typed("I’m a student", "I am a student")).toBe(true);
    expect(typed("Don’t go", "don't go")).toBe(true);
    expect(typed("Donʼt go", "do not go")).toBe(true);
    expect(typed("I dont know", "I don't know")).toBe(true);
    expect(typed("im a student", "I am a student")).toBe(true);
    expect(typed("id like tea", "I would like tea")).toBe(true);
  });

  test("he's is not he has, except before got and been", () => {
    expect(typed("He's a car.", "He has a car.")).toBe(false);
    expect(typed("He has a doctor.", "He's a doctor.")).toBe(false);
    expect(typed("He is got a car.", "He's got a car.")).toBe(false);
    expect(typed("He is been here.", "He's been here.")).toBe(false);
    // Good English, but which verb it is cannot be told here: the author lists it as an alternative.
    expect(typed("He has gone.", "He's gone.")).toBe(false);
  });

  test("a clause cannot end in a positive contraction", () => {
    expect(typed("Yes, I'm.", "Yes, I am.")).toBe(false);
    expect(typed("Yes, he's.", "Yes, he is.")).toBe(false);
    expect(typed("Yes, they're.", "Yes, they are.")).toBe(false);
    expect(typed("Yes, I've.", "Yes, I have.")).toBe(false);
    expect(typed("Yes, I'll.", "Yes, I will.")).toBe(false);
    expect(typed("I know who he's.", "I know who he is.")).toBe(false);
  });

  test("words that only look like contractions stay themselves", () => {
    expect(typed("Its name is Tom.", "It's name is Tom.")).toBe(false);
    expect(typed("Its a dog.", "It's a dog.")).toBe(false);
    expect(typed("Were late.", "We're late.")).toBe(false);
    expect(typed("Well go.", "We'll go.")).toBe(false);
    expect(typed("Ill go.", "I'll go.")).toBe(false);
    expect(typed("Whose book?", "Who's book?")).toBe(false);
    expect(typed("Mai is book.", "Mai's book.")).toBe(false);
    expect(typed("Hers is red.", "Her is red.")).toBe(false);
  });

  test("an inverted question keeps its contraction", () => {
    expect(typed("Do not you know?", "Don't you know?")).toBe(false);
    expect(typed("Is not he a doctor?", "Isn't he a doctor?")).toBe(false);
    expect(typed("Dont you know?", "Don't you know?")).toBe(true);
  });

  test("'d is expanded only before like, love, prefer, rather", () => {
    expect(typed("I would go.", "I'd go.")).toBe(false);
    expect(typed("I had gone.", "I'd gone.")).toBe(false);
    expect(typed("He had like a coffee.", "He'd like a coffee.")).toBe(false);
  });

  test("different words stay different", () => {
    expect(typed("I can swim.", "I can't swim.")).toBe(false);
    expect(typed("I do know.", "I don't know.")).toBe(false);
    expect(typed("He is here.", "She's here.")).toBe(false);
    expect(typed("I am.", "I was.")).toBe(false);
  });

  test("case and final punctuation fold as the base does", () => {
    expect(typed("HELLO, MAI!", "hello mai")).toBe(true);
    expect(typed("  good   morning. ", "Good morning")).toBe(true);
  });

  test("a typed Vietnamese answer of an en-vi translation still folds its marks", () => {
    expect(typed("dan ong", "đàn ông")).toBe(true);
    expect(typed("an toan", "an toàn")).toBe(true);
    expect(typed("im lang", "im lặng")).toBe(true);
    expect(typed("ím lặng", "im lặng")).toBe(true);
  });
});

describe("English contractions when spoken", () => {
  test("the grader hears both forms and keeps the same refusals", () => {
    const grade = (heard: string, ...variants: string[]) => gradeSpokenAttempt({ finalTranscript: heard, alternatives: [] }, { acceptedVariants: variants }, rules).correct;
    expect(grade("I'm a student", "I am a student")).toBe(true);
    expect(grade("I am a student", "I'm a student")).toBe(true);
    expect(grade("I don’t know", "I do not know")).toBe(true);
    expect(grade("He's a car", "He has a car")).toBe(false);
    expect(grade("yes I'm", "yes I am")).toBe(false);
    expect(grade("it's 8 o'clock", "it is eight o'clock")).toBe(true);
  });

  test("a concept slot matches a contraction", () => {
    const spec = { acceptedVariants: ["unused"], requiredConcepts: [["do not"], ["coffee"]] };
    expect(gradeSpokenAttempt({ finalTranscript: "I don't like coffee", alternatives: [] }, spec, rules).correct).toBe(true);
  });
});

describe("en-GB spellings", () => {
  test("typed answers accept either spelling", () => {
    const pairs: [string, string][] = [
      ["colour", "color"],
      ["favourite", "favorite"],
      ["neighbour", "neighbor"],
      ["neighbourhood", "neighborhood"],
      ["centre", "center"],
      ["theatre", "theater"],
      ["metres", "meters"],
      ["kilometre", "kilometer"],
      ["grey", "gray"],
      ["travelled", "traveled"],
      ["travelling", "traveling"],
      ["cancelled", "canceled"],
      ["organise", "organize"],
      ["realised", "realized"],
      ["practise", "practice"],
      ["cheque", "check"],
      ["programme", "program"],
      ["okay", "ok"],
    ];
    for (const [gb, us] of pairs) {
      expect(typed(gb, us)).toBe(true);
      expect(typed(`My ${gb}.`, `my ${us}`)).toBe(true);
    }
  });

  test("dictation and conjugation accept the spelling too, and nothing else", () => {
    expect(strict("My favourite colour", "my favorite color")).toBe(true);
    expect(strict("travelled", "traveled")).toBe(true);
    expect(strict("colour", "colours")).toBe(false);
  });

  test("the recognizer's spelling never decides a spoken answer", () => {
    expect(spoken("my favourite colour", "my favorite color")).toBe(true);
  });

  test("whole words only", () => {
    expect(typed("colourless", "colorless")).toBe(false);
    expect(typed("colour", "colors")).toBe(false);
  });
});

describe("strict comparison keeps every form", () => {
  test("no contraction is expanded; apostrophes still match", () => {
    expect(strict("I'm", "I am")).toBe(false);
    expect(strict("don’t", "don't")).toBe(true);
    expect(strict("goes", "go")).toBe(false);
    expect(strict("Goes", "goes")).toBe(true);
  });
});

describe("English locales and labels", () => {
  test("the recogniser stays en-US; the seam holds one locale", () => {
    expect(rules.recognitionLocale).toBe("en-US");
    expect(rules.ttsLocale).toBe("en-US");
  });

  test("English cues no gender through its articles", () => {
    expect(rules.articleCue("the water", "noun")).toBeUndefined();
    expect(rules.splitArticle("the water")).toEqual({ bare: "the water" });
    expect(rules.grammarLabels?.articleGenders).toEqual({});
  });

  test("grammar labels name the English persons", () => {
    expect(rules.grammarLabels?.persons["pre:1s"]).toBe("I");
    expect(rules.grammarLabels?.persons["pre:3s"]).toBe("he/she/it");
    expect(rules.grammarLabels?.persons["pre:3p"]).toBe("they");
    expect(rules.grammarLabels?.presentTense).toBe("present simple");
  });
});
