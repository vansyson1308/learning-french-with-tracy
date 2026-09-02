/**
 * French goals (§90-97): every course objective in can-do language, grouped
 * by honest evidence state — demonstrated (checkpoint evidence only, §38),
 * estimated (placement only, §40), worth practicing, in progress, not
 * started. The overall CEFR line never claims a level (§94-95); the CEFR
 * disclaimer surface lives here (§12, §96). Placement management (§86).
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CloseButton } from "@/components/close-button";
import {
  allObjectives,
  attainmentPolicy,
  courseClaimableAt,
  objectiveFor,
} from "@/lib/assessment/content";
import {
  A1_DOMAIN_DISPLAY,
  deriveA1Estimate,
  type DomainEstimate,
} from "@/lib/assessment/estimate";
import {
  deriveObjectiveStates,
  objectiveLessonMap,
  type ObjectiveLearnerState,
} from "@/lib/assessment/states";
import { useCourseContent } from "@/lib/content";
import { exitScreen } from "@/lib/navigation";
import { probeSpeechCapabilityOnce } from "@/lib/speech/use-speech-session";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

const GROUPS: {
  state: ObjectiveLearnerState;
  title: string;
  hint?: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { state: "demonstrated", title: "Demonstrated in a checkpoint", icon: "ribbon" },
  {
    state: "estimated",
    title: "Estimated from your placement",
    hint: "Estimates only — a checkpoint can confirm them.",
    icon: "compass",
  },
  { state: "needs_practice", title: "Worth practicing", icon: "barbell" },
  { state: "learning", title: "In progress", icon: "footsteps" },
  { state: "not_started", title: "Not started yet", icon: "ellipse-outline" },
];

const DOMAIN_STATUS_ICON: Record<DomainEstimate["status"], keyof typeof Ionicons.glyphMap> = {
  demonstrated: "checkmark-circle",
  needs_practice: "barbell",
  partial: "ellipsis-horizontal-circle-outline",
  technical_unavailable: "mic-off-outline",
  no_evidence: "ellipse-outline",
};

function objectiveTitles(ids: string[]): string {
  return ids.map((id) => objectiveFor(id)?.title ?? id).join(", ");
}

/**
 * One plain-language line per domain that is not yet demonstrated (Phase
 * 10 §62): how much of the authored requirement is shown, and what is
 * still missing — so a learner can see WHY the estimate is incomplete
 * without any assessment expertise.
 */
function domainDetailLine(d: DomainEstimate): string {
  const name = A1_DOMAIN_DISPLAY[d.domain];
  const shown = `${d.demonstratedObjectives.length} of ${d.requiredObjectives.length} goals shown`;
  switch (d.status) {
    case "needs_practice":
      return `${name} — ${shown}; worth practicing first: ${objectiveTitles(d.needsPracticeObjectives)}.`;
    case "partial":
      return `${name} — ${shown}; still to show: ${objectiveTitles(d.missingObjectives)}.`;
    case "technical_unavailable":
      return `${name} — ${shown}; needs a device that can recognize French speech. This is a device limit, not a result.`;
    case "no_evidence":
      return `${name} — ${shown}; take the checkpoint to show: ${objectiveTitles(d.missingObjectives)}.`;
    case "demonstrated":
      return `${name} — every required goal shown.`;
  }
}

