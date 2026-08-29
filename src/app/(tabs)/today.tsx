/**
 * TODAY tab (Phase 3, French-first): one screen whose whole job is removing
 * decision fatigue — an honest preview of today's guided session and one
 * button to start it. The tab itself is hidden for courses without the
 * dailySession capability; direct navigation redirects home.
 */

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DuoButton } from "@/components/duo-button";
import { Flag } from "@/components/flag";
import { courseCapabilities } from "@/lib/capabilities";
import { useCourseContent } from "@/lib/content";
import { listenWordClipIndex } from "@/lib/reception/content";
import { speakExerciseIndex } from "@/lib/speech/content";
import {
  composeTodayFromSnapshot,
  TODAY_PRESETS,
  type TodayPreset,
} from "@/lib/learning/today";
import { currentStreak, useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

const PRESET_ORDER: TodayPreset[] = ["short", "regular", "long"];

export default function TodayScreen() {
  const colors = useThemeColors();
  const styles = useStyles();
  // Targeted selectors (§89): the preview re-renders only when the active
  // course's progress, the streak fields, or the course id change.
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const course = useProgress((s) => s.courses[s.activeCourseId]);
  const streak = useProgress((s) => currentStreak(s));
  const placementFloor = useProgress((s) => s.assessment.placementFloor);
  const { pack } = useCourseContent(activeCourseId);
  const [preset, setPreset] = useState<TodayPreset>("regular");
  // "Can't speak now" (P8 §17): per-visit choice — off composes a fully
  // silent session; the due speak cards stay honestly in the backlog.
  const [speakEnabled, setSpeakEnabled] = useState(true);

  // Preview from the ACTUAL composed plan (§31) — recomputed when reviews
  // or lesson progress change, deterministic within a day for equal state.
  const plan = useMemo(
    () =>
      composeTodayFromSnapshot({
        pack,
        completedLessons: course?.completedLessons ?? {},
        cards: course?.cards,
        preset,
        placementFloor,
        listenClips: listenWordClipIndex(),
        speakExercises: speakEnabled ? speakExerciseIndex() : undefined,
      }),
    [pack, course, preset, placementFloor, speakEnabled]
  );
  // The toggle appears only when speaking would actually be in the plan.
  const speakAvailable = useMemo(
    () =>
      speakEnabled
        ? plan.speakCount > 0
        : composeTodayFromSnapshot({
            pack,
            completedLessons: course?.completedLessons ?? {},
            cards: course?.cards,
            preset,
            placementFloor,
            listenClips: listenWordClipIndex(),
            speakExercises: speakExerciseIndex(),
          }).speakCount > 0,
    [plan.speakCount, speakEnabled, pack, course, preset, placementFloor]
  );

  if (!courseCapabilities(activeCourseId).dailySession) {
    return <Redirect href="/" />;
  }

  const caughtUp = plan.steps.length === 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.heading}>Today</Text>
        <View style={styles.courseRow}>
          <Flag courseId={activeCourseId} size={20} />
          <Text style={styles.courseLabel}>{pack.targetLanguage}</Text>
          <View style={styles.streakChip} accessibilityLabel={`Streak ${streak} days`}>
            <MaterialCommunityIcons name="fire" size={18} color={colors.orange} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        </View>

        {caughtUp ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle" size={24} color={colors.green} />
              <Text style={styles.cardTitle}>You&apos;re caught up for now.</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              No reviews are due and there&apos;s nothing new to introduce right now.
              Keep going on your path, or practice freely.
            </Text>
            <DuoButton label="Continue learning" onPress={() => router.push("/")} />
            <DuoButton
              label="Practice"
              variant="secondary"
              onPress={() => router.push("/practice")}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="sunny" size={24} color={colors.amber} />
              <Text style={styles.cardTitle}>Your session</Text>
            </View>

            <View style={styles.previewRow}>
              <PreviewStat
                icon={<MaterialCommunityIcons name="brain" size={20} color={colors.indigo} />}
                value={plan.reviewCount}
                label={plan.reviewCount === 1 ? "review" : "reviews"}
              />
              <PreviewStat
                icon={<Ionicons name="sparkles" size={20} color={colors.green} />}
                value={plan.newCount}
                label={plan.newCount === 1 ? "new word" : "new words"}
              />
              <PreviewStat
                icon={<Ionicons name="time-outline" size={20} color={colors.textMuted} />}
                value={`≈${plan.estimatedMinutes}`}
                label="min"
              />
            </View>

            {plan.backlogRemaining > 0 ? (
              <Text style={styles.backlogNote}>
                Focusing on your {plan.reviewCount} most at-risk words —{" "}
                {plan.backlogRemaining} more still waiting after this session.
              </Text>
            ) : null}

            {speakAvailable ? (
              <Pressable
                onPress={() => setSpeakEnabled((v) => !v)}
                accessibilityRole="switch"
                accessibilityState={{ checked: !speakEnabled }}
                accessibilityLabel="Can't speak right now"
                style={styles.speakToggle}
                testID="today-speak-toggle"
              >
                <Ionicons
                  name={speakEnabled ? "mic-outline" : "mic-off-outline"}
                  size={18}
                  color={speakEnabled ? colors.textMuted : colors.orange}
                />
                <Text style={styles.speakToggleText}>
                  {speakEnabled
                    ? `Includes ${plan.speakCount} speaking ${plan.speakCount === 1 ? "review" : "reviews"} — tap if you can't speak right now`
                    : "Speaking is off for this session — those reviews stay due"}
                </Text>
              </Pressable>
            ) : null}

            <View
              style={styles.presetRow}
              accessibilityRole="radiogroup"
              accessibilityLabel="Session length"
            >
              {PRESET_ORDER.map((p) => {
                const selected = preset === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPreset(p)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${TODAY_PRESETS[p].minutes} minute session`}
                    style={[styles.presetChip, selected && styles.presetChipSelected]}
                  >
                    <Text
                      style={[styles.presetText, selected && styles.presetTextSelected]}
                    >
                      {TODAY_PRESETS[p].minutes} min
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <DuoButton
              label="Start today's session"
              onPress={() =>
                router.push({
                  pathname: "/session/today",
                  params: { preset, speak: speakEnabled ? "1" : "0" },
                })
              }
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PreviewStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.previewStat} accessibilityLabel={`${value} ${label}`}>
      {icon}
      <Text style={styles.previewValue}>{value}</Text>
      <Text style={styles.previewLabel}>{label}</Text>
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    body: { padding: 20, gap: 16, paddingBottom: 40 },
    heading: { fontSize: 30, fontWeight: "800", color: colors.neutral700 },
    courseRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    courseLabel: { fontSize: 15, fontWeight: "700", color: colors.textMuted },
    streakChip: {
      marginLeft: "auto",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.neutral200,
    },
    streakText: { fontSize: 15, fontWeight: "800", color: colors.orange },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: colors.neutral200,
      padding: 16,
      gap: 14,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    cardTitle: { fontSize: 18, fontWeight: "800", color: colors.neutral700, flexShrink: 1 },
    cardSubtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    previewRow: { flexDirection: "row", justifyContent: "space-around" },
    previewStat: { alignItems: "center", gap: 2, minWidth: 80 },
    previewValue: { fontSize: 22, fontWeight: "800", color: colors.neutral700 },
    previewLabel: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
    backlogNote: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    speakToggle: { flexDirection: "row", alignItems: "center", gap: 8 },
    speakToggleText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    presetRow: { flexDirection: "row", gap: 8 },
    presetChip: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.background,
    },
    presetChipSelected: { borderColor: colors.greenDark, backgroundColor: colors.correctBg },
    presetText: { fontSize: 14, fontWeight: "700", color: colors.textMuted },
    presetTextSelected: { color: colors.greenDark },
  })
);
