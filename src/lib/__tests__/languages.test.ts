/**
 * Language plugins (P1b): the French plugin reproduces the folding the
 * course shipped with (pinned by the goldens too), the other plugins have
 * sane, total defaults, CJK tokenisation never depends on spaces, Vietnamese
 * keeps its tone marks even leniently, and the plugin locales agree with
 * the compiler's profile table.
 */
import { describe, expect, test } from "bun:test";

import { allCourseProfiles } from "../course-profile";
import { languageRules, languageRulesForCourse, supportedLanguageCodes } from "../languages";
import { normalize } from "../grading";
import { frenchNumber } from "../learning/french-numbers";
import { foldForSearch, foldLigatures } from "../learning/lexicon-search";
import { gradeSpokenAttempt, normalizeSpoken } from "../speech/grader";

const fr = languageRules("fr");

describe("French plugin ≡ shipped behaviour", () => {
  test("lenient typed form equals grading.normalize (accents, ligatures, apostrophes, punctuation)", () => {
    for (const s of ["l’homme", "Garçon!", "  Je   suis  ", "œufs", "bonjour !", "«bonjour»", "Ça va ?"]) {
      expect(fr.normalizeLenient(s)).toBe(normalize(s));
    }
  });

  test("strict form keeps accents and inflection, folds case/space/apostrophes", () => {
    expect(fr.normalizeStrict("Mangé")).toBe("mangé");
    expect(fr.normalizeStrict("mangé")).not.toBe(fr.normalizeStrict("mange"));
    expect(fr.normalizeStrict("l’eau")).toBe(fr.normalizeStrict("l'eau"));
  });

  test("spoken form converts digits to the engine's words and unifies hyphens", () => {
    expect(normalizeSpoken("J'ai 2 chats", fr)).toBe("j ai deux chats");
    expect(normalizeSpoken("quatre-vingts", fr)).toBe(normalizeSpoken("80", fr));
    expect(normalizeSpoken("101", fr)).toBe("101");
    expect(fr.numberToWords!(71)).toBe(frenchNumber(71).traditional);
    expect(fr.numberToWords!(80)).toBe("quatre-vingts");
  });

  test("search folding mirrors lexicon-search", () => {
    for (const s of ["œuf", "Œuvre", "café", "Élève"]) {
      expect(fr.fold(s)).toBe(foldForSearch(s));
      expect(foldLigatures(s)).toBe(foldLigatures(s));
    }
  });

  test("article cues: le / la / l' for nouns only", () => {
    expect(fr.articleCue("le pain", "noun")).toBe("le");
    expect(fr.articleCue("la femme", "noun")).toBe("la");
    expect(fr.articleCue("l'homme", "noun")).toBe("l'");
    expect(fr.articleCue("manger", "verb")).toBeUndefined();
    expect(fr.articleCue("le pain", "verb")).toBeUndefined();
    expect(fr.splitArticle("l'homme")).toEqual({ article: "l'", bare: "homme" });
    expect(fr.splitArticle("bonjour")).toEqual({ bare: "bonjour" });
  });

  test("the spoken grader under French rules still grades the P8 cases", () => {
    const spec = { acceptedVariants: ["J'ai deux chats."] };
    expect(gradeSpokenAttempt({ finalTranscript: "j ai 2 chats", alternatives: [] }, spec, fr).correct).toBe(true);
    expect(gradeSpokenAttempt({ finalTranscript: "j'ai deux chat", alternatives: [] }, spec, fr).correct).toBe(false);
  });
});

describe("other plugins", () => {
  test("every supported code resolves, unknown codes get total Latin defaults", () => {
    expect(supportedLanguageCodes().sort()).toEqual(["de", "en", "es", "fr", "it", "ja", "ko", "pt", "vi", "zh"]);
    const xx = languageRules("xx");
    expect(xx.code).toBe("xx");
    expect(xx.normalizeLenient("Héllo!")).toBe("hello");
    expect(xx.tokenize(xx.foldSpoken("one two"))).toEqual(["one", "two"]);
    expect(xx.spellDigits("2")).toBe("2");
    expect(xx.articleCue("the cat", "noun")).toBeUndefined();
  });

  test("Spanish / German / Italian / Portuguese cue gender through their articles", () => {
    expect(languageRules("es").articleCue("el agua", "noun")).toBe("el");
    expect(languageRules("es").articleCue("las casas", "noun")).toBe("las");
    expect(languageRules("de").articleCue("das Wasser", "noun")).toBe("das");
    expect(languageRules("it").articleCue("l'acqua", "noun")).toBe("l'");
    expect(languageRules("it").articleCue("gli amici", "noun")).toBe("gli");
    expect(languageRules("pt").articleCue("a água", "noun")).toBe("a");
    expect(languageRules("en").articleCue("the water", "noun")).toBeUndefined();
  });

  test("Japanese and Chinese tokenise without spaces; Korean falls back to eojeol", () => {
    const ja = languageRules("ja");
    const jaTokens = ja.tokenize(ja.foldSpoken("これは、テストです。"));
    expect(jaTokens.length).toBeGreaterThan(1);
    expect(jaTokens.join("")).toBe("これはテストです");
    const zh = languageRules("zh");
    expect(zh.tokenize(zh.foldSpoken("我有两只猫")).join("")).toBe("我有两只猫");
    expect(zh.normalizeLenient("Ｗｏ！")).toBe("wo");
    const ko = languageRules("ko");
    expect(ko.tokenize(ko.foldSpoken("저는 학생입니다")).length).toBeGreaterThanOrEqual(2);
  });

  test("Vietnamese keeps tone marks in every form (ma / má / mà are different words)", () => {
    const vi = languageRules("vi");
    const forms = ["ma", "má", "mà", "mả", "mã", "mạ"];
    expect(new Set(forms.map((f) => vi.normalizeLenient(f))).size).toBe(6);
    expect(new Set(forms.map((f) => vi.normalizeStrict(f))).size).toBe(6);
    expect(vi.normalizeLenient("Xin chào!")).toBe("xin chào");
    expect(vi.tokenize(vi.foldSpoken("tôi là sinh viên"))).toEqual(["tôi", "là", "sinh", "viên"]);
  });

  test("plugin locales match every course profile (compiler table ≡ runtime)", () => {
    for (const p of allCourseProfiles()) {
      const rules = languageRulesForCourse(p.id);
      expect(rules.code).toBe(p.targetCode);
      expect(rules.recognitionLocale).toBe(p.recognitionLocale);
      expect(rules.ttsLocale).toBe(p.ttsLocale);
    }
  });
});
