import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useT } from "@/lib/i18n";
import { Flag } from "@/components/flag";
import {
  commitImport,
  exportProgress,
  pickBackupFile,
  prepareImport,
} from "@/lib/backup";
import { useCourseContent } from "@/lib/content";
import { courseProfile, hasCapability } from "@/lib/course-profile";
import type { UiLanguagePreference } from "@/lib/persistence/migrations";
import {
  currentStreak,
  dailyXpToday,
  lastSevenDays,
  useProgress,
  type ThemePreference,
} from "@/lib/store";
import { readingAidOn } from "@/lib/learning/reading-aid";
import { courseHasReadingAid } from "@/lib/use-reading-aid";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

const THEME_OPTIONS: { value: ThemePreference; icon: string }[] = [
  { value: "system", icon: "phone-portrait-outline" },
  { value: "light", icon: "sunny-outline" },
  { value: "dark", icon: "moon-outline" },
];
const LANGUAGE_OPTIONS: { value: UiLanguagePreference; icon: string }[] = [
  { value: "system", icon: "phone-portrait-outline" },
  { value: "vi", icon: "language-outline" },
  { value: "en", icon: "language-outline" },
];

export default function ProfileScreen() {
  const colors = useThemeColors();
  const styles = useStyles();
  const { t, languageName } = useT();
  const progress = useProgress();
  const { themePreference, setThemePreference, uiLanguage, setUiLanguage, dailyNewWords, setDailyNewWords } = progress;
  const { activeCourseId, dailyGoal } = progress;
  const courseProgress = progress.course();
  const { pack, allLessons, allWords } = useCourseContent(activeCourseId);
  const langName = languageName(courseProfile(activeCourseId).targetCode, pack.targetLanguage);
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
      label: t("profile.stat.streak"),
      value: `${streak}`,
      icon: <MaterialCommunityIcons name="fire" size={28} color={colors.orange} />,
    },
    {
      label: t("profile.stat.xp"),
      value: `${courseProgress.xp}`,
      icon: <Ionicons name="flash" size={26} color={colors.skyDark} />,
    },
    {
      label: t("profile.stat.todayXp"),
      value: `${todayXp}/${dailyGoal}`,
      icon: (
        <MaterialCommunityIcons name="bullseye-arrow" size={27} color={colors.amber} />
      ),
    },
    {
      label: t("profile.stat.toReview"),
      value: `${courseProgress.mistakes.length}`,
      icon: <Ionicons name="refresh-circle" size={26} color={colors.rose} />,
    },
    {
      label: t("profile.stat.lessonsDone"),
      value: `${lessonsDone}/${allLessons.length}`,
      icon: <Ionicons name="checkmark-circle" size={26} color={colors.green} />,
    },
    {
      label: t("profile.stat.wordsLearned"),
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
          <Text style={styles.name}>{t("profile.title")}</Text>
          <Pressable onPress={() => router.push("/courses")} style={styles.courseRow} testID="profile-switch">
            <Text style={styles.subtitle}>{t("profile.learning")}</Text>
            <Flag courseId={activeCourseId} size={18} />
            <Text style={styles.subtitle}>{langName}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switch}>{t("profile.switch")}</Text>
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
              {streak > 0 ? t("profile.streakDays", { n: streak }) : t("profile.streakEmpty")}
            </Text>
          </View>
          <View style={styles.weekRow}>
            {week.map((d) => (
              <View key={d.day} style={styles.weekDay}>
                <Text style={styles.weekLabel} maxFontSizeMultiplier={1.2}>
                  {t(`weekday.${d.weekdayIndex}` as never)}
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
            <View key={stat.label} style={styles.statCard} testID="profile-stat">
              {stat.icon}
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {hasCapability(activeCourseId, "goals") ? (
          <Pressable
            onPress={() => router.push("/goals")}
            accessibilityRole="button"
            accessibilityLabel={t("profile.goalsTitle", { language: langName })}
            style={styles.goalsCard}
            testID="goals-entry"
          >
            <Ionicons name="flag-outline" size={22} color={colors.greenDark} />
            <View style={styles.dataRowText}>
              <Text style={styles.dataRowTitle}>{t("profile.goalsTitle", { language: langName })}</Text>
              <Text style={styles.settingsHint}>{t("profile.goalsHint")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}

        <View style={styles.settingsCard}>
          <View style={styles.settingsHeader}>
            <Ionicons name="color-palette-outline" size={22} color={colors.indigo} />
            <Text style={styles.settingsTitle}>{t("profile.appearance")}</Text>
          </View>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((option) => {
              const active = themePreference === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setThemePreference(option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={t("profile.themeLabel", { theme: t(`profile.theme.${option.value}`) })}
                  accessibilityState={{ selected: active }}
                  style={[styles.themeChip, active && styles.themeChipActive]}
                  testID={`theme-option-${option.value}`}
                >
                  <Ionicons
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={active ? colors.greenDark : colors.textMuted}
                  />
                  <Text style={[styles.themeLabel, active && styles.themeLabelActive]}>
                    {t(`profile.theme.${option.value}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.settingsHint}>{t("profile.appearanceHint")}</Text>
        </View>

        {hasCapability(progress.activeCourseId, "dailySession") ? (
          <View style={styles.settingsCard} testID="daily-words-card">
            <View style={styles.settingsHeader}>
              <Ionicons name="sparkles-outline" size={22} color={colors.skyDark} />
              <Text style={styles.settingsTitle}>{t("profile.dailyWords")}</Text>
            </View>
            <View style={styles.themeRow}>
              <Pressable
                onPress={() => setDailyNewWords(dailyNewWords - 1)}
                accessibilityRole="button"
                accessibilityLabel={t("profile.dailyWordsLess")}
                style={styles.themeChip}
                testID="daily-words-less"
              >
                <Ionicons name="remove" size={20} color={colors.textMuted} />
              </Pressable>
              <Text style={styles.settingsTitle} testID="daily-words-value" accessibilityLiveRegion="polite">
                {t("profile.dailyWordsValue", { n: dailyNewWords })}
              </Text>
              <Pressable
                onPress={() => setDailyNewWords(dailyNewWords + 1)}
                accessibilityRole="button"
                accessibilityLabel={t("profile.dailyWordsMore")}
                style={styles.themeChip}
                testID="daily-words-more"
              >
                <Ionicons name="add" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.settingsHint}>{t("profile.dailyWordsHint")}</Text>
          </View>
        ) : null}

        {courseHasReadingAid(activeCourseId) ? (
          <View style={styles.settingsCard} testID="reading-aid-card">
            <View style={styles.settingsHeader}>
              <Ionicons name="text-outline" size={22} color={colors.indigo} />
              <Text style={[styles.settingsTitle, { flex: 1 }]}>{t("profile.readingAid")}</Text>
              <Switch
                value={readingAidOn(progress.readingAid, activeCourseId)}
                onValueChange={(on) => progress.setReadingAid(activeCourseId, on)}
                accessibilityLabel={t("profile.readingAid")}
                testID="reading-aid-switch"
              />
            </View>
            <Text style={styles.settingsHint}>{t("profile.readingAidHint")}</Text>
          </View>
        ) : null}

        <View style={styles.settingsCard} testID="language-card">
          <View style={styles.settingsHeader}>
            <Ionicons name="language-outline" size={22} color={colors.skyDark} />
            <Text style={styles.settingsTitle}>{t("profile.language")}</Text>
          </View>
          <View style={styles.themeRow}>
            {LANGUAGE_OPTIONS.map((option) => {
              const active = uiLanguage === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setUiLanguage(option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={t("profile.languageLabel", { option: t(`profile.language.${option.value}`) })}
                  accessibilityState={{ selected: active }}
                  style={[styles.themeChip, active && styles.themeChipActive]}
                  testID={`language-option-${option.value}`}
                >
                  <Ionicons
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={active ? colors.greenDark : colors.textMuted}
                  />
                  <Text style={[styles.themeLabel, active && styles.themeLabelActive]}>
                    {t(`profile.language.${option.value}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.settingsHint}>{t("profile.languageHint")}</Text>
        </View>

        <DataCard />
      </ScrollView>
    </SafeAreaView>
  );
}

function DataCard() {
  const colors = useThemeColors();
  const styles = useStyles();
  const { t, tm } = useT();
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    setBusy(true);
    const result = await exportProgress();
    setBusy(false);
    if (!result.ok) Alert.alert(t("backup.exportFailedTitle"), tm(result.reason));
  };

  const onImport = async () => {
    setBusy(true);
    const picked = await pickBackupFile();
    setBusy(false);
    if (picked.kind === "canceled") return;
    if (picked.kind === "error") {
      Alert.alert(t("backup.importFailedTitle"), tm(picked.reason));
      return;
    }
    const staged = prepareImport(picked.raw);
    if (!staged.ok) {
      Alert.alert(t("backup.importFailedTitle"), tm(staged.reason));
      return;
    }
    const courseCount = Object.keys(staged.state.courses).length;
    Alert.alert(
      t("profile.replaceTitle"),
      t("profile.replaceBody", { courses: courseCount, streak: staged.state.streak }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.import"),
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            const result = await commitImport(staged.state, staged.learner);
            setBusy(false);
            if (result.ok) Alert.alert(t("profile.imported"));
            else Alert.alert(t("backup.importFailedTitle"), tm(result.reason));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.settingsCard}>
      <View style={styles.settingsHeader}>
        <Ionicons name="archive-outline" size={22} color={colors.skyDark} />
        <Text style={styles.settingsTitle}>{t("profile.data")}</Text>
      </View>
      <Pressable
        onPress={onExport}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={t("profile.export")}
        style={styles.dataRow}
        testID="profile-export"
      >
        <Ionicons name="download-outline" size={20} color={colors.green} />
        <View style={styles.dataRowText}>
          <Text style={styles.dataRowTitle}>{t("profile.export")}</Text>
          <Text style={styles.settingsHint}>{t("profile.exportHint")}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
      <Pressable
        onPress={onImport}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={t("profile.importTitle")}
        style={styles.dataRow}
        testID="profile-import"
      >
        <Ionicons name="cloud-upload-outline" size={20} color={colors.indigo} />
        <View style={styles.dataRowText}>
          <Text style={styles.dataRowTitle}>{t("profile.importTitle")}</Text>
          <Text style={styles.settingsHint}>{t("profile.importHint")}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
      <Pressable
        onPress={() => router.push("/privacy")}
        accessibilityRole="button"
        accessibilityLabel={t("profile.privacyLabel")}
        style={styles.dataRow}
        testID="privacy-link"
      >
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.green} />
        <View style={styles.dataRowText}>
          <Text style={styles.dataRowTitle}>{t("profile.privacy")}</Text>
          <Text style={styles.settingsHint}>{t("profile.privacyHint")}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
      <Pressable
        onPress={() => router.push("/licenses")}
        accessibilityRole="button"
        accessibilityLabel={t("profile.licensesLabel")}
        style={styles.dataRow}
        testID="licenses-link"
      >
        <Ionicons name="document-text-outline" size={20} color={colors.skyDark} />
        <View style={styles.dataRowText}>
          <Text style={styles.dataRowTitle}>{t("profile.licenses")}</Text>
          <Text style={styles.settingsHint}>{t("profile.licensesHint")}</Text>
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
  weekTitle: { flexShrink: 1, fontSize: 16, fontWeight: "800", color: colors.neutral700 },
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
  goalsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderRadius: radius.xl,
    padding: 16,
  },
}));
