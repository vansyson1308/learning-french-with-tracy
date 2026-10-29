/**
 * Graded-story reader (P5b): read along with the bundled sentence audio
 * (the playing sentence is highlighted), tap a word for its gloss, tap a
 * sentence number for its translation. Then three comprehension questions,
 * then the word check (/session/story) — the only part that feeds FSRS.
 * Needs no network. A story without bundled audio is read along in the
 * device voice (labelled as such), or as text with an install hint when the
 * phone has no offline voice for the language (QC 2026-10-29b §2.4).
 */

import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CloseButton } from "@/components/close-button";
import { DuoButton } from "@/components/duo-button";
import { SentenceRow } from "@/components/story/sentence-row";
import { StoryQuestions } from "@/components/story/story-questions";
import { WordSheet } from "@/components/story/word-sheet";
import { courseProfile, hasCapability } from "@/lib/course-profile";
import { useT } from "@/lib/i18n";
import { lexemeMetaFor } from "@/lib/learning/lexicon-index";
import { exitScreen } from "@/lib/navigation";
import { sentenceAudio, storyAudioSourceFor, storyFor, type CompiledStory } from "@/lib/stories/content";
import { readAlongMode } from "@/lib/stories/read-along";
import { useDeviceReadAlong, useDeviceVoice } from "@/lib/stories/use-device-read-along";
import { useStoryPlayer } from "@/lib/stories/use-story-player";
import { storyCheckLexemes } from "@/lib/stories/word-check";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

type Phase = "read" | "questions" | "finished";

export default function StoryReaderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = useProgress((s) => s.activeCourseId);
  const story = typeof id === "string" ? storyFor(courseId, id) : undefined;
  if (!hasCapability(courseId, "stories")) return <Redirect href="/" />;
  if (!story) return <Missing />;
  return <StoryReader key={story.id} courseId={courseId} story={story} />;
}

function Missing() {
  const styles = useStyles();
  const { t } = useT();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.blurb}>{t("stories.notFound")}</Text>
        <DuoButton label={t("common.back")} onPress={exitScreen} />
      </View>
    </SafeAreaView>
  );
}

