/**
 * Local-time day helpers. Day keys are YYYY-MM-DD in the device's local
 * timezone — streaks and daily goals roll over at local midnight, not UTC.
 */

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Local-timezone day key for a date. */
export function dayString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** UTC day key — only used to interpret day fields written before v1. */
export function utcDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Shift by whole local calendar days (DST-safe, unlike ms arithmetic). */
export function addDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/** The rolling 7-day local window ending today (oldest first). */
export function localWeek(now: Date): { day: string; weekday: string; isToday: boolean }[] {
  const out: { day: string; weekday: string; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(now, -i);
    out.push({
      day: dayString(date),
      weekday: WEEKDAY_LETTERS[date.getDay()],
      isToday: i === 0,
    });
  }
  return out;
}

/**
 * v0 stored day fields under UTC keys. Rewrite `lastActiveDay` to its local
 * equivalent when the streak is still live under EITHER interpretation, so
 * nobody loses a streak on update day; a lapsed value is left untouched.
 */
export function grandfatherLastActiveDay(stored: string | null, now: Date): string | null {
  if (!stored) return stored;
  const localToday = dayString(now);
  const localYesterday = dayString(addDays(now, -1));
  const utcToday = utcDayString(now);
  const utcYesterday = utcDayString(new Date(now.getTime() - 86_400_000));
  if (stored === utcToday || stored === localToday) return localToday;
  if (stored === utcYesterday || stored === localYesterday) return localYesterday;
  return stored;
}

/** Same idea for `dailyXpDay`, where only "today" keeps the counter alive. */
export function grandfatherTodayField(stored: string | null, now: Date): string | null {
  if (!stored) return stored;
  const localToday = dayString(now);
  if (stored === utcDayString(now) || stored === localToday) return localToday;
  return stored;
}
