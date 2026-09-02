# Publication research (V1 Release Acceptance & Publication Program §1)

Refreshed on 2026-09-02 from the sources listed below. Every statement
carries its source class: **primary** (the platform's own page, fetched
from this environment), **primary-source-mirror** (the vendor's
documentation source repository on GitHub, fetched raw), or **secondary**
(third-party summaries used only where the primary page is unreachable from
this environment — flagged VERIFY IN CONSOLE). Nothing below was taken from
earlier-phase notes without re-fetching.

## Reachability from this environment

| Source | Result |
|---|---|
| developer.apple.com (enrollment, memberships, review guidelines, App Store Connect help, HIG, documentation JSON) | reachable |
| developer.android.com (target-SDK requirements, Android 16 changes, Play Console overview) | reachable |
| support.google.com/googleplay (Play Console Help: fees, testing requirements, Data safety) | **blocked** |
| play.google.com, play.google (policy centre) | **blocked** |
| docs.expo.dev / expo.dev | **blocked** — the documentation *source* (github.com/expo/expo `docs/pages`) is reachable raw |
| docs.github.com | **blocked** — the documentation *source* (github.com/github/docs `content/`) is reachable raw |
| huggingface.co (Piper voices) | **blocked** here; reachable from GitHub-hosted runners (the reception-audio workflow already relies on this) |
| raw.githubusercontent.com (rhasspy/piper VOICES.md) | reachable |
| pypi.org (piper-tts), registry.npmjs.org (eas-cli) | reachable |
| api.github.com | reachable |

## Apple

### Developer Program enrollment (primary: developer.apple.com/programs/enroll)

- Fee, verbatim: "The Apple Developer Program is 99 USD per membership year. Prices may vary by region and are listed in local currency during the enrollment process."
- Individuals need an Apple Account with two-factor authentication, legal age of majority, and their **legal name** in the name fields ("aliases, nicknames, or company names will cause delays"); email, phone and a non-P.O.-box address are confirmed.
- Seller name for individuals, verbatim: "Your personal legal name is needed so that you can enter into contracts with Apple. Your name will be displayed as the seller name of your apps on the App Store."
- Enrollment is possible from the Apple Developer app; fee waivers exist only for nonprofits, accredited educational institutions and government entities.

### Free Apple Account versus paid membership (primary: developer.apple.com/support/compare-memberships)

- Free account (Xcode Personal Team): can run apps on personal devices, but "The number of App IDs that can be registered your account at one time is limited to 10 and each expires after 7 days", "The number of test devices … is limited to 3 and each expires after 7 days", "Provisioning profiles will expire 7 days from issuance".
- **No App Store and no TestFlight** without the paid Program. Consequence for this project: iPhone device testing is possible with a free account on the owner's own phone (7-day reinstall cycle); any broader distribution needs the 99 USD membership.

### App Review Guidelines (primary: developer.apple.com/app-store/review/guidelines, quoted sections)

- 5.1.1(i): "All apps must include a link to their privacy policy in the App Store Connect metadata field and within the app in an easily accessible manner." The policy must identify what data is collected, how, and all uses; confirm third parties provide equal protection; and "Explain its data retention/deletion policies and describe how a user can revoke consent and/or request deletion of the user's data."
- 5.1.1(ii): apps that collect user or usage data must secure consent; purpose strings must "clearly and completely describe your use of the data".
- 5.1.2(i): no use/transmission/sharing of personal data without permission; explicit disclosure of sharing with third parties "including with third-party AI".
- 2.1(a): submissions must be final versions with fully functional URLs; "placeholder text, empty websites, and other temporary content should be scrubbed before submission. Make sure your app has been tested on-device for bugs and stability before you submit it".
- 2.3.3: "Screenshots should show the app in use, and not merely the title art, login page, or splash screen."
- 1.5: "Make sure your app and its Support URL include an easy way to contact you".
- 4.2: minimum functionality — the app must be more than a repackaged website.

### App Privacy details (primary: developer.apple.com/app-store/app-privacy-details)

- "Collect" = "transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time."
- "Data that is processed only on device is not 'collected' and does not need to be disclosed" — unless something derived from it is sent off device.
- Third-party partners = "analytics tools, advertising networks, third-party SDKs, or other external vendors whose code you've added to your app"; the developer is responsible for their practices.
- Data types relevant here: Audio Data ("The user's voice or sound recordings"), User Content, Diagnostics, Other Usage Data.
- Consequence: the app sends nothing off device itself. Speech audio handed to the **operating system's** recogniser is not a third-party SDK the developer added and the developer never receives it; the honest declaration remains "Data Not Collected" with the policy stating the OS boundary (App Review may still ask; the review notes explain it).

