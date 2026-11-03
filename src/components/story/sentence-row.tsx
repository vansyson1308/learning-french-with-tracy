/**
 * One sentence of a graded story (P5b): its number (tap → translation),
 * its words (tap → gloss sheet), a play button when audio is bundled, and
 * the read-along highlight while it plays. Each word is its own Text in a
 * wrapping row — a nested span has no native view, so it could be neither
 * a screen-reader element nor a test target.
 *
 * CJK courses: a word with a reading is laid out by RubyText (furigana over
 * it) inside its own pressable, and the sentence carries the romaji line
 * while the course shows it — the lessons' display. Without a reading
 * layer (`reading` null: every Latin-script course) the row is unchanged.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { RubyText } from "@/components/reading/ruby-text";
import { useT } from "@/lib/i18n";
import { readingLine, type ScriptReading } from "@/lib/learning/script-reading";
import { readingTokens, type CompiledStorySentence, type ReadingToken } from "@/lib/stories/content";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";
import type { StoryReadingAid } from "@/lib/use-reading-aid";

export function SentenceRow(props: {
  sentence: CompiledStorySentence;
  index: number;
  active: boolean;
  showTranslation: boolean;
  newLexemes: ReadonlySet<string>;
  selectedLexeme: string | null;
  canPlay: boolean;
  onToggleTranslation: () => void;
  onPlay: () => void;
  onWord: (lexemeId: string) => void;
  /** The course's reading layer (CJK); null or absent renders the plain row. */
  reading?: StoryReadingAid | null;
}) {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t } = useT();
  const { sentence, index, reading } = props;
  const tokens = useMemo(() => readingTokens(sentence.pieces), [sentence]);
  const scripts = useMemo(() => (reading ? tokens.map((tok) => tokenScript(tok, reading)) : null), [tokens, reading]);
  const romaji = useMemo(() => reading?.romaji(sentence.text), [reading, sentence]);
  const hasRuby = scripts?.some((s) => s !== undefined) ?? false;
  const dialogue = sentence.speaker !== "N";

  return (
    <View style={[styles.row, props.active && styles.rowActive]} testID={`story-sentence-${index + 1}`}>
      <Pressable
        onPress={props.onToggleTranslation}
        accessibilityRole="button"
        accessibilityLabel={`${t("stories.translation")} ${index + 1}`}
        testID={`story-translate-${index + 1}`}
        style={styles.number}
      >
        <Text style={styles.numberText}>{index + 1}</Text>
      </Pressable>
      <View style={styles.body}>
        <View style={hasRuby ? [styles.words, styles.wordsRuby] : styles.words}>
          {dialogue ? <Text style={[styles.text, styles.dialogue]}>— </Text> : null}
          {tokens.map((tok, i) =>
            scripts?.[i] ? (
              <RubyToken
                key={i}
                token={tok}
                script={scripts[i]!}
                dialogue={dialogue}
                isNew={!!tok.lexemeId && props.newLexemes.has(tok.lexemeId)}
                selected={!!tok.lexemeId && props.selectedLexeme === tok.lexemeId}
                onWord={props.onWord}
              />
            ) : tok.lexemeId ? (
              <Text
                key={i}
                onPress={() => props.onWord(tok.lexemeId!)}
                suppressHighlighting
                accessibilityRole="button"
                style={[styles.text, dialogue && styles.dialogue]}
                testID={`story-word-${tok.lexemeId}`}
              >
                <Text
                  style={[
                    props.newLexemes.has(tok.lexemeId) && styles.newWord,
                    props.selectedLexeme === tok.lexemeId && styles.selectedWord,
                  ]}
                >
                  {tok.word}
                </Text>
                {tok.trail}
              </Text>
            ) : (
              <Text key={i} style={[styles.text, dialogue && styles.dialogue]}>
                {tok.word}
                {tok.trail}
              </Text>
            )
          )}
        </View>
        {romaji !== undefined ? (
          <Text style={styles.romaji} testID="reading-romaji">
            {romaji}
          </Text>
        ) : null}
        {props.showTranslation ? (
          <Text style={styles.translation} testID={`story-translation-${index + 1}`}>
            {sentence.translation}
          </Text>
        ) : null}
      </View>
      {props.canPlay ? (
        <Pressable onPress={props.onPlay} accessibilityRole="button" accessibilityLabel={t("stories.listen")} style={styles.play} hitSlop={8}>
          <Ionicons name="volume-medium" size={20} color={colors.sky} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** The readings over a token's word and over the text that trails it (an unlinked word glued on); none → plain. */
type TokenScript = { word?: ScriptReading; trail?: ScriptReading };

function tokenScript(tok: ReadingToken, reading: StoryReadingAid): TokenScript | undefined {
  const word = tok.word ? reading.token(tok.word, tok.lexemeId) : undefined;
  const trail = tok.trail.trim() ? reading.token(tok.trail) : undefined;
  return word || trail ? { ...(word ? { word } : {}), ...(trail ? { trail } : {}) } : undefined;
}

/** A word laid out with its reading over it; a lexeme word stays a tap target with the same testID. */
function RubyToken(props: {
  token: ReadingToken;
  script: TokenScript;
  dialogue: boolean;
  isNew: boolean;
  selected: boolean;
  onWord: (lexemeId: string) => void;
}) {
  const styles = useStyles();
  const { token, script, dialogue } = props;
  const plain = [styles.text, dialogue && styles.dialogue];
  const wordStyle = [...plain, props.isNew && styles.newWord, props.selected && styles.selectedWord];
  const content = (
    <>
      {script.word ? (
        <RubyText text={token.word} reading={script.word} textStyle={wordStyle} showRomaji={false} />
      ) : token.word ? (
        <Text style={wordStyle}>{token.word}</Text>
      ) : null}
      {script.trail ? (
        <RubyText text={token.trail} reading={script.trail} textStyle={plain} showRomaji={false} />
      ) : token.trail ? (
        <Text style={plain}>{token.trail}</Text>
      ) : null}
    </>
  );
  if (!token.lexemeId) return <View style={styles.rubyToken}>{content}</View>;
  const lexemeId = token.lexemeId;
  const label = script.word ? `${token.word} (${readingLine(script.word)})` : token.word;
  return (
    <Pressable
      onPress={() => props.onWord(lexemeId)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.rubyToken}
      testID={`story-word-${lexemeId}`}
    >
      {content}
    </Pressable>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  row: { flexDirection: "row" as const, gap: 10, paddingVertical: 8, paddingHorizontal: 8, borderRadius: radius.md },
  rowActive: { backgroundColor: colors.selectedBg },
  number: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.neutral200,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 2,
  },
  numberText: { fontSize: 13, fontWeight: "800" as const, color: colors.textMuted },
  body: { flex: 1, gap: 4 },
  words: { flexDirection: "row" as const, flexWrap: "wrap" as const },
  /** Furigana make a word taller: words sit on one baseline under their readings. */
  wordsRuby: { alignItems: "flex-end" as const },
  rubyToken: { flexDirection: "row" as const, alignItems: "flex-end" as const },
  romaji: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  text: { fontSize: 19, lineHeight: 28, color: colors.text },
  dialogue: { fontStyle: "italic" as const },
  newWord: { color: colors.indigo, fontWeight: "800" as const, textDecorationLine: "underline" as const },
  selectedWord: { backgroundColor: colors.selectedBg, color: colors.selectedText },
  translation: { fontSize: 15, lineHeight: 21, color: colors.textMuted },
  play: { paddingTop: 4 },
}));
