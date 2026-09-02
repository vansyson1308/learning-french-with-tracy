# Accessibility statement

{{APP_NAME}} is built to be usable with the assistive technologies of iOS and Android. This statement says what is supported, what is not yet, and what has not been tested — in the same words the app's release records use.

## What is in place

- Every button, option card, word-bank chip and course card has an accessible role, a label and a state (selected, disabled, correct or not correct), so screen readers announce them.
- Right and wrong answers are shown with a glyph and a text suffix in addition to colour.
- The app follows the system text size; reading passages scale to at least 200%, and every screen scrolls.
- Dark mode follows the system setting or your choice in Profile.
- Nothing essential depends on animation; motion is decorative, and the app follows the system Reduce Motion setting (transitions complete instantly when it is on).
- Speaking steps are always skippable; the app never requires the microphone.

## Status per feature

| Feature | Status |
|---|---|
| VoiceOver (iOS) | Implemented in code (roles, labels, states, hints on every control); the device pass in the release records runs before any store claim |
| TalkBack (Android) | Implemented in code; device pass before any store claim |
| Larger Text | Supported (reading passages up to 200%; other text follows the system size) |
| Dark Interface | Supported |
| Differentiate Without Color Alone | Supported |
| Reduced Motion | Supported — the system setting is honoured app-wide |
| Voice Control | Relies on the same labels; not yet verified on a device |
| Captions | Not applicable (no video; listening clips have transcripts revealed after answering) |
| Audio Descriptions | Not applicable (no video) |

## Known limits

- Speech recognition depends on your device's system recogniser and microphone.
- Sighted-only cues: none known; if you find one, report it with the accessibility issue template.

## Report a problem

Use the accessibility template on [GitHub Issues]({{ISSUES}}). We treat accessibility reports as bugs, not feature requests.
