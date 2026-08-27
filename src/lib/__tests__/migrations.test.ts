import { describe, expect, test } from "bun:test";

import { dayString, utcDayString } from "../dates";
import {
  DEFAULT_COURSE_ID,
  migrateProgress,
  type PersistedProgress,
} from "../persistence/migrations";
import flatFixture from "../__fixtures__/progress/v0-flat-legacy.json";
import freshFixture from "../__fixtures__/progress/fresh.json";
import multiFixture from "../__fixtures__/progress/multi-course.json";
import richFixture from "../__fixtures__/progress/v0-rich.json";

// Far from every fixture's (stale) day fields, so grandfathering is a no-op
// for fixtures and is tested separately with crafted inputs.
const NOW = new Date(2026, 5, 15, 12, 0, 0);

describe("v0 → v1 migration (fixtures, step-scoped to v1)", () => {
  test("rich current-shape user: pollution pruned, everything else intact", () => {
    const out = migrateProgress(richFixture.state, 0, NOW, 1);
    const fr = out.courses["fr-en"];
    expect(fr.completedLessons["srs"]).toBeUndefined();
    expect(fr.completedLessons["mistakes"]).toBeUndefined();
    expect(fr.completedLessons["fr-en:u0-l0"]).toBe(true);
    expect(fr.completedLessons["fr-en:u0-l1"]).toBe(true);
    expect(fr.xp).toBe(215);
    expect(fr.srs!["l'homme"]).toEqual({
      interval: 3,
      ease: 2.6,
      dueAt: 1768200000000,
      streak: 2,
    });
    expect(fr.wordStats["l'homme"].correct).toBe(4);
    expect(fr.mistakes).toHaveLength(1);
    expect(out.courses["es-en"].xp).toBe(15);
    expect(out.themePreference).toBe("dark");
    expect(out.activeDays["2026-01-10"].lessons).toBe(2);
    expect(out.streak).toBe(5);
    expect(out.lastActiveDay).toBe("2026-01-10"); // stale → untouched
    // Unknown forward/backward-compatible fields ride along.
    expect((out as Record<string, unknown>).hearts).toBe(3);
  });

  test("flat legacy user nests under the default course, keeping theme + days", () => {
    const out = migrateProgress(flatFixture.state, 0, NOW, 1);
    const course = out.courses[DEFAULT_COURSE_ID];
    expect(course.xp).toBe(45);
    expect(course.completedLessons["es-en:u0-l0"]).toBe(true);
    expect(course.completedLessons["srs"]).toBeUndefined();
    expect(course.srs!["el agua"].interval).toBe(1);
    expect(course.wordStats["el agua"].correct).toBe(2);
    // The old (dead) in-code migration dropped these two — the fix keeps them.
    expect(out.themePreference).toBe("light");
    expect(out.activeDays["2026-01-09"].xp).toBe(15);
    expect(out.dailyGoal).toBe(30);
    expect(out.streak).toBe(2);
    // Moved keys don't linger at the top level.
    expect((out as Record<string, unknown>).wordStats).toBeUndefined();
  });

  test("fresh install is untouched apart from defaults", () => {
    const out = migrateProgress(freshFixture.state, 0, NOW, 1);
    expect(out.courses).toEqual({});
    expect(out.streak).toBe(0);
    expect(out.onboardingDone).toBe(false);
    expect(out.themePreference).toBe("system");
  });

  test("multi-course user: every course survives, only pollution changes", () => {
    const input = multiFixture.state;
    const out = migrateProgress(input, 0, NOW, 1);
    expect(Object.keys(out.courses).sort()).toEqual(["es-en", "fr-en", "ja-en"]);
    expect(out.courses["es-en"].mistakes).toHaveLength(2);
    expect(out.courses["es-en"].srs!["el agua"].interval).toBe(20);
    expect(out.courses["ja-en"].completedLessons["srs"]).toBeUndefined();
    expect(out.courses["ja-en"].completedLessons["ja-en:u0-l0"]).toBe(true);
    expect(out.courses["fr-en"].completedLessons["mistakes"]).toBeUndefined();
    // Totality: no srs/wordStats keys lost anywhere.
    for (const id of Object.keys(input.courses) as (keyof typeof input.courses)[]) {
      expect(Object.keys(out.courses[id].srs!)).toEqual(
        Object.keys(input.courses[id].srs)
      );
      expect(Object.keys(out.courses[id].wordStats)).toEqual(
        Object.keys(input.courses[id].wordStats)
      );
    }
  });

  test("already-v1 input passes through unchanged", () => {
    const v1 = migrateProgress(richFixture.state, 0, NOW, 1);
    const again = migrateProgress(v1, 1, NOW, 1);
    expect(again).toEqual(v1);
  });
});

describe("v0 → v1 streak grandfathering (crafted inputs)", () => {
  const base = (lastActiveDay: string | null): PersistedProgress => ({
    activeCourseId: "fr-en",
    streak: 7,
    lastActiveDay,
    dailyGoal: 20,
    dailyXp: 10,
    dailyXpDay: lastActiveDay,
    onboardingDone: true,
    themePreference: "system",
    courses: {},
    activeDays: {},
  });

  test("stored UTC-today becomes local-today; streak value untouched", () => {
    const out = migrateProgress(base(utcDayString(NOW)), 0, NOW);
    expect(out.lastActiveDay).toBe(dayString(NOW));
    expect(out.dailyXpDay).toBe(dayString(NOW));
    expect(out.streak).toBe(7);
  });

  test("stored UTC-yesterday becomes local-yesterday (streak still continuable)", () => {
    const utcYesterday = utcDayString(new Date(NOW.getTime() - 86_400_000));
    const out = migrateProgress(base(utcYesterday), 0, NOW);
    const localYesterday = dayString(new Date(2026, 5, 14, 12));
    expect(out.lastActiveDay).toBe(localYesterday);
    expect(out.streak).toBe(7);
  });

  test("a lapsed day is left exactly as stored", () => {
    const out = migrateProgress(base("2020-01-01"), 0, NOW);
    expect(out.lastActiveDay).toBe("2020-01-01");
  });

  test("null day fields stay null", () => {
    const out = migrateProgress(base(null), 0, NOW);
    expect(out.lastActiveDay).toBeNull();
    expect(out.dailyXpDay).toBeNull();
  });
});
