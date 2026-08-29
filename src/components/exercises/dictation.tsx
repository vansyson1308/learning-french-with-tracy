/**
 * Dictation (P7 §63): hear the bundled clip, type what was said. Strict
 * French grading (accents matter — orthographic decoding IS the construct).
 * The transcript is the answer, so it is never shown before grading.
 */
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ListeningPlayerView } from "@/components/session/listening-player-view";
import type { ListeningPlayerApi } from "@/lib/reception/use-listening-player";
import type { DictationExercise } from "@/lib/types";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export function Dictation({
  exercise: _exercise,
  answer,
  status,
  player,
  onAnswer,
  onAudioUnavailable,
}: {
  exercise: DictationExercise;
  answer: string | null;
  status: "none" | "correct" | "wrong";
  player: ListeningPlayerApi;
  onAnswer: (value: string) => void;
  onAudioUnavailable?: () => void;
}) {
  const styles = useStyles();
  const colors = useThemeColors();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Type what you hear</Text>
      <ListeningPlayerView api={player} onAudioUnavailable={onAudioUnavailable} />
      <TextInput
        style={[
          styles.input,
          status === "correct" && { borderColor: colors.green },
          status === "wrong" && { borderColor: colors.rose },
        ]}
        value={answer ?? ""}
        onChangeText={onAnswer}
        editable={status === "none"}
        placeholder="Type in French — accents count"
        placeholderTextColor={colors.neutral400}
        autoCapitalize="none"
        autoCorrect={false}
        testID="dictation-input"
      />
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: 16 },
    title: { fontSize: 22, fontWeight: "800", color: colors.text },
    input: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: 14,
      fontSize: 18,
      color: colors.text,
    },
  })
);
