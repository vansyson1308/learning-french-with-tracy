/**
 * The A1 claim split (P9 §45-§49), hardened in Phase 10 Gate 2 (§10-§16):
 * course claimability is a compiled fact of the content; the LEARNER
 * estimate derives only from the learner's own checkpoint evidence,
 * measured against the AUTHORED attainment policy — every required
 * objective of every domain, never "any one objective", and never the
 * capstone alone. A gap is always "incomplete", never "failed" (§44).
 */
import { describe, expect, test } from "bun:test";

import {
  allObjectives,
  attainmentPolicy,
  checkpointFor,
  courseClaim,
  courseClaimableAt,
} from "../assessment/content";
import { A1_DOMAINS, SPEECH_DOMAINS, deriveA1Estimate } from "../assessment/estimate";
import type { ObjectiveLearnerState } from "../assessment/states";

const objectives = allObjectives();
const policy = attainmentPolicy();
const required = new Set(policy.domains.flatMap((d) => d.requiredObjectiveIds));

function statesWhere(
  fn: (id: string) => ObjectiveLearnerState
): Record<string, ObjectiveLearnerState> {
  return Object.fromEntries(objectives.map((o) => [o.id, fn(o.id)]));
}

const estimateFor = (
  fn: (id: string) => ObjectiveLearnerState,
  extra: { courseClaimable?: boolean; speechAvailable?: boolean | null } = {}
) =>
  deriveA1Estimate({
    policy,
    states: statesWhere(fn),
    courseClaimable: extra.courseClaimable ?? true,
    speechAvailable: extra.speechAvailable,
  });

describe("course claimability (compiled, §45-§47)", () => {
  test("the course is A1-claimable as an assessment system; PRE_A1/A2 are not", () => {
    expect(courseClaimableAt("A1")).toBe(true);
    expect(courseClaimableAt("PRE_A1")).toBe(false);
    expect(courseClaimableAt("A2")).toBe(false);
  });

  test("the wording is an estimate, never a certification", () => {
    const wording = courseClaim().claimWording;
    expect(wording).toContain("CEFR-aligned estimate");
    expect(wording).toContain("not an official");
    expect(wording.toLowerCase()).not.toContain("certified");
  });
});

describe("the authored attainment policy (Phase 10 §11-§12)", () => {
  test("names every A1 domain with an explicit, reviewable denominator", () => {
    expect(policy.level).toBe("A1");
    expect(policy.domains.map((d) => d.domain).sort()).toEqual([...A1_DOMAINS].sort());
    for (const d of policy.domains) expect(d.requiredObjectiveIds.length).toBeGreaterThanOrEqual(2);
    expect(required.size).toBe(14);
  });

  test("every required objective is an ESSENTIAL, direct-A1 objective of its domain", () => {
    for (const d of policy.domains) {
      for (const id of d.requiredObjectiveIds) {
        const o = objectives.find((x) => x.id === id)!;
        expect(o).toBeDefined();
        expect(o.category).toBe(d.domain as typeof o.category);
        expect(o.essential).toBe(true);
        expect(o.cefrAlignments.some((a) => a.level === "A1" && a.relation === "direct")).toBe(true);
      }
    }
  });

  test("no essential direct-A1 objective is missing from its domain's requirement (nothing omitted silently)", () => {
    for (const o of objectives) {
      const direct = o.cefrAlignments.some((a) => a.level === "A1" && a.relation === "direct");
      if (!direct || !o.essential) continue;
      if (!(A1_DOMAINS as readonly string[]).includes(o.category)) continue;
      expect({ id: o.id, required: required.has(o.id) }).toEqual({ id: o.id, required: true });
    }
  });
});

