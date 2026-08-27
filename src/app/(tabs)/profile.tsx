import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Flag } from "@/components/flag";
import {
  commitImport,
  exportProgress,
  pickBackupFile,
  prepareImport,
} from "@/lib/backup";
import { useCourseContent } from "@/lib/content";
import {
  currentStreak,
  dailyXpToday,
  lastSevenDays,
  useProgress,
  type ThemePreference,
} from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "system", label: "Device", icon: "phone-portrait-outline" },
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
];

export default function ProfileScreen() {
  const colors = useThemeColors();
  const styles = useStyles();
  const progress = useProgress();
  const { themePreference, setThemePreference } = progress;
  const { activeCourseId, dailyGoal } = progress;
  const courseProgress = progress.course();
  const { pack, allLessons, allWords } = useCourseContent(activeCourseId);
  const todayXp = dailyXpToday(progress);
  const streak = currentStreak(progress);
  const week = lastSevenDays(progress);

  const lessonsDone = Object.keys(courseProgress.completedLessons).filter((id) =>
    allLessons.some((l) => l.lesson.id === id)
  ).length;
  const wordsLearned = Object.keys(courseProgress.wordStats).filter((target) =>
    allWords().some((w) => w.target === target)
  ).length;

  const stats = [
    {
      label: "Day streak",
      value: `${streak}`,
      icon: <MaterialCommunityIcons name="fire" size={28} color={colors.orange} />,
    },
    {
      label: "Course XP",
      value: `${courseProgress.xp}`,
      icon: <Ionicons name="flash" size={26} color={colors.skyDark} />,
    },
    {
      label: "Today's XP",
      value: `${todayXp}/${dailyGoal}`,
      icon: (
        <MaterialCommunityIcons name="bullseye-arrow" size={27} color={colors.amber} />
      ),
    },
    {
      label: "To review",
      value: `${courseProgress.mistakes.length}`,
      icon: <Ionicons name="refresh-circle" size={26} color={colors.rose} />,
    },
    {
      label: "Lessons done",
      value: `${lessonsDone}/${allLessons.length}`,
      icon: <Ionicons name="checkmark-circle" size={26} color={colors.green} />,
    },
    {
      label: "Words learned",
      value: `${wordsLearned}`,
      icon: <Ionicons name="book" size={26} color={colors.indigo} />,
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/mascot.svg")}
            style={styles.mascot}
            contentFit="contain"
          />
          <Text style={styles.name}>My Progress</Text>
          <Pressable onPress={() => router.push("/courses")} style={styles.courseRow}>
            <Text style={styles.subtitle}>Learning</Text>
            <Flag courseId={activeCourseId} size={18} />
            <Text style={styles.subtitle}>{pack.targetLanguage}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switch}>Switch</Text>
              <Ionicons name="chevron-down" size={12} color={colors.green} />
            </View>
          </Pressable>
        </View>

        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <MaterialCommunityIcons
              name="fire"
              size={22}
              color={streak > 0 ? colors.orange : colors.neutral300}
            />
            <Text style={styles.weekTitle} maxFontSizeMultiplier={1.3}>
              {streak > 0
                ? `${streak} day streak`
                : "Complete a lesson to start a streak"}
            </Text>
          </View>
          <View style={styles.weekRow}>
            {week.map((d) => (
              <View key={d.day} style={styles.weekDay}>
                <Text style={styles.weekLabel} maxFontSizeMultiplier={1.2}>
                  {d.weekday}
                </Text>
                <View
                  style={[
                    styles.weekDot,
                    d.active && styles.weekDotActive,
                    d.isToday && styles.weekDotToday,
                  ]}
                >
                  {d.active ? (
                    <Ionicons name="checkmark-sharp" size={16} color={colors.white} />
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.grid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              {stat.icon}
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingsHeader}>
            <Ionicons name="color-palette-outline" size={22} color={colors.indigo} />
            <Text style={styles.settingsTitle}>Appearance</Text>
          </View>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((option) => {
              const active = themePreference === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setThemePreference(option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label} theme`}
                  accessibilityState={{ selected: active }}
                  style={[styles.themeChip, active && styles.themeChipActive]}
                >
                  <Ionicons
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={active ? colors.greenDark : colors.textMuted}
                  />
                  <Text style={[styles.themeLabel, active && styles.themeLabelActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.settingsHint}>
            Device follows your phone&apos;s light or dark setting.
          </Text>
        </View>

        <DataCard />
      </ScrollView>
    </SafeAreaView>
  );
}

function DataCard() {
  const colors = useThemeColors();
  const styles = useStyles();
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    setBusy(true);
    const result = await exportProgress();
    setBusy(false);
    if (!result.ok) Alert.alert("Export failed", result.reason);
  };

  const onImport = async () => {
    setBusy(true);
    const picked = await pickBackupFile();
    setBusy(false);
    if (picked.kind === "canceled") return;
    if (picked.kind === "error") {
      Alert.alert("Import failed", picked.reason);
      return;
    }
    const staged = prepareImport(picked.raw);
    if (!staged.ok) {
      Alert.alert("Import failed", staged.reason);
      return;
    }
    const courseCount = Object.keys(staged.state.courses).length;
    Alert.alert(
      "Replace progress?",
      `This replaces your current progress with the backup (${courseCount} ` +
        `course${courseCount === 1 ? "" : "s"}, ${staged.state.streak}-day ` +
        "streak). A safety copy of your current progress is saved first.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            const result = await commitImport(staged.state);
            setBusy(false);
            if (result.ok) Alert.alert("Progress imported");
            else Alert.alert("Import failed", result.reason);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.settingsCard}>
      <View style={styles.settingsHeader}>
        <Ionicons name="archive-outline" size={22} color={colors.skyDark} />
        <Text style={styles.settingsTitle}>Data</Text>
      </View>
      <Pressable
        onPress={onExport}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Export progress"
        style={styles.dataRow}
      >
        <Ionicons name="download-outline" size={20} color={colors.green} />
        <View style={styles.dataRowText}>
          <Text style={styles.dataRowTitle}>Export progress</Text>
          <Text style={styles.settingsHint}>Save a backup file of everything.</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
      <Pressable
        onPress={onImport}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Import progress"
        style={styles.dataRow}
      >
        <Ionicons name="cloud-upload-outline" size={20} color={colors.indigo} />
        <View style={styles.dataRowText}>
          <Text style={styles.dataRowTitle}>Import progress</Text>
          <Text style={styles.settingsHint}>Restore from a backup file.</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
      <Pressable
        onPress={() => router.push("/licenses")}
        accessibilityRole="button"
        accessibilityLabel="Licenses and attributions"
        style={styles.dataRow}
      >
        <Ionicons name="document-text-outline" size={20} color={colors.skyDark} />
        <View style={styles.dataRowText}>
          <Text style={styles.dataRowTitle}>Licenses &amp; attributions</Text>
          <Text style={styles.settingsHint}>Software notices and data sources.</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20, gap: 20, paddingBottom: 60 },
  header: { alignItems: "center", gap: 8, paddingTop: 12 },
  mascot: { width: 110, height: 110 },
  name: { fontSize: 26, fontWeight: "800", color: colors.neutral700 },
  courseRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  subtitle: { fontSize: 14, color: colors.textMuted },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 6,
  },
  switch: { fontSize: 13, fontWeight: "700", color: colors.green },
  weekCard: {
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderRadius: radius.xl,
    padding: 16,
    gap: 14,
  },
  weekHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  weekTitle: { fontSize: 16, fontWeight: "800", color: colors.neutral700 },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  weekDay: { alignItems: "center", gap: 6 },
  weekLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  weekDot: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.neutral200,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDotActive: { backgroundColor: colors.orange },
  weekDotToday: { borderWidth: 2, borderColor: colors.orange },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderRadius: radius.lg,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.neutral700 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  settingsCard: {
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderRadius: radius.xl,
    padding: 16,
    gap: 12,
  },
  settingsHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingsTitle: { fontSize: 16, fontWeight: "800", color: colors.neutral700 },
  themeRow: { flexDirection: "row", gap: 10 },
  themeChip: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderRadius: radius.lg,
    paddingVertical: 12,
  },
  themeChipActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight + "22",
  },
  themeLabel: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  themeLabelActive: { color: colors.greenDark },
  settingsHint: { fontSize: 12, color: colors.textMuted },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  dataRowText: { flex: 1, gap: 2 },
  dataRowTitle: { fontSize: 15, fontWeight: "700", color: colors.neutral700 },
}));
