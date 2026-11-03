/**
 * Numbers in Japanese clip text, spelt in kana for the audio front-end (P4c; scripts/lib/tts/ja-kana.ts). MeCab
 * read numerals with their counters (四時 よじ, 一匹 いっぴき, 3000円 さんぜんえん); without it, the course text's
 * Arabic and kanji numerals are spelt here — the number by place value with the sound changes of 百 / 千
 * (さんびゃく, ろっぴゃく, はっぴゃく, さんぜん, はっせん), the counter with its own (いっぷん, よじ, はたち…).
 * Original code (no source adapted). A counter missing from the table is read as the bare number + the
 * text after it, which is how the stored readings would read it anyway.
 */

const UNITS = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];

/** Kana of 1–9999 (no 万). */
function below10000(n: number): string {
  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  let out = "";
  if (thousands > 0) out += thousands === 1 ? "せん" : thousands === 3 ? "さんぜん" : thousands === 8 ? "はっせん" : `${UNITS[thousands]}せん`;
  if (hundreds > 0) out += hundreds === 1 ? "ひゃく" : hundreds === 3 ? "さんびゃく" : hundreds === 6 ? "ろっぴゃく" : hundreds === 8 ? "はっぴゃく" : `${UNITS[hundreds]}ひゃく`;
  if (tens > 0) out += tens === 1 ? "じゅう" : `${UNITS[tens]}じゅう`;
  if (ones > 0) out += UNITS[ones];
  return out;
}

/** Kana of a cardinal 0 ≤ n < 10⁸ (ぜろ, さんびゃくごじゅう, ななまんにせん). */
export function numberKana(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n >= 1e8) throw new Error(`ja numbers: ${n} is out of range`);
  if (n === 0) return "ぜろ";
  const man = Math.floor(n / 10000);
  const rest = n % 10000;
  return `${man > 0 ? `${below10000(man)}まん` : ""}${rest > 0 ? below10000(rest) : ""}`;
}

/**
 * The number's kana with its last element changed by the counter after it: `small` (1 → いっ, 6 → ろっ, 8 → はっ,
 * 10 → じゅっ, 100 → ひゃっ) before a counter starting with k/s/t/h, as the counter table says.
 */
function geminated(n: number, which: ReadonlySet<number>): string {
  const base = numberKana(n);
  const ones = n % 10;
  if (ones !== 0) {
    if (!which.has(ones)) return base;
    const stem = base.slice(0, -UNITS[ones]!.length);
    return stem + (ones === 1 ? "いっ" : ones === 6 ? "ろっ" : ones === 8 ? "はっ" : UNITS[ones]!);
  }
  if (which.has(10) && n % 100 !== 0) return `${base.slice(0, -"じゅう".length)}じゅっ`;
  if (which.has(10) && n % 1000 === 100) return `${base.slice(0, -"ひゃく".length)}ひゃっ`;
  return base;
}

type Counter = { kana: string; read: (n: number) => string };

const GEM_KSTH = new Set([1, 6, 8, 10]);
/** さ-row counters keep ろく (ろくさい, ろくさつ). */
const GEM_S = new Set([1, 8, 10]);
const plain = (kana: string): Counter => ({ kana, read: (n) => numberKana(n) + kana });
/** h-row counters: 本 ほん → いっぽん, さんぼん, ろっぽん, はっぽん, じゅっぽん. */
const hRow = (h: string, b: string, p: string): Counter => ({
  kana: h,
  read: (n) => {
    const ones = n % 10;
    if (ones === 3 || (ones === 0 && n % 1000 === 0 && n >= 1000)) return numberKana(n) + b;
    if (ones === 1 || ones === 6 || ones === 8 || (ones === 0 && n % 100 !== 0) || n % 1000 === 100) return geminated(n, GEM_KSTH) + p;
    return numberKana(n) + h;
  },
});
/** k/s/t counters: 回 かい → いっかい, ろっかい, はっかい, じゅっかい. */
const kst = (kana: string, opts: { three?: string; which?: ReadonlySet<number> } = {}): Counter => ({
  kana,
  read: (n) => (n % 10 === 3 && opts.three !== undefined ? numberKana(n) + opts.three : geminated(n, opts.which ?? GEM_KSTH) + kana),
});

const DATES_MONTH: Readonly<Record<number, string>> = { 4: "しがつ", 7: "しちがつ", 9: "くがつ" };

