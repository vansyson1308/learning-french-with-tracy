/**
 * Regenerates release/PRIVACY_POLICY.md from src/lib/privacy-policy.ts (the
 * single source of truth; a test keeps the two identical). Run after any
 * wording change: `bun scripts/render-privacy-policy.ts`.
 */
import { writeFileSync } from "fs";

import { renderPrivacyPolicyMarkdown } from "../src/lib/privacy-policy";
import { safeResolve } from "./lib/pipeline";

const out = safeResolve("release/PRIVACY_POLICY.md");
writeFileSync(out, renderPrivacyPolicyMarkdown());
console.log(`wrote ${out}`);
