/**
 * Deterministic spoken-interaction step (P9 §24-§37): one authored scenario
 * graph runs as ONE session step. The pure machine in lib/interaction
 * decides everything — this component only renders the conversation, plays
 * partner clips, opens the mic on learner turns, offers the §29 support
 * moves, and submits the whole-scenario InteractionAnswer at a terminal.
 *
 * Construct rules enforced here (§29/§33): scored mode never shows the
 * partner's French text (audio-only, like a real conversation) and never a
 * per-turn verdict — the partner's authored reaction IS the feedback. The
 * learner's own recognized words are always shown honestly. Repeat and
 * rephrase are supportive moves: tracked, never failed.
 */
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SpeakRecordControl } from "@/components/exercises/speak-record-control";
import { DuoButton } from "@/components/duo-button";
import { isInteractionAnswer, type Answer, type InteractionAnswer, type SpokenAnswer } from "@/lib/grading";
import { interactionScenarioFor } from "@/lib/interaction/content";
import {
  currentLearnerNode,
  interactionReducer,
  interactionResult,
  startInteraction,
  type InteractionEvent,
  type InteractionScenario as Scenario,
  type InteractionState,
  type TurnRecord,
} from "@/lib/interaction/machine";
import { clipAudioSource } from "@/lib/reception/content";
import type { SpeechOutcome } from "@/lib/speech/types";
import type { SpeechExerciseContext } from "@/lib/speech/use-speech-session";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";
import type { InteractionScenarioExercise } from "@/lib/types";

/** The clip a partner history entry currently "says" (rephrase-aware). */
function clipIdForPartnerEntry(scenario: Scenario, entry: TurnRecord): string | null {
  if (entry.speaker !== "partner") return null;
  const node = scenario.nodes[entry.nodeId];
  if (!node) return null;
  if (node.kind === "partner") {
    return entry.rephrased && node.rephraseClipId ? node.rephraseClipId : node.clipId;
  }
  if (node.kind === "terminal") return node.clipId ?? null;
  return null;
}

/** The text a partner history entry currently shows (learning mode only). */
function textForPartnerEntry(scenario: Scenario, entry: TurnRecord): string {
  if (entry.speaker !== "partner") return "";
  const node = scenario.nodes[entry.nodeId];
  if (node?.kind === "partner" && entry.rephrased && node.rephraseText) {
    return node.rephraseText;
  }
  return entry.text;
}

export function InteractionScenarioStep({
  exercise,
  answer,
  status,
  speech,
  onAnswer,
}: {
  exercise: InteractionScenarioExercise;
  answer: Answer;
  status: "none" | "correct" | "wrong";
  speech: SpeechExerciseContext;
  onAnswer: (value: InteractionAnswer) => void;
}) {
  const styles = useStyles();
  const scenario = React.useMemo(
    () => interactionScenarioFor(exercise.scenarioId),
    [exercise.scenarioId]
  );

  if (!scenario) {
    // Validator-impossible for shipped content; fail safe with the honest
    // no-evidence escape rather than a dead screen.
    return (
      <View style={styles.wrap} testID="interaction-missing">
        <Text style={styles.muted}>This conversation can&apos;t be loaded.</Text>
        {speech.onSpeechSkip ? (
          <DuoButton label="Skip this step" variant="white" onPress={speech.onSpeechSkip} />
        ) : null}
      </View>
    );
  }
  return (
    <LoadedScenario
      scenario={scenario}
      answer={answer}
      status={status}
      speech={speech}
      onAnswer={onAnswer}
    />
  );
}

