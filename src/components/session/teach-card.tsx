/**
 * Teach step (TODAY): shows a new word before its first retrieval. Pure
 * exposure — no grading, no scheduler writes, advances with Continue.
 * Content is what Phase-3 data provides: emoji, French surface, native
 * gloss, audio. Richer fields (IPA, examples, gender) arrive with the
 * lexicon phase.
 */

import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { SpeakerButton } from "@/components/speaker-button";
import { speakTarget } from "@/lib/audio";
import { makeThemedStyles, radius } from "@/lib/theme";
import type { Word } from "@/lib/types";

export function TeachCard({ word, courseId }: { word: Word; courseId: string }) {
  const styles = useStyles();

  // One auto-play when the word appears; the speaker button replays.
  useEffect(() => {
    speakTarget(courseId, word.target);
  }, [courseId, word.target]);

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
        <View style={styles.speakerRow}>
          <SpeakerButton text={word.target} size={48} />
        </View>
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
    speakerRow: { marginTop: 10 },
    hint: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  })
);
