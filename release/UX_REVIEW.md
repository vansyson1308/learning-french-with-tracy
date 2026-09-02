# Core-journey and state review (Phase 10 §58-§63)

Method: every journey below was exercised by an automated path this
phase can run — the browser E2E over the web export (`e2e/smoke-web.mjs`),
the jest-expo integration suites (real Expo Router tree, mocked speech
provider), and the pure session/interaction/placement engines under `bun
test`. Device-only behaviour (microphone, OS recogniser, Bluetooth,
backgrounding while recording) is listed as NOT TESTED in
`NATIVE_ACCEPTANCE.md`.

## Personas walked

| Persona | Path exercised | Evidence |
|---|---|---|
| Brand-new learner | onboarding → French → PATH Section 1 → first lesson → feedback → completion | E2E steps 1–2; `today-tab.test.tsx`, session reducer suites |
| Returning learner | hydration gate → PATH resumes at current lesson; streak logic across local midnight | migration/streak suites in 5 timezones (CI) |
| Placed learner | placement intro → stages (speech stage skipped on incapable device) → recommendation → accept floor → PATH from floor; reset floor | `goals.test.tsx` (reset), placement engine suite, `checkpoint-speech-gate.test.tsx` |
| Daily learner | TODAY tab → session (warm-up / new / mixed / finale) → summary → XP | `today-tab.test.tsx`, composer suite |
| Caught-up learner | TODAY shows "You're caught up for now."; Practice shows "No words due right now. Keep learning!" | strings in `today.tsx`, `practice.tsx`; composer empty-due tests |
| Learner with a review backlog | honest backlog count; capped session; lockup offer | composer/backlog suites (Phase 3) |
| Learner who cannot use audio | listening steps skippable; placement reception stage records `not_estimated`; nothing counted as failure | Phase 7 suites; skip gate (`skipAllowed`) |
| Learner who cannot speak (web / no recogniser / permission denied) | speak steps show blocked panel or "Skip this step"; spoken checkpoint pre-gate refuses to start; goals show "technical_unavailable" for speech domains | E2E steps 6–7; `checkpoint-speech-gate.test.tsx`; estimate suite |
| Learner taking the A1 check | goals → capstone link → pre-gate → one form → results → estimate detail | E2E 3 & 7; forms audit; red-team personas |
| Learner who needs practice | needs_practice verdicts → "Worth practicing" group on goals; domain line names the goals | `goals.test.tsx` §93 case; Gate 2 UI |

## State inventory (every surface must have a good state)

| Surface | empty | loading | blocked | permission denied | technical error | nothing due / caught up | incomplete assessment |
|---|---|---|---|---|---|---|---|
| Onboarding | n/a | hydration gate holds splash | — | — | — | — | — |
| PATH | n/a (content bundled) | splash | locked nodes explained | — | — | — | — |
| TODAY | "caught up" card | — | — | — | — | ✓ | — |
| Practice | "No words due right now." | — | — | — | — | ✓ | — |
| Vocabulary | "No words match your search/filter." | lexicon opens lazily | — | — | web fallback JSON | — | — |
| Goals | fresh learner: all domains 0/n with "take the checkpoint to show" lines | — | — | — | — | — | per-domain detail; overall "Not complete yet" never "failed" |
| Lesson / session | — | — | speak: blocked panel + Skip | speak: Settings link (`Linking.openSettings`) + Skip | speech technical: "Try again" without judgement | — | — |
| Checkpoint | — | — | pre-gate refuses spoken check with reason | pre-gate explains microphone requirement, may request, else blocked | — | — | results screen splits demonstrated / worth practicing / thin evidence |
| Placement | — | — | speech stage auto-skipped (recorded `not_estimated`) | same | — | — | recommendation still produced from the runnable stages |
| Writing | — | — | — | — | — | — | tri-state feedback (met / partial / not met) |
| Interaction | — | — | blocked panel / skip | — | technical retry (unjudged) | — | goal_not_met terminal is honest, never a failure verdict |
| Backup import | — | busy flag disables rows | — | — | reason shown (invalid file, future version…) and state unchanged | — | — |

No raw error text reaches the learner from any of these paths; route-level
errors fall through to Expo Router's error boundary.

## Writing UX (§60)

`guided-writing`: multiline `TextInput`, `autoCorrect={false}`,
`autoCapitalize="sentences"`, inside the session's `KeyboardAvoidingView`;
typographic apostrophes and NBSP are normalised by the grader (Phase 0);
Check/Continue is the fixed footer button; feedback is plain text with the
rubric's tri-state wording. `simple-form`/`type-answer`: `autoCapitalize`
off, `autoCorrect` off. Large text: no clamps on these inputs.

## Interaction UX (§61)

Speaker identity is explicit (partner bubble vs learner bubble with
distinct colours and a speaker icon); partner playback auto-plays new
turns; repeat/rephrase are counted support (never judged); technical
failures offer retry without judgement; the conversation history stays
scrollable; terminal states are stated plainly ("goal not met" is a
description, not a fail stamp); back/cancel leaves an unscored attempt
unrecorded. In scored mode partner text is hidden by construct and that
is stated.

## A1 estimate UX (§62)

The goals card now answers the four learner questions directly: what has
been demonstrated (chips with n/m and green ticks), what needs practice
(barbell icon + "worth practicing first: …"), what is missing (per-domain
"still to show: …" lines naming the objectives), and why hardware may
prevent completion ("needs a device that can recognize French speech.
This is a device limit, not a result."). "What this estimate is — and is
not" expands to the four honesty bullets; the wording is always
"CEFR-aligned A1 estimate".

## Brand / metadata consistency (§63) — findings only, no renames

- `app.json` name "Lingo Lessons", slug `lingo`; README titled "(Open
  Source) Lingo Lessons" and linking the upstream App Store id; icon/splash
  are upstream's; the repository is named "learning-french-with-tracy".
  The product identity is therefore **inconsistent between repository name
  and shipped identity** — resolved only by the owner's Gate 1 decision.
- Store metadata files describe upstream's listing and mention "hearts",
  a feature this app no longer has (`STORE_METADATA.md`).

## Known web-tier limitation

The static web export logs React error #418 (hydration mismatch of the
pre-rendered HTML) on first load, on the Phase 9 build as well as this
one; React recovers by client-rendering and every E2E journey passes. Web
is a secondary tier (no speech recognition, no SQLite); this is recorded,
not fixed, in Phase 10.
