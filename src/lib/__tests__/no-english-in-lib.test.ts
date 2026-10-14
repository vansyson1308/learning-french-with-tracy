/**
 * P2a contract: no user-facing English sentence lives in `src/lib`
 * outside the catalogues — engines return message keys + params and the
 * UI formats them. The scan flags sentence-like string literals (a
 * capitalised word followed by two or more words, or three words ending
 * in sentence punctuation). Developer diagnostics (`throw`, `console.*`,
 * invariant problem codes in lowercase) and the allowlisted catalogue-like
 * files are exempt; everything else must become a catalogue key.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const LIB = path.resolve(__dirname, "..");

/** Catalogue-like files: text keyed by language, never a loose English sentence. */
const ALLOWLIST = new Set([
  "i18n/catalog/en.json",
  "i18n/catalog/vi.json",
  "content-strings.ts",
  "privacy-policy.ts",
  // Deterministic test-only tutor mock; never imported by production code (tutor-seam import-graph test).
  "tutor/mock-provider.ts",
]);

const SENTENCE = /^[A-Z][a-z’']*(?: [a-z’'(),-]+){2,}|(?:[A-Za-z’']+ ){2}[A-Za-z’']+[.!?]/;
const LITERAL = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
const SKIP_LINE = /^\s*(\/\/|\*|\/\*)|throw new |console\.|Error\(|\.test\(|new RegExp|@deprecated/;

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const rel = path.relative(LIB, abs).replace(/\\/g, "/");
    if (rel.startsWith("__tests__") || rel.startsWith("__fixtures__")) continue;
    if (statSync(abs).isDirectory()) walk(abs, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(rel);
  }
}

export function englishSentencesIn(source: string): string[] {
  const hits: string[] = [];
  let inBlockComment = false;
  for (const line of source.split("\n")) {
    if (inBlockComment) {
      if (line.includes("*/")) inBlockComment = false;
      continue;
    }
    if (/^\s*\/\*/.test(line) && !line.includes("*/")) {
      inBlockComment = true;
      continue;
    }
    if (SKIP_LINE.test(line)) continue;
    for (const m of line.matchAll(LITERAL)) {
      const text = m[1] ?? m[2] ?? m[3] ?? "";
      if (SENTENCE.test(text)) hits.push(text);
    }
  }
  return hits;
}

describe("no English sentences in src/lib (outside the catalogues)", () => {
  test("every lib module returns message keys, not prose", () => {
    const files: string[] = [];
    walk(LIB, files);
    const offenders: Record<string, string[]> = {};
    for (const rel of files) {
      if (ALLOWLIST.has(rel)) continue;
      const hits = englishSentencesIn(readFileSync(path.join(LIB, rel), "utf8"));
      if (hits.length > 0) offenders[rel] = hits;
    }
    expect(offenders).toEqual({});
  });
  test("the scanner recognises prose and ignores diagnostics", () => {
    expect(englishSentencesIn('const a = "Write your answer in French.";')).toEqual(["Write your answer in French."]);
    expect(englishSentencesIn('const a = "the je form";')).toEqual([]);
    expect(englishSentencesIn('throw new Error("this is a developer message");')).toEqual([]);
    expect(englishSentencesIn('// This is a comment with words.')).toEqual([]);
    expect(englishSentencesIn('problems.push("invalid completed lessons in x");')).toEqual([]);
  });
});
