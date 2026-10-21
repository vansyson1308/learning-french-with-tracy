/**
 * Authoring staging (P3d): a course under construction lives in
 * content/<lang>/_drafts/staged/; commands see it overlaid on the real tree,
 * writes made during a command are captured back into staging, and the real
 * tree is restored byte for byte — also when the command throws. `promote`
 * moves the layer only when validation passes with it applied.
 * Runs on the synthetic language `xx` (its _drafts/ folder is gitignored).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";

import { beforeWrite, listStaged, promote, stagedRoot, withStaging } from "../lib/authoring/staging";
import { safeResolve } from "../lib/pipeline";

const STAGE = stagedRoot("xx");
const REAL_DIR = "content/xx/_staging-test";
const REAL_EXISTING = "content/xx/_staging-test-existing.json";

function stage(rel: string, text: string) {
  const abs = safeResolve(`${STAGE}/${rel}`);
  mkdirSync(safeResolve(`${STAGE}/${rel}`, ".."), { recursive: true });
  writeFileSync(abs, text);
}
function write(rel: string, text: string) {
  beforeWrite(rel);
  mkdirSync(safeResolve(rel, ".."), { recursive: true });
  writeFileSync(safeResolve(rel), text);
}

afterEach(() => {
  rmSync(safeResolve(STAGE), { recursive: true, force: true });
  rmSync(safeResolve(REAL_DIR), { recursive: true, force: true });
  rmSync(safeResolve(REAL_EXISTING), { force: true });
});

describe("withStaging", () => {
  test("overlays staged files, captures new writes into staging and restores the real tree", () => {
    stage(`${REAL_DIR}/a.json`, '{"a":1}\n');
    writeFileSync(safeResolve(REAL_EXISTING), '{"real":true}\n');
    const seen = withStaging("xx", () => {
      const a = readFileSync(safeResolve(`${REAL_DIR}/a.json`), "utf8");
      write(`${REAL_DIR}/b.json`, '{"b":2}\n');
      write(REAL_EXISTING, '{"real":false}\n');
      return a;
    });
    expect(seen).toBe('{"a":1}\n');
    expect(existsSync(safeResolve(REAL_DIR))).toBe(false);
    expect(readFileSync(safeResolve(REAL_EXISTING), "utf8")).toBe('{"real":true}\n');
    expect(listStaged("xx")).toEqual([REAL_EXISTING, `${REAL_DIR}/a.json`, `${REAL_DIR}/b.json`].sort());
    expect(readFileSync(safeResolve(`${STAGE}/${REAL_EXISTING}`), "utf8")).toBe('{"real":false}\n');
  });

  test("restores the real tree when the command throws", () => {
    stage(`${REAL_DIR}/a.json`, "{}\n");
    expect(() =>
      withStaging("xx", () => {
        write(`${REAL_DIR}/c.json`, "{}\n");
        throw new Error("boom");
      })
    ).toThrow("boom");
    expect(existsSync(safeResolve(REAL_DIR))).toBe(false);
    expect(listStaged("xx")).toContain(`${REAL_DIR}/c.json`);
  });

  test("draft paths are never staged", () => {
    withStaging("xx", () => write("content/xx/_drafts/_staging-test/REPORT.md", "x"));
    expect(listStaged("xx")).toEqual([]);
    rmSync(safeResolve("content/xx/_drafts/_staging-test"), { recursive: true, force: true });
  });
});

describe("promote", () => {
  test("moves nothing while validation fails with the layer applied", () => {
    stage(`${REAL_DIR}/a.json`, "{}\n");
    const r = promote("xx", () => (existsSync(safeResolve(`${REAL_DIR}/a.json`)) ? ["still incomplete"] : []));
    expect(r.errors).toEqual(["still incomplete"]);
    expect(r.moved).toEqual([]);
    expect(existsSync(safeResolve(REAL_DIR))).toBe(false);
    expect(listStaged("xx")).toEqual([`${REAL_DIR}/a.json`]);
  });

  test("moves the layer into place and clears staging once validation passes", () => {
    stage(`${REAL_DIR}/a.json`, '{"ok":1}\n');
    const r = promote("xx", () => []);
    expect(r.moved).toEqual([`${REAL_DIR}/a.json`]);
    expect(readFileSync(safeResolve(`${REAL_DIR}/a.json`), "utf8")).toBe('{"ok":1}\n');
    expect(existsSync(safeResolve(STAGE))).toBe(false);
  });
});
