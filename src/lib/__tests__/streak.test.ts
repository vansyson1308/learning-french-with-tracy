import { describe, expect, test } from "bun:test";

import {
  addDays,
  dayString,
  grandfatherLastActiveDay,
  grandfatherTodayField,
  localWeek,
  utcDayString,
} from "../dates";
import { currentStreak } from "../store";

describe("local day math", () => {
  test("dayString uses the local calendar day", () => {
    expect(dayString(new Date(2026, 0, 15, 23, 30))).toBe("2026-01-15");
    expect(dayString(new Date(2026, 0, 15, 0, 10))).toBe("2026-01-15");
    expect(dayString(new Date(2026, 8, 5, 12))).toBe("2026-09-05");
  });

  test("addDays crosses month boundaries on the calendar", () => {
    expect(dayString(addDays(new Date(2026, 2, 1, 12), -1))).toBe("2026-02-28");
    expect(dayString(addDays(new Date(2026, 11, 31, 12), 1))).toBe("2027-01-01");
  });

  test("localWeek: 7 consecutive local days ending today, weekdays consistent", () => {
    const now = new Date(2026, 5, 15, 9, 0);
    const week = localWeek(now);
    expect(week).toHaveLength(7);
    expect(week[6].isToday).toBe(true);
    expect(week[6].day).toBe(dayString(now));
    for (let i = 0; i < 7; i++) {
      const date = addDays(now, -(6 - i));
      expect(week[i].day).toBe(dayString(date));
      expect(week[i].weekday).toBe(
        ["S", "M", "T", "W", "T", "F", "S"][date.getDay()]
      );
    }
  });
});

describe("UTC→local grandfathering", () => {
  const now = new Date(2026, 7, 27, 10, 0); // local morning

  test("UTC-today and local-today both map to local-today", () => {
    expect(grandfatherLastActiveDay(utcDayString(now), now)).toBe(dayString(now));
    expect(grandfatherLastActiveDay(dayString(now), now)).toBe(dayString(now));
  });

  test("UTC-yesterday and local-yesterday both map to local-yesterday", () => {
    const utcYesterday = utcDayString(new Date(now.getTime() - 86_400_000));
    const localYesterday = dayString(addDays(now, -1));
    expect(grandfatherLastActiveDay(utcYesterday, now)).toBe(localYesterday);
    // Stored v0 days were written under UTC semantics, so a stored value is
    // read as a UTC day first. Far east of UTC (e.g. UTC+14 at 10:00 local)
    // the UTC-today string IS the local-yesterday string; the UTC reading
    // wins and maps to local-today — the learner keeps the streak either
    // way and is never double-credited (Phase 10 extreme-timezone lane).
    const ambiguous = localYesterday === utcDayString(now);
    expect(grandfatherLastActiveDay(localYesterday, now)).toBe(
      ambiguous ? dayString(now) : localYesterday
    );
  });

  test("lapsed and null values are untouched", () => {
    expect(grandfatherLastActiveDay("2020-05-05", now)).toBe("2020-05-05");
    expect(grandfatherLastActiveDay(null, now)).toBeNull();
  });

  test("dailyXpDay: only a live 'today' is rewritten", () => {
    expect(grandfatherTodayField(utcDayString(now), now)).toBe(dayString(now));
    expect(grandfatherTodayField("2020-05-05", now)).toBe("2020-05-05");
    expect(grandfatherTodayField(null, now)).toBeNull();
  });

  test("a live streak survives the update whichever way the offset points", () => {
    // A user whose LAST activity was graded by the OLD (UTC) code at various
    // moments around midnight: after grandfathering, currentStreak must not
    // drop to 0. Run under differing TZ in CI to exercise both offset signs.
    const moments = [
      new Date(2026, 7, 26, 23, 30), // late local yesterday
      new Date(2026, 7, 27, 0, 30), // early local today
      new Date(2026, 7, 27, 9, 0), // this local morning
    ];
    for (const m of moments) {
      const storedByOldCode = utcDayString(m);
      const migrated = grandfatherLastActiveDay(storedByOldCode, now);
      expect(
        currentStreak({ streak: 5, lastActiveDay: migrated }, now)
      ).toBe(5);
    }
  });
});

describe("currentStreak display semantics (local days)", () => {
  const now = new Date(2026, 7, 27, 10, 0);

  test("active today or yesterday shows the stored streak, else 0", () => {
    expect(currentStreak({ streak: 4, lastActiveDay: dayString(now) }, now)).toBe(4);
    expect(
      currentStreak({ streak: 4, lastActiveDay: dayString(addDays(now, -1)) }, now)
    ).toBe(4);
    expect(
      currentStreak({ streak: 4, lastActiveDay: dayString(addDays(now, -2)) }, now)
    ).toBe(0);
    expect(currentStreak({ streak: 4, lastActiveDay: null }, now)).toBe(0);
  });

  test("streak day flips at local midnight", () => {
    const lateNight = new Date(2026, 7, 27, 23, 59);
    const nextMorning = new Date(2026, 7, 28, 0, 1);
    const day = dayString(lateNight);
    expect(currentStreak({ streak: 3, lastActiveDay: day }, lateNight)).toBe(3);
    // One minute later it's "yesterday" — still alive.
    expect(currentStreak({ streak: 3, lastActiveDay: day }, nextMorning)).toBe(3);
    // A full day later it lapses.
    expect(
      currentStreak({ streak: 3, lastActiveDay: day }, addDays(nextMorning, 1))
    ).toBe(0);
  });
});
