/**
 * QC 2026-10-30 §2.1: in a picture-choice question every option's picture
 * is distinct and none misleads — otherwise the question is text only.
 */
import { describe, expect, test } from "bun:test";

import { ALL_COURSE_BUNDLES } from "../../content/course-bundles";
import { registerCourseBundle } from "../course-bundle";
import { isUnpicturedWord, picturesAreDistinct, withPictureCues } from "../learning/picture-cues";
import { buildSelect } from "../learning/today";
import { buildSrsExercises, seededRng } from "../review-builder";
import type { Word } from "../types";

for (const b of ALL_COURSE_BUNDLES) registerCourseBundle(b);

const wordsOf = (courseId: string): Word[] => {
  const bundle = ALL_COURSE_BUNDLES.find((b) => b.id === courseId)!;
  const seen = new Map<string, Word>();
  for (const s of bundle.pack.sections) for (const u of s.units) for (const w of u.words) if (!seen.has(w.target)) seen.set(w.target, w);
  return [...seen.values()];
};

const allOrNone = (options: { emoji?: string }[]) => options.every((o) => !o.emoji) || picturesAreDistinct(options);

describe("picture cues", () => {
  test("distinct pictures stay; a shared picture or a kinship question removes every picture", () => {
    type Option = { text: string; emoji?: string };
    const distinct: Option[] = [{ text: "a", emoji: "🍎" }, { text: "b", emoji: "🍞" }];
    expect(withPictureCues(distinct)).toEqual(distinct);
    const shared: Option[] = [{ text: "người đàn ông", emoji: "👨" }, { text: "bố / ba", emoji: "👨" }, { text: "bản đồ", emoji: "🗺️" }];
    expect(withPictureCues(shared)).toEqual([{ text: "người đàn ông" }, { text: "bố / ba" }, { text: "bản đồ" }]);
    expect(withPictureCues(distinct, true)).toEqual([{ text: "a" }, { text: "b" }]);
    expect(shared[0].emoji).toBe("👨"); // the input is never mutated
  });

  test("a picture on some options only is never shown", () => {
    expect(withPictureCues([{ text: "a", emoji: "🍎" }, { text: "b" }])).toEqual([{ text: "a" }, { text: "b" }]);
  });

  test("kinship words are unpictured (es-vi el papá)", () => {
    const papa = wordsOf("es-vi").find((w) => w.target === "el papá")!;
    expect(isUnpicturedWord("es-vi", papa)).toBe(true);
    expect(isUnpicturedWord("es-vi", wordsOf("es-vi").find((w) => w.target === "el pan")!)).toBe(false);
  });

  test.each(ALL_COURSE_BUNDLES.map((b) => b.id))("%s: every generated recognition question has distinct pictures or none", (courseId) => {
    const pool = wordsOf(courseId);
    for (const [i, word] of pool.entries()) {
      const select = buildSelect({ courseId, id: `t-${i}`, word, pool, rng: seededRng(i + 1), direction: "targetToNative" });
      if (select) expect({ id: word.target, ok: allOrNone(select.options) }).toEqual({ id: word.target, ok: true });
    }
    for (const ex of buildSrsExercises(pool.map((w) => w.target), pool, 7, pool.length, courseId)) {
      if (ex.type === "select") expect({ id: ex.id, ok: allOrNone(ex.options) }).toEqual({ id: ex.id, ok: true });
    }
  });
});
