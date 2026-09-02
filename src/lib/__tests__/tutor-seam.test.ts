/**
 * The AI-tutor seam + practice entries (P9 §50-§64):
 *
 *  - Production tutor is DISABLED (§109) — no backend exists, the app
 *    makes no network requests of its own, no UI can render a tutor surface.
 *  - §69 "AI cannot grade": nothing in the grading, assessment, learning,
 *    session, writing, speech or interaction layers imports the tutor
 *    module — the import graph makes tutor influence on any score,
 *    scheduler write, placement or attempt structurally impossible.
 *  - §51: no model-vendor API key anywhere in the client source or app
 *    configuration.
 *  - §62-§63: writing practice serves only taught writing steps; the
 *    conversation entry serves exactly one NON-reserved scenario;
 *    both rotate deterministically.
 */
import { describe, expect, test } from "bun:test";

import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

import { getPack } from "../content";
import { MockTutorProvider } from "../tutor/mock-provider";
import { DisabledTutorProvider, productionTutorProvider } from "../tutor/provider";
import {
  buildConversationPracticeSessionDefinition,
  buildWritingPracticeSessionDefinition,
} from "../session/sources";
import { interactionScenarioFor } from "../interaction/content";

describe("production tutor is disabled (§109)", () => {
  test("the production provider is the disabled one and refuses to explain", async () => {
    const provider = productionTutorProvider();
    expect(provider.id).toBe("disabled");
    expect(provider.available).toBe(false);
    expect(provider instanceof DisabledTutorProvider).toBe(true);
    await expect(
      provider.explain({
        kind: "writing",
        instruction: "n/a",
        learnerText: "n/a",
        deterministicFindings: [],
      })
    ).rejects.toThrow(/disabled/);
  });

  test("the mock is deterministic, structured, and never a verdict (§56/§61)", async () => {
    const mock = new MockTutorProvider();
    const context = {
      kind: "writing" as const,
      instruction: "Write a note to Paul.",
      learnerText: "Salut Paul",
      deterministicFindings: ["the train time"],
    };
    const first = await mock.explain(context);
    const second = await mock.explain(context);
    expect(first).toEqual(second);
    expect(first.explanations).toEqual([{ point: "the train time" }]);
    // Structured feedback carries no score-like fields at all.
    expect(Object.keys(first).sort()).toEqual([
      "encouragement",
      "explanations",
      "suggestions",
    ]);
  });
});

describe("§69: the import graph makes tutor grading impossible", () => {
  const FORBIDDEN_IMPORTERS = [
    "src/lib/grading.ts",
    "src/lib/store.ts",
    "src/lib/writing",
    "src/lib/speech",
    "src/lib/interaction",
    "src/lib/assessment",
    "src/lib/learning",
    "src/lib/session",
  ];

  function sourceFiles(path: string): string[] {
    const stats = statSync(path, { throwIfNoEntry: false });
    if (!stats) return [];
    if (stats.isFile()) return [path];
    return readdirSync(path)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
      .map((f) => join(path, f));
  }

  test("no grading/assessment/learning/session module imports the tutor", () => {
    for (const root of FORBIDDEN_IMPORTERS) {
      for (const file of sourceFiles(root)) {
        const source = readFileSync(file, "utf8");
        expect({ file, importsTutor: /from\s+["'].*tutor/.test(source) }).toEqual({
          file,
          importsTutor: false,
        });
      }
    }
  });

  test("no model-vendor API key appears in the client source or config (§51)", () => {
    const keyPattern = /(OPENAI_API_KEY|ANTHROPIC_API_KEY|sk-[A-Za-z0-9]{20})/;
    const roots = ["src", "app.json", "eas.json", "package.json"];
    const scan = (path: string) => {
      // This file necessarily spells the patterns it hunts for.
      if (path.endsWith("tutor-seam.test.ts")) return;
      const stats = statSync(path, { throwIfNoEntry: false });
      if (!stats) return;
      if (stats.isFile()) {
        if (!/\.(ts|tsx|js|json)$/.test(path)) return;
        const content = readFileSync(path, "utf8");
        expect({ path, hasKey: keyPattern.test(content) }).toEqual({ path, hasKey: false });
        return;
      }
      for (const entry of readdirSync(path)) scan(join(path, entry));
    };
    for (const root of roots) scan(root);
  });
});

describe("practice entries (§62-§63)", () => {
  test("writing practice serves only taught writing steps, capped and deterministic", () => {
    const pack = getPack("fr-en");
    const a = buildWritingPracticeSessionDefinition({ pack, seedKey: "2026-08-29" });
    const b = buildWritingPracticeSessionDefinition({ pack, seedKey: "2026-08-29" });
    expect(a.steps.map((s) => s.stepId)).toEqual(b.steps.map((s) => s.stepId));
    expect(a.steps.length).toBeGreaterThanOrEqual(1);
    expect(a.steps.length).toBeLessThanOrEqual(4);
    for (const step of a.steps) {
      if (step.type !== "exercise") throw new Error("writing practice has only exercises");
      expect(["guidedWriting", "simpleForm"]).toContain(step.exercise.type);
    }
    expect(a.completion).toBe("practice");
    expect(a.trackMistakes).toBe(false);
    // Rotation: some other day picks a different set eventually.
    const days = ["2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02"];
    const rotated = days.some(
      (day) =>
        buildWritingPracticeSessionDefinition({ pack, seedKey: day })
          .steps.map((s) => s.stepId)
          .join() !== a.steps.map((s) => s.stepId).join()
    );
    expect(rotated).toBe(true);
  });

  test("conversation practice is ONE non-reserved scenario, deterministic per day", () => {
    const a = buildConversationPracticeSessionDefinition({ seedKey: "2026-08-29" });
    expect(a.steps.length).toBe(1);
    const step = a.steps[0];
    if (step.type !== "exercise" || step.exercise.type !== "interactionScenario") {
      throw new Error("conversation practice is one interaction step");
    }
    const scenario = interactionScenarioFor(step.exercise.scenarioId)!;
    expect(scenario.reserved).toBe(false);
    expect(
      buildConversationPracticeSessionDefinition({ seedKey: "2026-08-29" }).steps[0].stepId
    ).toBe(step.stepId);
    const days = ["2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03"];
    const rotated = days.some(
      (day) =>
        buildConversationPracticeSessionDefinition({ seedKey: day }).steps[0].stepId !==
        step.stepId
    );
    expect(rotated).toBe(true);
  });
});