function LoadedScenario({
  scenario,
  answer,
  status,
  speech,
  onAnswer,
}: {
  scenario: Scenario;
  answer: Answer;
  status: "none" | "correct" | "wrong";
  speech: SpeechExerciseContext;
  onAnswer: (value: InteractionAnswer) => void;
}) {
  const styles = useStyles();
  const colors = useThemeColors();
  const scored = speech.scored;
  const answered = status !== "none";

  const [state, dispatch] = React.useReducer(
    (current: InteractionState, event: InteractionEvent) =>
      interactionReducer(scenario, current, event),
    scenario,
    startInteraction
  );

  // Partner/terminal nodes present instantly: the machine's advance event
  // fires as soon as one is entered, so the screen always rests on either a
  // learner turn or the finished conversation. History keeps every bubble.
  React.useEffect(() => {
    if (state.finished) return;
    const node = scenario.nodes[state.currentNodeId];
    if (node?.kind === "partner") dispatch({ type: "advance" });
  }, [state, scenario]);

  // One conversation audio channel: each NEW partner line auto-plays once
  // (the partner speaking); replays go through the counted support moves.
  const player = useAudioPlayer();
  const playClip = React.useCallback(
    (clipId: string | null) => {
      if (clipId === null) return;
      const source = clipAudioSource(clipId);
      if (source === null) return;
      player.replace(source);
      player.seekTo(0);
      player.play();
    },
    [player]
  );
  const partnerTurns = state.history.filter((t) => t.speaker === "partner");
  const playedCountRef = React.useRef(0);
  React.useEffect(() => {
    if (partnerTurns.length <= playedCountRef.current) return;
    playedCountRef.current = partnerTurns.length;
    const latest = partnerTurns[partnerTurns.length - 1];
    playClip(clipIdForPartnerEntry(scenario, latest));
  }, [partnerTurns, scenario, playClip]);

  // Submit the whole-scenario result exactly once, at the terminal.
  const onAnswerRef = React.useRef(onAnswer);
  React.useEffect(() => {
    onAnswerRef.current = onAnswer;
  });
  const submittedRef = React.useRef(false);
  React.useEffect(() => {
    if (!state.finished || submittedRef.current) return;
    submittedRef.current = true;
    onAnswerRef.current({ interaction: true, ...interactionResult(scenario, state) });
  }, [state, scenario]);

  const learnerNode = currentLearnerNode(scenario, state);
  const lastPartner = partnerTurns.length
    ? partnerTurns[partnerTurns.length - 1]
    : null;
  const lastPartnerNode = lastPartner ? scenario.nodes[lastPartner.nodeId] : null;

  // §29 support: repeat replays what the partner last said; rephrase swaps
  // to the authored simpler variant once. Both count as supportUsed and
  // never touch any judgment.
  const canRepeat =
    learnerNode !== null &&
    scenario.support.allowRepeat &&
    lastPartner !== null &&
    clipIdForPartnerEntry(scenario, lastPartner) !== null;
  const canRephrase =
    learnerNode !== null &&
    scenario.support.allowRephrase &&
    lastPartner?.speaker === "partner" &&
    !lastPartner.rephrased &&
    lastPartnerNode?.kind === "partner" &&
    lastPartnerNode.rephraseClipId !== undefined;
  const onRepeat = () => {
    if (!lastPartner) return;
    dispatch({ type: "repeatRequested" });
    playClip(clipIdForPartnerEntry(scenario, lastPartner));
  };
  const onRephrase = () => {
    if (lastPartnerNode?.kind !== "partner" || !lastPartnerNode.rephraseClipId) return;
    dispatch({ type: "rephraseRequested" });
    playClip(lastPartnerNode.rephraseClipId);
  };

  const onFinal = (value: SpokenAnswer) => {
    dispatch({
      type: "learnerFinal",
      finalTranscript: value.finalTranscript,
      alternatives: value.alternatives,
    });
  };
  const onOutcome = (outcome: SpeechOutcome) => {
    // Silence and technical failures are counted, never judged (§71).
    if (outcome.kind === "no_speech" || outcome.kind === "technical") {
      dispatch({ type: "technical" });
    }
  };

  const result = isInteractionAnswer(answer) ? answer : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{scenario.title}</Text>
      <View style={styles.goalCard} testID="interaction-goal">
        <Text style={styles.goalLabel}>Your goal</Text>
        <Text style={styles.goalText}>{scenario.goal}</Text>
      </View>

      <View style={styles.historyWrap}>
        {state.history.map((turn, index) =>
          turn.speaker === "partner" ? (
            <View
              key={`${turn.nodeId}-${index}`}
              style={[styles.bubble, styles.partnerBubble]}
              testID="interaction-partner-turn"
            >
              {scored ? (
                <View
                  style={styles.spokenRow}
                  accessibilityLabel="The partner spoke (audio only)"
                >
                  <Ionicons name="volume-high" size={18} color={colors.neutral400} />
                  <Text style={styles.spokenPlaceholder}>…</Text>
                </View>
              ) : (
                <Text style={styles.partnerText}>
                  {textForPartnerEntry(scenario, turn)}
                </Text>
              )}
            </View>
          ) : (
            <View
              key={`${turn.nodeId}-${index}`}
              style={[styles.bubble, styles.learnerBubble]}
              testID="interaction-learner-turn"
            >
              <Text style={styles.learnerText}>“{turn.heard}”</Text>
            </View>
          )
        )}
      </View>

      {learnerNode && !answered ? (
        <View style={styles.turnWrap}>
          <Text style={styles.prompt} testID="interaction-prompt">
            {learnerNode.prompt}
          </Text>
          {canRepeat || canRephrase ? (
            <View style={styles.supportRow}>
              {canRepeat ? (
                <Pressable
                  onPress={onRepeat}
                  accessibilityRole="button"
                  accessibilityLabel="Hear the partner again"
                  style={styles.supportButton}
                  testID="interaction-repeat"
                >
                  <Ionicons name="repeat" size={18} color={colors.skyDark} />
                  <Text style={[styles.supportText, { color: colors.skyDark }]}>
                    Hear it again
                  </Text>
                </Pressable>
              ) : null}
              {canRephrase ? (
                <Pressable
                  onPress={onRephrase}
                  accessibilityRole="button"
                  accessibilityLabel="Ask the partner to say it more simply"
                  style={styles.supportButton}
                  testID="interaction-rephrase"
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.skyDark} />
                  <Text style={[styles.supportText, { color: colors.skyDark }]}>
                    Say it simply
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <SpeakRecordControl
            scored={scored}
            session={speech.session}
            mode={scored ? "scored" : "practice"}
            budget={null}
            showPartials={!scored}
            showHeard={false}
            answered={answered || state.finished !== null}
            assisted={false}
            heardText={null}
            onFinal={onFinal}
            onOutcome={onOutcome}
            onSkip={speech.onSpeechSkip}
            onBeforeRecord={() => player.pause()}
          />
        </View>
      ) : null}

      {state.finished && !answered ? (
        <Text style={styles.muted} testID="interaction-finished">
          The conversation is over — check to continue.
        </Text>
      ) : null}

      {answered && !scored && result ? (
        <View style={styles.resultCard} testID="interaction-result">
          <Text style={styles.resultTitle}>
            {result.goalMet
              ? "You reached your goal! 🎉"
              : "The conversation ended before the goal."}
          </Text>
          {result.goalMet && !result.passedFirstTry ? (
            <Text style={styles.resultLine}>
              Some replies needed a second try — run it again for a first-try pass.
            </Text>
          ) : null}
          {result.supportUsed > 0 ? (
            <Text style={styles.resultLine}>
              You asked for help {result.supportUsed}{" "}
              {result.supportUsed === 1 ? "time" : "times"} — that&apos;s what a
              patient partner is for.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: 14 },
    title: { fontSize: 22, fontWeight: "800", color: colors.text },
    goalCard: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 2,
    },
    goalLabel: { fontSize: 13, fontWeight: "700", color: colors.neutral400 },
    goalText: { fontSize: 16, fontWeight: "700", color: colors.text },
    historyWrap: { gap: 8 },
    bubble: {
      maxWidth: "88%",
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    partnerBubble: {
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.neutral200,
    },
    learnerBubble: {
      alignSelf: "flex-end",
      backgroundColor: colors.selectedBg,
    },
    partnerText: { fontSize: 17, fontWeight: "600", color: colors.text },
    learnerText: { fontSize: 17, fontWeight: "600", color: colors.text },
    spokenRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    spokenPlaceholder: { fontSize: 17, fontWeight: "700", color: colors.neutral400 },
    turnWrap: { gap: 10 },
    prompt: { fontSize: 16, fontWeight: "700", color: colors.neutral700 },
    supportRow: { flexDirection: "row", gap: 14 },
    supportButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
    },
    supportText: { fontSize: 14, fontWeight: "700" },
    muted: { fontSize: 15, color: colors.neutral400, textAlign: "center" },
    resultCard: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 6,
    },
    resultTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
    resultLine: { fontSize: 14, fontWeight: "600", color: colors.neutral700 },
  })
);
