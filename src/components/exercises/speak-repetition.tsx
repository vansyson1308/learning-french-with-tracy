/**
 * Listen-and-repeat PRACTICE (P8 §11): the model clip and its French text
 * are the stimulus, the learner repeats, and the recognizer's transcript is
 * feedback only — this construct is never spoken-production evidence. The
 * model pauses whenever the mic opens (§10).
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
  contextualStringsFor,
  recordingBudget,
  showPartials,
} from "@/lib/speech/step-policy";
import type { SpeechExerciseContext } from "@/lib/speech/use-speech-session";
import { makeThemedStyles, radius } from "@/lib/theme";
import type { SpeakRepetitionExercise } from "@/lib/types";

export function SpeakRepetition({
  exercise,
  answer,
  status,
  speech,
  onAnswer,
}: {
  exercise: SpeakRepetitionExercise;
  answer: Answer;
  status: "none" | "correct" | "wrong";
  speech: SpeechExerciseContext;
  onAnswer: (value: SpokenAnswer) => void;
}) {
  const styles = useStyles();
  const ctx = { scored: speech.scored };
  const player = useListeningPlayer(clipAudioSource(exercise.modelClipId), {
    maxPlays: null,
    allowSlow: true,
  });
  const answered = status !== "none";
  const heard = isSpokenAnswer(answer) ? answer.finalTranscript : null;
  const hint =
    heard !== null && !answered
      ? checkAnswer(exercise, answer)
        ? "That matched — check to continue!"
        : "Not quite the same. Listen again and retry, or check anyway."
      : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Listen and repeat</Text>
      <Text style={styles.target} testID="repetition-target">
        {exercise.target}
      </Text>
      <ListeningPlayerView api={player} />
      <SpeakRecordControl
        scored={speech.scored}
        session={speech.session}
        mode={attemptMode(exercise, ctx)}
        contextualStrings={contextualStringsFor(exercise, ctx)}
        budget={recordingBudget(exercise, ctx)}
        showPartials={showPartials(exercise, ctx)}
        showHeard
        answered={answered}
        assisted={attemptAssisted(exercise, ctx, { targetVisibleAtStart: true })}
        heardText={heard}
        hint={hint}
        onFinal={onAnswer}
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
    target: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: 14,
    },
  })
);
