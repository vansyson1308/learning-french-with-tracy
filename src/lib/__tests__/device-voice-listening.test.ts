/**
 * QC 2026-11-05 §2.1: device-voice listening. A course whose profile sets
 * `deviceVoiceScoredListening` (data, never a language literal) grades its
 * listening items through the installed local device voice when the clip has
 * no bundled asset; with no voice the item is shown as "no device voice" and
 * skipped, never counted wrong. Every other course keeps the P7 §25-26 rule:
 * scored listening resolves only through bundled assets.
 */
import { afterEach, describe, expect, test } from "bun:test";

import { __registerCourseProfileForTests, courseProfile } from "../course-profile";
import {
  DEVICE_VOICE_PITCH,
  deviceSpeechRate,
  deviceUtterances,
  deviceVoiceListeningCourse,
  listeningAudioPlan,
  partnerUtterances,
  speakUtterances,
} from "../reception/device-voice-listening";
import { SLOW_RATE } from "../reception/listening-player";
import { emptySessionState, sessionReducer, skipAllowed } from "../session/reducer";
import { DEVICE_VOICE_RATE, type DeviceVoice } from "../stories/read-along";
import type { Exercise } from "../types";

const KO_VOICE: DeviceVoice = { identifier: "ko-kr-x-ism-local", name: "ko-kr-x-ism-local", language: "ko-KR" };
const LINES = [
  { speaker: "A" as const, text: "안녕하세요?" },
  { speaker: "B" as const, text: " 네, 안녕하세요. " },
];

afterEach(() => __registerCourseProfileForTests(null, "zz-vi"));

describe("deviceVoiceListeningCourse (profile data, not a language check)", () => {
  test("only a profile that opts in", () => {
    expect(deviceVoiceListeningCourse("fr-en")).toBe(false);
    expect(deviceVoiceListeningCourse("ko-en")).toBe(false);
    __registerCourseProfileForTests({ ...courseProfile("ko-en"), id: "zz-vi", deviceVoiceScoredListening: true });
    expect(deviceVoiceListeningCourse("zz-vi")).toBe(true);
  });

  test("no compiled course opts in yet (bundled-audio courses unchanged)", () => {
    for (const id of ["fr-en", "fr-vi", "es-vi", "de-vi", "it-vi", "en-vi", "ja-vi", "ko-en", "zh-en"]) {
      expect(courseProfile(id).deviceVoiceScoredListening).toBeUndefined();
    }
  });
});

describe("deviceUtterances", () => {
  test("one utterance per transcript line, B a lower pitch, text trimmed, empty lines dropped", () => {
    expect(deviceUtterances([...LINES, { speaker: "A", text: "  " }])).toEqual([
      { text: "안녕하세요?", pitch: DEVICE_VOICE_PITCH.A },
      { text: "네, 안녕하세요.", pitch: DEVICE_VOICE_PITCH.B },
    ]);
    expect(DEVICE_VOICE_PITCH.B).toBeLessThan(DEVICE_VOICE_PITCH.A);
  });

  test("slow mode multiplies the device rate", () => {
    expect(deviceSpeechRate(1)).toBe(DEVICE_VOICE_RATE);
    expect(deviceSpeechRate(SLOW_RATE)).toBeCloseTo(DEVICE_VOICE_RATE * SLOW_RATE, 10);
  });
});

describe("listeningAudioPlan", () => {
  const base = { bundled: null, deviceVoiceCourse: true, lines: LINES, voice: KO_VOICE, voiceFailed: false } as const;

  test("a bundled asset always wins, opted in or not", () => {
    expect(listeningAudioPlan({ ...base, bundled: 42 })).toEqual({ kind: "bundled", source: 42 });
    expect(listeningAudioPlan({ ...base, bundled: 42, deviceVoiceCourse: false })).toEqual({ kind: "bundled", source: 42 });
  });

  test("a course that does not opt in never falls back to the device voice (P7 §25-26)", () => {
    expect(listeningAudioPlan({ ...base, deviceVoiceCourse: false })).toEqual({ kind: "unavailable" });
  });

  test("opted in + a local voice → graded through the device voice", () => {
    expect(listeningAudioPlan(base)).toEqual({
      kind: "device-voice",
      voice: KO_VOICE,
      utterances: [
        { text: "안녕하세요?", pitch: DEVICE_VOICE_PITCH.A },
        { text: "네, 안녕하세요.", pitch: DEVICE_VOICE_PITCH.B },
      ],
    });
  });

  test("opted in, still looking → waiting; no voice or a failed voice → no-device-voice", () => {
    expect(listeningAudioPlan({ ...base, voice: undefined })).toEqual({ kind: "looking-for-voice" });
    expect(listeningAudioPlan({ ...base, voice: null })).toEqual({ kind: "no-device-voice" });
    expect(listeningAudioPlan({ ...base, voiceFailed: true })).toEqual({ kind: "no-device-voice" });
  });

  test("an unknown clip or an empty transcript is unavailable, never spoken", () => {
    expect(listeningAudioPlan({ ...base, lines: null })).toEqual({ kind: "unavailable" });
    expect(listeningAudioPlan({ ...base, lines: [{ speaker: "A", text: " " }] })).toEqual({ kind: "unavailable" });
  });
});

