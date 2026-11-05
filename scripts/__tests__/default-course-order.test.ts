/**
 * Onboarding default per UI language (P3e §7, P4d tie-break): most core
 * capabilities, then most units, then the D-15 language priority declared
 * in content/onboarding-priority.json (plan/10-LADDER-A1-C2.md §1), then
 * the target-language name, then the id. A claimable course wins over an
 * unclaimable one of the same native language.
 */
import { describe, expect, test } from "bun:test";

import { deriveDefaultCourses } from "../lib/course-profiles";
import { loadOnboardingPriority } from "../lib/pipeline";
import { OnboardingPrioritySchema } from "../../content/schema";

const D15 = ["en", "ja", "ko", "zh", "de", "fr", "es", "it", "pt"];

const FULL = { fsrs: true, dailySession: true, lexicon: true, concepts: true, placement: true, checkpoints: true, goals: true, listening: true, reading: true, speaking: true, writing: true, conversation: true };
const NONE = { fsrs: false, dailySession: false, lexicon: false, concepts: false, placement: false, checkpoints: false, goals: false, listening: false, reading: false, speaking: false, writing: false, conversation: false };

const NAMES: Record<string, string> = { en: "English", ja: "Japanese", zh: "Chinese", fr: "French", ko: "Korean", xq: "Aaa-unknown", de: "German" };
const profile = (id: string, capabilities = FULL, hidden = false) => {
  const [targetCode, nativeCode] = id.split("-");
  return { id, targetCode, nativeCode, targetLanguage: NAMES[targetCode], capabilities, ...(hidden ? { hiddenFromOnboarding: true as const } : {}) };
};
const byId = (...ps: ReturnType<typeof profile>[]) => Object.fromEntries(ps.map((p) => [p.id, p]));
const units = (map: Record<string, number> = {}) => (id: string) => map[id] ?? 10;

describe("default course order (P4d: D-15 priority breaks a tie)", () => {
  test("zh-vi, en-vi and ja-vi tie on score and units: the Vietnamese UI preselects en-vi, not the alphabetically first zh-vi", () => {
    const out = deriveDefaultCourses({
      profiles: byId(profile("zh-vi"), profile("en-vi"), profile("ja-vi"), profile("fr-en")),
      unitCount: units(),
      claimA1ByTarget: { zh: true, en: true, ja: true, fr: true },
      onboardingPriority: D15,
    });
    expect(out.defaultCourseByNative.vi).toBe("en-vi");
    expect(out.defaultCourseByNative.en).toBe("fr-en");
    expect(out.defaultCourseId).toBe("fr-en");
  });

  test("the priority only breaks ties: score, units and the claim gate still come first", () => {
    const base = { claimA1ByTarget: { zh: true, en: true, ja: true }, onboardingPriority: D15 };
    // More capabilities beats priority.
    expect(deriveDefaultCourses({ ...base, profiles: byId(profile("zh-vi"), profile("en-vi", { ...FULL, conversation: false })), unitCount: units() }).defaultCourseByNative.vi).toBe("zh-vi");
    // More units beats priority.
    expect(deriveDefaultCourses({ ...base, profiles: byId(profile("zh-vi"), profile("en-vi")), unitCount: units({ "zh-vi": 11 }) }).defaultCourseByNative.vi).toBe("zh-vi");
    // A claimable course beats an unclaimable one of higher priority.
    expect(deriveDefaultCourses({ ...base, claimA1ByTarget: { zh: true, en: false }, profiles: byId(profile("zh-vi"), profile("en-vi")), unitCount: units() }).defaultCourseByNative.vi).toBe("zh-vi");
    // A hidden course is never the default.
    expect(deriveDefaultCourses({ ...base, profiles: byId(profile("zh-vi"), profile("en-vi", FULL, true)), unitCount: units() }).defaultCourseByNative.vi).toBe("zh-vi");
  });

  test("a target the list does not name ranks after every listed one, then by name and id", () => {
    const out = deriveDefaultCourses({
      profiles: byId(profile("xq-vi", NONE), profile("de-vi", NONE)),
      unitCount: units(),
      claimA1ByTarget: {},
      onboardingPriority: D15,
    });
    expect(out.defaultCourseByNative.vi).toBe("de-vi");
    // Without a list the old order (name, then id) is unchanged.
    expect(deriveDefaultCourses({ profiles: byId(profile("xq-vi", NONE), profile("de-vi", NONE)), unitCount: units(), claimA1ByTarget: {}, onboardingPriority: [] }).defaultCourseByNative.vi).toBe("xq-vi");
  });

  test("the shipped list is the D-15 order and the schema rejects a duplicate", () => {
    expect(loadOnboardingPriority()).toEqual(D15);
    expect(OnboardingPrioritySchema.safeParse({ decision: "D-15", targets: ["en", "en"] }).success).toBe(false);
    expect(OnboardingPrioritySchema.safeParse({ decision: "D-15", targets: ["EN"] }).success).toBe(false);
  });
});
