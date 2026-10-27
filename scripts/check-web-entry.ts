#!/usr/bin/env bun
/**
 * Web entry bundle budget (P3g B2). Course content loads on demand
 * (src/lib/course-bundle.ts), so the entry chunk carries the app shell only.
 *
 *   bun scripts/check-web-entry.ts [dist]   # fails above WEB_ENTRY_BUDGET_BYTES
 */
import { existsSync, readdirSync, statSync } from "fs";
import path from "path";

export const WEB_ENTRY_BUDGET_BYTES = 4_500_000;

export function entrySize(dist: string): { file: string; bytes: number; chunks: { file: string; bytes: number }[] } {
  const dir = path.join(dist, "_expo/static/js/web");
  if (!existsSync(dir)) throw new Error(`${dir} not found — run bunx expo export --platform web first`);
  const chunks = readdirSync(dir)
    .filter((f) => f.endsWith(".js"))
    .map((f) => ({ file: f, bytes: statSync(path.join(dir, f)).size }))
    .sort((a, b) => b.bytes - a.bytes);
  const entry = chunks.find((c) => c.file.startsWith("entry-"));
  if (!entry) throw new Error(`no entry-*.js in ${dir}`);
  return { file: entry.file, bytes: entry.bytes, chunks };
}

if (import.meta.main) {
  const dist = process.argv[2] ?? "dist";
  const { file, bytes, chunks } = entrySize(dist);
  for (const c of chunks.slice(0, 12)) console.log(`${(c.bytes / 1e6).toFixed(2).padStart(6)} MB  ${c.file}`);
  console.log(`web entry ${file}: ${(bytes / 1e6).toFixed(2)} MB (budget ${(WEB_ENTRY_BUDGET_BYTES / 1e6).toFixed(1)} MB)`);
  if (bytes > WEB_ENTRY_BUDGET_BYTES) {
    console.error("web entry bundle over budget — keep course content in the per-course chunks (src/content/course-loaders.ts)");
    process.exit(1);
  }
}
