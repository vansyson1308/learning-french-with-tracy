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
import { primerPassedFor } from "@/lib/learning/primer-progress";
import { coursePrimer, isKanaPrimer, primerText, scorePrimerCheckpoint, type PrimerCheckpoint, type PrimerSection, type PrimerText } from "@/lib/script-primer";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

/** kana: a kana primer, whose checkpoint texts speak of kana and the romaji line (ja); a tones primer has its own (zh). */
type Ctx = { courseId: string; native: string; kana: boolean };

export default function PrimerScreen() {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t } = useT();
  const courseId = useProgress((s) => s.activeCourseId);
  const primer = coursePrimer(courseId);
  if (!primer) return <Redirect href="/" />;
  const ctx: Ctx = { courseId, native: courseProfile(courseId).nativeCode, kana: isKanaPrimer(primer) };
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
        {primer.checkpoint ? <Checkpoint checkpoint={primer.checkpoint} ctx={ctx} /> : null}
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

/**
 * P4c: the kana checkpoint at the end of the primer. One item at a time: read a kana and pick its rōmaji, or hear a
 * sound (device voice) and pick the kana. Reaching the pass mark records `primerPassed` for the course — which turns
 * off the romaji line of a `romajiUntilPrimer` course; nothing else is written (no XP, no lesson, no evidence). A
 * failed attempt changes nothing, and it can be retaken at once; no lesson is ever locked behind it.
 * P4d: a tones primer's items — hear a word and pick its pinyin. Passing records `primerPassed` the same way; the
 * reading under the text stays (the learner's own reading-aid switch turns it off), and the texts say so.
 */
