/**
 * Goethe Schreiben Teil 2 scoring (QC 2026-10-29 §1.5): an explicit rubric
 * turns the deterministic writing evaluation into 0–10 points — the three
 * guided points (6), greeting (1), closing (1), length (1), comprehensible
 * German (1) — always shown as an estimate.
 */
import { describe, expect, test } from "bun:test";

import { languageRules } from "../languages";
import { evaluateGuidedWriting, type WritingRubric } from "../writing/rubric";
import { messagePoints, messagePointsSpecFor, type MessagePointsSpec } from "../writing/message-points";

const KNOWN = new Set(
  "liebe lieber paul hallo ich habe am samstag geburtstag und mache eine party kommst du die beginnt um uhr bitte bring getränke mit viele grüße dein deine anna sieben acht".split(" ")
);
const rubric: WritingRubric = {
  requiredSlots: [
    { id: "greeting", description: "greeting", variants: ["lieber paul", "hallo paul"], cueProvided: false },
    { id: "invite", description: "invitation", variants: ["party", "kommst du"], cueProvided: false },
    { id: "time", description: "start time", variants: ["um sieben uhr", "um acht uhr"], cueProvided: false },
    { id: "bring", description: "bring drinks", variants: ["bring getränke mit", "getränke"], cueProvided: false },
    { id: "closing", description: "closing", variants: ["viele grüße", "liebe grüße"], cueProvided: false },
  ],
  minTokens: 20,
  maxTokens: 45,
};
const spec: MessagePointsSpec = messagePointsSpecFor(rubric, 10)!;
const score = (text: string) =>
  messagePoints(
    evaluateGuidedWriting({ rules: languageRules("de"), targetLanguage: "German", text, rubric, promptText: "Schreiben Sie an Paul", knownVocabulary: KNOWN }),
    spec
  );

const FULL = "Lieber Paul, ich habe am Samstag Geburtstag und mache eine Party. Kommst du? Die Party beginnt um sieben Uhr. Bitte bring Getränke mit. Viele Grüße, deine Anna";

describe("Schreiben Teil 2 rubric points", () => {
  test("the spec reads greeting and closing from the first and last slots, the guided points in between", () => {
    expect(spec).toEqual({ greetingSlotId: "greeting", closingSlotId: "closing", pointSlotIds: ["invite", "time", "bring"], minTokens: 20, maxTokens: 45, maxPoints: 10 });
    expect(messagePointsSpecFor({ ...rubric, requiredSlots: rubric.requiredSlots.slice(0, 2) }, 10)).toBeNull();
  });

  test("a complete message of about 30 words scores 10 of 10", () => {
    const r = score(FULL)!;
    expect(r.points).toBe(10);
    expect(r.criteria).toEqual([
      { id: "points", earned: 6, max: 6 },
      { id: "greeting", earned: 1, max: 1 },
      { id: "closing", earned: 1, max: 1 },
      { id: "length", earned: 1, max: 1 },
      { id: "comprehensible", earned: 1, max: 1 },
    ]);
  });

  test("each missing guided point costs 2; greeting and closing 1 each", () => {
    expect(score(FULL.replace(" Bitte bring Getränke mit.", ""))!.points).toBe(8);
    expect(score(FULL.replace("Lieber Paul, ", "").replace(" Viele Grüße, deine Anna", " deine Anna"))!.points).toBe(8);
  });

  test("too short loses the length point; points are whole numbers, as the Goethe raters round", () => {
    const r = score("Lieber Paul, Party am Samstag um sieben Uhr. Getränke! Viele Grüße")!;
    expect(r.criteria.find((c) => c.id === "length")!.earned).toBe(0);
    expect(Number.isInteger(r.points)).toBe(true);
  });

  test("nothing written, or not German, is no evidence (null), never zero points", () => {
    expect(score("")).toBeNull();
    expect(score("Chào Paul, thứ Bảy mình tổ chức sinh nhật, bạn đến nhé")).toBeNull();
  });
});
