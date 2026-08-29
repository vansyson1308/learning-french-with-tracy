/**
 * Speak exercise renderers (P8 §11/§13/§14/§24, test program §29): the
 * REAL adapter + attempt hook + components drive against the mocked
 * provider module, verifying the construct properties end to end in JS —
 * production never exposes French pre-attempt, scored hides transcripts
 * until submission, repetition is an assisted practice loop, permissions
 * are requested at point of use, and blocked devices can skip.
 *
 * Honesty note (§6): the PROVIDER is mocked — platform recognizer behavior
 * itself remains an outstanding real-device gate (RESEARCH.md §7).
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

import { SpeakProduction } from "@/components/exercises/speak-production";
import { SpeakRepetition } from "@/components/exercises/speak-repetition";
import type { Answer, SpokenAnswer, Status } from "@/lib/grading";
import { useSpeechSession, type SpeechExerciseContext } from "@/lib/speech/use-speech-session";
import type { SpeakProductionExercise, SpeakRepetitionExercise } from "@/lib/types";

import * as speechRecognitionModule from "expo-speech-recognition";

const provider = speechRecognitionModule as unknown as {
  __speechState: {
    available: boolean;
    permission: { granted: boolean; status: string; canAskAgain?: boolean };
    installedLocales: string[];
    startCalls: Record<string, unknown>[];
  };
  __emitSpeechEvent: (name: string, payload?: unknown) => void;
  ExpoSpeechRecognitionModule: { requestPermissionsAsync: () => Promise<unknown> };
};

const production: SpeakProductionExercise = {
  type: "speakProduction",
  id: "ex-prod-1",
  speechItemId: "fr.speak.cafe",
  instruction: "Say that you would like a coffee.",
  cueEmoji: "☕",
  target: "Je voudrais un café",
  acceptedVariants: ["Je voudrais un café"],
  evidenceLexemeRefs: ["fr:w:cafe"],
  revealTargetAfterAttempts: 2,
  allowContextualBias: false,
  modelClipId: null,
  allowedAttempts: 2,
};

const repetition: SpeakRepetitionExercise = {
  type: "speakRepetition",
  id: "ex-rep-1",
  speechItemId: "fr.speak.bonjour",
  modelClipId: "fr.clip.uf_cafe",
  target: "Bonjour !",
  acceptedVariants: ["Bonjour"],
};

/** Minimal stand-in for the session machine around one speak step. */
function Harness({
  kind,
  scored,
  status = "none",
  onSpoken,
  onSkip,
}: {
  kind: "production" | "repetition";
  scored: boolean;
  status?: Status;
  onSpoken?: (a: SpokenAnswer) => void;
  onSkip?: () => void;
}) {
  const session = useSpeechSession(true);
  const [answer, setAnswer] = React.useState<Answer>(null);
  const speech: SpeechExerciseContext = { scored, session, onSpeechSkip: onSkip };
  const handleAnswer = (value: SpokenAnswer) => {
    setAnswer(value);
    onSpoken?.(value);
  };
  return kind === "production" ? (
    <SpeakProduction
      exercise={production}
      answer={answer}
      status={status}
      speech={speech}
      onAnswer={handleAnswer}
    />
  ) : (
    <SpeakRepetition
      exercise={repetition}
      answer={answer}
      status={status}
      speech={speech}
      onAnswer={handleAnswer}
    />
  );
}

