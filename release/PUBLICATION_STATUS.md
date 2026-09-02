# Publication status (§70–§72)

Single source of truth for "how far is v1 from the stores". Updated at
every gate; the exact status lines at the bottom are the ones the final
report repeats. Success states are never conflated: ENGINEERING COMPLETE
→ DEVICE ACCEPTED → STORE READY → SUBMITTED → LIVE.

## Gates

| Gate | State | Evidence / what is missing |
|---|---|---|
| Engineering complete (main green, tests, content, audio provenance) | **YES** on the release branch (audio provenance CLOSED: runs 33648420215 and 33656665002); becomes main's state when PR #18 merges | `AUDIO_PROVENANCE_FINAL.md`, CI |
| Identity confirmed (Option B, immutable identifiers) | **WAITING FOR OWNER** | OWNER DECISION block in the program report; `scripts/apply-identity.ts` ready |
| Version reset 1.0.0 / build 1 (local source) | applied by the identity migration | `VERSIONING.md` |
| Public website (privacy, support, guide, licenses, accessibility, release) | built in CI; **deploys on the first push to main after merge** (Pages must be enabled once by the owner if the first deploy reports it) | `pages.yml`, `scripts/build-site.ts` |
| Public privacy-policy URL | BLOCKED until the deploy above returns HTTP 200 | `PRIVACY_FINAL.md` |
| Support contact | BLOCKED — owner-supplied email (never invented); GitHub Issues supplement it | `release/support-contact.json` |
| Apple Developer Program (individual) | BLOCKED — owner enrollment and fee | `APPLE_ACCOUNT_SETUP.md` |
| Google Play developer account | BLOCKED — owner registration, fee, identity verification | `GOOGLE_PLAY_ACCOUNT_SETUP.md` |
| EAS project under the owner's account | BLOCKED — `eas init` on the owner's machine; no token in the repo | `PUBLISHING_RUNBOOK.md` D1 |
| Signing keys | BLOCKED — EAS-managed or owner-held; never created here | `PUBLISHING_RUNBOOK.md` D3–D5 |
| RC builds (store profiles) | RC1 cut as an engineering candidate with its QA APK recorded (run 33660049388, artifact 9859191410, `RC_HISTORY.md`); store-profile builds BLOCKED by the identity gate (fails closed) and the EAS project | `RC_HISTORY.md` |
| Device acceptance | NOT STARTED — needs an RC on phones | `DEVICE_ACCEPTANCE.md` |
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
PUBLIC PRIVACY POLICY: BLOCKED (deploys with the first push to main after merge; URL https://vansyson1308.github.io/learning-french-with-tracy/privacy/)
IOS: NOT READY (identity unconfirmed; no Apple account; RC not built)
ANDROID: NOT READY (identity unconfirmed; no Play account; RC not built)
```

## Success state

**ENGINEERING COMPLETE** (pending the merge of the release branch);
DEVICE ACCEPTED, STORE READY, SUBMITTED and LIVE are not reached. Nothing
in this file claims otherwise.
