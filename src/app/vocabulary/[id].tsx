/**
 * Lexeme detail (Phase 4): everything the lexicon knows about one word —
 * surface, dictionary form, meaning, part of speech, gender,
 * pronunciation, audio, examples — plus an honest memory status read from
 * the learner's FSRS card. Read-only: opening this screen never creates a
 * card or touches learner state; the licenses screen is one tap away.
 */

import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CloseButton } from "@/components/close-button";
import { SpeakerButton } from "@/components/speaker-button";
import { courseCapabilities } from "@/lib/capabilities";
import { serializeCardKey } from "@/lib/learning/card-key";
import { frMemoryStrengthPercent } from "@/lib/learning/engine";
import type { FsrsCardState } from "@/lib/learning/scheduler";
import { displayPronunciation } from "@/lib/session/panel";
import { useLexiconRepository } from "@/lib/lexicon/use-lexicon-repository";
import type { LexemeDetail } from "@/lib/lexicon/types";
import { exitScreen } from "@/lib/navigation";
import { dueInDaysAt } from "@/lib/srs";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export default function LexemeDetailScreen() {
  const styles = useStyles();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id: string }>();
  const itemId = typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const card = useProgress(
    (s) =>
      (s.courses[s.activeCourseId]?.cards as Record<string, FsrsCardState> | undefined)?.[
        serializeCardKey({ itemId, skill: "recognize" })
      ]
  );
  const repoState = useLexiconRepository();
  const [detail, setDetail] = useState<LexemeDetail | null | "loading">("loading");

  useEffect(() => {
    if (!repoState) return;
    let alive = true;
    // The id arrives URL-encoded and is validated by lookup — an unknown
    // or malformed id renders the not-found state, never a query error.
    repoState.repo.getById(itemId).then((result) => {
      if (alive) setDetail(result);
    });
    return () => {
      alive = false;
    };
  }, [repoState, itemId]);

  if (!courseCapabilities(activeCourseId).lexicon) return <Redirect href="/" />;

  const memory = frMemoryStrengthPercent(card);
  const dueDays = card ? dueInDaysAt(card.due) : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <CloseButton onPress={() => exitScreen()} />
        <Text style={styles.heading}>Word details</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {detail === "loading" ? null : detail === null ? (
          <Text style={styles.empty}>This word isn&apos;t in the French lexicon.</Text>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.surface}>{detail.surface}</Text>
                  <Text style={styles.gloss}>{detail.gloss}</Text>
                </View>
                <SpeakerButton text={detail.surface} size={44} />
              </View>
              <View style={styles.chips}>
                <Chip label={detail.pos === "noun" && detail.gender ? `${detail.gender} noun` : detail.pos} />
                {detail.pronunciation ? (
                  <Chip label={displayPronunciation(detail.pronunciation)} tone="sky" />
                ) : null}
                {detail.topic ? <Chip label={detail.topic} /> : null}
              </View>
              {detail.lemma !== detail.surface ? (
                <Text style={styles.lemma}>Dictionary form: {detail.lemma}</Text>
              ) : null}
              {detail.frequency ? (
                <Text style={styles.lemma}>
                  Frequency: {detail.frequency.band} (from film-subtitle counts)
                </Text>
              ) : null}
            </View>

            {detail.examples.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Example</Text>
                {detail.examples.map((ex) => (
                  <View key={ex.fr} style={styles.example}>
                    <Text style={styles.exampleFr}>{ex.fr}</Text>
                    <Text style={styles.exampleEn}>{ex.en}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Memory</Text>
              {card ? (
                <>
                  <Text style={styles.memoryLine}>
                    In your reviews — memory strength {memory ?? 0}%.
                  </Text>
                  <Text style={styles.memoryHint}>
                    {dueDays !== null && dueDays <= 0
                      ? "Review due now."
                      : dueDays !== null
                        ? `Next review in ${dueDays} day${dueDays === 1 ? "" : "s"}.`
                        : ""}
                  </Text>
                </>
              ) : (
                <Text style={styles.memoryHint}>
                  Not in your reviews yet — learn it through the path or a Today session.
                  Browsing here never adds words for you.
                </Text>
              )}
            </View>

            <Pressable
              onPress={() => router.push("/licenses")}
              accessibilityRole="button"
              accessibilityLabel="Licenses and attributions"
              style={styles.licenseRow}
            >
              <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
              <Text style={styles.licenseText}>Data licenses &amp; attributions</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, tone }: { label: string; tone?: "sky" }) {
  const styles = useStyles();
  return (
    <View style={[styles.chip, tone === "sky" && styles.chipSky]}>
      <Text style={[styles.chipText, tone === "sky" && styles.chipTextSky]}>{label}</Text>
    </View>
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
    heading: { fontSize: 20, fontWeight: "800", color: colors.neutral700 },
    body: { padding: 16, gap: 14, paddingBottom: 40 },
    card: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 10,
    },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    surface: { fontSize: 26, fontWeight: "800", color: colors.neutral700 },
    gloss: { fontSize: 16, fontWeight: "600", color: colors.textMuted },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.full,
      backgroundColor: colors.neutral100,
    },
    chipSky: { backgroundColor: colors.neutral100 },
    chipText: { fontSize: 13, fontWeight: "700", color: colors.neutral700 },
    chipTextSky: { color: colors.skyDark },
    lemma: { fontSize: 13, color: colors.textMuted },
    sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.neutral700 },
    example: { gap: 2 },
    exampleFr: { fontSize: 15, fontWeight: "600", color: colors.text },
    exampleEn: { fontSize: 14, color: colors.textMuted },
    memoryLine: { fontSize: 14, fontWeight: "700", color: colors.text },
    memoryHint: { fontSize: 13, color: colors.textMuted },
    empty: { fontSize: 15, color: colors.textMuted, textAlign: "center", paddingTop: 40 },
    licenseRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "center",
      paddingVertical: 6,
    },
    licenseText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  })
);
