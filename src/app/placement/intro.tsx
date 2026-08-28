/**
 * "Find your starting point" (§67-72): the honest gate before the placement
 * diagnostic. Brand-new learners skip the whole thing and start at lesson
 * one (§69-70); experienced learners get a short, deterministic check that
 * recommends a starting lesson — never a level, never a score.
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CloseButton } from "@/components/close-button";
import { DuoButton } from "@/components/duo-button";
import { placementContent } from "@/lib/assessment/content";
import { exitScreen } from "@/lib/navigation";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export default function PlacementIntroScreen() {
  const styles = useStyles();
  const colors = useThemeColors();
  const plan = placementContent();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <CloseButton onPress={() => exitScreen()} />
      </View>
      <View style={styles.body}>
        <Ionicons name="compass" size={56} color={colors.skyDark} />
        <Text style={styles.title}>Find your starting point</Text>
        <Text style={styles.question}>Have you studied French before?</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>
            If you have, a short check (at most {plan.maxItems} questions, a
            few minutes) finds a good starting lesson in this course. You can
            say &quot;I don&apos;t know&quot; to any question.
          </Text>
          <Text style={styles.cardText}>
            It&apos;s not an exam: no score, no level — just where to start.
            Everything before your starting point stays open for review.
          </Text>
        </View>
        <View style={styles.actions}>
          <DuoButton
            label="Yes — find my starting point"
            onPress={() => router.replace("/placement/run")}
          />
          <DuoButton
            label="I'm new — start from the beginning"
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
