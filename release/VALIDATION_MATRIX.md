# Final validation matrix (Part XVII)

What was validated, how, by whom, and where the evidence lives — one row
per claim the release depends on. "Automated" rows run on every change in
CI; "Owner" rows are device or account actions the repository cannot
perform; "Both" rows have an automated part and a device part.

## A. Engineering (automated, every commit)

| Claim | Check | Result on the release branch | Evidence |
|---|---|---|---|
| Types and lint clean | `tsc --noEmit`, ESLint | pass | CI `checks` jobs |
| Engine, store, content and pipeline behave as specified | `bun test src scripts` | 1,175 tests pass across 76 files (includes the 50-day soak) | CI; `SOAK_REPORT.md` |
| Screens render and behave (routing, Today, goals, reception, speech gates, vocabulary, concept cards, interaction) | `bun run test:integration` (jest + RNTL) | 69 tests pass across 10 suites | CI |
| Streak/day logic at extreme offsets | the same suite in five time-zone lanes (UTC, Los Angeles, Tokyo, Kiritimati, Pago Pago) | pass | CI matrix |
| Authored content is valid and every compiled artifact matches its source | `validate-content`, compile drift guard | pass | CI |
| Every shipped audio file is pinned and referenced; no orphan, no missing clip | `check-audio` against the committed baseline; reception orphan/missing checks | pass on the current head; re-blessed by the audio workflows on their commits | CI; `AUDIO_PROVENANCE_FINAL.md` |
| Release identity cannot drift silently; store builds fail closed until confirmed | identity gate in CI and as the EAS pre-install hook | BLOCKED (by design) until the owner's YES | `release-identity.test.ts`, `identity.json` |
| The web export builds within size expectations | `expo export --platform web` + size report | pass (≈21 MB export, 4.0 MB entry bundle) | CI `export-size` |
| The documentation site builds from repository sources with no third-party assets | `bun scripts/build-site.ts` | pass (7 pages) | CI |
| Browser smoke on the web tier (onboarding, goals, practice, writing, conversation escape, capstone pre-gate, privacy, licenses) | `bun run e2e:web` | 12/12 | CI |
| The user guide is true section by section | `bun run e2e:guide` | 30 pass · 0 fail · 5 device-only · 3 test-backed | CI; `docs/USER_GUIDE_VALIDATION.md` |
| No network request of the app's own | recorded during the browser walks; static grep for fetch/XHR/WebSocket | 0 external requests; 0 call sites | guide walk; `SECURITY_AUDIT.md` |
| Only the declared Android permissions ship; targetSdk 36 | APK badging/permissions dump from the built artifact | pass (Phase 10 run; re-run per RC) | `android-release-build.yml`, `RC_ARTIFACTS.md` |
| Audio provenance: every bundled clip synthesized by the pinned, license-gated pipeline; sound effects generated; no untraceable file | pack-audio / reception-audio workflows (double-download hash pins, model cards, fail-closed license gate, technical QA strict, ASR audit) | _pending run 33648420215 (pack audio) and the reception generate run_ | `AUDIO_PROVENANCE_FINAL.md`, `content/reports/pack-audio-*.json` |
| Backups round-trip and refuse corruption; every historical persona migrates losslessly | `backup.test.ts`, `historical-personas.test.ts` | pass | CI |
| Assessment integrity (option order, capstone no-shortcut, keyword stuffing, speech/interaction attacks) | dedicated suites | pass | `ASSESSMENT_DOSSIER.md`, `CONTENT_REDTEAM.md`, `RELEASE_REDTEAM.md` |

## B. Product and content (automated + review)

| Claim | Check | Result | Evidence |
|---|---|---|---|
| French content is native-quality at A1 register | two-pass content red team; six deferred partner lines now re-recorded | applied (partner lines land with the reception run) | `CONTENT_REDTEAM.md`, `KNOWN_LIMITATIONS.md` L10 |
| The A1 estimate is honest and never claims certification | wording tests (CERTIFICATION_CLAIMS), Goals explainer walk | pass | `privacy-policy.test.ts`, guide walk §23–24 |
| Store copy makes only allowed claims | claims policy applied to every field | drafts ready | `STORE_METADATA_FINAL.md` |
| Icon and splash are original, not placeholder or upstream art | rendered from `assets/brand/icon.svg` by script; alpha/extent checked | done | `scripts/render-brand-assets.mjs` |

## C. Device and account (owner)

| Claim | How | Status | Where to record |
|---|---|---|---|
| Installs, permissions, share sheet, file picker, real speech, offline mode, sideload on phones | iPhone + Android matrices on the RC | NOT STARTED (no RC yet: identity + accounts pending) | `DEVICE_ACCEPTANCE.md` |
| VoiceOver / TalkBack / large text / contrast / reduce motion | rows A1–A15 | NOT STARTED | `ACCESSIBILITY_FINAL.md` |
| Memory plateau, temp-audio cleanup on device | soak blocks 1–8 | NOT STARTED | `SOAK_REPORT.md` |
| Store accounts, EAS project, signing keys | owner setup | NOT STARTED | `PUBLISHING_RUNBOOK.md` C–D |
| Public privacy URL returns 200; support contact public | Pages deploy after merge; owner email | BLOCKED until merge / owner | `PUBLICATION_STATUS.md` |
| Closed test 12 × 14 days; production access | Play Console | NOT STARTED | `ANDROID_CLOSED_TEST_PLAN.md` |

## D. Coverage summary

- Automated: every engineering claim in A is green on the current head
  except the audio-provenance row, which closes when the two dispatch-only
  audio runs commit their outputs (tracked in `PUBLICATION_STATUS.md`).
- Owner: nothing in C has started; each row has exact steps and a place to
  record the result. Until C is done the product state is ENGINEERING
  COMPLETE, not DEVICE ACCEPTED.
