/** D-14: build-time half of src/lib/__tests__/beyond-a1.test.ts. */
import { describe, expect, test } from "bun:test";

import { STORY_BANDS as RUNTIME_BANDS } from "../../src/lib/stories/bands";
import { placementSchema, STORY_BANDS } from "../../content/schema";
import { lexemeBands } from "../lib/stories";

const entries = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => ({ lexemeId: `${prefix}${i}` }));

describe("beyond A1", () => {
  test("schema and runtime share the story bands", () => {
    expect([...STORY_BANDS]).toEqual([...RUNTIME_BANDS]);
  });

  test("a whole later level splits into its bands instead of being dropped", () => {
    const bands = lexemeBands({ level: "A1", entries: entries("a", 2) } as never, { level: "A2", entries: entries("b", 2) } as never);
    expect(bands.get("a0")).toBe("A1-1");
    expect(bands.get("b0")).toBe("A2-1");
    expect(bands.get("b1")).toBe("A2-2");
  });

  test("a later list naming one band still takes that band", () => {
    const bands = lexemeBands({ level: "A1", entries: entries("a", 2) } as never, { level: "A2-1", entries: entries("b", 2) } as never);
    expect(bands.get("b1")).toBe("A2-1");
  });

  test("B1 and B2 syllabi have bands", () => {
    expect(lexemeBands({ level: "B1", entries: entries("c", 2) } as never).get("c1")).toBe("B1-2");
    expect(lexemeBands({ level: "B2", entries: entries("d", 2) } as never).get("d0")).toBe("B2-1");
  });

  test("a level with no band fails instead of leaving its words unbanded", () => {
    expect(() => lexemeBands({ level: "C1", entries: entries("e", 1) } as never)).toThrow("not in STORY_BANDS");
  });

  test("the placement schema allows more than the A1 28 items", () => {
    expect(placementSchema("xx").shape.maxItems.safeParse(40).success).toBe(true);
    expect(placementSchema("xx").shape.maxItems.safeParse(61).success).toBe(false);
  });
});
