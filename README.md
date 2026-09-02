# Learning French with Tracy

A free, local-first French course for English speakers: a structured path
from zero to a CEFR-aligned A1 estimate, with listening, reading, speaking,
writing and short spoken conversations, spaced review, and no account,
no ads and no analytics.

- **Free.** No purchases, subscriptions or advertising (see `release/MONETIZATION_POLICY_V1.md`).
- **Private.** Progress lives on your device; backups are files you export yourself. The app makes no network requests of its own. Speaking exercises use your device's own speech recogniser, which may use the internet if your device has no on-device French model — the app tells you before the first attempt. Full policy: `release/PRIVACY_POLICY.md` (also inside the app under Profile → Privacy).
- **Honest.** The A1 estimate is derived from the course's own checks. It is not an official or certified CEFR result.

## Lineage

This app is a substantial derivative of [Lingo Lessons](https://github.com/Open-Apps-Studio/lingo-lessons)
by Open Apps Studio (MIT). The original `LICENSE` — including the
650 Industries, Inc. notice from the create-expo-app template — is
preserved unchanged, and every third-party source is listed in
`ATTRIBUTIONS.md` and in the app under Profile → Licenses.

On top of that base the project adds a French excellence layer:
spaced-repetition scheduling (FSRS) over stable lexical identities, a daily
session, a curated French lexicon built with Lexique 4 data, French
pedagogy units (gender, high-yield verbs, cognates, numbers, connected
French), listening and reading with pipeline-synthesized audio, speaking
through the device recogniser, guided writing, spoken conversations,
checkpoints, a placement diagnostic and an A1 capstone. The seven other
language courses inherited from the base remain available.

## Documentation

- User guide: `docs/USER_GUIDE.md` — every section is walked against the app; the record is `docs/USER_GUIDE_VALIDATION.md`
- Beta tester guide: `docs/BETA_TESTER_GUIDE.md`
- Where v1 stands: `release/PUBLICATION_STATUS.md`; how it gets to the stores: `release/PUBLISHING_RUNBOOK.md`; what a phone must still prove: `release/DEVICE_ACCEPTANCE.md`
- Release records (readiness, privacy, accessibility, audio provenance, soak, store metadata, screenshots, RC ledger): `release/`

## Build

```bash
bun install --frozen-lockfile
bunx expo start            # add --web for the browser tier
bun run test               # unit + content tests (Bun)
bunx jest                  # integration tests (jest-expo)
bun scripts/compile-content.ts && bun scripts/validate-content.ts
```

Expo SDK 57 / React Native 0.86 / React 19 / Hermes. Content is authored
under `content/` and compiled into `src/content/`; the compiler and every
validator are in `scripts/`.

## License

Application code: MIT (see `LICENSE`, notices preserved). Authored French
lexicon data: CC BY-SA 4.0 (`LEXICON_LICENSE.md`). Third-party data and
voices: `ATTRIBUTIONS.md`.
