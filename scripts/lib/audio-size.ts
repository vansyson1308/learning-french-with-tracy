/**
 * Bundled-audio size budget (P3f; total gate QC 2026-10-29b §2.2). Every
 * language's bundled speech (assets/audio/<lang> + assets/audio/<lang>-reception)
 * must stay within a per-language budget, and the sum over all languages
 * within a total budget derived from the 150 MB phone APK:
 *
 *   150 MB APK − ≈ 62 MB non-audio (RC4) = ≈ 88 MB audio for 9 courses
 *   ≈ 9.5–10 MB per language on average; 12 MB is the per-language cap.
 *
 * Both caps live in content/audio/size-budget.json (configurable, changed
 * only by a reviewed commit). `audio:check` fails above either and reports
 * every language; content/reports/audio-size.json records the sizes
 * (rewritten by `audio.ts apply`, `audio.ts baseline --write` and
 * `check-audio --write-baseline`).
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";

import { isAudioFile } from "./audio-codec";
import { safeResolve } from "./pipeline";

export const AUDIO_BUDGET_BYTES_PER_LANGUAGE = 12_000_000;
/** Default total cap: 150 MB phone APK − ≈ 62 MB non-audio. */
export const AUDIO_BUDGET_BYTES_TOTAL = 88_000_000;
export const AUDIO_SIZE_REPORT = "content/reports/audio-size.json";
export const AUDIO_SIZE_BUDGET = "content/audio/size-budget.json";

export type AudioBudget = { perLanguageBytes: number; totalBytes: number };
export type LanguageAudioSize = { language: string; files: number; bytes: number };
export type AudioSizeReport = { generator: string; budgetBytesPerLanguage: number; budgetBytesTotal: number; languages: LanguageAudioSize[]; totalBytes: number };

/** The committed caps (content/audio/size-budget.json), else the defaults. */
export function loadAudioBudget(rel = AUDIO_SIZE_BUDGET): AudioBudget {
  const abs = safeResolve(rel);
  if (!existsSync(abs)) return { perLanguageBytes: AUDIO_BUDGET_BYTES_PER_LANGUAGE, totalBytes: AUDIO_BUDGET_BYTES_TOTAL };
  const doc = JSON.parse(readFileSync(abs, "utf8")) as Partial<AudioBudget>;
  const positive = (x: unknown, name: string) => {
    if (typeof x !== "number" || !Number.isFinite(x) || x <= 0) throw new Error(`${rel}: ${name} must be a positive number of bytes`);
    return x;
  };
  return { perLanguageBytes: positive(doc.perLanguageBytes, "perLanguageBytes"), totalBytes: positive(doc.totalBytes, "totalBytes") };
}

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
      if (!isAudioFile(f)) continue;
      row.files += 1;
      row.bytes += statSync(path.join(full, f)).size;
    }
    byLang.set(language, row);
  }
  return [...byLang.values()].sort((a, b) => a.language.localeCompare(b.language));
}

export function buildAudioSizeReport(sizes: LanguageAudioSize[], budget: AudioBudget = loadAudioBudget()): AudioSizeReport {
  return {
    generator: "scripts/lib/audio-size.ts",
    budgetBytesPerLanguage: budget.perLanguageBytes,
    budgetBytesTotal: budget.totalBytes,
    languages: sizes,
    totalBytes: sizes.reduce((n, s) => n + s.bytes, 0),
  };
}

export function writeAudioSizeReport(): AudioSizeReport {
  const report = buildAudioSizeReport(measureAudioSizes());
  writeFileSync(safeResolve(AUDIO_SIZE_REPORT), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

const mb = (bytes: number) => (bytes / 1e6).toFixed(1);

/** Over-budget languages (pure; tested). */
export function audioBudgetErrors(sizes: LanguageAudioSize[], budget = AUDIO_BUDGET_BYTES_PER_LANGUAGE): string[] {
  return sizes
    .filter((s) => s.bytes > budget)
    .map((s) => `bundled audio for ${s.language} is ${mb(s.bytes)} MB (${s.files} files), over the ${(budget / 1e6).toFixed(0)} MB per-language budget — lower the scope or the bitrate (release/ASSET_DELIVERY.md)`);
}

/** The sum over every language above the total cap (pure; tested). */
export function audioTotalBudgetErrors(sizes: LanguageAudioSize[], totalBudget = AUDIO_BUDGET_BYTES_TOTAL): string[] {
  const total = sizes.reduce((n, s) => n + s.bytes, 0);
  if (total <= totalBudget) return [];
  const parts = sizes.map((s) => `${s.language} ${mb(s.bytes)}`).join(" + ");
  return [`bundled audio of all languages is ${mb(total)} MB (${parts}), over the ${mb(totalBudget)} MB total budget (150 MB phone APK − ≈ 62 MB non-audio; release/ASSET_DELIVERY.md) — lower a language's scope or the bitrate`];
}

/** One line per language plus the total, for the `audio:check` log. */
export function audioSizeSummary(sizes: LanguageAudioSize[], budget: AudioBudget = loadAudioBudget()): string[] {
  const total = sizes.reduce((n, s) => n + s.bytes, 0);
  return [
    ...sizes.map((s) => `  ${s.language.padEnd(4)} ${mb(s.bytes).padStart(6)} MB  ${String(s.files).padStart(5)} files  (cap ${mb(budget.perLanguageBytes)} MB)`),
    `  all  ${mb(total).padStart(6)} MB  (cap ${mb(budget.totalBytes)} MB, ${mb(Math.max(0, budget.totalBytes - total))} MB left)`,
  ];
}

/** Budgets + report freshness (what `audio:check` runs). */
export function audioSizeErrors(): string[] {
  const sizes = measureAudioSizes();
  const budget = loadAudioBudget();
  const errors = [...audioBudgetErrors(sizes, budget.perLanguageBytes), ...audioTotalBudgetErrors(sizes, budget.totalBytes)];
  const rel = safeResolve(AUDIO_SIZE_REPORT);
  const expected = JSON.stringify(buildAudioSizeReport(sizes, budget));
  const committed = existsSync(rel) ? JSON.stringify(JSON.parse(readFileSync(rel, "utf8"))) : null;
  if (committed !== expected) errors.push(`${AUDIO_SIZE_REPORT} is stale — run bun scripts/check-audio.ts --write-baseline (or the audio workflow's apply)`);
  return errors;
}
