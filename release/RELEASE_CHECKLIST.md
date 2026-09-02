# Release checklist (Phase 10 §64, §82-§83)

Status legend: ✅ done and evidenced in this repository · ⏳ awaiting a CI
artifact · 🔒 requires an external prerequisite the owner holds ·
❌ not done.

## Engineering done (§82)

| Criterion | Status | Evidence |
|---|---|---|
| SDK-56 Hermes memory risk resolved by a supported release | ✅ | `SDK57_UPGRADE.md`; expo-doctor Hermes check passes |
| All dependencies release-compatible | ✅ | SDK 57 pairing from `bundledNativeModules.json`; expo-doctor 19/21 (2 network-only) |
| A1 learner attainment gate defensible | ✅ | `content/fr/assessment/attainment.json`, validator, estimate suite, red-team personas, `ASSESSMENT_DOSSIER.md` |
| MCQ position leakage closed | ✅ | `option-order.ts`, distribution tests over real banks |
| Assessment forms valid | ✅ | `forms-audit.test.ts`, validator floors |
| Full French red team passes | ✅ | two independent passes (47 + 63 findings); every critical/major applied, minors applied or deferred with reasons in `CONTENT_REDTEAM.md`; rubric/speech/interaction attack suites pinned |
| All 8 courses regress green | ✅ | Phase 0–9 suites on SDK 57 |
| Privacy wording accurate | ✅ | `PRIVACY_POLICY.md`, wording tests |
| Privacy/security artifacts complete | ✅ | `PRIVACY_INVENTORY.md`, `PRIVACY_MANIFEST.md`, `APP_PRIVACY.md`, `DATA_SAFETY.md`, `SECURITY_AUDIT.md` |
| Accessibility audit complete | ✅ (code level) | `ACCESSIBILITY_AUDIT.md`; device AT pass 🔒 |
| Performance / memory acceptable | ✅ (measurable part) | `PERFORMANCE.md`; device measurements 🔒 |
| Historical migrations / backups work | ✅ | `historical-personas.test.ts` |
| All automated tests green | ✅ | CI (5 timezone lanes, jest, content, audio, identity, E2E) |
| No P0/P1 open | ✅ | `KNOWN_LIMITATIONS.md`: open P0 none, open P1 none; P2/P3 items and release conditions listed with owners |

## Release ready (§83)

| Prerequisite | Status | Who / what |
|---|---|---|
| Release identity ownership confirmed | 🔒 | owner records it in `release/identity.json` (Option A or B in `RELEASE_IDENTITY.md`) |
| Signing credentials available | 🔒 | Apple distribution certificate + profile; Android upload key (EAS or local) |
| Physical-device acceptance | 🔒 | matrix in `NATIVE_ACCEPTANCE.md` |
| Store declarations with real URLs / contacts | 🔒 | hosted privacy policy URL, support contact (`APP_PRIVACY.md`, `DATA_SAFETY.md`, `STORE_METADATA.md`) |
| RC installs and runs on target platforms | ✅ built / 🔒 device run | CI Android release APK and iOS simulator bundle compiled and inspected (`RC_ARTIFACTS.md`, `NATIVE_ACCEPTANCE.md`); installing and running them on hardware is the owner's device pass |

## Submission-day steps (once the prerequisites above exist)

1. Confirm identity → `release/identity.json` (`confirmed`, evidence, `storeDistribution: allowed`); CI's identity gate turns green for store profiles.
2. `bunx expo-doctor` clean (network checks included).
3. `eas build --profile production --platform all` (the pre-install hook re-runs the identity gate).
4. iOS: TestFlight **internal** only; run the common-task matrix with VoiceOver, Larger Text, Dark, Reduce Motion; record `NATIVE_ACCEPTANCE.md`.
5. Android: Play **internal testing**; verify `targetSdkVersion 36` on the uploaded bundle; run TalkBack + font scaling; record.
6. App Privacy / Data safety forms from `APP_PRIVACY.md` / `DATA_SAFETY.md`, reconciled with the live definitions (VERIFY items).
7. Listing text from `STORE_METADATA.md`; new screenshots of the release build; no certification/pronunciation/tutor claims.
8. Tag the release candidate only after step 1 (see `RC_ARTIFACTS.md`).
