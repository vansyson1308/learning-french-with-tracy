/**
 * Guided writing renderer (P9 §14-§19): an English communicative frame,
 * cue facts, and a free French text area. Grading is the deterministic
 * tri-state rubric; this component only renders what the policy allows —
 * learning shows the honest local feedback and the model AFTER an attempt,
 * scored shows nothing but the learner's own text before submission.
 */
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import {
  evaluateWrittenAnswer,
  isWrittenAnswer,
  type Answer,
  type Status,
} from "@/lib/grading";
import { makeThemedStyles, radius, useResolvedScheme, useThemeColors } from "@/lib/theme";
import type { GuidedWritingExercise } from "@/lib/types";

export function GuidedWriting({
  exercise,
  answer,
  status,
  scored,
  onAnswer,
}: {
  exercise: GuidedWritingExercise;
  answer: Answer;
  status: Status;
  scored: boolean;
  onAnswer: (value: Answer) => void;
}) {
  const styles = useStyles();
  const colors = useThemeColors();
  const scheme = useResolvedScheme();
  const text = isWrittenAnswer(answer) && answer.kind === "text" ? answer.text : "";
  const answered = status !== "none";
  const evaluation = answered ? evaluateWrittenAnswer(exercise, answer) : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {exercise.writingMode === "open" ? "Write freely in French" : "Write it in French"}
      </Text>
      <Text style={styles.instruction}>{exercise.instruction}</Text>

      {exercise.cueFacts ? (
        <View style={styles.cueBox} testID="writing-cues">
          {exercise.cueFacts.map((cue) => (
            <View key={cue.label} style={styles.cueRow}>
              <Text style={styles.cueLabel}>{cue.label}</Text>
              <Text style={styles.cueValue}>{cue.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <TextInput
        value={text}
        onChangeText={(next) => onAnswer({ written: true, kind: "text", text: next })}
        editable={!answered}
        placeholder="Écris ta réponse ici…"
        placeholderTextColor={colors.neutral400}
        autoCapitalize="sentences"
        autoCorrect={false}
        keyboardAppearance={scheme}
        multiline
        style={[styles.input, answered && styles.inputDone]}
        accessibilityLabel="Your French answer"
        testID="writing-input"
      />

      {answered && !scored && evaluation && evaluation.feedback.length > 0 ? (
        <View style={styles.feedbackBox} testID="writing-feedback">
          {evaluation.feedback.map((line) => (
            <Text key={line} style={styles.feedbackText}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      {answered && !scored ? (
        <View style={styles.modelBox} testID="writing-model">
          <Text style={styles.modelLabel}>One way to say it:</Text>
          <Text style={styles.modelText}>{exercise.modelAnswers[0]}</Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    container: { gap: 14 },
    title: { fontSize: 22, fontWeight: "800", color: colors.neutral700 },
    instruction: { fontSize: 16, color: colors.text, lineHeight: 22 },
    cueBox: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 6,
    },
    cueRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
    cueLabel: { fontSize: 14, fontWeight: "700", color: colors.neutral400 },
    cueValue: { fontSize: 15, fontWeight: "700", color: colors.text },
    input: {
      minHeight: 96,
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: 17,
      padding: 12,
      textAlignVertical: "top",
    },
    inputDone: { opacity: 0.8 },
    feedbackBox: { gap: 4 },
    feedbackText: { fontSize: 15, fontWeight: "600", color: colors.neutral700 },
    modelBox: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 4,
    },
    modelLabel: { fontSize: 13, fontWeight: "700", color: colors.neutral400 },
    modelText: { fontSize: 17, fontWeight: "600", color: colors.text },
  })
);
