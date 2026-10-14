/**
 * Runtime golden helpers (P1a). A golden is a JSON snapshot committed next
 * to the tests (./snapshots/<name>.json). `expectGolden` compares a value
 * against it with a stable serialisation (sorted keys), and only writes
 * when GOLDEN_UPDATE=1 — i.e. through `bun scripts/golden.ts --update
 * --reason "…"`, which logs the reason. Everything here is deterministic:
 * fixed instants, seeded RNG, no local-day dependence (the suites run in
 * all five CI timezones).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import freshFixture from "../../__fixtures__/progress/fresh.json";
import multiCourseFixture from "../../__fixtures__/progress/multi-course.json";
import v0FlatLegacyFixture from "../../__fixtures__/progress/v0-flat-legacy.json";
import v0RichFixture from "../../__fixtures__/progress/v0-rich.json";
import frPackJson from "../../../content/packs/fr-en.json";
import type { Answer } from "../../grading";
import { migrateProgress, type PersistedProgress } from "../../persistence/migrations";
import type { SessionAction, SessionMachineState } from "../../session/reducer";
import { currentStep, emptySessionState, sessionReducer } from "../../session/reducer";
import type { SessionStep } from "../../session/types";
import type { Exercise, LessonPack, Pack } from "../../types";

// ---------------------------------------------------------------------------
// Snapshot I/O
// ---------------------------------------------------------------------------

const SNAPSHOT_DIR = path.join(__dirname, "snapshots");
const UPDATE = process.env.GOLDEN_UPDATE === "1";

/** JSON with every object's keys sorted — stable across engines and runs. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value), null, 2) + "\n";
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = sortKeys(v);
    }
    return out;
  }
  if (typeof value === "number" && !Number.isFinite(value)) return String(value);
  return value;
}

function firstDifference(a: string, b: string): string {
  const la = a.split("\n");
  const lb = b.split("\n");
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) {
      return `line ${i + 1}:\n  golden:  ${la[i] ?? "<end>"}\n  actual:  ${lb[i] ?? "<end>"}`;
    }
  }
  return "(identical)";
}

/**
 * Compare `value` with snapshots/<name>.json. With GOLDEN_UPDATE=1 the
 * snapshot is (re)written instead. A missing snapshot is an error unless
 * updating — goldens are never created silently by a test run.
 */
export function expectGolden(name: string, value: unknown): void {
  const file = path.join(SNAPSHOT_DIR, `${name}.json`);
  const actual = stableStringify(value);
  if (UPDATE) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, actual);
    return;
  }
  if (!existsSync(file)) {
    throw new Error(
      `golden snapshot missing: ${path.relative(process.cwd(), file)} — bless it with \`bun scripts/golden.ts --update --reason "…"\``
    );
  }
  const golden = readFileSync(file, "utf8");
  if (golden !== actual) {
    throw new Error(
      `golden "${name}" changed (${path.relative(process.cwd(), file)}).\n${firstDifference(golden, actual)}\n` +
        `If French behaviour was meant to change, re-bless: bun scripts/golden.ts --update --reason "…"`
    );
  }
}

// ---------------------------------------------------------------------------
// Fixed clock and personas
// ---------------------------------------------------------------------------

/** 2026-06-15T12:00:00Z — far from every fixture day, so no day grandfathering. */
export const NOW_MS = Date.UTC(2026, 5, 15, 12, 0, 0);
export const NOW = new Date(NOW_MS);
/** A fixed "day" for seeds that would otherwise come from the local clock. */
export const GOLDEN_DAY = "2026-06-15";
export const MINUTE = 60_000;
export const DAY_MS = 86_400_000;

export const PERSONA_NAMES = ["fresh", "multi-course", "v0-rich"] as const;
export type PersonaName = (typeof PERSONA_NAMES)[number];

type Fixture = { state: unknown; version: number };
const FIXTURES: Record<PersonaName | "v0-flat-legacy", Fixture> = {
  fresh: freshFixture as Fixture,
  "multi-course": multiCourseFixture as Fixture,
  "v0-rich": v0RichFixture as Fixture,
  "v0-flat-legacy": v0FlatLegacyFixture as Fixture,
};

