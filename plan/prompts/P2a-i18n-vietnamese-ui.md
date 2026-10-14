# P2a — i18n chrome: the whole app in Vietnamese (and English)

Read `CLAUDE.md`, `plan/07-PRODUCT-SPEC.md` §4.2, `plan/02-AUDIT-ARCHITECTURE.md` §9 (all), `plan/05-RESEARCH-MARKET.md` §2.5. Branch `phase-2/i18n`. End with the REPORT block.

## Goal
Every user-visible string (screens, components, accessibility labels/hints, alerts, quest labels, rubric/speech/interaction feedback, goals/estimate wording, privacy policy, licences intro) comes from a typed catalogue with `vi` and `en`; the UI language follows the device (`expo-localization`) with an override in Profile; Vietnamese is the default on `vi-*` devices.

## Tasks
1. Add `expo-localization`. Implement `src/lib/i18n/` with a typed `t(key, params)` (keys as a TypeScript union generated from `src/lib/i18n/catalog/en.json`), ICU-style plural/select via a tiny formatter (no heavy runtime; `Intl.PluralRules` on Hermes — verify), `useT()` hook, and `uiLanguage` from the store (`"system" | "vi" | "en"`, field added in P1d).
2. Extract strings: ~500. Lib modules return **message keys + params** (e.g. `{key:"rubric.missingSlot", params:{slot}}`) and the UI formats them; no English sentences remain in `src/lib` (add a lint test that greps for sentence-like string literals in `src/lib/**` outside the catalogue and an allowlist).
3. Vietnamese catalogue: write natural, concise Vietnamese (northern standard, "bạn" register, no slang); learning terms consistent (từ vựng, ôn tập, bài kiểm tra, ước tính trình độ, …); keep the honesty wording: "Ước tính theo khung CEFR — không phải chứng chỉ hay kỳ thi CEFR chính thức." Build a `src/lib/i18n/GLOSSARY.md` of term choices.
4. Typography QA for Vietnamese: check clipping of stacked diacritics (ệ, ở, ữ) at `fontWeight 800`, `lineHeight` in `DuoButton` (uppercase labels — consider `textTransform: none` for `vi`), path nodes, chips. Introduce typography tokens (`src/lib/typography.ts`) and a shared `AppText` used by new/edited screens; do not restyle everything.
5. Profile → "Ngôn ngữ hiển thị / App language" picker; onboarding shows course names in the UI language (`targetLanguage` localised via catalogue: "Tiếng Pháp", "Tiếng Anh", …).
6. Privacy policy and licences: `src/lib/privacy-policy.ts` becomes `{vi, en}` with the same single-source rule and the existing test updated to check both; `release/PRIVACY_POLICY.md` gains a Vietnamese section; website `site/` gets `/vi/` pages (build-site.ts) and `verify-site.sh` checks them.
7. e2e: replace text selectors with `testID`s across `e2e/*.mjs` and `scripts/emulator-smoke.sh`; add a Vietnamese smoke run (set `EXPO_PUBLIC_UI_LANG=vi` or the store override) to CI.
8. Screenshots: `e2e/screenshots.mjs` captures both languages into `screenshots/<lang>/`.
9. Docs: `docs/USER_GUIDE.md` gets a Vietnamese version `docs/USER_GUIDE.vi.md` (translate faithfully; mark sections not yet validated); `KNOWN_LIMITATIONS.md` removes "English-only UI".

## Definition of Done
App fully usable in Vietnamese with `fr-en` content (content stays English-glossed until P2b — that is expected); no hardcoded English in `src/`; both e2e smokes green; goldens unchanged (i18n must not touch engine outputs); CI green; `plan/STATUS.md` updated.
