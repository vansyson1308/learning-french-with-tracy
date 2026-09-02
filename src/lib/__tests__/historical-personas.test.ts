/**
 * Upgrade / persistence durability (Phase 10 §54-§57): every historical
 * persisted shape — v0 flat legacy, v0 rich, v1, v2, v3, and Phase 4/6/8/9
 * personas (FSRS listen/speak cards, placement, checkpoint attempts with
 * and without parallel-form stamps, review log) — must reach the FINAL
 * persist version losslessly, survive an export → import round trip, and
 * fail closed on corruption without touching a valid current state.
 */
import { describe, expect, test } from "bun:test";

import freshFixture from "../__fixtures__/progress/fresh.json";
import multiFixture from "../__fixtures__/progress/multi-course.json";
import flatFixture from "../__fixtures__/progress/v0-flat-legacy.json";
import richFixture from "../__fixtures__/progress/v0-rich.json";
import { emptyAssessmentState } from "../assessment/types";
import {
  createEnvelope,
  runInvariants,
  stageImport,
} from "../persistence/backup-core";
import {
  migrateProgress,
  PERSIST_VERSION,
  type PersistedProgress,
} from "../persistence/migrations";

const NOW = new Date("2026-09-02T09:00:00");
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** A persona at a given historical persist version, derived from a v0 fixture. */
function personaAt(version: number, fixture: unknown): PersistedProgress {
  return migrateProgress(clone(fixture), 0, NOW, version);
}

/** Phase 8/9-era additions layered on a v3 state: skills, assessment history. */
function phase9Persona(): PersistedProgress {
  const state = personaAt(3, richFixture.state);
  const fr = state.courses["fr-en"];
  const anyCardKey = Object.keys(fr.cards ?? {})[0];
  const baseCard = anyCardKey ? (fr.cards as Record<string, unknown>)[anyCardKey] : undefined;
  if (baseCard) {
    (fr.cards as Record<string, unknown>)["fr:pomme:noun|listen"] = clone(baseCard);
    (fr.cards as Record<string, unknown>)["fr:pomme:noun|speak"] = clone(baseCard);
  }
  state.assessment = {
    placementFloor: 20,
    placement: {
      placementVersion: 3,
      completedAt: NOW.getTime() - 86_400_000 * 10,
      recommendedLessonId: "fr-en:ua-l0",
      recommendedFloorIndex: 20,
      objectiveEstimates: [{ objectiveId: "fr.obj.vocab.everyday_basics", estimate: "comfortable" }],
      itemResults: [{ itemId: "fr.pi.x", correct: true }],
    },
    checkpointAttempts: [
      {
        // Phase 6-era attempt: no form stamps (history is never rewritten).
        checkpointId: "fr.checkpoint.section-1",
        checkpointVersion: 1,
        startedAt: NOW.getTime() - 86_400_000 * 9,
        completedAt: NOW.getTime() - 86_400_000 * 9 + 600_000,
        itemResults: [{ itemId: "fr.cpi.s1.greet_evening", correct: true }],
        objectiveResults: [{ objectiveId: "fr.obj.greetings.basic", result: "demonstrated", correct: 3, total: 3 }],
        overallCorrectShare: 1,
      },
      {
        // Phase 9-era attempt: form-stamped capstone sitting.
        checkpointId: "fr.checkpoint.a1-capstone",
        checkpointVersion: 1,
        formId: "a",
        formVersion: 1,
        startedAt: NOW.getTime() - 86_400_000,
        completedAt: NOW.getTime() - 86_400_000 + 900_000,
        itemResults: [{ itemId: "fr.cpi.a1cap.l1", correct: true }],
        objectiveResults: [
          { objectiveId: "fr.obj.listening.short_info", result: "demonstrated", correct: 2, total: 2 },
          { objectiveId: "fr.obj.speaking.give_info", result: "insufficient_evidence", correct: 0, total: 0 },
        ],
        overallCorrectShare: 0.5,
      },
    ],
  };
  return state;
}

const PERSONAS: [string, () => PersistedProgress][] = [
  ["fresh install (v0 fresh fixture)", () => personaAt(PERSIST_VERSION, freshFixture.state)],
  ["v0 flat legacy (pre-per-course)", () => personaAt(PERSIST_VERSION, flatFixture.state)],
  ["v0 rich user", () => personaAt(PERSIST_VERSION, richFixture.state)],
  ["v0 multi-course user", () => personaAt(PERSIST_VERSION, multiFixture.state)],
  ["v1 (Phase 0) user", () => migrateProgress(personaAt(1, richFixture.state), 1, NOW)],
  ["v2 (Phase 1 FSRS) user", () => migrateProgress(personaAt(2, richFixture.state), 2, NOW)],
  ["v3 (Phase 6) user", () => migrateProgress(personaAt(3, multiFixture.state), 3, NOW)],
  ["Phase 8/9 user with listen/speak cards, placement, mixed attempts", () => migrateProgress(phase9Persona(), 3, NOW)],
];

