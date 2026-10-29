/**
 * Verifies the pinned audio baseline (every shipped course MP3 + sfx + the
 * manifest, as recorded in content/audio/legacy-baseline.json — the file
 * count lives there, never here) and that every audio reference resolves.
 * --write-baseline (re)creates the baseline — only legitimate when
 * intentionally blessing a new one with a recorded reason, never in CI.
 */
import { baselineGroupOf, buildAudioBaseline, checkAudio, writeLanguageBaseline, writeManifestBaseline, writeSfxBaseline } from "./lib/audio";
import { audioSizeErrors, audioSizeSummary, measureAudioSizes, writeAudioSizeReport } from "./lib/audio-size";

if (process.argv.includes("--write-baseline")) {
  // P3b: one baseline file per language group under content/audio/baseline/
  // (plus sfx.json and manifest.json). `--lang <code>` re-blesses one
  // language; without it every group is rewritten (first migration only).
  const i = process.argv.indexOf("--lang");
  const lang = i >= 0 ? process.argv[i + 1] : undefined;
  const baseline = buildAudioBaseline();
  if (lang) {
    writeLanguageBaseline(lang);
  } else {
    const langs = new Set(Object.keys(baseline.files).map(baselineGroupOf).filter((g) => g !== "sfx" && g !== "other").map((g) => g.replace(/-reception$/, "")));
    for (const l of langs) writeLanguageBaseline(l);
    writeSfxBaseline();
  }
  writeManifestBaseline();
  writeAudioSizeReport();
  console.log(`baseline written: ${baseline.fileCount} files, ${(baseline.totalBytes / 1e6).toFixed(1)} MB (${lang ?? "every language"} + sfx + manifest)`);
  process.exit(0);
}

const { errors: baselineErrors, checkedFiles } = checkAudio();
// P3f: per-language size budget; QC 2026-10-29b §2.2: total budget over every language; the size report.
console.log("bundled audio per language (content/audio/size-budget.json):");
for (const line of audioSizeSummary(measureAudioSizes())) console.log(line);
const errors = [...baselineErrors, ...audioSizeErrors()];
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length > 0) {
  console.error(`\naudio check failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log(`audio check passed (${checkedFiles} baseline files verified)`);
