/**
 * Parallel-form integrity audit (Phase 10 Gate 3, §20) over the committed
 * checkpoint banks: disjointness, equivalent construct coverage, the
 * per-objective floor, stimulus independence, no dead items, versioning,
 * and retake rotation.
 */
import { describe, expect, test } from "bun:test";

import { selectCheckpointForm } from "../../src/lib/assessment/checkpoint";
import { loadCheckpoints } from "../lib/assessment";

const { checkpoints } = loadCheckpoints();
const withForms = checkpoints.filter((cp) => cp.forms && cp.forms.length >= 2);

type Item = (typeof checkpoints)[number]["items"][number];

function stimulusId(item: Item): string | null {
  const e = item.exercise as Record<string, unknown>;
  for (const key of ["clipId", "readingId", "scenarioId", "writingTaskId", "speechItemId"]) {
    if (typeof e[key] === "string") return `${key}:${e[key]}`;
  }
  return null;
}

describe("checkpoint forms", () => {
  test("the capstone declares parallel forms; section checkpoints are single-form banks", () => {
    expect(withForms.map((cp) => cp.id)).toEqual(["fr.checkpoint.a1-capstone"]);
    for (const cp of checkpoints) expect(cp.formVersion).toBeGreaterThanOrEqual(1);
  });

  for (const cp of withForms) {
    const forms = cp.forms!;
    const byId = new Map(cp.items.map((i) => [i.id, i]));

    test(`${cp.id}: forms are pairwise disjoint and together cover the whole bank`, () => {
      const seen = new Map<string, string>();
      for (const form of forms) {
        for (const id of form.itemIds) {
          expect(byId.has(id)).toBe(true);
          expect({ id, firstForm: seen.get(id) ?? form.formId }).toEqual({ id, firstForm: form.formId });
          seen.set(id, form.formId);
        }
      }
      expect(seen.size).toBe(cp.items.length); // no dead bank items
    });

    test(`${cp.id}: every form covers the same objectives with the same item counts and exercise types`, () => {
      const signature = (form: (typeof forms)[number]) => {
        const objectives = new Map<string, number>();
        const types = new Map<string, number>();
        for (const id of form.itemIds) {
          const item = byId.get(id)!;
          for (const oid of item.objectiveTargets) objectives.set(oid, (objectives.get(oid) ?? 0) + 1);
          types.set(item.exercise.type, (types.get(item.exercise.type) ?? 0) + 1);
        }
        return {
          objectives: [...objectives.entries()].sort(),
          types: [...types.entries()].sort(),
          size: form.itemIds.length,
        };
      };
      const [first, ...rest] = forms.map(signature);
      for (const other of rest) expect(other).toEqual(first);
      for (const [, count] of first.objectives) {
        expect(count).toBeGreaterThanOrEqual(cp.criteria.minItemsPerObjective);
      }
    });

    test(`${cp.id}: forms share no stimulus (clip, text, scenario, task, prompt)`, () => {
      const owner = new Map<string, string>();
      for (const form of forms) {
        for (const id of form.itemIds) {
          const stimulus = stimulusId(byId.get(id)!);
          if (!stimulus) continue;
          expect({ stimulus, form: owner.get(stimulus) ?? form.formId }).toEqual({
            stimulus,
            form: form.formId,
          });
          owner.set(stimulus, form.formId);
        }
      }
    });

    test(`${cp.id}: retakes rotate through the forms in authored order`, () => {
      const ids = forms.map((f) => f.formId);
      for (let n = 0; n < ids.length * 3; n += 1) {
        expect(selectCheckpointForm(cp, n).formId).toBe(ids[n % ids.length]);
      }
    });
  }

  test("every single-form checkpoint keeps the per-objective floor for every objective it targets", () => {
    for (const cp of checkpoints) {
      if (cp.forms && cp.forms.length > 0) continue;
      const counts = new Map<string, number>();
      for (const item of cp.items) {
        for (const oid of item.objectiveTargets) counts.set(oid, (counts.get(oid) ?? 0) + 1);
      }
      for (const [oid, count] of counts) {
        expect({ cp: cp.id, oid, ok: count >= cp.criteria.minItemsPerObjective }).toEqual({
          cp: cp.id,
          oid,
          ok: true,
        });
      }
    }
  });
});
