/**
 * Deterministic mock tutor (P9 §61): the ONLY provider tests may use —
 * CI never depends on a live paid call. Pure function of its input, no
 * network, no randomness. Production code never imports this module; it
 * exists so the seam's contract (structured feedback in, zero influence
 * on grading out) is exercisable in tests today and by a future
 * authenticated backend integration later.
 */

import type { TutorContext, TutorFeedback, TutorProvider } from "./provider";

export class MockTutorProvider implements TutorProvider {
  readonly id = "mock";
  readonly available = true;

  explain(context: TutorContext): Promise<TutorFeedback> {
    const findings = context.deterministicFindings;
    return Promise.resolve({
      encouragement:
        findings.length === 0
          ? "Nice work — that does the job in French."
          : "Good attempt — one thing would make it complete.",
      explanations: findings.map((point) => ({ point })),
      suggestions:
        findings.length === 0
          ? []
          : [`Re-read the task and add: ${findings.join("; ")}.`],
    });
  }
}
