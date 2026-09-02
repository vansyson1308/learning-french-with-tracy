/**
 * Soak (V1 publication, Part VI): fifty days of a heavy learner driven
 * through the real store — path lessons with evidence, Today sessions,
 * practice sessions, backups — with the clock advancing a day per cycle.
 * What must hold under repetition:
 *   - every bounded structure stays bounded (review log ring cap, activity
 *     calendar cap, one card per item and skill, no duplicate mistakes);
 *   - the persisted state never contains NaN or negative numbers and keeps
 *     passing the backup invariants, so an export made on day 50 imports;
 *   - work per cycle does not degrade (no accidental O(n²) over history)
 *     and the heap, after a forced collection, does not keep climbing once
 *     the ring is full.
 * Device-level soak (audio, speech, memory profiler) is a device task —
 * release/SOAK_REPORT.md.
 */
import { afterAll, beforeAll, describe, expect, test, setSystemTime } from "bun:test";

import frIndex from "../../content/lexicon/fr-index.json";
import frPack from "../../content/packs/fr-en.json";
import type { ReviewEvidence } from "../learning/evidence";
import { REVIEW_LOG_CAP } from "../learning/review-log";
import { createEnvelope, runInvariants, stageImport } from "../persistence/backup-core";
import { PERSIST_VERSION } from "../persistence/migrations";
import { useProgress } from "../store";

const DAY = 86_400_000;
const T0 = new Date("2026-09-03T08:00:00").getTime();
const CYCLES = 50;
const LESSON_STEPS = 11;
const TODAY_STEPS = 20;

// Every curated French item id (the compiled lexicon index is the truth the
// runtime uses); the soak spreads its evidence across all of them.
const itemIds = [...new Set([...JSON.stringify(frIndex).matchAll(/"(fr:w:[a-z0-9-]+)"/g)].map((m) => m[1]))].sort();
if (itemIds.length === 0) throw new Error("no fr:w ids in the lexicon index");

function evidence(i: number, cycle: number, source: ReviewEvidence["source"], sessionId: string): ReviewEvidence {
  const itemId = itemIds[(cycle * 7 + i) % itemIds.length];
  const skill = i % 5 === 4 ? "listen" : "recognize";
  return {
    cardKey: { itemId, skill },
    sessionId,
    exerciseId: `${sessionId}:${i}`,
    modality: skill === "listen" ? "listen" : "recognizeText",
    srsRole: "assessment",
    source,
    correct: (i + cycle) % 4 !== 0,
    hinted: false,
    assisted: false,
    toleranceUsed: i % 9 === 0,
    latencyMs: 1200 + ((i * 37) % 900),
    attemptIndex: 0,
  };
}

function walk(value: unknown, path: string, bad: string[]) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) bad.push(`${path}=${value}`);
    return;
  }
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`, bad));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`, bad);
}

const heapAfterGc = () => {
  Bun.gc(true);
  return process.memoryUsage().heapUsed;
};

