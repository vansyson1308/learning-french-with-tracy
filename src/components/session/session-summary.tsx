/**
 * Session finish screen, shared by every session kind. Lesson/replay/
 * review/mistakes render exactly the pre-Phase-3 visuals; TODAY adds its
 * honest stats (reviews, new words, first-attempt accuracy, bounded XP).
 */

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { DuoButton } from "@/components/duo-button";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";
import { XP_PERFECT_BONUS, XP_PER_LESSON } from "@/lib/store";
import type { SessionKind } from "@/lib/session/types";

export type TodaySummaryStats = {
  reviewsCompleted: number;
  newWordsIntroduced: number;
  /** First-attempt accuracy in [0,1]; null when nothing was attempted. */
  firstAttemptAccuracy: number | null;
  xpEarned: number;
  /** Due cards still waiting after this session. */
  remainingBacklog: number;
};

const TITLES: Record<SessionKind, string> = {
  path: "Lesson complete!",
  replay: "Lesson complete!",
  review: "Review complete!",
  mistakes: "Mistakes conquered!",
  today: "That's today, done!",
  // Scored assessments route to their own result screens; these fire only
  // if the generic summary ever renders for them.
  checkpoint: "Check complete!",
  placement: "Check complete!",
};

export function SessionSummary({
  kind,
  correctCount,
  perfect,
  streak,
  todayStats,
  onDone,
}: {
  kind: SessionKind;
  correctCount: number;
  perfect: boolean;
  streak: number;
  todayStats?: TodaySummaryStats;
  onDone: () => void;
}) {
  const colors = useThemeColors();
  const styles = useStyles();
  const isLesson = kind === "path";

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        <Animated.View entering={ZoomIn.springify().damping(12)}>
          <Image
            source={require("@/assets/images/mascot.svg")}
            style={styles.finishMascot}
            contentFit="contain"
          />
        </Animated.View>
        <Animated.Text entering={FadeInUp.delay(150)} style={styles.finishTitle}>
          {TITLES[kind]}
        </Animated.Text>

        {kind === "today" && todayStats ? (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.todayStats}>
            <View style={styles.resultRow}>
              <ResultCard
                label="Reviews"
                value={`${todayStats.reviewsCompleted}`}
                icon={<MaterialCommunityIcons name="brain" size={20} color={colors.indigo} />}
                color={colors.indigo}
              />
              <ResultCard
                label="New words"
                value={`${todayStats.newWordsIntroduced}`}
                icon={<Ionicons name="sparkles" size={20} color={colors.green} />}
                color={colors.green}
              />
            </View>
            <View style={styles.resultRow}>
              <ResultCard
                label="XP"
                value={`${todayStats.xpEarned}`}
                icon={<Ionicons name="flash" size={20} color={colors.amber} />}
                color={colors.amber}
              />
              <ResultCard
                label="Streak"
                value={`${streak}`}
                icon={
                  <MaterialCommunityIcons name="fire" size={22} color={colors.orange} />
                }
                color={colors.orange}
              />
            </View>
            {todayStats.firstAttemptAccuracy !== null ? (
              <Text style={styles.accuracyNote}>
                First-try accuracy:{" "}
                {Math.round(todayStats.firstAttemptAccuracy * 100)}%
              </Text>
            ) : null}
            {todayStats.remainingBacklog > 0 ? (
              <Text style={styles.backlogNote}>
                {todayStats.remainingBacklog} review
                {todayStats.remainingBacklog === 1 ? "" : "s"} still waiting — start
                another session any time.
              </Text>
            ) : null}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.resultRow}>
            {isLesson ? (
              <ResultCard
                label="Total XP"
                value={`${XP_PER_LESSON + (perfect ? XP_PERFECT_BONUS : 0)}`}
                icon={<Ionicons name="flash" size={20} color={colors.amber} />}
                color={colors.amber}
              />
            ) : (
              <ResultCard
                label="Reviewed"
                value={`${correctCount}`}
                icon={<Ionicons name="checkmark-done" size={20} color={colors.green} />}
                color={colors.green}
              />
            )}
            <ResultCard
              label="Streak"
              value={`${streak}`}
              icon={
                <MaterialCommunityIcons name="fire" size={22} color={colors.orange} />
              }
              color={colors.orange}
            />
          </Animated.View>
        )}

        {perfect && isLesson ? (
          <Animated.Text entering={FadeInUp.delay(450)} style={styles.perfect}>
            Perfect lesson! +{XP_PERFECT_BONUS} XP
          </Animated.Text>
        ) : null}
        <Animated.View entering={FadeInUp.delay(450)} style={{ alignSelf: "stretch" }}>
          <DuoButton label="Continue" onPress={onDone} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function ResultCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color: string;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.resultCard, { borderColor: color }]}>
      <View style={[styles.resultCardHeader, { backgroundColor: color }]}>
        <Text style={styles.resultCardLabel}>{label}</Text>
      </View>
      <View style={styles.resultCardBody}>
        {icon}
        <Text style={[styles.resultCardValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 18,
    },
    finishMascot: { width: 130, height: 130 },
    finishTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.neutral700,
      textAlign: "center",
    },
    perfect: { fontSize: 15, fontWeight: "700", color: colors.amber },
    todayStats: { alignItems: "center", gap: 14 },
    accuracyNote: { fontSize: 15, fontWeight: "700", color: colors.neutral700 },
    backlogNote: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
      paddingHorizontal: 12,
    },
    resultRow: { flexDirection: "row", gap: 14 },
    resultCard: {
      borderWidth: 2,
      borderRadius: radius.lg,
      overflow: "hidden",
      minWidth: 130,
    },
    resultCardHeader: { paddingVertical: 6, alignItems: "center" },
    resultCardLabel: {
      color: colors.white,
      fontWeight: "800",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    resultCardBody: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    resultCardValue: {
      textAlign: "center",
      fontSize: 22,
      fontWeight: "800",
    },
  })
);
