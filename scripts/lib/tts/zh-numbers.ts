/**
 * Arabic numerals in a Mandarin clip, spelt in hanzi before the text is read (P4d audio front-end). misaki's legacy
 * path does this with cn2an (`transform(text, "an2cn")`); here the course's own rule decides 2 → 两 before a measure
 * word (src/lib/languages/zh.ts chineseTwoBeforeMeasure, as the graders read 2个), a four-digit year before 年 is said
 * digit by digit (2026年 二零二六年), and every numeral hanzi is then read through the course lexicon like any other
 * word (一百二十 yì bǎi èr shí after the tone sandhi). A number the audio
 * cannot say without a guess — a decimal, a time 8:30, a date 3/5, a grouped 1,000, a phone-style 0123, a digit glued
 * to Latin letters, a value from 10^8 — is an error that names the clip, never a reading.
 */

import { chineseTwoBeforeMeasure } from "../../../src/lib/languages/zh";

const DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const PLACES: readonly [number, string][] = [
  [1000, "千"],
  [100, "百"],
  [10, "十"],
  [1, ""],
];

/** One group of four digits (1–9999), with 零 for an inner gap (1005 一千零五, 1050 一千零五十, 110 一百一十). */
function group(value: number, top: boolean): string {
  let out = "";
  let started = false;
  let gap = false;
  for (const [place, unit] of PLACES) {
    const d = Math.floor(value / place) % 10;
    if (d === 0) {
      if (started) gap = true;
      continue;
    }
    if (gap) out += "零";
    gap = false;
    // The leading 2 of a thousand (两千) is said 两; 二百 and 二十 keep 二.
    out += (top && !started && d === 2 && place === 1000 ? "两" : DIGITS[d]) + unit;
    started = true;
  }
  return out;
}

/** Cardinal 0 ≤ value < 10^8 in hanzi (十二 for 12, 一百一十 for 110, 两万 for 20000), or null outside that range. */
export function chineseCardinal(value: number): string | null {
  if (!Number.isSafeInteger(value) || value < 0 || value >= 1e8) return null;
  if (value === 0) return DIGITS[0]!;
  const wan = Math.floor(value / 10000);
  const rest = value % 10000;
  const tenToNineteen = (s: string, v: number) => (v >= 10 && v < 20 ? s.slice(1) : s);
  if (wan === 0) return tenToNineteen(group(rest, true), rest);
  const head = wan === 2 ? "两" : tenToNineteen(group(wan, true), wan);
  return `${head}万${rest === 0 ? "" : `${rest < 1000 ? "零" : ""}${group(rest, false)}`}`;
}

export type SpeltNumbers = { ok: true; text: string } | { ok: false; error: string };

const DIGIT_RUN = /[0-9]+/gu;

/** Every digit run of `text` spelt in hanzi (fullwidth digits too), or why one cannot be said without a guess. */
export function spellArabicNumbers(text: string): SpeltNumbers {
  const ascii = chineseTwoBeforeMeasure(text.replace(/[０-９]/gu, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0)));
  const problems: string[] = [];
  const spelt = ascii.replace(DIGIT_RUN, (run: string, at: number) => {
    const before = ascii[at - 1] ?? "";
    const after = ascii[at + run.length] ?? "";
    const value = Number(run);
    if (/[.:,/\-%．：／－]/u.test(after) && /[0-9]/u.test(ascii[at + run.length + 1] ?? "")) problems.push(`"${run}${after}…" (a decimal, time, date or grouped number)`);
    else if (/[.:,/\-．：／－]/u.test(before) && /[0-9]/u.test(ascii[at - 2] ?? "")) problems.push(`"…${before}${run}" (a decimal, time, date or grouped number)`);
    else if (/[A-Za-z]/u.test(before) || /[A-Za-z]/u.test(after)) problems.push(`"${run}" next to Latin letters`);
    else if (run.length > 1 && run.startsWith("0")) problems.push(`"${run}" (digits said one by one)`);
    else if (run.length === 4 && after === "年") return [...run].map((d) => DIGITS[Number(d)]!).join(""); // a year: 2026年 二零二六年
    else if (chineseCardinal(value) === null) problems.push(`"${run}" (10^8 or more)`);
    return chineseCardinal(value) ?? run;
  });
  if (problems.length > 0) return { ok: false, error: `the number ${problems.join(", ")} in "${text}" cannot be said without a guess — write it in hanzi` };
  return { ok: true, text: spelt };
}