describe("soak: fifty heavy days through the real store", () => {
  const cycleMs: number[] = [];
  const heap: number[] = [];

  beforeAll(() => {
    setSystemTime(new Date(T0));
    useProgress.setState({ courses: {}, reviewLog: [], activeDays: {}, streak: 0, lastActiveDay: null as unknown as string, dailyXp: 0 });
    useProgress.getState().finishOnboarding("fr-en", 20);
  });
  afterAll(() => setSystemTime());

  test("runs 50 cycles of lesson + Today + practice + backup with bounded state", () => {
    const lessonIds = (frPack as { sections: { units: { lessons: { id: string }[] }[] }[] }).sections
      .flatMap((s) => s.units.flatMap((u) => u.lessons.map((l) => l.id)));
    for (let cycle = 0; cycle < CYCLES; cycle++) {
      setSystemTime(new Date(T0 + cycle * DAY));
      const started = performance.now();
      const store = useProgress.getState();

      // PATH lesson: eleven graded steps, then completion (perfect on even days).
      const lessonSession = `lesson-${cycle}`;
      for (let i = 0; i < LESSON_STEPS; i++) store.submitEvidence(evidence(i, cycle, "lesson", lessonSession));
      const missed = evidence(3, cycle, "lesson", lessonSession);
      store.addMistake({ lessonId: lessonIds[cycle % lessonIds.length], exerciseId: missed.exerciseId });
      store.addMistake({ lessonId: lessonIds[cycle % lessonIds.length], exerciseId: missed.exerciseId }); // duplicate must not double
      store.completeLesson(lessonIds[cycle % lessonIds.length], cycle % 2 === 0);
      store.completeLesson(lessonIds[cycle % lessonIds.length], true); // replay: activity only, no XP

      // TODAY session: twenty assessments, then completion XP.
      const todaySession = `today-${cycle}`;
      for (let i = 0; i < TODAY_STEPS; i++) store.submitEvidence(evidence(i + 100, cycle, "today", todaySession));
      store.completeTodaySession(12);

      // Practice: mistakes re-drill (practice role never mutates cards) + a review.
      store.submitEvidence({ ...evidence(3, cycle, "mistakes", `mistakes-${cycle}`), srsRole: "practice", attemptIndex: 1 });
      store.clearMistake(missed.exerciseId);
      store.recordPracticeSession();

      // Backup every fifth day: export → stage → invariants.
      if (cycle % 5 === 4) {
        const envelope = createEnvelope(useProgress.getState() as never, PERSIST_VERSION, new Date());
        const staged = stageImport(JSON.stringify(envelope), new Date());
        expect(staged.ok).toBe(true);
        if (staged.ok) expect(runInvariants(staged.state, new Date())).toEqual([]);
      }

      cycleMs.push(performance.now() - started);
      if (cycle % 10 === 9) heap.push(heapAfterGc());

      const s = useProgress.getState();
      const fr = s.courses["fr-en"];
      expect(s.reviewLog.length).toBeLessThanOrEqual(REVIEW_LOG_CAP);
      expect(Object.keys(s.activeDays).length).toBeLessThanOrEqual(70);
      expect(fr.mistakes.length).toBeLessThanOrEqual(1);
      expect(Object.keys(fr.cards ?? {}).length).toBeLessThanOrEqual(itemIds.length * 2);
      const bad: string[] = [];
      walk({ courses: s.courses, activeDays: s.activeDays, dailyXp: s.dailyXp, streak: s.streak }, "state", bad);
      expect(bad).toEqual([]);
    }

    const s = useProgress.getState();
    expect(s.streak).toBe(CYCLES);
    expect(s.courses["fr-en"].xp).toBeGreaterThan(0);
    expect(Object.keys(s.courses["fr-en"].completedLessons).length).toBe(Math.min(CYCLES, lessonIds.length));

    // Per-cycle cost: every store write re-serializes the whole persisted
    // state (zustand persist), so the cost of a cycle grows with the review
    // log until the ring cap and then plateaus — a linear, bounded
    // characteristic recorded in SOAK_REPORT.md, not a leak. What must hold:
    // the absolute cost stays small (a cycle is 35 writes) and the growth is
    // no worse than linear in the log size.
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const early = mean(cycleMs.slice(0, 10));
    const late = mean(cycleMs.slice(-10));
    expect(late).toBeLessThanOrEqual(400);
    const logGrowth = s.reviewLog.length / Math.max(1, (LESSON_STEPS + TODAY_STEPS + 1) * 10);
    expect(late / Math.max(early, 1)).toBeLessThanOrEqual(logGrowth * 1.5 + 1);

    // Heap after GC: the review log grows toward its cap by design; beyond
    // that nothing should climb. Allow the log's own growth plus 24 MB.
    const logBytes = JSON.stringify(s.reviewLog).length;
    expect(heap[heap.length - 1] - heap[0]).toBeLessThanOrEqual(logBytes * 3 + 24 * 1024 * 1024);

    console.log(
      `soak: ${CYCLES} cycles, review log ${s.reviewLog.length}/${REVIEW_LOG_CAP} entries (${(logBytes / 1024).toFixed(0)} KB), ` +
        `cards ${Object.keys(s.courses["fr-en"].cards ?? {}).length}, cycle ms early ${early.toFixed(1)} → late ${late.toFixed(1)}, ` +
        `heap after GC ${heap.map((h) => (h / 1048576).toFixed(1)).join(" → ")} MB`
    );
  }, 120_000);

  test("the day-50 backup imports losslessly into a fresh store", () => {
    const before = useProgress.getState();
    const envelope = createEnvelope(before as never, PERSIST_VERSION, new Date());
    const staged = stageImport(JSON.stringify(envelope), new Date());
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(staged.state.courses["fr-en"].xp).toBe(before.courses["fr-en"].xp);
    expect((staged.state.reviewLog ?? []).length).toBe(before.reviewLog.length);
    expect(Object.keys(staged.state.courses["fr-en"].cards ?? {}).length).toBe(Object.keys(before.courses["fr-en"].cards ?? {}).length);
  });
});
