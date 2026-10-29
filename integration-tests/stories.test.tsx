/**
 * P5b graded stories through the real Expo Router tree: the Practice entry,
 * the list with its suggestion, and the reader (translation, tap-to-gloss,
 * questions, word check offer). Behavior-level assertions only.
 */
import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import React from "react";

import { storyAudioSourceFor, storyList } from "../src/lib/stories/content";
import { useProgress } from "../src/lib/store";

type SpeakOptions = { voice?: string; rate?: number; onDone?: () => void };
const Speech = jest.requireMock("expo-speech") as {
  speak: jest.Mock<void, [string, SpeakOptions]>;
  stop: jest.Mock;
  getAvailableVoicesAsync: jest.Mock;
};

beforeEach(() => {
  Speech.speak.mockClear();
  Speech.stop.mockClear();
  Speech.getAvailableVoicesAsync.mockReset();
  Speech.getAvailableVoicesAsync.mockImplementation(async () => []);
});

function seed(courseId: string) {
  useProgress.setState({
    activeCourseId: courseId,
    streak: 0,
    lastActiveDay: null,
    dailyGoal: 20,
    dailyXp: 0,
    dailyXpDay: null,
    onboardingDone: true,
    themePreference: "light",
    courses: {},
    activeDays: {},
    reviewLog: [],
  });
}

describe("Read & listen", () => {
  test("Practice offers stories where the course has them, and only there", async () => {
    seed("fr-en");
    renderRouter("./src/app", { initialUrl: "/practice" });
    await waitFor(() => expect(screen.getByTestId("practice-stories-card")).toBeOnTheScreen());
    expect(screen.getByText("Read & listen")).toBeOnTheScreen();

    seed("de-en");
    renderRouter("./src/app", { initialUrl: "/practice" });
    await waitFor(() => expect(screen.queryByTestId("practice-stories-card")).toBeNull());
  });

  test("the list suggests a story and shows how many words are new to this learner", async () => {
    seed("fr-en");
    renderRouter("./src/app", { initialUrl: "/stories" });
    await waitFor(() => expect(screen.getByTestId("stories-recommended")).toBeOnTheScreen());
    expect(screen.getByTestId("stories-item-fr.story.le_chat_et_la_souris")).toBeOnTheScreen();
    expect(screen.getAllByText(/new words for you/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/A1/)).toBeNull(); // levels, never CEFR labels
  });

  test("reader: translation, tap-to-gloss with learn toggle, questions, then the word check offer", async () => {
    seed("fr-en");
    renderRouter("./src/app", { initialUrl: "/story/fr.story.le_chat_et_la_souris" });
    await waitFor(() => expect(screen.getByTestId("story-reader")).toBeOnTheScreen());
    // French story sentences have bundled audio since the fr audio run (fr-story-assets.ts).
    expect(screen.getByTestId("story-listen")).toBeOnTheScreen();
    // Bundled audio: the existing player, never the device voice.
    expect(screen.queryByTestId("story-play")).toBeNull();
    expect(screen.queryByTestId("story-device-voice-label")).toBeNull();
    expect(screen.queryByTestId("story-device-voice-hint")).toBeNull();
    expect(Speech.getAvailableVoicesAsync).not.toHaveBeenCalled();
    expect(Speech.speak).not.toHaveBeenCalled();
    expect(Speech.stop).not.toHaveBeenCalled();

    await userEvent.press(screen.getByTestId("story-translate-1"));
    expect(screen.getByText("In Madame Dubois's house, there is a cat.")).toBeOnTheScreen();

    await userEvent.press(screen.getAllByTestId("story-word-fr:w:chat")[0]);
    expect(screen.getByTestId("story-word-sheet")).toBeOnTheScreen();
    expect(screen.getByTestId("story-word-gloss")).toHaveTextContent("the cat");
    await userEvent.press(screen.getByTestId("story-learn-word"));
    expect(screen.getByText("In your word check")).toBeOnTheScreen();

    await userEvent.press(screen.getByTestId("story-finish-reading"));
    await waitFor(() => expect(screen.getByTestId("story-questions")).toBeOnTheScreen());
    for (const answer of [1, 0, 2]) {
      await userEvent.press(screen.getByTestId(`story-question-option-${answer}`));
      expect(screen.getByText("Right!")).toBeOnTheScreen();
      await userEvent.press(screen.getByTestId("story-question-next"));
    }
    await waitFor(() => expect(screen.getByTestId("story-finished")).toBeOnTheScreen());
    expect(screen.getByText("3 of 3 answers right")).toBeOnTheScreen();
    // Three new words + the one picked while reading.
    expect(screen.getByText(/4 words to check/)).toBeOnTheScreen();
    expect(screen.getByTestId("story-check-words")).toBeOnTheScreen();
    // Reading itself wrote nothing to the learner's memory.
    expect(useProgress.getState().courses["fr-en"]?.cards ?? {}).toEqual({});
  });
});

