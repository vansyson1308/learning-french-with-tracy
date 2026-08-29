/**
 * Checkpoint speech pre-gate journeys (P8 §20/§22, §29 journey 8), rendered
 * through the real Expo Router tree with the controllable speech-provider
 * double from setup.js. NATIVE-MOCK coverage: this verifies the app's
 * gating logic, not real recognizer behavior (see the phase report's
 * device-validation ceiling).
 */
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import React from "react";

import { useProgress } from "../src/lib/store";

// The setup.js double; mutated per test, restored in afterEach.
const speech = jest.requireMock("expo-speech-recognition") as {
  __speechState: {
    available: boolean;
    onDevice: boolean;
    locales: string[];
    installedLocales: string[];
    permission: { granted: boolean; status: string; canAskAgain: boolean };
  };
};

const capableDefaults = {
  available: true,
  onDevice: true,
  locales: ["fr-FR"],
  installedLocales: ["fr-FR"],
  permission: { granted: true, status: "granted", canAskAgain: true },
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
    speechNoticeAckAt: null,
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

describe("preflight permission + disclosure UX (P9 §7/§8)", () => {
  test("undetermined permission: the check explains the microphone BEFORE starting, then a grant proceeds", async () => {
    seed();
    speech.__speechState.permission = {
      granted: false,
      status: "undetermined",
      canAskAgain: true,
    };
    renderRouter("./src/app", { initialUrl: "/checkpoint/fr.checkpoint.section-4" });
    await waitFor(() =>
      expect(screen.getByTestId("checkpoint-speech-permission")).toBeOnTheScreen()
    );
    // No scored session exists yet — nothing to discover mid-checkpoint.
    expect(screen.queryByTestId("speak-record")).toBeNull();
    expect(screen.getByText("Back")).toBeOnTheScreen();

    // Point-of-use request: the OS grants → the check starts.
    speech.__speechState.permission = { granted: true, status: "granted", canAskAgain: true };
    const user = userEvent.setup();
    await user.press(screen.getByText("Allow microphone"));
    await waitFor(() =>
      expect(
        screen.getByText(
          "You walk into a restaurant at seven in the evening. Greet the waiter."
        )
      ).toBeOnTheScreen()
    );
  });

  test("denied permission: blocked with Settings + Back, no attempt created", async () => {
    seed();
    speech.__speechState.permission = { granted: false, status: "denied", canAskAgain: false };
    renderRouter("./src/app", { initialUrl: "/checkpoint/fr.checkpoint.section-4" });
    await waitFor(() =>
      expect(
        screen.getByTestId("checkpoint-speech-permission-blocked")
      ).toBeOnTheScreen()
    );
    expect(screen.getByText("Open Settings")).toBeOnTheScreen();
    expect(screen.getByText("Back")).toBeOnTheScreen();
    expect(useProgress.getState().assessment.checkpointAttempts).toHaveLength(0);
  });

  test("network-possible device: the §7 disclosure gates the scored start, once", async () => {
    seed();
    speech.__speechState.onDevice = false; // no proven offline model → network possible
    renderRouter("./src/app", { initialUrl: "/checkpoint/fr.checkpoint.section-4" });
    await waitFor(() =>
      expect(screen.getByTestId("checkpoint-speech-disclosure")).toBeOnTheScreen()
    );
    const user = userEvent.setup();
    await user.press(screen.getByText("Got it — start the check"));
    await waitFor(() =>
      expect(
        screen.getByText(
          "You walk into a restaurant at seven in the evening. Greet the waiter."
        )
      ).toBeOnTheScreen()
    );
    // Acknowledgement persisted — the notice never nags again.
    expect(useProgress.getState().speechNoticeAckAt).not.toBeNull();
  });

  test("an acknowledged learner goes straight in on a network-possible device", async () => {
    seed();
    useProgress.setState({ speechNoticeAckAt: 123 } as never);
    speech.__speechState.onDevice = false;
    renderRouter("./src/app", { initialUrl: "/checkpoint/fr.checkpoint.section-4" });
    await waitFor(() =>
      expect(
        screen.getByText(
          "You walk into a restaurant at seven in the evening. Greet the waiter."
        )
      ).toBeOnTheScreen()
    );
    expect(screen.queryByTestId("checkpoint-speech-disclosure")).toBeNull();
  });
});
