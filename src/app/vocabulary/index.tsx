/**
 * Vocabulary Browser (Phase 4) — lexicon courses only, offline, entered from
 * Practice (never a bottom tab). Lookup and exploration only: it reads
 * learner state (FSRS cards) for the learned/due indicators but NEVER
 * writes it — browsing and opening entries cannot create cards; PATH and
 * TODAY remain the only ways to start learning a word.
 */

import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useT, type Translator } from "@/lib/i18n";
import { CloseButton } from "@/components/close-button";
import { courseProfile, hasCapability } from "@/lib/course-profile";
import { serializeCardKey } from "@/lib/learning/card-key";
import type { FsrsCardState } from "@/lib/learning/scheduler";
import { useLexiconRepository } from "@/lib/lexicon/use-lexicon-repository";
import type { LexemeSummary, LexiconSort } from "@/lib/lexicon/types";
import { exitScreen } from "@/lib/navigation";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

type Filter = "all" | "learned" | "not-learned" | "noun" | "verb" | "expression";

const FILTERS: Filter[] = ["all", "learned", "not-learned", "noun", "verb", "expression"];

/** Part-of-speech label in the UI language (unknown tags fall back to the tag itself). */
export function posLabel(t: Translator["t"], pos: string, gender?: string | null): string {
  if (pos === "noun" && gender) return t("vocab.genderNoun", { gender });
  const known = ["noun", "verb", "adjective", "adverb", "expression", "pronoun", "preposition", "number", "other"];
  return known.includes(pos) ? t(`vocab.pos.${pos}` as never) : pos;
}

export default function VocabularyScreen() {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t, languageName } = useT();
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const cards = useProgress(
    (s) => s.courses[s.activeCourseId]?.cards as Record<string, FsrsCardState> | undefined
  );
  const repoState = useLexiconRepository(activeCourseId);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<LexiconSort>("course");
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState<LexemeSummary[] | null>(null);
  const [frequencySort, setFrequencySort] = useState(false);
  // One timestamp per mount is plenty for due indicators (pure render).
  const [now] = useState(() => Date.now());

  const hasLexicon = hasCapability(activeCourseId, "lexicon");
  const profile = courseProfile(activeCourseId);

  useEffect(() => {
    if (!repoState) return;
    let alive = true;
    repoState.repo.supportsFrequencySort().then((ok) => {
      if (alive) setFrequencySort(ok);
    });
    return () => {
      alive = false;
    };
  }, [repoState]);

  useEffect(() => {
    if (!repoState || !hasLexicon) return;
    let alive = true;
    const trimmed = query.trim();
    const load = trimmed.length > 0 ? repoState.repo.search(trimmed) : repoState.repo.list({ sort });
    load.then((result) => {
      if (alive) setRows(result);
    });
    return () => {
      alive = false;
    };
  }, [repoState, query, sort, hasLexicon]);

  const learnedIds = useMemo(() => {
    const set = new Set<string>();
    for (const key of Object.keys(cards ?? {})) set.add(key.slice(0, key.lastIndexOf("|")));
    return set;
  }, [cards]);

  const visible = useMemo(() => {
    if (rows === null) return null;
    return rows.filter((r) => {
      if (filter === "learned") return learnedIds.has(r.id);
      if (filter === "not-learned") return !learnedIds.has(r.id);
      if (filter === "noun" || filter === "verb" || filter === "expression") return r.pos === filter;
      return true;
    });
  }, [rows, filter, learnedIds]);

  if (!hasLexicon) return <Redirect href="/" />;

  const dueFor = (id: string): "due" | "scheduled" | null => {
    const card = cards?.[serializeCardKey({ itemId: id, skill: "recognize" })];
    if (!card) return null;
    return card.due <= now ? "due" : "scheduled";
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <CloseButton onPress={() => exitScreen()} />
        <Text style={styles.heading}>{t("vocab.title")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.controls}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("vocab.searchPlaceholder", { target: languageName(profile.targetCode, profile.targetLanguage), native: languageName(profile.nativeCode, profile.nativeLanguage) })}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t("vocab.searchLabel")}
          testID="vocab-search"
          style={styles.search}
        />
        {query.trim().length === 0 ? (
          <View style={styles.chipRow}>
            <SortChip label={t("vocab.sort.course")} active={sort === "course"} onPress={() => setSort("course")} testID="vocab-sort-course" />
            <SortChip label={t("vocab.sort.alpha")} active={sort === "alpha"} onPress={() => setSort("alpha")} testID="vocab-sort-alpha" />
            {frequencySort ? (
              <SortChip
                label={t("vocab.sort.frequency")}
                active={sort === "frequency"}
                onPress={() => setSort("frequency")}
              />
            ) : null}
          </View>
        ) : null}
        <View style={styles.chipRow}>
          {FILTERS.map((f) => (
            <SortChip
              key={f}
              label={t(`vocab.filter.${f}`)}
              active={filter === f}
              onPress={() => setFilter(f)}
              testID={`vocab-filter-${f}`}
            />
          ))}
        </View>
        {visible !== null ? (
          <Text style={styles.count} accessibilityLiveRegion="polite">
            {t("vocab.count", { n: visible.length })}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={visible ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listBody}
        ListEmptyComponent={
          visible === null ? null : (
            <Text style={styles.empty}>
              {query.trim().length > 0 ? t("vocab.noMatchSearch") : t("vocab.noMatchFilter")}
            </Text>
          )
        }
        renderItem={({ item }) => {
          const due = dueFor(item.id);
          return (
            <Pressable
              onPress={() => router.push(`/vocabulary/${encodeURIComponent(item.id)}`)}
              accessibilityRole="button"
              accessibilityLabel={`${item.surface}, ${item.gloss}`}
              style={styles.row}
            >
              <View style={styles.rowText}>
                <Text testID="vocab-row-surface" style={styles.rowSurface}>{item.surface}</Text>
                <Text style={styles.rowGloss}>{item.gloss}</Text>
              </View>
              <View style={styles.rowMeta}>
                <Text style={styles.rowPos}>
                  {posLabel(t, item.pos, item.gender)}
                </Text>
                {due !== null ? (
                  <View
                    style={[
                      styles.memoryDot,
                      { backgroundColor: due === "due" ? colors.amber : colors.green },
                    ]}
                    accessibilityLabel={due === "due" ? t("vocab.reviewDue") : t("vocab.inReviews")}
                  />
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

function SortChip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
      testID={testID}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
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
    heading: { fontSize: 20, fontWeight: "800", color: colors.neutral700 },
    controls: { paddingHorizontal: 16, gap: 8, paddingBottom: 6 },
    search: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.full,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
    },
    chipActive: { borderColor: colors.skyDark, backgroundColor: colors.neutral100 },
    chipText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
    chipTextActive: { color: colors.skyDark },
    count: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
    listBody: { paddingHorizontal: 16, paddingBottom: 40 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.neutral200,
    },
    rowText: { flex: 1, gap: 1 },
    rowSurface: { fontSize: 16, fontWeight: "700", color: colors.text },
    rowGloss: { fontSize: 13, color: colors.textMuted },
    rowMeta: { alignItems: "flex-end", gap: 4 },
    rowPos: { fontSize: 11, fontWeight: "700", color: colors.textMuted },
    memoryDot: { width: 10, height: 10, borderRadius: 5 },
    empty: { fontSize: 14, color: colors.textMuted, textAlign: "center", paddingTop: 30 },
  })
);
