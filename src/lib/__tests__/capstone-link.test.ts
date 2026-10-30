/**
 * The Goals screen's capstone link pushed the French id for every course, so a
 * ready es-vi or de-vi learner landed on a checkpoint their course does not have.
 */
import { describe, expect, test } from "bun:test";

import { capstoneCheckpointId, checkpointFor } from "../assessment/content";

describe("capstoneCheckpointId", () => {
  test("resolves the course's own capstone", () => {
    for (const [courseId, id] of [
      ["fr-en", "fr.checkpoint.a1-capstone"],
      ["fr-vi", "fr.checkpoint.a1-capstone"],
      ["es-vi", "es.checkpoint.a1-capstone"],
      ["de-vi", "de.checkpoint.a1-capstone"],
    ] as const) {
      expect(capstoneCheckpointId(courseId)).toBe(id);
      expect(checkpointFor(courseId, id)?.id).toBe(id);
    }
  });

  test("a course or level without a capstone has none", () => {
    expect(capstoneCheckpointId("ja-en")).toBeUndefined();
    expect(capstoneCheckpointId("fr-en", "B1")).toBeUndefined();
  });
});
