/**
 * P5b graded stories through the real Expo Router tree: the Practice entry,
 * the list with its suggestion, and the reader (translation, tap-to-gloss,
 * questions, word check offer). Behavior-level assertions only.
 */
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import React from "react";

import { useProgress } from "../src/lib/store";

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
    expect(screen.getByTestId("story-no-audio")).toBeOnTheScreen(); // no bundled audio yet: text only

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
