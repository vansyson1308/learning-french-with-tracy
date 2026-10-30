/**
 * A select has one right answer: no distractor may mean the same as the key.
 * zh-en asked "goodbye" with both 再见 and 拜拜 on offer, and only one was keyed.
 */
import { describe, expect, test } from "bun:test";

import { loadPacks, loadSynonymGroups, sharedMeaning, synonymDistractorProblems, targetCodeOf } from "../lib/pipeline";

const pack = (exercises: Record<string, unknown>[], words: { target: string; native: string }[]) =>
  ({ sections: [{ units: [{ id: "u", words: words.map((w) => ({ ...w, emoji: "x" })), lessons: [{ id: "l", exercises }] }] }] }) as never;

const WORDS = [
  { target: "再见", native: "goodbye" },
  { target: "拜拜", native: "bye-bye" },
  { target: "谢谢", native: "thank you" },
  { target: "请", native: "please" },
];
const select = (mode: string, options: string[], correct: number) => ({ type: "select", id: "e1", mode, prompt: "p", options: options.map((text) => ({ text })), correct });
const GROUPS = [["再见", "拜拜"]];

describe("synonym distractors", () => {
  test("declared synonyms fail in both directions", () => {
    expect(synonymDistractorProblems(pack([select("nativeToTarget", ["拜拜", "再见", "请"], 1)], WORDS), GROUPS)).toEqual([
      'e1: distractor "拜拜" means the same as the answer "再见" — a question has one right answer',
    ]);
    expect(synonymDistractorProblems(pack([select("targetToNative", ["goodbye", "bye-bye", "please"], 1)], WORDS), GROUPS)).toEqual([
      'e1: distractor "goodbye" means the same as the answer "bye-bye" — a question has one right answer',
    ]);
  });

  test("a clearly wrong distractor passes; so does a listen question (it asks what was heard, not what it means)", () => {
    expect(synonymDistractorProblems(pack([select("nativeToTarget", ["谢谢", "再见", "请"], 1)], WORDS), GROUPS)).toEqual([]);
    expect(synonymDistractorProblems(pack([select("listen", ["拜拜", "再见", "请"], 1)], WORDS), GROUPS)).toEqual([]);
  });

  test("two words sharing one whole meaning fail without being declared", () => {
    const words = [{ target: "el padre", native: "bố / cha" }, { target: "el papá", native: "bố / ba" }, { target: "tres", native: "ba" }, { target: "la mesa", native: "cái bàn" }];
    expect(synonymDistractorProblems(pack([select("nativeToTarget", ["el papá", "el padre", "la mesa"], 1)], words), [])).toHaveLength(1);
    expect(synonymDistractorProblems(pack([select("nativeToTarget", ["la mesa", "el padre", "tres"], 1)], words), [])).toEqual([]);
  });

  test("a register or qualifier label keeps two meanings apart; a partly shared word does not count", () => {
    expect(sharedMeaning("goodbye (formal)", "hello / goodbye (informal)")).toBe(false);
    expect(sharedMeaning("the student (male)", "the student (female)")).toBe(false);
    expect(sharedMeaning("xin chào", "xin lỗi")).toBe(false);
    expect(sharedMeaning("bản đồ; thẻ; vé", "vé")).toBe(true);
    expect(sharedMeaning("the fish", "fish")).toBe(true);
  });

  test("every shipped course passes, and every declared synonym is a word of that language's packs", () => {
    const groups = loadSynonymGroups();
    const problems: string[] = [];
    const surfaces = new Map<string, Set<string>>();
    for (const { courseId, pack: p } of loadPacks()) {
      const lang = targetCodeOf(courseId);
      problems.push(...synonymDistractorProblems(p, groups[lang] ?? []).map((m) => `${courseId}: ${m}`));
      const known = surfaces.get(lang) ?? new Set<string>();
      for (const s of p.sections) for (const u of s.units) for (const w of u.words) known.add(w.target);
      surfaces.set(lang, known);
    }
    expect(problems).toEqual([]);
    for (const [lang, sets] of Object.entries(groups)) for (const set of sets) for (const w of set) expect(`${lang}:${w}:${surfaces.get(lang)?.has(w)}`).toBe(`${lang}:${w}:true`);
    expect(groups.zh).toContainEqual(["再见", "拜拜"]);
  });
});
