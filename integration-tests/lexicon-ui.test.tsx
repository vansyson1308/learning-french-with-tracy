/**
 * Phase-4 UI enrichment under the real component tree: the enriched
 * TeachCard and the PostAnswerPanel, rendered directly with RNTL.
 */
import { render, screen, userEvent } from "@testing-library/react-native";
import React from "react";

import { PostAnswerPanel } from "../src/components/session/post-answer-panel";
import { TeachCard } from "../src/components/session/teach-card";
import { lexemeMetaFor } from "../src/lib/learning/lexicon-index";

describe("PostAnswerPanel", () => {
  test("shows compact lexical feedback with a More disclosure", async () => {
    render(<PostAnswerPanel itemId="fr:w:chat" correct />);
    expect(screen.getByText("le chat")).toBeOnTheScreen();
    expect(screen.getByText("the cat")).toBeOnTheScreen();
    expect(screen.getByText("/ʃa/")).toBeOnTheScreen();
    expect(screen.getByText("masculine noun")).toBeOnTheScreen();
    expect(screen.getByText("Le chat boit du lait.")).toBeOnTheScreen();
    expect(screen.getByText("The cat is drinking milk.")).toBeOnTheScreen();
    // Expanded fields hidden until requested; Continue stays uncluttered.
    expect(screen.queryByText(/Dictionary form/)).toBeNull();
    await userEvent.press(screen.getByLabelText("More word details"));
    expect(screen.getByText(/Dictionary form: chat · noun · topic: animals/)).toBeOnTheScreen();
  });

  test("elided-article noun teaches its gender", () => {
    render(<PostAnswerPanel itemId="fr:w:eau" correct={false} />);
    expect(screen.getByText("l'eau")).toBeOnTheScreen();
    expect(screen.getByText("feminine noun (l')")).toBeOnTheScreen();
  });

  test("renders nothing for an item without a lexicon entry", () => {
    render(<PostAnswerPanel itemId="fr:w:ghost" correct />);
    expect(screen.toJSON()).toBeNull();
  });
});

describe("TeachCard enrichment", () => {
  const word = { target: "l'eau", native: "the water", emoji: "💧" };

  test("shows pronunciation, gender cue and example when metadata exists", () => {
    render(<TeachCard word={word} courseId="fr-en" meta={lexemeMetaFor("fr:w:eau")} />);
    expect(screen.getByText("l'eau")).toBeOnTheScreen();
    expect(screen.getByText("the water")).toBeOnTheScreen();
    expect(screen.getByText("/o/")).toBeOnTheScreen();
    expect(screen.getByText("feminine noun")).toBeOnTheScreen();
    expect(screen.getByText("Je bois de l'eau.")).toBeOnTheScreen();
    expect(screen.getByText("I am drinking water.")).toBeOnTheScreen();
  });

  test("degrades to the Phase-3 card when metadata is absent", () => {
    render(<TeachCard word={{ target: "el gato", native: "the cat", emoji: "🐈" }} courseId="es-en" />);
    expect(screen.getByText("el gato")).toBeOnTheScreen();
    expect(screen.getByText("the cat")).toBeOnTheScreen();
    expect(screen.queryByText(/noun/)).toBeNull();
    expect(screen.queryByText(/\//)).toBeNull();
  });
});