export function fixtureFor(name: keyof typeof FIXTURES): Fixture {
  const f = FIXTURES[name];
  return { state: JSON.parse(JSON.stringify(f.state)), version: f.version };
}

/** The persona migrated to the current persisted shape at the fixed instant. */
export function migratedPersona(name: keyof typeof FIXTURES): PersistedProgress {
  const f = fixtureFor(name);
  return migrateProgress(f.state, f.version, NOW);
}

// ---------------------------------------------------------------------------
// French pack access (pure, no React)
// ---------------------------------------------------------------------------

export const frPack = frPackJson as unknown as Pack;

export type LessonRef = { lesson: LessonPack; globalIndex: number };

const LESSON_INDEX = (() => {
  const byId = new Map<string, LessonRef>();
  let index = 0;
  for (const section of frPack.sections) {
    for (const unit of section.units) {
      for (const lesson of unit.lessons) byId.set(lesson.id, { lesson, globalIndex: index++ });
    }
  }
  return byId;
})();

export function lessonRef(id: string): LessonRef | undefined {
  return LESSON_INDEX.get(id);
}

export function getLesson(id: string): { lesson: LessonPack } | undefined {
  const ref = LESSON_INDEX.get(id);
  return ref ? { lesson: ref.lesson } : undefined;
}