async function recordOnce(finalTranscript: string, alternatives: string[] = []) {
  await waitFor(() => expect(screen.getByTestId("speak-record")).toBeTruthy());
  fireEvent.press(screen.getByTestId("speak-record"));
  act(() => {
    provider.__emitSpeechEvent("start", null);
  });
  act(() => {
    provider.__emitSpeechEvent("result", {
      isFinal: true,
      results: [{ transcript: finalTranscript }, ...alternatives.map((t) => ({ transcript: t }))],
    });
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

describe("elicited production construct (§11/§13)", () => {
  test("the French target is NEVER visible before an attempt", async () => {
    render(<Harness kind="production" scored={false} />);
    await waitFor(() => expect(screen.getByTestId("speak-record")).toBeTruthy());
    expect(screen.queryByTestId("production-target")).toBeNull();
    expect(screen.queryByText("Je voudrais un café")).toBeNull();
    expect(screen.getByText("Say that you would like a coffee.")).toBeTruthy();
  });

  test("learning: a final shows 'I heard' + honest hint; wrong finals reveal after 2", async () => {
    render(<Harness kind="production" scored={false} />);
    await recordOnce("je voudrais un thé");
    await waitFor(() => expect(screen.getByTestId("speak-heard")).toBeTruthy());
    expect(screen.getByText("“je voudrais un thé”")).toBeTruthy();
    expect(screen.queryByTestId("production-target")).toBeNull();

    await recordOnce("je voudrais du thé");
    await waitFor(() => expect(screen.getByTestId("production-target")).toBeTruthy());
    expect(screen.getByText("Je voudrais un café")).toBeTruthy();
  });

  test("scored: no transcript before submission, and the attempt budget is enforced", async () => {
    render(<Harness kind="production" scored={true} />);
    await recordOnce("je voudrais un café");
    await waitFor(() =>
      expect(provider.__speechState.startCalls.length).toBe(1)
    );
    // §13: nothing readable pre-submission — no heard box, no partials.
    expect(screen.queryByTestId("speak-heard")).toBeNull();
    expect(screen.getByTestId("speak-budget")).toBeTruthy();

    await recordOnce("je voudrais un café");
    // Two allowed attempts consumed → the mic refuses a third start.
    fireEvent.press(screen.getByTestId("speak-record"));
    expect(provider.__speechState.startCalls.length).toBe(2);
  });

  test("scored capture runs in scored mode: no interim results, no bias", async () => {
    render(<Harness kind="production" scored={true} />);
    await recordOnce("bonjour");
    const options = provider.__speechState.startCalls[0];
    expect(options.interimResults).toBe(false);
    expect(options.contextualStrings).toBeUndefined();
  });

  test("the submitted SpokenAnswer is unassisted for a clean production attempt", async () => {
    const spoken: SpokenAnswer[] = [];
    render(<Harness kind="production" scored={false} onSpoken={(a) => spoken.push(a)} />);
    await recordOnce("je voudrais un café");
    await waitFor(() => expect(spoken.length).toBe(1));
    expect(spoken[0]).toEqual({
      spoken: true,
      finalTranscript: "je voudrais un café",
      alternatives: [],
      assisted: false,
    });
  });

  test("after grading, the transcript and target are shown (§14)", async () => {
    render(<Harness kind="production" scored={true} status="wrong" />);
    // answered → no record button, target visible through showTarget(answered).
    await waitFor(() => expect(screen.getByTestId("production-target")).toBeTruthy());
    expect(screen.queryByTestId("speak-record")).toBeNull();
  });
});

describe("repetition practice construct (§11)", () => {
  test("shows its French text and biases recognition toward it, marked assisted", async () => {
    const spoken: SpokenAnswer[] = [];
    render(<Harness kind="repetition" scored={false} onSpoken={(a) => spoken.push(a)} />);
    await waitFor(() => expect(screen.getByTestId("repetition-target")).toBeTruthy());
    expect(screen.getByText("Bonjour !")).toBeTruthy();

    await recordOnce("bonjour");
    await waitFor(() => expect(spoken.length).toBe(1));
    expect(spoken[0].assisted).toBe(true);
    const options = provider.__speechState.startCalls[0];
    expect(options.interimResults).toBe(true);
    expect(options.contextualStrings).toEqual(["Bonjour !"]);
  });
});

describe("point-of-use permissions and degradation (§24/§25)", () => {
  test("undetermined permission shows the rationale and requests on tap", async () => {
    provider.__speechState.permission = {
      granted: false,
      status: "undetermined",
      canAskAgain: true,
    };
    const request = jest.spyOn(provider.ExpoSpeechRecognitionModule, "requestPermissionsAsync");
    render(<Harness kind="production" scored={false} />);
    await waitFor(() => expect(screen.getByText("Allow microphone")).toBeTruthy());
    expect(screen.getByText(/microphone is used only while you practice/i)).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText("Allow microphone"));
    });
    expect(request).toHaveBeenCalled();
  });

  test("a denied permission blocks with Settings + Skip, and skip resolves the step", async () => {
    provider.__speechState.permission = { granted: false, status: "denied", canAskAgain: false };
    const onSkip = jest.fn();
    render(<Harness kind="production" scored={false} onSkip={onSkip} />);
    await waitFor(() => expect(screen.getByTestId("speak-blocked")).toBeTruthy());
    expect(screen.getByText("Open Settings")).toBeTruthy();
    fireEvent.press(screen.getByText("Skip this step"));
    expect(onSkip).toHaveBeenCalled();
  });

  test("no recognizer at all degrades to an honest skip", async () => {
    provider.__speechState.available = false;
    const onSkip = jest.fn();
    render(<Harness kind="production" scored={false} onSkip={onSkip} />);
    await waitFor(() => expect(screen.getByTestId("speak-blocked")).toBeTruthy());
    expect(screen.getByText(/aren't available here/i)).toBeTruthy();
  });

  test("silence yields the §14 'didn't hear' notice, never a wrong grade", async () => {
    render(<Harness kind="production" scored={false} />);
    await waitFor(() => expect(screen.getByTestId("speak-record")).toBeTruthy());
    fireEvent.press(screen.getByTestId("speak-record"));
    act(() => {
      provider.__emitSpeechEvent("start", null);
    });
    act(() => {
      provider.__emitSpeechEvent("error", { error: "no-speech", message: "" });
      provider.__emitSpeechEvent("end", null);
    });
    await waitFor(() => expect(screen.getByTestId("speak-notice")).toBeTruthy());
    expect(screen.getByText(/didn't hear anything/i)).toBeTruthy();
    expect(screen.queryByTestId("speak-heard")).toBeNull();
  });
});
