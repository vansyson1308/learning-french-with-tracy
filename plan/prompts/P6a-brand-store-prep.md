# P6a — Brand/identity migration, store listing, closed-test preparation

Read `CLAUDE.md`, `plan/07-PRODUCT-SPEC.md` D-3, D-7, `plan/05-RESEARCH-MARKET.md` §5, `release/PUBLISHING_RUNBOOK.md`, `RELEASE_IDENTITY.md`, `STORE_METADATA_FINAL.md`, `SCREENSHOT_MANIFEST.md`, `DATA_SAFETY.md`, `ANDROID_CLOSED_TEST_PLAN.md`, `GOOGLE_PLAY_ACCOUNT_SETUP.md`, `scripts/apply-identity.ts`. Branch `phase-6/store-prep`. End with the REPORT block.

## Tasks
1. Identity: apply the owner's chosen brand with `bun scripts/apply-identity.ts migrate` (name, slug, scheme; package id per D-3 decision — if changed, note that every installed build must be uninstalled; this is the last moment to change it), update `release/identity.json`, site, README lineage section (keep the Lingo Lessons attribution), backup file prefix (accept old), store metadata in `metadata/` (vi primary, en secondary; listing names every shipped `-vi` course and its exam track), `store.config.example.json`.
2. Store assets: icon/splash variants reviewed; screenshots captured from the final RC in vi and en via `e2e:screens` + device shots per manifest; feature graphic.
3. Policy: Data safety form answers regenerated from `release/PRIVACY_INVENTORY.md` ("No data collected" unless P5d/P5f shipped → declare downloads/opt-in); privacy policy URL check; target API 36 confirmation; permissions list.
4. Closed test: `ANDROID_CLOSED_TEST_PLAN.md` filled with the 12-tester plan (14 days), tester instructions in Vietnamese, feedback form (GitHub issue template), release notes vi/en.
5. Build path: `eas.json` `production` AAB via EAS (owner uploads the local keystore to EAS credentials first so the signer never changes) or a local `bundleRelease` + Play App Signing enrolment — document the chosen path in `PUBLISHING_RUNBOOK.md`; `release:bump` to 1.0.0 build N.
6. `PUBLICATION_STATUS.md` updated with evidence per gate.

## Definition of Done
Identity gate green; listing drafts complete in both languages; screenshots committed; Data safety mapping reviewed; closed-test plan ready; CI green; Owner actions listed (Play account, keystore upload, tester recruitment).
