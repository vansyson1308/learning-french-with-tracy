/**
 * Checkpoint speech pre-gate journeys (P8 §20/§22, §29 journey 8), rendered
 * through the real Expo Router tree with the controllable speech-provider
 * double from setup.js. NATIVE-MOCK coverage: this verifies the app's
 * gating logic, not real recognizer behavior (see the phase report's
 * device-validation ceiling).
 */
import { screen, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import React from "react";

import { useProgress } from "../src/lib/store";

// The setup.js double; mutated per test, restored in afterEach.
const speech = jest.requireMock("expo-speech-recognition") as {
  __speechState: {
    available: boolean;
    locales: string[];
    installedLocales: string[];
  };
};

const capableDefaults = {
  available: true,
  locales: ["fr-FR"],
  installedLocales: ["fr-FR"],
};

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
    assessment: { checkpointAttempts: [], placementFloor: 0 },
  } as never);
}

afterEach(() => {
  Object.assign(speech.__speechState, capableDefaults);
});

describe("spoken checkpoint pre-gate (§20)", () => {
  test("a device without speech recognition never starts the spoken checkpoint — and records nothing", async () => {
    seed();
    speech.__speechState.available = false;
    renderRouter("./src/app", { initialUrl: "/checkpoint/fr.checkpoint.section-4" });

    await waitFor(() =>
      expect(screen.getByTestId("checkpoint-speech-blocked")).toBeOnTheScreen()
    );
    // Honest wording, a way back, and no session behind it.
    expect(screen.getByText("This check needs speech recognition")).toBeOnTheScreen();
    expect(screen.getByText("Back")).toBeOnTheScreen();
    expect(screen.queryByTestId("speak-record")).toBeNull();
    // Nothing about the learner was inferred from the device state.
    expect(useProgress.getState().assessment.checkpointAttempts).toHaveLength(0);
  });

  test("a device without FRENCH recognition is equally blocked", async () => {
    seed();
    speech.__speechState.locales = ["en-US"];
    speech.__speechState.installedLocales = ["en-US"];
    renderRouter("./src/app", { initialUrl: "/checkpoint/fr.checkpoint.section-4" });
    await waitFor(() =>
      expect(screen.getByTestId("checkpoint-speech-blocked")).toBeOnTheScreen()
    );
  });

  test("a capable device starts the session — instruction visible, target NEVER shown (§20 no-leak)", async () => {
    seed();
    renderRouter("./src/app", { initialUrl: "/checkpoint/fr.checkpoint.section-4" });

    await waitFor(() =>
      expect(
        screen.getByText(
          "You walk into a restaurant at seven in the evening. Greet the waiter."
        )
      ).toBeOnTheScreen()
    );
    // Scored spoken production: the record control is live; the French
    // answer ("Bonsoir…") appears NOWHERE before an attempt is submitted.
    expect(screen.getByTestId("speak-record")).toBeOnTheScreen();
    expect(screen.queryByText(/Bonsoir/)).toBeNull();
    // And no model-audio affordance exists on a scored item.
    expect(screen.queryByText(/model/i)).toBeNull();
  });

  test("a checkpoint without spoken items renders immediately, no probe gate", async () => {
    seed();
    speech.__speechState.available = false; // irrelevant for a written check
    renderRouter("./src/app", { initialUrl: "/checkpoint/fr.checkpoint.section-1" });
    await waitFor(() =>
      expect(
        screen.getByText("You arrive at a restaurant at 8 pm. What do you say?")
      ).toBeOnTheScreen()
    );
    expect(screen.queryByTestId("checkpoint-speech-blocked")).toBeNull();
  });
});
