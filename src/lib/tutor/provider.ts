/**
 * The OPTIONAL AI-tutor seam (P9 §50-§61) — a port, not a feature.
 *
 * Hard rules this module encodes and the tests pin:
 *
 *  - The app NEVER holds a model API key: not in the bundle, not in
 *    AsyncStorage or SecureStore, not typed in by the user (no BYOK UI),
 *    and it never calls a model vendor directly (§51). The only
 *    acceptable live transport, if one ever ships, is an AUTHENTICATED
 *    proxy the project operates — never an open/unauthenticated one
 *    (§60). No such backend exists today.
 *  - Therefore PRODUCTION IS DISABLED (§109): productionTutorProvider()
 *    returns the disabled provider, every tutor UI surface stays hidden,
 *    and the app remains 100% offline. This is the intended final state
 *    of this phase, not a stub for one.
 *  - A tutor may EXPLAIN, SUGGEST and ENCOURAGE — it may never grade
 *    (§56, §69): nothing in the grading, assessment, learning or session
 *    layers may import this module, and no TutorFeedback value can reach
 *    checkpoint scores, FSRS state, placement, CEFR estimates or attempt
 *    history. Results are identical with the provider disabled.
 *  - CI never depends on a live paid call (§61): tests use the
 *    deterministic mock provider, nothing else.
 *  - If a live provider ever ships, sending learner text to it requires
 *    the learner's explicit per-feature opt-in beforehand (§59) — the
 *    context shape below carries only the current task and the learner's
 *    own production, never history, identifiers or store state.
 */

/** What a tutor may see: the task at hand and the learner's own attempt. */
export type TutorContext = {
  kind: "writing" | "speaking" | "interaction";
  /** The task instruction the learner faced (English). */
  instruction: string;
  /** The learner's own production (their text, or the heard transcript). */
  learnerText: string;
  /**
   * The deterministic engine's honest findings (missing slots, unmatched
   * intent, …) — the tutor explains THESE; it never produces its own
   * verdict.
   */
  deterministicFindings: string[];
};

/** Structured, display-only feedback. Never a score, never a verdict. */
export type TutorFeedback = {
  encouragement: string;
  explanations: { point: string; example?: string }[];
  suggestions: string[];
};

export interface TutorProvider {
  readonly id: string;
  /** UI surfaces render ONLY when this is true. */
  readonly available: boolean;
  explain(context: TutorContext): Promise<TutorFeedback>;
}

/** The production provider: disabled, permanently offline (§109). */
export class DisabledTutorProvider implements TutorProvider {
  readonly id = "disabled";
  readonly available = false;
  explain(): Promise<TutorFeedback> {
    return Promise.reject(
      new Error("tutor is disabled: no authenticated backend exists (§60/§109)")
    );
  }
}

/**
 * Production configuration — DISABLED by design. Changing this to a live
 * provider requires an authenticated project-operated proxy (§60), an
 * explicit privacy opt-in flow (§59), and its own review; it can never be
 * flipped by content, config or environment values.
 */
export function productionTutorProvider(): TutorProvider {
  return new DisabledTutorProvider();
}
