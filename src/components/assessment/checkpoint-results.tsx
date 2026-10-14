/**
 * Checkpoint results (§112-113): what you're strong in, what to review,
 * what wasn't sufficiently sampled — can-do wording, neutral tone, never
 * "failed". Zero XP, no confetti economics; retake is allowed (§111).
 */
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useT } from "@/lib/i18n";
import { DuoButton } from "@/components/duo-button";
import { objectiveFor, splitObjectiveResults } from "@/lib/assessment/content";
import type { CheckpointAttempt } from "@/lib/assessment/types";
import { makeThemedStyles, radius } from "@/lib/theme";

function titleFor(courseId: string, objectiveId: string): string {
  return objectiveFor(courseId, objectiveId)?.title ?? objectiveId;
}

export function CheckpointResults({
  courseId,
  attempt,
  checkpointTitle,
  onDone,
}: {
  courseId: string;
  attempt: CheckpointAttempt;
  checkpointTitle: string;
  onDone: () => void;
}) {
  const styles = useStyles();
  const { t } = useT();
  const { strong, review, thin } = splitObjectiveResults(attempt.objectiveResults);
  const correct = attempt.itemResults.filter((r) => r.correct === true).length;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{checkpointTitle}</Text>
        <Text style={styles.subtitle}>{t("checkpointResults.firstTry", { correct, total: attempt.itemResults.length })}</Text>

        {strong.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t("checkpointResults.strong")}</Text>
            {strong.map((r) => (
              <Text key={r.objectiveId} style={styles.rowStrong}>
                ✓ {titleFor(courseId, r.objectiveId)}
              </Text>
            ))}
          </View>
        )}

        {review.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t("checkpointResults.review")}</Text>
            {review.map((r) => (
              <Text key={r.objectiveId} style={styles.rowReview}>
                • {titleFor(courseId, r.objectiveId)} ({r.correct}/{r.total})
              </Text>
            ))}
          </View>
        )}

        {thin.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t("checkpointResults.thin")}</Text>
            {thin.map((r) => (
              <Text key={r.objectiveId} style={styles.rowThin}>
                · {titleFor(courseId, r.objectiveId)}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.note}>{t("checkpointResults.note")}</Text>

        <DuoButton label={t("common.done")} onPress={onDone} />
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