function StoryReader({ courseId, story }: { courseId: string; story: CompiledStory }) {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t, languageName } = useT();
  const profile = courseProfile(courseId);
  const sources = useMemo(() => story.sentences.map((s) => sentenceAudio(courseId, s)), [courseId, story]);
  const texts = useMemo(() => story.sentences.map((s) => s.text), [story]);
  const source = storyAudioSourceFor(courseId, story);
  const withAudio = source === "bundled";
  const player = useStoryPlayer(withAudio ? sources : []);
  // Never a silent fallback: only a story without bundled audio looks for a voice.
  const voice = useDeviceVoice(profile.ttsLocale, !withAudio);
  const reader = useDeviceReadAlong(texts, withAudio ? null : voice ?? null);
  // undefined voice = still looking (nothing shown yet); a voice that failed to speak counts as none.
  const mode = voice === undefined ? null : readAlongMode(source, reader.voiceFailed ? null : voice);
  const playback = mode === "device-voice" ? reader.state : player.state;
  const canPlay = mode === "bundled" || mode === "device-voice";
  const newSet = useMemo(() => new Set(story.newLexemes), [story]);
  const [phase, setPhase] = useState<Phase>("read");
  const [shown, setShown] = useState<Record<number, true>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const meta = selected ? lexemeMetaFor(courseId, selected) : undefined;
  const checkCount = storyCheckLexemes(story, picked).length;

  const finishReading = () => {
    player.pause();
    reader.leave();
    setSelected(null);
    setPhase("questions");
  };
  const togglePick = (lexemeId: string) =>
    setPicked((p) => (p.includes(lexemeId) ? p.filter((x) => x !== lexemeId) : [...p, lexemeId]));
  const startCheck = () =>
    router.replace({ pathname: "/session/story", params: { id: story.id, picked: picked.join(",") } });

  return (
    <SafeAreaView style={styles.safe} testID="story-reader">
      <View style={styles.top}>
        <CloseButton onPress={exitScreen} />
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>
      </View>
      {phase === "read" ? (
        <>
          <View style={styles.controls}>
            {mode === "bundled" ? (
              <DuoButton
                label={player.state.playing ? t("stories.pause") : t("stories.listen")}
                variant="secondary"
                onPress={player.state.playing ? player.pause : player.play}
                testID="story-listen"
              />
            ) : mode === "device-voice" ? (
              <>
                <DuoButton
                  label={reader.state.playing ? t("stories.pause") : t("stories.listen")}
                  variant="secondary"
                  onPress={reader.state.playing ? reader.pause : reader.play}
                  testID="story-play"
                />
                <View style={styles.voiceLabel} testID="story-device-voice-label">
                  <Ionicons name="phone-portrait-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.hint}>{t("stories.deviceVoice")}</Text>
                </View>
              </>
            ) : mode === "text-only" ? (
              <Text style={styles.note} testID="story-device-voice-hint">
                {t(Platform.OS === "ios" ? "stories.deviceVoiceHintIos" : "stories.deviceVoiceHint", {
                  language: languageName(profile.targetCode, profile.targetLanguage),
                })}
              </Text>
            ) : null}
            <Text style={styles.hint}>{t("stories.tapHint")}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.text} testID="story-text">
            {story.sentences.map((sentence, i) => (
              <SentenceRow
                key={i}
                sentence={sentence}
                index={i}
                active={playback.playing && playback.index === i}
                showTranslation={!!shown[i]}
                newLexemes={newSet}
                selectedLexeme={selected}
                canPlay={canPlay}
                onToggleTranslation={() => setShown((s) => (s[i] ? omit(s, i) : { ...s, [i]: true }))}
                onPlay={() => (mode === "device-voice" ? reader.playFrom(i) : player.playFrom(i))}
                onWord={(lexemeId) => setSelected((cur) => (cur === lexemeId ? null : lexemeId))}
              />
            ))}
            <DuoButton label={t("stories.finishReading")} variant="primary" onPress={finishReading} testID="story-finish-reading" />
          </ScrollView>
          {meta ? (
            <WordSheet
              meta={meta}
              isNew={newSet.has(meta.id)}
              picked={picked.includes(meta.id)}
              onTogglePick={() => togglePick(meta.id)}
              onClose={() => setSelected(null)}
            />
          ) : null}
        </>
      ) : phase === "questions" ? (
        <StoryQuestions
          questions={story.questions}
          onDone={(n) => {
            setScore(n);
            setPhase("finished");
          }}
        />
      ) : (
        <View style={styles.center} testID="story-finished">
          <Ionicons name="book" size={48} color={colors.indigo} />
          <Text style={styles.score}>{t("stories.score", { n: score, total: story.questions.length })}</Text>
          {checkCount > 0 ? (
            <>
              <Text style={styles.blurb}>{t("stories.wordsToCheck", { n: checkCount })}</Text>
              <DuoButton label={t("stories.checkWords")} variant="primary" onPress={startCheck} testID="story-check-words" />
            </>
          ) : (
            <DuoButton
              label={t("stories.done")}
              variant="primary"
              onPress={() => {
                useProgress.getState().recordPracticeSession();
                exitScreen();
              }}
              testID="story-done"
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function omit(record: Record<number, true>, key: number): Record<number, true> {
  const { [key]: _drop, ...rest } = record;
  return rest;
}

const useStyles = makeThemedStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  title: { flex: 1, fontSize: 22, fontWeight: "800" as const, color: colors.text },
  controls: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  note: { fontSize: 14, color: colors.textMuted, backgroundColor: colors.neutral100, borderRadius: radius.md, padding: 10 },
  hint: { fontSize: 13, color: colors.textMuted },
  voiceLabel: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4 },
  text: { paddingHorizontal: 12, paddingBottom: 32, gap: 4 },
  center: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, gap: 16, padding: 24 },
  score: { fontSize: 22, fontWeight: "800" as const, color: colors.text, textAlign: "center" as const },
  blurb: { fontSize: 16, color: colors.textMuted, textAlign: "center" as const },
}));
