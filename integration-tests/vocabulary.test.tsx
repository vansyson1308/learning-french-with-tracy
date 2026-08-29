/**
 * Vocabulary Browser through the real router (Phase 4 §95): access,
 * search (accents/apostrophes), filters, detail, memory indicators — and
 * the read-only guarantee that browsing never creates FSRS cards.
 * (The native SQLite loader fails fast under Jest and the screen falls
 * back to the generated repository — the same graceful path web uses.)
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

const chatCard = {
  due: Date.now() - 1000,
  stability: 3,
  difficulty: 5,
  scheduled_days: 3,
  learning_steps: 0,
  reps: 2,
  lapses: 0,
  state: "review" as const,
};

describe("Vocabulary Browser", () => {
  test("lists all 126 words with honest count and POS/gender rows", async () => {
    seedFrench();
    renderRouter("./src/app", { initialUrl: "/vocabulary" });
    await waitFor(() => expect(screen.getByText("126 words")).toBeOnTheScreen());
    expect(screen.getByText("l'homme")).toBeOnTheScreen();
    expect(screen.getByText("the man")).toBeOnTheScreen();
    expect(screen.getByText("Course order")).toBeOnTheScreen();
    // Frequency sort renders now that real Lexique 4 measurements exist,
    // and orders by raw per-million (être, population rank 1 at 35040.2/M,
    // is the most frequent taught word since Unit B landed).
    const frequencyChip = screen.getByText("Frequency");
    expect(frequencyChip).toBeOnTheScreen();
    await userEvent.press(frequencyChip);
    await waitFor(() => {
      const labels = screen
        .getAllByTestId("vocab-row-surface")
        .map((node) => node.props.children);
      expect(labels[0]).toBe("être");
    });
  });

  test("search handles accents and apostrophes; filters narrow the list", async () => {
    seedFrench();
    renderRouter("./src/app", { initialUrl: "/vocabulary" });
    await waitFor(() => expect(screen.getByText("126 words")).toBeOnTheScreen());

    const input = screen.getByLabelText("Search vocabulary");
    await userEvent.type(input, "garcon");
    await waitFor(() => expect(screen.getByText("1 word")).toBeOnTheScreen());
    expect(screen.getByText("le garçon")).toBeOnTheScreen();

    await userEvent.clear(input);
    await userEvent.type(input, "s'il");
    await waitFor(() => expect(screen.getByText("s'il vous plaît")).toBeOnTheScreen());

    await userEvent.clear(input);
    await waitFor(() => expect(screen.getByText("126 words")).toBeOnTheScreen());
    await userEvent.press(screen.getByText("Expressions"));
    await waitFor(() => expect(screen.getByText("3 words")).toBeOnTheScreen());
    expect(screen.getByText("au revoir")).toBeOnTheScreen();

    await userEvent.press(screen.getByText("Learned"));
    await waitFor(() => expect(screen.getByText("0 words")).toBeOnTheScreen());
  });

  test("detail shows lexical fields and honest not-learned memory status", async () => {
    seedFrench();
    renderRouter("./src/app", { initialUrl: "/vocabulary/fr%3Aw%3Aeau" });
    await waitFor(() => expect(screen.getByText("l'eau")).toBeOnTheScreen());
    expect(screen.getByText("the water")).toBeOnTheScreen();
    expect(screen.getByText("feminine noun")).toBeOnTheScreen();
    expect(screen.getByText("/o/")).toBeOnTheScreen();
    expect(screen.getByText("Dictionary form: eau")).toBeOnTheScreen();
    expect(screen.getByText("Je bois de l'eau.")).toBeOnTheScreen();
    expect(screen.getByText(/Not in your reviews yet/)).toBeOnTheScreen();
  });

  test("a learned word shows its memory strength and due state", async () => {
    seedFrench({
      courses: {
        "fr-en": {
          xp: 0,
          completedLessons: {},
          mistakes: [],
          wordStats: {},
          cards: { "fr:w:chat|recognize": chatCard },
          srsLegacy: {},
        },
      },
    });
    renderRouter("./src/app", { initialUrl: "/vocabulary/fr%3Aw%3Achat" });
    await waitFor(() => expect(screen.getByText("le chat")).toBeOnTheScreen());
    expect(screen.getByText(/In your reviews — memory strength \d+%/)).toBeOnTheScreen();
    expect(screen.getByText("Review due now.")).toBeOnTheScreen();
  });

  test("browsing and opening entries never creates cards (read-only)", async () => {
    seedFrench({
      courses: {
        "fr-en": {
          xp: 0,
          completedLessons: {},
          mistakes: [],
          wordStats: {},
          cards: {},
          srsLegacy: {},
        },
      },
    });
    renderRouter("./src/app", { initialUrl: "/vocabulary" });
    await waitFor(() => expect(screen.getByText("126 words")).toBeOnTheScreen());
    await userEvent.press(screen.getByLabelText("l'homme, the man"));
    renderRouter("./src/app", { initialUrl: "/vocabulary/fr%3Aw%3Ahomme" });
    await waitFor(() => expect(screen.getByText(/Not in your reviews yet/)).toBeOnTheScreen());
    expect(useProgress.getState().courses["fr-en"]?.cards).toEqual({});
    expect(useProgress.getState().reviewLog).toEqual([]);
  });
});
