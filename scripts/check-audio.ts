/**
 * Verifies the pinned audio baseline (every shipped course MP3 + sfx + the
 * manifest, as recorded in content/audio/legacy-baseline.json — the file
 * count lives there, never here) and that every audio reference resolves.
 * --write-baseline (re)creates the baseline — only legitimate when
 * intentionally blessing a new one with a recorded reason, never in CI.
 */
import { writeFileSync } from "fs";

import { buildAudioBaseline, checkAudio } from "./lib/audio";
import { safeResolve } from "./lib/pipeline";

if (process.argv.includes("--write-baseline")) {
  const baseline = buildAudioBaseline();
  writeFileSync(
    safeResolve("content/audio/legacy-baseline.json"),
    JSON.stringify(baseline, null, 2)
  );
  console.log(
    `baseline written: ${baseline.fileCount} files, ${(baseline.totalBytes / 1e6).toFixed(1)} MB`
  );
  process.exit(0);
}

const { errors, checkedFiles } = checkAudio();
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length > 0) {
  console.error(`\naudio check failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log(`audio check passed (${checkedFiles} baseline files verified)`);
