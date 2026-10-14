/**
 * French goals (§90-97): every course objective in can-do language, grouped
 * by honest evidence state — demonstrated (checkpoint evidence only, §38),
 * estimated (placement only, §40), worth practicing, in progress, not
 * started. The overall CEFR line never claims a level (§94-95); the CEFR
 * disclaimer surface lives here (§12, §96). Placement management (§86).
 */
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useT, type Translator } from "@/lib/i18n";
import { CloseButton } from "@/components/close-button";
import {
  allObjectives,
  attainmentPolicy,
  courseClaimableAt,
  objectiveFor,
} from "@/lib/assessment/content";
import { deriveA1Estimate, type DomainEstimate } from "@/lib/assessment/estimate";
import {
  deriveObjectiveStates,
  objectiveLessonMap,
  type ObjectiveLearnerState,
} from "@/lib/assessment/states";
import { useCourseContent } from "@/lib/content";
import { exitScreen } from "@/lib/navigation";
import { probeSpeechCapabilityOnce } from "@/lib/speech/use-speech-session";
import { courseProfile, hasCapability } from "@/lib/course-profile";
import { assessmentFor, useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

const GROUPS: {
  state: ObjectiveLearnerState;
  hint?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { state: "demonstrated", icon: "ribbon" },
  { state: "estimated", hint: true, icon: "compass" },
  { state: "needs_practice", icon: "barbell" },
  { state: "learning", icon: "footsteps" },
  { state: "not_started", icon: "ellipse-outline" },
];

const DOMAIN_STATUS_ICON: Record<DomainEstimate["status"], keyof typeof Ionicons.glyphMap> = {
  demonstrated: "checkmark-circle",
  needs_practice: "barbell",
  partial: "ellipsis-horizontal-circle-outline",
  technical_unavailable: "mic-off-outline",
  no_evidence: "ellipse-outline",
};

function objectiveTitles(courseId: string, ids: string[]): string {
  return ids.map((id) => objectiveFor(courseId, id)?.title ?? id).join(", ");
}

/**
 * One plain-language line per domain that is not yet demonstrated (Phase
 * 10 §62): how much of the authored requirement is shown, and what is
 * still missing — so a learner can see WHY the estimate is incomplete
 * without any assessment expertise.
 */
function domainDetailLine(t: Translator["t"], courseId: string, targetLanguage: string, d: DomainEstimate): string {
  const name = t(`domain.${d.domain}`);
  const shown = t("goals.domain.shown", { shown: d.demonstratedObjectives.length, total: d.requiredObjectives.length });
  switch (d.status) {
    case "needs_practice":
      return t("goals.domain.needsPractice", { name, shown, titles: objectiveTitles(courseId, d.needsPracticeObjectives) });
    case "partial":
      return t("goals.domain.partial", { name, shown, titles: objectiveTitles(courseId, d.missingObjectives) });
    case "technical_unavailable":
      return t("goals.domain.technical", { name, shown, language: targetLanguage });
    case "no_evidence":
      return t("goals.domain.noEvidence", { name, shown, titles: objectiveTitles(courseId, d.missingObjectives) });
    case "demonstrated":
      return t("goals.domain.demonstrated", { name });
  }
}

/**
 * Course guard (P0): this surface exists only for courses that have the
 * capability; a deep link while another course is active goes home instead
 * of routing evidence to a course the content does not describe.
 */
export default function GoalsScreen() {
  const activeCourseId = useProgress((s) => s.activeCourseId);
  if (!hasCapability(activeCourseId, "goals")) return <Redirect href="/" />;
  return <GoalsScreenBody courseId={activeCourseId} />;
}

function GoalsScreenBody({ courseId }: { courseId: string }) {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t, languageName } = useT();
  const progress = useProgress();
  const { pack, getLesson } = useCourseContent(courseId);
  const profile = courseProfile(courseId);
  const targetLanguage = languageName(profile.targetCode, profile.targetLanguage);
  const frCourse = progress.courses[courseId];

  const objectives = allObjectives(courseId);
  const states = deriveObjectiveStates({
    objectiveIds: objectives.map((o) => o.id),
    objectiveLessons: objectiveLessonMap(pack),
    completedLessons: frCourse?.completedLessons ?? {},
    checkpointAttempts: assessmentFor(progress, courseId).checkpointAttempts,
    placement: assessmentFor(progress, courseId).placement,
  });

  const placement = assessmentFor(progress, courseId).placement;
  const floor = assessmentFor(progress, courseId).placementFloor;
  const floorRef =
    floor > 0 ? getLesson(placement?.recommendedLessonId ?? "") : undefined;

  // P9 §45-§49: the claim split. Course claimability is a compiled fact;
  // the learner's estimate derives from their own checkpoint evidence.
  const courseReady = courseClaimableAt(courseId, "A1");
  // Device speech capability is a fact about the device, shown as such
  // (Phase 10 §15): a speech domain with no evidence on a device that
  // cannot score speech reads "technical_unavailable", never a verdict.
  // Until the probe resolves the status is simply "no evidence".
  const [speechAvailable, setSpeechAvailable] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    let live = true;
    void probeSpeechCapabilityOnce(profile.recognitionLocale).then((capability) => {
      if (live) setSpeechAvailable(capability.scoredEligible);
    });
    return () => {
      live = false;
    };
  }, [profile.recognitionLocale]);
  const estimate = deriveA1Estimate({
    policy: attainmentPolicy(courseId),
    states,
    courseClaimable: courseReady,
    speechAvailable,
  });
  const [limitsOpen, setLimitsOpen] = React.useState(false);

  const onResetFloor = () => {
    const doReset = () => progress.resetPlacement();
    const message = t("goals.resetBody");
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`${t("goals.resetTitle")}\n\n${message}`)) {
        doReset();
      }
      return;
    }
    Alert.alert(t("goals.resetTitle"), message, [
      { text: t("goals.keepIt"), style: "cancel" },
      { text: t("goals.reset"), style: "destructive", onPress: doReset },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <CloseButton onPress={() => exitScreen()} />
        <Text style={styles.headerTitle}>{t("goals.title", { language: targetLanguage })}</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.overallCard} testID="overall-level-card">
          <Text style={styles.overallLabel} testID="a1-estimate-label">{t("goals.estimateLabel")}</Text>
          <Text style={styles.overallValue} testID="a1-estimate-value">
            {estimate.overall === "demonstrated" ? t("goals.estimateDemonstrated") : t("goals.estimateIncomplete")}
          </Text>
          {courseReady ? (
            <Text style={styles.overallNote}>
              {estimate.overall === "demonstrated"
                ? t("goals.noteDemonstrated")
                : t("goals.noteIncomplete", { domains: estimate.missingDomains.map((d) => t(`domain.${d}`)) })}
            </Text>
          ) : (
            <Text style={styles.overallNote}>{t("goals.noteCourseNotReady")}</Text>
          )}
          <View style={styles.domainRow} testID="a1-domain-chips">
            {estimate.domains.map((d) => (
              <View
                key={d.domain}
                style={[
                  styles.domainChip,
                  d.status === "demonstrated" && {
                    backgroundColor: colors.correctBg,
                    borderColor: colors.correctBg,
                  },
                ]}
                testID={`a1-domain-chip-${d.domain}`}
                accessible
                accessibilityRole="text"
                accessibilityLabel={domainDetailLine(t, courseId, targetLanguage, d)}
              >
                <Ionicons
                  name={DOMAIN_STATUS_ICON[d.status]}
                  size={14}
                  color={d.status === "demonstrated" ? colors.correctText : colors.neutral400}
                />
                <Text
                  style={[
                    styles.domainChipText,
                    d.status === "demonstrated" && { color: colors.correctText },
                  ]}
                >
                  {t(`domain.${d.domain}`)}
                  {d.status === "demonstrated"
                    ? ""
                    : ` ${d.demonstratedObjectives.length}/${d.requiredObjectives.length}`}
                </Text>
              </View>
            ))}
          </View>
          {courseReady && estimate.overall !== "demonstrated" ? (
            <View style={styles.domainDetail} testID="a1-domain-detail">
              {estimate.domains
                .filter((d) => d.status !== "demonstrated")
                .map((d) => (
                  <Text key={d.domain} style={styles.overallNote}>
                    • {domainDetailLine(t, courseId, targetLanguage, d)}
                  </Text>
                ))}
            </View>
          ) : null}
          {courseReady ? (
            <Pressable
              onPress={() => router.push("/checkpoint/fr.checkpoint.a1-capstone")}
              accessibilityRole="button"
              accessibilityLabel={t("goals.takeA1Label")}
              style={styles.linkRow}
              testID="capstone-link"
            >
              <Ionicons name="school" size={16} color={colors.skyDark} />
              <Text style={[styles.linkText, { color: colors.skyDark }]}>{t("goals.takeA1")}</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setLimitsOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel={t("goals.limitsLabel")}
            style={styles.linkRow}
            testID="estimate-limits-toggle"
          >
            <Ionicons
              name={limitsOpen ? "chevron-up" : "information-circle-outline"}
              size={16}
              color={colors.neutral400}
            />
            <Text style={[styles.linkText, { color: colors.neutral400 }]}>{t("goals.limitsToggle")}</Text>
          </Pressable>
          {limitsOpen ? (
            <View style={styles.limitsBox} testID="estimate-limits">
              <Text style={styles.overallNote}>{t("goals.limits1")}</Text>
              <Text style={styles.overallNote}>{t("goals.limits2", { language: targetLanguage })}</Text>
              <Text style={styles.overallNote}>{t("goals.limits3")}</Text>
              <Text style={styles.overallNote}>{t("goals.limits4")}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.placementCard}>
          <Text style={styles.groupTitle}>{t("goals.startingPoint")}</Text>
          {placement ? (
            <>
              <Text style={styles.rowText} testID="goals-starting-from">
                {floor > 0 && floorRef
                  ? t("goals.startingFrom", { unit: floorRef.unit.title, lesson: floorRef.lesson.title })
                  : t("goals.startingBeginning")}
              </Text>
              {floor > 0 ? (
                <Pressable
                  onPress={onResetFloor}
                  accessibilityRole="button"
                  accessibilityLabel={t("goals.resetStartingPoint")}
                  style={styles.linkRow}
                  testID="reset-floor"
                >
                  <Ionicons name="refresh" size={16} color={colors.roseDark} />
                  <Text style={[styles.linkText, { color: colors.roseDark }]}>{t("goals.resetStartingPoint")}</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Text style={styles.rowText}>{t("goals.notTaken")}</Text>
          )}
          <Pressable
            onPress={() => router.push("/placement/intro")}
            accessibilityRole="button"
            accessibilityLabel={placement ? t("goals.retakeLabel") : t("goals.findLabel")}
            style={styles.linkRow}
            testID="goals-placement-action"
          >
            <Ionicons name="compass" size={16} color={colors.skyDark} />
            <Text style={[styles.linkText, { color: colors.skyDark }]}>
              {placement ? t("goals.retake") : t("goals.find")}
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
                <Text style={styles.groupTitle}>{t(`goals.group.${group.state}`)}</Text>
              </View>
              {group.hint ? <Text style={styles.groupHint}>{t("goals.group.estimatedHint")}</Text> : null}
              {members.map((o) => (
                <View key={o.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{o.title}</Text>
                  <Text style={styles.rowText}>{o.canDo}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.disclaimer} testID="goals-disclaimer">{t("goals.disclaimer")}</Text>
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
    domainRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
    domainDetail: { gap: 4, marginTop: 2 },
    domainChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1.5,
      borderColor: colors.neutral200,
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    domainChipText: { fontSize: 12, fontWeight: "700", color: colors.neutral700 },
    limitsBox: { gap: 6, marginTop: 2 },
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
