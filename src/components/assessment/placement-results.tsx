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

import { DuoButton } from "@/components/duo-button";
import { objectiveFor } from "@/lib/assessment/content";
import type { ClusterOutcome, PlacementRecommendation } from "@/lib/assessment/placement";
import type { LessonRef } from "@/lib/content";
import { makeThemedStyles, radius } from "@/lib/theme";

function titleFor(objectiveId: string): string {
  return objectiveFor(objectiveId)?.title ?? objectiveId;
}

export function PlacementResults({
  recommendation,
  recommendedRef,
  onStartHere,
  onStartFromBeginning,
}: {
  recommendation: PlacementRecommendation;
  /** Resolved lesson ref for the recommended starting lesson. */
  recommendedRef: LessonRef | undefined;
  onStartHere: () => void;
  onStartFromBeginning: () => void;
}) {
  const styles = useStyles();
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
        <Text style={styles.title}>Your starting point</Text>

        <View style={styles.recommendCard} testID="placement-recommendation">
          <Text style={styles.recommendLabel}>Recommended start</Text>
          <Text style={styles.recommendLesson}>
            {recommendedRef
              ? `${recommendedRef.unit.title} — ${recommendedRef.lesson.title}`
              : "The beginning of the course"}
          </Text>
          {recommendation.allComfortable ? (
            <Text style={styles.recommendNote}>
              You looked comfortable with everything we checked, so we suggest
              the last unit of the course. Anything before it stays open to
              review any time.
            </Text>
          ) : (
            <Text style={styles.recommendNote}>
              Everything before this point stays open — you can always go back
              and review.
            </Text>
          )}
        </View>

        {comfortable.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>You seem comfortable with</Text>
            {comfortable.map((o) => (
              <Text key={o.clusterId} style={styles.rowStrong}>
                ✓ {titleFor(o.objectiveId)}
              </Text>
            ))}
          </View>
        )}

        {gaps.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Good things to build next</Text>
            {gaps.map((o) => (
              <Text key={o.clusterId} style={styles.rowGap}>
                • {titleFor(o.objectiveId)}
              </Text>
            ))}
          </View>
        )}

        {notEstimated.length > 0 && (
          <View style={styles.group} testID="placement-not-estimated">
            <Text style={styles.groupTitle}>Not estimated — audio unavailable</Text>
            {notEstimated.map((o) => (
              <Text key={o.clusterId} style={styles.rowGap}>
                — {titleFor(o.objectiveId)}
              </Text>
            ))}
            <Text style={styles.note}>
              We couldn&apos;t play audio on this device, so listening was
              skipped without penalty. The listening units stay fully open —
              try them any time audio works.
            </Text>
          </View>
        )}

        <Text style={styles.note}>
          This quick check only finds a starting lesson in this course. It is
          not a language exam, and it doesn&apos;t give you a level or a score.
        </Text>

        <DuoButton label="Start here" onPress={onStartHere} />
        <DuoButton
          label="Start from the beginning"
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
