/**
 * Exam-track results (P3d): section points, every pass-rule check against
 * the format's threshold (groups, section minimums, total), each rule not
 * reached, and an ESTIMATED readiness band — never "you will pass".
 * Incomplete sittings (speaking unavailable) get no band at all.
 */
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DuoButton } from "@/components/duo-button";
import type { AssessmentItemResult } from "@/lib/assessment/types";
import { examRuleChecks, examWeakAreas, scoreExam, type CompiledExamTrack, type ExamMode } from "@/lib/exam/engine";
import { useT } from "@/lib/i18n";
import { makeThemedStyles, radius } from "@/lib/theme";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function ExamResults({
  track,
  mode,
  formId,
  itemResults,
  onPracticeWeak,
  onDone,
}: {
  track: CompiledExamTrack;
  mode: ExamMode;
  formId: string;
  itemResults: AssessmentItemResult[];
  onPracticeWeak?: () => void;
  onDone: () => void;
}) {
  const styles = useStyles();
  const { t } = useT();
  const score = scoreExam(track, itemResults);
  const weak = examWeakAreas(track, itemResults);
  // Every declared rule, and the ones a measured sitting did not reach — no pass/fail wording.
  const checks = examRuleChecks(track, score);
  const missed = checks.filter((c) => c.met === false);
  const takenSections = score.sections.filter((s) => s.points !== null);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} testID="exam-results">
        <Text style={styles.title}>{mode === "mock" ? t("exam.results.mockTitle", { name: track.name, form: formId.toUpperCase() }) : t("exam.results.practiceTitle", { name: track.name })}</Text>

        <View style={styles.group}>
          {takenSections.map((s) => (
            <Text key={s.id} style={styles.row} testID={`exam-section-score-${s.id}`}>
              {t("exam.results.sectionLine", { section: s.title, points: fmt(s.points ?? 0), max: fmt(s.maxPoints), correct: s.correct, total: s.administered })}
            </Text>
          ))}
          {itemResults.some((r) => r.credit !== undefined) ? (
            <Text style={styles.rowMuted} testID="exam-rubric-estimate">
              {t("exam.results.rubricEstimate")}
            </Text>
          ) : null}
          {score.sections
            .filter((s) => s.points === null && mode === "mock")
            .map((s) => (
              <Text key={s.id} style={styles.rowMuted}>
                {t("exam.results.sectionNotTaken", { section: s.title })}
              </Text>
            ))}
        </View>

        {mode === "mock" ? (
          <>
            <View style={styles.group}>
              {checks.map((c) => (
                <Text key={`${c.kind}-${c.id}`} style={styles.row} testID={c.kind === "group" ? `exam-group-${c.id}` : `exam-rule-${c.kind}-${c.id}`}>
                  {c.points === null
                    ? t("exam.results.groupIncomplete", { group: c.title })
                    : t("exam.results.groupLine", { group: c.title, points: fmt(c.points), max: fmt(c.max), pass: fmt(c.min) })}
                </Text>
              ))}
            </View>
            {missed.length > 0 ? (
              <View style={styles.group} testID="exam-rules-missed">
                <Text style={styles.groupTitle}>{t("exam.results.missedTitle")}</Text>
                {missed.map((c) => (
                  <Text key={`${c.kind}-${c.id}`} style={styles.row}>
                    • {t("exam.results.missedLine", { rule: c.title, points: fmt(c.points ?? 0), max: fmt(c.max), min: fmt(c.min) })}
                  </Text>
                ))}
              </View>
            ) : null}
            <View style={styles.band} testID="exam-readiness">
              {score.band ? (
                <>
                  <Text style={styles.bandLabel}>{score.band.label}</Text>
                  <Text style={styles.body}>{score.band.message}</Text>
                </>
              ) : (
                <Text style={styles.body}>{track.readiness.incomplete}</Text>
              )}
            </View>
          </>
        ) : null}

        {weak.tasks.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t("exam.results.weakTitle")}</Text>
            {weak.tasks.map((w) => (
              <Text key={`${w.sectionId}/${w.taskId}`} style={styles.row}>
                • {w.title} ({w.total - w.missed}/{w.total})
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.note}>{track.readiness.disclaimer}</Text>

        {onPracticeWeak && weak.lexemeIds.length > 0 ? (
          <DuoButton label={t("exam.results.practiceWeak")} onPress={onPracticeWeak} testID="exam-practice-weak" />
        ) : null}
        <DuoButton label={t("common.done")} variant={onPracticeWeak && weak.lexemeIds.length > 0 ? "white" : "secondary"} onPress={onDone} testID="exam-results-done" />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 14 },
    title: { fontSize: 24, fontWeight: "800", color: colors.text },
    group: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 8,
    },
    groupTitle: { fontSize: 14, fontWeight: "800", color: colors.neutral700 },
    row: { fontSize: 15, fontWeight: "600", color: colors.text },
    rowMuted: { fontSize: 15, color: colors.textMuted },
    band: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.skyDark,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 6,
    },
    bandLabel: { fontSize: 17, fontWeight: "800", color: colors.skyDark },
    body: { fontSize: 15, color: colors.text, lineHeight: 22 },
    note: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  })
);
