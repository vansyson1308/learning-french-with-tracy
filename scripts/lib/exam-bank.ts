/**
 * Exam-track documents as assessment banks (P3d). The speech, writing and
 * interaction validators apply their scored-bank rules (reserved items only,
 * mirror checks) to every bank — checkpoints, placement and exam tracks —
 * so exam items obey exactly the same contract as checkpoint items.
 * File IO only; no schema parsing (the exam validator owns that).
 */

import { existsSync, readdirSync } from "fs";

import { readJson, safeResolve } from "./pipeline";

export type ExamBankDocument = {
  relPath: string;
  exerciseNativeCode: string;
  items: { id: string; exercise: { type: string }; exerciseNative?: Record<string, Record<string, string>> }[];
};

/** Repo-relative paths of a target's exam-track documents, sorted. */
export function examTrackPaths(lang: string): string[] {
  const dir = `content/${lang}/exam`;
  if (!existsSync(safeResolve(dir))) return [];
  return readdirSync(safeResolve(dir))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => `${dir}/${f}`);
}

/** Every exam document of a target as a raw item bank (unparseable files are skipped; the exam validator reports them). */
export function examBankDocuments(lang: string): ExamBankDocument[] {
  const out: ExamBankDocument[] = [];
  for (const relPath of examTrackPaths(lang)) {
    try {
      const doc = readJson(relPath) as { exerciseNativeCode?: unknown; items?: unknown };
      if (!Array.isArray(doc.items)) continue;
      out.push({
        relPath,
        exerciseNativeCode: typeof doc.exerciseNativeCode === "string" ? doc.exerciseNativeCode : "en",
        items: doc.items as ExamBankDocument["items"],
      });
    } catch {
      // reported by the exam validator
    }
  }
  return out;
}
