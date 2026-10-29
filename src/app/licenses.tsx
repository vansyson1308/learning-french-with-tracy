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

import attributions from "@/content/attributions.json";
import { allCourseProfiles } from "@/lib/course-profile";
import { CloseButton } from "@/components/close-button";
import { useT } from "@/lib/i18n";
import { exitScreen } from "@/lib/navigation";
import { makeThemedStyles, radius } from "@/lib/theme";

/** Every lexicon dataset of this project is published under CC BY-SA 4.0 (LEXICON_LICENSE.md). */
const LEXICON_DATASET_LICENSE = "CC-BY-SA-4.0";
type AttributionEntry = {
  id: string;
  name: string;
  kind: string;
  license: string;
  url: string;
  attribution: string;
  covers: string[];
};
const registry = (attributions as { sources: AttributionEntry[] }).sources;
/** Voices used at pipeline time to synthesize the bundled audio (CC BY / CC0 credits). */
const voiceEntries = registry.filter((e) => /TTS voice/i.test(e.kind));
/**
 * Target languages that ship a lexicon (P3a: one section per language), and
 * the registered sources backing each one — read from the generated
 * attributions, so a new language's sources appear without touching the UI.
 */
const aiReviewedCourses = allCourseProfiles().filter((p) => p.reviewNote === "ai-simulated");
const lexiconLanguages = [...new Set(allCourseProfiles().filter((p) => p.capabilities.lexicon).map((p) => p.targetCode))].sort();
const lexiconSourcesFor = (code: string) =>
  registry.filter((e) => e.covers.some((c) => c.startsWith(`content/${code}/lexicon/`) || c === `content/${code}/lexemes.json`));

export default function LicensesScreen() {
  const styles = useStyles();
  const { t, languageName } = useT();
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <CloseButton onPress={() => exitScreen()} />
        <Text style={styles.heading}>{t("licenses.title")}</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body} testID="licenses-screen">
        <Section title={t("licenses.software")}>
          <Text style={styles.text}>{t("licenses.softwareBody")}</Text>
        </Section>

        {lexiconLanguages.map((code) => {
          const lexiconLanguage = languageName(code, code);
          return (
            <Section key={code} title={t("licenses.lexicon", { language: lexiconLanguage })}>
              <Text style={styles.text}>
                {t("licenses.lexiconBody", { language: lexiconLanguage, license: LEXICON_DATASET_LICENSE })}
              </Text>
              {lexiconSourcesFor(code).map((s) => (
                <View key={s.id} style={styles.sourceRow}>
                  <Text style={styles.sourceName}>
                    {s.name} — {s.license}
                  </Text>
                  <Text style={styles.text}>{s.attribution}</Text>
                  <Text style={styles.url}>{s.url}</Text>
                </View>
              ))}
              <Text style={styles.text}>{code === "fr" ? t("licenses.lexiqueBody") : t("licenses.lexiconEtlBody", { language: lexiconLanguage })}</Text>
            </Section>
          );
        })}

        {aiReviewedCourses.length > 0 ? (
          <Section title={t("licenses.aiReviewTitle")}>
            <Text style={styles.text} testID="licenses-ai-review">
              {t("licenses.aiReviewBody", { courses: aiReviewedCourses.map((p) => `${languageName(p.targetCode, p.targetLanguage)} (${p.id})`).join(", ") })}
            </Text>
          </Section>
        ) : null}

        <Section title={t("licenses.audio")}>
          <Text style={styles.text}>{t("licenses.audioBody")}</Text>
          {voiceEntries.map((v) => (
            <View key={v.id} style={styles.sourceRow}>
              <Text style={styles.sourceName}>
                {v.name} — {v.license}
              </Text>
              <Text style={styles.text}>{v.attribution}</Text>
              <Text style={styles.url}>{v.url}</Text>
            </View>
          ))}
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
