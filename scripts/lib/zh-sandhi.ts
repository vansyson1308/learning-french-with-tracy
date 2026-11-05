/**
 * P4d: Mandarin tone sandhi over stored citation tones. The course stores CC-CEDICT pinyin in citation tones
 * (zh-plan decision 2: 你好 nǐ hǎo, 不是 bù shì, 一个 yī gè); this says what a learner HEARS. The tone primer checks its
 * examples with `sandhiTones`, and the audio front-end (zh-plan decision 10, scripts/lib/tts/zh-readings.ts) reads
 * every clip with `phraseSandhiTones`, which adds the word structure to the third-tone rule.
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

/** Rules 1 and 2 (不, 一) over citation tones; the third-tone rule is applied by the caller. */
function yiBuTones(chars: readonly string[], syllables: readonly ToneSyllable[]): number[] {
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
  return out;
}

/** The tones said for `syllables` (one per character of `hanzi`, citation tones); throws on a length mismatch. */
export function sandhiTones(hanzi: string, syllables: readonly ToneSyllable[]): number[] {
  const chars = [...hanzi];
  if (chars.length !== syllables.length) throw new Error(`${hanzi}: ${chars.length} hanzi for ${syllables.length} syllables`);
  const out = yiBuTones(chars, syllables);
  for (let i = 0; i + 1 < out.length; i++) if (out[i] === 3 && out[i + 1] === 3) out[i] = 2;
  return out;
}

/**
 * One word of a phrase for `phraseSandhiTones`: its hanzi, citation syllables, and — for a word of three or more
 * syllables — how it splits into two stored parts (`parts`: syllable counts, e.g. 展览|馆 [2, 1], 纸|老虎 [1, 2]).
 */
export type SandhiWord = { hanzi: string; syllables: readonly ToneSyllable[]; parts?: readonly number[] };

/** A constituent of the third-tone cycle: a syllable index, or a group of constituents. */
type Node = number | Node[];

const firstOf = (n: Node): number => (typeof n === "number" ? n : firstOf(n[0]!));
const lastOf = (n: Node): number => (typeof n === "number" ? n : lastOf(n[n.length - 1]!));

/**
 * Rule 3 by constituents, inside out (the cycle of PaddleSpeech's _three_sandhi, which misaki's v1.1 front-end
 * adapts): a word's own syllables first, then, left to right, the last syllable of each constituent rises when the
 * next constituent starts with a third tone as said so far. So a run of single-syllable words rises on every syllable
 * but the last (我|很|好 wó hén hǎo, as `sandhiTones`), 展览|馆 rises on 展 and 览 (zhán lán guǎn), and 小|老虎 keeps
 * 小 (xiǎo láo hǔ): 老 has already risen inside 老虎, so 小 no longer stands before a third tone.
 */
function threeCycle(node: Node, tones: number[]): void {
  if (typeof node === "number") return;
  for (const child of node) threeCycle(child, tones);
  for (let k = 0; k + 1 < node.length; k++) {
    const end = lastOf(node[k]!);
    if (tones[end] === 3 && tones[firstOf(node[k + 1]!)] === 3) tones[end] = 2;
  }
}

/** A word's constituents: its parts when they cover it exactly (two or more), else its syllables in a row. */
function wordNode(word: SandhiWord, start: number): Node {
  const n = word.syllables.length;
  const indices = Array.from({ length: n }, (_, k) => start + k);
  const parts = word.parts;
  if (parts === undefined || parts.length < 2 || parts.some((p) => !Number.isInteger(p) || p < 1) || parts.reduce((a, b) => a + b, 0) !== n) return indices;
  const out: Node[] = [];
  let at = 0;
  for (const p of parts) {
    const slice = indices.slice(at, at + p);
    out.push(slice.length === 1 ? slice[0]! : slice);
    at += p;
  }
  return out;
}

/**
 * Feet of a run of single-syllable words (Chen 2000's foot formation): up to three form one foot (我很好: one foot,
 * every syllable but the last rises, as `sandhiTones`); a longer run is cut into feet of two from the left, the last
 * foot taking a stray third syllable (我有|两本书 wó yǒu liáng běn shū, not wó yóu liáng běn shū).
 */
function feet(run: readonly number[]): Node[] {
  if (run.length === 0) return [];
  if (run.length <= 3) return run.length === 1 ? [run[0]!] : [[...run]];
  const out: Node[] = [];
  let i = 0;
  while (run.length - i > 3) {
    out.push([run[i]!, run[i + 1]!]);
    i += 2;
  }
  out.push(run.length - i === 1 ? run[i]! : run.slice(i));
  return out;
}

/**
 * The tones said over one phrase (the words between two punctuation marks), one array per word: rules 1 and 2 over
 * the phrase as `sandhiTones` applies them, except that 一 ending a stored word of two or more syllables keeps yī
 * (星期一, 统一 — counted, whatever follows); then rule 3 by word structure (`threeCycle`), runs of single-syllable
 * words grouped into feet (`feet`). Throws on a word whose hanzi and syllables differ in length.
 */
export function phraseSandhiTones(words: readonly SandhiWord[]): number[][] {
  const chars: string[] = [];
  const syllables: ToneSyllable[] = [];
  const wordFinal: boolean[] = [];
  for (const w of words) {
    const cs = [...w.hanzi];
    if (cs.length !== w.syllables.length) throw new Error(`${w.hanzi}: ${cs.length} hanzi for ${w.syllables.length} syllables`);
    cs.forEach((c, k) => {
      chars.push(c);
      syllables.push(w.syllables[k]!);
      wordFinal.push(cs.length >= 2 && k === cs.length - 1);
    });
  }
  const tones = yiBuTones(chars, syllables).map((t, i) => (chars[i] === "一" && wordFinal[i] ? syllables[i]!.tone : t));
  const phrase: Node[] = [];
  let run: number[] = []; // single-syllable words in a row
  const flushRun = () => {
    phrase.push(...feet(run));
    run = [];
  };
  let start = 0;
  for (const w of words) {
    const node = wordNode(w, start);
    if (typeof node === "number") run.push(node);
    else if (node.length === 1) run.push(node[0] as number);
    else {
      flushRun();
      phrase.push(node);
    }
    start += w.syllables.length;
  }
  flushRun();
  threeCycle(phrase, tones);
  const out: number[][] = [];
  start = 0;
  for (const w of words) {
    out.push(tones.slice(start, start + w.syllables.length));
    start += w.syllables.length;
  }
  return out;
}
