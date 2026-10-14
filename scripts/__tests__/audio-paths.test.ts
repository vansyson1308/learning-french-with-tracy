/**
 * Audio baseline keys are repo-relative POSIX paths on every platform (P0):
 * on Windows path.relative() yields backslashes, which made every pinned
 * file look missing and `bun run audio:check` fail with 713 errors.
 */
import { describe, expect, test } from "bun:test";
import path from "path";

import { buildAudioBaseline, loadBaselineGroups, toRepoRelativePosix } from "../lib/audio";
import { safeResolve } from "../lib/pipeline";

describe("audio baseline path keys", () => {
  test("toRepoRelativePosix uses forward slashes regardless of path.sep", () => {
    const abs = path.join(safeResolve("."), "assets", "audio", "fr", "abc.mp3");
    expect(toRepoRelativePosix(abs)).toBe("assets/audio/fr/abc.mp3");
    expect(toRepoRelativePosix(abs)).not.toContain("\\");
  });

  test("every key of the fresh baseline matches the committed baseline's key style", () => {
    const committed = loadBaselineGroups();
    const fresh = buildAudioBaseline();
    const freshKeys = Object.keys(fresh.files);
    expect(freshKeys.length).toBeGreaterThan(0);
    for (const key of freshKeys) {
      expect(key).not.toContain("\\");
      expect(key.startsWith("assets/")).toBe(true);
    }
    for (const key of Object.keys(committed.files)) expect(fresh.files[key]).toBeDefined();
  }, 60_000);
});
