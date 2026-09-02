# Release notes — French A1 course, release candidate (§66)

Version: `expo.version` 1.1.0 (build numbers allocated by EAS once the
identity decision is made — `RELEASE_IDENTITY.md`). Wording below is
learner-facing and makes no claim the product cannot keep.

## What's in this release

- **A complete A1 French course** in six sections: everyday vocabulary,
  gender and articles, high-yield verbs, cognates and false friends,
  numbers, connected French (liaison and elision), listening and reading,
  speaking, writing, and short spoken conversations.
- **Daily session (TODAY)** that mixes review, new words and practice by
  memory risk, driven by a spaced-repetition scheduler (FSRS) that never
  shows you a rating button — your answers are the evidence.
- **Listening** with real recorded clips and reading passages with tap-to-look-up
  words; a searchable vocabulary browser with pronunciation and examples.
- **Speaking**: repeat-after-me practice and "say it yourself" tasks graded
  on what your device's speech recogniser hears; short guided
  conversations with a partner voice.
- **Writing**: guided notes and forms with instant, specific feedback
  (what is missing, not a score).
- **Checkpoints and a placement diagnostic** so you can skip what you
  already know, plus an **A1 capstone**.
- **CEFR-aligned A1 estimate**: the Goals screen shows, per skill, what
  you have demonstrated in the course's checks. It is an estimate from
  this app's own checks — not an official or certified CEFR result.
- **Backup**: export your progress to a file and import it on another
  device.
- **Privacy**: no account, no analytics, no advertising. The app itself
  makes no network requests. Speaking exercises use your device's system
  speech recogniser, which may use the internet if your device has no
  on-device French model — the app tells you before the first attempt, and
  you can skip speaking. Full policy: Profile → Privacy.

## Good to know

- Speaking needs a microphone and speech-recognition permission; the app
  works fully without them (speaking steps are skippable).
- On the web version, speech recognition is not available and the app says
  so.
- Four Section-1 sentences currently have no recorded audio (the text was
  corrected late in the cycle); everything else in the French course has
  a recording.
- The other language courses remain the original, simpler courses.

## Fixed in this release cycle (Phase 10)

- Upgraded to Expo SDK 57 / React Native 0.86, which resolves a memory
  issue in the previous JavaScript engine release.
- Corrected French in Section 1 (*C'est un garçon / une fille*), two
  unanswerable fill-in-the-blank items, several grammar notes (gender
  endings, *manger*, *quatre-vingts*), and accents in the writing
  guidebooks.
- Writing and speaking checks now accept the natural ways of saying
  things (any word order for notes, *Ça fait … euros*, *Excusez-moi*,
  *Bien, merci*, …) and refuse keyword lists.
- Multiple-choice options in scored checks are shuffled per attempt.
- Accessibility: roles, states and labels on every interactive control;
  larger text supported in reading passages.
