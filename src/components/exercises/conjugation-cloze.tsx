/**
 * Typed conjugation production (Phase 5B §63–67): the sentence shows a blank
 * for the conjugated form, the infinitive is given as a hint chip, and the
 * learner types the form. Grading is STRICT (accents and exact inflection
 * matter) — see strictFrenchEquals. Grammar practice only, never lexical FSRS.
 */
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { makeThemedStyles, radius, useResolvedScheme, useThemeColors } from "@/lib/theme";
import type { ConjugationClozeExercise } from "@/lib/types";

type ConjugationClozeProps = {
  exercise: ConjugationClozeExercise;
  answer: string;
  onAnswer: (text: string) => void;
  status: "none" | "correct" | "wrong";
};

export function ConjugationCloze({
  exercise,
  answer,
  onAnswer,
  status,
}: ConjugationClozeProps) {
  const colors = useThemeColors();
  const styles = useStyles();
  const scheme = useResolvedScheme();
  const filled =
    status === "none"
      ? exercise.sentence
      : exercise.sentence.replace("___", answer.trim() || "___");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Type the verb form</Text>
      <Text style={styles.sentence}>{filled}</Text>
      <Text style={styles.translation}>{exercise.translation}</Text>

      <View style={styles.hintRow}>
        <View style={styles.hintChip}>
          <Text style={styles.hintText}>verbe : {exercise.verb}</Text>
        </View>
      </View>

      <TextInput
        value={answer}
        onChangeText={onAnswer}
        editable={status === "none"}
        placeholder="Type in French — accents count"
        placeholderTextColor={colors.neutral400}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardAppearance={scheme}
        style={[
          styles.input,
          status === "correct" && { borderColor: colors.greenLight },
          status === "wrong" && { borderColor: colors.rose },
        ]}
      />
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    container: { gap: 16 },
    title: { fontSize: 22, fontWeight: "800", color: colors.neutral700 },
    sentence: { fontSize: 22, fontWeight: "700", color: colors.text },
    translation: { fontSize: 15, color: colors.textMuted },
    hintRow: { flexDirection: "row" },
    hintChip: {
      borderWidth: 1.5,
      borderColor: colors.neutral300,
      borderRadius: radius.full,
      backgroundColor: colors.neutral100,
      paddingVertical: 6,
      paddingHorizontal: 14,
    },
    hintText: { fontSize: 15, fontWeight: "700", color: colors.neutral700 },
    input: {
      minHeight: 56,
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.lg,
      backgroundColor: colors.neutral100,
      padding: 14,
      fontSize: 17,
      color: colors.text,
    },
  })
);