describe("Read along in the device voice (no bundled audio)", () => {
  const story = storyList("de-vi").find((s) => storyAudioSourceFor("de-vi", s) === "device-voice");

  test("a de-vi story without bundled audio exists to exercise", () => {
    expect(story).toBeDefined();
  });

  test("with an offline German voice: labelled, read sentence by sentence in that local voice", async () => {
    Speech.getAvailableVoicesAsync.mockImplementation(async () => [
      { identifier: "de-de-x-deb-network", name: "de-de-x-deb-network", language: "de-DE", quality: "Enhanced" },
      { identifier: "de-de-x-deb-local", name: "de-de-x-deb-local", language: "de-DE", quality: "Default" },
      { identifier: "es-es-x-eea-local", name: "es-es-x-eea-local", language: "es-ES", quality: "Default" },
    ]);
    seed("de-vi");
    renderRouter("./src/app", { initialUrl: `/story/${story!.id}` });
    await waitFor(() => expect(screen.getByTestId("story-device-voice-label")).toBeOnTheScreen());
    expect(screen.getByText("Device voice")).toBeOnTheScreen();
    expect(screen.queryByTestId("story-listen")).toBeNull();
    expect(screen.queryByTestId("story-device-voice-hint")).toBeNull();
    expect(Speech.speak).not.toHaveBeenCalled();

    await userEvent.press(screen.getByTestId("story-play"));
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    const [text, options] = Speech.speak.mock.calls[0];
    expect(text).toBe(story!.sentences[0].text);
    expect(options.voice).toBe("de-de-x-deb-local");
    expect(options.rate).toBe(0.9);
    expect(screen.getByText("Pause")).toBeOnTheScreen();

    // The end of sentence 1 moves the read-along to sentence 2.
    act(() => options.onDone?.());
    expect(Speech.speak).toHaveBeenCalledTimes(2);
    expect(Speech.speak.mock.calls[1][0]).toBe(story!.sentences[1].text);
    // A late onDone of sentence 1 is stale and changes nothing.
    act(() => options.onDone?.());
    expect(Speech.speak).toHaveBeenCalledTimes(2);

    Speech.stop.mockClear();
    await userEvent.press(screen.getByTestId("story-play"));
    expect(Speech.stop).toHaveBeenCalled();
    expect(screen.getByText("Listen")).toBeOnTheScreen();

    // Leaving the reading phase cancels speech.
    await userEvent.press(screen.getByTestId("story-play"));
    Speech.stop.mockClear();
    await userEvent.press(screen.getByTestId("story-finish-reading"));
    await waitFor(() => expect(screen.getByTestId("story-questions")).toBeOnTheScreen());
    expect(Speech.stop).toHaveBeenCalled();
  });

  test("no offline German voice: text only, a one-line install hint, nothing spoken", async () => {
    seed("de-vi");
    renderRouter("./src/app", { initialUrl: `/story/${story!.id}` });
    await waitFor(() => expect(screen.getByTestId("story-device-voice-hint")).toBeOnTheScreen());
    expect(screen.getByTestId("story-device-voice-hint")).toHaveTextContent(/German voice in (Android settings|iOS Settings)/);
    expect(screen.queryByTestId("story-play")).toBeNull();
    expect(screen.queryByTestId("story-device-voice-label")).toBeNull();
    expect(screen.getByTestId("story-text")).toBeOnTheScreen();
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  test("a listed voice that cannot speak (data not downloaded) turns into the install hint", async () => {
    Speech.getAvailableVoicesAsync.mockImplementation(async () => [
      { identifier: "de-de-x-nfh-local", name: "de-de-x-nfh-local", language: "de-DE", quality: "Default" },
    ]);
    seed("de-vi");
    renderRouter("./src/app", { initialUrl: `/story/${story!.id}` });
    await waitFor(() => expect(screen.getByTestId("story-play")).toBeOnTheScreen());
    await userEvent.press(screen.getByTestId("story-play"));
    const options = Speech.speak.mock.calls[0][1] as SpeakOptions & { onError?: (e: Error) => void };
    act(() => options.onError?.(new Error("synthesis failed")));
    await waitFor(() => expect(screen.getByTestId("story-device-voice-hint")).toBeOnTheScreen());
    expect(screen.queryByTestId("story-play")).toBeNull();
  });

  test("a voice-lookup failure is the no-voice state, never a crash", async () => {
    Speech.getAvailableVoicesAsync.mockImplementation(async () => {
      throw new Error("TTS engine failed to initialise");
    });
    seed("de-vi");
    renderRouter("./src/app", { initialUrl: `/story/${story!.id}` });
    await waitFor(() => expect(screen.getByTestId("story-device-voice-hint")).toBeOnTheScreen());
  });
});
