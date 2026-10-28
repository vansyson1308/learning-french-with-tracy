/**
 * D-10 (owner decision 2026-10-29, plan/prompts/P-ai-review.md): content may be
 * reviewed by an AI-simulated native reviewer instead of a paid one. The
 * compile gate accepts `review.kind: "ai-simulated"` only when the owner has
 * recorded acceptance for that course in plan/OWNER-FINAL-CHECKLIST.md.
 */
import { describe, expect, test } from "bun:test";

import { aiReviewAccepted, reviewGateErrors } from "../lib/pipeline";

const AI = { kind: "ai-simulated" as const, reviewer: "Claude (simulated native reviewer)", date: "2026-10-29", scope: "answer keys, Spanish, Vietnamese", report: "content/es/REVIEW-AI.md" };
const CHECKLIST_OK = "- ☑ **Chấp nhận duyệt AI** `ai-review:es-vi` — anh Sơn, 2026-10-30\n";
const CHECKLIST_OPEN = "- ☐ **Chấp nhận duyệt AI** `ai-review:es-vi`\n";

describe("review gate (P3c + D-10)", () => {
  test("an owner-accepted AI review passes; an unticked or missing acceptance fails", () => {
    expect(aiReviewAccepted("es-vi", CHECKLIST_OK)).toBe(true);
    expect(aiReviewAccepted("es-vi", CHECKLIST_OPEN)).toBe(false);
    expect(aiReviewAccepted("fr-vi", CHECKLIST_OK)).toBe(false);
    expect(reviewGateErrors("es-vi", { review: AI }, { knownLimitations: "", ownerChecklist: CHECKLIST_OK })).toEqual([]);
    expect(reviewGateErrors("es-vi", { review: AI }, { knownLimitations: "", ownerChecklist: CHECKLIST_OPEN })[0]).toContain("owner acceptance");
  });

  test("a native review, or allowUnreviewed named in KNOWN_LIMITATIONS, passes as before", () => {
    expect(reviewGateErrors("es-vi", { review: { native: "Lan", date: "2026-10-30" } }, { knownLimitations: "", ownerChecklist: "" })).toEqual([]);
    expect(reviewGateErrors("es-vi", { allowUnreviewed: true }, { knownLimitations: "es-vi ships unreviewed", ownerChecklist: "" })).toEqual([]);
    expect(reviewGateErrors("es-vi", { allowUnreviewed: true }, { knownLimitations: "", ownerChecklist: "" })[0]).toContain("KNOWN_LIMITATIONS");
    expect(reviewGateErrors("es-vi", {}, { knownLimitations: "", ownerChecklist: "" })[0]).toContain("no native review recorded");
  });
});
