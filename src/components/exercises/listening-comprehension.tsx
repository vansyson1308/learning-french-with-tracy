/**
 * Listening comprehension (P7 §61, §66-71): bundled clip + meaning question.
 * The transcript is NEVER rendered before the answer; full-feedback modes
 * reveal it after. Scored sessions cap plays and forbid slow mode via the
 * player config the renderer receives.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { OptionCard, type OptionState } from "@/components/exercises/option-card";
import { ListeningPlayerView } from "@/components/session/listening-player-view";
import { clipFor } from "@/lib/reception/content";
import type { ListeningPlayerApi } from "@/lib/reception/use-listening-player";
import type { ListeningComprehensionExercise } from "@/lib/types";
import { makeThemedStyles } from "@/lib/theme";

function optionState(
  index: number,
  answer: number | null,
  status: "none" | "correct" | "wrong",
  correct: number
): OptionState {
  if (status === "none") return answer === index ? "selected" : "idle";
  if (index === correct) return "correct";
  if (answer === index) return "wrong";
  return "idle";
}

export function ListeningComprehension({
  exercise,
  answer,
  status,
  player,
  showTranscript,
  onAnswer,
  onAudioUnavailable,
}: {
  exercise: ListeningComprehensionExercise;
  answer: number | null;
  status: "none" | "correct" | "wrong";
  player: ListeningPlayerApi;
  /** True only after answering in full-feedback modes (§71). */
  showTranscript: boolean;
  onAnswer: (index: number) => void;
  onAudioUnavailable?: () => void;
}) {
  const styles = useStyles();
  const clip = clipFor(exercise.clipId);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Listen, then answer</Text>
      <ListeningPlayerView api={player} onAudioUnavailable={onAudioUnavailable} />
      <Text style={styles.question}>{exercise.question}</Text>
      <View style={styles.options}>
        {exercise.options.map((option, i) => (
          <OptionCard
            key={option.text + i}
            text={option.text}
            state={optionState(i, answer, status, exercise.correct)}
            disabled={status !== "none"}
            onPress={() => onAnswer(i)}
          />
        ))}
      </View>
      {showTranscript && clip ? (
        <View style={styles.transcript} testID="clip-transcript">
          <Text style={styles.transcriptTitle}>What you heard</Text>
          {clip.transcriptLines.map((line, i) => (
            <Text key={i} style={styles.transcriptLine}>
              {clip.transcriptLines.length > 1 ? `${line.speaker === "A" ? "—" : "—"} ` : ""}
              {line.text}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: 16 },
    title: { fontSize: 22, fontWeight: "800", color: colors.text },
    question: { fontSize: 17, fontWeight: "600", color: colors.text },
    options: { gap: 10 },
    transcript: { gap: 4, paddingTop: 4 },
    transcriptTitle: { fontSize: 13, fontWeight: "800", color: colors.textMuted },
    transcriptLine: { fontSize: 15, fontStyle: "italic", color: colors.text },
  })
);
