/**
 * Onboarding default (P0): the app preselects the complete French course,
 * while the v0 flat-legacy migration keeps nesting old progress under the
 * course the v0 app actually shipped with (Spanish).
 */
import { describe, expect, test } from "bun:test";

import { catalog, orderedCoursesFor } from "../content";
import { courseProfile, defaultCourseForUi } from "../course-profile";
import { LEGACY_FLAT_COURSE_ID, migrateProgress } from "../persistence/migrations";
import { DEFAULT_COURSE } from "../store";

describe("default course", () => {
  test("onboarding/default course is fr-en and exists in the catalog", () => {
    expect(DEFAULT_COURSE).toBe("fr-en");
    expect(catalog.courses.some((c) => c.id === DEFAULT_COURSE)).toBe(true);
    // The live store is shared across test files in one bun worker, so its
    // activeCourseId is order-dependent; the initial state is asserted by
    // construction (store.ts initialises activeCourseId from DEFAULT_COURSE).
  });

  test("P3e §7: a Vietnamese UI preselects the first -vi course, an English UI fr-en", () => {
    expect(defaultCourseForUi("vi")).toBe("fr-vi");
    expect(defaultCourseForUi("en")).toBe("fr-en");
    for (const lang of ["vi", "en"]) {
      const id = defaultCourseForUi(lang);
      expect(courseProfile(id).nativeCode).toBe(lang);
      expect(courseProfile(id).role).toBeUndefined();
      // Onboarding offers it (non-standalone courses in the UI language's order).
      expect(orderedCoursesFor(lang).some((c) => c.id === id)).toBe(true);
    }
  });

  test("P3e §7: a UI language without a course falls back to the global default", () => {
    expect(defaultCourseForUi("xx-none")).toBe(DEFAULT_COURSE);
  });

  test("the v0 flat-legacy migration still nests under es-en, independent of the default", () => {
    expect(LEGACY_FLAT_COURSE_ID).toBe("es-en");
    expect(LEGACY_FLAT_COURSE_ID).not.toBe(DEFAULT_COURSE);
    const out = migrateProgress({ xp: 30, completedLessons: { "es-en:u1-l1": true } }, 0, new Date("2026-10-14T00:00:00Z"));
    expect(out.activeCourseId).toBe("es-en");
    expect(out.courses["es-en"]?.xp).toBe(30);
  });
});
