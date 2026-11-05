/**
 * P4d: tone sandhi over citation tones (scripts/lib/zh-sandhi.ts) — what the tone primer checks its examples with.
 */
import { describe, expect, test } from "bun:test";

import { parsePinyinReading } from "../../src/lib/languages/zh";
import { sandhiTones } from "../lib/zh-sandhi";

const said = (hanzi: string, pinyin: string) => sandhiTones(hanzi, parsePinyinReading(pinyin)!);

describe("tone sandhi", () => {
  test("third tone before third tone rises", () => {
    expect(said("你好", "nǐ hǎo")).toEqual([2, 3]);
    expect(said("可以", "kě yǐ")).toEqual([2, 3]);
    expect(said("水果", "shuǐ guǒ")).toEqual([2, 3]);
    expect(said("老师", "lǎo shī")).toEqual([3, 1]);
    // a run said as one group: every one but the last
    expect(said("我很好", "wǒ hěn hǎo")).toEqual([2, 2, 3]);
  });

  test("不 is bú before a fourth tone only", () => {
    expect(said("不是", "bù shì")).toEqual([2, 4]);
    expect(said("不要", "bù yào")).toEqual([2, 4]);
    expect(said("不好", "bù hǎo")).toEqual([4, 3]);
    expect(said("不来", "bù lái")).toEqual([4, 2]);
    expect(said("不", "bù")).toEqual([4]);
  });

  test("一 is yí before a fourth tone, yì before the others, yī when it counts", () => {
    expect(said("一个", "yī gè")).toEqual([2, 4]);
    expect(said("一样", "yī yàng")).toEqual([2, 4]);
    expect(said("一天", "yī tiān")).toEqual([4, 1]);
    expect(said("一年", "yī nián")).toEqual([4, 2]);
    expect(said("一起", "yī qǐ")).toEqual([4, 3]);
    expect(said("一百", "yī bǎi")).toEqual([4, 3]);
    expect(said("第一", "dì yī")).toEqual([4, 1]);
    expect(said("十一", "shí yī")).toEqual([2, 1]);
    expect(said("一月", "yī yuè")).toEqual([1, 4]);
    expect(said("一二三", "yī èr sān")).toEqual([1, 4, 1]);
    expect(said("一", "yī")).toEqual([1]);
  });

  test("a neutral tone after 一 decides nothing, except 个; other syllables read bu / yi are not 不 / 一", () => {
    expect(said("一下", "yī xià")).toEqual([2, 4]);
    expect(said("一个", "yī ge")).toEqual([2, 0]);
    expect(said("部队", "bù duì")).toEqual([4, 4]);
    expect(said("衣服", "yī fu")).toEqual([1, 0]);
  });

  test("a length mismatch is refused", () => {
    expect(() => said("你好", "nǐ")).toThrow("2 hanzi for 1 syllables");
  });
});
