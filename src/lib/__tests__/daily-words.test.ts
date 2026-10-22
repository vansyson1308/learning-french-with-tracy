/**
 * P3e "Từ mới mỗi ngày": the daily new-words stream — syllabus order,
 * unlocked by unit progress, never a carded word, the learner's number a
 * day, teach + recognition probe (+ listening with a clip), and the
 * composer stays exactly the pre-P3e plan when the stream is off.
 */
import { describe, expect, test } from "bun:test";

import { getPack } from "../content";
import {
  DAILY_NEW_WORDS_DEFAULT,
  dailyWordCandidates,
  dailyWordEntries,
  normalizeDailyNewWords,
  reachedUnitIndex,
  syllabusWords,
} from "../learning/daily-words";
import type { FsrsCardState } from "../learning/scheduler";
import { composeTodaySession } from "../learning/today";

const ES = getPack("es-vi");
const FR = getPack("fr-en");
const NOW = Date.UTC(2026, 9, 22, 8);
const firstUnitLessons = (pack: typeof ES) => pack.sections[0].units[0].lessons.map((l) => l.id);
const done = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, true as const]));
const packSurfaces = (pack: typeof ES) => new Set(pack.sections.flatMap((s) => s.units.flatMap((u) => u.words.map((w) => w.target))));
/** Every lesson done: all units reached (P3f: stream-only words sit in their theme's unit, no longer in unit 1). */
const allDone = () => Object.fromEntries(ES.sections.flatMap((s) => s.units.flatMap((u) => u.lessons.map((l) => [l.id, true] as const))));
/** A daily candidate the pack itself never teaches (only the stream delivers it). */
const streamOnly = () =>
  dailyWordCandidates({ courseId: "es-vi", pack: ES, completedLessons: allDone(), cards: {}, max: 700 }).find((c) => !packSurfaces(ES).has(c.word.target))!;
const card = (): FsrsCardState => ({ due: NOW + 86_400_000, stability: 2, difficulty: 5, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0, state: "review", last_review: NOW - 86_400_000 });

describe("daily words — syllabus and setting", () => {
  test("es-vi reaches ≥ 600 A1 lexemes; fr reads its existing lexicon", () => {
    expect(dailyWordEntries("es-vi").length).toBeGreaterThanOrEqual(600);
    expect(syllabusWords("es-vi").length).toBe(dailyWordEntries("es-vi").length);
    expect(dailyWordEntries("fr-en").length).toBe(126);
    expect(dailyWordEntries("fr-vi")).toEqual(dailyWordEntries("fr-en"));
    expect(dailyWordEntries("es-en")).toEqual([]);
  });

  test("the setting is 0–15, default 5", () => {
    expect(DAILY_NEW_WORDS_DEFAULT).toBe(5);
    expect(normalizeDailyNewWords(undefined)).toBe(5);
    expect(normalizeDailyNewWords(-3)).toBe(0);
    expect(normalizeDailyNewWords(40)).toBe(15);
    expect(normalizeDailyNewWords(7.4)).toBe(7);
    expect(normalizeDailyNewWords("9")).toBe(5);
  });

  test("the reached unit follows the frontier and the placement floor", () => {
    expect(reachedUnitIndex(ES, {})).toBe(0);
    expect(reachedUnitIndex(ES, done(firstUnitLessons(ES)))).toBe(1);
    expect(reachedUnitIndex(ES, {}, 8)).toBe(2);
  });
});

describe("daily word candidates", () => {
  test("only lexemes whose unit is reached, in syllabus order", () => {
    const fresh = dailyWordCandidates({ courseId: "es-vi", pack: ES, completedLessons: {}, cards: {} });
    const unit1 = new Set(dailyWordEntries("es-vi").filter((e) => e.unitId === ES.sections[0].units[0].id).map((e) => e.id));
    expect(fresh.length).toBeGreaterThan(0);
    expect(fresh.every((c) => unit1.has(c.itemId))).toBe(true);
    const order = dailyWordEntries("es-vi").map((e) => e.id);
    const positions = fresh.map((c) => order.indexOf(c.itemId));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    const later = dailyWordCandidates({ courseId: "es-vi", pack: ES, completedLessons: done(firstUnitLessons(ES)), cards: {}, max: 600 });
    expect(later.length).toBeGreaterThan(fresh.length);
  });

  test("a word with a recognition card is never offered again", () => {
    const [first, second] = dailyWordCandidates({ courseId: "es-vi", pack: ES, completedLessons: {}, cards: {} });
    const next = dailyWordCandidates({ courseId: "es-vi", pack: ES, completedLessons: {}, cards: { [`${first.itemId}|recognize`]: card() } });
    expect(next[0].itemId).toBe(second.itemId);
  });

  test("a daily word renders from the lexicon index: surface, Vietnamese gloss, a topic picture", () => {
    const [c] = dailyWordCandidates({ courseId: "es-vi", pack: ES, completedLessons: {}, cards: {} });
    expect(c.itemId.startsWith("es:w:")).toBe(true);
    expect(c.word.native.length).toBeGreaterThan(0);
    expect(c.word.emoji.length).toBeGreaterThan(0);
  });
});

