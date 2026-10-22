/**
 * Bundled-audio size budget (P3f). Eight languages at the P3b rate would
 * not fit an APK, so every language's bundled speech (assets/audio/<lang>
 * + assets/audio/<lang>-reception) must stay within a fixed budget;
 * `audio:check` fails above it, and content/reports/audio-size.json
 * records the per-language and total sizes (rewritten by `audio.ts apply`,
 * `audio.ts baseline --write` and `check-audio --write-baseline`).
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";

import { safeResolve } from "./pipeline";

export const AUDIO_BUDGET_BYTES_PER_LANGUAGE = 12_000_000;
export const AUDIO_SIZE_REPORT = "content/reports/audio-size.json";

export type LanguageAudioSize = { language: string; files: number; bytes: number };
export type AudioSizeReport = { generator: string; budgetBytesPerLanguage: number; languages: LanguageAudioSize[]; totalBytes: number };

/** Per-language bundled audio under assets/audio (`<lang>` and `<lang>-reception` count together). */
export function measureAudioSizes(audioRoot = safeResolve("assets/audio")): LanguageAudioSize[] {
  if (!existsSync(audioRoot)) return [];
  const byLang = new Map<string, LanguageAudioSize>();
  for (const dir of readdirSync(audioRoot).sort()) {
    const full = path.join(audioRoot, dir);
    if (!statSync(full).isDirectory()) continue;
    const language = dir.replace(/-reception$/, "");
    const row = byLang.get(language) ?? { language, files: 0, bytes: 0 };
    for (const f of readdirSync(full)) {
      if (!f.endsWith(".mp3") && !f.endsWith(".wav")) continue;
      row.files += 1;
      row.bytes += statSync(path.join(full, f)).size;
    }
    byLang.set(language, row);
  }
  return [...byLang.values()].sort((a, b) => a.language.localeCompare(b.language));
}

export function buildAudioSizeReport(sizes: LanguageAudioSize[]): AudioSizeReport {
  return {
    generator: "scripts/lib/audio-size.ts",
    budgetBytesPerLanguage: AUDIO_BUDGET_BYTES_PER_LANGUAGE,
    languages: sizes,
    totalBytes: sizes.reduce((n, s) => n + s.bytes, 0),
  };
}

export function writeAudioSizeReport(): AudioSizeReport {
  const report = buildAudioSizeReport(measureAudioSizes());
  writeFileSync(safeResolve(AUDIO_SIZE_REPORT), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

/** Over-budget languages (pure; tested). */
export function audioBudgetErrors(sizes: LanguageAudioSize[], budget = AUDIO_BUDGET_BYTES_PER_LANGUAGE): string[] {
  return sizes
    .filter((s) => s.bytes > budget)
    .map((s) => `bundled audio for ${s.language} is ${(s.bytes / 1e6).toFixed(1)} MB (${s.files} files), over the ${(budget / 1e6).toFixed(0)} MB per-language budget — lower the scope or the bitrate (release/ASSET_DELIVERY.md)`);
}

/** Budget + report freshness (what `audio:check` runs). */
export function audioSizeErrors(): string[] {
  const sizes = measureAudioSizes();
  const errors = audioBudgetErrors(sizes);
  const rel = safeResolve(AUDIO_SIZE_REPORT);
  const expected = JSON.stringify(buildAudioSizeReport(sizes));
  const committed = existsSync(rel) ? JSON.stringify(JSON.parse(readFileSync(rel, "utf8"))) : null;
  if (committed !== expected) errors.push(`${AUDIO_SIZE_REPORT} is stale — run bun scripts/check-audio.ts --write-baseline (or the audio workflow's apply)`);
  return errors;
}
