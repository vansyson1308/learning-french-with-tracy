/**
 * Vocabulary Browser (Phase 4) — French-only, offline, entered from
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

import { CloseButton } from "@/components/close-button";
import { courseCapabilities } from "@/lib/capabilities";
import { serializeCardKey } from "@/lib/learning/card-key";
import type { FsrsCardState } from "@/lib/learning/scheduler";
import { useLexiconRepository } from "@/lib/lexicon/use-lexicon-repository";
import type { LexemeSummary, LexiconSort } from "@/lib/lexicon/types";
import { exitScreen } from "@/lib/navigation";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

type Filter = "all" | "learned" | "not-learned" | "noun" | "verb" | "expression";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "learned", label: "Learned" },
  { key: "not-learned", label: "Not yet" },
  { key: "noun", label: "Nouns" },
  { key: "verb", label: "Verbs" },
  { key: "expression", label: "Expressions" },
];

export default function VocabularyScreen() {
  const styles = useStyles();
  const colors = useThemeColors();
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const cards = useProgress(
    (s) => s.courses[s.activeCourseId]?.cards as Record<string, FsrsCardState> | undefined
  );
  const repoState = useLexiconRepository();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<LexiconSort>("course");
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState<LexemeSummary[] | null>(null);
  const [frequencySort, setFrequencySort] = useState(false);
  // One timestamp per mount is plenty for due indicators (pure render).
  const [now] = useState(() => Date.now());

  const hasLexicon = courseCapabilities(activeCourseId).lexicon;

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
        <Text style={styles.heading}>Vocabulary</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.controls}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search French or English…"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search vocabulary"
          style={styles.search}
        />
        {query.trim().length === 0 ? (
          <View style={styles.chipRow}>
            <SortChip label="Course order" active={sort === "course"} onPress={() => setSort("course")} />
            <SortChip label="A–Z" active={sort === "alpha"} onPress={() => setSort("alpha")} />
            {frequencySort ? (
              <SortChip
                label="Frequency"
                active={sort === "frequency"}
                onPress={() => setSort("frequency")}
              />
            ) : null}
          </View>
        ) : null}
        <View style={styles.chipRow}>
          {FILTERS.map((f) => (
            <SortChip
              key={f.key}
              label={f.label}
              active={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </View>
        {visible !== null ? (
          <Text style={styles.count} accessibilityLiveRegion="polite">
            {visible.length} word{visible.length === 1 ? "" : "s"}
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
              {query.trim().length > 0 ? "No words match your search." : "No words match this filter."}
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
                  {item.pos === "noun" && item.gender ? `${item.gender} noun` : item.pos}
                </Text>
                {due !== null ? (
                  <View
                    style={[
                      styles.memoryDot,
                      { backgroundColor: due === "due" ? colors.amber : colors.green },
                    ]}
                    accessibilityLabel={due === "due" ? "Review due" : "In your reviews"}
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
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
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
