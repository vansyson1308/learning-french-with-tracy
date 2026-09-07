# Publication status (§70–§72)

Single source of truth for "how far is v1 from the stores". Updated at
every gate; the exact status lines at the bottom are the ones the final
report repeats. Success states are never conflated: ENGINEERING COMPLETE
→ DEVICE ACCEPTED → STORE READY → SUBMITTED → LIVE.

## Gates

| Gate | State | Evidence / what is missing |
|---|---|---|
| Engineering complete (main green, tests, content, audio provenance) | **YES** on `main`: PR #18 merged as `eaeb604` (merge commit; CI on main run 33663402877 = success); audio provenance CLOSED (runs 33648420215 and 33656665002) | `AUDIO_PROVENANCE_FINAL.md`, CI |
| Identity confirmed (Option B, immutable identifiers) | **YES** — owner approved on 2026-09-08; applied with `scripts/apply-identity.ts migrate` (name Learning French with Tracy, slug `learning-french-with-tracy`, scheme `learningfrenchtracy`, iOS/Android id `com.vansyson1308.learningfrenchwithtracy`, version 1.0.0 build 1); store distribution stays BLOCKED until the store accounts exist | `release/identity.json`, `ANDROID_RC2_BASELINE.md` |
| Version reset 1.0.0 / build 1 (local source) | **DONE** by the identity migration (`expo.version` 1.0.0, iOS `buildNumber` 1, Android `versionCode` 1, `appVersionSource: local`) | `VERSIONING.md` |
| Public website (privacy, support, guide, licenses, accessibility, release) | **DEPLOYED** — Pages enabled by the owner on 2026-09-08; the merge of PR #20 (`7f761cc`) ran `pages.yml` (run 34164127172, success) and GitHub deployment 6316645993 to environment `github-pages` reports **success** with environment URL https://vansyson1308.github.io/learning-french-with-tracy/ (7 pages, support email present). The automation sandbox cannot reach github.io, so the HTTPS/200/content check runs on a GitHub runner: the `verify` job of `pages.yml` after every deploy and `site-verify.yml` on demand (`scripts/verify-site.sh`) | `pages.yml`, `site-verify.yml`, `scripts/build-site.ts` |
| Public privacy-policy URL | DEPLOYED (deployment 6316645993 success) — called LIVE only once the runner-side verification (`verify` job / `site-verify.yml`) has observed HTTP 200 over HTTPS with the product name and the support email on the page; that run id is recorded here when it exists | `PRIVACY_FINAL.md` |
| Support contact | **SET** — `duymank250997@gmail.com` (owner-supplied 2026-09-08, provisional; rendered on the website support and privacy pages and in the store metadata drafts; GitHub Issues supplement it) | `release/support-contact.json` |
| Apple Developer Program (individual) | BLOCKED — owner enrollment and fee | `APPLE_ACCOUNT_SETUP.md` |
| Google Play developer account | BLOCKED — owner registration, fee, identity verification | `GOOGLE_PLAY_ACCOUNT_SETUP.md` |
| EAS project under the owner's account | **WAITING FOR OWNER** — `eas whoami` is "Not logged in" in the automation environment; two routes are written up in `ANDROID_RC2.md` (owner runs `eas login` + `eas init --account <username>` on their machine, or stores an `EXPO_TOKEN` repository secret for the dispatch-only `eas-build.yml`); no token in the repo | `PUBLISHING_RUNBOOK.md` D1 |
| Signing keys | BLOCKED — EAS-managed or owner-held; never created here | `PUBLISHING_RUNBOOK.md` D3–D5 |
| RC builds | RC1 (inherited identity, engineering candidate) recorded; **RC2** (permanent identity, EAS `preview` internal APK) is configured and verified up to prebuild but **not built — waiting for the owner's EAS project (gate G1, `ANDROID_RC2.md`)**; store-profile builds stay BLOCKED by the identity gate until the store accounts exist | `RC_HISTORY.md`, `ANDROID_RC2.md` |
| Device acceptance | NOT STARTED — needs the RC2 APK on a phone; owner packets ready | `DEVICE_ACCEPTANCE.md`, `ANDROID_DEVICE_ACCEPTANCE_PACKETS.md` |
| Accessibility device pass | NOT STARTED | `ACCESSIBILITY_FINAL.md` |
| Store listings, screenshots from the final RC | drafts ready; capture blocked on the RC | `STORE_METADATA_FINAL.md`, `SCREENSHOT_MANIFEST.md` |
| TestFlight / Play internal | BLOCKED on accounts + RC | `PUBLISHING_RUNBOOK.md` G |
| Play closed test (12 testers × 14 days) | NOT STARTED | `ANDROID_CLOSED_TEST_PLAN.md` |
| Submission | owner action after the final RC exit gate | `PUBLISHING_RUNBOOK.md` H |
| Public production release | OWNER ONLY | Part XV |

## Status lines

```
APP PRICE: FREE
ADS: NO
IAP: NO
SUBSCRIPTIONS: NO
AI TUTOR: DISABLED
OFFICIAL CEFR CERTIFICATION: NO
COURSE: CEFR-aligned A1 assessment available
PUBLIC PRIVACY POLICY: BLOCKED (deployed to GitHub Pages on 2026-09-07, deployment 6316645993 success; HTTP 200 over HTTPS not yet observed by the runner-side verify job — https://vansyson1308.github.io/learning-french-with-tracy/privacy/)
IOS: NOT READY (identity applied; no Apple account; no iOS build — outside the Android RC2 program)
ANDROID: NOT READY (identity applied and verified to prebuild; RC2 waits for the owner's EAS project — gate G1 in ANDROID_RC2.md; no Play account, not needed for RC2)
```

## Success state

**ENGINEERING COMPLETE** (on `main`; the Android RC2 program adds the permanent identity, the preview profile and the EAS build path);
DEVICE ACCEPTED, STORE READY, SUBMITTED and LIVE are not reached. Nothing
in this file claims otherwise.
