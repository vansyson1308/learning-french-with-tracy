# Release readiness dossier (Phase 10 §63-§65, §73-§74, §81-§84)

This is the index of the Phase-10 evidence. Every claim links to a document
in `release/`, a test in the repository, or a CI run. Wording follows the
program's rule: nothing is marked done that was not done here.

## Final product state

**ENGINEERING COMPLETE — RELEASE CONDITIONAL.**

- Engineering-complete criteria (§82): all met — table in `RELEASE_CHECKLIST.md`.
- Release-ready criteria (§83): blocked on prerequisites only the owner
  holds — store identity ownership (`RELEASE_IDENTITY.md`, gate fails
  closed), signing credentials, a physical-device acceptance pass
  (`NATIVE_ACCEPTANCE.md`), the hosted privacy-policy URL and support
  contact.
- Open P0/P1: none (`KNOWN_LIMITATIONS.md`).

## Gates

| Gate | Outcome | Record |
|---|---|---|
| 0 — SDK 57 stabilization | Expo SDK 57.0.19 / RN 0.86.3 / Hermes V1 0.17 (`250829098.0.17`), the first release past the Hermes V1 memory regression; expo-doctor Hermes check passes; full regression green | `SDK57_UPGRADE.md`, `RESEARCH.md` |
| 1 — Release identity | inherited identity (`ahmet909` / `com.ahmet.lingo` / EAS `c5e5ee9a…` / ASC `6781818623`) could not be proven owned; **STORE DISTRIBUTION IDENTITY = BLOCKED**, enforced by `release/identity.json` + `bun run release:identity` in CI and the EAS pre-install hook; no identity field was mutated | `RELEASE_IDENTITY.md`, `identity.json`, `release-identity.test.ts` |
| 2 — Learner A1 attainment | authored per-domain policy (5 domains, 14 required essential objectives) validated at compile time; capstone can never cover a whole domain; statuses demonstrated / needs_practice / partial / technical_unavailable / no_evidence; overall only when the course is claimable and every domain is demonstrated; wording "CEFR-aligned A1 estimate", never certified/official | `content/fr/assessment/attainment.json`, `a1-estimate.test.ts`, `a1-claim-redteam.test.ts`, `ASSESSMENT_DOSSIER.md` |
| 3 — MCQ position leakage | deterministic seeded option order per administration; distribution tests over the real banks; parallel forms audited (disjoint, same composition, no shared stimulus) | `option-order.ts`, `option-order.test.ts`, `forms-audit.test.ts` |

## Automated QA matrix (§73) — results at the release-candidate head

| Check | Result | Where |
|---|---|---|
| `bun install --frozen-lockfile` | reproduces, "no changes" (1,147 installs / 1,051 packages) | CI + local |
| `bunx expo-doctor` | 19/21; the 2 failures are the network-only checks (config schema fetch, React Native Directory) unreachable from this environment; passes on a connected machine per `SDK57_UPGRADE.md` | local |
| `bunx tsc --noEmit` | clean | CI + local |
| `bunx eslint .` | 0 errors (pre-existing warnings only) | CI + local |
| `bun test` in UTC, America/Los_Angeles, Asia/Tokyo, Pacific/Kiritimati (UTC+14), Pacific/Pago_Pago (UTC−11) | 1,173 pass / 0 fail in every lane | CI matrix + local |
| `bunx jest` (jest-expo integration) | 69 pass / 10 suites | CI + local |
| `bun scripts/validate-content.ts` | passed (packs + registry + rich lexicon + pedagogy + assessment + reception + speech + writing + interaction) | CI + local |
| compile-twice determinism | identical artifact hashes | local; CI drift guard |
| `bun scripts/check-audio.ts` | 859 baseline files verified; every pack audio reference resolves | CI + local |
| reception audio census / SQLite lexicon integrity / assessment reports | emitted by the compiler; `lexicon-db.test.ts` runs `PRAGMA integrity_check` + foreign keys and the logical-dump determinism contract | CI + local |
| secret / key scan | client bundle scan test green; web export contains no API host or `sk-` literal; working tree and full history clean | `tutor-seam.test.ts`, `SECURITY_AUDIT.md`, `RELEASE_REDTEAM.md` |
| web export | 28 MB static export | CI export-size job + local |
| Hermes bytecode | 5,763,725 bytes (SDK 57 measurement, −29,254 vs SDK 56) | `PERFORMANCE.md` |
| browser E2E (`bun run e2e:web`) | 12/12 on the post-red-team export | CI + local |
| native builds (dispatch-only workflows) | Android release APK: success, targetSdk 36, no removed permission; iOS simulator: success, no background modes, usage strings and privacy manifests present | `NATIVE_ACCEPTANCE.md`, `RC_ARTIFACTS.md` |
| release identity gate | BLOCKED for store profiles, passes for internal/QA | CI step; probe in `RELEASE_REDTEAM.md` |

