/**
 * Dictionary adapters (P3a): JMdict (ja — kana readings + English senses)
 * and CC-CEDICT (zh — pinyin + English senses). Both are CC BY-SA 4.0;
 * they back the `readings.json` derivation for the CJK plugins (P4b) and
 * fill English glosses where kaikki has none.
 */

import { readFileSync } from "fs";

import { readLines } from "../jsonl";

export type DictEntry = { word: string; reading: string; glosses: string[] };

/** JMdict_e: regex-walk `<entry>` blocks (the file is ~60 MB of XML; a full DOM is unnecessary). */
export function readJmdict(path: string, keepWords?: ReadonlySet<string>): Map<string, DictEntry> {
  const xml = readFileSync(path, "utf8");
  const out = new Map<string, DictEntry>();
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml)) !== null) {
    const block = m[1];
    const kebs = [...block.matchAll(/<keb>([^<]+)<\/keb>/g)].map((x) => x[1]);
    const rebs = [...block.matchAll(/<reb>([^<]+)<\/reb>/g)].map((x) => x[1]);
    const glosses = [...block.matchAll(/<gloss(?: [^>]*)?>([^<]+)<\/gloss>/g)].map((x) => x[1]);
    const headwords = kebs.length > 0 ? kebs : rebs;
    for (const word of headwords) {
      if (keepWords && !keepWords.has(word)) continue;
      if (out.has(word)) continue;
      out.set(word, { word, reading: rebs[0] ?? word, glosses: glosses.slice(0, 6) });
    }
  }
  return out;
}

const TONE_MARKS: Record<string, string[]> = {
  a: ["a", "ā", "á", "ǎ", "à"],
  e: ["e", "ē", "é", "ě", "è"],
  i: ["i", "ī", "í", "ǐ", "ì"],
  o: ["o", "ō", "ó", "ǒ", "ò"],
  u: ["u", "ū", "ú", "ǔ", "ù"],
  ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
};

/** `ni3 hao3` → `nǐ hǎo` (standard tone-mark placement; `u:`/`v` → ü; tone 5 = neutral). */
export function pinyinNumbersToMarks(numbered: string): string {
  return numbered
    .split(/\s+/)
    .map((syll) => {
      const m = /^([A-Za-zü:]+?)([1-5])$/.exec(syll.replace(/u:/g, "ü").replace(/v/g, "ü"));
      if (!m) return syll.replace(/u:/g, "ü");
      const [, letters, toneStr] = m;
      const tone = Number(toneStr);
      if (tone === 5) return letters;
      const lower = letters.toLowerCase();
      let idx = -1;
      if (lower.includes("a")) idx = lower.indexOf("a");
      else if (lower.includes("e")) idx = lower.indexOf("e");
      else if (lower.includes("ou")) idx = lower.indexOf("o");
      else {
        for (let i = lower.length - 1; i >= 0; i--) {
          if ("iuüo".includes(lower[i])) {
            idx = i;
            break;
          }
        }
      }
      if (idx < 0) return letters;
      const vowel = lower[idx];
      const marked = TONE_MARKS[vowel]?.[tone] ?? vowel;
      return letters.slice(0, idx) + marked + letters.slice(idx + 1);
    })
    .join(" ");
}

/** CC-CEDICT lines `Trad Simp [pin1 yin1] /gloss/gloss/`. Keyed by the simplified form. */
export async function readCedict(path: string, keepWords?: ReadonlySet<string>): Promise<Map<string, DictEntry>> {
  const out = new Map<string, DictEntry>();
  for await (const line of readLines(path)) {
    if (line.startsWith("#")) continue;
    const m = /^(\S+) (\S+) \[([^\]]+)\] \/(.*)\/\s*$/.exec(line);
    if (!m) continue;
    const simp = m[2];
    if (keepWords && !keepWords.has(simp)) continue;
    if (out.has(simp)) continue;
    const glosses = m[4]
      .split("/")
      .map((g) => g.trim())
      .filter((g) => g.length > 0 && !/^CL:/.test(g) && !/^variant of/.test(g) && !/^see /.test(g));
    out.set(simp, { word: simp, reading: pinyinNumbersToMarks(m[3]), glosses: glosses.slice(0, 6) });
  }
  return out;
}
