/**
 * P4e session 4 (coordinator, 2026-11-05): the ko-vi section checkpoints and the A1 capstone come in 2 parallel forms
 * built from reserved records only, and placement has 4 stages. Reads the staged assessment files (staged until
 * promote; the course-draft validator checks the full contract, this test pins the shape the coordinator asked for).
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "fs";

import { readJson } from "../lib/pipeline";

const STAGED = "content/ko/_drafts/staged/content/ko/assessment";
const at = (f: string) => (existsSync(`${STAGED}/${f}`) ? `${STAGED}/${f}` : `content/ko/assessment/${f}`);
const CPS = at("checkpoints.json");
const PLACEMENT = at("placement.json");

type Exercise = { type: string; clipId?: string; readingId?: string; speechItemId?: string; writingTaskId?: string; scenarioId?: string; answer?: string; alternatives?: string[] };
type Item = { id: string; exercise: Exercise; objectiveTargets: string[] };
type Checkpoint = { id: string; items: Item[]; forms: { formId: string; itemIds: string[] }[]; criteria: { minItemsPerObjective: number } };
const checkpoints = (): Checkpoint[] => (readJson(CPS) as { checkpoints: Checkpoint[] }).checkpoints;

describe("ko-vi checkpoints", () => {
  test.skipIf(!existsSync(CPS))("6 section checkpoints and the capstone, 2 disjoint forms each, every sampled objective ≥ 2 items per form", () => {
    const cps = checkpoints();
    expect(cps.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6].map((n) => `ko.checkpoint.section-${n}`).concat("ko.checkpoint.a1-capstone"));
    for (const cp of cps) {
      expect(cp.forms.map((f) => f.formId), cp.id).toEqual(["a", "b"]);
      const [a, b] = cp.forms.map((f) => new Set(f.itemIds));
      expect([...a].filter((x) => b.has(x)), `${cp.id}: forms share items`).toEqual([]);
      const byId = new Map(cp.items.map((i) => [i.id, i]));
      for (const form of cp.forms) {
        const count = new Map<string, number>();
        for (const id of form.itemIds) for (const o of byId.get(id)!.objectiveTargets) count.set(o, (count.get(o) ?? 0) + 1);
        for (const [o, n] of count) expect(n, `${cp.id}/${form.formId} ${o}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test.skipIf(!existsSync(CPS))("scored inputs are reserved assessment records, never a teaching stimulus", () => {
    const refs = checkpoints().flatMap((c) => c.items.map((i) => i.exercise))
      .flatMap((e) => [e.clipId, e.readingId, e.speechItemId, e.writingTaskId, e.scenarioId].filter((x): x is string => !!x));
    expect(refs.length).toBeGreaterThan(50);
    expect(refs.filter((r) => !/[._](cp\d|a1cap)_/.test(r))).toEqual([]);
  });

  test.skipIf(!existsSync(CPS))("the essential objectives without lesson-only coverage are sampled (script, register, negation)", () => {
    const targets = checkpoints().flatMap((c) => c.items.flatMap((i) => i.objectiveTargets));
    for (const o of ["ko.obj.script.hangul", "ko.obj.politeness.speech_levels", "ko.obj.negation.an_mot"]) {
      expect(targets.filter((t) => t === o).length, o).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("ko-vi placement", () => {
  test.skipIf(!existsSync(PLACEMENT))("4 stages in curriculum order", () => {
    const stages = (readJson(PLACEMENT) as { stages: { id: string }[] }).stages;
    expect(stages.map((s) => s.id)).toEqual(["ko.pstage.foundations", "ko.pstage.building_blocks", "ko.pstage.reception", "ko.pstage.production"]);
  });
});
