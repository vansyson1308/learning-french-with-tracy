/**
 * Checkpoint results (§112-113): what you're strong in, what to review,
 * what wasn't sufficiently sampled — can-do wording, neutral tone, never
 * "failed". Zero XP, no confetti economics; retake is allowed (§111).
 */
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DuoButton } from "@/components/duo-button";
import { objectiveFor, splitObjectiveResults } from "@/lib/assessment/content";
import type { CheckpointAttempt } from "@/lib/assessment/types";
import { makeThemedStyles, radius } from "@/lib/theme";

function titleFor(objectiveId: string): string {
  return objectiveFor(objectiveId)?.title ?? objectiveId;
}

export function CheckpointResults({
  attempt,
  checkpointTitle,
  onDone,
}: {
  attempt: CheckpointAttempt;
  checkpointTitle: string;
  onDone: () => void;
}) {
  const styles = useStyles();
  const { strong, review, thin } = splitObjectiveResults(attempt.objectiveResults);
  const correct = attempt.itemResults.filter((r) => r.correct === true).length;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{checkpointTitle}</Text>
        <Text style={styles.subtitle}>
          {correct} of {attempt.itemResults.length} on the first try
        </Text>

        {strong.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>You&apos;re strong in</Text>
            {strong.map((r) => (
              <Text key={r.objectiveId} style={styles.rowStrong}>
                ✓ {titleFor(r.objectiveId)}
              </Text>
            ))}
          </View>
        )}

        {review.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Worth reviewing</Text>
            {review.map((r) => (
              <Text key={r.objectiveId} style={styles.rowReview}>
                • {titleFor(r.objectiveId)} ({r.correct}/{r.total})
              </Text>
            ))}
          </View>
        )}

        {thin.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Not enough questions to tell</Text>
            {thin.map((r) => (
              <Text key={r.objectiveId} style={styles.rowThin}>
                · {titleFor(r.objectiveId)}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.note}>
          This check is a course diagnostic — it guides what to practice next.
          You can retake it from the path any time.
        </Text>

        <DuoButton label="Done" onPress={onDone} />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 14 },
    title: { fontSize: 26, fontWeight: "800", color: colors.text },
    subtitle: { fontSize: 16, fontWeight: "600", color: colors.textMuted },
    group: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 8,
    },
    groupTitle: { fontSize: 14, fontWeight: "800", color: colors.neutral700 },
    rowStrong: { fontSize: 15, fontWeight: "600", color: colors.greenDark },
    rowReview: { fontSize: 15, fontWeight: "600", color: colors.text },
    rowThin: { fontSize: 15, color: colors.textMuted },
    note: { fontSize: 13, color: colors.textMuted },
  })
);
