/**
 * "Đọc & nghe" (P5b): the course's graded stories, the suggested one first
 * (3–6 words new to this learner, src/lib/stories/selection.ts), then all of
 * them in reading order with how many of their words are new to the learner.
 * Reads card states, never writes them.
 */

import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CloseButton } from "@/components/close-button";
import { hasCapability } from "@/lib/course-profile";
import { useT } from "@/lib/i18n";
import { exitScreen } from "@/lib/navigation";
import { storyLevel, storyList, type CompiledStory } from "@/lib/stories/content";
import { nextStory, unknownLexemes } from "@/lib/stories/selection";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export default function StoriesScreen() {
  const styles = useStyles();
  const { t } = useT();
  const courseId = useProgress((s) => s.activeCourseId);
  const cards = useProgress((s) => s.courses[s.activeCourseId]?.cards);
  if (!hasCapability(courseId, "stories")) return <Redirect href="/" />;
  const stories = storyList(courseId);
  const pick = nextStory(stories, cards);

  return (
    <SafeAreaView style={styles.safe} testID="stories-screen">
      <View style={styles.top}>
        <CloseButton onPress={exitScreen} />
        <Text style={styles.heading}>{t("stories.listTitle")}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {pick ? (
          <>
            <Text style={styles.section}>{t("stories.recommended")}</Text>
            <StoryCard story={pick.story} unknown={pick.unknown.length} highlight testID="stories-recommended" />
          </>
        ) : null}
        <Text style={styles.section}>{t("stories.listTitle")}</Text>
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} unknown={unknownLexemes(story, cards).length} testID={`stories-item-${story.id}`} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StoryCard(props: { story: CompiledStory; unknown: number; highlight?: boolean; testID: string }) {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t } = useT();
  const { story } = props;
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/story/[id]", params: { id: story.id } })}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, props.highlight && styles.cardHighlight, pressed && styles.pressed]}
      testID={props.testID}
    >
      <Ionicons name="book-outline" size={26} color={props.highlight ? colors.indigo : colors.sky} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{story.title}</Text>
        <Text style={styles.cardBlurb}>{story.blurb}</Text>
        <Text style={styles.meta}>
          {t("stories.level", { n: storyLevel(story) })} · {props.unknown === 0 ? t("stories.allKnown") : t("stories.unknownCount", { n: props.unknown })}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  heading: { fontSize: 24, fontWeight: "800" as const, color: colors.text },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { fontSize: 14, fontWeight: "800" as const, color: colors.textMuted, textTransform: "uppercase" as const, marginTop: 8 },
  card: {
    flexDirection: "row" as const,
    gap: 14,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.neutral200,
    borderRadius: radius.lg,
    padding: 14,
    backgroundColor: colors.surface,
  },
  cardHighlight: { borderColor: colors.indigo },
  pressed: { opacity: 0.85 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: "800" as const, color: colors.text },
  cardBlurb: { fontSize: 15, color: colors.textMuted },
  meta: { fontSize: 13, fontWeight: "700" as const, color: colors.textMuted },
}));
