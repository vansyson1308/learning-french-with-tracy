import { describe, expect, test } from "bun:test";

import { optionTestId, sessionResultTestId } from "../option-test-id";

describe("option test ids (QC 2026-10-30: device flows tap by id)", () => {
  test("marks, đ, ß, case and punctuation fold into a regex-safe slug", () => {
    expect(optionTestId("bố / ba")).toBe("option-bo-ba");
    expect(optionTestId("đường")).toBe("option-duong");
    expect(optionTestId("die Straße")).toBe("option-die-strasse");
    expect(optionTestId("¿Dónde está?")).toBe("option-donde-esta");
    expect(optionTestId("水")).toBe("option-水");
    expect(optionTestId("?!")).toBe("option-x");
  });

  test("the id carries no regex metacharacter", () => {
    for (const t of ["a.b", "(x)", "a|b", "1+1", "c*", "[k]"]) expect(optionTestId(t)).toMatch(/^option-[\p{L}\p{N}-]+$/u);
  });

  test("the finish-screen marker names the outcome, not the answer", () => {
    expect(sessionResultTestId(true)).toBe("session-result-perfect");
    expect(sessionResultTestId(false)).toBe("session-result-mistakes");
  });
});
