/**
 * Evidence → FSRS goldens (P1a): a scripted session of ReviewEvidence
 * applied to each persona's French course through the single evidence
 * path (`applyEvidence`), pinning the resulting cards, word stats and the
 * review log entry by entry.
 */
import { describe, test } from "bun:test";

import { applyEvidence, itemIdForCourse } from "../../learning/engine";
import type { ReviewEvidence } from "../../learning/evidence";
import { FR_LEXEME_IDS } from "../../learning/ids-fr";
import type { ReviewLogEntry } from "../../learning/review-log";
import type { CourseProgress } from "../../store";
import { MINUTE, NOW_MS, PERSONA_NAMES, expectGolden, migratedPersona } from "./helpers";

type Verdict = { correct: boolean; attemptIndex?: number; hinted?: boolean; assisted?: boolean; role?: ReviewEvidence["srsRole"] };

const SURFACES = Object.keys(FR_LEXEME_IDS).slice(0, 4);

function script(course: CourseProgress): ReviewEvidence[] {
  const existing = Object.keys(course.cards ?? {}).slice(0, 2);
  const items = [
    ...existing.map((k) => ({ itemId: k.slice(0, k.lastIndexOf("|")), skill: k.slice(k.lastIndexOf("|") + 1) as "recognize" | "listen" | "speak" })),
    ...SURFACES.map((s) => ({ itemId: itemIdForCourse("fr-en", s), skill: "recognize" as const })),
    { itemId: itemIdForCourse("fr-en", SURFACES[0]), skill: "listen" as const },
    { itemId: itemIdForCourse("fr-en", SURFACES[1]), skill: "speak" as const },
  ];
  const verdicts: Verdict[] = [
    { correct: true },
    { correct: false },
    { correct: true, attemptIndex: 1 },
    { correct: true, hinted: true },
    { correct: true, assisted: true },
    { correct: false, role: "practice" },
    { correct: true },
    { correct: true },
  ];
  return items.map((item, i) => {
    const v = verdicts[i % verdicts.length];
    const modality: ReviewEvidence["modality"] = item.skill === "listen" ? "listen" : item.skill === "speak" ? "speak" : "recognizeText";
    return {
      cardKey: { itemId: item.itemId, skill: item.skill },
      sessionId: "golden-session",
      exerciseId: `golden-e${i}`,
      modality,
      srsRole: v.role ?? "assessment",
      source: i % 2 === 0 ? "lesson" : "review",
      correct: v.correct,
      hinted: v.hinted ?? false,
      assisted: v.assisted ?? false,
      toleranceUsed: false,
      latencyMs: 1500 + i * 100,
      attemptIndex: v.attemptIndex ?? 0,
    };
  });
}

describe("evidence goldens (fr-en)", () => {
  for (const persona of PERSONA_NAMES) {
    test(persona, () => {
      const state = migratedPersona(persona);
      let course: CourseProgress = state.courses["fr-en"] ?? {
        xp: 0,
        completedLessons: {},
        mistakes: [],
        wordStats: {},
        cards: {},
      };
      let reviewLog: ReviewLogEntry[] = state.reviewLog ?? [];
      const mutated: boolean[] = [];
      script(course).forEach((ev, i) => {
        const out = applyEvidence({ courseId: "fr-en", course, reviewLog, ev, now: NOW_MS + i * MINUTE });
        course = out.course;
        reviewLog = out.reviewLog;
        mutated.push(out.mutated);
      });
      expectGolden(`evidence/${persona}`, {
        mutated,
        cards: course.cards,
        wordStats: course.wordStats,
        srs: course.srs,
        srsLegacy: course.srsLegacy,
        reviewLog,
      });
    });
  }
});
