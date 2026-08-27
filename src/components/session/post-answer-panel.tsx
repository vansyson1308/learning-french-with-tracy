/**
 * PostAnswerPanel (Phase 4): concise lexical feedback after a French
 * answer tied to exactly one stable item. Compact by default — surface,
 * gloss, gender cue, pronunciation, one example — with a "More" disclosure
 * for lemma/POS/topic. Continue stays the obvious action (the panel sits
 * above it and never traps focus). Wrong answers lead with the correct
 * form and meaning; correct answers get the same quiet reinforcement, no
 * confetti. Renders nothing when the item has no lexicon entry.
 */

import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { SpeakerButton } from "@/components/speaker-button";
import { panelDataFor } from "@/lib/session/panel";
import { makeThemedStyles, radius } from "@/lib/theme";

export function PostAnswerPanel({
  itemId,
  note,
}: {
  itemId: string;
  correct: boolean;
  /** Phase 5B: one derived grammar note (articleSelect/conjugationCloze). */
  note?: string;
}) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);
  const data = panelDataFor(itemId);
  if (!data) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={styles.panel}
      accessibilityLabel={`Word details: ${data.surface}, ${data.gloss}`}
    >
      <View style={styles.headRow}>
        <View style={styles.headText}>
          <Text style={styles.surface}>{data.surface}</Text>
          <Text style={styles.gloss}>{data.gloss}</Text>
        </View>
        <SpeakerButton text={data.surface} size={34} />
      </View>
      {(data.genderLabel || data.pronunciation) && (
        <View style={styles.metaRow}>
          {data.pronunciation ? <Text style={styles.pron}>{data.pronunciation}</Text> : null}
          {data.genderLabel ? (
            <View style={styles.genderPill}>
              <Text style={styles.genderText}>{data.genderLabel}</Text>
            </View>
          ) : null}
        </View>
      )}
      {data.example ? (
        <View style={styles.example}>
          <Text style={styles.exampleFr}>{data.example.fr}</Text>
          <Text style={styles.exampleEn}>{data.example.en}</Text>
        </View>
      ) : null}
      {note ? <Text style={styles.note}>{note}</Text> : null}
      {expanded ? (
        <Text style={styles.moreDetail}>
          {[
            `Dictionary form: ${data.lemma}`,
            data.pos,
            data.topic ? `topic: ${data.topic}` : null,
            data.band ? `frequency: ${data.band}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      ) : (
        <Pressable
          onPress={() => setExpanded(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="More word details"
          style={styles.moreButton}
        >
          <Text style={styles.moreText}>More</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    panel: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 6,
    },
    headRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    headText: { flex: 1, gap: 1 },
    surface: { fontSize: 18, fontWeight: "800", color: colors.neutral700 },
    gloss: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    pron: { fontSize: 14, color: colors.skyDark, fontWeight: "600" },
    genderPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.full,
      backgroundColor: colors.neutral200,
    },
    genderText: { fontSize: 12, fontWeight: "700", color: colors.neutral700 },
    example: { gap: 1 },
    exampleFr: { fontSize: 14, fontWeight: "600", color: colors.neutral700 },
    exampleEn: { fontSize: 13, color: colors.textMuted },
    note: { fontSize: 13, fontWeight: "600", color: colors.skyDark },
    moreButton: { alignSelf: "flex-start", paddingVertical: 2 },
    moreText: { fontSize: 13, fontWeight: "800", color: colors.skyDark },
    moreDetail: { fontSize: 13, color: colors.textMuted },
  })
);
