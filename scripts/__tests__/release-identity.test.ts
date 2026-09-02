/**
 * Release identity fail-closed behaviour (Phase 10 Gate 1, §7-§9, §74).
 */
import { describe, expect, test } from "bun:test";

import { readFileSync } from "fs";

import {
  evaluateReleaseIdentity,
  isStoreProfile,
  type IdentityRecord,
} from "../lib/release-identity";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const record = read("release/identity.json") as IdentityRecord;
const app = read("app.json").expo;
const eas = read("eas.json");

describe("the committed identity record", () => {
  test("matches app.json/eas.json exactly (no silent identity drift)", () => {
    const result = evaluateReleaseIdentity({ record, app, eas });
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  const unconfirmed = record.ownership.status === "unconfirmed";

  test("store distribution is BLOCKED until the owner's own project and store records are linked", () => {
    const result = evaluateReleaseIdentity({ record, app, eas });
    if (unconfirmed || record.identity.easProjectId === null) {
      expect(record.storeDistribution).toBe("blocked");
      expect(result.storeDistribution).toBe("BLOCKED");
      expect(result.notes[0]).toBe("STORE DISTRIBUTION IDENTITY = BLOCKED");
    } else {
      expect(result.ok).toBe(true);
    }
  });

  test("while unconfirmed, the record still carries exactly the inherited values Phase 10 audited", () => {
    if (!unconfirmed) return; // migrated: the confirmed identity is pinned by the drift test above
    expect(record.identity.owner).toBe("ahmet909");
    expect(record.identity.iosBundleIdentifier).toBe("com.ahmet.lingo");
    expect(record.identity.androidPackage).toBe("com.ahmet.lingo");
    expect(record.identity.ascAppId).toBe("6781818623");
  });

  test("once confirmed, the identity is the owner's own (never the inherited one) with who/when/evidence", () => {
    if (unconfirmed) return;
    expect(record.identity.iosBundleIdentifier).not.toBe("com.ahmet.lingo");
    expect(record.identity.androidPackage).not.toBe("com.ahmet.lingo");
    expect(record.identity.owner).not.toBe("ahmet909");
    expect(record.identity.easProjectId).not.toBe("c5e5ee9a-1aac-4b7c-ba0f-a97897c4d348");
    expect(record.ownership.confirmedBy).toBeTruthy();
    expect(record.ownership.evidence.length).toBeGreaterThan(0);
    expect(app.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(app.ios?.buildNumber).toMatch(/^\d+$/);
    expect(typeof app.android?.versionCode).toBe("number");
  });
});

describe("fail-closed behaviour", () => {
  test("a store-distribution build profile is refused while distribution is blocked", () => {
    if (record.storeDistribution === "allowed") return; // linked and allowed: production builds are the point
    const result = evaluateReleaseIdentity({ record, app, eas, buildProfile: "production" });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/Refusing to build/);
  });

  test("an internal-distribution profile is permitted (QA builds never reach a store)", () => {
    const result = evaluateReleaseIdentity({ record, app, eas, buildProfile: "development" });
    expect(isStoreProfile(eas, "development")).toBe(false);
    expect(result.ok).toBe(true);
  });

  test("an unknown profile defaults to store distribution and is refused", () => {
    const result = evaluateReleaseIdentity({ record, app, eas, buildProfile: "preview" });
    expect(isStoreProfile(eas, "preview")).toBe(true);
    expect(result.ok).toBe(false);
  });

  test("changing the bundle identifier without updating the record fails", () => {
    const drifted = { ...app, ios: { ...app.ios, bundleIdentifier: "com.example.tracy" } };
    const result = evaluateReleaseIdentity({ record, app: drifted, eas });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/ios\.bundleIdentifier/);
    expect(result.errors[0]).toMatch(/owner decision/);
  });

  test("an unconfirmed record cannot declare store distribution allowed", () => {
    const inconsistent: IdentityRecord = { ...record, storeDistribution: "allowed" };
    const result = evaluateReleaseIdentity({ record: inconsistent, app, eas });
    expect(result.ok).toBe(false);
    expect(result.storeDistribution).toBe("BLOCKED");
  });

  test("a 'confirmed' record needs who, when, and evidence before it unblocks anything", () => {
    const halfConfirmed: IdentityRecord = {
      ...record,
      ownership: { status: "confirmed", confirmedBy: null, confirmedOn: null, evidence: [] },
      storeDistribution: "allowed",
    };
    const result = evaluateReleaseIdentity({ record: halfConfirmed, app, eas, buildProfile: "production" });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    expect(result.storeDistribution).toBe("BLOCKED");
  });

  test("a properly confirmed record allows a production build", () => {
    const confirmed: IdentityRecord = {
      ...record,
      ownership: {
        status: "confirmed",
        confirmedBy: "owner@example.test",
        confirmedOn: "2026-09-02",
        evidence: ["App Store Connect: team admin for app record 6781818623"],
      },
      storeDistribution: "allowed",
    };
    const result = evaluateReleaseIdentity({ record: confirmed, app, eas, buildProfile: "production" });
    expect(result.ok).toBe(true);
    expect(result.storeDistribution).toBe("ALLOWED");
  });
});
