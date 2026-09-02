/**
 * Identity migration (V1 publication §3–§7). Two owner-gated steps:
 *
 *   migrate — after the owner confirms the immutable identifier set ONCE:
 *     bun scripts/apply-identity.ts migrate \
 *       --name "Learning French with Tracy" --slug learning-french-with-tracy \
 *       --scheme learningfrenchtracy --ios com.example.app --android com.example.app \
 *       --confirmed-by "owner" --evidence "owner reply YES on 2026-09-02" [--dry-run]
 *     Rewrites app.json (name, slug, scheme, bundle id, package, version
 *     1.0.0, build 1 / versionCode 1, drops the inherited Expo owner and
 *     project id), eas.json (local version source, no inherited ASC id) and
 *     release/identity.json (status confirmed, distribution still BLOCKED).
 *
 *   link — after `eas init` on the owner's machine wrote the new project
 *   id (and the App Store Connect app exists):
 *     bun scripts/apply-identity.ts link --eas-project-id <uuid> [--asc-app-id <id>] \
 *       --evidence "eas init under the owner's account" [--allow-store]
 *     Records the ids (and, with --allow-store, sets distribution ALLOWED —
 *     the moment store builds become possible).
 *
 * Edits are textual so app.json keeps its formatting; every pattern must
 * match exactly once or nothing is written. Never registers anything with
 * a store — it only records what the owner decided.
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dir, "..");
const APP = path.join(ROOT, "app.json");
const EAS = path.join(ROOT, "eas.json");
const IDENTITY = path.join(ROOT, "release/identity.json");

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SCHEME = /^[a-z][a-z0-9+.-]*$/;
const BUNDLE = /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9_]*){1,}$/;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);
const need = (name: string) => arg(name) ?? fail(`--${name} is required`);
function fail(msg: string): never {
  console.error(`apply-identity: ${msg}`);
  process.exit(1);
}

/** Replace exactly one match or refuse. */
export function replaceOnce(text: string, pattern: RegExp, replacement: string, what: string): string {
  const matches = text.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`));
  if (!matches || matches.length !== 1) fail(`${what}: expected exactly one match, found ${matches?.length ?? 0}`);
  return text.replace(pattern, replacement);
}

export function migrateAppJson(text: string, d: { name: string; slug: string; scheme: string; ios: string; android: string }): string {
  let out = text;
  out = replaceOnce(out, /"name": "[^"]*"/, `"name": ${JSON.stringify(d.name)}`, "expo.name");
  out = replaceOnce(out, /"slug": "[^"]*"/, `"slug": ${JSON.stringify(d.slug)}`, "expo.slug");
  out = replaceOnce(out, /"scheme": "[^"]*"/, `"scheme": ${JSON.stringify(d.scheme)}`, "expo.scheme");
  out = replaceOnce(out, /"version": "[^"]*"/, `"version": "1.0.0"`, "expo.version");
  out = replaceOnce(out, /\n(\s*)"owner": "[^"]*",/, "", "expo.owner (removed)");
  out = replaceOnce(out, /"bundleIdentifier": "[^"]*"/, `"bundleIdentifier": ${JSON.stringify(d.ios)},\n      "buildNumber": "1"`, "ios.bundleIdentifier");
  out = replaceOnce(out, /"package": "[^"]*"/, `"package": ${JSON.stringify(d.android)},\n      "versionCode": 1`, "android.package");
  // The inherited EAS project id: a NEW id is written by `eas init` under the owner's account.
  out = replaceOnce(out, /,?\n(\s*)"eas": \{\s*"projectId": "[^"]*"\s*\}/, "", "extra.eas.projectId (removed)");
  out = out.replace(/"extra": \{\s*\},?\n/, ""); // drop an emptied extra block
  const parsed = JSON.parse(out) as { expo: Record<string, unknown> };
  if ((parsed.expo.extra as { eas?: unknown } | undefined)?.eas) fail("extra.eas still present");
  return out;
}

export function migrateEasJson(text: string): string {
  const eas = JSON.parse(text) as {
    cli?: Record<string, unknown>;
    build?: Record<string, Record<string, unknown>>;
    submit?: Record<string, { ios?: Record<string, unknown> }>;
  };
  eas.cli = { ...(eas.cli ?? {}), appVersionSource: "local" };
  for (const profile of Object.values(eas.build ?? {})) delete profile.autoIncrement;
  if (eas.submit?.production?.ios) delete eas.submit.production.ios.ascAppId;
  return `${JSON.stringify(eas, null, 2)}\n`;
}

type Identity = {
  schemaVersion: 1;
  identity: { displayName: string; slug: string; owner: string | null; iosBundleIdentifier: string; androidPackage: string; easProjectId: string | null; ascAppId: string | null };
  ownership: { status: "unconfirmed" | "confirmed"; confirmedBy: string | null; confirmedOn: string | null; evidence: string[]; note?: string };
  storeDistribution: "blocked" | "allowed";
};

if (import.meta.main) {
  const mode = process.argv[2];
  const dryRun = flag("dry-run");
  const today = new Date().toISOString().slice(0, 10);
  const identity = JSON.parse(readFileSync(IDENTITY, "utf8")) as Identity;

  if (mode === "migrate") {
    const d = { name: need("name"), slug: need("slug"), scheme: need("scheme"), ios: need("ios"), android: need("android") };
    if (!SLUG.test(d.slug)) fail(`slug must be lowercase kebab-case: ${d.slug}`);
    if (!SCHEME.test(d.scheme)) fail(`scheme must be a valid URL scheme: ${d.scheme}`);
    if (!BUNDLE.test(d.ios) || !BUNDLE.test(d.android)) fail("bundle id / package must be reverse-DNS (e.g. com.example.app)");
    if (identity.ownership.status === "confirmed") fail("identity already confirmed — a confirmed identity is immutable; use `link` for project ids");
    const app = migrateAppJson(readFileSync(APP, "utf8"), d);
    const eas = migrateEasJson(readFileSync(EAS, "utf8"));
    const next: Identity = {
      ...identity,
      identity: { displayName: d.name, slug: d.slug, owner: null, iosBundleIdentifier: d.ios, androidPackage: d.android, easProjectId: null, ascAppId: null },
      ownership: {
        status: "confirmed",
        confirmedBy: need("confirmed-by"),
        confirmedOn: arg("confirmed-on") ?? today,
        evidence: [need("evidence")],
        note: "Personal standalone identity chosen by the owner for v1 (Option B, confirmed once). The Expo project id and the App Store Connect app id are created under the owner's own accounts and recorded with `apply-identity.ts link`; store distribution stays blocked until then.",
      },
      storeDistribution: "blocked",
    };
    if (dryRun) {
      console.log(app);
      console.log(eas);
      console.log(JSON.stringify(next, null, 2));
      console.log("(dry run) nothing written");
    } else {
      writeFileSync(APP, app);
      writeFileSync(EAS, eas);
      writeFileSync(IDENTITY, `${JSON.stringify(next, null, 2)}\n`);
      console.log(`identity applied: ${d.name} · ${d.ios} · ${d.android} · slug ${d.slug} · scheme ${d.scheme} · version 1.0.0 build 1`);
      console.log("next: bun run test && bun run release:identity; then README/site/store drafts mention the identifiers; then `eas init` on the owner's machine and `apply-identity.ts link`");
    }
  } else if (mode === "link") {
    if (identity.ownership.status !== "confirmed") fail("run `migrate` first");
    const easProjectId = need("eas-project-id");
    const ascAppId = arg("asc-app-id") ?? null;
    const app = JSON.parse(readFileSync(APP, "utf8")) as { expo: { extra?: { eas?: { projectId?: string } } } };
    if (app.expo.extra?.eas?.projectId !== easProjectId) fail(`app.json extra.eas.projectId is ${JSON.stringify(app.expo.extra?.eas?.projectId)}; run \`eas init\` under the owner's account first so app.json carries ${easProjectId}`);
    const next: Identity = {
      ...identity,
      identity: { ...identity.identity, easProjectId, ascAppId },
      ownership: { ...identity.ownership, evidence: [...identity.ownership.evidence, need("evidence")] },
      storeDistribution: flag("allow-store") ? "allowed" : identity.storeDistribution,
    };
    if (ascAppId) {
      const easText = readFileSync(EAS, "utf8");
      const eas = JSON.parse(easText) as { submit?: Record<string, { ios?: Record<string, unknown> }> };
      eas.submit = { ...(eas.submit ?? {}), production: { ...(eas.submit?.production ?? {}), ios: { ...(eas.submit?.production?.ios ?? {}), ascAppId } } };
      if (!dryRun) writeFileSync(EAS, `${JSON.stringify(eas, null, 2)}\n`);
    }
    if (dryRun) console.log(JSON.stringify(next, null, 2));
    else {
      writeFileSync(IDENTITY, `${JSON.stringify(next, null, 2)}\n`);
      console.log(`linked: easProjectId ${easProjectId}${ascAppId ? `, ascAppId ${ascAppId}` : ""}; store distribution ${next.storeDistribution.toUpperCase()}`);
    }
  } else {
    fail("usage: apply-identity.ts migrate|link … (see header)");
  }
}
