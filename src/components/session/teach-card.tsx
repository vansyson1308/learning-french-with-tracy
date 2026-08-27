/**
 * Teach step (TODAY): shows a new word before its first retrieval. Pure
 * exposure — no grading, no scheduler writes, advances with Continue.
 * Phase 4: enriched from the lightweight lexicon index when metadata
 * exists (pronunciation, gender cue, one short example) in the mandated
 * priority order — word, translation, pronunciation, gender, example.
 * Without metadata it renders exactly the Phase-3 card (legacy courses,
 * uncurated items). Never a dictionary dump; frequency and licensing do
 * not belong here.
 */

import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { SpeakerButton } from "@/components/speaker-button";
import { speakTarget } from "@/lib/audio";
import type { LexemeMeta } from "@/lib/learning/lexicon-index";
import { displayPronunciation } from "@/lib/session/panel";
import { makeThemedStyles, radius } from "@/lib/theme";
import type { Word } from "@/lib/types";

export function TeachCard({
  word,
  courseId,
  meta,
}: {
  word: Word;
  courseId: string;
  meta?: LexemeMeta;
}) {
  const styles = useStyles();

  // One auto-play when the word appears; the speaker button replays.
  useEffect(() => {
    speakTarget(courseId, word.target);
  }, [courseId, word.target]);

  const genderLabel =
    meta?.pos === "noun" && (meta.gender === "masculine" || meta.gender === "feminine")
      ? `${meta.gender} noun`
      : undefined;

  return (
    <View style={styles.wrap} accessibilityLabel={`New word: ${word.target}`}>
      <Animated.Text entering={FadeInDown.duration(200)} style={styles.kicker}>
        NEW WORD
      </Animated.Text>
      <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.card}>
        <Text style={styles.emoji} accessibilityElementsHidden>
          {word.emoji}
        </Text>
        <Text style={styles.target}>{word.target}</Text>
        <Text style={styles.native}>{word.native}</Text>
        {meta?.pronunciation ? (
          <Text style={styles.pron} accessibilityLabel="Pronunciation">
            {displayPronunciation(meta.pronunciation)}
          </Text>
        ) : null}
        {genderLabel ? (
          <View style={styles.genderPill}>
            <Text style={styles.genderText}>{genderLabel}</Text>
          </View>
        ) : null}
        <View style={styles.speakerRow}>
          <SpeakerButton text={word.target} size={48} />
        </View>
        {meta?.example ? (
          <View style={styles.example}>
            <Text style={styles.exampleFr}>{meta.example.fr}</Text>
            <Text style={styles.exampleEn}>{meta.example.en}</Text>
          </View>
        ) : null}
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(150)} style={styles.hint}>
        Listen, read it out loud, then continue.
      </Animated.Text>
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { alignItems: "center", gap: 18, paddingTop: 12 },
    kicker: {
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 2,
      color: colors.skyDark,
    },
    card: {
      alignSelf: "stretch",
      alignItems: "center",
      gap: 8,
      paddingVertical: 30,
      paddingHorizontal: 20,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
    },
    emoji: { fontSize: 64 },
    target: { fontSize: 30, fontWeight: "800", color: colors.neutral700 },
    native: { fontSize: 18, fontWeight: "600", color: colors.textMuted },
    pron: { fontSize: 16, fontWeight: "600", color: colors.skyDark },
    genderPill: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: radius.full,
      backgroundColor: colors.neutral200,
    },
    genderText: { fontSize: 13, fontWeight: "700", color: colors.neutral700 },
    speakerRow: { marginTop: 10 },
    example: {
      marginTop: 12,
      alignItems: "center",
      gap: 2,
    },
    exampleFr: { fontSize: 15, fontWeight: "600", color: colors.neutral700, textAlign: "center" },
    exampleEn: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
    hint: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  })
);
