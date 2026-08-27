/**
 * ConceptCard under the real component tree (Phase 5B): renders the
 * compiled authored concept — title, short rule, examples, exceptions,
 * memory hint — and fails soft on a dangling id.
 */
import { render, screen } from "@testing-library/react-native";
import React from "react";

import { ConceptCard } from "../src/components/session/concept-card";

describe("ConceptCard", () => {
  test("renders the authored gender concept from the compiled artifact", () => {
    render(<ConceptCard conceptId="fr:concept:gender-two-classes" />);
    expect(screen.getByText("Every French noun has a gender")).toBeOnTheScreen();
    expect(
      screen.getByText("Every noun is masculine (le) or feminine (la) — the article is part of the word.")
    ).toBeOnTheScreen();
    expect(screen.getByText("le chat")).toBeOnTheScreen();
    expect(screen.getByText("the cat")).toBeOnTheScreen();
    expect(screen.getByText("l'eau")).toBeOnTheScreen();
    expect(screen.getByText("Watch out")).toBeOnTheScreen();
    expect(screen.getByText(/une eau minérale/)).toBeOnTheScreen();
    expect(screen.getByText(/Always learn 'le chat', never just 'chat'/)).toBeOnTheScreen();
  });

  test("fails soft (renders nothing) for an unknown concept id", () => {
    render(<ConceptCard conceptId="fr:concept:ghost" />);
    expect(screen.toJSON()).toBeNull();
  });
});
