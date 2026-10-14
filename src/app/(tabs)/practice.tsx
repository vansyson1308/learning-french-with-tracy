import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useT } from "@/lib/i18n";
import { DuoButton } from "@/components/duo-button";
import { Flag } from "@/components/flag";
import { SpeakerButton } from "@/components/speaker-button";
import { useCourseContent } from "@/lib/content";
import { courseProfile } from "@/lib/course-profile";
import {
  cardForSurface,
  dueReviewQueue,
  itemIdForCourse,
  memoryStrengthPercent,
} from "@/lib/learning/engine";
import { dueInDaysAt } from "@/lib/srs";
import { dueListeningReviewCount, dueSpeakingReviewCounts } from "@/lib/session/sources";
import { dailyQuests, dueSrsWords, useProgress, type Quest } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export default function PracticeScreen() {
  const colors = useThemeColors();
  const styles = useStyles();
  const { t, languageName } = useT();
  const progress = useProgress();
  const { activeCourseId } = progress;
  const courseProgress = progress.course();
  const { pack, allWords } = useCourseContent(activeCourseId);
  const profile = courseProfile(activeCourseId);
  const caps = profile.capabilities;
  const targetLanguage = languageName(profile.targetCode, profile.targetLanguage);
  // FSRS courses count reviews from the card map; legacy courses stay on
  // the srs map — one count, two sources.
  const dueCount = caps.fsrs
    ? dueReviewQueue(activeCourseId, courseProgress.cards).length
    : dueSrsWords(courseProgress.srs ?? {}).length;
  // Listening review (P7 §79-81): due listen cards whose word clip has a
  // bundled asset. Capability-gated; zero for every other course.
  const dueListenCount = caps.listening
    ? dueListeningReviewCount(activeCourseId, courseProgress.cards)
    : 0;
  // Speaking review (P8 §16): sessionable vs total kept apart — a due speak
  // card with no authored prompt stays VISIBLY due, never silently hidden.
  const dueSpeak = caps.speaking
    ? dueSpeakingReviewCounts(activeCourseId, courseProgress.cards)
    : { sessionable: 0, total: 0 };
  const quests = dailyQuests(progress);

  const hasLexicon = caps.lexicon;

  const uniqueWords = [
    ...new Map(allWords().map((w) => [w.target, w] as const)).values(),
  ];
  const words = uniqueWords
    .map((w) => {
      const card = caps.fsrs ? cardForSurface(activeCourseId, courseProgress.cards, w.target) : undefined;
      return {
        ...w,
        stat: courseProgress.wordStats[itemIdForCourse(activeCourseId, w.target)],
        dueAt: caps.fsrs ? card?.due : courseProgress.srs?.[w.target]?.dueAt,
        // FSRS strength = real retrievability (memory model); legacy
        // courses keep their correctness-ratio semantics untouched.
        memory: caps.fsrs ? memoryStrengthPercent(card) : null,
      };
    })
    .filter((w) => w.stat);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.heading}>{t("practice.title")}</Text>
        <View style={styles.courseRow}>
          <Flag courseId={activeCourseId} size={20} />
          <Text style={styles.courseLabel}>{languageName(profile.targetCode, pack.targetLanguage)}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="treasure-chest"
              size={24}
              color={colors.amber}
            />
            <Text style={styles.cardTitle}>{t("practice.dailyQuests")}</Text>
          </View>
          {quests.map((quest) => (
            <QuestRow key={quest.id} quest={quest} />
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="brain" size={24} color={colors.indigo} />
            <Text style={styles.cardTitle}>{t("practice.spacedReview")}</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {dueCount === 0 ? t("practice.noWordsDue") : t("practice.wordsDue", { n: dueCount })}
          </Text>
          <DuoButton
            label={t("practice.reviewWords")}
            testID="practice-review-words"
            variant="primary"
            disabled={dueCount === 0}
            onPress={() => router.push("/lesson/srs")}
          />
        </View>

        {caps.listening ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="headset" size={24} color={colors.sky} />
              <Text style={styles.cardTitle}>{t("practice.listeningReview")}</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {dueListenCount === 0 ? t("practice.noListeningDue") : t("practice.listeningDue", { n: dueListenCount })}
            </Text>
            <DuoButton
              label={t("practice.reviewListening")}
              testID="practice-review-listening"
              variant="primary"
              disabled={dueListenCount === 0}
              onPress={() => router.push("/lesson/srs-listening")}
            />
          </View>
        ) : null}

        {caps.speaking ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="mic" size={24} color={colors.indigo} />
              <Text style={styles.cardTitle}>{t("practice.speakingReview")}</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {dueSpeak.total === 0
                ? t("practice.noSpeakingDue")
                : dueSpeak.sessionable === 0
                  ? t("practice.speakingDueNoPrompts", { n: dueSpeak.total })
                  : t("practice.speakingDue", { n: dueSpeak.sessionable })}
            </Text>
            <DuoButton
              label={t("practice.reviewSpeaking")}
              testID="practice-review-speaking"
              variant="primary"
              disabled={dueSpeak.sessionable === 0}
              onPress={() => router.push("/lesson/srs-speaking")}
            />
          </View>
        ) : null}

        {caps.writing ? (
          <View style={styles.card} testID="practice-writing-card">
            <View style={styles.cardHeader}>
              <Ionicons name="pencil" size={24} color={colors.greenDark} />
              <Text style={styles.cardTitle}>{t("practice.writingPractice")}</Text>
            </View>
            <Text style={styles.cardSubtitle}>{t("practice.writingBody", { language: targetLanguage })}</Text>
            <DuoButton
              label={t("practice.practiceWriting")}
              testID="practice-writing"
              variant="primary"
              onPress={() => router.push("/lesson/writing-practice")}
            />
          </View>
        ) : null}

        {caps.conversation ? (
          <View style={styles.card} testID="practice-conversation-card">
            <View style={styles.cardHeader}>
              <Ionicons name="chatbubbles" size={24} color={colors.sky} />
              <Text style={styles.cardTitle}>{t("practice.conversationPractice")}</Text>
            </View>
            <Text style={styles.cardSubtitle}>{t("practice.conversationBody")}</Text>
            <DuoButton
              label={t("practice.haveConversation")}
              testID="practice-conversation"
              variant="primary"
              onPress={() => router.push("/lesson/conversation")}
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bandage" size={24} color={colors.rose} />
            <Text style={styles.cardTitle}>{t("practice.mistakes")}</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {courseProgress.mistakes.length === 0
              ? t("practice.noMistakes")
              : t("practice.mistakesToFix", { n: courseProgress.mistakes.length })}
          </Text>
          <DuoButton
            label={t("practice.practiceMistakes")}
            testID="practice-mistakes"
            variant="primary"
            disabled={courseProgress.mistakes.length === 0}
            onPress={() => router.push("/lesson/mistakes")}
          />
        </View>

        {hasLexicon ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="library" size={24} color={colors.skyDark} />
              <Text style={styles.cardTitle}>{t("practice.vocabulary")}</Text>
            </View>
            <Text style={styles.cardSubtitle}>{t("practice.vocabularyBody", { language: targetLanguage })}</Text>
            <DuoButton
              label={t("practice.openVocabulary")}
              testID="practice-vocabulary"
              variant="primary"
              onPress={() => router.push("/vocabulary")}
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="book" size={24} color={colors.greenDark} />
            <Text style={styles.cardTitle}>{t("practice.words", { n: words.length })}</Text>
          </View>
          {caps.fsrs && words.length > 0 ? (
            <Text style={styles.cardSubtitle}>{t("practice.strengthHint")}</Text>
          ) : null}
          {words.length === 0 ? (
            <Text style={styles.cardSubtitle}>{t("practice.wordsEmpty")}</Text>
          ) : (
            words
              .sort((a, b) => (b.stat?.lastSeen ?? 0) - (a.stat?.lastSeen ?? 0))
              .map((word) => {
                const total = (word.stat?.correct ?? 0) + (word.stat?.wrong ?? 0);
                const legacyStrength = total === 0 ? 0 : (word.stat!.correct / total) * 100;
                const strength = caps.fsrs ? (word.memory ?? 0) : legacyStrength;
                const due = word.dueAt !== undefined ? dueInDaysAt(word.dueAt) : null;
                return (
                  <View key={word.target} style={styles.wordRow}>
                    <SpeakerButton text={word.target} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.wordTarget}>
                        {word.emoji} {word.target}
                      </Text>
                      <Text style={styles.wordNative}>{word.native}</Text>
                      {due !== null && due === 0 ? (
                        <Text style={styles.dueBadge}>{t("practice.dueNow")}</Text>
                      ) : due !== null && due <= 3 ? (
                        <Text style={styles.dueSoon}>{t("practice.reviewInDays", { n: due })}</Text>
                      ) : null}
                    </View>
                    <View style={styles.strengthTrack}>
                      <View
                        style={[
                          styles.strengthFill,
                          {
                            width: `${strength}%`,
                            backgroundColor:
                              strength >= 70
                                ? colors.green
                                : strength >= 40
                                  ? colors.amber
                                  : colors.rose,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuestRow({ quest }: { quest: Quest }) {
  const colors = useThemeColors();
  const styles = useStyles();
  const { tm } = useT();
  const pct = (quest.value / quest.target) * 100;
  return (
    <View style={styles.questRow}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text
          style={[styles.questLabel, quest.done && { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.3}
        >
          {tm(quest.label)}
        </Text>
        <View style={styles.questTrack}>
          <View
            style={[
              styles.questFill,
              { width: `${pct}%` },
              quest.done && { backgroundColor: colors.green },
            ]}
          />
          <Text style={styles.questCount} maxFontSizeMultiplier={1.1}>
            {quest.value}/{quest.target}
          </Text>
        </View>
      </View>
      <Ionicons
        name={quest.done ? "checkmark-circle" : "ellipse-outline"}
        size={28}
        color={quest.done ? colors.green : colors.neutral300}
      />
    </View>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20, gap: 16, paddingBottom: 60 },
  heading: { fontSize: 26, fontWeight: "800", color: colors.neutral700 },
  courseRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -8 },
  courseLabel: { fontSize: 14, fontWeight: "700", color: colors.textMuted },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  card: {
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderRadius: radius.xl,
    padding: 18,
    gap: 12,
  },
  cardTitle: { fontSize: 19, fontWeight: "800", color: colors.neutral700 },
  cardSubtitle: { fontSize: 14, color: colors.textMuted },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  wordTarget: { fontSize: 16, fontWeight: "700", color: colors.text },
  wordNative: { fontSize: 13, color: colors.textMuted },
  dueBadge: { fontSize: 11, fontWeight: "700", color: colors.rose, marginTop: 2 },
  dueSoon: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  strengthTrack: {
    width: 64,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.neutral200,
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: radius.full },
  questRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  questLabel: { fontSize: 15, fontWeight: "700", color: colors.text },
  questTrack: {
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.neutral200,
    overflow: "hidden",
    justifyContent: "center",
  },
  questFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.full,
    backgroundColor: colors.amber,
  },
  questCount: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.neutral700,
    textAlign: "center",
  },
}));
