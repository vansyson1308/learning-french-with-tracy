/**
 * Goals screen behavior (§154): honest overall-level line, evidence-state
 * grouping ("not assessed" ≠ "needs practice", §93), placement estimates
 * marked as estimates, and the reset-starting-point flow (§86).
 */
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import React from "react";

import { emptyAssessmentState } from "../src/lib/assessment/types";
import { useProgress } from "../src/lib/store";

// Confirm dialogs go through Alert on native; auto-accept the reset.
jest.spyOn(require("react-native").Alert, "alert").mockImplementation(
  (...args: unknown[]) => {
    const buttons = args[2] as { text: string; onPress?: () => void }[] | undefined;
    buttons?.find((b) => b.text === "Reset")?.onPress?.();
  }
);

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
    assessment: emptyAssessmentState(),
    ...extra,
  });
}

const PLACEMENT_RESULT = {
  placementVersion: 1,
  completedAt: 1_700_000_000_000,
  recommendedLessonId: "fr-en:ua-l0",
  recommendedFloorIndex: 20,
  objectiveEstimates: [
    { objectiveId: "fr.obj.vocab.everyday_basics", estimate: "comfortable" as const },
    { objectiveId: "fr.obj.greetings.basic", estimate: "gap" as const },
  ],
  itemResults: [],
};

describe("goals screen (§90-97)", () => {
  test("fresh learner: overall level not assessed; goals not started; no verdict groups", async () => {
    seedFrench();
    renderRouter("./src/app", { initialUrl: "/goals" });
    await waitFor(() => expect(screen.getByText("Your French goals")).toBeOnTheScreen());
    expect(screen.getByText("Overall CEFR level")).toBeOnTheScreen();
    expect(screen.getByText("Not assessed yet")).toBeOnTheScreen();
    expect(screen.getByTestId("goal-group-not_started")).toBeOnTheScreen();
    expect(screen.queryByTestId("goal-group-demonstrated")).toBeNull();
    expect(screen.queryByTestId("goal-group-needs_practice")).toBeNull();
    expect(screen.getByText("Find your starting point")).toBeOnTheScreen();
  });

  test("placement: comfortable goals show as ESTIMATES; gaps never do (§40)", async () => {
    seedFrench({
      assessment: {
        checkpointAttempts: [],
        placement: PLACEMENT_RESULT,
        placementFloor: 20,
      },
    });
    renderRouter("./src/app", { initialUrl: "/goals" });
    await waitFor(() => expect(screen.getByText("Your French goals")).toBeOnTheScreen());
    const estimated = screen.getByTestId("goal-group-estimated");
    expect(estimated).toHaveTextContent(/Core everyday nouns/);
    // The greetings "gap" estimate must NOT appear as needs_practice —
    // placement never issues verdicts (§40).
    expect(screen.queryByTestId("goal-group-needs_practice")).toBeNull();
    expect(screen.getByText(/Starting from Gender & Articles/)).toBeOnTheScreen();
  });

  test("checkpoint verdicts beat estimates; thin evidence is not 'needs practice' (§93)", async () => {
    seedFrench({
      assessment: {
        placement: PLACEMENT_RESULT,
        placementFloor: 0,
        checkpointAttempts: [
          {
            checkpointId: "fr.checkpoint.section-1",
            checkpointVersion: 1,
            startedAt: 1,
            completedAt: 2,
            itemResults: [],
            objectiveResults: [
              { objectiveId: "fr.obj.greetings.basic", result: "demonstrated", correct: 3, total: 3 },
              { objectiveId: "fr.obj.numbers.0_100", result: "needs_practice", correct: 1, total: 3 },
              { objectiveId: "fr.obj.connected.elision", result: "insufficient_evidence", correct: 1, total: 1 },
            ],
            overallCorrectShare: 0.6,
          },
        ],
      },
    });
    renderRouter("./src/app", { initialUrl: "/goals" });
    await waitFor(() => expect(screen.getByText("Your French goals")).toBeOnTheScreen());
    expect(screen.getByTestId("goal-group-demonstrated")).toHaveTextContent(
      /Everyday greetings & politeness/
    );
    expect(screen.getByTestId("goal-group-needs_practice")).toHaveTextContent(/Numbers 0-100/);
    // Thin evidence stays out of the practice group (§93).
    expect(screen.getByTestId("goal-group-needs_practice")).not.toHaveTextContent(
      /Elision in writing/
    );
    // Overall level stays honest even with demonstrated goals (§94).
    expect(screen.getByText("Not assessed yet")).toBeOnTheScreen();
  });

  test("reset starting point clears the floor and keeps the record (§86)", async () => {
    seedFrench({
      assessment: {
        checkpointAttempts: [],
        placement: PLACEMENT_RESULT,
        placementFloor: 20,
      },
    });
    renderRouter("./src/app", { initialUrl: "/goals" });
    await waitFor(() => expect(screen.getByTestId("reset-floor")).toBeOnTheScreen());
    await userEvent.press(screen.getByTestId("reset-floor"));
    await waitFor(() => {
      expect(useProgress.getState().assessment.placementFloor).toBe(0);
    });
    expect(useProgress.getState().assessment.placement?.completedAt).toBe(
      PLACEMENT_RESULT.completedAt
    );
    // The screen reflects the reset: back to "from the beginning".
    await waitFor(() =>
      expect(screen.getByText("Starting from the beginning.")).toBeOnTheScreen()
    );
  });
});
