/**
 * French goals (§90-97): every course objective in can-do language, grouped
 * by honest evidence state — demonstrated (checkpoint evidence only, §38),
 * estimated (placement only, §40), worth practicing, in progress, not
 * started. The overall CEFR line never claims a level (§94-95); the CEFR
 * disclaimer surface lives here (§12, §96). Placement management (§86).
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CloseButton } from "@/components/close-button";
import { allObjectives } from "@/lib/assessment/content";
import {
  deriveObjectiveStates,
  objectiveLessonMap,
  type ObjectiveLearnerState,
} from "@/lib/assessment/states";
import { useCourseContent } from "@/lib/content";
import { exitScreen } from "@/lib/navigation";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

const GROUPS: {
  state: ObjectiveLearnerState;
  title: string;
  hint?: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { state: "demonstrated", title: "Demonstrated in a checkpoint", icon: "ribbon" },
  {
    state: "estimated",
    title: "Estimated from your placement",
    hint: "Estimates only — a checkpoint can confirm them.",
    icon: "compass",
  },
  { state: "needs_practice", title: "Worth practicing", icon: "barbell" },
  { state: "learning", title: "In progress", icon: "footsteps" },
  { state: "not_started", title: "Not started yet", icon: "ellipse-outline" },
];

export default function GoalsScreen() {
  const styles = useStyles();
  const colors = useThemeColors();
  const progress = useProgress();
  const { pack, getLesson } = useCourseContent("fr-en");
  const frCourse = progress.courses["fr-en"];

  const objectives = allObjectives();
  const states = deriveObjectiveStates({
    objectiveIds: objectives.map((o) => o.id),
    objectiveLessons: objectiveLessonMap(pack),
    completedLessons: frCourse?.completedLessons ?? {},
    checkpointAttempts: progress.assessment.checkpointAttempts,
    placement: progress.assessment.placement,
  });

  const placement = progress.assessment.placement;
  const floor = progress.assessment.placementFloor;
  const floorRef =
    floor > 0 ? getLesson(placement?.recommendedLessonId ?? "") : undefined;

  const onResetFloor = () => {
    const doReset = () => progress.resetPlacement();
    const message =
      "Your path will start from the very beginning again. Nothing else changes — no progress is lost.";
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`Reset starting point?\n\n${message}`)) {
        doReset();
      }
      return;
    }
    Alert.alert("Reset starting point?", message, [
      { text: "Keep it", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: doReset },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <CloseButton onPress={() => exitScreen()} />
        <Text style={styles.headerTitle}>Your French goals</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.overallCard} testID="overall-level-card">
          <Text style={styles.overallLabel}>Overall CEFR level</Text>
          <Text style={styles.overallValue}>Not assessed yet</Text>
          <Text style={styles.overallNote}>
            This course checks specific goals, not a whole level. A CEFR level
            covers listening, reading, speaking and writing together — more
            than these checks measure. An official level comes only from an
            accredited examination.
          </Text>
        </View>

        <View style={styles.placementCard}>
          <Text style={styles.groupTitle}>Starting point</Text>
          {placement ? (
            <>
              <Text style={styles.rowText}>
                {floor > 0 && floorRef
                  ? `Starting from ${floorRef.unit.title} — ${floorRef.lesson.title}.`
                  : "Starting from the beginning."}
              </Text>
              {floor > 0 ? (
                <Pressable
                  onPress={onResetFloor}
                  accessibilityRole="button"
                  accessibilityLabel="Reset starting point"
                  style={styles.linkRow}
                  testID="reset-floor"
                >
                  <Ionicons name="refresh" size={16} color={colors.roseDark} />
                  <Text style={[styles.linkText, { color: colors.roseDark }]}>
                    Reset starting point
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Text style={styles.rowText}>
              You haven&apos;t taken the starting-point check.
            </Text>
          )}
          <Pressable
            onPress={() => router.push("/placement/intro")}
            accessibilityRole="button"
            accessibilityLabel={
              placement ? "Retake the starting-point check" : "Find your starting point"
            }
            style={styles.linkRow}
          >
            <Ionicons name="compass" size={16} color={colors.skyDark} />
            <Text style={[styles.linkText, { color: colors.skyDark }]}>
              {placement ? "Retake the check" : "Find your starting point"}
            </Text>
          </Pressable>
        </View>

        {GROUPS.map((group) => {
          const members = objectives.filter((o) => states[o.id] === group.state);
          if (members.length === 0) return null;
          return (
            <View key={group.state} style={styles.group} testID={`goal-group-${group.state}`}>
              <View style={styles.groupHeader}>
                <Ionicons name={group.icon} size={18} color={colors.neutral700} />
                <Text style={styles.groupTitle}>{group.title}</Text>
              </View>
              {group.hint ? <Text style={styles.groupHint}>{group.hint}</Text> : null}
              {members.map((o) => (
                <View key={o.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{o.title}</Text>
                  <Text style={styles.rowText}>{o.canDo}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.disclaimer}>
          Goals only count as demonstrated after a checkpoint; the
          starting-point check gives estimates. Goal alignments in this app
          are CEFR-aligned estimates — not an official CEFR examination or
          certification.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    headerTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
    content: { padding: 20, gap: 14, paddingBottom: 50 },
    overallCard: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 6,
    },
    overallLabel: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.textMuted,
      textTransform: "uppercase",
    },
    overallValue: { fontSize: 20, fontWeight: "800", color: colors.text },
    overallNote: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    placementCard: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 8,
    },
    group: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 10,
    },
    groupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    groupTitle: { fontSize: 14, fontWeight: "800", color: colors.neutral700 },
    groupHint: { fontSize: 12, color: colors.textMuted },
    row: { gap: 2 },
    rowTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
    rowText: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    linkRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
    linkText: { fontSize: 14, fontWeight: "700" },
    disclaimer: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  })
);
