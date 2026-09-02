import { describe, expect, test } from "bun:test";

import { applyTriple, bumpTriple, compareSemver, readTriple } from "../bump-build";

const appJson = `{
  "expo": {
    "name": "X",
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"
    },
    "android": {
      "versionCode": 1
    }
  }
}
`;

describe("bump-build (release/VERSIONING.md)", () => {
  test("bumps both platform build numbers together and keeps the version", () => {
    expect(bumpTriple({ version: "1.0.0", buildNumber: "1", versionCode: 1 })).toEqual({ version: "1.0.0", buildNumber: "2", versionCode: 2 });
  });
  test("sets a higher semantic version when asked, never a lower one", () => {
    expect(bumpTriple({ version: "1.0.0", buildNumber: "3", versionCode: 3 }, "1.0.1").version).toBe("1.0.1");
    expect(() => bumpTriple({ version: "1.0.1", buildNumber: "3", versionCode: 3 }, "1.0.0")).toThrow(/lower/);
    expect(() => bumpTriple({ version: "1.0.0", buildNumber: "3", versionCode: 3 }, "1.0")).toThrow(/MAJOR/);
  });
  test("refuses drifted or invalid build numbers", () => {
    expect(() => bumpTriple({ version: "1.0.0", buildNumber: "2", versionCode: 1 })).toThrow(/move together/);
    expect(() => bumpTriple({ version: "1.0.0", buildNumber: "0", versionCode: 0 })).toThrow(/positive/);
  });
  test("edits app.json textually, preserving formatting", () => {
    const current = readTriple(appJson);
    const next = bumpTriple(current, "1.1.0");
    const out = applyTriple(appJson, current, next);
    expect(out).toContain('"buildNumber": "2"');
    expect(out).toContain('"versionCode": 2');
    expect(out).toContain('"version": "1.1.0"');
    expect(out.split("\n").length).toBe(appJson.split("\n").length);
    expect(JSON.parse(out).expo.android.versionCode).toBe(2);
  });
  test("refuses an app.json without a local version source", () => {
    expect(() => readTriple('{"expo":{"version":"1.0.0"}}')).toThrow(/identity migration/);
  });
  test("semver comparison", () => {
    expect(compareSemver("1.2.3", "1.2.3")).toBe(0);
    expect(compareSemver("1.10.0", "1.9.9")).toBeGreaterThan(0);
    expect(compareSemver("0.9.0", "1.0.0")).toBeLessThan(0);
  });
});
