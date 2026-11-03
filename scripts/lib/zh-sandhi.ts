/**
 * P4d: Mandarin tone sandhi over stored citation tones. The course stores CC-CEDICT pinyin in citation tones
 * (zh-plan decision 2: 你好 nǐ hǎo, 不是 bù shì, 一个 yī gè); this says what a learner HEARS. The tone primer checks its
 * examples with it, and the audio front-end of the audio session (zh-plan decision 10) is meant to reuse it.
 *
 * Three rules, in this order, over one word or short phrase:
 *  1. 不 bù is said bú before a fourth tone (不是 bú shì, 不要 bú yào); before any other tone it stays bù (不好, 不来).
 *  2. 一 yī is said yí before a fourth tone (一个 yí gè, 一样 yí yàng) and yì before a first, second or third tone
 *     (一天 yì tiān, 一起 yì qǐ, 一百 yì bǎi). It stays yī where it is a number in a sequence: at the end (十一, 统一),
 *     after 第 or another numeral (第一, 十一, 一百一), and before a digit or a date unit (一二三, 一月, 一号).
 *  3. A third tone before a third tone is said as a second tone (你好 ní hǎo, 可以 ké yǐ). In a run of three or more,
 *     every one but the last rises — the reading of a run said as one group; the primer teaches two-syllable words only.
 * A neutral tone (0) after 不 or 一 has no tone of its own to decide by, so rules 1 and 2 leave it alone — except 个
 * written neutral (一个 yī ge), which keeps its fourth tone under the sandhi (yí ge). Pure; tones are 1–4 and 0 for the
 * neutral tone, as parsePinyinReading gives them.
 */

export type ToneSyllable = { base: string; tone: number };

/** Digits of a number said one by one or as a sequence (一二三, 十一); 百 / 千 / 万 after 一 take the sandhi (一百 yì bǎi). */
const DIGITS = new Set([..."〇零一二三四五六七八九十两"]);
const NUMERALS = new Set([...DIGITS, ..."百千万"]);
const DATE_UNITS = new Set([..."月号日"]);

/** The tones said for `syllables` (one per character of `hanzi`, citation tones); throws on a length mismatch. */
export function sandhiTones(hanzi: string, syllables: readonly ToneSyllable[]): number[] {
  const chars = [...hanzi];
  if (chars.length !== syllables.length) throw new Error(`${hanzi}: ${chars.length} hanzi for ${syllables.length} syllables`);
  const citation = syllables.map((s) => s.tone);
  const out = [...citation];
  for (let i = 0; i < chars.length; i++) {
    const next = chars[i + 1] === "个" && citation[i + 1] === 0 ? 4 : citation[i + 1];
    if (chars[i] === "不" && syllables[i]!.base === "bu" && citation[i] === 4 && next === 4) out[i] = 2;
    if (chars[i] === "一" && syllables[i]!.base === "yi" && citation[i] === 1 && next !== undefined && next !== 0) {
      const prev = chars[i - 1];
      const after = chars[i + 1]!;
      const counted = prev === "第" || (prev !== undefined && NUMERALS.has(prev)) || DIGITS.has(after) || DATE_UNITS.has(after);
      if (!counted) out[i] = next === 4 ? 2 : 4;
    }
  }
  for (let i = 0; i + 1 < out.length; i++) if (out[i] === 3 && out[i + 1] === 3) out[i] = 2;
  return out;
}
