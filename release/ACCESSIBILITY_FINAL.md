# Accessibility — final v1 record (Part V)

Builds on the Phase 10 audit (`ACCESSIBILITY_AUDIT.md`: roles, labels,
states, non-colour cues, text scaling, dark mode). This record adds the one
code change of the publication program, the exact device pass the owner
runs before the store listings claim anything, and the wording used in
the Apple Accessibility Nutrition Labels and the public accessibility
statement.

## Change in this program

| Item | Before | Now |
|---|---|---|
| Reduce Motion | relied on the animation library's default | explicit `ReducedMotionConfig mode={ReduceMotion.System}` at the app root (`src/app/_layout.tsx`): every transition — the session progress spring, entering fades on feedback/teach cards/summary, the path's bobbing start bubble — completes instantly when the OS setting is on; on web it follows `prefers-reduced-motion` |
| In-app attributions | audio credits only in the repository | Licenses screen lists every voice (screen-reader readable text rows) |

Everything else the audit fixed in Phase 10 is unchanged and pinned by the
component sources and the option-order / RNTL tests.

## Status per feature (what may be claimed)

| Feature | Code-level status | Device pass | Store wording allowed today |
|---|---|---|---|
| VoiceOver / TalkBack | every interactive control has role + label + state; outcomes carry text suffixes | **required** (steps below) | claim only after the pass |
| Voice Control | same labels | required | after the pass |
| Larger Text / font scaling | no `allowFontScaling={false}`; passages to 200 %; stat chrome clamped 1.1–1.3 (never blocks a task) | required at the largest accessibility size | after the pass |
| Dark Interface | full theme, Device / Light / Dark | quick check | may be claimed |
| Differentiate Without Color Alone | ✓/✕ glyphs + label suffixes; goals chips carry icons + counts; strength bars carry numbers | quick check | may be claimed |
| Sufficient Contrast | palette not measured | required (Accessibility Inspector / Android Accessibility Scanner) | after the pass |
| Reduced Motion | explicit system mode (this program) | quick check | may be claimed after the quick check |
| Captions / Audio Descriptions | not applicable (no video); listening transcripts by construct | — | not applicable |

Rule: the Accessibility Nutrition Labels and the website statement claim a
feature only after its device row below is marked PASS with a device, OS
version and build number.

## Device pass — exact steps (owner)

Do the iPhone column with VoiceOver and the Android column with TalkBack.
Record device, OS, build number, and PASS/FAIL per row in
`DEVICE_ACCEPTANCE.md` (accessibility section).

Enable: iPhone Settings → Accessibility → VoiceOver (triple-click side
button shortcut recommended); Android Settings → Accessibility → TalkBack.

| # | Task | Expected with the screen reader | Expected at the largest text size |
|---|---|---|---|
| A1 | Onboarding: pick French, pick a goal, tap Learn French | course cards announced as buttons with "selected"; goal chips announce the XP amount and selected state; the start button announces "Learn French" | chips wrap to more rows; button still reachable |
| A2 | Learn tab: find the current lesson, hear a locked node, open a guidebook | nodes announce their title, "button", and the hint (Locked… / Completed… / Cleared… / Start this lesson) ; guidebook buttons announce "<unit> guidebook" | path scrolls; no node text clipped |
| A3 | Lesson: answer a Choose exercise, then a wrong answer | options announce text and, after Check, "correct" / "not correct"; Check and Continue announce as buttons with disabled state before an answer | option cards grow; Check stays visible above the keyboard-free layout |
| A4 | Type exercise | text field announced with its placeholder; feedback text read after Check | field and buttons reachable |
| A5 | Listening lesson | Play audio / Play again / Pause audio announced; Slow speed switch announced with its state; transcript readable after answering | controls reachable; question not clipped |
| A6 | Speaking lesson (allow the microphone) | Record your answer / Stop recording announced with state; "I heard: …" read; Skip this step reachable | — |
| A7 | Speaking lesson with the microphone denied | blocked panel read as text; Allow microphone / Open Settings / Skip this step buttons | — |
| A8 | Today: change the session length, start, finish | preset chips announce "N minute session" and selected state; summary figures read | — |
| A9 | Practice tab: every card | each card is a button with its label | cards stack; no clipping |
| A10 | Vocabulary: search, open an entry | search field announced; rows announced with the word; strength announced as a number | entry scrolls |
| A11 | Goals: chips, explainer toggle, starting-point actions | chips announce the full status line; "What this estimate is and is not" toggles and the text is read; Reset starting point announces as a button | text wraps; nothing overlaps |
| A12 | Profile: stats, Appearance, Export, Import, Privacy, Licenses | stats read label + value; appearance options announce selected state; each data row is a button | rows grow; hints visible |
| A13 | Checkpoint (section 1) and the capstone pre-gate | intro text read; options as A3; the pre-gate's buttons announced | — |
| A14 | Reduce Motion on (Settings → Accessibility → Motion / Remove animations) | lesson progress bar and feedback appear without animation; start bubble does not bob | — |
| A15 | Contrast scan (Accessibility Inspector audit on iOS; Accessibility Scanner on Android) on Learn, a lesson, Today, Profile in light and dark | no contrast finding on text; findings on decorative chrome noted | — |

Pass criteria: every row's expected behaviour observed; any FAIL is a P1
for screen-reader tasks A1–A4, A6, A7, A12 (core learning + settings) and
a P2 elsewhere; P1 blocks the store claims and the release.

## Statement wording (website `/accessibility/`, store labels)

Until the device pass: "Screen-reader support, large text and contrast
are implemented in code and being verified on devices; dark mode,
non-colour cues and reduced motion are supported." After the pass: replace
"being verified" with the verified list and dates.
