/**
 * Pinyin helpers (P4b stage 4): CC-CEDICT's numbered syllables → tone
 * marks, one syllable per Han character, and the shape check the validator
 * runs on every stored reading. Pure string functions.
 */

const TONE_MARKS = ["̄", "́", "̌", "̀"] as const; // ā á ǎ à

/** CC-CEDICT numbered syllable ("zhong1", "lu:4", "r5", "xx5") → tone-marked ("zhōng", "lǜ", "r"); null when it is not a pinyin syllable. */
export function numberedToMarked(syllable: string): string | null {
  const m = /^([a-zü:v]+)([1-5])$/i.exec(syllable.trim());
  if (!m) return null;
  let base = m[1]!.toLowerCase().replace(/u:|v/g, "ü");
  const tone = Number(m[2]);
  if (!isPinyinSyllable(base)) return null;
  if (tone === 5) return base.normalize("NFC");
  const vowels = [...base].map((c, i) => ({ c, i })).filter(({ c }) => "aeiouü".includes(c));
  if (vowels.length === 0) return null;
  let target: number;
  const a = base.indexOf("a");
  const e = base.indexOf("e");
  const ou = base.indexOf("ou");
  if (a >= 0) target = a;
  else if (e >= 0) target = e;
  else if (ou >= 0) target = ou;
  else target = vowels[vowels.length - 1]!.i;
  const chars = [...base];
  chars[target] = chars[target]! + TONE_MARKS[tone - 1]!;
  base = chars.join("");
  return base.normalize("NFC");
}

const INITIAL = "(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?";
const FINAL =
  "(?:a|ai|an|ang|ao|e|ei|en|eng|er|i|ia|ian|iang|iao|ie|in|ing|iong|iu|o|ong|ou|u|ua|uai|uan|uang|ue|ui|un|uo|ü|üan|üe|ün)";
const SYLLABLE = new RegExp(`^(?:${INITIAL}${FINAL}|r|m|n|ng|hm|hng)$`);

/** Toneless syllable shape (lower case, ü spelt ü). */
export function isPinyinSyllable(toneless: string): boolean {
  return SYLLABLE.test(toneless);
}

/** A tone-marked syllable without its mark (and the mark count, which must be ≤ 1). */
export function stripTone(syllable: string): { base: string; marks: number } {
  const nfd = syllable.normalize("NFD");
  let marks = 0;
  let out = "";
  for (const c of nfd) {
    if ((TONE_MARKS as readonly string[]).includes(c)) marks += 1;
    else out += c;
  }
  return { base: out.normalize("NFC"), marks };
}

/** Errors of a stored pinyin reading (space-separated tone-marked syllables). */
export function pinyinShapeErrors(value: string): string[] {
  const errors: string[] = [];
  if (value !== value.trim() || /\s{2,}/.test(value)) errors.push(`pinyin "${value}" has stray spaces`);
  if (value !== value.normalize("NFC")) errors.push(`pinyin "${value}" is not NFC`);
  for (const syl of value.split(" ")) {
    const { base, marks } = stripTone(syl);
    if (marks > 1) errors.push(`pinyin syllable "${syl}" carries ${marks} tone marks`);
    if (!isPinyinSyllable(base)) errors.push(`"${syl}" is not a pinyin syllable`);
  }
  return errors;
}

export function pinyinSyllableCount(value: string): number {
  return value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
}

const HAN_CHAR = /^[\p{Script=Han}〇]$/u;

export function hanCount(text: string): number {
  return [...text].filter((c) => HAN_CHAR.test(c)).length;
}

export function isAllHan(text: string): boolean {
  const chars = [...text];
  return chars.length > 0 && chars.every((c) => HAN_CHAR.test(c));
}

/** Toneless, spaceless, lower-case fold for comparing two pinyin spellings ("zhīdào" ≡ "zhi1 dao4" after conversion). */
export function foldPinyin(value: string): string {
  return stripTone(value.toLowerCase().replace(/[\s'’·-]/g, "")).base;
}

/** Tone-marked, spaceless, lower-case form (two spellings with the same tones compare equal). */
export function compactPinyin(value: string): string {
  return value.normalize("NFC").toLowerCase().replace(/[\s'’·-]/g, "");
}

export type CedictEntry = { traditional: string; simplified: string; numbered: string[] };

/**
 * CC-CEDICT text ("傳統 传统 [chuan2 tong3] /tradition/…") → the entries
 * whose simplified OR traditional headword is wanted, under that headword.
 */
export function parseCedict(text: string, wanted: ReadonlySet<string>): Map<string, CedictEntry[]> {
  const out = new Map<string, CedictEntry[]>();
  const add = (key: string, entry: CedictEntry) => {
    const list = out.get(key) ?? [];
    list.push(entry);
    out.set(key, list);
  };
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("#") || line.length === 0) continue;
    const m = /^(\S+) (\S+) \[([^\]]*)\] \//.exec(line);
    if (!m) continue;
    const traditional = m[1]!;
    const simplified = m[2]!;
    if (!wanted.has(simplified) && !wanted.has(traditional)) continue;
    const entry = { traditional, simplified, numbered: m[3]!.trim().split(/\s+/) };
    if (wanted.has(simplified)) add(simplified, entry);
    if (traditional !== simplified && wanted.has(traditional)) add(traditional, entry);
  }
  return out;
}

/** CC-CEDICT capitalises the pinyin of proper names (Zhong1 guo2). */
export function isProperName(entry: CedictEntry): boolean {
  return entry.numbered.some((s) => /^[A-Z]/.test(s));
}

/** Tone-marked syllables of a CC-CEDICT reading (lower case), or null when a syllable is not pinyin (Latin letters, punctuation). */
export function cedictPinyin(entry: CedictEntry): string | null {
  const marked = entry.numbered.map((s) => numberedToMarked(s.toLowerCase()));
  return marked.every((s): s is string => s !== null) ? marked.join(" ") : null;
}