export default function GoalsScreen() {
  const styles = useStyles();
  const colors = useThemeColors();
  const progress = useProgress();
  const { pack, getLesson } = useCourseContent("fr-en");
  const frCourse = progress.courses["fr-en"];

  const objectives = allObjectives();
  const states = deriveObjectiveStates({
    objectiveIds: objectives.map((o) => o.id),
    objectiveLessons: objectiveLessonMap(pack),
    completedLessons: frCourse?.completedLessons ?? {},
    checkpointAttempts: progress.assessment.checkpointAttempts,
    placement: progress.assessment.placement,
  });

  const placement = progress.assessment.placement;
  const floor = progress.assessment.placementFloor;
  const floorRef =
    floor > 0 ? getLesson(placement?.recommendedLessonId ?? "") : undefined;

  // P9 §45-§49: the claim split. Course claimability is a compiled fact;
  // the learner's estimate derives from their own checkpoint evidence.
  const courseReady = courseClaimableAt("A1");
  // Device speech capability is a fact about the device, shown as such
  // (Phase 10 §15): a speech domain with no evidence on a device that
  // cannot score speech reads "technical_unavailable", never a verdict.
  // Until the probe resolves the status is simply "no evidence".
  const [speechAvailable, setSpeechAvailable] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    let live = true;
    void probeSpeechCapabilityOnce().then((capability) => {
      if (live) setSpeechAvailable(capability.scoredEligible);
    });
    return () => {
      live = false;
    };
  }, []);
  const estimate = deriveA1Estimate({
    policy: attainmentPolicy(),
    states,
    courseClaimable: courseReady,
    speechAvailable,
  });
  const [limitsOpen, setLimitsOpen] = React.useState(false);

  const onResetFloor = () => {
    const doReset = () => progress.resetPlacement();
    const message =
      "Your path will start from the very beginning again. Nothing else changes — no progress is lost.";
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`Reset starting point?\n\n${message}`)) {
        doReset();
      }
      return;
    }
    Alert.alert("Reset starting point?", message, [
      { text: "Keep it", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: doReset },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <CloseButton onPress={() => exitScreen()} />
        <Text style={styles.headerTitle}>Your French goals</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.overallCard} testID="overall-level-card">
          <Text style={styles.overallLabel}>CEFR-aligned A1 estimate</Text>
          <Text style={styles.overallValue} testID="a1-estimate-value">
            {estimate.overall === "demonstrated"
              ? "Demonstrated across all five skills"
              : "Not complete yet"}
          </Text>
          {courseReady ? (
            <Text style={styles.overallNote}>
              {estimate.overall === "demonstrated"
                ? "You have shown every required goal in all five skill areas in this course's own checks. This is a course-based estimate — an official level comes only from an accredited examination."
                : `An A1 estimate needs every required goal shown in all five skill areas — one good check is a start, not the whole area. Still to show: ${estimate.missingDomains
                    .map((d) => A1_DOMAIN_DISPLAY[d])
                    .join(", ")}. A skipped speaking part just leaves the estimate incomplete — it never counts against you.`}
            </Text>
          ) : (
            <Text style={styles.overallNote}>
              This course cannot yet assess a full level across all five skill
              areas.
            </Text>
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
                accessibilityLabel={domainDetailLine(d)}
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
                  {A1_DOMAIN_DISPLAY[d.domain]}
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
                    • {domainDetailLine(d)}
                  </Text>
                ))}
            </View>
          ) : null}
          {courseReady ? (
            <Pressable
              onPress={() => router.push("/checkpoint/fr.checkpoint.a1-capstone")}
              accessibilityRole="button"
              accessibilityLabel="Take the A1 check"
              style={styles.linkRow}
              testID="capstone-link"
            >
              <Ionicons name="school" size={16} color={colors.skyDark} />
              <Text style={[styles.linkText, { color: colors.skyDark }]}>
                Take the A1 check — all five skills in one sitting
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setLimitsOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="What this estimate is and is not"
            style={styles.linkRow}
            testID="estimate-limits-toggle"
          >
            <Ionicons
              name={limitsOpen ? "chevron-up" : "information-circle-outline"}
              size={16}
              color={colors.neutral400}
            />
            <Text style={[styles.linkText, { color: colors.neutral400 }]}>
              What this estimate is — and is not
            </Text>
          </Pressable>
          {limitsOpen ? (
            <View style={styles.limitsBox} testID="estimate-limits">
              <Text style={styles.overallNote}>
                • It is a CEFR-aligned estimate from this course&apos;s own
                deterministic checks, scored on your latest attempt at each
                check — never an official CEFR examination, certificate, or
                Council of Europe endorsement.
              </Text>
              <Text style={styles.overallNote}>
                • Speaking and conversation checks need a device that can
                recognize French speech. If yours can&apos;t, those parts are
                skipped: the estimate stays incomplete, and nothing is ever
                counted as a failure.
              </Text>
              <Text style={styles.overallNote}>
                • Retaking a check replaces your standing with the newest
                result — a different parallel version where one exists — and
                earlier attempts are kept, never re-scored.
              </Text>
              <Text style={styles.overallNote}>
                • A full CEFR level covers more situations and spontaneity
                than any app can sample. Treat this as an honest map of what
                you have shown here, not a qualification.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.placementCard}>
          <Text style={styles.groupTitle}>Starting point</Text>
          {placement ? (
            <>
              <Text style={styles.rowText}>
                {floor > 0 && floorRef
                  ? `Starting from ${floorRef.unit.title} — ${floorRef.lesson.title}.`
                  : "Starting from the beginning."}
              </Text>
              {floor > 0 ? (
                <Pressable
                  onPress={onResetFloor}
                  accessibilityRole="button"
                  accessibilityLabel="Reset starting point"
                  style={styles.linkRow}
                  testID="reset-floor"
                >
                  <Ionicons name="refresh" size={16} color={colors.roseDark} />
                  <Text style={[styles.linkText, { color: colors.roseDark }]}>
                    Reset starting point
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Text style={styles.rowText}>
              You haven&apos;t taken the starting-point check.
            </Text>
          )}
          <Pressable
            onPress={() => router.push("/placement/intro")}
            accessibilityRole="button"
            accessibilityLabel={
              placement ? "Retake the starting-point check" : "Find your starting point"
            }
            style={styles.linkRow}
          >
            <Ionicons name="compass" size={16} color={colors.skyDark} />
            <Text style={[styles.linkText, { color: colors.skyDark }]}>
              {placement ? "Retake the check" : "Find your starting point"}
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
                <Text style={styles.groupTitle}>{group.title}</Text>
              </View>
              {group.hint ? <Text style={styles.groupHint}>{group.hint}</Text> : null}
              {members.map((o) => (
                <View key={o.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{o.title}</Text>
                  <Text style={styles.rowText}>{o.canDo}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.disclaimer}>
          Goals only count as demonstrated after a checkpoint; the
          starting-point check gives estimates. Goal alignments in this app
          are CEFR-aligned estimates — not an official CEFR examination or
          certification.
        </Text>
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
