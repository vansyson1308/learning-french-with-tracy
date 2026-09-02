/**
 * Release identity gate (Phase 10 Gate 1, §7-§9): a pure check that the
 * app's distribution identity is (a) exactly what release/identity.json
 * records — so an identity change is always a deliberate, reviewed edit of
 * the record, never a drive-by — and (b) confirmed as OWNED before any
 * store-distribution build is allowed to proceed.
 *
 * Store identifiers are durable: a build uploaded under the wrong bundle
 * id or package name cannot be un-published. The gate therefore fails
 * closed: an unconfirmed identity permits local/internal work and refuses
 * store profiles.
 */

export type IdentityRecord = {
  schemaVersion: 1;
  identity: {
    displayName: string;
    slug: string;
    /** Expo account that owns the project; null after the identity migration until `eas init` under the owner's account. */
    owner: string | null;
    iosBundleIdentifier: string;
    androidPackage: string;
    /** EAS project id; null after the migration until `eas init` writes the owner's own. */
    easProjectId: string | null;
    ascAppId: string | null;
  };
  ownership: {
    status: "unconfirmed" | "confirmed";
    confirmedBy: string | null;
    confirmedOn: string | null;
    evidence: string[];
    note?: string;
  };
  storeDistribution: "blocked" | "allowed";
};

export type AppConfigView = {
  name?: unknown;
  slug?: unknown;
  owner?: unknown;
  ios?: { bundleIdentifier?: unknown };
  android?: { package?: unknown };
  extra?: { eas?: { projectId?: unknown } };
};

export type EasConfigView = {
  build?: Record<string, { distribution?: unknown } | undefined>;
  submit?: Record<string, { ios?: { ascAppId?: unknown } } | undefined>;
};

export type IdentityGateInput = {
  record: IdentityRecord;
  app: AppConfigView;
  eas: EasConfigView;
  /** EAS build profile being built, when known (EAS_BUILD_PROFILE). */
  buildProfile?: string | null;
};

export type IdentityGateResult = {
  ok: boolean;
  /** Hard failures — a build or CI run must stop. */
  errors: string[];
  /** Facts worth printing (never failures). */
  notes: string[];
  /** The single line a release owner needs. */
  storeDistribution: "BLOCKED" | "ALLOWED";
};

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Is this EAS build profile one whose artifact could reach a store? */
export function isStoreProfile(eas: EasConfigView, profile: string): boolean {
  const entry = eas.build?.[profile];
  // EAS defaults `distribution` to "store"; only an explicit "internal"
  // profile produces artifacts that cannot be submitted.
  return str(entry?.distribution) !== "internal";
}

export function evaluateReleaseIdentity(input: IdentityGateInput): IdentityGateResult {
  const errors: string[] = [];
  const notes: string[] = [];
  const { record, app, eas } = input;

  const checks: [string, string | null, string | null][] = [
    ["app.json expo.name", str(app.name), record.identity.displayName],
    ["app.json expo.slug", str(app.slug), record.identity.slug],
    ["app.json expo.owner", str(app.owner), record.identity.owner],
    ["app.json ios.bundleIdentifier", str(app.ios?.bundleIdentifier), record.identity.iosBundleIdentifier],
    ["app.json android.package", str(app.android?.package), record.identity.androidPackage],
    ["app.json extra.eas.projectId", str(app.extra?.eas?.projectId), record.identity.easProjectId],
    [
      "eas.json submit.production.ios.ascAppId",
      str(eas.submit?.production?.ios?.ascAppId),
      record.identity.ascAppId,
    ],
  ];
  for (const [field, actual, recorded] of checks) {
    if (actual !== recorded) {
      errors.push(
        `${field} is ${JSON.stringify(actual)} but release/identity.json records ${JSON.stringify(
          recorded
        )} — identity changes are an owner decision: update the record (and RELEASE_IDENTITY.md) in the same change.`
      );
    }
  }

  const ownership = record.ownership;
  if (ownership.status === "confirmed") {
    if (!ownership.confirmedBy) errors.push("ownership is 'confirmed' but confirmedBy is empty.");
    if (!ownership.confirmedOn || Number.isNaN(Date.parse(ownership.confirmedOn))) {
      errors.push("ownership is 'confirmed' but confirmedOn is not an ISO date.");
    }
    if (ownership.evidence.length === 0) {
      errors.push("ownership is 'confirmed' but no evidence is recorded (what proves control of the Expo account, bundle id, and store records?).");
    }
  } else if (record.storeDistribution !== "blocked") {
    errors.push("ownership is 'unconfirmed' but storeDistribution is not 'blocked' — an unowned identity can never be distribution-allowed.");
  }

  const storeDistribution: "BLOCKED" | "ALLOWED" =
    ownership.status === "confirmed" && record.storeDistribution === "allowed" && errors.length === 0
      ? "ALLOWED"
      : "BLOCKED";
  notes.push(`STORE DISTRIBUTION IDENTITY = ${storeDistribution}`);
  notes.push(
    `identity: owner=${record.identity.owner ?? "none"} ios=${record.identity.iosBundleIdentifier} android=${record.identity.androidPackage} easProjectId=${record.identity.easProjectId ?? "none"} ascAppId=${record.identity.ascAppId ?? "none"}`
  );

  const profile = input.buildProfile ?? null;
  if (profile) {
    if (isStoreProfile(eas, profile) && storeDistribution === "BLOCKED") {
      errors.push(
        `EAS build profile "${profile}" produces a store-distributable artifact, but the release identity is not confirmed as owned. Refusing to build under an identity this project cannot prove it controls. Record ownership in release/identity.json (status 'confirmed', confirmedBy, confirmedOn, evidence) and set storeDistribution to 'allowed', or build an "internal" profile.`
      );
    } else {
      notes.push(`build profile "${profile}": ${isStoreProfile(eas, profile) ? "store" : "internal"} distribution — permitted.`);
    }
  }

  return { ok: errors.length === 0, errors, notes, storeDistribution };
}
