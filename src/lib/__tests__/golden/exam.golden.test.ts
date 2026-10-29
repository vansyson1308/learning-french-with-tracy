/**
 * Exam goldens (exam-engine-v2, QC 2026-10-29 §2): DELE A1 and Goethe A1
 * results must stay byte-identical while the pass rule generalises. Each
 * scripted sitting scores the first parallel form; deterministic patterns
 * only (no clock, no RNG).
 */
import { describe, test } from "bun:test";

import type { AssessmentItemResult } from "../../assessment/types";
import { examTrackFor } from "../../exam/content";
import { examWeakAreas, scoreExam, selectMockForm, type CompiledExamTrack } from "../../exam/engine";
import { expectGolden } from "./helpers";

const TRACKS: [string, string][] = [
  ["es-vi", "es.exam.dele_a1"],
  ["de-vi", "de.exam.goethe_a1"],
];

type Pattern = { name: string; result: (index: number, item: { sectionId: string }) => AssessmentItemResult["correct"] | "omit"; credit?: (index: number, item: { sectionId: string }) => number | undefined };

const PATTERNS: Pattern[] = [
  { name: "all-correct", result: () => true },
  { name: "all-wrong", result: () => false },
  { name: "every-third-wrong", result: (i) => i % 3 !== 2 },
  { name: "half-unanswered", result: (i) => (i % 2 === 0 ? true : null) },
  { name: "speaking-not-taken", result: (i, item) => (item.sectionId.includes("speak") || item.sectionId.includes("sprechen") || item.sectionId.includes("oral") ? "omit" : i % 4 !== 3) },
  { name: "writing-credit", result: (i) => i % 5 !== 4, credit: (i, item) => (item.sectionId.includes("writ") || item.sectionId.includes("schreiben") ? (i % 3) / 2 : undefined) },
];

function sit(track: CompiledExamTrack, pattern: Pattern): AssessmentItemResult[] {
  const byId = new Map(track.items.map((i) => [i.id, i]));
  const out: AssessmentItemResult[] = [];
  selectMockForm(track, 0).itemIds.forEach((id, index) => {
    const item = byId.get(id)!;
    const correct = pattern.result(index, item);
    if (correct === "omit") return;
    const credit = correct === null ? undefined : pattern.credit?.(index, item);
    out.push({ itemId: id, correct, ...(credit !== undefined ? { credit } : {}) });
  });
  return out;
}

describe("exam goldens: DELE and Goethe scoring", () => {
  for (const [courseId, trackId] of TRACKS) {
    test(`${trackId} (${courseId})`, () => {
      const track = examTrackFor(courseId, trackId) as CompiledExamTrack;
      const results = Object.fromEntries(
        PATTERNS.map((p) => {
          const rows = sit(track, p);
          const weak = examWeakAreas(track, rows);
          return [p.name, { score: scoreExam(track, rows), weakTasks: weak.tasks, weakObjectives: weak.objectiveIds }];
        })
      );
      expectGolden(`exam/${trackId}`, results);
    });
  }
});
