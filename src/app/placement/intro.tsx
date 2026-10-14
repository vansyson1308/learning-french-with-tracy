/**
 * "Find your starting point" (§67-72): the honest gate before the placement
 * diagnostic. Brand-new learners skip the whole thing and start at lesson
 * one (§69-70); experienced learners get a short, deterministic check that
 * recommends a starting lesson — never a level, never a score.
 */
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useT } from "@/lib/i18n";
import { CloseButton } from "@/components/close-button";
import { DuoButton } from "@/components/duo-button";
import { placementContent } from "@/lib/assessment/content";
import { courseProfile, hasCapability } from "@/lib/course-profile";
import { exitScreen } from "@/lib/navigation";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

/**
 * Course guard (P0): this surface exists only for courses that have the
 * capability; a deep link while another course is active goes home instead
 * of routing evidence to a course the content does not describe.
 */
export default function PlacementIntroScreen() {
  const activeCourseId = useProgress((s) => s.activeCourseId);
  if (!hasCapability(activeCourseId, "placement")) return <Redirect href="/" />;
  return <PlacementIntroScreenBody courseId={activeCourseId} />;
}

function PlacementIntroScreenBody({ courseId }: { courseId: string }) {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t, languageName } = useT();
  const plan = placementContent(courseId);
  const profile = courseProfile(courseId);
  const targetLanguage = languageName(profile.targetCode, profile.targetLanguage);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <CloseButton onPress={() => exitScreen()} />
      </View>
      <View style={styles.body}>
        <Ionicons name="compass" size={56} color={colors.skyDark} />
        <Text style={styles.title}>{t("placement.title")}</Text>
        <Text style={styles.question}>{t("placement.question", { language: targetLanguage })}</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>{t("placement.card1", { n: plan.maxItems })}</Text>
          <Text style={styles.cardText}>{t("placement.card2")}</Text>
        </View>
        <View style={styles.actions}>
          <DuoButton
            label={t("placement.yes")}
            testID="placement-yes"
            onPress={() => router.replace("/placement/run")}
          />
          <DuoButton
            label={t("placement.new")}
            testID="placement-new"
            variant="white"
            onPress={() => exitScreen()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", paddingHorizontal: 10, paddingVertical: 8 },
    body: { flex: 1, padding: 24, gap: 16, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 28, fontWeight: "800", color: colors.text, textAlign: "center" },
    question: { fontSize: 17, fontWeight: "700", color: colors.neutral700, textAlign: "center" },
    card: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 10,
      alignSelf: "stretch",
    },
    cardText: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    actions: { alignSelf: "stretch", gap: 10, marginTop: 8 },
  })
);
