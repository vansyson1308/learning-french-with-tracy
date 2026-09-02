# Privacy — final store declarations (§40-§48)

Evidence base: `PRIVACY_INVENTORY.md` (every runtime data flow, with source
evidence), `PRIVACY_POLICY.md` / `src/lib/privacy-policy.ts` (the policy shown
in the app and on the website), `SECURITY_AUDIT.md` (no analytics, ads,
crash or attribution SDK), `MONETIZATION_POLICY_V1.md`. Definitions used are
quoted in `PUBLICATION_RESEARCH.md`.

## Facts the declarations rest on

| Fact | Evidence |
|---|---|
| The app makes no network requests of its own (no fetch/XMLHttpRequest/WebSocket in `src/`) | grep in `RELEASE_REDTEAM.md`; `PRIVACY_INVENTORY.md` |
| Progress is stored only on the device (AsyncStorage/SQLite); backups are created only when the learner taps Export and go through the OS share sheet | `backup.ts`, personas tests |
| Speaking: audio is captured only while the learner records; it is handed to the **operating system's** speech recogniser (Apple Speech / Android SpeechRecognizer via expo-speech-recognition); the app never receives, uploads or stores audio; per-attempt temporary files are deleted at step end and swept at session end; transcripts are never persisted | `speech-privacy.test.ts`, `speech-cache.test.ts`, `PRIVACY_INVENTORY.md` |
| The OS recogniser may itself send audio to Apple/Google when no on-device model exists; the app discloses this before the first attempt and in the policy | `NETWORK_DISCLOSURE_TEXT`, policy section "Speaking practice and the microphone" |
| No account, no identifiers read, no analytics, no ads, no crash reporting, tutor disabled | `SECURITY_AUDIT.md`, `MONETIZATION_POLICY_V1.md` |

## Apple — App Privacy (App Store Connect → App Privacy)

Apple's definition: data is "collected" when it is "transmitted off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time"; data "processed only on device is not 'collected'".

- **Do you or your third-party partners collect data from this app?** → **No** ("Data Not Collected").
- Rationale per type: Audio Data — recorded on device and processed by the operating system, not by the developer or a third-party SDK the developer added; nothing is transmitted by the app. User Content, Usage Data, Diagnostics, Identifiers, Contact Info, Location, Purchases — none exist.
- **Privacy Policy URL:** the live site URL (`PUBLICATION_STATUS.md`); **Privacy Choices URL:** none.
- **Review note (App Review Information):** "The app itself makes no network requests. Speaking exercises use the operating system's speech recogniser (SFSpeechRecognizer); depending on the device it may use Apple's servers, which the app discloses before the first attempt. The developer never receives audio or transcripts. No account, no analytics, no ads."
- **Privacy manifest:** app-level `PrivacyInfo.xcprivacy` declares `NSPrivacyTracking = false`, no tracking domains, no collected data types, and the four required-reason APIs actually used (file timestamps C617.1, user defaults CA92.1, system boot time 35F9.1, disk space E174.1) — `PRIVACY_MANIFEST.md`. Nothing added that the app does not use.

## Google — Data safety (Play Console → App content → Data safety)

Google's definition: "collect" = transmitting data off the user's device; ephemeral processing must still be entered in the form.

- **Does your app collect or share any of the required user data types?** → **No.**
- Rationale: the app transmits nothing. Speech audio is processed by the device's system speech service, which the app calls through the platform API; it is not a third-party library the developer bundled, and the developer never receives the data. This is stated in the policy. (If a Play reviewer treats the system recogniser as collection on the developer's behalf, the fallback declaration is: Audio → collected, not shared, ephemeral processing, purpose App functionality, optional, not encrypted-in-transit claim needed as the app does not transmit it — recorded here so the decision is not improvised under review pressure.)
- **Is all of the user data collected by your app encrypted in transit?** → not applicable (no collection).
- **Do you provide a way for users to request that their data is deleted?** → not applicable; deleting the app deletes all data (stated in the policy).
- **Privacy policy URL:** the live site URL.

## Ads declaration (§44)

**Contains ads: No.** No advertising SDK exists in the dependency tree; adding one would require this declaration, the App Privacy answers, the Data safety form and the policy to change first (`MONETIZATION_POLICY_V1.md`).

## Content rating (§45)

Facts: educational language app; no violence, sexual content, profanity, drugs, gambling, user-generated content, social features, chat, purchases or ads; no location; the AI tutor is disabled. Recorded French partner lines are scripted, everyday exchanges.

- **Apple age rating questionnaire:** all "None"; no unrestricted web access; no gambling/contests; no medical information → expected **4+** (Apple assigns the final rating).
- **Google IARC questionnaire:** app category "Reference, News, or Educational"; answer No to violence, sexuality, language, controlled substances, gambling, user interaction/sharing, location sharing, purchases → expected **Everyone / PEGI 3** (IARC assigns the final rating).

## Target audience (§46)

**Not designed for children.** Target age group: **13 and over** (Apple: no Kids Category; Google: target audience 13+ / 16+ / 18+ only — do not tick under-13 groups). Reason: the app is general-audience language learning; declaring a child audience would trigger child-directed compliance (Families policy, parental consent, no personal data) that adds obligations without a product reason. Store copy avoids child-directed language.

## App Review information (§47)

- No login; no demo account needed. Note text as in the Apple section above, plus: "To test speaking: Practice → Review speaking, allow microphone and speech recognition; to test conversation: Practice → Have a conversation. The Goals screen's 'A1 estimate' is explicitly not a certification."
- Contact fields (first name, last name, phone, email) — **owner-supplied**; may differ from the public support email.

## Export compliance (§48)

`ITSAppUsesNonExemptEncryption = false` stays correct: the app uses no encryption of its own; the only encryption in the binary is the operating system's (TLS is not even exercised by the app, which makes no network requests; SQLite is unencrypted; backups are plain files). Apple: "Set the value to NO if your app … only uses forms of encryption that are exempt". The owner may still owe an annual U.S. self-classification report for exempt encryption; Apple's page says apps using exempt encryption "might alternatively be required to submit a year-end self-classification report" — noted in `PUBLISHING_RUNBOOK.md` for the owner's judgement.

## Owner-supplied fields (never invented)

- Hosted privacy policy URL — becomes real when GitHub Pages is enabled (`PUBLICATION_STATUS.md`).
- Public support email (`release/support-contact.json`).
- App Review contact name/phone/email.
- Play developer contact email/phone.
