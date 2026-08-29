/**
 * The learner's A1 estimate (P9 §45-§49) — the LEARNER-attainment side of
 * the claim split, pure and separate from course claimability:
 *
 *  - COURSE claimability (does this course's reserved assessment system
 *    cover every A1 domain with breadth?) is a compile-time fact of the
 *    content, computed by the build gate and shipped as data.
 *  - The LEARNER estimate below derives from the learner's OWN recorded
 *    checkpoint evidence, through the documented retake policy (latest
 *    real verdict per objective; insufficient evidence falls through).
 *
 * Honesty rules baked in: a domain without evidence — including speech
 * skipped on a device that cannot record — leaves the estimate
 * INCOMPLETE, never "failed" (§44); placement estimates never count
 * (demonstration requires checkpoint evidence, §38); and the wording is
 * always "CEFR-aligned A1 estimate", never a certification (§47).
 */

import type { ObjectiveLearnerState } from "./states";
import type { CompiledObjective } from "./content";

/** The five communication domains an overall A1 estimate is made of. */
export const A1_DOMAINS = [
  "spoken_reception",
  "written_reception",
  "spoken_production",
  "written_production",
  "interaction",
] as const;
export type A1Domain = (typeof A1_DOMAINS)[number];

export const A1_DOMAIN_DISPLAY: Record<A1Domain, string> = {
  spoken_reception: "Listening",
  written_reception: "Reading",
  spoken_production: "Speaking",
  written_production: "Writing",
  interaction: "Conversation",
};

export type DomainEstimate = {
  domain: A1Domain;
  /**
   * demonstrated — ≥1 direct-A1 objective in the domain carries a
   *   checkpoint "demonstrated" verdict under the latest-attempt policy;
   * needs_practice — the learner has real verdicts here, but the latest
   *   ones say practice first;
   * no_evidence — nothing scored yet (never attempted, or only
   *   insufficient evidence, e.g. speech skipped on a limited device).
   */
  status: "demonstrated" | "needs_practice" | "no_evidence";
  /** Direct-A1 objectives currently demonstrated, for the detail rows. */
  demonstratedObjectives: string[];
};

export type A1Estimate = {
  domains: DomainEstimate[];
  /**
   * demonstrated — every domain demonstrated: the full CEFR-aligned A1
   * estimate. Anything less is INCOMPLETE (§44) — including domains at
   * needs_practice — because an estimate is only made whole by evidence,
   * and a gap is a gap, never a failure.
   */
  overall: "demonstrated" | "incomplete";
  /** Domains not yet demonstrated, for honest wording. */
  missingDomains: A1Domain[];
};

/** Direct-A1 objectives of one domain. */
function directA1Objectives(
  objectives: readonly CompiledObjective[],
  domain: A1Domain
): CompiledObjective[] {
  return objectives.filter(
    (o) =>
      o.category === domain &&
      o.cefrAlignments.some((a) => a.level === "A1" && a.relation === "direct")
  );
}

export function deriveA1Estimate(input: {
  objectives: readonly CompiledObjective[];
  states: Record<string, ObjectiveLearnerState>;
}): A1Estimate {
  const domains: DomainEstimate[] = A1_DOMAINS.map((domain) => {
    const direct = directA1Objectives(input.objectives, domain);
    const demonstrated = direct
      .filter((o) => input.states[o.id] === "demonstrated")
      .map((o) => o.id)
      .sort();
    if (demonstrated.length > 0) {
      return { domain, status: "demonstrated" as const, demonstratedObjectives: demonstrated };
    }
    const anyVerdict = direct.some((o) => input.states[o.id] === "needs_practice");
    return {
      domain,
      status: anyVerdict ? ("needs_practice" as const) : ("no_evidence" as const),
      demonstratedObjectives: [],
    };
  });
  const missingDomains = domains
    .filter((d) => d.status !== "demonstrated")
    .map((d) => d.domain);
  return {
    domains,
    overall: missingDomains.length === 0 ? "demonstrated" : "incomplete",
    missingDomains,
  };
}
