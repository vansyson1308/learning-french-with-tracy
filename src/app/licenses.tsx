/**
 * Licenses & attributions (Phase 4): the in-app surface for software
 * notices and data provenance. Sources referenced by the French lexicon
 * render from the compiled dataset (one truth with ATTRIBUTIONS.md);
 * static sections cover the app's MIT lineage, the identified Lexique 4
 * source, and the audio provenance note. Honest by construction: it names
 * only what the app actually ships.
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import frWebFallback from "@/content/lexicon/fr-web-fallback.json";
import { CloseButton } from "@/components/close-button";
import { exitScreen } from "@/lib/navigation";
import { makeThemedStyles, radius } from "@/lib/theme";

type FallbackShape = {
  datasetLicense: string;
  sources: { id: string; name: string; license: string; url: string; attribution: string }[];
};
const lexiconData = frWebFallback as FallbackShape;

export default function LicensesScreen() {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <CloseButton onPress={() => exitScreen()} />
        <Text style={styles.heading}>Licenses &amp; attributions</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Section title="App software">
          <Text style={styles.text}>
            Based on Lingo Lessons by Open Apps Studio, used under the MIT License. The
            original LICENSE file — including the 650 Industries, Inc. notice from the
            create-expo-app template — is preserved in the project repository, alongside
            the full generated ATTRIBUTIONS.md. Spaced-repetition scheduling is powered
            by ts-fsrs (open-spaced-repetition contributors, MIT License).
          </Text>
        </Section>

        <Section title="French lexicon data">
          <Text style={styles.text}>
            The French lexicon dataset (word metadata, pronunciation, examples) is
            published under the Creative Commons Attribution-ShareAlike 4.0 license
            ({lexiconData.datasetLicense}). This license covers the dataset only — it
            does not change the app&apos;s software licensing.
          </Text>
          {lexiconData.sources.map((s) => (
            <View key={s.id} style={styles.sourceRow}>
              <Text style={styles.sourceName}>
                {s.name} — {s.license}
              </Text>
              <Text style={styles.text}>{s.attribution}</Text>
              <Text style={styles.url}>{s.url}</Text>
            </View>
          ))}
          <Text style={styles.text}>
            Word frequency and IPA pronunciation values are derived from Lexique 4
            (New, Pallier, Schalchli, Bourgin, &amp; Gimenes, 2026 — lexique.org),
            distributed under CC BY-SA 4.0. Modifications: selection of the curriculum
            entries, per-word matching to Lexique rows, frequency banding derived from
            the corpus distribution, and integration with this app&apos;s authored
            lexicon. Full provenance is recorded in ATTRIBUTIONS.md and the
            repository&apos;s content/fr/lexicon documentation.
          </Text>
        </Section>

        <Section title="Audio">
          <Text style={styles.text}>
            Word and sentence audio is pre-generated speech bundled with the app,
            inherited from the upstream Lingo Lessons project under its MIT grant, with
            the device&apos;s speech synthesis as fallback. No audio is fetched at runtime.
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
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
    heading: { fontSize: 18, fontWeight: "800", color: colors.neutral700 },
    body: { padding: 16, gap: 14, paddingBottom: 40 },
    card: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 8,
    },
    sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.neutral700 },
    text: { fontSize: 13, color: colors.text, lineHeight: 19 },
    sourceRow: { gap: 3 },
    sourceName: { fontSize: 13, fontWeight: "800", color: colors.neutral700 },
    url: { fontSize: 12, color: colors.textMuted },
  })
);
