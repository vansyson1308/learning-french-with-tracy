/**
 * Reception surfaces through the real router tree (P7 §152). Behavior only:
 * the listening step's affordances, learning-mode transcript reveal, the
 * audio-unavailable escape leaving no learning-memory trace, and the
 * Practice tab's listening review card.
 */
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import React from "react";

import { useProgress } from "../src/lib/store";

// expo-router/testing-library registers its own reanimated jest.mock whose
// factory falls back to an EMPTY module when the official mock cannot load
// (worklets) — which would break every screen that imports reanimated.
// dontMock is NOT hoisted, so placed after that import it cancels their
// registration and resolution falls back to jest.config's moduleNameMapper
// (the project's hand-rolled mock) for the route trees rendered below.
jest.dontMock("react-native-reanimated");

function seedFrench(extra: Record<string, unknown> = {}) {
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
    ...extra,
  });
}

describe("listening lesson steps (P7 §66-71)", () => {
  test("LC step: player + options; answering reveals the transcript (learning mode)", async () => {
    seedFrench();
    const user = userEvent.setup();
    renderRouter("./src/app", { initialUrl: "/lesson/fr-en:uf-l0" });

    // First step of Premiers sons: listeningComprehension over le café.
    await waitFor(() => expect(screen.getByText("Listen, then answer")).toBeOnTheScreen());
    expect(screen.getByTestId("listening-player")).toBeOnTheScreen();
    expect(screen.getByTestId("listening-play")).toBeOnTheScreen();
    // Learning mode: unlimited plays (no budget pill), slow mode available.
    expect(screen.queryByTestId("plays-left")).toBeNull();
    expect(screen.getByTestId("rate-toggle")).toBeOnTheScreen();
    // The transcript is NEVER shown before answering (§67).
    expect(screen.queryByTestId("clip-transcript")).toBeNull();

    await user.press(screen.getByText("the coffee"));
    await user.press(screen.getByText("Check"));
    // Full-feedback mode reveals what was heard, after the answer (§71) —
    // the transcript line plus the post-answer panel may both show it.
    await waitFor(() => expect(screen.getByTestId("clip-transcript")).toBeOnTheScreen());
    expect(screen.getAllByText("le café").length).toBeGreaterThanOrEqual(1);
  });

  test("audio-unavailable skip advances without touching learning memory (§69-70)", async () => {
    seedFrench();
    const user = userEvent.setup();
    renderRouter("./src/app", { initialUrl: "/lesson/fr-en:uf-l0" });
    await waitFor(() => expect(screen.getByTestId("audio-unavailable")).toBeOnTheScreen());

    await user.press(screen.getByTestId("audio-unavailable"));
    // Advanced to the next step (another LC in this lesson).
    await waitFor(() => expect(screen.getByText("Listen, then answer")).toBeOnTheScreen());
    // No card, no stat, no log entry was created by the skip.
    const course = useProgress.getState().courses["fr-en"];
    expect(Object.keys(course?.cards ?? {})).toEqual([]);
    expect(useProgress.getState().reviewLog).toEqual([]);
  });
});

describe("practice tab listening review (P7 §79-81)", () => {
  test("French shows the listening card; zero due disables it honestly", async () => {
    seedFrench();
    renderRouter("./src/app", { initialUrl: "/practice" });
    await waitFor(() => expect(screen.getByText("Listening review")).toBeOnTheScreen());
    expect(
      screen.getByText("No listening due right now. Meet words by ear in Section 3!")
    ).toBeOnTheScreen();
  });

  test("a due listen card with a bundled clip surfaces a real count", async () => {
    seedFrench({
      courses: {
        "fr-en": {
          xp: 0,
          completedLessons: {},
          mistakes: [],
          wordStats: {},
          srs: {},
          cards: {
            // Due immediately: a REAL new-card state from the adapter.
            "fr:w:train|listen": require("../src/lib/learning/fsrs-adapter").fsrsScheduler.initialCard(
              Date.now() - 1000
            ),
          },
        },
      },
    });
    renderRouter("./src/app", { initialUrl: "/practice" });
    await waitFor(() =>
      expect(screen.getByText("1 word to recognize by ear.")).toBeOnTheScreen()
    );
  });
});