describe("every historical persona reaches the final persist version losslessly", () => {
  for (const [name, build] of PERSONAS) {
    test(name, () => {
      const state = build();
      expect(runInvariants(state, NOW)).toEqual([]);
      expect(state.assessment).toBeDefined();
      expect(Array.isArray(state.reviewLog)).toBe(true);
      // Re-running the final-version migration is a no-op: stable fixed point.
      const again = migrateProgress(clone(state), PERSIST_VERSION, NOW);
      expect(JSON.stringify(again)).toBe(JSON.stringify(state));
    });
  }

  test("the v0 rich user keeps XP, completed lessons and French cards through v1 → v2 → v3", () => {
    const v0 = richFixture.state as { courses: Record<string, { xp: number; completedLessons: Record<string, true> }> };
    const final = personaAt(PERSIST_VERSION, richFixture.state);
    expect(final.courses["fr-en"].xp).toBe(v0.courses["fr-en"].xp);
    const lessonsBefore = Object.keys(v0.courses["fr-en"].completedLessons).filter((id) => !["srs", "mistakes"].includes(id));
    expect(Object.keys(final.courses["fr-en"].completedLessons).sort()).toEqual(lessonsBefore.sort());
    expect(Object.keys(final.courses["fr-en"].cards ?? {}).length).toBeGreaterThan(0);
    expect(final.courses["fr-en"].srsLegacy).toBeDefined();
  });

  test("the Phase 8/9 persona keeps unstamped and stamped attempts exactly as recorded", () => {
    const state = migrateProgress(phase9Persona(), 3, NOW);
    const [unstamped, stamped] = state.assessment!.checkpointAttempts;
    expect(unstamped.formId).toBeUndefined();
    expect(stamped.formId).toBe("a");
    expect(stamped.formVersion).toBe(1);
    expect(state.assessment!.placementFloor).toBe(20);
    expect(Object.keys(state.courses["fr-en"].cards ?? {}).some((k) => k.endsWith("|speak"))).toBe(true);
  });
});

describe("backup round trip under the final build (§56)", () => {
  for (const [name, build] of PERSONAS) {
    test(`${name}: export → import → read-back is identical`, () => {
      const state = build();
      const raw = JSON.stringify(createEnvelope(state, PERSIST_VERSION, NOW));
      const staged = stageImport(raw, NOW);
      expect(staged.ok).toBe(true);
      if (!staged.ok) return;
      expect(JSON.stringify(staged.state)).toBe(JSON.stringify(state));
      // Speech never rides along: no transcript or audio field anywhere.
      expect(raw).not.toMatch(/transcript|recordingUri|\.wav/);
    });
  }
});

describe("corrupt state fails closed and never fabricates a valid state (§57)", () => {
  const valid = () => personaAt(PERSIST_VERSION, richFixture.state);
  const envelope = (mutate: (s: PersistedProgress) => unknown, version = PERSIST_VERSION) => {
    const s = valid();
    const mutated = mutate(s) ?? s;
    return JSON.stringify(createEnvelope(mutated as PersistedProgress, version, NOW));
  };

  test("malformed JSON", () => {
    expect(stageImport("{\"format\":", NOW).ok).toBe(false);
  });

  test("a backup from a FUTURE persist version is refused rather than guessed", () => {
    const staged = stageImport(envelope((s) => s, PERSIST_VERSION + 1), NOW);
    expect(staged.ok).toBe(false);
  });

  test("partial / malformed cards", () => {
    for (const bad of [{ due: "soon" }, { stability: Number.NaN }, null, 5]) {
      const staged = stageImport(
        envelope((s) => {
          (s.courses["fr-en"].cards as Record<string, unknown>)["fr:x:noun|recognize"] = bad;
        }),
        NOW
      );
      expect({ bad, ok: staged.ok }).toEqual({ bad, ok: false });
    }
  });

  test("an invalid assessment form stamp", () => {
    const staged = stageImport(
      envelope((s) => {
        s.assessment = {
          ...emptyAssessmentState(),
          checkpointAttempts: [
            {
              checkpointId: "fr.checkpoint.section-1",
              checkpointVersion: 1,
              formId: 7 as unknown as string,
              formVersion: 0,
              startedAt: 1,
              completedAt: 2,
              itemResults: [],
              objectiveResults: [],
              overallCorrectShare: 1,
            },
          ],
        };
      }),
      NOW
    );
    expect(staged.ok).toBe(false);
  });

  test("NaN and negative numerics", () => {
    for (const mutate of [
      (s: PersistedProgress) => {
        s.courses["fr-en"].xp = Number.NaN;
      },
      (s: PersistedProgress) => {
        s.streak = -3;
      },
      (s: PersistedProgress) => {
        s.assessment = { ...emptyAssessmentState(), placementFloor: Number.NaN };
      },
    ]) {
      expect(stageImport(envelope(mutate), NOW).ok).toBe(false);
    }
  });

  test("orphan lesson ids and unknown card ids are preserved, not invented or dropped", () => {
    const staged = stageImport(
      envelope((s) => {
        s.courses["fr-en"].completedLessons["fr-en:no-such-lesson"] = true;
      }),
      NOW
    );
    // Unknown-but-well-formed data is the learner's; import keeps it and
    // the app simply never renders a lesson that does not exist.
    expect(staged.ok).toBe(true);
    if (staged.ok) expect(staged.state.courses["fr-en"].completedLessons["fr-en:no-such-lesson"]).toBe(true);
  });

  test("prototype-pollution keys are rejected", () => {
    const raw = envelope((s) => s).replace('"streak"', '"__proto__":{"polluted":true},"streak"');
    expect(stageImport(raw, NOW).ok).toBe(false);
  });
});
