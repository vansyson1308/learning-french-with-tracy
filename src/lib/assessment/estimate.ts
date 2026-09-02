/**
 * The learner's A1 estimate (P9 §45-§49, hardened in Phase 10 Gate 2
 * §10-§16) — the LEARNER-attainment side of the claim split, pure and
 * separate from course claimability:
 *
 *  - COURSE claimability (does this course's reserved assessment system
 *    cover every A1 domain with breadth?) is a compile-time fact of the
 *    content, computed by the build gate and shipped as data.
 *  - The LEARNER estimate below derives from the learner's OWN recorded
 *    checkpoint evidence, through the documented retake policy (latest
 *    real verdict per objective; insufficient evidence falls through),
 *    measured against an AUTHORED attainment policy: for every domain, the
 *    content names the objectives a learner must actually demonstrate.
 *    A domain is never completed by "any one objective", and the A1
 *    Capstone — which samples one objective per domain — can contribute
 *    evidence but can never complete a domain by itself.
 *
 * Honesty rules baked in: a domain without evidence — including speech
 * skipped on a device that cannot record — leaves the estimate INCOMPLETE,
 * never "failed" (§44); placement estimates never count (demonstration
 * requires checkpoint evidence, §38); the overall estimate is shown only
 * when the COURSE is claimable AND every domain satisfies the policy
 * (§15); and the wording is always "CEFR-aligned A1 estimate", never a
 * certification (§16/§47).
 */

import type { ObjectiveLearnerState } from "./states";

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

/** Domains whose checkpoints require a device that can score speech. */
export const SPEECH_DOMAINS: ReadonlySet<A1Domain> = new Set<A1Domain>([
  "spoken_production",
  "interaction",
]);

/** The compiled attainment policy (content/fr/assessment/attainment.json). */
export type A1AttainmentPolicy = {
  level: string;
  domains: { domain: string; requiredObjectiveIds: string[] }[];
};

/**
 * demonstrated — EVERY required objective of the domain carries a
 *   checkpoint "demonstrated" verdict under the latest-attempt policy;
 * needs_practice — at least one required objective's latest real verdict
 *   says practice first (other objectives may already be demonstrated);
 * partial — some required objectives are demonstrated and the rest have
 *   no real verdict yet (e.g. only the capstone's sample so far);
 * technical_unavailable — nothing scored yet AND the domain needs speech
 *   scoring that this device cannot provide (known limitation, never a
 *   judgement of the learner);
 * no_evidence — nothing scored yet (never attempted, or only insufficient
 *   evidence).
 */
export type DomainEstimateStatus =
  | "demonstrated"
  | "needs_practice"
  | "partial"
  | "technical_unavailable"
  | "no_evidence";

export type DomainEstimate = {
  domain: A1Domain;
  status: DomainEstimateStatus;
  /** The authored denominator — what this domain requires. */
  requiredObjectives: string[];
  /** Required objectives currently demonstrated. */
  demonstratedObjectives: string[];
  /** Required objectives whose latest real verdict is needs_practice. */
  needsPracticeObjectives: string[];
  /** Required objectives with no real verdict yet. */
  missingObjectives: string[];
  requiresSpeech: boolean;
};

export type A1Estimate = {
  level: "A1";
  /** Whether the COURSE can assess A1 at all (compiled claim gate). */
  courseClaimable: boolean;
  domains: DomainEstimate[];
  /**
   * demonstrated — course claimable AND every domain demonstrated.
   * Anything less is INCOMPLETE (§44) — a gap is a gap, never a failure.
   */
  overall: "demonstrated" | "incomplete";
  /** Domains not yet demonstrated, for honest wording. */
  missingDomains: A1Domain[];
};

export function deriveA1Estimate(input: {
  policy: A1AttainmentPolicy;
  states: Record<string, ObjectiveLearnerState>;
  courseClaimable: boolean;
  /** Device speech-scoring capability; null/undefined = not yet known. */
  speechAvailable?: boolean | null;
}): A1Estimate {
  const domains: DomainEstimate[] = A1_DOMAINS.map((domain) => {
    const required = [
      ...(input.policy.domains.find((d) => d.domain === domain)?.requiredObjectiveIds ?? []),
    ].sort();
    const demonstrated = required.filter((id) => input.states[id] === "demonstrated");
    const needsPractice = required.filter((id) => input.states[id] === "needs_practice");
    const missing = required.filter(
      (id) => input.states[id] !== "demonstrated" && input.states[id] !== "needs_practice"
    );
    const requiresSpeech = SPEECH_DOMAINS.has(domain);
    let status: DomainEstimateStatus;
    if (required.length > 0 && demonstrated.length === required.length) {
      status = "demonstrated";
    } else if (needsPractice.length > 0) {
      status = "needs_practice";
    } else if (demonstrated.length > 0) {
      status = "partial";
    } else if (requiresSpeech && input.speechAvailable === false) {
      status = "technical_unavailable";
    } else {
      status = "no_evidence";
    }
    return {
      domain,
      status,
      requiredObjectives: required,
      demonstratedObjectives: demonstrated,
      needsPracticeObjectives: needsPractice,
      missingObjectives: missing,
      requiresSpeech,
    };
  });
  const missingDomains = domains
    .filter((d) => d.status !== "demonstrated")
    .map((d) => d.domain);
  return {
    level: "A1",
    courseClaimable: input.courseClaimable,
    domains,
    overall:
      input.courseClaimable && missingDomains.length === 0 ? "demonstrated" : "incomplete",
    missingDomains,
  };
}
