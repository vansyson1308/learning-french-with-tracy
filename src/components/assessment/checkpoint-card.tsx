/**
 * PATH checkpoint entry (§109-111): appears after a section's units for
 * French. Locked until every lesson of the section is completed; once
 * attempted, shows the latest result briefly. A checkpoint guides — it
 * never blocks the next section (§114).
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { checkpointForSection } from "@/lib/assessment/content";
import type { CheckpointAttempt } from "@/lib/assessment/types";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export function CheckpointCard({
  sectionId,
  sectionComplete,
  attempts,
}: {
  sectionId: string;
  sectionComplete: boolean;
  attempts: CheckpointAttempt[];
}) {
  const styles = useStyles();
  const colors = useThemeColors();
  const checkpoint = checkpointForSection(sectionId);
  if (!checkpoint) return null;

  const latest = [...attempts]
    .filter((a) => a.checkpointId === checkpoint.id)
    .sort((a, b) => a.completedAt - b.completedAt)
    .pop();
  const demonstrated = latest
    ? latest.objectiveResults.filter((r) => r.result === "demonstrated").length
    : 0;
  const locked = !sectionComplete;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${checkpoint.title}${locked ? ", locked" : ""}`}
      disabled={locked}
      onPress={() => router.push(`/checkpoint/${checkpoint.id}`)}
      style={[styles.card, locked && styles.cardLocked]}
      testID={`checkpoint-card-${checkpoint.id}`}
    >
      <Ionicons
        name={locked ? "lock-closed" : latest ? "ribbon" : "flag"}
        size={22}
        color={locked ? colors.neutral400 : colors.skyDark}
      />
      <View style={styles.body}>
        <Text style={[styles.title, locked && styles.titleLocked]}>{checkpoint.title}</Text>
        <Text style={styles.subtitle}>
          {locked
            ? "Finish this section's lessons to unlock"
            : latest
              ? `Last check: ${demonstrated} of ${latest.objectiveResults.length} goals demonstrated — retake any time`
              : checkpoint.description}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
      padding: 14,
      marginTop: 8,
      marginBottom: 18,
    },
    cardLocked: { opacity: 0.6 },
    body: { flex: 1, gap: 2 },
    title: { fontSize: 16, fontWeight: "800", color: colors.text },
    titleLocked: { color: colors.neutral400 },
    subtitle: { fontSize: 13, color: colors.textMuted },
  })
);