/** Counters met in the course text (and their usual neighbours), longest first when matched. */
export const COUNTERS: Readonly<Record<string, Counter>> = {
  時間: { kana: "じかん", read: (n) => `${hourKana(n)}かん` },
  時: { kana: "じ", read: hourKana },
  分: { kana: "ふん", read: (n) => {
    const ones = n % 10;
    if (ones === 0 && n > 0) return `${geminated(n, GEM_KSTH)}ぷん`;
    if (ones === 1 || ones === 6 || ones === 8) return `${geminated(n, GEM_KSTH)}ぷん`;
    if (ones === 3 || ones === 4) return `${numberKana(n)}ぷん`;
    return `${numberKana(n)}ふん`;
  } },
  円: { kana: "えん", read: (n) => (n % 10 === 4 ? `${numberKana(n).slice(0, -"よん".length)}よえん` : `${numberKana(n)}えん`) },
  歳: { kana: "さい", read: (n) => (n === 20 ? "はたち" : `${geminated(n, GEM_S)}さい`) },
  回: kst("かい"),
  階: kst("かい", { three: "がい" }),
  個: kst("こ"),
  冊: kst("さつ", { which: GEM_S }),
  杯: hRow("はい", "ばい", "ぱい"),
  本: hRow("ほん", "ぼん", "ぽん"),
  匹: hRow("ひき", "びき", "ぴき"),
  番: plain("ばん"),
  枚: plain("まい"),
  年: { kana: "ねん", read: (n) => (n % 10 === 4 ? `${numberKana(n).slice(0, -"よん".length)}よねん` : `${numberKana(n)}ねん`) },
  月: { kana: "がつ", read: (n) => (n >= 1 && n <= 12 ? `${DATES_MONTH[n] ?? numberKana(n)}${DATES_MONTH[n] ? "" : "がつ"}` : `${numberKana(n)}がつ`) },
  人: { kana: "にん", read: (n) => (n === 1 ? "ひとり" : n === 2 ? "ふたり" : n % 10 === 4 ? `${numberKana(n).slice(0, -"よん".length)}よにん` : `${numberKana(n)}にん`) },
  ページ: { kana: "ページ", read: (n) => `${geminated(n, new Set([1, 6, 8, 10]))}ページ` },
  つ: { kana: "つ", read: (n) => ["", "ひとつ", "ふたつ", "みっつ", "よっつ", "いつつ", "むっつ", "ななつ", "やっつ", "ここのつ", "とお"][n] ?? `${numberKana(n)}` },
};

/** 時: よじ, しちじ, くじ (14 じゅうよじ, 19 じゅうくじ). */
function hourKana(n: number): string {
  const ones = n % 10;
  const stem = ones === 0 ? numberKana(n) : numberKana(n).slice(0, -UNITS[ones]!.length);
  if (ones === 4) return `${stem}よじ`;
  if (ones === 7) return `${stem}しちじ`;
  if (ones === 9) return `${stem}くじ`;
  return `${numberKana(n)}じ`;
}

const COUNTER_KEYS = Object.keys(COUNTERS).sort((a, b) => b.length - a.length);

/** The counter starting `rest`, longest first. */
export function counterAt(rest: string): string | undefined {
  return COUNTER_KEYS.find((k) => rest.startsWith(k));
}

/** A number with the counter after it (or none) in kana. */
export function countedKana(n: number, counter: string | undefined): string {
  return counter === undefined ? numberKana(n) : COUNTERS[counter]!.read(n);
}

const KANJI_DIGIT: Readonly<Record<string, number>> = { 〇: 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const KANJI_POWER: Readonly<Record<string, number>> = { 十: 10, 百: 100, 千: 1000 };

/** The value of a kanji numeral (二十四, 三千五百, 七万二千); null when it is not one. */
export function kanjiNumberValue(s: string): number | null {
  if (!/^[〇零一二三四五六七八九十百千万]+$/u.test(s)) return null;
  const parts = s.split("万");
  if (parts.length > 2) return null;
  const small = (t: string): number | null => {
    if (t === "") return 0;
    let total = 0;
    let digit: number | null = null;
    for (const ch of t) {
      if (KANJI_DIGIT[ch] !== undefined) {
        if (digit !== null) return null; // 二三: not a numeral
        digit = KANJI_DIGIT[ch]!;
      } else {
        total += (digit ?? 1) * KANJI_POWER[ch]!;
        digit = null;
      }
    }
    return total + (digit ?? 0);
  };
  if (parts.length === 2) {
    const high = parts[0] === "" ? 1 : small(parts[0]!);
    const low = small(parts[1]!);
    return high === null || low === null ? null : high * 10000 + low;
  }
  return small(parts[0]!);
}

/** Phone-style digit strings (080-2345-6789): one digit at a time, the hyphen read の. */
const PHONE_DIGITS = ["ぜろ", "いち", "にー", "さん", "よん", "ごー", "ろく", "なな", "はち", "きゅう"];

export function phoneKana(s: string): string {
  return s
    .split("-")
    .map((group) => [...group].map((d) => PHONE_DIGITS[Number(d)]!).join(""))
    .join(" の ");
}