describe("TODAY with the daily stream", () => {
  const base = { courseId: "es-vi", pack: ES, completedLessons: {}, cards: {}, preset: "regular" as const, seed: 7, now: NOW };

  test("off (no input) = the pre-P3e plan exactly", () => {
    const plain = composeTodaySession(base);
    expect(plain.dailyCount).toBe(0);
    expect(composeTodaySession({ ...base, dailyWords: [], dailyNewWords: 5 }).steps).toEqual(plain.steps);
    const zero = composeTodaySession({ ...base, dailyWords: dailyWordCandidates({ courseId: "es-vi", pack: ES, completedLessons: {}, cards: {} }), dailyNewWords: 0 });
    expect(zero.dailyCount).toBe(0);
  });

  test("adds the learner's number of new words: teach card + designated recognition assessment each", () => {
    const candidates = dailyWordCandidates({ courseId: "es-vi", pack: ES, completedLessons: {}, cards: {}, max: 50 });
    const plain = composeTodaySession(base);
    const plan = composeTodaySession({ ...base, dailyWords: candidates, dailyNewWords: 5 });
    expect(plan.dailyCount).toBe(5);
    expect(plan.newCount).toBe(plain.newCount + 5);
    const taught = new Set(plain.steps.filter((s) => s.type === "teach").map((s) => (s as { itemId: string }).itemId));
    const daily = plan.steps.filter((s) => s.type === "teach" && !taught.has((s as { itemId: string }).itemId));
    expect(daily.length).toBe(5);
    for (const t of daily) {
      const id = (t as { itemId: string }).itemId;
      const probe = plan.steps.find((s) => s.type === "exercise" && s.stepId === `today-new-${id}`);
      expect(probe?.type === "exercise" && probe.evidence).toEqual({ itemId: id, srsRole: "assessment" });
    }
  });

  test("never re-teaches a frontier word; 15 is the ceiling", () => {
    const candidates = dailyWordCandidates({ courseId: "es-vi", pack: ES, completedLessons: {}, cards: {}, max: 100 });
    const plan = composeTodaySession({ ...base, dailyWords: candidates, dailyNewWords: 99 });
    expect(plan.dailyCount).toBeLessThanOrEqual(15);
    const teachIds = plan.steps.filter((s) => s.type === "teach").map((s) => (s as { itemId: string }).itemId);
    expect(new Set(teachIds).size).toBe(teachIds.length);
  });

  test("a daily word with a bundled word clip also gets a listening probe", () => {
    const withClip = streamOnly();
    const plan = composeTodaySession({ ...base, dailyWords: [withClip], dailyNewWords: 1, listenClips: { [withClip.itemId]: "es.clip.uf_hola" } });
    const listen = plan.steps.find((s) => s.stepId === `today-new-listen-${withClip.itemId}`);
    expect(listen?.type === "exercise" && listen.evidence).toEqual({ itemId: withClip.itemId, skill: "listen", srsRole: "assessment" });
  });

  test("a due card of a daily word renders in the warm-up through the syllabus words", () => {
    const c = streamOnly();
    const due = { ...card(), due: NOW - 1000 } as FsrsCardState;
    const cards = { [`${c.itemId}|recognize`]: due };
    const without = composeTodaySession({ ...base, cards });
    const withWords = composeTodaySession({ ...base, cards, lexiconWords: syllabusWords("es-vi") });
    expect(without.reviewCount).toBe(0);
    expect(withWords.reviewCount).toBe(1);
  });

  test("French: the stream reads the French lexicon; French content is unchanged", () => {
    const candidates = dailyWordCandidates({ courseId: "fr-en", pack: FR, completedLessons: {}, cards: {} });
    expect(candidates.every((c) => c.itemId.startsWith("fr:w:"))).toBe(true);
  });
});