describe("a listening item without a device voice is skipped, never wrong", () => {
  const lc: Exercise = {
    type: "listeningComprehension",
    id: "zz-vi:u1-l1-e1",
    clipId: "zz.clip.x",
    question: "Bạn nghe thấy gì?",
    options: [{ text: "xin chào" }, { text: "cảm ơn" }],
    correct: 0,
  } as Exercise;

  test("listening and dictation stay skippable in every session kind", () => {
    for (const kind of ["lesson", "checkpoint", "placement", "review"] as const) {
      expect(skipAllowed(kind as never, "listeningComprehension")).toBe(true);
      expect(skipAllowed(kind as never, "dictation")).toBe(true);
    }
  });

  test("the skip records no first-attempt result and no wrong count (no evidence)", () => {
    let s = sessionReducer(emptySessionState(), {
      type: "start",
      sessionId: "s1",
      courseId: "zz-vi",
      steps: [{ type: "exercise", stepId: "x1", exercise: lc } as never],
    });
    s = sessionReducer(s, { type: "skip" });
    expect(s.skipped).toEqual({ x1: true });
    expect(s.firstResults).toEqual({});
    expect(s.wrongCounts).toEqual({});
    expect(s.finished).toBe(true);
  });
});

/**
 * Coordinator 2026-11-05 (P4e session 3): speech models and scenario partner lines of a device-voice course follow the
 * listening rule — played through the local voice when there is one, otherwise the install hint — but they are never
 * graded, so nothing is skipped: the step goes on with the text on screen.
 */
describe("unscored device-voice playback (speech models, partner lines)", () => {
  test("speakUtterances speaks every line in order, each at its speaker's pitch, through the chosen local voice", () => {
    const calls: { text: string; options: Record<string, unknown> }[] = [];
    speakUtterances(deviceUtterances(LINES), KO_VOICE, (text, options) => calls.push({ text, options }));
    expect(calls).toEqual([
      { text: "안녕하세요?", options: { language: "ko-KR", voice: KO_VOICE.identifier, pitch: DEVICE_VOICE_PITCH.A, rate: DEVICE_VOICE_RATE } },
      { text: "네, 안녕하세요.", options: { language: "ko-KR", voice: KO_VOICE.identifier, pitch: DEVICE_VOICE_PITCH.B, rate: DEVICE_VOICE_RATE } },
    ]);
  });
  test("a partner line reads its clip's transcript, or the node text when the clip is unknown; nothing when both are empty", () => {
    expect(partnerUtterances(LINES, "x")).toEqual(deviceUtterances(LINES));
    expect(partnerUtterances(null, " 어서 오세요. ")).toEqual([{ text: "어서 오세요.", pitch: DEVICE_VOICE_PITCH.A }]);
    expect(partnerUtterances(null, " ")).toEqual([]);
  });
  test("the plan is the listening plan: a bundled clip wins, no voice is the install hint", () => {
    const base = { bundled: null, deviceVoiceCourse: true, lines: LINES, voiceFailed: false };
    expect(listeningAudioPlan({ ...base, voice: null }).kind).toBe("no-device-voice");
    expect(listeningAudioPlan({ ...base, voice: KO_VOICE }).kind).toBe("device-voice");
    expect(listeningAudioPlan({ ...base, bundled: 7, voice: KO_VOICE }).kind).toBe("bundled");
    expect(listeningAudioPlan({ ...base, deviceVoiceCourse: false, voice: KO_VOICE }).kind).toBe("unavailable");
  });
});
