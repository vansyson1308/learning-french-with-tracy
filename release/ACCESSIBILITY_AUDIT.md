# Accessibility audit (Phase 10 §35-§40)

Method: static audit of every screen and exercise component (roles, labels,
states, font scaling, non-colour cues, motion), the RNTL integration suite
(which queries by accessibility role/label), and the browser E2E over the
web export. **No VoiceOver, TalkBack, Voice Control or Accessibility
Inspector session was possible in this environment** — every "SUPPORTED"
below is a code-level claim with its evidence; the assistive-technology
pass is an owner task on real devices (see `NATIVE_ACCEPTANCE.md`).

Apple's criterion for a label (App Store Connect help, rendered
2026-09-02): "users must be able to complete all of the common tasks of your
app using that feature". Labels are self-declared and must stay accurate,
so nothing below is claimed beyond what was exercised.

## Fixes made in Phase 10

| Surface | Before | After |
|---|---|---|
| `DuoButton` (every primary CTA: Continue, Check, Start, Skip…) | no role/state | `accessibilityRole="button"`, `accessibilityState.disabled` |
| `OptionCard` (every MCQ option in lessons, checkpoints, placement) | no role/label/state; outcome shown by **colour only** | role button; label = text + ", selected" / ", correct" / ", not correct"; `accessibilityState.selected`; a ✓ / ✕ glyph on correct/wrong (non-colour cue) |
| Word-bank tokens | no role | role button + label |
| Onboarding language and daily-goal chips | no role/state | role button, `selected` state, descriptive labels (units/lessons; goal intensity) |
| Course switcher cards | no role | role button, `selected`, "n of m lessons done" |
| Goals A1 domain chips | icon + colour | each chip is an accessible text element whose label is the full plain-language status line ("Listening — 1 of 3 goals shown; still to show: …") |
| Reading passages | `maxFontSizeMultiplier` 1.6 (below Larger Text's 200 %) | 2.0 |
| Privacy screen | — | section headings carry `accessibilityRole="header"` |

## Common-task matrix (code-level evidence)

| Task | Screen reader semantics | Large text | Non-colour cues | Notes |
|---|---|---|---|---|
| Onboarding (language, goal, start) | chips are buttons with selected state; CTA is a button | scales (no clamps) | selected chip has a border + label state | — |
| PATH (open lesson) | lesson nodes are `Pressable` with labels (Phase 3) | scales | current/locked shown by icon + label | — |
| Lesson: select / listening / reading MCQ | options are labelled buttons with outcome suffix | scales | ✓/✕ glyph + label suffix | fixed in Phase 10 |
| Lesson: word bank | tokens are buttons | scales | — | — |
| Lesson: type answer / dictation / conjugation cloze | `TextInput` with placeholder + submit button | scales | feedback panel text | autocorrect/smart punctuation handled by the normaliser (Phase 0/5) |
| Today session | same components as lessons; progress bar is decorative | scales | — | — |
| Practice hub cards | rows are buttons with labels | quest text clamped 1.1–1.3 (stat chrome), everything else scales | — | clamps documented below |
| Vocabulary browser | search input + rows with labels | scales | strength bar has numeric label | — |
| Goals | chips + detail lines are text elements | scales | icon per status + n/m count | — |
| Placement | MCQ + typed items; "I don't know" is a button | scales | — | — |
| Checkpoint / A1 capstone | same exercise components; speech pre-gate is text + buttons | scales | — | speech parts skippable (see §40) |
| Writing tasks | multiline `TextInput` inside the session's keyboard-avoiding layout; Check/Continue buttons | scales | rubric feedback is text | — |
| Recording (speak) | record control is a labelled button with state; blocked panel is text + Settings/skip buttons | scales | recording state has text + icon | — |
| Interaction scenario | partner turns are text/audio with a speaker icon; repeat/rephrase/record are labelled buttons | scales | — | scored mode hides partner text by design (construct) |
| Profile: export/import/privacy/licenses | rows are buttons with labels | week strip clamped 1.2–1.3 | — | — |

## Per-feature status (Apple Accessibility Nutrition Labels)

| Feature | Status | Evidence / gap |
|---|---|---|
| VoiceOver | **NOT TESTED** (code-level readiness: every interactive control now has a role and label; RNTL queries by role pass) | needs an on-device VoiceOver run of the common tasks |
| Voice Control | **NOT TESTED** | relies on the same labels; needs device run |
| Larger Text (200 %+) | **NOT YET SUPPORTED → to verify**: no `allowFontScaling={false}` anywhere; body/exercise text unclamped; reading passages 2.0; remaining clamps are stat chrome (1.1–1.3) which does not block any task | needs a device run at the largest accessibility size for clipping/overlap |
| Dark Interface | **SUPPORTED** | full theme with `userInterfaceStyle: automatic`; every screen uses themed colours (Phases 0–9); covered by integration tests (`themePreference`) |
| Differentiate Without Color Alone | **SUPPORTED (code-level)** | MCQ outcomes carry ✓/✕ glyphs and label suffixes; goals chips carry icons and counts; strength bars carry numbers |
| Sufficient Contrast | **NOT TESTED** | palette not measured against WCAG here; owner to run Accessibility Inspector / Android accessibility scanner |
| Reduced Motion | **SUPPORTED (library default)** | the only animations are Reanimated `withSpring` (session progress bar) and `withTiming` (path bounce); Reanimated resolves `reduceMotion` to `ReduceMotion.System` when unset (`animation/util.js: getReduceMotionFromConfig`), i.e. animations complete instantly when the OS setting is on |
| Captions | not applicable (no video); listening clips show transcripts after answering by construct | — |
| Audio Descriptions | not applicable (no video) | — |

## Android (TalkBack, scaling, targets)

- Content descriptions: same `accessibilityLabel`/`Role` props map to
  `contentDescription`/class semantics.
- Touch targets: `DuoButton` ≥ 47 dp tall; `CloseButton` 44×44; option cards
  ≥ 48 dp; chips ≥ 44 dp.
- Font scaling: same as iOS (system scale honoured).
- TalkBack run: **NOT TESTED** (device required).

## Audio accessibility (§40)

- No audio or microphone capability is required to progress: speech steps
  are skippable in lessons and TODAY; a spoken checkpoint on an incapable
  device is not started, and the estimate shows the device limit instead
  of a verdict (Gate 2).
- Transcripts: listening clips reveal their transcript after the answer;
  in scored mode the partner text of an interaction stays hidden by
  construct (the item measures listening), and that is stated to the
  learner.
- Accessibility labels never leak scored answers: option labels carry the
  outcome only after the answer is checked; the correct option is not
  marked before selection.

## Residual risks

- All assistive-technology statements above are code-level until a
  physical device run is recorded (matrix in `NATIVE_ACCEPTANCE.md`).
- Stat chrome clamps (1.1–1.3×) keep tiles readable but mean those numbers
  do not reach 200 %; they are never the only place a value is shown.
