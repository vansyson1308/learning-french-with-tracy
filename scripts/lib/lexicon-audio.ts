import { existsSync, readFileSync } from "fs";

import { safeResolve } from "./pipeline";

/**
 * P3f: the lexicon layer voices the syllabus words only (the daily-words
 * stream and the words a learner meets first) — not every lexeme and
 * example; the rest of the dictionary speaks through the device voice.
 * Without a syllabus the lexicon layer is empty.
 */
export function lexiconAudioStrings(lang: string): string[] {
  const rel = safeResolve(`content/${lang}/lexicon/lexemes.json`);
  const syl = safeResolve(`content/${lang}/lexicon/syllabus.json`);
  if (!existsSync(rel) || !existsSync(syl)) return [];
  const doc = JSON.parse(readFileSync(rel, "utf8")) as { lexemes: { id: string; surface: string }[] };
  const members = new Set((JSON.parse(readFileSync(syl, "utf8")) as { entries: { lexemeId: string }[] }).entries.map((e) => e.lexemeId));
  const set = new Set<string>();
  for (const lex of doc.lexemes) if (members.has(lex.id)) set.add(lex.surface);
  return [...set].sort((a, b) => a.localeCompare(b));
}
