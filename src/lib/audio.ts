import {
  createAudioPlayer,
  setAudioModeAsync,
  useAudioPlayer,
  type AudioPlayer,
} from "expo-audio";
import * as Speech from "expo-speech";

import { audioManifest } from "../content/audio-manifest";
import { courseProfile } from "./course-profile";

setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

let voicePlayer: AudioPlayer | null = null;

/**
 * Stop all central voice playback before a speech-recognition attempt
 * (P8 §10: model audio must never sound while the mic is open).
 * Component-owned players (listening exercises) pause themselves.
 */
export function stopSpeechPlayback() {
  Speech.stop();
  voicePlayer?.pause();
}

/**
 * Re-assert the app's playback audio session. The speech recognizer leaves
 * iOS in a playAndRecord/measurement session that it does NOT restore
 * (verified in the pinned provider source — RESEARCH.md §5), which mutes or
 * quiets normal playback; call this after EVERY terminal attempt state.
 */
export function restorePlaybackAudioMode() {
  setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
}

export function speakTarget(courseId: string, text: string) {
  Speech.stop();
  // Pack audio is the target language's: a secondary-native course (fr-vi)
  // plays the clips recorded for the primary course of its target (fr-en).
  const audioCourseId = courseProfile(courseId).audioCourseId ?? courseId;
  const key = `${audioCourseId}:${text}`;
  const source = audioManifest[key];
  if (source) {
    if (!voicePlayer) voicePlayer = createAudioPlayer(source);
    else voicePlayer.replace(source);
    voicePlayer.seekTo(0);
    voicePlayer.play();
    return;
  }
  const locale = courseProfile(courseId).ttsLocale || "en-US";
  Speech.speak(text, { language: locale, rate: 0.9 });
}

export function useSfx() {
  const correct = useAudioPlayer(require("@/assets/sfx/correct.wav"));
  const incorrect = useAudioPlayer(require("@/assets/sfx/incorrect.wav"));
  const finish = useAudioPlayer(require("@/assets/sfx/finish.mp3"));

  const play = (player: ReturnType<typeof useAudioPlayer>) => {
    player.seekTo(0);
    player.play();
  };

  return {
    playCorrect: () => play(correct),
    playIncorrect: () => play(incorrect),
    playFinish: () => play(finish),
  };
}
