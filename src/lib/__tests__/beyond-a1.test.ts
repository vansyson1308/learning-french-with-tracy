/**
 * D-14: nothing in the engines caps a course at A1. v1.0 ships A1; these pin that a
 * higher level needs content, not engine changes.
 */
import { describe, expect, test } from "bun:test";

import { capstoneCheckpointId, courseClaimableAt } from "../assessment/content";
import { deriveA1Estimate } from "../assessment/estimate";
import { STORY_BANDS } from "../stories/bands";
import { storyLevel } from "../stories/content";

describe("the learner estimate takes its level from the policy", () => {
  test("an A2 policy reports A2, and a course not claimable there stays incomplete", () => {
    const policy = { level: "A2", domains: [{ domain: "reading", requiredObjectiveIds: ["x.obj.a"] }] };
    const estimate = deriveA1Estimate({ policy, states: {}, courseClaimable: courseClaimableAt("fr-en", "A2") });
    expect(estimate.level).toBe("A2");
    expect(estimate.overall).toBe("incomplete");
  });

  test("the capstone lookup is per level", () => {
    expect(capstoneCheckpointId("fr-en", "A1")).toBe("fr.checkpoint.a1-capstone");
    expect(capstoneCheckpointId("fr-en", "A2")).toBeUndefined();
  });
});

describe("story bands reach B2 in reading order", () => {
  test("levels keep their meaning below A2 and keep rising after it", () => {
    const levels = STORY_BANDS.map((band) => storyLevel({ band }));
    expect(levels.slice(0, 5)).toEqual([1, 1, 2, 3, 4]);
    expect(levels.slice(5)).toEqual([5, 6, 7, 8]);
  });

  test("an unknown band fails loudly", () => {
    expect(() => storyLevel({ band: "C1-1" as never })).toThrow("unknown story band");
  });
});
