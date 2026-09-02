# Release red team (Phase 10 §75-§78)

Adversarial pass over the release candidate as a **product**, an
**assessment**, a **privacy** surface and an **accessibility** surface, run
after the content red team. Each attack names the evidence (a test that
pins the behaviour, a probe run in this environment, or a document) and its
outcome. Severity uses the scale in `KNOWN_LIMITATIONS.md`.

## A. Product attacks

| Attack | What was tried | Outcome | Evidence |
|---|---|---|---|
| Ship the wrong app identity silently | change nothing and run the store path | **Refused** — `EAS_BUILD_PROFILE=production bun run release:identity` exits 1 with `STORE DISTRIBUTION IDENTITY = BLOCKED`; the EAS pre-install hook runs the same gate; internal/QA builds pass | `scripts/release-identity-gate.ts`, `release-identity.test.ts`, CI step "Release identity gate" |
| Regenerate content non-deterministically | compile twice, hash every artifact | identical hashes | this session; CI drift guard |
| Drift between source and embedded copies | edit a writing task without touching its course copy | validator error "rubric does not mirror task" | `scripts/lib/writing.ts`, `speech.ts` |
| Corrupt or hostile persisted state | crafted JSON: prototype-pollution keys, NaN XP, far-future dates, malformed assessment container, unsupported future version, truncated file | import refused, live state untouched; hydration of a corrupt store falls back to empty assessment state | `backup.test.ts`, `historical-personas.test.ts`, `backup-core.ts` (`BANNED_KEYS`, invariants) |
| Upgrade path breaks an old learner | personas from v0 flat/rich, v1, v2, v3, Phase 8/9 migrated to the final schema, then exported and re-imported | lossless; fixed point | `historical-personas.test.ts` |
| Streak double-credit at extreme offsets | UTC+14 and UTC−11 lanes | never double-credited; documented mapping | `streak.test.ts` in the Kiritimati / Pago Pago CI lanes |
| Leave debug scaffolding in the build | grep for TODO/FIXME/XXX/HACK and console logging in runtime speech/writing/interaction/session code | 0 markers; 0 console calls; `expo-dev-client` is a dependency but `eas.json` `production` has no `developmentClient` and the launcher is inert in Release builds (the iOS Release build ran its "Strip Local Network Keys for Release" phase) | probes this session; `eas.json` |
| Hidden network calls | grep `fetch(`, `XMLHttpRequest`, `new WebSocket` under `src/`; grep the web export for API hosts and `sk-` keys | 0 / 0 | probes this session; `tutor-seam.test.ts` client-key scan |
| Sneak a permission back | add SYSTEM_ALERT_WINDOW / storage permissions via a plugin | pinned by test; the Android release APK's permission dump is checked in CI and fails the build | `permissions.test.ts`, `android-release-build.yml` |
| Deep-link / URL handling surface | look for `scheme`, intent filters, associated domains | the Expo Router scheme only (no custom intent filters, no associated domains); no route reads external parameters into state | `app.json` |
| Dependency tampering | `bun install --frozen-lockfile` from the committed lockfile | reproduces ("no changes" across 1,147 installs / 1,051 packages); Bun runs dependency lifecycle scripts only for packages listed in `trustedDependencies`, and `package.json` declares none — the only "postinstall" strings in the lockfile are the package *name* `napi-postinstall` (a transitive dev dependency of ESLint's import resolver, `unrs-resolver`) | probe this session; `SECURITY_AUDIT.md` |

## B. Assessment attacks

| Attack | What was tried | Outcome | Evidence |
|---|---|---|---|
| Guess by option position | always pick option 1 / 2 / 3 / 4 across 12 administrations of every scored form | no position exceeds 0.5 share; overall mean 0.15-0.4; the luckiest position-guessing history stays incomplete | `option-order.test.ts`, `a1-claim-redteam.test.ts` |
| Reach A1 through the capstone alone | pass the capstone with no checkpoint history | `partial`, never `demonstrated`; the capstone cannot cover a whole domain by construction | `a1-estimate.test.ts`, attainment validator |
| Claim A1 while speech is unavailable | no recogniser on the device / web | speaking and interaction domains report `technical_unavailable`; overall stays short of demonstrated; the capstone route shows a pre-gate | `a1-estimate.test.ts`, E2E "capstone route opens with the speech pre-gate on web" |
| Keyword-stuff a writing task | write every authored variant of every slot | refused with named feedback for every guided task | `rubric-speech-attacks.test.ts` |
| Copy the prompt / write only the cue values / wrap French in English / paste garbage | per task | never meets | same suite |
| Wrong person / wrong fact / wrong addressee | third-person rewrite; cue value swapped; note to the wrong name | never meets | same suite |
| Fool the speech grader | silence, filler, wrong quantity, negated *il y a*, polite tails, dropped articles | silence/garbage/wrong quantity/negation never pass; two documented leniencies (n-best alternatives, dropped articles on concept items) are measured and bounded | same suite; `ASSESSMENT_DOSSIER.md` |
| Fool the interaction machine | say "repeat?", "I don't know", nothing; negate; deliver a stale final while the partner speaks; use the repair path to convert a miss into a scored pass | never judged / never matched / ignored / first judgment only | `interaction-attacks.test.ts`, `interaction-machine.test.ts` |
| Reuse a teaching stimulus as a scored item | reference a non-reserved speech item or writing task from a checkpoint | validator error; reserved items are excluded from every practice artifact at compile time | `speech.ts`, `writing.ts`, `interaction.ts` validators |
| Fabricate attainment through a backup file | hand-edit a backup so checkpoint attempts show passes | accepted **by design** if structurally valid: the file is the learner's own device data, nothing is issued or transmitted, and the estimate is explicitly "this course's own checks"; no certificate, badge or share sheet exists that a third party could rely on | `ASSESSMENT_DOSSIER.md` limitations |
| Over-claim in wording | grep learner-facing sources for *certified / officially recognised / accredited* | only the disclaimers ("not an official…", "an official level comes only from an accredited examination") | probe this session; `privacy-policy.test.ts` CERTIFICATION_CLAIMS list |

## C. Privacy attacks

| Attack | What was tried | Outcome | Evidence |
|---|---|---|---|
| Recover a transcript after the fact | inspect persisted state and backups for transcript fields | transcripts are never persisted; the attempt store keeps only outcomes | `speech-privacy.test.ts`, `PRIVACY_INVENTORY.md` |
| Recover attempt audio | inspect the cache after a step / session | per-step delete and a session-boundary sweep of `speech-attempts/`; scored checks never keep a recording | `speech-cache.test.ts` |
| Make a promise the OS breaks | claim "100 % offline" | forbidden by test in every learner-facing string; the in-app disclosure and the policy state the OS speech-service network boundary | `privacy-policy.test.ts` |
| Exfiltrate through a backup | export then read the file | contains progress only (no transcripts, no audio, no identifiers); export happens only on the learner's tap and goes through the OS share sheet | `backup.ts`, `PRIVACY_INVENTORY.md` |
| Invent a privacy-policy URL or manifest entry | — | none invented: owner-supplied items are named as such; manifest declarations are limited to the four APIs actually used with their reasons | `APP_PRIVACY.md`, `PRIVACY_MANIFEST.md` |
| Third-party SDK leakage | inventory of installed packages for analytics/ads/crash reporting | none present | `SECURITY_AUDIT.md` |

## D. Accessibility attacks

| Attack | What was tried | Outcome | Evidence |
|---|---|---|---|
| Icon-only controls without names | every option card, word-bank chip, onboarding chip, course card, speaker button | role + label + state (`selected`, `disabled`, correct/incorrect suffixes) | `ACCESSIBILITY_AUDIT.md`, component sources |
| Colour as the only cue | correct/incorrect option states | glyph + label suffix in addition to colour | `option-card.tsx` |
| Larger text | reading passages and cards at 200 % | `maxFontSizeMultiplier` raised to 2 on passages; layouts scroll | `reading-passage.tsx` |
| Screen reader on hardware | VoiceOver / TalkBack common-task pass | **NOT TESTED** here — device pass required | `NATIVE_ACCEPTANCE.md` |

## E. Findings and disposition

| Severity | Finding | Disposition |
|---|---|---|
| P0 | none | — |
| P1 | none | — |
| P2 | CI lane `checks (UTC)` on the push event of `1320fe9` timed out in `lexicon-db.test.ts` "two fresh builds are logically identical" (37.6 s against a 30 s default) while the identical commit passed on the pull-request event | not a product defect — the test builds the SQLite lexicon twice on a shared runner; its timeout is raised to cover slow runners (no assertion weakened) |
| — | Backup-file attainment fabrication | accepted by design; recorded in the dossier |
| — | Device-level AT and speech-quality checks | release conditions, not defects |

No finding required a product change beyond the test-timeout robustness
fix; the P0/P1 loop closes with zero open items (`KNOWN_LIMITATIONS.md`).
