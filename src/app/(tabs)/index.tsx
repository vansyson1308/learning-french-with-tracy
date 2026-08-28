import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Flag } from "@/components/flag";
import { useCourseContent } from "@/lib/content";
import {
  activeToday,
  currentLessonIndex,
  currentStreak,
  dailyXpToday,
  useProgress,
} from "@/lib/store";
import { CheckpointCard } from "@/components/assessment/checkpoint-card";
import { makeThemedStyles, radius, unitPalette, useThemeColors } from "@/lib/theme";

function indentFor(index: number) {
  const cycleIndex = index % 8;
  let level: number;
  if (cycleIndex <= 2) level = cycleIndex;
  else if (cycleIndex <= 4) level = 4 - cycleIndex;
  else if (cycleIndex <= 6) level = 4 - cycleIndex;
  else level = cycleIndex - 8;
  return level * 40;
}

export default function LearnScreen() {
  const colors = useThemeColors();
  const styles = useStyles();
  const progress = useProgress();
  const { activeCourseId, dailyGoal } = progress;
  const courseProgress = progress.course();
  const { pack, allLessons } = useCourseContent(activeCourseId);
  const todayXp = dailyXpToday(progress);
  const goalPct = Math.min(100, (todayXp / dailyGoal) * 100);
  const lessonIds = allLessons.map((l) => l.lesson.id);
  // The placement floor is a French-course concept (§81-89); other courses
  // always see floor 0 — their behavior is untouched.
  const placementFloor =
    activeCourseId === "fr-en" ? progress.assessment.placementFloor : 0;
  const currentIndex = currentLessonIndex(
    courseProgress.completedLessons,
    lessonIds,
    placementFloor
  );
  const streak = currentStreak(progress);
  const streakLit = activeToday(progress);
  // Offer "Find your starting point" to fresh French learners (§69-70):
  // no placement yet, nothing completed yet.
  const showPlacementEntry =
    activeCourseId === "fr-en" &&
    !progress.assessment.placement &&
    Object.keys(courseProgress.completedLessons).length === 0;

  // Units cycle through the palette across the whole course.
  const unitColor = new Map<string, (typeof unitPalette)[number]>();
  pack.sections.forEach((section) =>
    section.units.forEach((unit) =>
      unitColor.set(unit.id, unitPalette[unitColor.size % unitPalette.length])
    )
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.statsBar}>
        <Pressable
          style={styles.coursePicker}
          onPress={() => router.push("/courses")}
          accessibilityRole="button"
          accessibilityLabel={`Course: ${pack.targetLanguage}. Switch course`}
        >
          <Flag courseId={activeCourseId} size={30} />
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </Pressable>
        <Stat
          icon={
            <MaterialCommunityIcons
              name="fire"
              size={24}
              color={streakLit ? colors.orange : colors.neutral300}
            />
          }
          value={streak}
          color={streakLit ? colors.orange : colors.neutral400}
        />
        <Stat
          icon={<Ionicons name="flash" size={21} color={colors.skyDark} />}
          value={courseProgress.xp}
          color={colors.skyDark}
        />
      </View>

      <View style={styles.goalBar}>
        <View style={styles.goalTrack}>
          <View style={[styles.goalFill, { width: `${goalPct}%` }]} />
        </View>
        <Text style={styles.goalLabel} maxFontSizeMultiplier={1.3}>
          {todayXp}/{dailyGoal} XP today
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.path}>
        {showPlacementEntry ? (
          <Pressable
            style={styles.placementCard}
            onPress={() => router.push("/placement/intro")}
            accessibilityRole="button"
            accessibilityLabel="Studied French before? Find your starting point"
            testID="placement-entry-card"
          >
            <Ionicons name="compass" size={24} color={colors.skyDark} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.placementTitle}>Studied French before?</Text>
              <Text style={styles.placementSubtitle}>
                Take a short check to find your starting point.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
        {pack.sections.map((section) => (
          <View key={section.id}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.units.map((unit) => {
              const unitLessons = allLessons.filter((l) => l.unit.id === unit.id);
              const color = unitColor.get(unit.id) ?? unitPalette[0];
              return (
                <View key={unit.id}>
                  <View style={[styles.banner, { backgroundColor: color.main }]}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.bannerTitle}>{unit.title}</Text>
                      <Text style={styles.bannerSubtitle}>{unit.description}</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.guidebookButton,
                        { backgroundColor: color.dark },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => router.push(`/guidebook/${unit.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`${unit.title} guidebook`}
                    >
                      <Ionicons name="book" size={22} color={colors.white} />
                    </Pressable>
                  </View>

                  <View style={styles.nodes}>
                    {unitLessons.map((ref, i) => {
                      const isCompleted = !!courseProgress.completedLessons[ref.lesson.id];
                      const isCurrent = ref.globalIndex === currentIndex;
                      const isLocked = ref.globalIndex > currentIndex;
                      // Placement-cleared (§84): before the accepted floor,
                      // not completed — open for review, visually distinct
                      // from BOTH completed and untouched.
                      const isCleared =
                        !isCompleted && ref.globalIndex < placementFloor;
                      const isLastInUnit = i === unitLessons.length - 1;
                      return (
                        <LessonNode
                          key={ref.lesson.id}
                          offset={indentFor(i)}
                          completed={isCompleted}
                          cleared={isCleared}
                          current={isCurrent}
                          locked={isLocked}
                          crown={isLastInUnit}
                          color={color}
                          label={`${unit.title}, lesson ${i + 1} of ${unitLessons.length}`}
                          onPress={() => router.push(`/lesson/${ref.lesson.id}`)}
                        />
                      );
                    })}
                  </View>
                </View>
              );
            })}
            {activeCourseId === "fr-en" ? (
              <CheckpointCard
                sectionId={section.id}
                sectionComplete={section.units
                  .flatMap((u) => u.lessons)
                  .every((l) => !!courseProgress.completedLessons[l.id])}
                attempts={progress.assessment.checkpointAttempts}
              />
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  icon,
  value,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  color: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      {icon}
      <Text style={[styles.statValue, { color }]} maxFontSizeMultiplier={1.2}>
        {value}
      </Text>
    </View>
  );
}

function LessonNode({
  offset,
  completed,
  cleared,
  current,
  locked,
  crown,
  color,
  label,
  onPress,
}: {
  offset: number;
  completed: boolean;
  /** Placement-cleared (§84): open for review, never marked complete. */
  cleared: boolean;
  current: boolean;
  locked: boolean;
  crown: boolean;
  color: { main: string; dark: string };
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const styles = useStyles();
  const iconColor = locked ? colors.neutral400 : colors.white;
  const icon = completed ? (
    <Ionicons name="checkmark-sharp" size={34} color={iconColor} />
  ) : cleared ? (
    <MaterialCommunityIcons name="fast-forward" size={32} color={iconColor} />
  ) : locked ? (
    crown ? (
      <MaterialCommunityIcons name="crown" size={32} color={iconColor} />
    ) : (
      <Ionicons name="lock-closed" size={26} color={iconColor} />
    )
  ) : crown ? (
    <MaterialCommunityIcons name="crown" size={32} color={iconColor} />
  ) : (
    <Ionicons name="star" size={30} color={iconColor} />
  );
  return (
    <View style={[styles.nodeRow, { transform: [{ translateX: -offset }] }]}>
      {current && (
        <BobbingBubble>
          <Text style={[styles.startText, { color: color.main }]}>START</Text>
          <View style={styles.startArrow} />
        </BobbingBubble>
      )}
      <Pressable
        disabled={locked}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: locked, selected: current }}
        accessibilityHint={
          locked
            ? "Locked. Complete earlier lessons first."
            : completed
              ? "Completed. Practice again."
              : cleared
                ? "Cleared by your placement check. Review any time."
                : "Start this lesson."
        }
        style={({ pressed }) => [
          styles.node,
          locked
            ? styles.nodeLocked
            : { backgroundColor: color.main, borderColor: color.dark },
          cleared && styles.nodeCleared,
          { borderBottomWidth: pressed ? 2 : 8 },
        ]}
      >
        {icon}
      </Pressable>
    </View>
  );
}

/** Duolingo-style gentle up/down bob for the START callout. */
function BobbingBubble({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.set(
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 600 }),
          withTiming(0, { duration: 600 })
        ),
        -1
      )
    );
  }, [bob]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.get() }],
  }));
  return (
    <Animated.View style={[styles.startBubble, style]}>{children}</Animated.View>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral200,
  },
  coursePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 5 },
  statValue: { fontSize: 16, fontWeight: "800" },
  goalBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  goalTrack: {
    flex: 1,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.neutral200,
    overflow: "hidden",
  },
  goalFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: colors.amber,
  },
  goalLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, minWidth: 88 },
  path: { padding: 16, paddingBottom: 60 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.green,
    borderRadius: radius.xl,
    padding: 18,
    marginTop: 20,
    gap: 12,
  },
  bannerTitle: { color: colors.white, fontSize: 20, fontWeight: "800" },
  bannerSubtitle: { color: colors.white, fontSize: 14, opacity: 0.9 },
  guidebookButton: {
    backgroundColor: colors.greenDark,
    borderRadius: radius.md,
    padding: 10,
  },
  nodes: { alignItems: "center", paddingVertical: 8 },
  nodeRow: { alignItems: "center", marginTop: 26 },
  node: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeLocked: { backgroundColor: colors.neutral200, borderColor: colors.neutral400 },
  nodeCleared: { opacity: 0.65 },
  placementCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.skyDark,
    backgroundColor: colors.surface,
    padding: 14,
    marginBottom: 10,
  },
  placementTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  placementSubtitle: { fontSize: 13, color: colors.textMuted },
  startBubble: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    zIndex: 1,
  },
  startText: {
    color: colors.green,
    fontWeight: "800",
    letterSpacing: 1,
    fontSize: 13,
  },
  startArrow: {
    position: "absolute",
    bottom: -7,
    left: "50%",
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.surface,
  },
}));