function Checkpoint({ checkpoint, ctx }: { checkpoint: PrimerCheckpoint; ctx: Ctx }) {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t } = useT();
  const tx = (text: PrimerText) => primerText(text, ctx.native);
  const passedBefore = useProgress((s) => primerPassedFor(s.primerPassed, ctx.courseId));
  const markPrimerPassed = useProgress((s) => s.markPrimerPassed);
  const [answers, setAnswers] = React.useState<(number | null)[] | null>(null);
  const [index, setIndex] = React.useState(0);

  const start = () => {
    setAnswers(checkpoint.items.map(() => null));
    setIndex(0);
  };
  const total = checkpoint.items.length;
  const done = answers !== null && index >= total;
  const result = done ? scorePrimerCheckpoint(checkpoint, answers) : null;
  React.useEffect(() => {
    if (result?.passed) markPrimerPassed(ctx.courseId);
  }, [result?.passed, markPrimerPassed, ctx.courseId]);

  const header = (
    <>
      <Text style={styles.heading}>{tx(checkpoint.title)}</Text>
      {passedBefore && answers === null ? (
        <View style={styles.badge} testID="primer-checkpoint-passed-badge">
          <Ionicons name="checkmark-circle" size={18} color={colors.greenDark} />
          <Text style={styles.badgeText}>{checkpoint.messages ? tx(checkpoint.messages.passedBadge) : t(ctx.kana ? "primer.checkpoint.passedBadge" : "primer.checkpoint.passedBadgeGeneric")}</Text>
        </View>
      ) : null}
    </>
  );

  if (answers === null) {
    return (
      <View style={styles.section} testID="primer-checkpoint">
        {header}
        <Text style={styles.paragraph}>{tx(checkpoint.intro)}</Text>
        <Pressable onPress={start} accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} testID="primer-checkpoint-start">
          <Text style={styles.primaryButtonText}>{t("primer.checkpoint.start")}</Text>
        </Pressable>
      </View>
    );
  }

  if (result !== null) {
    return (
      <View style={styles.section} testID="primer-checkpoint">
        {header}
        <Text style={styles.subheading} testID="primer-checkpoint-score">
          {t("primer.checkpoint.score", { correct: result.correct, total: result.total })}
        </Text>
        <Text style={styles.paragraph} testID={result.passed ? "primer-checkpoint-passed" : "primer-checkpoint-not-yet"}>
          {result.passed
            ? checkpoint.messages
              ? tx(checkpoint.messages.passed)
              : t(ctx.kana ? "primer.checkpoint.passed" : "primer.checkpoint.passedReadingStays")
            : t("primer.checkpoint.notYet", { passMark: checkpoint.passMark })}
        </Text>
        <Pressable onPress={start} accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} testID="primer-checkpoint-retry">
          <Text style={styles.secondaryButtonText}>{t("primer.checkpoint.retry")}</Text>
        </Pressable>
      </View>
    );
  }

  const item = checkpoint.items[index]!;
  const chosen = answers[index] ?? null;
  const choose = (option: number) => {
    if (chosen !== null) return;
    setAnswers(answers.map((a, i) => (i === index ? option : a)));
  };
  return (
    <View style={styles.section} testID="primer-checkpoint">
      {header}
      <Text style={styles.label}>{t("primer.checkpoint.progress", { n: index + 1, total })}</Text>
      {item.kind === "kanaToRomaji" || item.kind === "hangulToRr" ? (
        <>
          <Text style={styles.paragraph}>{t(item.kind === "kanaToRomaji" ? "primer.checkpoint.readKana" : "primer.checkpoint.readHangul")}</Text>
          <Text style={[styles.glyph, styles.bigGlyph]} testID="primer-checkpoint-kana">
            {item.kind === "kanaToRomaji" ? item.kana : item.text}
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.paragraph}>
            {t(item.kind === "soundToPinyin" ? "primer.checkpoint.listenPinyin" : item.kind === "soundToHangul" ? "primer.checkpoint.listenPickHangul" : "primer.checkpoint.listenPick")}
          </Text>
          <Pressable
            onPress={() => speakTarget(ctx.courseId, item.audio.say)}
            accessibilityRole="button"
            accessibilityLabel={t("primer.checkpoint.play")}
            style={({ pressed }) => [styles.tile, styles.speaker, pressed && styles.pressed]}
            testID="primer-checkpoint-play"
          >
            <Ionicons name="volume-high" size={28} color={colors.skyDark} />
          </Pressable>
        </>
      )}
      <View style={styles.wrap}>
        {item.options.map((option, i) => {
          const state = chosen === null ? null : i === item.correct ? "correct" : i === chosen ? "wrong" : null;
          return (
            <Pressable
              key={option}
              onPress={() => choose(i)}
              disabled={chosen !== null}
              accessibilityRole="button"
              accessibilityLabel={state === null ? option : `${option}${t(state === "correct" ? "ex.state.correct" : "ex.state.wrong")}`}
              style={[styles.tile, styles.optionTile, state === "correct" && styles.correctTile, state === "wrong" && styles.wrongTile]}
              testID={`primer-checkpoint-option-${i}`}
            >
              <Text style={styles.glyph}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      {chosen !== null ? (
        <Pressable
          onPress={() => setIndex(index + 1)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          testID="primer-checkpoint-next"
        >
          <Text style={styles.primaryButtonText}>{index + 1 < total ? t("primer.checkpoint.next") : t("primer.checkpoint.seeResult")}</Text>
        </Pressable>
      ) : null}
    </View>
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
          {section.rows.map((row, rowIndex) => (
            <View key={`${rowIndex}-${row.consonant}`} style={styles.tableRow}>
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
    case "soundContrasts":
      return (
        <View style={{ gap: 10 }}>
          {section.contrasts.map((pair) => (
            <View key={pair.a.hanzi + pair.b.hanzi} style={{ gap: 4 }}>
              <Text style={styles.label}>{pair.focus}</Text>
              <View style={styles.row} testID={`primer-contrast-${pair.a.hanzi}${pair.b.hanzi}`}>
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
    case "toneSandhi":
      return (
        <View style={{ gap: 12 }}>
          {section.rules.map((rule) => (
            <View key={rule.rule} style={{ gap: 6 }} testID={`primer-sandhi-${rule.rule}`}>
              <Text style={styles.paragraph}>{tx(rule.text)}</Text>
              {rule.examples.map((x) => (
                <View key={x.hanzi} style={styles.row}>
                  <Sound say={x.audio.say} ctx={ctx}>
                    <Text style={styles.glyph}>{x.hanzi}</Text>
                  </Sound>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.label}>
                      {t("primer.sandhi.written")}: {x.written} → {t("primer.sandhi.said")}: {x.spoken}
                    </Text>
                    <Text style={styles.small}>{tx(x.gloss)}</Text>
                  </View>
                </View>
              ))}
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
    case "hangulSounds": {
      // P4e: tense / aspirated consonants, compound vowels, double finals, sound changes.
      const positions = [
        ["initial", "primer.consonants"],
        ["vowel", "primer.vowels"],
        ["final", "primer.finals"],
      ] as const;
      return (
        <View style={{ gap: 10 }}>
          {positions.map(([position, heading]) => {
            const letters = (section.jamo ?? []).filter((j) => j.position === position);
            if (letters.length === 0) return null;
            return (
              <View key={position} style={{ gap: 8 }}>
                <Text style={styles.subheading}>{t(heading)}</Text>
                <View style={styles.wrap}>
                  {letters.map((j) => (
                    <View key={`${position}-${j.jamo}`} style={styles.tile} testID={`primer-jamo-${j.jamo}`}>
                      <Text style={styles.glyph}>{j.jamo}</Text>
                      <Text style={styles.small}>{j.rr}</Text>
                      {j.name ? <Text style={styles.small}>{j.name}</Text> : null}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
          {section.rows.map((row, r) => (
            <View key={r} style={{ gap: 6 }}>
              {row.label ? <Text style={styles.label}>{tx(row.label)}</Text> : null}
              <View style={styles.wrap}>
                {row.items.map((item) => (
                  <Sound key={item.text} say={item.audio.say} ctx={ctx} testID={`primer-sound-${item.text}`}>
                    <Text style={styles.glyph}>{item.text}</Text>
                    <Text style={styles.small}>{item.said ? `[${item.said}] ${item.rr}` : item.rr}</Text>
                    {item.gloss ? <Text style={styles.small}>{tx(item.gloss)}</Text> : null}
                  </Sound>
                ))}
              </View>
            </View>
          ))}
        </View>
      );
    }
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
    tableRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    bigGlyph: { fontSize: 48, textAlign: "center" },
    speaker: { alignSelf: "center", paddingVertical: 12, paddingHorizontal: 20 },
    optionTile: { minWidth: 72 },
    correctTile: { borderColor: colors.greenLight, backgroundColor: colors.correctBg },
    wrongTile: { borderColor: colors.rose, backgroundColor: colors.wrongBg },
    badge: { flexDirection: "row", gap: 6, alignItems: "center" },
    badgeText: { fontSize: 14, fontWeight: "700", color: colors.greenDark },
    primaryButton: { backgroundColor: colors.green, borderRadius: radius.md, paddingVertical: 12, alignItems: "center", borderBottomWidth: 4, borderBottomColor: colors.greenDark },
    primaryButtonText: { fontSize: 16, fontWeight: "800", color: colors.white },
    secondaryButton: { borderWidth: 2, borderColor: colors.neutral200, borderRadius: radius.md, paddingVertical: 12, alignItems: "center" },
    secondaryButtonText: { fontSize: 16, fontWeight: "800", color: colors.skyDark },
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
