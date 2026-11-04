/**
 * QC 2026-11-05 §2.1 through the real router tree: a course whose profile
 * sets `deviceVoiceScoredListening` grades its listening steps through the
 * installed local device voice when the clip has no bundled asset; with no
 * voice the step shows "no device voice" with the install hint, offers only
 * the skip, and the skip leaves no learning-memory trace. A course that does
 * not opt in keeps the P7 rule (no device voice, the audio-skip link).
 *
 * The French course stands in for the opted-in course: its profile is
 * re-registered with the flag and its clip assets are hidden, so the first
 * lesson's listening steps have no bundled audio.
 */
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import * as Speech from "expo-speech";
import React from "react";

import { __registerCourseProfileForTests, courseProfile } from "../src/lib/course-profile";
import { useProgress } from "../src/lib/store";

jest.dontMock("react-native-reanimated");

jest.mock("../src/lib/reception/content", () => {
  const actual = jest.requireActual("../src/lib/reception/content");
  return { ...actual, clipAudioSource: () => null };
});

const speak = Speech.speak as jest.Mock;
const voices = Speech.getAvailableVoicesAsync as jest.Mock;

function seed() {
  useProgress.setState({
    activeCourseId: "fr-en",
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

const real = courseProfile("fr-en");

beforeEach(() => {
  speak.mockClear();
  voices.mockReset();
  voices.mockImplementation(async () => []);
  seed();
});

afterEach(() => __registerCourseProfileForTests(null, "fr-en"));

describe("device-voice listening (QC 2026-11-05 §2.1)", () => {
  test("opted in, no device voice: notice + hint, no options, the skip leaves no trace", async () => {
    __registerCourseProfileForTests({ ...real, deviceVoiceScoredListening: true });
    const user = userEvent.setup();
    renderRouter("./src/app", { initialUrl: "/lesson/fr-en:uf-l0" });
    await waitFor(() => expect(screen.getByTestId("device-voice-missing")).toBeOnTheScreen());
    expect(screen.getByText("No French voice on this device yet")).toBeOnTheScreen();
    expect(screen.queryByText("the coffee")).toBeNull();
    expect(screen.queryByTestId("listening-play")).toBeNull();

    await user.press(screen.getByTestId("device-voice-skip"));
    await waitFor(() => expect(screen.getByText("Listen, then answer")).toBeOnTheScreen());
    expect(Object.keys(useProgress.getState().courses["fr-en"]?.cards ?? {})).toEqual([]);
    expect(useProgress.getState().reviewLog).toEqual([]);
    expect(speak).not.toHaveBeenCalled();
  });

  test("opted in, a local voice: the transcript is spoken and the answer is graded", async () => {
    __registerCourseProfileForTests({ ...real, deviceVoiceScoredListening: true });
    voices.mockImplementation(async () => [
      { identifier: "fr-fr-x-network", name: "fr-fr-x-network", language: "fr-FR" },
      { identifier: "fr-fr-x-local", name: "fr-fr-x-local", language: "fr-FR" },
    ]);
    const user = userEvent.setup();
    renderRouter("./src/app", { initialUrl: "/lesson/fr-en:uf-l0" });
    await waitFor(() => expect(screen.getByTestId("listening-device-voice-label")).toBeOnTheScreen());
    await user.press(screen.getByTestId("listening-play"));
    expect(speak).toHaveBeenCalledWith("le café", expect.objectContaining({ voice: "fr-fr-x-local", language: "fr-FR" }));

    await user.press(screen.getByText("the coffee"));
    await user.press(screen.getByText("Check"));
    await waitFor(() => expect(screen.getByTestId("clip-transcript")).toBeOnTheScreen());
  });

  test("a course that does not opt in never uses the device voice (P7 §25-26)", async () => {
    voices.mockImplementation(async () => [{ identifier: "fr-fr-x-local", name: "fr-fr-x-local", language: "fr-FR" }]);
    renderRouter("./src/app", { initialUrl: "/lesson/fr-en:uf-l0" });
    await waitFor(() => expect(screen.getByTestId("audio-unavailable")).toBeOnTheScreen());
    expect(screen.queryByTestId("device-voice-missing")).toBeNull();
    expect(screen.queryByTestId("listening-device-voice-label")).toBeNull();
    expect(voices).not.toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });
});
