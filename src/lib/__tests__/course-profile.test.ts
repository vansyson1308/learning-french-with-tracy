/**
 * Course profiles (P1b): the generated registry is the ONLY place the
 * runtime learns what a course can do. French has every rich layer; the
 * inherited courses have none; capabilities derive from artifacts and the
 * test seam can lift one (the es-en FSRS throwaway lives in its own suite).
 */
import { describe, expect, test } from "bun:test";

import { catalog } from "../content";
import {
  __setCourseCapabilityOverrideForTests,
  allCourseProfiles,
  courseProfile,
  hasCapability,
  lessonRouteCapability,
  NO_CAPABILITIES,
  type CourseCapabilities,
} from "../course-profile";
import { languageRules } from "../languages";

const ALL_FLAGS = Object.keys(NO_CAPABILITIES) as (keyof CourseCapabilities)[];

describe("courseProfile", () => {
  test("every catalog course has a profile whose identity matches the catalog row", () => {
    for (const course of catalog.courses) {
      const p = courseProfile(course.id);
      expect(p.id).toBe(course.id);
      expect(p.targetCode).toBe(course.targetCode);
      expect(p.targetLanguage).toBe(course.targetLanguage);
      expect(p.nativeLanguage).toBe(course.nativeLanguage);
      expect(p.flag).toBe(course.flag);
      expect(p.flagAsset.length).toBeGreaterThan(0);
    }
    expect(allCourseProfiles().map((p) => p.id)).toEqual([...catalog.courses.map((c) => c.id)].sort());
  });

  test("fr-en has every capability and every artifact; its ids are fr:w:", () => {
    const p = courseProfile("fr-en");
    for (const flag of ALL_FLAGS) expect(p.capabilities[flag]).toBe(true);
    expect(p.idPrefix).toBe("fr:w:");
    expect(p.legacyIdPrefix).toBe("fr:legacy:");
    expect(p.recognitionLocale).toBe("fr-FR");
    expect(p.ttsLocale).toBe("fr-FR");
    expect(p.artifacts.lexiconDb).toMatch(/^assets\/lexicon\/fr-lexicon-v\d+-[0-9a-f]{16}\.db$/);
    expect(Object.keys(p.artifacts).sort()).toEqual([
      "attainment", "checkpoints", "claim", "clipAssets", "concepts", "dailyWords", "ids", "lexiconDb", "lexiconFallback",
      "lexiconIndex", "listening", "objectives", "placement", "reading", "scenarios", "speech", "stories", "storyAssets", "writing",
    ]);
    // P5b: graded stories, a capability emitted only for courses that have them.
    expect(p.capabilities.stories).toBe(true);
  });

  test("fr-vi (P2b) mirrors the French capabilities with its own native-dependent artifacts", () => {
    const fr = courseProfile("fr-en");
    const vi = courseProfile("fr-vi");
    expect(vi.nativeCode).toBe("vi");
    expect(vi.capabilities).toEqual(fr.capabilities);
    expect(vi.idPrefix).toBe(fr.idPrefix);
    expect(Object.keys(vi.artifacts).sort()).toEqual(Object.keys(fr.artifacts).sort());
    // Native-dependent artifacts are the course's own; target-level ones are shared.
    expect(vi.artifacts.lexiconDb).toMatch(/^assets\/lexicon\/fr-vi-lexicon-v\d+-[0-9a-f]{16}\.db$/);
    expect(vi.artifacts.lexiconDb).not.toBe(fr.artifacts.lexiconDb);
    expect(vi.artifacts.placement).toBe("src/content/assessment/fr-vi-placement.json");
    expect(vi.artifacts.ids).toBe(fr.artifacts.ids);
    expect(vi.artifacts.listening).toBe(fr.artifacts.listening);
    expect(vi.artifacts.claim).toBe(fr.artifacts.claim);
    // Pack audio is the target language's, recorded once for the primary course.
    expect(vi.audioCourseId).toBe("fr-en");
    expect(fr.audioCourseId).toBeUndefined();
  });

  test("es-en (P3a) ships the Spanish lexicon read-only: lexicon on, scheduler unchanged until P4a", () => {
    const p = courseProfile("es-en");
    expect(p.idPrefix).toBe("es:w:");
    expect(p.capabilities.lexicon).toBe(true);
    // content/courses/es-en.profile.json keeps the inherited course on the legacy scheduler.
    expect(p.capabilities.fsrs).toBe(false);
    expect(p.capabilities.dailySession).toBe(false);
    expect(Object.keys(p.artifacts).sort()).toEqual(["ids", "lexiconDb", "lexiconFallback", "lexiconIndex"]);
    // P3d: es-en is "standalone" — its own English-gloss dictionary, none of es-vi's rich layers.
    expect(p.artifacts.lexiconDb).toMatch(/^assets\/lexicon\/es-en-lexicon-v\d+-[0-9a-f]{16}\.db$/);
    expect(p.artifacts.lexiconIndex).toBe("src/content/lexicon/es-en-index.json");
  });

  test("de-en (P3d(de)) ships the German lexicon read-only: lexicon on, scheduler unchanged", () => {
    const p = courseProfile("de-en");
    expect(p.idPrefix).toBe("de:w:");
    expect(p.capabilities.lexicon).toBe(true);
    // content/courses/de-en.profile.json keeps the inherited course on the legacy scheduler.
    expect(p.capabilities.fsrs).toBe(false);
    expect(p.capabilities.dailySession).toBe(false);
  });

  test("every inherited course has no rich capability and no artifacts", () => {
    for (const course of catalog.courses) {
      if (["fr-en", "fr-vi", "es-en", "es-vi", "de-en"].includes(course.id)) continue;
      const p = courseProfile(course.id);
      for (const flag of ALL_FLAGS) expect(p.capabilities[flag]).toBe(false);
      expect(p.artifacts).toEqual({});
      expect(p.idPrefix).toBe("");
    }
  });

  test("profile locales agree with the language plugins", () => {
    for (const p of allCourseProfiles()) {
      const rules = languageRules(p.targetCode);
      expect(p.recognitionLocale).toBe(rules.recognitionLocale);
      expect(p.ttsLocale).toBe(rules.ttsLocale);
    }
  });

  test("an unknown course id is fully gated and never throws", () => {
    const p = courseProfile("zz-zz");
    expect(p.capabilities).toEqual(NO_CAPABILITIES);
    expect(p.targetCode).toBe("zz");
    expect(hasCapability("zz-zz", "fsrs")).toBe(false);
  });

  test("the test seam lifts a capability for one course and can be cleared", () => {
    expect(hasCapability("it-en", "fsrs")).toBe(false);
    __setCourseCapabilityOverrideForTests("it-en", { fsrs: true });
    try {
      expect(hasCapability("it-en", "fsrs")).toBe(true);
      expect(hasCapability("it-en", "lexicon")).toBe(false);
      expect(hasCapability("pt-en", "fsrs")).toBe(false);
    } finally {
      __setCourseCapabilityOverrideForTests("it-en", null);
    }
    expect(hasCapability("it-en", "fsrs")).toBe(false);
  });

  test("courseProfile returns a fresh view (callers cannot mutate the table)", () => {
    const a = courseProfile("fr-en");
    (a.capabilities as { goals: boolean }).goals = false;
    // The override seam copies; the base table is read-only JSON — reassert.
    __setCourseCapabilityOverrideForTests("fr-en", {});
    expect(courseProfile("fr-en").capabilities.goals).toBe(true);
    __setCourseCapabilityOverrideForTests("fr-en", null);
  });
});

describe("lessonRouteCapability", () => {
  test("maps the four magic ids to their flags", () => {
    expect(lessonRouteCapability("srs-listening")).toBe("listening");
    expect(lessonRouteCapability("srs-speaking")).toBe("speaking");
    expect(lessonRouteCapability("writing-practice")).toBe("writing");
    expect(lessonRouteCapability("conversation")).toBe("conversation");
  });

  test("course-agnostic magic ids and real lesson ids need nothing", () => {
    expect(lessonRouteCapability("srs")).toBeUndefined();
    expect(lessonRouteCapability("mistakes")).toBeUndefined();
    expect(lessonRouteCapability("fr-en:u1-l1")).toBeUndefined();
    expect(lessonRouteCapability("")).toBeUndefined();
  });
});
