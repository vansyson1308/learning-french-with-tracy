/**
 * CLI for the release identity gate (Phase 10 Gate 1).
 *
 *   bun scripts/release-identity-gate.ts            # CI: identity drift + record consistency
 *   EAS_BUILD_PROFILE=production bun scripts/release-identity-gate.ts
 *                                                    # EAS pre-install hook: refuses store builds
 *                                                    # under an unconfirmed identity
 *
 * Exit 1 on any error so both CI and EAS Build stop.
 */
import { readFileSync } from "fs";

import { evaluateReleaseIdentity, type IdentityRecord } from "./lib/release-identity";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8")) as unknown;

const record = read("release/identity.json") as IdentityRecord;
const app = (read("app.json") as { expo: unknown }).expo as Parameters<
  typeof evaluateReleaseIdentity
>[0]["app"];
const eas = read("eas.json") as Parameters<typeof evaluateReleaseIdentity>[0]["eas"];

const result = evaluateReleaseIdentity({
  record,
  app,
  eas,
  buildProfile: process.env.EAS_BUILD_PROFILE ?? null,
});

for (const note of result.notes) console.log(note);
for (const error of result.errors) console.error(`release identity: ${error}`);
if (!result.ok) {
  console.error("release identity gate FAILED");
  process.exit(1);
}
console.log("release identity gate passed");
