/**
 * Concept step renderer (Phase 5B): Continue-only teaching content. Pure
 * display — no grading, no evidence, no store writes; the footer's
 * Continue button lives in SessionScreen (shared with teach cards).
 * Content is generic: everything on screen comes from the compiled
 * concept, never from language-specific code.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { conceptFor } from "@/lib/learning/concepts";
import { makeThemedStyles, radius } from "@/lib/theme";

export function ConceptCard({ conceptId }: { conceptId: string }) {
  const styles = useStyles();
  const concept = conceptFor(conceptId);
  // Content validation guarantees resolution; fail soft (never wedge the
  // session) if a stale build ever ships a dangling reference.
  if (!concept) return null;

  return (
    <View style={styles.card} testID="concept-card">
      <Text style={styles.kicker}>Concept</Text>
      <Text style={styles.title}>{concept.title}</Text>
      <View style={styles.ruleBox}>
        <Text style={styles.rule}>{concept.shortRule}</Text>
      </View>
      <Text style={styles.explanation}>{concept.explanation}</Text>

      <View style={styles.examples}>
        {concept.examples.map((example) => (
          <View key={example.fr} style={styles.exampleRow}>
            <Text style={styles.exampleFr}>{example.fr}</Text>
            <Text style={styles.exampleEn}>{example.en}</Text>
            {example.note ? <Text style={styles.exampleNote}>{example.note}</Text> : null}
          </View>
        ))}
      </View>

      {concept.exceptions.length > 0 ? (
        <View style={styles.exceptionBox}>
          <Text style={styles.exceptionTitle}>Watch out</Text>
          {concept.exceptions.map((exception) => (
            <Text key={exception} style={styles.exceptionText}>
              {exception}
            </Text>
          ))}
        </View>
      ) : null}

      {concept.memoryHint ? (
        <Text style={styles.memoryHint}>💡 {concept.memoryHint}</Text>
      ) : null}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: colors.neutral200,
      padding: 20,
      gap: 14,
    },
    kicker: {
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.skyDark,
    },
    title: { fontSize: 24, fontWeight: "800", color: colors.text },
    ruleBox: {
      backgroundColor: colors.selectedBg,
      borderRadius: radius.md,
      padding: 14,
    },
    rule: { fontSize: 17, fontWeight: "700", color: colors.skyDark, lineHeight: 24 },
    explanation: { fontSize: 16, lineHeight: 24, color: colors.text },
    examples: { gap: 10 },
    exampleRow: {
      borderLeftWidth: 3,
      borderLeftColor: colors.neutral300,
      paddingLeft: 12,
      gap: 2,
    },
    exampleFr: { fontSize: 18, fontWeight: "700", color: colors.text },
    exampleEn: { fontSize: 15, color: colors.textMuted },
    exampleNote: { fontSize: 13, fontStyle: "italic", color: colors.textMuted },
    exceptionBox: {
      backgroundColor: colors.wrongBg,
      borderRadius: radius.md,
      padding: 14,
      gap: 6,
    },
    exceptionTitle: { fontSize: 14, fontWeight: "800", color: colors.wrongText },
    exceptionText: { fontSize: 14, lineHeight: 20, color: colors.wrongText },
    memoryHint: { fontSize: 15, fontWeight: "600", color: colors.text },
  })
);
