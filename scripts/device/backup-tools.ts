#!/usr/bin/env bun
/**
 * Backup helpers for the P3h device-acceptance driver.
 *
 *   bun scripts/device/backup-tools.ts seed-rc3 <out.json>
 *       An RC3-format backup (envelope v1, persist v3) built from the
 *       v3-assessed progress fixture — streak, XP, lessons, cards, mistakes
 *       and a placement record — plus the es-en and de-en progress of the
 *       v3-rc3-es-de fixture (wordStats / srs keyed by raw surfaces, as RC3
 *       wrote them), dated today so the streak is live.
 *   bun scripts/device/backup-tools.ts compare <before.json> <after.json>
 *       Stage both files through the app's own import path (which migrates
 *       older envelopes) and compare what a learner would notice: streak,
 *       XP, completed lessons, cards, review log, placement and checkpoint
 *       records. Exit 1 on any difference. The per-word counts of <before>
 *       are also read RAW (no migration): the upgraded build must report the
 *       same number of words, correct/wrong answers and srs entries per
 *       course as RC3 wrote, whatever their keys became (migration v8).
 */
import { readFileSync, writeFileSync } from "fs";

import fixture from "../../src/lib/__fixtures__/progress/v3-assessed.json";
import legacyFixture from "../../src/lib/__fixtures__/progress/v3-rc3-es-de.json";
import { countCards, stageImport } from "../../src/lib/persistence/backup-core";

const today = () => new Date().toISOString().slice(0, 10);

export function seedRc3Envelope(now = new Date()): Record<string, unknown> {
  const day = now.toISOString().slice(0, 10);
  const legacy = legacyFixture.state.courses;
  const courses = { ...(fixture.state.courses as Record<string, unknown>), "es-en": legacy["es-en"], "de-en": legacy["de-en"] };
  const state: Record<string, unknown> = { ...(fixture.state as Record<string, unknown>), courses, lastActiveDay: day, dailyXpDay: day };
  return {
    format: "lingo-progress-backup",
    envelopeVersion: 1,
    persistVersion: fixture.version,
    exportedAt: now.toISOString(),
    manifest: { topLevelKeys: Object.keys(state), courses: Object.keys((state.courses as object) ?? {}) },
    state,
  };
}

type Summary = Record<string, unknown>;
type WordCounts = { words: number; correct: number; wrong: number; srs: number };

function wordCounts(c: { wordStats?: Record<string, { correct: number; wrong: number }>; srs?: Record<string, unknown> }): WordCounts {
  const stats = Object.values(c.wordStats ?? {});
  return {
    words: stats.length,
    correct: stats.reduce((n, s) => n + s.correct, 0),
    wrong: stats.reduce((n, s) => n + s.wrong, 0),
    srs: Object.keys(c.srs ?? {}).length,
  };
}

/** Per-course word counts of a backup file as written, without the import path's migrations. */
export function rawWordCounts(raw: string): Record<string, WordCounts> {
  const state = (JSON.parse(raw) as { state?: { courses?: Record<string, Parameters<typeof wordCounts>[0]> } }).state;
  return Object.fromEntries(Object.entries(state?.courses ?? {}).map(([id, c]) => [id, wordCounts(c)]));
}

/** What the learner would notice if an upgrade lost it. */
export function learnerSummary(raw: string, now = new Date()): Summary {
  const staged = stageImport(raw, now);
  if (!staged.ok) throw new Error(`backup did not stage: ${JSON.stringify(staged.reason)}`);
  const { state, learner } = staged;
  const courses = Object.fromEntries(
    Object.entries(state.courses ?? {}).map(([id, c]) => [
      id,
      {
        xp: c.xp,
        completedLessons: Object.keys(c.completedLessons ?? {}).sort(),
        mistakes: (c.mistakes ?? []).length,
        ...wordCounts(c),
      },
    ])
  );
  const s = state as Record<string, unknown>;
  return {
    activeCourseId: state.activeCourseId,
    streak: state.streak,
    lastActiveDay: state.lastActiveDay,
    dailyGoal: state.dailyGoal,
    onboardingDone: s.onboardingDone,
    courses,
    cards: countCards(learner),
    reviewLog: learner.reviewLog.length,
    assessmentByTarget: s.assessmentByTarget ?? null,
  };
}

function diff(a: unknown, b: unknown, at = ""): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].flatMap((k) => diff((a as Summary)[k], (b as Summary)[k], at ? `${at}.${k}` : k));
  }
  return [`${at || "(root)"}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`];
}

if (import.meta.main) {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === "seed-rc3" && a) {
    writeFileSync(a, JSON.stringify(seedRc3Envelope()));
    console.log(`seed (RC3 format, ${today()}) → ${a}`);
  } else if (cmd === "compare" && a && b) {
    const before = learnerSummary(readFileSync(a, "utf8"));
    const after = learnerSummary(readFileSync(b, "utf8"));
    const lines = diff(before, after);
    // RC3's own numbers (raw file, no migration) against the upgraded build's.
    const rawBefore = rawWordCounts(readFileSync(a, "utf8"));
    for (const [id, counts] of Object.entries(rawBefore)) {
      const got = (after.courses as Record<string, Partial<WordCounts>>)[id];
      const upgraded = got ? { words: got.words, correct: got.correct, wrong: got.wrong, srs: got.srs } : null;
      lines.push(...diff(counts, upgraded, `raw RC3 ${id}`));
    }
    console.log(JSON.stringify(after));
    if (lines.length) {
      console.error(`backup mismatch:\n  ${lines.join("\n  ")}`);
      process.exit(1);
    }
    console.log("backups match");
  } else {
    console.error("usage: backup-tools.ts seed-rc3 <out> | compare <before> <after>");
    process.exit(2);
  }
}
