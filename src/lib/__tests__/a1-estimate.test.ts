/**
 * The A1 claim split (P9 §45-§49): course claimability is a compiled fact
 * of the content; the LEARNER estimate below derives only from the
 * learner's own checkpoint evidence — and a gap is always "incomplete",
 * never "failed" (§44).
 */
import { describe, expect, test } from "bun:test";

import { allObjectives, courseClaim, courseClaimableAt } from "../assessment/content";
import { A1_DOMAINS, deriveA1Estimate } from "../assessment/estimate";
import type { ObjectiveLearnerState } from "../assessment/states";

const objectives = allObjectives();

function statesWhere(
  fn: (id: string) => ObjectiveLearnerState
): Record<string, ObjectiveLearnerState> {
  return Object.fromEntries(objectives.map((o) => [o.id, fn(o.id)]));
}

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

describe("learner A1 estimate (§48)", () => {
  test("a fresh learner: every domain no_evidence, overall incomplete — never failed", () => {
    const estimate = deriveA1Estimate({
      objectives,
      states: statesWhere(() => "not_started"),
    });
    expect(estimate.overall).toBe("incomplete");
    expect(estimate.missingDomains).toEqual([...A1_DOMAINS]);
    for (const d of estimate.domains) expect(d.status).toBe("no_evidence");
  });

  test("demonstrating one direct objective per domain completes the estimate", () => {
    const oneEach = new Set(
      A1_DOMAINS.map(
        (domain) =>
          objectives.find(
            (o) =>
              o.category === domain &&
              o.cefrAlignments.some((a) => a.level === "A1" && a.relation === "direct")
          )!.id
      )
    );
    const estimate = deriveA1Estimate({
      objectives,
      states: statesWhere((id) => (oneEach.has(id) ? "demonstrated" : "learning")),
    });
    expect(estimate.overall).toBe("demonstrated");
    expect(estimate.missingDomains).toEqual([]);
  });

  test("a device-limited learner (speech skipped → no verdicts) is INCOMPLETE, never failed", () => {
    // Everything demonstrated except the two speech-dependent domains,
    // which have no verdicts at all (skips yield insufficient evidence).
    const estimate = deriveA1Estimate({
      objectives,
      states: statesWhere((id) => {
        const o = objectives.find((x) => x.id === id)!;
        return o.category === "spoken_production" || o.category === "interaction"
          ? "learning"
          : "demonstrated";
      }),
    });
    expect(estimate.overall).toBe("incomplete");
    expect(estimate.missingDomains).toEqual(["spoken_production", "interaction"]);
    const spoken = estimate.domains.find((d) => d.domain === "spoken_production")!;
    expect(spoken.status).toBe("no_evidence"); // not "failed" — no such state exists
  });

  test("needs_practice shows as its own honest status; placement estimates never count", () => {
    const estimate = deriveA1Estimate({
      objectives,
      states: statesWhere((id) => {
        const o = objectives.find((x) => x.id === id)!;
        if (o.category === "interaction") return "needs_practice";
        // "estimated" is placement-only — it must NOT demonstrate a domain.
        return "estimated";
      }),
    });
    expect(estimate.overall).toBe("incomplete");
    const interaction = estimate.domains.find((d) => d.domain === "interaction")!;
    expect(interaction.status).toBe("needs_practice");
    for (const d of estimate.domains.filter((x) => x.domain !== "interaction")) {
      expect(d.status).toBe("no_evidence");
    }
  });

  test("the capstone alone can complete the estimate (its five representative objectives span the domains)", () => {
    const capstoneObjectives = new Set([
      "fr.obj.listening.short_info",
      "fr.obj.reading.short_messages",
      "fr.obj.speaking.give_info",
      "fr.obj.writing.short_message",
      "fr.obj.interaction.everyday_conversation",
    ]);
    const estimate = deriveA1Estimate({
      objectives,
      states: statesWhere((id) => (capstoneObjectives.has(id) ? "demonstrated" : "not_started")),
    });
    expect(estimate.overall).toBe("demonstrated");
  });
});
