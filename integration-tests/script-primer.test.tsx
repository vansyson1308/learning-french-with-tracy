/**
 * P4b stage 5 (task 5): the script primer through the real router tree —
 * opened from the start of Section 1 of a ja / zh / ko course, never shown
 * for a Latin-script course, and rendering each language's own section
 * kind (kana tables, tones with minimal pairs, Hangul jamo and blocks).
 */
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";

import { useProgress } from "../src/lib/store";

// See reception.test.tsx: cancel expo-router/testing-library's reanimated mock.
jest.dontMock("react-native-reanimated");

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

describe("Section 1 entry", () => {
  test("a ja course opens its primer from Section 1", async () => {
    seed("ja-en");
    const user = userEvent.setup();
    renderRouter("./src/app", { initialUrl: "/" });
    await waitFor(() => expect(screen.getByTestId("script-primer-entry")).toBeOnTheScreen());
    await user.press(screen.getByTestId("script-primer-entry"));
    await waitFor(() => expect(screen.getByTestId("primer-screen")).toBeOnTheScreen());
    expect(screen.getByText("Getting started with kana")).toBeOnTheScreen();
  });

  test("a Latin-script course shows no primer entry", async () => {
    seed("fr-en");
    renderRouter("./src/app", { initialUrl: "/" });
    await waitFor(() => expect(screen.getAllByTestId(/^learn-section-/).length).toBeGreaterThan(0));
    expect(screen.queryByTestId("script-primer-entry")).toBeNull();
  });
});

describe("primer screen", () => {
  test("ja: hiragana and katakana tables with rōmaji, the review note and course-native (English) text", async () => {
    seed("ja-en");
    renderRouter("./src/app", { initialUrl: "/primer" });
    await waitFor(() => expect(screen.getByTestId("primer-screen")).toBeOnTheScreen());
    expect(screen.getByTestId("primer-review-note")).toBeOnTheScreen();
    for (const kana of ["あ", "こ", "ア", "コ"]) expect(screen.getByTestId(`primer-kana-${kana}`)).toBeOnTheScreen();
    expect(screen.getAllByText("ko").length).toBe(2);
    expect(screen.getByTestId("primer-section-hiragana-a-k")).toBeOnTheScreen();
  });

  test("zh: four tones plus the neutral tone, and the minimal pairs", async () => {
    seed("zh-en");
    renderRouter("./src/app", { initialUrl: "/primer" });
    await waitFor(() => expect(screen.getByTestId("primer-screen")).toBeOnTheScreen());
    for (const tone of [1, 2, 3, 4, 5]) expect(screen.getByTestId(`primer-tone-${tone}`)).toBeOnTheScreen();
    expect(screen.getByTestId("primer-pair-买卖")).toBeOnTheScreen();
    expect(screen.getByText("Pairs that differ only in tone")).toBeOnTheScreen();
  });

  test("ko: 14 consonants, 10 vowels and the blocks with their RR", async () => {
    seed("ko-en");
    renderRouter("./src/app", { initialUrl: "/primer" });
    await waitFor(() => expect(screen.getByTestId("primer-screen")).toBeOnTheScreen());
    expect(screen.getAllByTestId(/^primer-jamo-/)).toHaveLength(24);
    expect(screen.getByTestId("primer-block-한")).toBeOnTheScreen();
    expect(screen.getByText("ㅎ + ㅏ + ㄴ = 한")).toBeOnTheScreen();
  });
});
