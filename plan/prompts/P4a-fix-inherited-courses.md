# P4a — Fix the inherited packs and retire them as the `-vi` courses ship

Read `CLAUDE.md`, **`plan/03-AUDIT-CONTENT.md` §1.2–1.3 and §8**, `plan/06-RESEARCH-OPEN-RESOURCES.md` §2.2, §7. Branch `phase-4/inherited-packs`. End with the REPORT block.

## Goal
No broken or misleading content remains in any course still visible; the inherited `*-en` basic packs are hidden from onboarding as soon as the corresponding `<target>-vi` course passes its claim gate (kept installable under "Khoá khác / Other courses" for English-UI users until P6 decides to delete them).

## Tasks
1. Data fixes (with validator rules so they cannot regress): ja 16 degenerate/missing-blank fillBlanks rewritten as real cloze; zh 20 likewise; ko 13 sentences with spacing restored; it 3 apostrophe-stripped options; de "time word" guidebook error; remove the 60 romanized "translation" alternatives in ja/ko/zh typeAnswer (replace with real English alternatives); dedupe repeated words across units; new validator rules: fillBlank must contain exactly one `___` and the correct option must not be the whole sentence; alternatives must not be romanizations of the prompt.
2. Render `Word.romanization` (and later readings) in word lists, guidebook key words, select options, match pairs, post-answer panel, behind a per-course toggle "Hiện phiên âm / Show reading aid" (default on for A1).
3. Spanish: switch the pack voice to `es_MX-claude` (Apache-2.0) if the canary passes, or re-author the text to Castilian — decide by canary WER and document; Portuguese stays pt-BR.
4. Course visibility rule in the compiler/profile: `hiddenFromOnboarding: true` for any `*-en` basic pack whose target has a `-vi` course with `claimGate.A1 == true`; a migration-free switch (no learner data touched). Implement the "Khoá khác" section in onboarding/course switcher.
5. Optional cheap upgrade for the still-visible `*-en` packs (while their `-vi` twin is not ready): enable FSRS via profile with the SM-2→FSRS migration test (`estimateFsrsCardFromSm2` per course) so no one is left on SM-2.
6. Docs: `KNOWN_LIMITATIONS.md` (which courses are "basic packs"), store metadata draft language list, `plan/STATUS.md`.

## Definition of Done
Validators extended and green; goldens unchanged for fr; migration tests for SM-2→FSRS on each course; device smoke on one course listed as Owner action; CI green.
