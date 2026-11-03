/**
 * Ruby-like layout (P4b stage 5, task 4): a target text with its reading
 * over or under each run — furigana above kanji, pinyin under each hanzi,
 * Revised Romanization under each hangul word — and an optional Hán-Việt
 * line beneath. System fonts only (Android ships Noto CJK; no bundled
 * font). The reading is decoration for sighted learners: screen readers get
 * one label "text (reading)" instead of the split runs.
 */
import React from "react";
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";

import { readingLine, type ScriptReading } from "@/lib/learning/script-reading";
import { useThemeColors } from "@/lib/theme";

type RubyTextProps = {
  text: string;
  reading: ScriptReading;
  /** Style of the base text (size, weight, colour); the reading scales from its font size. */
  textStyle?: StyleProp<TextStyle>;
  /** Colour of the reading and the Hán-Việt line (defaults to the muted text colour). */
  readingColor?: string;
  /** Centre the runs (option cards) instead of starting them at the left. */
  center?: boolean;
};

export function RubyText({ text, reading, textStyle, readingColor, center }: RubyTextProps) {
  const colors = useThemeColors();
  const base = StyleSheet.flatten(textStyle) ?? {};
  const fontSize = typeof base.fontSize === "number" ? base.fontSize : 17;
  const rubyStyle: TextStyle = {
    fontSize: Math.max(10, Math.round(fontSize * 0.5)),
    lineHeight: Math.max(12, Math.round(fontSize * 0.65)),
    color: readingColor ?? colors.textMuted,
    textAlign: "center",
  };
  const above = reading.position === "above";
  const label = `${text} (${readingLine(reading)})${reading.hanViet ? `, ${reading.hanViet}` : ""}`;
  return (
    <View testID="ruby-text" accessible accessibilityLabel={label} style={center ? styles.centered : undefined}>
      <View style={[styles.row, center && styles.rowCentered, above ? styles.alignEnd : styles.alignStart]}>
        {reading.segments.map((segment, i) => (
          <View key={i} style={styles.cell}>
            {above ? (
              <Text style={rubyStyle} testID={segment.ruby ? "ruby-reading" : undefined}>
                {segment.ruby ?? " "}
              </Text>
            ) : null}
            <Text style={textStyle}>{segment.base}</Text>
            {!above ? (
              <Text style={rubyStyle} testID={segment.ruby ? "ruby-reading" : undefined}>
                {segment.ruby ?? " "}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
      {reading.hanViet ? (
        <Text
          testID="reading-hanviet"
          style={[styles.hanViet, { color: readingColor ?? colors.textMuted, textAlign: center ? "center" : "left" }]}
        >
          {reading.hanViet}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: "center" },
  row: { flexDirection: "row", flexWrap: "wrap" },
  rowCentered: { justifyContent: "center" },
  alignEnd: { alignItems: "flex-end" },
  alignStart: { alignItems: "flex-start" },
  cell: { alignItems: "center" },
  hanViet: { fontSize: 13, fontStyle: "italic", marginTop: 2 },
});
