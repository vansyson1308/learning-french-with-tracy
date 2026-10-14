/**
 * Golden gate CLI (P1a).
 *
 *   bun scripts/golden.ts --check                 (default) compile manifest vs
 *                                                 committed files + fresh compile,
 *                                                 then the runtime golden suites
 *   bun scripts/golden.ts --update --reason "…"   re-bless BOTH the compile
 *                                                 manifest and the runtime
 *                                                 snapshots; the reason is
 *                                                 appended to CHANGELOG.md
 *
 * Re-blessing without a reason is refused: a golden only changes when a
 * milestone deliberately changes observable French behaviour or content.
 */
import { appendFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

import {
  COMPILE_CHANGELOG_REL,
  COMPILE_MANIFEST_REL,
  RUNTIME_GOLDEN_DIR,
  committedCompileManifest,
  dbPinsAsFiles,
  diffFileHashes,
  formatDiff,
  freshCompile,
  readCompileManifest,
  runtimeSnapshotHashes,
  type CompileManifest,
} from "./lib/golden";
import { canonicalJson, safeResolve } from "./lib/pipeline";

const args = process.argv.slice(2);
const update = args.includes("--update");
const reasonIndex = args.indexOf("--reason");
const reason = reasonIndex >= 0 ? (args[reasonIndex + 1] ?? "").trim() : "";

function runRuntimeGoldens(env: Record<string, string>): number {
  const proc = Bun.spawnSync({
    cmd: ["bun", "test", RUNTIME_GOLDEN_DIR],
    cwd: safeResolve("."),
    env: { ...process.env, ...env },
    stdout: "inherit",
    stderr: "inherit",
  });
  return proc.exitCode;
}

function check(): number {
  const stored = readCompileManifest();
  if (!stored) {
    console.error(`${COMPILE_MANIFEST_REL} is missing — run: bun scripts/golden.ts --update --reason "initial bless"`);
    return 1;
  }
  const committed = committedCompileManifest();
  const fresh = freshCompile();
  const problems = [
    ...formatDiff("committed", diffFileHashes(stored.files, committed.files)),
    ...formatDiff(
      "recompiled",
      diffFileHashes(
        Object.fromEntries(Object.entries(stored.files).filter(([k]) => k in fresh.files)),
        fresh.files
      )
    ),
  ];
  problems.push(
    ...formatDiff("committed", diffFileHashes(dbPinsAsFiles(stored.lexiconDbs), dbPinsAsFiles(committed.lexiconDbs))),
    ...formatDiff("recompiled", diffFileHashes(dbPinsAsFiles(stored.lexiconDbs), dbPinsAsFiles(fresh.lexiconDbs)))
  );
  for (const p of problems) console.error(`GOLDEN ${p}`);
  if (problems.length > 0) {
    console.error(
      `\ncompile golden failed (${problems.length} difference(s)). If this change is intended, re-bless with a reason:\n  bun scripts/golden.ts --update --reason "<why French output changed>"`
    );
    return 1;
  }
  console.log(`compile golden ok (${Object.keys(stored.files).length} files + ${Object.keys(stored.lexiconDbs).length} lexicon db(s))`);
  const code = runRuntimeGoldens({});
  if (code !== 0) {
    console.error("runtime goldens failed (see above)");
    return code;
  }
  console.log("runtime goldens ok");
  return 0;
}

function bless(): number {
  if (!reason) {
    console.error('--update needs --reason "<why the French output legitimately changed>"');
    return 2;
  }
  let before: CompileManifest | undefined;
  try {
    before = readCompileManifest();
  } catch (e) {
    // A manifest in an older format is re-blessed from scratch; the CHANGELOG entry records it.
    console.warn(`${COMPILE_MANIFEST_REL}: ${(e as Error).message} — re-blessing from scratch`);
    before = undefined;
  }
  const snapshotsBefore = runtimeSnapshotHashes();

  const manifest: CompileManifest = committedCompileManifest();
  const fresh = freshCompile();
  const drift = formatDiff(
    "recompiled vs committed",
    diffFileHashes(
      Object.fromEntries(Object.entries(manifest.files).filter(([k]) => k in fresh.files)),
      fresh.files
    )
  );
  drift.push(...formatDiff("recompiled vs committed", diffFileHashes(dbPinsAsFiles(manifest.lexiconDbs), dbPinsAsFiles(fresh.lexiconDbs))));
  if (drift.length > 0) {
    for (const d of drift) console.error(`GOLDEN ${d}`);
    console.error("the committed artifacts are stale — run `bun run content:compile` first, then re-bless");
    return 1;
  }
  mkdirSync(path.dirname(safeResolve(COMPILE_MANIFEST_REL)), { recursive: true });
  writeFileSync(safeResolve(COMPILE_MANIFEST_REL), canonicalJson(manifest));

  const code = runRuntimeGoldens({ GOLDEN_UPDATE: "1" });
  if (code !== 0) {
    console.error("runtime golden re-bless failed");
    return code;
  }
  const snapshotsAfter = runtimeSnapshotHashes();

  const compileDiff = before ? diffFileHashes(before.files, manifest.files) : undefined;
  const snapshotDiff = diffFileHashes(snapshotsBefore, snapshotsAfter);
  const changed = [
    ...(compileDiff ? formatDiff("compile", compileDiff) : ["compile: initial manifest"]),
    ...(before ? formatDiff("compile", diffFileHashes(dbPinsAsFiles(before.lexiconDbs), dbPinsAsFiles(manifest.lexiconDbs))) : []),
    ...formatDiff("runtime", snapshotDiff),
  ];
  const stamp = new Date().toISOString().slice(0, 10);
  const entry = [
    `## ${stamp} — ${reason}`,
    "",
    ...(changed.length > 0 ? changed.map((c) => `- ${c}`) : ["- no golden changed (manifest and snapshots identical)"]),
    "",
  ].join("\n");
  appendFileSync(safeResolve(COMPILE_CHANGELOG_REL), `\n${entry}`);
  console.log(`blessed: ${Object.keys(manifest.files).length} files + ${Object.keys(manifest.lexiconDbs).length} lexicon db(s); ${changed.length} change line(s) logged to ${COMPILE_CHANGELOG_REL}`);
  return 0;
}

process.exit(update ? bless() : check());
