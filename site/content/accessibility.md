# Accessibility statement

{{APP_NAME}} is built to be usable with the assistive technologies of iOS and Android. This statement says what is supported, what is not yet, and what has not been tested — in the same words the app's release records use.

## What is in place

- Every button, option card, word-bank chip and course card has an accessible role, a label and a state (selected, disabled, correct or not correct), so screen readers announce them.
- Right and wrong answers are shown with a glyph and a text suffix in addition to colour.
- The app follows the system text size; reading passages scale to at least 200%, and every screen scrolls.
- Dark mode follows the system setting or your choice in Profile.
- Nothing essential depends on animation; motion is decorative.
- Speaking steps are always skippable; the app never requires the microphone.

## Status per feature

| Feature | Status |
|---|---|
| VoiceOver (iOS) | Supported in code; a common-task pass on hardware is scheduled before store submission |
| TalkBack (Android) | Supported in code; hardware pass scheduled before store submission |
| Larger Text | Supported (reading passages up to 200%; other text follows the system size) |
| Dark Interface | Supported |
| Differentiate Without Color Alone | Supported |
| Reduced Motion | Respected where motion exists |
| Voice Control | Not yet verified |
| Captions | Not applicable (no video; listening clips have transcripts revealed after answering) |
| Audio Descriptions | Not applicable (no video) |

## Known limits

- Speech recognition depends on your device's system recogniser and microphone.
- Sighted-only cues: none known; if you find one, report it with the accessibility issue template.

## Report a problem

Use the accessibility template on [GitHub Issues]({{ISSUES}}). We treat accessibility reports as bugs, not feature requests.
