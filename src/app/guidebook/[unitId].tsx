import { useLocalSearchParams } from "expo-router";

import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CloseButton } from "@/components/close-button";
import { SpeakerButton } from "@/components/speaker-button";
import { useCourseContent } from "@/lib/content";
import { parseGuidebook, type InlineSpan } from "@/lib/guidebook-markdown";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius } from "@/lib/theme";

function InlineSpans({ spans }: { spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((span, i) => (
        <Text
          key={i}
          style={[
            span.bold && { fontWeight: "800" as const },
            span.italic && { fontStyle: "italic" as const },
          ]}
        >
          {span.text}
        </Text>
      ))}
    </>
  );
}

/** Real markdown-subset rendering (§50): emphasis is displayed, not stripped. */
function GuidebookText({ markdown }: { markdown: string }) {
  const styles = useStyles();
  return (
    <View style={{ gap: 10 }}>
      {parseGuidebook(markdown).map((block, i) => {
        if (block.kind === "heading") {
          return (
            <Text key={i} style={styles.heading}>
              <InlineSpans spans={block.spans} />
            </Text>
          );
        }
        if (block.kind === "bullets") {
          return (
            <View key={i} style={{ gap: 6 }}>
              {block.items.map((item, j) => (
                <View key={j} style={{ flexDirection: "row", gap: 8 }}>
                  <Text style={styles.paragraph}>•</Text>
                  <Text style={[styles.paragraph, { flex: 1 }]}>
                    <InlineSpans spans={item} />
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={i} style={styles.paragraph}>
            <InlineSpans spans={block.spans} />
          </Text>
        );
      })}
    </View>
  );
}

export default function GuidebookScreen() {
  const styles = useStyles();
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const { getUnit } = useCourseContent(activeCourseId);
  const unit = getUnit(unitId ?? "");

  if (!unit) return null;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <CloseButton />
        <Text style={styles.title} numberOfLines={1}>
          {unit.title} Guidebook
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.description}>{unit.description}</Text>
        <GuidebookText markdown={unit.guidebook} />

        <Text style={styles.heading}>Key words</Text>
        <View style={{ gap: 8 }}>
          {unit.words.map((word) => (
            <View key={word.target} style={styles.wordRow}>
              <SpeakerButton text={word.target} size={36} />
              <Text style={styles.wordText}>
                {word.emoji} {word.target} — {word.native}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
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
  title: { fontSize: 17, fontWeight: "800", color: colors.neutral700 },
  body: { padding: 20, gap: 14, paddingBottom: 60 },
  description: {
    fontSize: 15,
    color: colors.textMuted,
    backgroundColor: colors.neutral100,
    borderRadius: radius.md,
    padding: 12,
  },
  heading: { fontSize: 19, fontWeight: "800", color: colors.neutral700, marginTop: 8 },
  paragraph: { fontSize: 15, color: colors.text, lineHeight: 22 },
  wordRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  wordText: { fontSize: 16, color: colors.text, fontWeight: "600", flexShrink: 1 },
}));
