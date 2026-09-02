# Beta tester guide — Learning French with Tracy

Thank you for testing. This page tells you how to install the test build, what to try, what **not** to send us, and how to report what you find. Testing takes about 20–30 minutes for the core flows; a daily 5-minute session over the test period is even more useful.

## 1. Installing

**Android (Google Play closed test).** Open the opt-in link you received while signed in with the Google account you gave us, tap **Become a tester**, then install the app from the Play Store link on the same page. Updates arrive through the Play Store automatically.

**Android (direct APK, if you received one).** Download the `.apk` from the GitHub Releases link, open it, and allow the install when Android asks ("Install unknown apps" is normal for files that do not come from the store). Sideloaded builds do not update themselves — install the next file we send.

**iPhone (TestFlight).** Install the TestFlight app from the App Store, open the invitation link on the phone, and tap **Install**. TestFlight builds expire after 90 days.

## 2. What to test (in this order)

1. **First launch**: choose French, pick a daily goal, and land on the Learn tab.
2. **Starting-point check** (Profile → Your French goals → *Find your starting point*): answer honestly; "I don't know" is a real answer.
3. **A lesson** from the Learn tab: try every exercise type you meet (choose, arrange the words, match, type, fill the blank). Use **Check**, then **Continue**.
4. **Today**: pick a length and complete a session; try **Undo this review** once.
5. **Listening** (Practice → Review listening): play, replay, use **Slow**.
6. **Speaking** (Practice → Review speaking): allow the microphone and speech recognition when asked; read the notice about your device's recogniser; record, stop, and see what the app says it heard. Try **Skip this step** once.
7. **Writing** (Practice → Practice writing) and **Conversation** (Practice → Have a conversation).
8. **Vocabulary**: search a word, open it, play its audio.
9. **Checkpoint**: from the Learn tab, open a checkpoint at the end of a section.
10. **Backup**: Profile → **Export progress**, then **Import progress** with the file you just saved.
11. **Accessibility** (if you can): turn on VoiceOver or TalkBack and do steps 3 and 6; set the largest text size and repeat step 3.
12. **Force-quit and reopen**: your progress should be exactly where you left it.

## 3. What to report

For each problem: what you did, what you expected, what happened, your device model and OS version, and the app version shown on the Profile screen. Screenshots help.

Use the templates on GitHub Issues: **Bug report**, **Audio or speech problem**, **Accessibility issue**, **French correction** — or the support email if you were given one.

Speech problems: tell us the French you said (as text) and what the app displayed under "I heard:". That is all we need.

## 4. What NOT to send

- Do not send voice recordings, screen recordings with your voice, or any personal data.
- Do not share your backup file publicly; it contains your learning history (no names, but it is yours).
- Do not post the TestFlight or Play opt-in link publicly.

## 5. Good to know

- The A1 estimate on the Goals screen comes from this course's own checks; it is not an official CEFR result, and the app says so.
- The app never uploads your recordings. On some devices the system speech recogniser needs the internet; the app tells you before the first attempt.
- Speaking steps are always skippable; the app works fully without the microphone.
- The Japanese and Korean courses use your device's own text-to-speech voices.

Thank you — every report, including "everything worked", helps the release decision.