CI evidence: the pull request's check runs
(https://github.com/vansyson1308/learning-french-with-tracy/pull/15). On
`1320fe9` the pull-request run 33589674856 was green in all six jobs; the
push run 33589672872 hit a 30 s test budget in `lexicon-db.test.ts` on a
loaded runner (37.6 s), raised to 120 s in the next commit with no
assertion changed.

## Release-critical tests (§74) — where each lives

| Requirement | Test |
|---|---|
| SDK-57 regression of every earlier phase | the whole `bun test` + `jest` battery (Phase 0-9 suites) on SDK 57 |
| Identity gate fails closed | `scripts/__tests__/release-identity.test.ts` |
| Authored attainment policy validated; capstone never a shortcut | `scripts/__tests__/assessment.test.ts` (attainment rules), `src/lib/__tests__/a1-estimate.test.ts` |
| A1-claim red-team personas (guessing, capstone-only, speech unavailable, luckiest history) | `src/lib/__tests__/a1-claim-redteam.test.ts` |
| Option-order distribution and stability; form integrity | `src/lib/__tests__/option-order.test.ts`, `scripts/__tests__/forms-audit.test.ts` |
| Privacy wording, disclosure text, no offline promise anywhere | `scripts/__tests__/privacy-policy.test.ts` |
| Permission minimization pinned | `scripts/__tests__/permissions.test.ts` |
| Transcripts never persisted; attempt audio swept | `src/lib/__tests__/speech-privacy.test.ts`, `speech-cache.test.ts` |
| Historical personas v0…Phase 9 → final; backup round trip; corrupt state fails closed | `src/lib/__tests__/historical-personas.test.ts`, `backup.test.ts` |
| Writing-rubric / speech-grader / interaction attacks over every authored item | `src/lib/__tests__/rubric-speech-attacks.test.ts`, `interaction-attacks.test.ts` |
| Extreme-timezone streak behaviour | `src/lib/__tests__/streak.test.ts` in the Kiritimati and Pago Pago lanes |
| Accessibility roles/states on interactive controls | jest integration suites (`integration-tests/*.test.tsx`) + `ACCESSIBILITY_AUDIT.md` |
| Web-tier journeys | `e2e/smoke-web.mjs` |
| Content single-source mirrors, reserved-item isolation, answer-leak rule | `scripts/__tests__/speech-validators.test.ts`, writing/interaction validators via `validate-content.ts` |

## Version audit (§65)

`expo.version` 1.1.0 (unchanged); `package.json` 1.0.0 (cosmetic, not
shipped); iOS build number and Android `versionCode` are allocated by EAS
(`appVersionSource: remote`) for a project this fork cannot read — no build
number is claimed. Proposal (not applied): Option A → the next version above
the live store version; Option B → 1.0.0 / build 1 under the new identity.
Details: `RELEASE_IDENTITY.md`, `STORE_METADATA.md`.

## Store metadata truth (§66)

The stored listing is upstream's (its URLs, its "hearts" claim). The draft
listing in `STORE_METADATA.md` and the notes in `RELEASE_NOTES.md` claim no
certification, no pronunciation scoring, no tutor, no fully offline speech
and no A2. Screenshots must be taken from the release build.

## Document index

| Document | Content |
|---|---|
| `BASELINE.md` | §0 authoritative start state |
| `RESEARCH.md` | current-docs research (Expo/Apple/Google/CoE), what was reachable |
| `SDK57_UPGRADE.md` | Gate 0 before/after |
| `RELEASE_IDENTITY.md`, `identity.json` | Gate 1 audit, the owner's decision, the fail-closed record |
| `ASSESSMENT_DOSSIER.md` | construct, blueprint, scoring, attainment policy, limitations, empirical work not done |
| `CONTENT_REDTEAM.md` | two-pass French red team, fixes, declined items, engine changes |
| `NATIVE_ACCEPTANCE.md` | environment ceiling, CI build facts, device matrix (NOT TESTED rows) |
| `ACCESSIBILITY_AUDIT.md` | per-label support, fixes, device pass outstanding |
| `PRIVACY_POLICY.md`, `PRIVACY_INVENTORY.md`, `PRIVACY_MANIFEST.md`, `APP_PRIVACY.md`, `DATA_SAFETY.md`, `SECURITY_AUDIT.md` | privacy / security / legal |
| `PERFORMANCE.md` | sizes, lifecycle audit, soak design, no Baseline Profile decision |
| `UX_REVIEW.md` | journeys, state inventory, brand consistency findings |
| `STORE_METADATA.md`, `RELEASE_NOTES.md` | listing truth table, draft listing, learner-facing notes |
| `RC_ARTIFACTS.md` | artifacts, rebuild commands, store path commands, tag policy |
| `RELEASE_REDTEAM.md` | product / assessment / privacy / accessibility attacks |
| `KNOWN_LIMITATIONS.md` | P0/P1 none; P2/P3; release conditions; by-design limits |
| `RELEASE_CHECKLIST.md` | §82/§83 status tables and submission-day steps |
