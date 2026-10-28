/**
 * Exam-track overview (P3d): the public format (sections, tasks, timing),
 * section practice, and the timed mock on rotating parallel forms. Every
 * result is an estimated readiness from the course's own practice items.
 */

import { Redirect, router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DuoButton } from "@/components/duo-button";
import { hasCapability } from "@/lib/course-profile";
import { examTrackFor } from "@/lib/exam/content";
import { examAttemptId, scoreExam, selectMockForm } from "@/lib/exam/engine";
import { useT } from "@/lib/i18n";
import { assessmentFor, useProgress } from "@/lib/store";
import { makeThemedStyles, radius } from "@/lib/theme";

export default function ExamTrackScreen() {
  const activeCourseId = useProgress((s) => s.activeCourseId);
  if (!hasCapability(activeCourseId, "exam")) return <Redirect href="/" />;
  return <ExamTrackBody courseId={activeCourseId} />;
}

function ExamTrackBody({ courseId }: { courseId: string }) {
  const { trackId } = useLocalSearchParams<{ trackId: string }>();
  const styles = useStyles();
  const { t } = useT();
  const track = examTrackFor(courseId, trackId ?? "");
  // Select the stable store slice; assessmentFor() builds a fresh empty
  // state when nothing is recorded, which must not be a selector result.
  const assessmentByTarget = useProgress((s) => s.assessmentByTarget);
  const attempts = assessmentFor({ assessmentByTarget }, courseId).checkpointAttempts;
  if (!track) return <Redirect href="/" />;

  const mockId = examAttemptId(track.id, "mock");
  const mocks = attempts.filter((a) => a.checkpointId === mockId);
  const nextForm = selectMockForm(track, mocks.length);
  const lastMock = mocks[mocks.length - 1];
  const lastScore = lastMock ? scoreExam(track, lastMock.itemResults) : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} testID="exam-overview">
        <Text style={styles.title}>{track.title}</Text>
        <Text style={styles.body}>{track.description}</Text>
        {!track.formatSource.checkedAgainstOfficialGuide ? <Text style={styles.note}>{track.formatSource.note}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("exam.mock.title")}</Text>
          <Text style={styles.body}>
            {t("exam.mock.body", {
              minutes: track.sections.reduce((n, s) => n + s.minutes, 0),
              form: nextForm.formId.toUpperCase(),
            })}
          </Text>
          {lastScore ? (
            <Text style={styles.muted} testID="exam-last-mock">
              {lastScore.band ? t("exam.mock.last", { band: lastScore.band.label }) : t("exam.mock.lastIncomplete")}
            </Text>
          ) : null}
          <DuoButton
            label={t("exam.mock.start", { form: nextForm.formId.toUpperCase() })}
            variant="primary"
            onPress={() => router.push({ pathname: "/exam/run", params: { track: track.id, mode: "mock" } })}
            testID="exam-start-mock"
          />
        </View>

        <Text style={styles.sectionHeading}>{t("exam.practice.heading")}</Text>
        {track.sections.map((s) => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.muted}>
              {s.preparationMinutes
                ? t("exam.section.timingWithPrep", { minutes: s.minutes, prep: s.preparationMinutes, points: s.maxPoints })
                : t("exam.section.timing", { minutes: s.minutes, points: s.maxPoints })}
            </Text>
            {s.tasks.map((task) => (
              <Text key={task.id} style={styles.task}>
                • {task.minutes !== undefined ? t("exam.section.partTiming", { part: task.title, minutes: task.minutes }) : task.title}
              </Text>
            ))}
            {s.simulatedIndividually ? (
              <Text style={styles.muted} testID={`exam-simulated-${s.id}`}>
                {t("exam.section.simulatedIndividually")}
              </Text>
            ) : null}
            <DuoButton
              label={t("exam.practice.start")}
              onPress={() => router.push({ pathname: "/exam/run", params: { track: track.id, mode: "practice", section: s.id } })}
              testID={`exam-practice-${s.id}`}
            />
          </View>
        ))}

        <Text style={styles.note}>{t("exam.practice.note")}</Text>
        <Text style={styles.note}>{track.readiness.disclaimer}</Text>
        <DuoButton label={t("common.back")} variant="white" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 14 },
    title: { fontSize: 26, fontWeight: "800", color: colors.text },
    sectionHeading: { fontSize: 18, fontWeight: "800", color: colors.neutral700, marginTop: 6 },
    card: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 8,
    },
    cardTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
    body: { fontSize: 15, color: colors.text, lineHeight: 22 },
    muted: { fontSize: 14, color: colors.textMuted },
    task: { fontSize: 14, color: colors.text },
    note: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  })
);
