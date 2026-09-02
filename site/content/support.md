# Support

**App:** {{APP_NAME}} · **Version:** {{VERSION}}

## Contact

{{CONTACT}}

Please do not send recordings of your voice or any personal data. A description of what you did, what you expected and what happened (plus your device model and OS version) is enough.

## Frequently asked questions

### Do I need an account or the internet?

No account. The app works without the internet for everything except one thing: speaking exercises use your device's own speech recogniser, and on some devices that recogniser needs the internet (see below).

### The microphone button does nothing / speaking is unavailable

Speaking needs two permissions: **Microphone** and **Speech recognition**. If you declined one, the app shows a blocked panel with an **Open Settings** link.

- **iPhone:** Settings → Privacy & Security → Microphone → turn on {{APP_NAME}}; then Settings → Privacy & Security → Speech Recognition → turn on {{APP_NAME}}.
- **Android:** Settings → Apps → {{APP_NAME}} → Permissions → Microphone → Allow. If you chose "Don't ask again", you must allow it from this Settings screen.

Every speaking step can be skipped; skipped speaking reviews stay due and come back later.

### "Speech recognition may use the internet"

Your device's system recogniser converts your voice to text. Newer devices carry an on-device French model; older ones send the audio to the platform's speech service. The app checks this before your first attempt and tells you. The app itself never uploads or stores your recordings.

### Recognition keeps hearing the wrong words

Speak a little slower, closer to the microphone, in a quiet room, and say only the French sentence. Whole-utterance items need the full phrase; information items need the key facts (for example the number and the noun). If your device has no French model, the recogniser may be less accurate.

### No sound from the app

Check the silent switch / volume, and that Bluetooth audio is connected to the device you expect. Listening clips have a replay button; single words have a speaker button. The Japanese and Korean courses speak through your device's built-in voices, so they need a Japanese or Korean text-to-speech voice installed (Settings → Accessibility → Spoken Content on iPhone; Settings → System → Languages → Text-to-speech on Android).

### The app says nothing is due

Today builds a session from reviews that are due, new material from your current unit, and practice. If nothing is due and the path is finished, Today offers practice only. Learn a new lesson on the path to feed it.

### I want to change my starting point

Profile → Goals → **Reset starting point** (or **Retake the check**). Resetting never deletes lessons you completed.

### Restoring a backup fails

Import only files created by this app's **Export backup**. A file that is not a backup, is truncated, or comes from a newer version of the app is refused and your current progress stays untouched (the app tells you why).

### Text is too big / buttons are cut off

The app follows your system text size up to very large sizes; every screen scrolls. If something is unreachable at your size, please report it with the accessibility template — that is a bug we want to fix.

### Android: "Install unknown apps" warning

If you installed an APK from GitHub Releases instead of Google Play, Android shows a warning because the file did not come from the store. Play installations do not show it. Sideloaded builds do not update automatically.

## Report a bug

Use [GitHub Issues]({{ISSUES}}) and pick the matching template: **Bug report**, **Audio or speech problem**, **Accessibility issue**, or **French correction**. Include the app version (Profile screen), device and OS version, and the steps to reproduce. Screenshots help; recordings are not needed.
