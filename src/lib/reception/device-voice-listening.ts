/**
 * Device-voice listening (QC 2026-11-05 §2.1). The pure rules; the React
 * adapter is use-device-listening-player.ts.
 *
 * P7 §25-26 / D-5: scored listening resolves only through bundled assets.
 * A course whose profile sets `deviceVoiceScoredListening` (data, validated
 * to be a device-tts course) changes that for its clips without an asset:
 * the transcript is known, so the device voice can read it and the item is
 * graded like any other. With no local voice for the course's TTS locale
 * the item is shown as "no device voice" with an install hint and skipped
 * through the session's skip channel — no first-attempt result, no wrong
 * count, no evidence (session/reducer.ts). A bundled clip always wins.
 *
 * Privacy: expo-speech hands the text to the OS engine; nothing is recorded
 * or sent by the app, and only voices judged local are picked
 * (stories/read-along.ts pickDeviceVoice).
 */

import { courseProfile } from "../course-profile";
import { DEVICE_VOICE_RATE, type DeviceVoice } from "../stories/read-along";

export type ListeningLine = { speaker: "A" | "B"; text: string };
export type DeviceUtterance = { text: string; pitch: number };

/** One device voice reads both parts; speaker B is pitched lower so a dialogue stays two voices. */
export const DEVICE_VOICE_PITCH = { A: 1, B: 0.8 } as const;

export function deviceVoiceListeningCourse(courseId: string): boolean {
  return courseProfile(courseId).deviceVoiceScoredListening === true;
}

export function deviceUtterances(lines: readonly ListeningLine[]): DeviceUtterance[] {
  return lines
    .map((l) => ({ text: l.text.trim(), pitch: DEVICE_VOICE_PITCH[l.speaker] }))
    .filter((u) => u.text.length > 0);
}

/** The engine rate for a player rate (1 or the slow rate): the read-along's rate, slowed by the same factor as clips. */
export function deviceSpeechRate(playerRate: number): number {
  return DEVICE_VOICE_RATE * playerRate;
}

export type ListeningAudioPlan =
  | { kind: "bundled"; source: number }
  | { kind: "device-voice"; voice: DeviceVoice; utterances: DeviceUtterance[] }
  /** The voice list is still being read: nothing plays yet. */
  | { kind: "looking-for-voice" }
  /** Opted in, but no local voice (or it failed to speak): notice + install hint + skip. */
  | { kind: "no-device-voice" }
  /** The P7 rule: no bundled asset, no device voice — the audio-skip affordance. */
  | { kind: "unavailable" };

export function listeningAudioPlan(input: {
  bundled: number | null;
  deviceVoiceCourse: boolean;
  /** The clip's transcript lines; null when the clip is unknown. */
  lines: readonly ListeningLine[] | null;
  /** undefined while looking, null when none is installed. */
  voice: DeviceVoice | null | undefined;
  voiceFailed: boolean;
}): ListeningAudioPlan {
  if (input.bundled !== null) return { kind: "bundled", source: input.bundled };
  if (!input.deviceVoiceCourse || input.lines === null) return { kind: "unavailable" };
  const utterances = deviceUtterances(input.lines);
  if (utterances.length === 0) return { kind: "unavailable" };
  if (input.voiceFailed) return { kind: "no-device-voice" };
  if (input.voice === undefined) return { kind: "looking-for-voice" };
  if (input.voice === null) return { kind: "no-device-voice" };
  return { kind: "device-voice", voice: input.voice, utterances };
}
