/**
 * Script primer (P4b stage 5, task 5): kana tables, tones with minimal
 * pairs and basic strokes, Hangul jamo and blocks — explained in the
 * course's native language, opened from the start of Section 1 of a
 * ja / zh / ko course. Read-only: nothing here grades or writes learner
 * state. Audio is pending for every item, so a tap speaks it with the
 * device voice (speakTarget's fallback).
 */
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CloseButton } from "@/components/close-button";
import { speakTarget } from "@/lib/audio";
import { courseProfile } from "@/lib/course-profile";
import { useT } from "@/lib/i18n";
import { exitScreen } from "@/lib/navigation";
import { coursePrimer, primerText, type PrimerSection, type PrimerText } from "@/lib/script-primer";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

type Ctx = { courseId: string; native: string };

export default function PrimerScreen() {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t } = useT();
  const courseId = useProgress((s) => s.activeCourseId);
  const primer = coursePrimer(courseId);
  if (!primer) return <Redirect href="/" />;
  const ctx: Ctx = { courseId, native: courseProfile(courseId).nativeCode };
  const tx = (text: PrimerText) => primerText(text, ctx.native);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]} testID="primer-screen">
      <View style={styles.topBar}>
        <CloseButton onPress={exitScreen} />
        <Text style={styles.title} numberOfLines={1}>
          {tx(primer.title)}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.note} testID="primer-review-note" accessibilityRole="text">
          <Ionicons name="information-circle-outline" size={18} color={colors.orange} />
          <Text style={styles.noteText}>{t("primer.reviewNote")}</Text>
        </View>
        <Text style={styles.paragraph}>{tx(primer.intro)}</Text>
        {primer.sections.map((section) => (
          <View key={section.id} style={styles.section} testID={`primer-section-${section.id}`}>
            <Text style={styles.heading}>{tx(section.title)}</Text>
            <Text style={styles.paragraph}>{tx(section.explanation)}</Text>
            <SectionBody section={section} ctx={ctx} />
            {"notes" in section
              ? (section.notes ?? []).map((n, i) => (
                  <Text key={i} style={styles.tip}>
                    {tx(n)}
                  </Text>
                ))
              : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/** A tappable item that speaks `say` (device voice while the clip is pending). */
function Sound({ say, ctx, children, testID }: { say: string; ctx: Ctx; children: React.ReactNode; testID?: string }) {
  const styles = useStyles();
  const { t } = useT();
  return (
    <Pressable
      onPress={() => speakTarget(ctx.courseId, say)}
      accessibilityRole="button"
      accessibilityLabel={t("primer.listen", { text: say })}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

function SectionBody({ section, ctx }: { section: PrimerSection; ctx: Ctx }) {
  const styles = useStyles();
  const { t } = useT();
  const tx = (text: PrimerText) => primerText(text, ctx.native);
  switch (section.kind) {
    case "kanaTable":
      return (
        <View style={styles.table}>
          {section.rows.map((row) => (
            <View key={row.consonant || "vowels"} style={styles.tableRow}>
              {row.cells.map((cell, i) =>
                cell === null ? (
                  <View key={i} style={[styles.tile, styles.empty]} />
                ) : (
                  <Sound key={cell.kana} say={cell.audio.say} ctx={ctx} testID={`primer-kana-${cell.kana}`}>
                    <Text style={styles.glyph}>{cell.kana}</Text>
                    <Text style={styles.small}>{cell.romaji}</Text>
                  </Sound>
                )
              )}
            </View>
          ))}
        </View>
      );
    case "tones":
      return (
        <View style={{ gap: 10 }}>
          {section.tones.map((tone) => (
            <View key={tone.tone} style={styles.row}>
              <Sound say={tone.audio.say} ctx={ctx} testID={`primer-tone-${tone.tone}`}>
                <Text style={styles.glyph}>{tone.example.hanzi}</Text>
                <Text style={styles.small}>{tone.example.pinyin}</Text>
              </Sound>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.label}>
                  {tone.mark}
                  {tone.contour ? ` · ${tone.contour}` : ""} · {tx(tone.example.gloss)}
                </Text>
                <Text style={styles.paragraph}>{tx(tone.description)}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.subheading}>{t("primer.minimalPairs")}</Text>
          {section.minimalPairs.map((pair) => (
            <View key={pair.a.hanzi + pair.b.hanzi} style={{ gap: 4 }}>
              <View style={styles.row} testID={`primer-pair-${pair.a.hanzi}${pair.b.hanzi}`}>
                {[pair.a, pair.b].map((w) => (
                  <Sound key={w.hanzi} say={w.hanzi} ctx={ctx}>
                    <Text style={styles.glyph}>{w.hanzi}</Text>
                    <Text style={styles.small}>
                      {w.pinyin} · {tx(w.gloss)}
                    </Text>
                  </Sound>
                ))}
              </View>
              {pair.note ? <Text style={styles.tip}>{tx(pair.note)}</Text> : null}
            </View>
          ))}
        </View>
      );
    case "strokes":
      return (
        <View style={{ gap: 10 }}>
          <Text style={styles.subheading}>{t("primer.strokes")}</Text>
          {section.strokes.map((s) => (
            <View key={s.name} style={styles.row}>
              <Text style={[styles.glyph, styles.strokeGlyph]}>{s.shape}</Text>
              <Text style={[styles.paragraph, { flex: 1 }]}>
                {s.name} — {tx(s.description)}
              </Text>
            </View>
          ))}
          <Text style={styles.subheading}>{t("primer.strokeOrder")}</Text>
          {section.rules.map((r) => (
            <View key={r.example} style={styles.row}>
              <Text style={[styles.glyph, styles.strokeGlyph]}>{r.example}</Text>
              <Text style={[styles.paragraph, { flex: 1 }]}>{tx(r.rule)}</Text>
            </View>
          ))}
        </View>
      );
    case "hangulBlocks":
      return (
        <View style={{ gap: 10 }}>
          <Text style={styles.subheading}>{t("primer.consonants")}</Text>
          <View style={styles.wrap}>
            {section.consonants.map((c) => (
              <View key={c.jamo} style={styles.tile} testID={`primer-jamo-${c.jamo}`}>
                <Text style={styles.glyph}>{c.jamo}</Text>
                <Text style={styles.small}>
                  {c.initial || "∅"}
                  {c.final ? ` / ${c.final}` : ""}
                </Text>
                <Text style={styles.small}>{c.name}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.subheading}>{t("primer.vowels")}</Text>
          <View style={styles.wrap}>
            {section.vowels.map((v) => (
              <View key={v.jamo} style={styles.tile} testID={`primer-jamo-${v.jamo}`}>
                <Text style={styles.glyph}>{v.jamo}</Text>
                <Text style={styles.small}>{v.rr}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.subheading}>{t("primer.blocks")}</Text>
          {section.blocks.map((b) => (
            <View key={b.block} style={styles.row}>
              <Sound say={b.audio.say} ctx={ctx} testID={`primer-block-${b.block}`}>
                <Text style={styles.glyph}>{b.block}</Text>
                <Text style={styles.small}>{b.rr}</Text>
              </Sound>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.label}>
                  {b.parts.join(" + ")} = {b.block}
                </Text>
                <Text style={styles.paragraph}>{tx(b.layout)}</Text>
              </View>
            </View>
          ))}
        </View>
      );
  }
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderBottomWidth: 2,
      borderBottomColor: colors.neutral200,
    },
    title: { fontSize: 17, fontWeight: "800", color: colors.neutral700, flexShrink: 1 },
    body: { padding: 20, gap: 16, paddingBottom: 60 },
    note: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: colors.neutral100, borderRadius: radius.md, padding: 10 },
    noteText: { flex: 1, fontSize: 13, color: colors.textMuted },
    section: { gap: 10 },
    heading: { fontSize: 19, fontWeight: "800", color: colors.neutral700 },
    subheading: { fontSize: 15, fontWeight: "800", color: colors.neutral700, marginTop: 4 },
    paragraph: { fontSize: 15, color: colors.text, lineHeight: 22 },
    tip: { fontSize: 14, color: colors.textMuted, lineHeight: 20, fontStyle: "italic" },
    label: { fontSize: 14, fontWeight: "700", color: colors.textMuted },
    table: { gap: 8 },
    tableRow: { flexDirection: "row", gap: 8 },
    row: { flexDirection: "row", gap: 12, alignItems: "center" },
    wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tile: {
      minWidth: 56,
      alignItems: "center",
      borderWidth: 2,
      borderBottomWidth: 4,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: colors.surface,
    },
    empty: { opacity: 0 },
    pressed: { opacity: 0.85 },
    glyph: { fontSize: 26, fontWeight: "700", color: colors.text },
    strokeGlyph: { minWidth: 40, textAlign: "center" },
    small: { fontSize: 12, color: colors.textMuted },
  })
);
