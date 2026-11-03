/**
 * Japanese pack, lexicon and listening clips ship as Ogg Opus
 * (content/audio/engines.json encoding.codecByLanguage.ja;
 * release/ASSET_DELIVERY.md). The players never look at the format: a
 * bundled clip is a Metro module id from a static require(), whatever its
 * extension. These tests pin that the lesson/lexicon path (speakTarget, the
 * one central voice player) and the listening player hand an .opus module
 * to expo-audio exactly as they hand an .mp3 one, and never fall back to
 * device TTS for it. Device decoding of Opus is proven by device acceptance
 * (`opus_playback`, and the lessons shard's playback events per course).
 */
import { renderHook } from "@testing-library/react-native";

import { speakTarget } from "../src/lib/audio";
import { courseBundle, registerCourseBundle } from "../src/lib/course-bundle";
import { courseProfile } from "../src/lib/course-profile";
import { useListeningPlayer } from "../src/lib/reception/use-listening-player";

// A real committed Ogg Opus file (mono 16 kbps); jest maps .opus to a module id stub (jest.config.js).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const OPUS_CLIP: number = require("../assets/diagnostics/opus/story-sentence-16k.opus");

const expoAudio = jest.requireMock("expo-audio") as { createAudioPlayer: (s: unknown) => unknown; useAudioPlayer: (s: unknown) => unknown };
const speech = jest.requireMock("expo-speech") as { speak: jest.Mock };

const COURSE = "ja-en";

beforeAll(() => {
  const base = courseBundle(COURSE);
  if (!base) throw new Error(`${COURSE} bundle not registered`);
  const audioCourse = courseProfile(COURSE).audioCourseId ?? COURSE;
  registerCourseBundle({ ...base, audio: { ...base.audio, [`${audioCourse}:水`]: OPUS_CLIP, [`${audioCourse}:みず`]: OPUS_CLIP } });
});

describe("Opus pack/lexicon clips through speakTarget", () => {
  test("an .opus clip is loaded into the central voice player and played; no device TTS", () => {
    const create = jest.spyOn(expoAudio, "createAudioPlayer");
    speech.speak.mockClear();
    speakTarget(COURSE, "水");
    expect(create).toHaveBeenCalledWith(OPUS_CLIP);
    const player = create.mock.results[0].value as { play: jest.Mock; seekTo: jest.Mock; replace: jest.Mock };
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalledTimes(1);
    // The next clip replaces the source on the same player.
    speakTarget(COURSE, "みず");
    expect(player.replace).toHaveBeenCalledWith(OPUS_CLIP);
    expect(player.play).toHaveBeenCalledTimes(2);
    expect(speech.speak).not.toHaveBeenCalled();
    create.mockRestore();
  });

  test("a string without a bundled clip still falls back to the device voice", () => {
    speech.speak.mockClear();
    speakTarget(COURSE, "未収録の文");
    expect(speech.speak).toHaveBeenCalledTimes(1);
  });
});

describe("Opus listening clips through the listening player", () => {
  test("the listening player loads the .opus module into expo-audio", () => {
    const use = jest.spyOn(expoAudio, "useAudioPlayer");
    const { result } = renderHook(() => useListeningPlayer(OPUS_CLIP, { maxPlays: 2, allowSlow: false }));
    expect(use).toHaveBeenCalledWith(OPUS_CLIP);
    expect(result.current.canPlay).toBe(true);
    use.mockRestore();
  });
});
