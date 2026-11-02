/**
 * QC 2026-11-03 §2: Unicode-3.0 and CC-BY-SA-3.0 for data files only,
 * OFL-1.1 for fonts only; LGPL and Arphic stay off the allowlist; the
 * registry records the decision behind every scoped licence it uses.
 */
import { describe, expect, test } from "bun:test";

import { ALLOWED_LICENSES, SCOPED_LICENSES, SourceRegistrySchema } from "../../content/schema";
import { coverFitsScope, scopeErrors } from "../lib/licence-scope";
import { lineageErrors } from "../lib/voice-lineage";
import { readJson, validateRegistry } from "../lib/pipeline";

const POLICY = [
  { licence: "Unicode-3.0", scope: "data" as const },
  { licence: "CC-BY-SA-3.0", scope: "data" as const },
  { licence: "OFL-1.1", scope: "font" as const },
];
const src = (license: string, ...covers: string[]) => ({ id: `t-${license}`, license, covers });

describe("scoped licences", () => {
  test("the three additions are allowlisted with their scope; LGPL and Arphic are not", () => {
    expect(SCOPED_LICENSES).toEqual({ "Unicode-3.0": "data", "CC-BY-SA-3.0": "data", "OFL-1.1": "font" });
    for (const l of Object.keys(SCOPED_LICENSES)) expect(ALLOWED_LICENSES).toContain(l);
    for (const l of ["LGPL-3.0", "LGPL-2.1", "Arphic-1999", "GPL-3.0", "CC-BY-NC-4.0", "CC-BY-ND-4.0"]) expect(ALLOWED_LICENSES).not.toContain(l);
    const entry = { id: "x", name: "x", kind: "x", url: "x", attribution: "x", retrievedAt: "2026-11-03", covers: ["content/zh/x.json"] };
    expect(SourceRegistrySchema.safeParse({ sources: [{ ...entry, license: "Arphic-1999" }] }).success).toBe(false);
    expect(SourceRegistrySchema.safeParse({ sources: [{ ...entry, license: "LGPL-3.0" }] }).success).toBe(false);
  });

  test("data licences cover data files, never code", () => {
    expect(scopeErrors([src("Unicode-3.0", "content/zh/hanviet/unihan.json", "assets/lexicon/")], POLICY)).toEqual([]);
    expect(scopeErrors([src("CC-BY-SA-3.0", "content/ja/strokes/")], POLICY)).toEqual([]);
    for (const code of ["src/lib/languages/zh.ts", "scripts/lib/hanviet.ts", "src/components/Ruby.tsx", "content/ja/gen.py"]) {
      expect(scopeErrors([src("Unicode-3.0", code)], POLICY), code).toHaveLength(1);
      expect(scopeErrors([src("CC-BY-SA-3.0", code)], POLICY), code).toHaveLength(1);
    }
  });

  test("OFL covers font files only", () => {
    expect(coverFitsScope("assets/fonts/", "font")).toBe(true);
    expect(coverFitsScope("assets/x/NotoSansJP-Regular.otf", "font")).toBe(true);
    expect(scopeErrors([src("OFL-1.1", "content/ja/kana.json")], POLICY)).toHaveLength(1);
    expect(scopeErrors([src("OFL-1.1", "src/lib/fonts.ts")], POLICY)).toHaveLength(1);
  });

  test("a scoped licence needs its decision recorded in the registry policy, with the same scope", () => {
    expect(scopeErrors([src("Unicode-3.0", "content/zh/x.json")], [])).toHaveLength(1);
    expect(scopeErrors([src("OFL-1.1", "assets/fonts/")], [{ licence: "OFL-1.1", scope: "data" }])).toHaveLength(1);
    expect(scopeErrors([src("MIT", "src/lib/x.ts")], [])).toEqual([]);
  });

  test("a scoped licence never clears a voice's lineage", () => {
    const voice = (licence: string) => ({
      id: "kokoro-x",
      kind: "neural TTS voice used at pipeline time",
      lineage: [{ model: "m", dataset: "d", licence, url: "u" }],
    });
    expect(lineageErrors([voice("CC-BY-4.0")])).toEqual([]);
    for (const l of Object.keys(SCOPED_LICENSES)) expect(lineageErrors([voice(l)]), l).toHaveLength(1);
  });

  test("the committed registry records all three decisions and validates", () => {
    const reg = readJson("content/sources/registry.json") as { policy?: { licence: string; scope: string }[] };
    expect((reg.policy ?? []).map((p) => `${p.licence}:${p.scope}`).sort()).toEqual(["CC-BY-SA-3.0:data", "OFL-1.1:font", "Unicode-3.0:data"]);
    expect(validateRegistry().errors).toEqual([]);
  });
});
