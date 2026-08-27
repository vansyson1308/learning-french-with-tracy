/**
 * Evidence gate — the single decision point between exercise evidence and
 * the scheduler (§O2b). Pure: the caller supplies whether this card was
 * already mutated in this session (from the review log), the gate decides.
 *
 * Normative rules implemented here:
 * 1. Only srsRole "assessment" may mutate; teach/practice/none never do.
 * 2. One scheduler mutation per card per session.
 * 3. A retry (attemptIndex ≥ 1) is never an assessment.
 * 4. Assisted evidence is never an assessment.
 * 5. A hint on a designated assessment forces grade Again (still mutates).
 * 6. Easy is never auto-derived — latency is logged but thresholds are
 *    unvalidated, and Easy-inflation is the risky direction for stability.
 * Every piece of evidence is logged regardless of the decision (caller's
 * responsibility; the gate only decides scheduling).
 */

import type { ReviewEvidence, SrsRole } from "./evidence";
import type { Grade } from "./scheduler";

export type GateRefusal =
  | "role-teach"
  | "role-practice"
  | "role-none"
  | "retry"
  | "assisted"
  | "already-mutated-this-session";

export type GateDecision =
  | { mutate: true; grade: Grade }
  | { mutate: false; reason: GateRefusal };

const ROLE_REFUSALS: Record<Exclude<SrsRole, "assessment">, GateRefusal> = {
  teach: "role-teach",
  practice: "role-practice",
  none: "role-none",
};

/** Launch grade policy: wrong→again, hinted→again, tolerance→hard, else good. */
export function deriveGrade(
  ev: Pick<ReviewEvidence, "correct" | "hinted" | "toleranceUsed">
): Grade {
  if (!ev.correct) return "again";
  if (ev.hinted) return "again"; // hints count as failures (§H2)
  if (ev.toleranceUsed) return "hard";
  return "good";
}

export function gateEvidence(
  ev: ReviewEvidence,
  cardAlreadyMutatedThisSession: boolean
): GateDecision {
  if (ev.srsRole !== "assessment") {
    return { mutate: false, reason: ROLE_REFUSALS[ev.srsRole] };
  }
  if (ev.attemptIndex > 0) {
    return { mutate: false, reason: "retry" };
  }
  if (ev.assisted) {
    return { mutate: false, reason: "assisted" };
  }
  if (cardAlreadyMutatedThisSession) {
    return { mutate: false, reason: "already-mutated-this-session" };
  }
  return { mutate: true, grade: deriveGrade(ev) };
}
