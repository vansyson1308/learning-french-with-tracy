/**
 * QC 2026-10-29b §2.4: a story without bundled audio is read along in the
 * device voice (expo-speech), sentence by sentence, offline; without an
 * installed voice it is text only. Pure engine: audio source, voice
 * matching, mode, and the sentence sequencing that drives the highlight.
 */
import { describe, expect, test } from "bun:test";

import { courseProfile } from "../course-profile";
import { storyAudioSourceFor, storyHasAudio, storyList } from "../stories/content";
import {
  DEVICE_VOICE_RATE,
  initialReadAlong,
  isLocalVoice,
  pickDeviceVoice,
  readAlongCommand,
  readAlongMode,
  readAlongReducer,
  storyAudioSource,
  type DeviceVoice,
} from "../stories/read-along";

const story = { sentences: [{ assetKey: "a" }, { assetKey: "b" }, { assetKey: "c" }] };
const voice = (identifier: string, language: string, extra: Partial<DeviceVoice> = {}): DeviceVoice => ({
  identifier,
  name: identifier,
  language,
  ...extra,
});

describe("audio source of a story (the one seam)", () => {
  test("bundled only when every sentence has an asset in the manifest", () => {
    expect(storyAudioSource(story, { a: 1, b: 2, c: 3 })).toBe("bundled");
    expect(storyAudioSource(story, { a: 1, c: 3 })).toBe("device-voice");
    expect(storyAudioSource(story, {})).toBe("device-voice");
  });

  test("a null entry is not an asset; a story without sentences is never bundled", () => {
    expect(storyAudioSource(story, { a: 1, b: null, c: 3 })).toBe("device-voice");
    expect(storyAudioSource({ sentences: [] }, { a: 1 })).toBe("device-voice");
  });

  test("the course seam agrees with storyHasAudio for every shipped story", () => {
    for (const courseId of ["fr-en", "fr-vi", "es-vi", "de-vi"]) {
      for (const s of storyList(courseId)) {
        expect(storyAudioSourceFor(courseId, s) === "bundled").toBe(storyHasAudio(courseId, s));
      }
    }
  });
});

describe("device voice matching", () => {
  test("the exact course locale wins over other regions of the language", () => {
    const voices = [voice("mx", "es-MX"), voice("es", "es-ES"), voice("us", "es-US")];
    expect(pickDeviceVoice(voices, "es-ES")?.identifier).toBe("es");
  });

  test("language-only fallback: es-ES takes es-MX when no es-ES voice exists; es takes any es-*", () => {
    expect(pickDeviceVoice([voice("de", "de-DE"), voice("mx", "es-MX")], "es-ES")?.identifier).toBe("mx");
    expect(pickDeviceVoice([voice("es", "es-ES")], "es")?.identifier).toBe("es");
    expect(pickDeviceVoice([voice("mx", "es-MX"), voice("de", "de-DE")], "es")?.identifier).toBe("mx");
  });

  test("matching ignores case and underscores; another language never matches", () => {
    expect(pickDeviceVoice([voice("es", "ES_es")], "es-ES")?.identifier).toBe("es");
    expect(pickDeviceVoice([voice("pt", "pt-BR"), voice("en", "en-US")], "es-ES")).toBeNull();
    expect(pickDeviceVoice([], "de-DE")).toBeNull();
    expect(pickDeviceVoice([voice("x", "")], "de-DE")).toBeNull();
  });

  test("network voices are never used (Android -network names, web localService=false)", () => {
    expect(isLocalVoice(voice("de-de-x-deb-network", "de-DE"))).toBe(false);
    expect(isLocalVoice(voice("Google Deutsch", "de-DE", { localService: false }))).toBe(false);
    expect(isLocalVoice(voice("de-de-x-deb-local", "de-DE"))).toBe(true);
    expect(isLocalVoice(voice("com.apple.voice.compact.de-DE.Anna", "de-DE"))).toBe(true);
    expect(pickDeviceVoice([voice("de-de-x-deb-network", "de-DE")], "de-DE")).toBeNull();
    expect(
      pickDeviceVoice([voice("de-de-x-deb-network", "de-DE"), voice("de-at-x-dea-local", "de-AT")], "de-DE")?.identifier
    ).toBe("de-at-x-dea-local");
  });

  test("within a tier: an explicitly local voice, then enhanced quality, then identifier order", () => {
    expect(pickDeviceVoice([voice("de-de-language", "de-DE"), voice("de-de-x-nfh-local", "de-DE")], "de-DE")?.identifier).toBe(
      "de-de-x-nfh-local"
    );
    expect(
      pickDeviceVoice([voice("b", "de-DE"), voice("c", "de-DE", { quality: "Enhanced" }), voice("a", "de-DE")], "de-DE")?.identifier
    ).toBe("c");
    expect(pickDeviceVoice([voice("b", "de-DE"), voice("a", "de-DE")], "de-DE")?.identifier).toBe("a");
  });

  test("the stories courses match on their profile locale", () => {
    const voices = [voice("de-de-x-deb-local", "de-DE"), voice("es-es-x-eea-local", "es-ES"), voice("fr-fr-x-frb-local", "fr-FR")];
    expect(pickDeviceVoice(voices, courseProfile("de-vi").ttsLocale)?.language).toBe("de-DE");
    expect(pickDeviceVoice(voices, courseProfile("es-vi").ttsLocale)?.language).toBe("es-ES");
  });
});

