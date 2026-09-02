/**
 * The privacy policy — ONE source of truth (Phase 10 §42-§43). The in-app
 * Privacy screen renders these sections; release/PRIVACY_POLICY.md is the
 * same text rendered to Markdown (a test keeps the two identical) for the
 * store listing and any hosted copy the owner publishes.
 *
 * Wording discipline: the APP makes no network requests of its own, but
 * the operating system's speech service may use the network when no
 * on-device French model is available. Nothing here may claim "100 %
 * offline" or "your voice never leaves your device" — those would be false
 * on some devices, and the boundary is stated instead.
 */

export const PRIVACY_POLICY_VERSION = "1.0";
export const PRIVACY_POLICY_EFFECTIVE = "2026-09-02";

export type PolicySection = { title: string; paragraphs: string[] };

export const PRIVACY_POLICY_SECTIONS: readonly PolicySection[] = [
  {
    title: "In short",
    paragraphs: [
      "This app teaches beginner French. It has no account, no advertising, no analytics, and no server of its own. The app itself makes no network requests: your learning progress stays in the app's private storage on your device.",
      "The one exception to \"nothing leaves the device\" is speaking practice: the app asks your device's built-in speech recognition to turn your spoken French into text, and that operating-system service may use the network on some devices. The section on speaking practice explains exactly what that means.",
    ],
  },
  {
    title: "What stays on your device",
    paragraphs: [
      "Learning progress: which lessons you finished, points and streaks, spaced-repetition scheduling for words you have met, the results of the French checks you take, your placement result, and settings such as theme and daily goal. This is stored in the app's private storage and is not sent anywhere by the app.",
      "The French dictionary bundled with the app (word data, pronunciation, examples) is read-only content; using it records nothing about you.",
      "Nothing you write in writing practice is stored beyond checking your answer and showing you feedback; it is not kept in progress data.",
    ],
  },
  {
    title: "Speaking practice and the microphone",
    paragraphs: [
      "The microphone is used only after you tap the record button, and only while the recording indicator is shown. Nothing is recorded until you tap the record button.",
      "To understand what you said, the app uses your device's operating-system speech recognition (Apple's speech framework on iPhone, the Android speech recognizer on Android). The app asks for on-device recognition whenever your device supports it and has the French language pack installed. If it does not, the operating system's service may send the audio to the platform provider (Apple or Google) to be recognized, under that provider's own privacy terms. The app does not operate any speech server and never receives your audio from anyone.",
      "Before a spoken check that could use network-backed recognition, the app tells you so and lets you choose to skip it. Skipping never counts against you.",
      "What the app keeps: the recognized text is used only to check your answer and is held in memory for the current session; it is not written to your progress data or to backups. In practice mode, when your device supports it, a recording of your attempt is saved in a temporary cache folder so you can listen to yourself; it is deleted when you move on and the whole folder is swept at the end of the session. Scored checks never keep a recording.",
      "You can withdraw microphone or speech-recognition permission at any time in your device's settings. Every lesson, reading, listening and writing feature keeps working without them; only the speaking parts are then skipped.",
    ],
  },
  {
    title: "Backups you create",
    paragraphs: [
      "Export creates a backup file of your learning progress only when you tap Export, and hands it to your device's share sheet so you decide where it goes (a file app, cloud storage you already use, or another device). Import reads a backup file you pick. The app never uploads or downloads backups by itself.",
      "A backup contains the progress described above. It never contains audio, transcripts of your speech, or anything you did not do in the app.",
    ],
  },
  {
    title: "Permissions the app declares",
    paragraphs: [
      "Microphone (iPhone and Android) and speech recognition (iPhone): used only for speaking practice, as described above.",
      "Android also lists standard entries that show no prompt: INTERNET (declared by the underlying framework; the app makes no requests of its own), VIBRATE (haptic feedback), and MODIFY_AUDIO_SETTINGS (to route playback correctly). The app declares no background service and does not record or play audio in the background.",
    ],
  },
  {
    title: "Third-party code",
    paragraphs: [
      "The app is built from open-source libraries (Expo, React Native, the ts-fsrs scheduler and others, listed under Licenses & attributions). None of them is an analytics, advertising or crash-reporting service, and none receives data from this app. Your device's speech service is part of the operating system, not a library shipped with the app.",
      "The app contains a switch for an optional AI tutor. It is disabled: the app contains no AI service credentials, makes no AI requests, and no AI is ever involved in checking or scoring your work.",
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "The app collects no personal data from anyone, including children. It has no accounts, no messaging, no advertising and no purchases.",
    ],
  },
  {
    title: "Your choices and deleting your data",
    paragraphs: [
      "All of your data is on your device. Deleting the app removes all of it. Backups you exported are files under your own control; delete them wherever you saved them.",
      "Because nothing is collected, there is nothing to request access to or to have deleted on our side.",
    ],
  },
  {
    title: "Changes and contact",
    paragraphs: [
      "If a future version changes any of this — for example if an optional online feature is ever added — this policy will be updated first, with a new version number and date, and the change will be described in the app.",
      "The support contact for this app is published on its store listing.",
    ],
  },
];

/** The policy as Markdown (release/PRIVACY_POLICY.md is exactly this). */
export function renderPrivacyPolicyMarkdown(): string {
  const lines: string[] = [
    "# Privacy policy",
    "",
    `Version ${PRIVACY_POLICY_VERSION} — effective ${PRIVACY_POLICY_EFFECTIVE}`,
    "",
  ];
  for (const section of PRIVACY_POLICY_SECTIONS) {
    lines.push(`## ${section.title}`, "");
    for (const paragraph of section.paragraphs) lines.push(paragraph, "");
  }
  return lines.join("\n");
}
