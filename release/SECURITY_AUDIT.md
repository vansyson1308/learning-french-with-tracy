# Secret and supply-chain audit (Phase 10 §48)

Run on 2026-09-02 against `phase10/final-release`.

## Secrets

| Scan | Method | Result |
|---|---|---|
| Working tree | grep for OpenAI/Anthropic/AWS/GitHub/Slack/Google key shapes and PEM private-key headers, excluding the test that spells the patterns | **clean** |
| Full git history (all refs) | `git log -p --all` piped through the same patterns | **clean** |
| Client bundle key scan | `src/lib/__tests__/tutor-seam.test.ts` (§51) fails the suite if `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` or an `sk-…` literal appears under `src/`, `app.json`, `eas.json`, `package.json` | green |
| GitHub secret scanning | repository is public; GitHub's push protection applies | — |

## Dependencies (installed tree, 1,014 packages incl. transitive)

| License | Packages |
|---|---|
| MIT | 890 |
| ISC | 39 |
| Apache-2.0 | 28 |
| BSD-3-Clause / BSD-2-Clause | 23 / 14 |
| BlueOak-1.0.0 | 6 |
| MPL-2.0 | 3 |
| MIT OR CC0-1.0, Unlicense, 0BSD, MIT AND Apache-2.0, Python-2.0, CC-BY-4.0, MIT OR Apache-2.0 | 1–2 each |
| BSD-3-Clause OR GPL-2.0 | 1 — `node-forge@1.4.0` (dual-licensed; BSD-3-Clause applies). Build-time tooling only: pulled by the Expo CLI/dev-server chain, not part of the app bundle |

No package is GPL-only, AGPL, SSPL, non-commercial, or unlicensed. The
runtime app bundle contains only permissively licensed code; the dataset
license for the lexicon (CC BY-SA 4.0) is separate and documented in
`LEXICON_LICENSE.md` / in-app Licenses.

## Third-party SDK behaviour

- No analytics, advertising, attribution, crash-reporting or A/B SDK is
  installed (`node_modules` checked for firebase, sentry, segment,
  amplitude, mixpanel, bugsnag, crashlytics, facebook-sdk, adjust,
  appsflyer: none).
- `expo-speech-recognition` wraps the OS speech APIs; it contains no
  network client. `expo-audio`'s only `fetch` is in its **web** build
  (loading audio sources by URL); the app plays bundled assets.
- The optional tutor is `DisabledTutorProvider`; there is no provider that
  could make a request, and an import-graph test proves grading code cannot
  import the tutor module.

## Supply-chain controls

- `bun install --frozen-lockfile` in CI; the lockfile was regenerated once
  in Gate 0 and reproduces ("no changes").
- Bun blocks dependency lifecycle scripts by default; the one blocked
  postinstall (`unrs-resolver`) is a build-tool optional native binary and
  is not needed.
- Bun pinned to 1.3.11 in CI; Expo/React Native pinned exactly.
- Generated content artifacts are drift-guarded (`compile-content --check`).
- No CI workflow uses repository secrets for the app; the dispatch-only
  build workflows produce debug-signed QA artifacts and never upload to a
  store.

## Residual items

- Dependabot/Renovate is not configured (owner choice; the repo is public).
- The Android APK produced by CI is signed with the debug keystore for QA
  installs only — never a release signing key, which the owner holds.