### Accessibility Nutrition Labels (primary: App Store Connect help)

- Nine declarable features (VoiceOver, Voice Control, Larger Text, Dark Interface, Differentiate Without Color Alone, Sufficient Contrast, Reduced Motion, Captions, Audio Descriptions).
- Criterion, verbatim: "To indicate support for an accessibility feature in the Accessibility Nutrition Labels, users must be able to complete all of the common tasks of your app using that feature." Common tasks = primary functionality + first launch + login + purchase + settings.
- Currently voluntary; Apple states it will become mandatory over time.

### Screenshot specifications (primary: App Store Connect help reference)

- Formats .jpeg/.jpg/.png, 1–10 per size, no alpha/transparency.
- iPhone 6.9-inch (required if the app runs on iPhone): 1260×2736, 1290×2796 or 1320×2868 (portrait; landscape swapped). 6.5-inch is only required when 6.9-inch is absent; smaller sizes are scaled from 6.9-inch when not provided.
- iPad 13-inch (required if the app runs on iPad): 2064×2752 or 2048×2732. This app declares `supportsTablet` — either provide iPad screenshots or set the app iPhone-only before submission (decision recorded in `STORE_METADATA_FINAL.md`).

### App icons (primary: HIG "App icons", JSON data endpoint)

- Provide **square, unmasked** layers; the system applies the rounded mask ("Providing layers with pre-defined masking negatively impacts specular highlight effects and makes edges look jagged").
- Include text "only when it's essential to your experience or brand"; do not replicate UI or use screenshots; prefer illustration over photos.
- Since June 2025 the guidance is layered/Liquid Glass icons authored in Icon Composer; a flattened 1024×1024 opaque image remains accepted as the fallback appearance.
- Home-screen appearances: default, dark, clear, tinted — keep the core features identical.

### Export compliance (primary: developer.apple.com documentation JSON)

- "Set the value to `NO` if your app—including any third-party libraries it links against—doesn't use encryption, or if it only uses forms of encryption that are exempt from export compliance documentation requirements." "Typically, the use of encryption that's built into the operating system—for example, when your app makes HTTPS connections using URLSession—is exempt from export documentation upload requirements, whereas the use of proprietary encryption is not."
- Apps using only exempt encryption "might alternatively be required to submit a year-end self-classification report to the U.S. government" — recorded for the owner in `PUBLISHING_RUNBOOK.md`.

## Google / Android

### Target API level (primary: developer.android.com/google/play/requirements/target-sdk)

- Verbatim: "New apps and app updates must target Android 16 (API level 36) or higher to be submitted to Google Play" (in force since 2026-08-31; extension possible to 2026-11-01). The project targets 36 (verified from the CI-built APK).

### Play Console account, fee, verification and testing requirement

Primary Play Console Help pages are unreachable from this environment. The
following is from secondary sources and is marked **VERIFY IN CONSOLE** at
account creation:

