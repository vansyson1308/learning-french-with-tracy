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
      "attainment", "checkpoints", "claim", "clipAssets", "concepts", "ids", "lexiconDb", "lexiconFallback",
      "lexiconIndex", "listening", "objectives", "placement", "reading", "scenarios", "speech", "writing",
    ]);
  });

  test("every inherited course has no rich capability and no artifacts", () => {
    for (const course of catalog.courses) {
      if (course.id === "fr-en") continue;
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
    expect(hasCapability("es-en", "fsrs")).toBe(false);
    __setCourseCapabilityOverrideForTests("es-en", { fsrs: true });
    try {
      expect(hasCapability("es-en", "fsrs")).toBe(true);
      expect(hasCapability("es-en", "lexicon")).toBe(false);
      expect(hasCapability("de-en", "fsrs")).toBe(false);
    } finally {
      __setCourseCapabilityOverrideForTests("es-en", null);
    }
    expect(hasCapability("es-en", "fsrs")).toBe(false);
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
