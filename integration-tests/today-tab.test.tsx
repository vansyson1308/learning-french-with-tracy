/**
 * Integration spike (§75-76): the TODAY surface rendered through the real
 * Expo Router tree. Behavior-level assertions only — no snapshots.
 */
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import React from "react";

import { useProgress } from "../src/lib/store";

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

describe("TODAY tab visibility and preview", () => {
  // Tab-bar assertions run from /today and /practice: the Learn screen's
  // reanimated bobbing animation can't render under Jest (worklets-native
  // dependency — documented spike limitation; the browser E2E covers "/").
  test("French sees the Today tab; the preview renders from the real plan", async () => {
    seedFrench();
    renderRouter("./src/app", { initialUrl: "/today" });
    await waitFor(() => expect(screen.getByText("Your session")).toBeOnTheScreen());
    // The real tab bar rendered by the real layout (heading + tab label
    // both say Today, hence getAllByText):
    expect(screen.getAllByText("Today").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Learn").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Practice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Profile").length).toBeGreaterThanOrEqual(1);
    // Fresh learner: new material from the PATH frontier, zero reviews.
    expect(screen.getByLabelText("0 reviews")).toBeOnTheScreen();
    expect(screen.getByLabelText("5 new words")).toBeOnTheScreen();
    expect(screen.getByText("Start today's session")).toBeOnTheScreen();
  });

  test("preset selection updates the composed preview", async () => {
    seedFrench();
    renderRouter("./src/app", { initialUrl: "/today" });
    await waitFor(() => expect(screen.getByText("Your session")).toBeOnTheScreen());

    await userEvent.press(screen.getByLabelText("5 minute session"));
    await waitFor(() => expect(screen.getByLabelText("3 new words")).toBeOnTheScreen());
  });

  test("non-French course does not get a Today tab", async () => {
    seedFrench({ activeCourseId: "es-en" });
    renderRouter("./src/app", { initialUrl: "/practice" });
    await waitFor(() =>
      expect(screen.getAllByText("Learn").length).toBeGreaterThanOrEqual(1)
    );
    expect(screen.queryByText("Today")).toBeNull();
    expect(screen.getAllByText("Practice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Profile").length).toBeGreaterThanOrEqual(1);
  });

  test("caught-up state renders when nothing is due or new", async () => {
    const all: Record<string, true> = {};
    const pack = require("../src/content/packs/fr-en.json");
    for (const s of pack.sections)
      for (const u of s.units)
        for (const l of u.lessons) all[l.id] = true;
    seedFrench({
      courses: {
        "fr-en": {
          xp: 0,
          completedLessons: all,
          mistakes: [],
          wordStats: {},
          cards: {},
          srsLegacy: {},
        },
      },
    });
    renderRouter("./src/app", { initialUrl: "/today" });
    await waitFor(() =>
      expect(screen.getByText("You're caught up for now.")).toBeOnTheScreen()
    );
  });
});
