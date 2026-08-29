/**
 * Interaction scenario renderer (P9 §24-§37, test program §80): the REAL
 * machine + adapter + attempt hook + SpeakRecordControl drive a fixture
 * scenario against the mocked speech provider, verifying GENUINE
 * CONTINGENCY end to end in JS — the recognized meaning decides the
 * partner's next turn, misses route through authored repair without
 * erasing the first judgment, support moves never fail the learner, and
 * scored mode hides the partner's French text.
 *
 * Honesty note (§6): the recognition PROVIDER is mocked — real-device
 * recognizer behavior remains the outstanding hardware gate.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

import { InteractionScenarioStep } from "@/components/exercises/interaction-scenario";
import type { Answer, InteractionAnswer, Status } from "@/lib/grading";
import type { InteractionScenario } from "@/lib/interaction/machine";
import { useSpeechSession, type SpeechExerciseContext } from "@/lib/speech/use-speech-session";
import type { InteractionScenarioExercise } from "@/lib/types";

import * as speechRecognitionModule from "expo-speech-recognition";

const provider = speechRecognitionModule as unknown as {
  __speechState: {
    available: boolean;
    permission: { granted: boolean; status: string; canAskAgain?: boolean };
    installedLocales: string[];
    startCalls: Record<string, unknown>[];
  };
  __emitSpeechEvent: (name: string, payload?: unknown) => void;
};

const cafe: InteractionScenario = {
  id: "fr.scenario.test_cafe",
  title: "At the café",
  goal: "Order a coffee and finish the exchange politely",
  taskFamily: "transaction",
  objectiveRefs: [],
  startNodeId: "p1",
  nodes: {
    p1: {
      kind: "partner",
      id: "p1",
      text: "Bonjour ! Vous désirez ?",
      clipId: "fr.clip.fx_greet",
      rephraseText: "Vous voulez boire quoi ?",
      rephraseClipId: "fr.clip.fx_greet_simple",
      next: "l1",
    },
    l1: {
      kind: "learner",
      id: "l1",
      prompt: "Order a coffee.",
      expected: [
        {
          intent: "order_coffee",
          acceptedVariants: ["je voudrais un café", "un café s'il vous plaît"],
          next: "p2",
        },
      ],
      noMatchNext: "r1",
      scored: true,
    },
    r1: {
      kind: "partner",
      id: "r1",
      text: "Pardon ? Vous voulez boire quelque chose ?",
      clipId: "fr.clip.fx_repair",
      next: "l1",
    },
    p2: {
      kind: "partner",
      id: "p2",
      text: "Voilà ! Autre chose ?",
      clipId: "fr.clip.fx_anything_else",
      next: "l2",
    },
    l2: {
      kind: "learner",
      id: "l2",
      prompt: "Say no thank you.",
      expected: [
        { intent: "decline", acceptedVariants: ["non merci"], next: "t1" },
      ],
      noMatchNext: "r2",
      scored: true,
    },
    r2: {
      kind: "partner",
      id: "r2",
      text: "Vous voulez autre chose ?",
      clipId: "fr.clip.fx_repair2",
      next: "l2",
    },
    t1: {
      kind: "terminal",
      id: "t1",
      outcome: "goal_met",
      text: "Merci, bonne journée !",
      clipId: "fr.clip.fx_bye",
    },
  },
  support: { allowRepeat: true, allowRephrase: true },
  reserved: false,
};

jest.mock("@/lib/interaction/content", () => ({
  interactionScenarioFor: (id: string) =>
    id === "fr.scenario.test_cafe" ? cafe : null,
  interactionPracticeScenarios: () => [cafe],
}));

const exercise: InteractionScenarioExercise = {
  type: "interactionScenario",
  id: "ix-test-1",
  scenarioId: "fr.scenario.test_cafe",
};

function Harness({
  scored,
  status = "none",
  onResult,
  onSkip,
}: {
  scored: boolean;
  status?: Status;
  onResult?: (a: InteractionAnswer) => void;
  onSkip?: () => void;
}) {
  const session = useSpeechSession(true);
  const [answer, setAnswer] = React.useState<Answer>(null);
  const speech: SpeechExerciseContext = { scored, session, onSpeechSkip: onSkip };
  const handleAnswer = (value: InteractionAnswer) => {
    setAnswer(value);
    onResult?.(value);
  };
  return (
    <InteractionScenarioStep
      exercise={exercise}
      answer={answer}
      status={status}
      speech={speech}
      onAnswer={handleAnswer}
    />
  );
}

async function speakOnce(finalTranscript: string) {
  await waitFor(() => expect(screen.getByTestId("speak-record")).toBeTruthy());
  fireEvent.press(screen.getByTestId("speak-record"));
  act(() => {
    provider.__emitSpeechEvent("start", null);
  });
  act(() => {
    provider.__emitSpeechEvent("result", {
      isFinal: true,
      results: [{ transcript: finalTranscript }],
    });
    provider.__emitSpeechEvent("end", null);
  });
}

async function failAttemptSilently() {
  await waitFor(() => expect(screen.getByTestId("speak-record")).toBeTruthy());
  fireEvent.press(screen.getByTestId("speak-record"));
  act(() => {
    provider.__emitSpeechEvent("start", null);
  });
  act(() => {
    provider.__emitSpeechEvent("error", { error: "no-speech", message: "" });
    provider.__emitSpeechEvent("end", null);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  provider.__speechState.available = true;
  provider.__speechState.permission = { granted: true, status: "granted", canAskAgain: true };
  provider.__speechState.installedLocales = ["fr-FR"];
  provider.__speechState.startCalls.length = 0;
});

describe("genuine contingency (§26-§28)", () => {
  test("a clean run: matched intents branch the partner, terminal submits a first-try pass", async () => {
    const results: InteractionAnswer[] = [];
    render(<Harness scored={false} onResult={(a) => results.push(a)} />);

    // The partner opened the conversation; the first learner turn is live.
    await waitFor(() => expect(screen.getByTestId("interaction-prompt")).toBeTruthy());
    expect(screen.getByText("Bonjour ! Vous désirez ?")).toBeTruthy();
    expect(screen.getByText("Order a coffee.")).toBeTruthy();

    await speakOnce("je voudrais un café");
    // Contingency: the order routed to "anything else", not the repair.
    await waitFor(() => expect(screen.getByText("Voilà ! Autre chose ?")).toBeTruthy());
    expect(screen.queryByText("Pardon ? Vous voulez boire quelque chose ?")).toBeNull();
    expect(screen.getByText("Say no thank you.")).toBeTruthy();

    await speakOnce("non merci");
    await waitFor(() => expect(screen.getByTestId("interaction-finished")).toBeTruthy());
    expect(screen.getByText("Merci, bonne journée !")).toBeTruthy();

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      interaction: true,
      goalMet: true,
      passedFirstTry: true,
      scoredTurns: 2,
      matchedFirstTry: 2,
      supportUsed: 0,
      repairMoves: 0,
      technicallyIncomplete: false,
    });
  });

  test("a miss routes through the authored repair and the first judgment stands (§37)", async () => {
    const results: InteractionAnswer[] = [];
    render(<Harness scored={false} onResult={(a) => results.push(a)} />);
    await waitFor(() => expect(screen.getByTestId("interaction-prompt")).toBeTruthy());

    await speakOnce("bonjour madame");
    // The repair branch answered — the conversation stays alive.
    await waitFor(() =>
      expect(screen.getByText("Pardon ? Vous voulez boire quelque chose ?")).toBeTruthy()
    );
    // Recovery matches now, but the scored node's first judgment is a miss.
    await speakOnce("je voudrais un café");
    await waitFor(() => expect(screen.getByText("Voilà ! Autre chose ?")).toBeTruthy());
    await speakOnce("non merci");
    await waitFor(() => expect(screen.getByTestId("interaction-finished")).toBeTruthy());

    expect(results[0]).toMatchObject({
      goalMet: true,
      passedFirstTry: false,
      matchedFirstTry: 1,
      repairMoves: 1,
    });
    // Learner turns are transcribed honestly, misses included.
    expect(screen.getByText("“bonjour madame”")).toBeTruthy();
  });

  test("silence is never judged (§71): the learner retries and still passes first-try", async () => {
    const results: InteractionAnswer[] = [];
    render(<Harness scored={false} onResult={(a) => results.push(a)} />);
    await waitFor(() => expect(screen.getByTestId("interaction-prompt")).toBeTruthy());

    await failAttemptSilently();
    // No repair, no judgment — the same turn is simply still open.
    expect(screen.queryByText("Pardon ? Vous voulez boire quelque chose ?")).toBeNull();
    await speakOnce("je voudrais un café");
    await waitFor(() => expect(screen.getByText("Voilà ! Autre chose ?")).toBeTruthy());
    await speakOnce("non merci");
    await waitFor(() => expect(screen.getByTestId("interaction-finished")).toBeTruthy());

    expect(results[0]).toMatchObject({ goalMet: true, passedFirstTry: true });
  });
});

describe("supportive interlocutor (§29)", () => {
  test("rephrase swaps the partner line to the authored simpler variant and never affects judgment", async () => {
    const results: InteractionAnswer[] = [];
    render(<Harness scored={false} onResult={(a) => results.push(a)} />);
    await waitFor(() => expect(screen.getByTestId("interaction-rephrase")).toBeTruthy());

    fireEvent.press(screen.getByTestId("interaction-rephrase"));
    // Learning mode shows the rephrased text in place of the original.
    await waitFor(() => expect(screen.getByText("Vous voulez boire quoi ?")).toBeTruthy());
    expect(screen.queryByText("Bonjour ! Vous désirez ?")).toBeNull();
    // Rephrase is authored once; repeat remains.
    expect(screen.queryByTestId("interaction-rephrase")).toBeNull();
    fireEvent.press(screen.getByTestId("interaction-repeat"));

    await speakOnce("je voudrais un café");
    await waitFor(() => expect(screen.getByText("Voilà ! Autre chose ?")).toBeTruthy());
    await speakOnce("non merci");
    await waitFor(() => expect(screen.getByTestId("interaction-finished")).toBeTruthy());

    expect(results[0]).toMatchObject({
      goalMet: true,
      passedFirstTry: true, // support never fails the learner
      supportUsed: 2,
    });
  });
});

describe("scored construct rules (§33)", () => {
  test("scored mode never shows the partner's French text — audio bubbles only", async () => {
    render(<Harness scored />);
    await waitFor(() => expect(screen.getByTestId("interaction-prompt")).toBeTruthy());

    expect(screen.queryByText("Bonjour ! Vous désirez ?")).toBeNull();
    expect(screen.getAllByTestId("interaction-partner-turn").length).toBeGreaterThan(0);
    // The task guidance and goal stay visible — the item must be administrable.
    expect(screen.getByText("Order a coffee.")).toBeTruthy();
    expect(screen.getByTestId("interaction-goal")).toBeTruthy();

    await speakOnce("je voudrais un café");
    await waitFor(() =>
      expect(screen.getAllByTestId("interaction-partner-turn").length).toBeGreaterThan(1)
    );
    expect(screen.queryByText("Voilà ! Autre chose ?")).toBeNull();
    // The learner's own words stay honest in both modes.
    expect(screen.getByText("“je voudrais un café”")).toBeTruthy();
  });

  test("learning mode shows the practice result card after grading", async () => {
    const results: InteractionAnswer[] = [];
    const { rerender } = render(<Harness scored={false} onResult={(a) => results.push(a)} />);
    await waitFor(() => expect(screen.getByTestId("interaction-prompt")).toBeTruthy());
    await speakOnce("je voudrais un café");
    await waitFor(() => expect(screen.getByText("Say no thank you.")).toBeTruthy());
    await speakOnce("non merci");
    await waitFor(() => expect(screen.getByTestId("interaction-finished")).toBeTruthy());

    // The session screen grades on Check; simulate the answered re-render.
    rerender(<Harness scored={false} status="correct" onResult={(a) => results.push(a)} />);
    await waitFor(() => expect(screen.getByTestId("interaction-result")).toBeTruthy());
    expect(screen.getByText("You reached your goal! 🎉")).toBeTruthy();
    expect(screen.queryByTestId("interaction-finished")).toBeNull();
  });
});
