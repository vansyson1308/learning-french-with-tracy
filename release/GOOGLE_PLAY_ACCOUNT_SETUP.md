# Google Play account runbook (§35)

Owner-only steps. Sources: `PUBLICATION_RESEARCH.md` — the Play Console
Help pages are unreachable from the agent's environment, so fee, verification
and testing requirements come from secondary sources and are marked
**VERIFY IN CONSOLE**; the Console itself states the current rule at each
step.

## Before you start — what to expect

- **Account type: personal.** A personal developer account is the right choice for an individual (an organization account needs a D-U-N-S number and business documents).
- **Public developer information.** Play shows a developer name of your choice, but Google verifies your **legal identity** and the developer-information policy requires a **contact email** on the listing; for personal accounts the legal name and, in some regions, an address may be displayed. Check the exact visibility rules in the Console during setup (**VERIFY IN CONSOLE**).
- **Fee.** One-time registration fee, currently reported as 25 USD (**VERIFY IN CONSOLE**), paid through a Google Payments profile in your name.
- **Identity verification** (government ID, matching details across ID, payments profile and developer profile) and **2-step verification** on the Google account are required before you can publish.
- **Closed testing requirement for new personal accounts:** at least **12 testers opted in for 14 continuous days** before you can apply for production access (**VERIFY IN CONSOLE** — the Console shows the requirement on the app's dashboard). Plan the tester group before you upload anything: `ANDROID_CLOSED_TEST_PLAN.md`.

## Steps

1. **Google account** dedicated to development (or your main one) with 2-step verification enabled.
2. **Register** at https://play.google.com/console/signup → **Personal** account → complete the developer profile (developer name = "Learning French with Tracy" is allowed as a public name if not already taken; the legal name stays your own).
3. **Payments profile** in your legal name; pay the registration fee.
4. **Identity verification**: upload the ID the Console asks for; wait for the verification email (can take days).
5. **Developer contact details**: enter the **public support email** (the mailbox you committed to monitor — also `release/support-contact.json`), and a phone number for Google's use.
6. **Create the app**: Play Console → **Create app** → name "Learning French with Tracy", default language English (United States), **App**, **Free**. Accept the declarations the Console requires (developer program policies, US export laws) after reading them.
7. **Package name is fixed at first upload.** The confirmed Android package from `release/identity.json` is baked into the first AAB you upload; it can never change afterwards.
8. **Play App Signing**: on the first upload keep the default **Use Google-generated key** (Google holds the app signing key; your upload key is the one EAS manages or the keystore you generate). Record which option was chosen in `RC_HISTORY.md`.
9. **Set up the app** (dashboard checklist): App access (all functionality available without special access — no login), Ads (**No, my app does not contain ads**), Content rating (IARC questionnaire, `PRIVACY_FINAL.md` §content rating), Target audience (13+ / not designed for children — see `PRIVACY_FINAL.md`), News app (No), COVID-19 apps (No), Data safety (answers in `PRIVACY_FINAL.md`), Government apps (No), Financial features (None), Health (No), Privacy policy URL (`PUBLICATION_STATUS.md`).
10. **Store listing**: from `STORE_METADATA_FINAL.md` and `SCREENSHOT_MANIFEST.md`.
11. **Internal testing** first (up to 100 testers, no review); then **closed testing** with the 12-tester group; after 14 days apply for **production access** from the dashboard; then production.
12. **Google Service Account key** (optional, for `eas submit`): Google Cloud project → service account → JSON key; invite it in Play Console → Users and permissions with release rights. Store the JSON outside the repository (`*.json` under `secrets/` is not tracked; simplest is the owner's machine only).

## What the agent records afterwards

- `release/identity.json` evidence, `PUBLICATION_STATUS.md` ("Google Play account: VERIFIED (date)", "Package registered (date)"), `RC_HISTORY.md` (signing choice).
