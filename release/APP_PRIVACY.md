# Apple App Privacy — draft answers (Phase 10 §44)

Source of truth: `PRIVACY_INVENTORY.md`. Apple's definition (rendered from
developer.apple.com/app-store/app-privacy-details on 2026-09-02): "'Collect'
refers to transmitting data off the device in a way that allows you and/or
your third-party partners to access it for a period longer than what is
necessary to service the transmitted request in real time." and "Data that
is processed only on device is not 'collected' and does not need to be
disclosed."

## Reconciliation of every candidate data type

| Apple data type | Does the app or an embedded partner transmit it off device and retain it? | Answer |
|---|---|---|
| Contact info, User ID, Purchases, Financial info, Health, Location, Contacts, Browsing/Search history, Identifiers (device/advertising) | Never read; no account, no ads, no network | not collected |
| **Audio data** ("User's voice or sound recordings") | The app records only in memory / a temporary cache it deletes, and never transmits audio itself. Speech-to-text is performed by the operating system's speech service, which on some devices sends audio to the platform provider; that is an OS capability invoked through Apple's own framework (`SFSpeechRecognizer`), not a third-party partner the developer embeds, and the developer never receives or retains the audio | **not collected by the developer** — see reviewer note |
| User content (other) — typed answers, writing tasks | processed on device, not retained beyond feedback, never transmitted | not collected |
| Usage data / Diagnostics / Crash data | no analytics, no crash SDK, no logs leave the device | not collected |
| Other data | none | not collected |

Draft App Privacy answer: **"Data Not Collected"** for the app, with
"Data Used to Track You": none.

## Reviewer note (paste into App Store Connect "Notes for Review")

> The app has no server and makes no network requests. Speaking practice
> uses Apple's Speech framework (`SFSpeechRecognizer`) to transcribe the
> user's French after they tap the record button; on-device recognition is
> requested when available, and the app discloses before a scored check
> that the system service may otherwise use the network. The app never
> transmits or stores audio itself; the transcript is used in memory to
> check the answer and is not persisted. Progress data stays in the app's
> sandbox; backups are created only when the user taps Export and are
> shared through the system share sheet. There are no accounts, purchases,
> ads, analytics or tracking.

## Items the owner must supply (not inventable)

- The hosted privacy-policy URL for the App Store Connect metadata field
  (the text is `release/PRIVACY_POLICY.md`, identical to the in-app Privacy
  screen).
- A support URL / contact.

## Caution

If a future version ever adds an online feature (e.g. an authenticated tutor
backend), this answer set becomes invalid: the tutor seam is disabled in
this release precisely so the declaration above stays true.
