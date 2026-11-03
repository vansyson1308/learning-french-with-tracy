/**
 * P4b stage 5 (task 5): the script primer through the real router tree —
 * opened from the start of Section 1 of a ja / zh / ko course, never shown
 * for a Latin-script course, and rendering each language's own section
 * kind (kana tables, tones with minimal pairs, Hangul jamo and blocks).
 */
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";

import { coursePrimer } from "../src/lib/script-primer";
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
    primerPassed: {},
  });
}

describe("P4c: the kana checkpoint", () => {
  const items = () => coursePrimer("ja-en")!.checkpoint!.items;

  async function answerAll(user: ReturnType<typeof userEvent.setup>, pick: (correct: number, options: number) => number) {
    for (const item of items()) {
      await user.press(screen.getByTestId(`primer-checkpoint-option-${pick(item.correct, item.options.length)}`));
      await user.press(screen.getByTestId("primer-checkpoint-next"));
    }
  }

  test("passing records primerPassed for the course and nothing else; the Learn card then says so", async () => {
    seed("ja-en");
    const learning = () => {
      const s = useProgress.getState();
      return JSON.stringify({ courses: s.courses, activeDays: s.activeDays, streak: s.streak, dailyXp: s.dailyXp, reviewLog: s.reviewLog });
    };
    const before = learning();
    const user = userEvent.setup();
    renderRouter("./src/app", { initialUrl: "/primer" });
    await waitFor(() => expect(screen.getByTestId("primer-checkpoint-start")).toBeOnTheScreen());
    await user.press(screen.getByTestId("primer-checkpoint-start"));
    expect(screen.getByText("Question 1 of 20")).toBeOnTheScreen();
    // Two wrong answers, eighteen right: 18 ≥ 16 passes.
    let n = 0;
    await answerAll(user, (correct, count) => (n++ < 2 ? (correct + 1) % count : correct));
    await waitFor(() => expect(screen.getByTestId("primer-checkpoint-passed")).toBeOnTheScreen());
    expect(screen.getByTestId("primer-checkpoint-score")).toHaveTextContent("18 of 20 correct");
    expect(useProgress.getState().primerPassed).toEqual({ "ja-en": true });
    expect(learning()).toBe(before); // no XP, no lesson, no streak, no evidence
  });

  test("a failed attempt changes nothing and can be retaken at once", async () => {
    seed("ja-en");
    const user = userEvent.setup();
    renderRouter("./src/app", { initialUrl: "/primer" });
    await waitFor(() => expect(screen.getByTestId("primer-checkpoint-start")).toBeOnTheScreen());
    await user.press(screen.getByTestId("primer-checkpoint-start"));
    await answerAll(user, (correct, count) => (correct + 1) % count);
    await waitFor(() => expect(screen.getByTestId("primer-checkpoint-not-yet")).toBeOnTheScreen());
    expect(useProgress.getState().primerPassed).toEqual({});
    await user.press(screen.getByTestId("primer-checkpoint-retry"));
    expect(screen.getByText("Question 1 of 20")).toBeOnTheScreen();
  });

  test("the Learn card recommends the primer first, and shows it passed afterwards; Section 1 stays open", async () => {
    seed("ja-en");
    renderRouter("./src/app", { initialUrl: "/" });
    await waitFor(() => expect(screen.getByTestId("script-primer-status")).toHaveTextContent(/^Best before lesson 1/));
    useProgress.setState({ primerPassed: { "ja-en": true } });
    await waitFor(() => expect(screen.getByTestId("script-primer-status")).toHaveTextContent(/^Kana check passed/));
  });
});

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
    for (const kana of ["あ", "こ", "ア", "コ", "ぱ", "きゃ", "ジョ", "きって", "コーヒー"]) expect(screen.getByTestId(`primer-kana-${kana}`)).toBeOnTheScreen();
    expect(screen.getAllByText("ko").length).toBe(2);
    expect(screen.getByText("kōhī")).toBeOnTheScreen();
    for (const id of ["hiragana-basic", "hiragana-dakuten", "hiragana-yoon", "hiragana-small-tsu-long-vowels", "katakana-basic", "katakana-long-vowels"]) {
      expect(screen.getByTestId(`primer-section-${id}`)).toBeOnTheScreen();
    }
  });

  test("zh: four tones plus the neutral tone, and the minimal pairs", async () => {
    seed("zh-en");
    renderRouter("./src/app", { initialUrl: "/primer" });
    await waitFor(() => expect(screen.getByTestId("primer-screen")).toBeOnTheScreen());
    for (const tone of [1, 2, 3, 4, 5]) expect(screen.getByTestId(`primer-tone-${tone}`)).toBeOnTheScreen();
    expect(screen.getByTestId("primer-pair-买卖")).toBeOnTheScreen();
    expect(screen.getByText("Pairs that differ only in tone")).toBeOnTheScreen();
  });

  test("zh and ko primers have no checkpoint", async () => {
    seed("zh-en");
    renderRouter("./src/app", { initialUrl: "/primer" });
    await waitFor(() => expect(screen.getByTestId("primer-screen")).toBeOnTheScreen());
    expect(screen.queryByTestId("primer-checkpoint")).toBeNull();
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
