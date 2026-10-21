import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useT } from "@/lib/i18n";
import { CloseButton } from "@/components/close-button";
import { Flag } from "@/components/flag";
import { exitScreen } from "@/lib/navigation";
import { orderedCoursesFor } from "@/lib/content";
import { courseProfile } from "@/lib/course-profile";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius } from "@/lib/theme";

export default function CoursesScreen() {
  const styles = useStyles();
  const { t, lang, languageName } = useT();
  const { activeCourseId, setActiveCourse, courses } = useProgress();
  const all = orderedCoursesFor(lang);
  // P3d: inherited standalone courses are listed last, under their own heading.
  const list = all.filter((c) => courseProfile(c.id).role !== "standalone");
  const others = all.filter((c) => courseProfile(c.id).role === "standalone");

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <CloseButton />
        <Text style={styles.title}>{t("courses.title")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.subtitle}>{t("courses.subtitle")}</Text>
        {[...list, ...others].map((course, index) => {
          const prog = courses[course.id];
          const lessonsDone = prog
            ? Object.keys(prog.completedLessons).length
            : 0;
          const active = course.id === activeCourseId;
          const name = languageName(courseProfile(course.id).targetCode, course.targetLanguage);
          return (
            <React.Fragment key={course.id}>
            {index === list.length && others.length > 0 ? (
              <View style={styles.otherHeader} testID="courses-other">
                <Text style={styles.otherTitle}>{t("courses.otherTitle")}</Text>
                <Text style={styles.meta}>{t("courses.otherBody")}</Text>
              </View>
            ) : null}
            <Pressable
              testID={`courses-course-${course.id}`}
              onPress={() => {
                setActiveCourse(course.id);
                exitScreen();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t("courses.cardLabel", { language: name, done: lessonsDone, total: course.lessonCount, active: active ? "yes" : "no" })}
              style={[styles.card, active && styles.cardActive]}
            >
              <Flag courseId={course.id} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.langName}>{name}</Text>
                <Text style={styles.meta}>
                  {t("courses.meta", { done: lessonsDone, total: course.lessonCount, units: course.unitCount })}
                </Text>
                <Text style={styles.meta}>
                  {t("courses.nativeLine", { language: languageName(course.nativeCode, course.nativeLanguage) })}
                </Text>
              </View>
              {active ? <Text style={styles.activeBadge}>{t("courses.active")}</Text> : null}
            </Pressable>
            </React.Fragment>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral200,
  },
  title: { fontSize: 17, fontWeight: "800", color: colors.neutral700 },
  body: { padding: 20, gap: 12, paddingBottom: 60 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  otherHeader: { marginTop: 12, gap: 2 },
  otherTitle: { fontSize: 15, fontWeight: "800", color: colors.neutral700 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderRadius: radius.xl,
    padding: 16,
  },
  cardActive: { borderColor: colors.green, backgroundColor: colors.greenLight + "18" },
  langName: { fontSize: 18, fontWeight: "800", color: colors.neutral700 },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  activeBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.green,
    textTransform: "uppercase",
  },
}));
