/**
 * Audio manifest key order without ICU for Han / kana / Hangul (bun on Windows ordered 累 after 红, the Linux
 * runner before it, so a local compile drifted from the committed zh-vi slice).
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";

import { sortAudioKeys } from "../lib/audio-key-order";
import { parseAudioManifest, renderAudioSlice } from "../lib/course-bundles";
import { safeResolve } from "../lib/pipeline";

const e = (key: string) => ({ key, file: `./x/${key.length}.mp3` });
const keys = (list: { key: string }[]) => list.map((x) => x.key);

describe("sortAudioKeys", () => {
  test("Han keys are in code-point order (累 U+7D2F before 红 U+7EA2), whatever the runtime's collation says", () => {
    expect(keys(sortAudioKeys([e("zh-vi:红色"), e("zh-vi:红"), e("zh-vi:累")]))).toEqual(["zh-vi:累", "zh-vi:红", "zh-vi:红色"]);
  });

  test("kana and Hangul courses are in code-point order too", () => {
    expect(keys(sortAudioKeys([e("ja-vi:ア"), e("ja-vi:あ"), e("ja-vi:い")]))).toEqual(["ja-vi:あ", "ja-vi:い", "ja-vi:ア"]);
    expect(keys(sortAudioKeys([e("ko-vi:나"), e("ko-vi:가")]))).toEqual(["ko-vi:가", "ko-vi:나"]);
  });

  test("a Latin-script course keeps localeCompare (accents and case as before)", () => {
    const fr = ["fr-en:été", "fr-en:Etre", "fr-en:etre", "fr-en:zéro", "fr-en:Ça va"];
    expect(keys(sortAudioKeys(fr.map(e)))).toEqual([...fr].sort((a, b) => a.localeCompare(b)));
  });

  test("courses are grouped in code-point order of their ids; the mode is per course, so a mixed course is one total order", () => {
    const sorted = keys(sortAudioKeys([e("zh-vi:T恤"), e("zh-vi:a"), e("zh-vi:Tom"), e("fr-en:b"), e("de-en:a")]));
    expect(sorted).toEqual(["de-en:a", "fr-en:b", "zh-vi:Tom", "zh-vi:T恤", "zh-vi:a"]);
  });

  test("the input is not mutated", () => {
    const input = [e("zh-vi:红"), e("zh-vi:累")];
    sortAudioKeys(input);
    expect(keys(input)).toEqual(["zh-vi:红", "zh-vi:累"]);
  });
});

describe("committed manifest and slices follow the order", () => {
  const manifest = parseAudioManifest(readFileSync(safeResolve("src/content/audio-manifest.ts"), "utf8"));

  test("src/content/audio-manifest.ts is already sorted by sortAudioKeys", () => {
    expect(keys(manifest)).toEqual(keys(sortAudioKeys(manifest)));
  });

  test("the zh-vi slice renders 累 before 红", () => {
    const slice = renderAudioSlice("zh-vi", manifest);
    const lei = slice.indexOf('"zh-vi:累"');
    const hong = slice.indexOf('"zh-vi:红"');
    expect(lei).toBeGreaterThan(0);
    expect(lei).toBeLessThan(hong);
  });
});
