/**
 * P1b contract: the runtime never branches on the French course or
 * language by name. Every capability comes from the course profile, every
 * id from the per-course registry, every locale from the profile, every
 * folding rule from the language plugin. The allowlist is exactly the
 * French plugin, the frozen French id map, and the historical v1→v2
 * migration (French-only by definition: it moved fr-en onto FSRS once).
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..", "..");

const FORBIDDEN = [
  /"fr-en"/,
  /\bFR_COURSE_ID\b/,
  /\bisFrench\b/,
  /\bFRENCH_LOCALE\b/,
  /\bfrenchRecognitionAvailable\b/,
  /\bfrenchOnDeviceModelInstalled\b/,
  /\bknownFrenchVocabulary\b/,
  /\bdueFrenchReviewQueue\b/,
  /\bundoLastFrenchReview\b/,
  /\bFR_SURFACE_FOR_ID\b/,
  /\bFR_LEXEME_IDS\b/,
  /\bisCuratedFrItemId\b/,
  /\bfrItemIdFor\b/,
  /\bfrCardForSurface\b/,
  /\bfrMemoryStrengthPercent\b/,
  /\bnormalizeSpokenFrench\b/,
  /\bnormalizeWrittenFrench\b/,
  /"fr-FR"/,
  /\bFR_LEXICON_DB/,
];

const ALLOWLIST = new Set([
  "lib/languages/fr.ts",
  "lib/learning/ids-fr.ts",
  "lib/persistence/migrations.ts",
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "__fixtures__" || entry === "content") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("no French hardcode in the runtime (P1b)", () => {
  const files = walk(ROOT).map((f) => path.relative(ROOT, f).split(path.sep).join("/"));

  test("the scan covers the runtime and the allowlist files exist", () => {
    expect(files.length).toBeGreaterThan(100);
    for (const allowed of ALLOWLIST) expect(files).toContain(allowed);
  });

  test("no runtime file outside the allowlist mentions the French course or language by identifier", () => {
    const hits: string[] = [];
    for (const rel of files) {
      if (ALLOWLIST.has(rel)) continue;
      const source = readFileSync(path.join(ROOT, rel), "utf8");
      source.split("\n").forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, "");
        if (/^\s*\*|^\s*\/\*/.test(line)) return; // doc comments may mention history
        for (const pattern of FORBIDDEN) {
          if (pattern.test(code)) hits.push(`${rel}:${i + 1}: ${pattern} → ${line.trim().slice(0, 100)}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  test("capabilities.ts is gone — profiles are the only capability source", () => {
    expect(files).not.toContain("lib/capabilities.ts");
    expect(files).toContain("lib/course-profile.ts");
  });
});
