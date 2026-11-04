/**
 * Coordinator 2026-11-05 (P4e session 3): in a course whose profile sets `deviceVoiceScoredListening`, the model clip of
 * a speech exercise and the partner lines of a scenario follow the listening rule — read by the installed local device
 * voice when the clip has no bundled asset, otherwise the "no device voice" notice with the install hint. They are
 * never graded, so the notice offers no skip: the step goes on (the target and the partner text stay on screen).
 * A course that does not opt in never looks for a voice. The French course stands in, with its clip assets hidden.
 */
import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import * as Speech from "expo-speech";
import React from "react";

import { InteractionScenarioStep } from "@/components/exercises/interaction-scenario";
import { SpeakRepetition } from "@/components/exercises/speak-repetition";
import { __registerCourseProfileForTests, courseProfile } from "@/lib/course-profile";
import type { Answer } from "@/lib/grading";
import type { InteractionScenario } from "@/lib/interaction/machine";
import { useSpeechSession, type SpeechExerciseContext } from "@/lib/speech/use-speech-session";
import type { SpeakRepetitionExercise } from "@/lib/types";

jest.mock("../src/lib/reception/content", () => {
  const actual = jest.requireActual("../src/lib/reception/content");
  return { ...actual, clipAudioSource: () => null };
});

const speak = Speech.speak as jest.Mock;
const voices = Speech.getAvailableVoicesAsync as jest.Mock;
const real = courseProfile("fr-en");

const repetition: SpeakRepetitionExercise = {
  type: "speakRepetition",
  id: "ex-rep-1",
  speechItemId: "fr.speak.cafe",
  modelClipId: "fr.clip.uf_cafe",
  target: "le café",
  acceptedVariants: ["le café"],
};

const scenario: InteractionScenario = {
  id: "fr.scenario.test_device_voice",
  title: "At the café",
  goal: "Say hello",
  taskFamily: "transaction",
  objectiveRefs: [],
  startNodeId: "p1",
  nodes: {
    p1: { kind: "partner", id: "p1", text: "Bonjour ! Vous désirez ?", clipId: "fr.clip.fx_unknown", next: "l1" },
    l1: { kind: "learner", id: "l1", prompt: "Greet back.", expected: [{ intent: "hello", acceptedVariants: ["bonjour"], next: "t1" }], noMatchNext: "t1", scored: false },
    t1: { kind: "terminal", id: "t1", outcome: "goal_met", text: "Au revoir !" },
  },
  support: { allowRepeat: true, allowRephrase: true },
  reserved: false,
} as unknown as InteractionScenario;

jest.mock("@/lib/interaction/content", () => ({
  interactionScenarioFor: (_courseId: string, id: string) => (id === "fr.scenario.test_device_voice" ? scenario : null),
  interactionPracticeScenarios: () => [scenario],
}));

function Repeat() {
  const session = useSpeechSession(true, "fr-FR");
  const [answer, setAnswer] = React.useState<Answer>(null);
  const speech: SpeechExerciseContext = { scored: false, session };
  return <SpeakRepetition courseId="fr-en" targetLanguage="French" exercise={repetition} answer={answer} status="none" speech={speech} onAnswer={setAnswer} />;
}

function Talk() {
  const session = useSpeechSession(true, "fr-FR");
  const speech: SpeechExerciseContext = { scored: false, session };
  return (
    <InteractionScenarioStep
      courseId="fr-en"
      targetLanguage="French"
      exercise={{ type: "interactionScenario", id: "ix-dv-1", scenarioId: "fr.scenario.test_device_voice" }}
      answer={null}
      status="none"
      speech={speech}
      onAnswer={() => {}}
    />
  );
}

beforeEach(() => {
  speak.mockClear();
  voices.mockReset();
  voices.mockImplementation(async () => []);
});
afterEach(() => __registerCourseProfileForTests(null, "fr-en"));

const LOCAL = [{ identifier: "fr-fr-x-local", name: "fr-fr-x-local", language: "fr-FR" }];

describe("speech model through the device voice", () => {
  test("opted in, a local voice: the model clip's transcript is spoken", async () => {
    __registerCourseProfileForTests({ ...real, deviceVoiceScoredListening: true });
    voices.mockImplementation(async () => LOCAL);
    const user = userEvent.setup();
    render(<Repeat />);
    await waitFor(() => expect(screen.getByTestId("listening-device-voice-label")).toBeOnTheScreen());
    await user.press(screen.getByTestId("listening-play"));
    expect(speak).toHaveBeenCalledWith("le café", expect.objectContaining({ voice: "fr-fr-x-local", language: "fr-FR" }));
  });
  test("opted in, no voice: the install hint, no skip, the target and the mic stay", async () => {
    __registerCourseProfileForTests({ ...real, deviceVoiceScoredListening: true });
    render(<Repeat />);
    await waitFor(() => expect(screen.getByTestId("device-voice-missing")).toBeOnTheScreen());
    expect(screen.queryByTestId("device-voice-skip")).toBeNull();
    expect(screen.getByTestId("repetition-target")).toBeOnTheScreen();
    expect(screen.getByTestId("speak-record")).toBeOnTheScreen();
    expect(speak).not.toHaveBeenCalled();
  });
  test("not opted in: no voice lookup, no notice", async () => {
    voices.mockImplementation(async () => LOCAL);
    render(<Repeat />);
    await waitFor(() => expect(screen.getByTestId("repetition-target")).toBeOnTheScreen());
    expect(screen.queryByTestId("device-voice-missing")).toBeNull();
    expect(voices).not.toHaveBeenCalled();
  });
});

describe("scenario partner lines through the device voice", () => {
  test("opted in, a local voice: the partner's line is spoken when it appears", async () => {
    __registerCourseProfileForTests({ ...real, deviceVoiceScoredListening: true });
    voices.mockImplementation(async () => LOCAL);
    render(<Talk />);
    await waitFor(() => expect(speak).toHaveBeenCalledWith("Bonjour ! Vous désirez ?", expect.objectContaining({ voice: "fr-fr-x-local" })));
  });
  test("opted in, no voice: the install hint, no skip, the conversation goes on with the text", async () => {
    __registerCourseProfileForTests({ ...real, deviceVoiceScoredListening: true });
    render(<Talk />);
    await waitFor(() => expect(screen.getByTestId("device-voice-missing")).toBeOnTheScreen());
    expect(screen.queryByTestId("device-voice-skip")).toBeNull();
    expect(screen.getByText("Bonjour ! Vous désirez ?")).toBeOnTheScreen();
    expect(speak).not.toHaveBeenCalled();
  });
  test("not opted in: no voice lookup, nothing spoken", async () => {
    voices.mockImplementation(async () => LOCAL);
    render(<Talk />);
    await waitFor(() => expect(screen.getByText("Bonjour ! Vous désirez ?")).toBeOnTheScreen());
    expect(screen.queryByTestId("device-voice-missing")).toBeNull();
    expect(voices).not.toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });
});