- One-time registration fee of 25 USD (no renewal); identity verification (government ID, matching details across ID, payment profile and developer profile) and 2-step verification are required before publishing.
- Personal developer accounts created after 2023-11-13 must run a **closed test with at least 12 testers opted in for 14 continuous days** before they can apply for production access; organization accounts are exempt.
- A personal account shows a developer name plus legal name/contact details required by the developer-information policy; check the current visibility rules in the Console before publishing.
- Sources: [IconikAI summary](https://www.iconikai.com/blog/google-play-developer-account-fee-2026), [Choicely guide](https://www.choicely.com/tutorials/how-to-create-a-google-play-developer-account-for-your-organization), [ConsoleMint](https://consolemint.com/google-play-console-price/), [Afkar Software](https://afkarsoftware.com/en/blog-detail/google-play-console-account-2026-one-time-25-fee/), [PrimeTestLab](https://primetestlab.com/blog/create-google-play-developer-account).

### Data safety (secondary, VERIFY IN CONSOLE)

- "Collect" = transmitting data off the user's device. Ephemeral processing ("stored in memory and retained for no longer than necessary to service the specific request in real-time") must still be entered in the form but is not shown on the listing.
- Fourteen data categories; for each: collected, shared, purpose, encryption in transit, deletion request. Internal testing is exempt; closed/open/production tracks require the declaration.
- Sources: [Play Console Help (unreachable here)](https://support.google.com/googleplay/android-developer/answer/10787469), [App Lander walkthrough](https://www.applander.io/blog/google-play-data-safety-form-complete-guide), [TermsFeed](https://www.termsfeed.com/blog/google-data-safety-form/).

### Android 16 behaviour (primary: developer.android.com/about/versions/16/behavior-changes-16)

- Reviewed in Phase 10 (`release/RESEARCH.md`): edge-to-edge enforcement, predictive back (opted out in `app.json`), 16 KB page-size readiness of the bundled native libraries is the build system's responsibility (RN 0.86 ships 16 KB-aligned libraries).

## Expo / EAS (primary-source-mirror: expo/expo docs/pages)

- Versions: `cli.appVersionSource` may be `remote` (recommended from EAS CLI 12; versions stored on EAS, app-config values ignored) or `local` ("the source of truth for project versions is the local project source code itself"; "EAS reads app version values and builds projects as they are. It doesn't write to the project."). Project decision: **local** (`release/VERSIONING.md`).
- Accounts: a Personal account is created at sign-up and "is a good place to work on your personal projects"; Organizations exist for shared ownership/transfer. A new project links to the owner's account via `owner` in `app.json` and the `extra.eas.projectId` written by `eas init`.
- Build setup: `eas login`, `eas whoami`, `eas build:configure`; Android APK/iOS simulator builds need no store membership.
- Submit iOS: `eas submit --platform ios` with `submit.production.ios.ascAppId` (the App Store Connect "Apple ID" of the app record); authentication via App Store Connect API key (`ascApiKeyPath/ascApiKeyIssuerId/ascApiKeyId`) or app-specific password; CI needs `EXPO_TOKEN`.
- Submit Android: first submission "creates your app's first release on the internal testing track" and needs a Google Service Account key; alternatively the first upload is done manually in Play Console; `releaseStatus: draft` uploads without rolling out.
- Credentials: EAS generates and stores the keystore / distribution certificate / provisioning profile; the keystore "should be kept private. Under no circumstances should you check it into your repository."; Play App Signing means an upload-key reset is possible via Google support if the keystore is lost.

## GitHub Pages (primary-source-mirror: github/docs)

- Publishing sources: "Deploy from a branch" or "GitHub Actions" (Settings → Pages → Build and deployment → Source); people with admin/maintainer permission configure it.
- A custom workflow uses `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, `actions/deploy-pages@v4`; the deploy job needs `pages: write` and `id-token: write`.
- Note: enabling Pages for a repository is a settings action; `configure-pages` can attempt it (`enablement: true`) but if the token lacks the permission the owner must switch Source to "GitHub Actions" once (recorded as the single enablement step in `PUBLISHING_RUNBOOK.md`).

## Audio (primary: rhasspy/piper VOICES.md; PyPI)

- Piper voices exist for the course languages `de_DE` (thorsten low/medium/high, mls, eva_k, karlsson, kerstin, pavoque, ramona, thorsten_emotional), `es_ES` (davefx medium, sharvard medium, carlfm x_low, mls_10246/mls_9972 low), `es_MX` (ald medium, claude high), `es_AR` (daniela high), `it_IT` (paola medium, riccardo x_low), `pt_BR` (cadu, faber, jeff medium; edresson low), `pt_PT` (tugão medium), `zh_CN` (huayan medium/x_low) and `fr_FR` (already pinned). **No Piper voice exists for Japanese or Korean.**
- Dataset licences live in each voice's MODEL_CARD on Hugging Face (unreachable here; read by the recon workflow on a runner). The project's licence gate accepts CC BY 4.0 / CC BY-SA 4.0 and denies AGPL/GPL/NC/ND; CC0/public-domain datasets are added to the allow list in this program because they are strictly more permissive.
- `piper-tts` 1.2.0 remains on PyPI (pin unchanged); `faster-whisper` supports de/es/fr/it/pt/zh for the ASR audit.

## Privacy implications re-checked for this app

| Fact about the app | Consequence |
|---|---|
| Microphone + OS speech recogniser, used only while the learner records | purpose strings already state this; App Privacy: no collection by the developer; Data safety: no collection; the policy and the in-app disclosure state the OS network-possible boundary |
| Temporary attempt audio in the app cache, deleted per step and at session end; transcripts never persisted | policy states retention; no declaration needed |
| Progress stored locally; manual backup export via the OS share sheet | user-initiated, not collection |
| No accounts, no analytics, no ads, no crash SDK, tutor disabled | "Data Not Collected"; Contains ads = No; no ads SDK |
