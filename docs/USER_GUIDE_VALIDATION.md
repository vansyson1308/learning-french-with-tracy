# User guide validation (V1 publication §16)

Writing the manual is part of product testing: every numbered section of `docs/USER_GUIDE.md` is walked against the app, and the guide is corrected wherever the app disagrees. The walk is automated for everything the web tier can show (`e2e/guide-walk.mjs`, run in CI on every change) and lists exactly what only a phone can prove.

## Latest automated walk

- Build: exported web tier of the release branch (`bunx expo export --platform web`), walked with the bundled Chromium at a 420×860 viewport.
- Result: **30 sections pass, 0 fail, 5 device-only, 3 test-backed**; 15 known web-tier notice(s) (#418/#419 hydration fallback, media play() interruption).
- External network requests during the whole walk: none.
- Re-run: `bunx expo export --platform web --output-dir dist && node e2e/guide-walk.mjs dist` (exit 1 on any FAIL).

Status key: **PASS** verified on the web build · **DEVICE** provable only on a phone (owner step in `release/DEVICE_ACCEPTANCE.md`) · **TESTS** engine behaviour pinned by the named unit suites.

| § | Guide section | Status | Evidence |
|---|---|---|---|
| 1 | What the app is — French plus the seven inherited courses are offered | PASS | 8 course cards |
| 2 | Installation — store / TestFlight / closed test / sideload | DEVICE | install paths exist only on a phone; storage and permission-at-install claims verified in DEVICE_ACCEPTANCE.md |
| 3 | First launch — Daily XP goal chips and the start button | PASS | chips=11; button reads "Learn French"; lands on the Learn tab |
| 4 | Choosing French — French is a first-class course | PASS | Learn tab shows the French-only placement entry |
| 5 | Starting-point check — intro, I don't know on every item, result choices | PASS | 7 items answered with I don't know; result screen offered Start from the beginning |
| 6 | Learn — locked nodes, replayable nodes, guidebooks | PASS | 113 locked nodes (disabled), 27 guidebook buttons; guidebook route opens (the Locked/Completed hints are screen-reader hints: DEVICE) |
| 7 | Sections and units — the six section titles and every unit title | PASS | 6 sections, 27 units as authored |
| 8 | Lesson flow — Check, I don't know reveals the answer, Continue | PASS | option → Check → feedback → Continue → next exercise; "I don't know" buttons on a lesson step: 0 (placement and audio/microphone steps only) |
| 9 | Vocabulary browser — filters, sort and search | PASS | filters + Course order + search field |
| 10 | Rich dictionary — an entry shows pronunciation and an example | PASS | entry for "l'homme" shows Example |
| 11 | Memory — FSRS scheduling and strength | TESTS | fsrs-adapter.test.ts, evidence-gate.test.ts, memory-strength.test.ts |
| 12 | Today — session length presets, start, Can't speak now | PASS | 3 presets; Start today's session; Can't speak now toggle hidden — shown only when the device can record (DEVICE) |
| 13 | Review — Practice cards | PASS | 7 practice entries |
| 13 | Review — Undo this review | TESTS | review-log undo: evidence-routing.test.ts (undoLastFrenchReview); no card is due on a fresh web profile |
| 14 | Listening practice — Play audio control in a Section 3 lesson | PASS | fr-en:uf-l0: Play audio + question; Slow control present |
| 15 | Speaking — a Section 4 lesson shows the honest no-recognizer escape on web | PASS | speaking step at 0: Skip this step |
| 16 | Microphone permission — system prompts, Allow microphone / Open Settings | DEVICE | OS permission dialogs; iOS Settings paths and Android app permissions |
| 17 | Device and network speech behaviour — on-device model check and the notice | DEVICE | on-device model availability; the notice text is verified on the Privacy screen (§29) |
| 18 | Writing practice — Your French answer, Check, named feedback | PASS | feedback: "Use a complete sentence with a verb (for example: “ai”)." |
| 19 | Conversation practice — partner exchange offers Skip this step on web | PASS | Skip this step |
| 20 | Reading — a Section 3 reading exercise renders its passage and question | PASS | fr-en:ug-l3: question + 2 tappable words (Show meaning of …); tap opens the gloss |
| 21 | Checkpoints — section-1 checkpoint starts and renders answer options | PASS | 6 buttons on the first item |
| 22 | A1 capstone — speech pre-gate on a platform without recognition | PASS | pre-gate |
| 23 | CEFR-aligned A1 estimate — five skills with authored denominators | PASS | chip "Listening 0/3" |
| 24 | Why it is not official certification — the explainer in the app's own words | PASS | explainer toggle opens; disclaimer present |
| 25 | Goals screen — starting-point actions | PASS | Retake/Find present; Starting from the beginning. (Reset appears only when the starting point is above the beginning); confirmation dialog: DEVICE |
| 26 | XP, streak and activity — Profile statistics | PASS | 6 stats + Switch |
| 27 | Backup export — Export progress row | PASS | row + hint |
| 28 | Backup import — Import progress row | PASS | row + hint (file picker and refusal paths: backup.test.ts + DEVICE) |
| 29 | Data and privacy — policy reachable, states the OS speech boundary | PASS | policy text verified |
| 30 | Accessibility — Appearance Device / Light / Dark | PASS | three appearance options, switching works |
| 31 | Offline usage — the app makes no network request of its own | PASS | 0 requests outside the app's own origin during the whole walk |
| 32 | What may still require network — OS speech service, store updates, website links | DEVICE | device speech service behaviour; website links open the browser |
| 33 | Troubleshooting — every control the section names exists | PASS | Skip this step, Import progress, Play audio verified above (Can't speak now / Reset starting point: DEVICE rows) |
| 34 | Reset and placement behaviour — confirmation dialog and what a reset keeps | DEVICE | native Alert (Keep it / Reset); reset semantics covered by placement.test.ts |
| 35 | Licenses and attributions — sources listed in the app | PASS | Lexique 4, FSRS, Piper voices, Lingo Lessons base |
| 36 | Support and contact — website pages and issue templates | TESTS | scripts/build-site.ts builds /support/ in CI; .github/ISSUE_TEMPLATE/*.yml |

## Corrections the walk forced into the guide

The first walk failed on these claims; each was a real mismatch between the manual and the app, fixed in the guide (never by weakening the check):

1. **§3** — the onboarding button reads **Learn French** (it names the selected course), not "Start learning".
2. **§7** — section and unit names now quote the app's real titles (*Section 1: Beginner* … *Section 6: Talk with someone*, with every unit), not paraphrases.
3. **§8** — **I don't know** is not a lesson control: it exists in the starting-point check and on audio/microphone steps (as **Skip this step**). Ordinary lesson exercises are always answered.
4. **§6** — *Locked…* / *Completed…* are screen-reader hints, not visible text; the guide says so.
5. **§12** — the **Can't speak now** switch appears only on a device that can record.
6. **§25** — **Reset starting point** appears only when the starting point is above the beginning; otherwise the screen reads *Starting from the beginning.*
7. **§35** — the Licenses screen did not credit the synthesized-audio voices at all. That was an app gap, not a wording one: the screen now renders every registry source, including each Piper voice with its license (CC BY 4.0 attribution is delivered inside the product).

## What the phone must still prove (DEVICE rows)

Sections 2, 16, 17, 32 and 34, plus the parts of 12, 13, 25, 27, 28 and 30 marked DEVICE above: installation paths, microphone and speech-recognition permission dialogs and the Settings routes, the on-device French model notice, the Can't speak now switch, the Undo control inside a real review, the native confirmation dialog on Reset, the share sheet on export and the file picker on import, and screen-reader/large-text behaviour. Each has an exact step in `release/DEVICE_ACCEPTANCE.md`; a DEVICE row becomes verified only with a device, OS version and build number recorded there.

## Known web-tier notices (not defects of the app)

- React #418/#419 hydration fallbacks: the static export's server HTML differs from the client render; React recovers by client-rendering (documented since Phase 10).
- `AbortError: The play() request was interrupted`: leaving a screen while a clip is starting makes the browser reject the pending media play; the web audio player does not surface the promise. Native players have no such path.
- The web tier has no speech recognizer: every speaking surface shows its honest escape (**Skip this step**, pre-gate) — which is exactly what the walk verifies.