describe("learner A1 estimate (§48, hardened §10-§15)", () => {
  test("a fresh learner: every domain no_evidence, overall incomplete — never failed", () => {
    const estimate = estimateFor(() => "not_started");
    expect(estimate.overall).toBe("incomplete");
    expect(estimate.missingDomains).toEqual([...A1_DOMAINS]);
    for (const d of estimate.domains) {
      expect(d.status).toBe("no_evidence");
      expect(d.demonstratedObjectives).toEqual([]);
      expect(d.missingObjectives).toEqual(d.requiredObjectives);
    }
  });

  test("ONE demonstrated direct objective per domain is PARTIAL, not demonstrated (§10)", () => {
    const oneEach = new Set(policy.domains.map((d) => d.requiredObjectiveIds[0]));
    const estimate = estimateFor((id) => (oneEach.has(id) ? "demonstrated" : "learning"));
    expect(estimate.overall).toBe("incomplete");
    for (const d of estimate.domains) {
      expect(d.status).toBe("partial");
      expect(d.demonstratedObjectives.length).toBe(1);
      expect(d.missingObjectives.length).toBe(d.requiredObjectives.length - 1);
    }
  });

  test("every required objective demonstrated completes the estimate", () => {
    const estimate = estimateFor((id) => (required.has(id) ? "demonstrated" : "learning"));
    expect(estimate.overall).toBe("demonstrated");
    expect(estimate.missingDomains).toEqual([]);
    for (const d of estimate.domains) expect(d.status).toBe("demonstrated");
  });

  test("all-but-one required objective demonstrated leaves that domain partial and the whole incomplete", () => {
    const [skipped] = policy.domains.find((d) => d.domain === "written_reception")!.requiredObjectiveIds;
    const estimate = estimateFor((id) =>
      required.has(id) && id !== skipped ? "demonstrated" : "learning"
    );
    expect(estimate.overall).toBe("incomplete");
    expect(estimate.missingDomains).toEqual(["written_reception"]);
    const reading = estimate.domains.find((d) => d.domain === "written_reception")!;
    expect(reading.status).toBe("partial");
    expect(reading.missingObjectives).toEqual([skipped]);
  });

  test("the overall estimate is withheld unless the COURSE is claimable, even with full evidence (§15)", () => {
    const estimate = estimateFor((id) => (required.has(id) ? "demonstrated" : "learning"), {
      courseClaimable: false,
    });
    expect(estimate.overall).toBe("incomplete");
    expect(estimate.courseClaimable).toBe(false);
    for (const d of estimate.domains) expect(d.status).toBe("demonstrated");
  });

  test("a device-limited learner (speech skipped → no verdicts) is INCOMPLETE, never failed", () => {
    const estimate = estimateFor(
      (id) => {
        const o = objectives.find((x) => x.id === id)!;
        return o.category === "spoken_production" || o.category === "interaction"
          ? "learning"
          : required.has(id)
            ? "demonstrated"
            : "learning";
      },
      { speechAvailable: false }
    );
    expect(estimate.overall).toBe("incomplete");
    expect(estimate.missingDomains).toEqual(["spoken_production", "interaction"]);
    for (const d of estimate.domains) {
      if (SPEECH_DOMAINS.has(d.domain)) {
        expect(d.status).toBe("technical_unavailable"); // a device fact, never a judgement
        expect(d.requiresSpeech).toBe(true);
      } else {
        expect(d.status).toBe("demonstrated");
      }
    }
  });

  test("technical_unavailable is only used when the device is KNOWN to be unable to score speech", () => {
    const unknown = estimateFor(() => "not_started", { speechAvailable: null });
    const capable = estimateFor(() => "not_started", { speechAvailable: true });
    for (const e of [unknown, capable]) {
      for (const d of e.domains) expect(d.status).toBe("no_evidence");
    }
  });

  test("a demonstrated verdict beats the device: prior speech evidence stays demonstrated on a limited device", () => {
    const estimate = estimateFor((id) => (required.has(id) ? "demonstrated" : "learning"), {
      speechAvailable: false,
    });
    expect(estimate.overall).toBe("demonstrated");
  });

  test("needs_practice shows as its own honest status; placement estimates never count", () => {
    const estimate = estimateFor((id) => {
      const o = objectives.find((x) => x.id === id)!;
      if (o.category === "interaction") return "needs_practice";
      // "estimated" is placement-only — it must NOT demonstrate a domain.
      return "estimated";
    });
    expect(estimate.overall).toBe("incomplete");
    const interaction = estimate.domains.find((d) => d.domain === "interaction")!;
    expect(interaction.status).toBe("needs_practice");
    expect(interaction.needsPracticeObjectives).toEqual(interaction.requiredObjectives);
    for (const d of estimate.domains.filter((x) => x.domain !== "interaction")) {
      expect(d.status).toBe("no_evidence");
    }
  });

  test("needs_practice on one required objective outranks partial success on the others", () => {
    const listening = policy.domains.find((d) => d.domain === "spoken_reception")!.requiredObjectiveIds;
    const [weak, ...strong] = listening;
    const estimate = estimateFor((id) =>
      id === weak ? "needs_practice" : strong.includes(id) ? "demonstrated" : "learning"
    );
    const domain = estimate.domains.find((d) => d.domain === "spoken_reception")!;
    expect(domain.status).toBe("needs_practice");
    expect(domain.demonstratedObjectives).toEqual([...strong].sort());
    expect(domain.needsPracticeObjectives).toEqual([weak]);
  });
});

describe("the capstone cannot shortcut a domain (Phase 10 §13)", () => {
  const capstone = checkpointFor("fr.checkpoint.a1-capstone")!;
  const capstoneObjectives = new Set(capstone.items.flatMap((i) => i.objectiveTargets));

  test("data: the capstone samples a STRICT subset of every domain's required objectives", () => {
    for (const d of policy.domains) {
      const sampled = d.requiredObjectiveIds.filter((id) => capstoneObjectives.has(id));
      expect(sampled.length).toBeGreaterThanOrEqual(1);
      expect(sampled.length).toBeLessThan(d.requiredObjectiveIds.length);
    }
  });

  test("behaviour: a perfect capstone alone leaves every domain PARTIAL and the estimate incomplete", () => {
    const estimate = estimateFor((id) => (capstoneObjectives.has(id) ? "demonstrated" : "not_started"));
    expect(estimate.overall).toBe("incomplete");
    expect(estimate.missingDomains).toEqual([...A1_DOMAINS]);
    for (const d of estimate.domains) {
      expect(d.status).toBe("partial");
      expect(d.missingObjectives.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("behaviour: capstone plus every section checkpoint's objectives completes it", () => {
    const estimate = estimateFor((id) =>
      capstoneObjectives.has(id) || required.has(id) ? "demonstrated" : "learning"
    );
    expect(estimate.overall).toBe("demonstrated");
  });
});
