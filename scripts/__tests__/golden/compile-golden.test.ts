/**
 * Compile golden (P1a): the committed generated artifacts and a fresh
 * in-memory recompile must both hash exactly to the blessed manifest. Any
 * pipeline refactor (P1b–P1d) that changes one byte of a French artifact
 * fails here until it is re-blessed with a reason (`bun scripts/golden.ts
 * --update --reason "…"`, logged in CHANGELOG.md).
 */
import { describe, expect, test } from "bun:test";

import {
  committedCompileManifest,
  dbPinsAsFiles,
  diffFileHashes,
  formatDiff,
  freshCompile,
  readCompileManifest,
} from "../../lib/golden";

const stored = readCompileManifest();

describe("compile golden", () => {
  test("the manifest exists and pins the French artifacts", () => {
    expect(stored).toBeDefined();
    const files = Object.keys(stored!.files);
    expect(files).toContain("src/content/packs/fr-en.json");
    expect(files).toContain("src/content/lexicon/fr-index.json");
    expect(files).toContain("src/content/assessment/fr-checkpoints.json");
    expect(files).toContain("content/reports/cefr-claim-gate.json");
    expect(files).toContain("ATTRIBUTIONS.md");
    expect(stored!.lexiconDbs.fr.name).toMatch(/^fr-lexicon-v\d+-[0-9a-f]{16}\.db$/);
  });

  test("every committed generated file hashes to the manifest (no unblessed change)", () => {
    const committed = committedCompileManifest();
    const diff = diffFileHashes(stored!.files, committed.files);
    expect(formatDiff("committed", diff)).toEqual([]);
    expect(formatDiff("committed", diffFileHashes(dbPinsAsFiles(stored!.lexiconDbs), dbPinsAsFiles(committed.lexiconDbs)))).toEqual([]);
  });

  test(
    "a fresh in-memory recompile reproduces the manifest byte for byte (text artifacts + SQLite logical dump)",
    () => {
      const fresh = freshCompile();
      const expected = Object.fromEntries(
        Object.entries(stored!.files).filter(([k]) => k in fresh.files)
      );
      // The compiler must produce every artifact the manifest pins under the
      // compiler-owned directories (other pinned files — catalog, audio
      // manifest, audio reports — come from other pipelines).
      expect(Object.keys(fresh.files).length).toBeGreaterThan(30);
      expect(formatDiff("recompiled", diffFileHashes(expected, fresh.files))).toEqual([]);
      expect(formatDiff("recompiled", diffFileHashes(dbPinsAsFiles(stored!.lexiconDbs), dbPinsAsFiles(fresh.lexiconDbs)))).toEqual([]);
    },
    120_000
  );
});
