/**
 * Placement results (§118-120): a recommended starting LESSON in this
 * course — never a level, never a score (§119). The learner decides: accept
 * the recommendation (sets the placement floor, §81-83) or start from the
 * beginning. Estimates stay estimates — "comfortable", never "demonstrated"
 * (§80).
 */
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useT } from "@/lib/i18n";
import { DuoButton } from "@/components/duo-button";
import { objectiveFor } from "@/lib/assessment/content";
import type { ClusterOutcome, PlacementRecommendation } from "@/lib/assessment/placement";
import type { LessonRef } from "@/lib/content";
import { makeThemedStyles, radius } from "@/lib/theme";

function titleFor(courseId: string, objectiveId: string): string {
  return objectiveFor(courseId, objectiveId)?.title ?? objectiveId;
}

export function PlacementResults({
  courseId,
  recommendation,
  recommendedRef,
  onStartHere,
  onStartFromBeginning,
}: {
  courseId: string;
  recommendation: PlacementRecommendation;
  /** Resolved lesson ref for the recommended starting lesson. */
  recommendedRef: LessonRef | undefined;
  onStartHere: () => void;
  onStartFromBeginning: () => void;
}) {
  const styles = useStyles();
  const { t } = useT();
  const comfortable = recommendation.clusterOutcomes.filter(
    (o: ClusterOutcome) => o.outcome === "comfortable"
  );
  const gaps = recommendation.clusterOutcomes.filter(
    (o: ClusterOutcome) => o.outcome !== "comfortable" && o.outcome !== "not_estimated"
  );
  const notEstimated = recommendation.clusterOutcomes.filter(
    (o: ClusterOutcome) => o.outcome === "not_estimated"
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("placementResults.title")}</Text>

        <View style={styles.recommendCard} testID="placement-recommendation">
          <Text style={styles.recommendLabel}>{t("placementResults.recommended")}</Text>
          <Text style={styles.recommendLesson}>
            {recommendedRef
              ? `${recommendedRef.unit.title} — ${recommendedRef.lesson.title}`
              : t("placementResults.beginning")}
          </Text>
          {recommendation.allComfortable ? (
            <Text style={styles.recommendNote}>{t("placementResults.allComfortable")}</Text>
          ) : (
            <Text style={styles.recommendNote}>{t("placementResults.openBefore")}</Text>
          )}
        </View>

        {comfortable.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t("placementResults.comfortable")}</Text>
            {comfortable.map((o) => (
              <Text key={o.clusterId} style={styles.rowStrong}>
                ✓ {titleFor(courseId, o.objectiveId)}
              </Text>
            ))}
          </View>
        )}

        {gaps.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t("placementResults.gaps")}</Text>
            {gaps.map((o) => (
              <Text key={o.clusterId} style={styles.rowGap}>
                • {titleFor(courseId, o.objectiveId)}
              </Text>
            ))}
          </View>
        )}

        {notEstimated.length > 0 && (
          <View style={styles.group} testID="placement-not-estimated">
            <Text style={styles.groupTitle}>{t("placementResults.notEstimated")}</Text>
            {notEstimated.map((o) => (
              <Text key={o.clusterId} style={styles.rowGap}>
                — {titleFor(courseId, o.objectiveId)}
              </Text>
            ))}
            <Text style={styles.note}>{t("placementResults.audioNote")}</Text>
          </View>
        )}

        <Text style={styles.note}>{t("placementResults.note")}</Text>

        <DuoButton label={t("placementResults.startHere")} onPress={onStartHere} testID="placement-start-here" />
        <DuoButton
          label={t("placementResults.startBeginning")}
          testID="placement-start-beginning"
          variant="white"
          onPress={onStartFromBeginning}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 14 },
    title: { fontSize: 26, fontWeight: "800", color: colors.text },
    recommendCard: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.skyDark,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 6,
    },
    recommendLabel: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.skyDark,
      textTransform: "uppercase",
    },
    recommendLesson: { fontSize: 19, fontWeight: "800", color: colors.text },
    recommendNote: { fontSize: 13, color: colors.textMuted },
    group: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 8,
    },
    groupTitle: { fontSize: 14, fontWeight: "800", color: colors.neutral700 },
    rowStrong: { fontSize: 15, fontWeight: "600", color: colors.greenDark },
    rowGap: { fontSize: 15, fontWeight: "600", color: colors.text },
    note: { fontSize: 13, color: colors.textMuted },
  })
);
