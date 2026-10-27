import { router } from "expo-router";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useT } from "@/lib/i18n";
import { DuoButton } from "@/components/duo-button";
import { Flag } from "@/components/flag";
import { catalog, orderedCoursesFor } from "@/lib/content";
import { loadCourse } from "@/lib/course-bundle";
import { courseProfile, defaultCourseForUi } from "@/lib/course-profile";
import { DAILY_GOAL_OPTIONS, DEFAULT_COURSE, useProgress } from "@/lib/store";
import { makeThemedStyles, radius } from "@/lib/theme";

export default function OnboardingScreen() {
  const styles = useStyles();
  const { t, lang, languageName } = useT();
  // P3d: inherited standalone courses (es-en beside es-vi) are not offered
  // to new learners; they stay installable under "other courses".
  const courses = orderedCoursesFor(lang).filter((c) => courseProfile(c.id).role !== "standalone");
  const finishOnboarding = useProgress((s) => s.finishOnboarding);
  // P3e §7: preselect by UI language (vi → the first -vi course).
  const uiDefault = defaultCourseForUi(lang);
  const [courseId, setCourseId] = useState(
    courses.some((c) => c.id === uiDefault)
      ? uiDefault
      : (courses[0]?.id ?? DEFAULT_COURSE)
  );
  const [goal, setGoal] = useState<number>(20);

  const selected = catalog.courses.find((c) => c.id === courseId);
  const nameOf = (course: { id: string; targetLanguage: string }) =>
    languageName(courseProfile(course.id).targetCode, course.targetLanguage);
  const pace = (g: number) => t(`onboarding.pace.${g <= 10 ? "casual" : g <= 20 ? "regular" : g <= 30 ? "serious" : "intense"}`);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <Image
          source={require("@/assets/images/mascot.svg")}
          style={styles.mascot}
          contentFit="contain"
        />
        <Text style={styles.title}>{t("onboarding.welcome")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.subtitle")}</Text>

        <Text style={styles.sectionLabel}>{t("onboarding.wantToLearn")}</Text>
        <View style={styles.langGrid}>
          {courses.map((course) => (
            <Pressable
              key={course.id}
              onPress={() => setCourseId(course.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: courseId === course.id }}
              testID={`onboarding-course-${course.id}`}
              accessibilityLabel={t("onboarding.courseLabel", { language: nameOf(course), units: course.unitCount, lessons: course.lessonCount })}
              style={[styles.langChip, courseId === course.id && styles.langChipActive]}
            >
              <Flag courseId={course.id} size={32} />
              <Text
                style={[
                  styles.langName,
                  courseId === course.id && styles.langNameActive,
                ]}
              >
                {nameOf(course)}
              </Text>
              <Text style={styles.langMeta}>
                {t("onboarding.courseMeta", { units: course.unitCount, lessons: course.lessonCount })}
              </Text>
              <Text style={styles.langMeta}>
                {t("courses.nativeLine", { language: languageName(course.nativeCode, course.nativeLanguage) })}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t("onboarding.dailyGoal")}</Text>
        <View style={styles.goals}>
          {DAILY_GOAL_OPTIONS.map((g) => (
            <Pressable
              key={g}
              onPress={() => setGoal(g)}
              accessibilityRole="button"
              accessibilityState={{ selected: goal === g }}
              testID={`onboarding-goal-${g}`}
              accessibilityLabel={t("onboarding.goalLabel", { xp: g, pace: pace(g) })}
              style={[styles.goalChip, goal === g && styles.goalChipActive]}
            >
              <Text style={[styles.goalText, goal === g && styles.goalTextActive]}>
                {g} XP
              </Text>
              <Text style={[styles.goalHint, goal === g && styles.goalTextActive]}>
                {pace(g)}
              </Text>
            </Pressable>
          ))}
        </View>

        <DuoButton
          label={selected ? t("onboarding.learn", { language: nameOf(selected) }) : t("onboarding.start")}
          testID="onboarding-start"
          onPress={() => {
            // P3g: load the chosen course's bundle before leaving onboarding.
            void loadCourse(courseId).then(() => {
              finishOnboarding(courseId, goal);
              router.replace("/(tabs)");
            });
          }}
          style={{ alignSelf: "stretch" }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { padding: 24, gap: 16, paddingBottom: 40 },
  mascot: { width: 100, height: 100, alignSelf: "center" },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.neutral700,
    textAlign: "center",
  },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.neutral700,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
  },
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  langChip: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderRadius: radius.lg,
    padding: 14,
    gap: 4,
  },
  langChipActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight + "22",
  },
  langName: { fontSize: 17, fontWeight: "800", color: colors.neutral700 },
  langNameActive: { color: colors.greenDark },
  langMeta: { fontSize: 11, color: colors.textMuted },
  goals: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  goalChip: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderRadius: radius.lg,
    padding: 14,
    alignItems: "center",
    gap: 2,
  },
  goalChipActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight + "22",
  },
  goalText: { fontSize: 18, fontWeight: "800", color: colors.neutral700 },
  goalTextActive: { color: colors.greenDark },
  goalHint: { fontSize: 12, color: colors.textMuted },
}));