describe("the three read-along states", () => {
  const v = voice("de-de-x-deb-local", "de-DE");
  test("bundled audio always uses the bundled player, whatever voices exist", () => {
    expect(readAlongMode("bundled", v)).toBe("bundled");
    expect(readAlongMode("bundled", null)).toBe("bundled");
  });
  test("no bundled audio: device voice when one is installed, else text only", () => {
    expect(readAlongMode("device-voice", v)).toBe("device-voice");
    expect(readAlongMode("device-voice", null)).toBe("text-only");
  });
  test("the device voice reads a little slower than normal (no slow mode in the story player)", () => {
    expect(DEVICE_VOICE_RATE).toBeGreaterThan(0.5);
    expect(DEVICE_VOICE_RATE).toBeLessThanOrEqual(1);
  });
});

describe("device-voice sentence sequencing", () => {
  const reduce = readAlongReducer(3);

  test("play speaks sentence 1; each onDone moves the highlight on; after the last it stops at the top", () => {
    let s = reduce(initialReadAlong, { type: "play" });
    expect(s).toMatchObject({ index: 0, playing: true });
    expect(readAlongCommand(s)).toEqual({ kind: "speak", index: 0, utterance: s.utterance });
    s = reduce(s, { type: "utteranceDone", utterance: s.utterance });
    expect(readAlongCommand(s)).toEqual({ kind: "speak", index: 1, utterance: s.utterance });
    s = reduce(s, { type: "utteranceDone", utterance: s.utterance });
    expect(s.index).toBe(2);
    s = reduce(s, { type: "utteranceDone", utterance: s.utterance });
    expect(s).toMatchObject({ index: null, playing: false, finishedOnce: true });
    expect(readAlongCommand(s)).toEqual({ kind: "stop" });
  });

  test("every new sentence is a new utterance; a stale onDone (from a stopped utterance) is ignored", () => {
    const first = reduce(initialReadAlong, { type: "play" });
    const jumped = reduce(first, { type: "playFrom", index: 2 });
    expect(jumped.utterance).not.toBe(first.utterance);
    expect(reduce(jumped, { type: "utteranceDone", utterance: first.utterance })).toBe(jumped);
  });

  test("pause stops speaking and keeps the place; play speaks that sentence again from its start", () => {
    const playing = reduce(reduce(initialReadAlong, { type: "playFrom", index: 1 }), { type: "pause" });
    expect(playing).toMatchObject({ index: 1, playing: false });
    expect(readAlongCommand(playing)).toEqual({ kind: "stop" });
    const resumed = reduce(playing, { type: "play" });
    expect(resumed.index).toBe(1);
    expect(readAlongCommand(resumed)).toEqual({ kind: "speak", index: 1, utterance: resumed.utterance });
    expect(reduce(playing, { type: "utteranceDone", utterance: playing.utterance })).toBe(playing);
  });

  test("leaving the reader stops and cancels; backgrounding and a speech error pause", () => {
    const s = reduce(initialReadAlong, { type: "playFrom", index: 2 });
    const left = reduce(s, { type: "leave" });
    expect(left).toMatchObject({ index: null, playing: false });
    expect(readAlongCommand(left)).toEqual({ kind: "stop" });
    expect(reduce(s, { type: "appBackground" })).toMatchObject({ index: 2, playing: false });
    expect(reduce(s, { type: "utteranceError", utterance: s.utterance })).toMatchObject({ index: 2, playing: false });
    expect(reduce(s, { type: "utteranceError", utterance: s.utterance - 1 })).toBe(s);
  });

  test("an out-of-range jump and a story without sentences change nothing", () => {
    const s = reduce(initialReadAlong, { type: "play" });
    expect(reduce(s, { type: "playFrom", index: 9 })).toBe(s);
    expect(readAlongReducer(0)(initialReadAlong, { type: "play" })).toBe(initialReadAlong);
  });
});
