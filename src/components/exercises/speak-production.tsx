/**
 * Elicited spoken PRODUCTION (P8 §11/§13): a meaning-only cue — English
 * instruction, optional emoji, optional facts — and a recorder. The French
 * target is NEVER visible before the attempt (learning may reveal it after
 * N non-matching recordings, which marks later attempts assisted); the
 * model answer plays only AFTER grading, and only in learning mode.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { SpeakRecordControl } from "@/components/exercises/speak-record-control";
import { ListeningPlayerView } from "@/components/session/listening-player-view";
import { checkAnswer, isSpokenAnswer, type Answer, type SpokenAnswer } from "@/lib/grading";
import { clipAudioSource } from "@/lib/reception/content";
import { useListeningPlayer } from "@/lib/reception/use-listening-player";
import {
  attemptAssisted,
  attemptMode,
  canPlayModel,
  contextualStringsFor,
  recordingBudget,
  showHeardBeforeCheck,
  showPartials,
  showTarget,
} from "@/lib/speech/step-policy";
import type { SpeechExerciseContext } from "@/lib/speech/use-speech-session";
import { makeThemedStyles, radius } from "@/lib/theme";
import type { SpeakProductionExercise } from "@/lib/types";

export function SpeakProduction({
  exercise,
  answer,
  status,
  speech,
  onAnswer,
}: {
  exercise: SpeakProductionExercise;
  answer: Answer;
  status: "none" | "correct" | "wrong";
  speech: SpeechExerciseContext;
  onAnswer: (value: SpokenAnswer) => void;
}) {
  const styles = useStyles();
  const ctx = { scored: speech.scored };
  const answered = status !== "none";
  // Non-matching recordings this encounter (drives the learning reveal).
  const [wrongFinals, setWrongFinals] = React.useState(0);
  const policyState = { wrongFinals, answered };
  const targetVisible = showTarget(exercise, ctx, policyState);
  const modelPlayable = canPlayModel(exercise, ctx, { answered });

  const player = useListeningPlayer(
    exercise.modelClipId !== null && modelPlayable
      ? clipAudioSource(exercise.modelClipId)
      : null,
    { maxPlays: null, allowSlow: true }
  );

  const heard = isSpokenAnswer(answer) ? answer.finalTranscript : null;
  const hint =
    heard !== null && !answered && !speech.scored
      ? checkAnswer(exercise, answer)
        ? "Sounds right — check to continue!"
        : "Not quite. Try again, or check what you have."
      : null;

  const onFinal = (value: SpokenAnswer) => {
    if (!checkAnswer(exercise, value)) setWrongFinals((count) => count + 1);
    onAnswer(value);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Say it in French</Text>
      <View style={styles.cueCard} testID="production-cue">
        <Text style={styles.instruction}>{exercise.instruction}</Text>
        {exercise.cueEmoji ? <Text style={styles.cueEmoji}>{exercise.cueEmoji}</Text> : null}
        {exercise.cueFacts?.map((fact) => (
          <View key={fact.label} style={styles.factRow}>
            <Text style={styles.factLabel}>{fact.label}</Text>
            <Text style={styles.factValue}>{fact.value}</Text>
          </View>
        ))}
      </View>
      {targetVisible ? (
        <Text style={styles.target} testID="production-target">
          {exercise.target}
        </Text>
      ) : null}
      {modelPlayable ? <ListeningPlayerView api={player} /> : null}
      <SpeakRecordControl
        scored={speech.scored}
        session={speech.session}
        mode={attemptMode(exercise, ctx)}
        contextualStrings={contextualStringsFor(exercise, ctx)}
        budget={recordingBudget(exercise, ctx)}
        showPartials={showPartials(exercise, ctx)}
        showHeard={showHeardBeforeCheck(ctx)}
        answered={answered}
        assisted={attemptAssisted(exercise, ctx, { targetVisibleAtStart: targetVisible })}
        heardText={heard}
        hint={hint}
        onFinal={onFinal}
        onSkip={speech.onSpeechSkip}
        onBeforeRecord={player.state.playing ? player.onPausePress : undefined}
      />
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: 16 },
    title: { fontSize: 22, fontWeight: "800", color: colors.text },
    cueCard: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 8,
    },
    instruction: { fontSize: 18, fontWeight: "700", color: colors.text },
    cueEmoji: { fontSize: 44, textAlign: "center" },
    factRow: { flexDirection: "row", justifyContent: "space-between" },
    factLabel: { fontSize: 15, fontWeight: "600", color: colors.neutral400 },
    factValue: { fontSize: 16, fontWeight: "800", color: colors.text },
    target: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: 12,
    },
  })
);