export function allFrWords() {
  const seen = new Set<string>();
  const out: Pack["sections"][number]["units"][number]["words"] = [];
  for (const section of frPack.sections) {
    for (const unit of section.units) {
      for (const w of unit.words) {
        if (seen.has(w.target)) continue;
        seen.add(w.target);
        out.push(w);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Scripted answers
// ---------------------------------------------------------------------------

/** A correct answer for any exercise type, derived from the authored item. */
export function correctAnswerFor(exercise: Exercise): Answer {
  switch (exercise.type) {
    case "select":
    case "fillBlank":
    case "articleSelect":
    case "listeningComprehension":
    case "readingComprehension":
      return exercise.correct;
    case "wordBank": {
      const used = new Set<number>();
      return exercise.answer.map((tok) => {
        const i = exercise.tokens.findIndex((t, idx) => t === tok && !used.has(idx));
        used.add(i);
        return i;
      });
    }
    case "typeAnswer":
    case "conjugationCloze":
    case "dictation":
      return exercise.answer;
    case "match":
      return "done";
    case "speakRepetition":
    case "speakProduction":
      return {
        spoken: true,
        finalTranscript: exercise.acceptedVariants[0] ?? exercise.target,
        alternatives: [],
        assisted: false,
      };
    case "guidedWriting":
      return { written: true, kind: "text", text: exercise.modelAnswers[0] ?? "" };
    case "simpleForm":
      return {
        written: true,
        kind: "form",
        values: Object.fromEntries(
          exercise.fields.map((f) => [
            f.id,
            exercise.rubric.requiredSlots.find((slot) => slot.id === f.slotId)?.variants[0] ?? "",
          ])
        ),
      };
    case "interactionScenario":
      return {
        interaction: true,
        goalMet: true,
        passedFirstTry: true,
        scoredTurns: 3,
        matchedFirstTry: 3,
        supportUsed: 0,
        repairMoves: 0,
        technicallyIncomplete: false,
      };
  }
}

/** A definitely-wrong answer of the right shape. */
export function wrongAnswerFor(exercise: Exercise): Answer {
  switch (exercise.type) {
    case "select":
    case "fillBlank":
    case "listeningComprehension":
    case "readingComprehension":
      return (exercise.correct + 1) % exercise.options.length;
    case "articleSelect":
      return (exercise.correct + 1) % exercise.articles.length;
    case "wordBank":
      return [...(correctAnswerFor(exercise) as number[])].reverse();
    case "typeAnswer":
    case "conjugationCloze":
    case "dictation":
      return "xyzzy";
    case "match":
      return null;
    case "speakRepetition":
    case "speakProduction":
      return { spoken: true, finalTranscript: "xyzzy plugh", alternatives: [], assisted: false };
    case "guidedWriting":
      return { written: true, kind: "text", text: "xyzzy" };
    case "simpleForm":
      return { written: true, kind: "form", values: Object.fromEntries(exercise.fields.map((f) => [f.id, "xyzzy"])) };
    case "interactionScenario":
      return {
        interaction: true,
        goalMet: false,
        passedFirstTry: false,
        scoredTurns: 3,
        matchedFirstTry: 0,
        supportUsed: 2,
        repairMoves: 1,
        technicallyIncomplete: false,
      };
  }
}

// ---------------------------------------------------------------------------
// Reducer traces
// ---------------------------------------------------------------------------

export type TraceRow = {
  action: string;
  stepId: string | null;
  status: SessionMachineState["status"];
  index: number;
  queue: number;
  completed: number;
  finished: boolean;
};

export type TraceResult = {
  rows: TraceRow[];
  final: Pick<
    SessionMachineState,
    "attempts" | "firstResults" | "wrongCounts" | "skipped" | "completedCount" | "finished"
  > & { queueIds: string[] };
};

function row(action: string, s: SessionMachineState): TraceRow {
  return {
    action,
    stepId: currentStep(s)?.stepId ?? null,
    status: s.status,
    index: s.index,
    queue: s.queue.length,
    completed: s.completedCount,
    finished: s.finished,
  };
}

export type Script = "correct" | "wrong" | "wrong-then-undo" | "skip";

/**
 * Drive the reducer through a session with a scripted verdict per first
 * encounter (retries are always answered correctly), recording the state
 * after every action.
 */
export function traceSession(
  steps: SessionStep[],
  retryPolicy: "untilCorrect" | "none",
  scriptFor: (stepId: string, encounter: number) => Script,
  maxActions = 400,
  courseId = "fr-en"
): TraceResult {
  let s = sessionReducer(emptySessionState(), { type: "start", sessionId: "golden", courseId, steps, retryPolicy });
  const rows: TraceRow[] = [row("start", s)];
  const encounters: Record<string, number> = {};
  const apply = (label: string, action: SessionAction) => {
    s = sessionReducer(s, action);
    rows.push(row(label, s));
  };
  let guard = 0;
  while (!s.finished && guard++ < maxActions) {
    const step = currentStep(s);
    if (!step) break;
    if (step.type !== "exercise") {
      apply("teachContinue", { type: "teachContinue" });
      continue;
    }
    const encounter = encounters[step.stepId] ?? 0;
    encounters[step.stepId] = encounter + 1;
    const script = encounter === 0 ? scriptFor(step.stepId, encounter) : "correct";
    const ex = step.exercise;
    if (ex.type === "match") {
      apply(`matchComplete:${script}`, { type: "matchComplete", wrongAttempts: script === "wrong" ? 1 : 0 });
      continue;
    }
    if (script === "skip") {
      apply("skip", { type: "skip" });
      continue;
    }
    if (script === "wrong-then-undo") {
      apply("answer:wrong", { type: "answer", value: wrongAnswerFor(ex) });
      apply("check", { type: "check" });
      apply("undoCurrent", { type: "undoCurrent" });
      apply("answer:correct", { type: "answer", value: correctAnswerFor(ex) });
      apply("check", { type: "check" });
      apply("continue", { type: "continue" });
      continue;
    }
    apply(`answer:${script}`, {
      type: "answer",
      value: script === "wrong" ? wrongAnswerFor(ex) : correctAnswerFor(ex),
    });
    apply("check", { type: "check" });
    apply("continue", { type: "continue" });
  }
  return {
    rows,
    final: {
      attempts: s.attempts,
      firstResults: s.firstResults,
      wrongCounts: s.wrongCounts,
      skipped: s.skipped,
      completedCount: s.completedCount,
      finished: s.finished,
      queueIds: s.queue.map((q) => q.stepId),
    },
  };
}

/** Correct / wrong / wrong-then-undo / correct… by position, for variety. */
export function cyclingScript(allowSkip = false): (stepId: string, encounter: number) => Script {
  let n = 0;
  const cycle: Script[] = allowSkip
    ? ["correct", "wrong", "skip", "wrong-then-undo", "correct"]
    : ["correct", "wrong", "wrong-then-undo", "correct"];
  return () => cycle[n++ % cycle.length];
}
