/**
 * Japanese inflection keys (P4c session 2). A course stores the dictionary form of a verb or い-adjective (食べる,
 * 大きい); its text uses the inflected forms (食べます, 大きくない). These keys extend the stored readings so that
 *  - the ruby renderer finds furigana for 食 in 食べます (script-reading.ts matches whole stored surfaces), and
 *  - kana typed for an inflected kanji key aligns through the readings (alignAnswerToKey: practice only).
 *
 * A key is the stem plus the kana that follows it in every polite, te, ta and nai form — long enough never to read
 * inside another word: masu stem + ま/た/に (and the bare stem when it ends in kana: 食べ, 飲み), te and ta forms,
 * nai stem + な; the adjective stem + く/か. 行く takes 行って; 来る reads き, and こ before な; noun + する takes し….
 * Without the verb group, a る-verb gets the keys of both groups: the wrong group's keys (帰ま) never occur in text.
 * A key two words make with different readings (降り: 降る ふり, 降りる おり) is dropped: no furigana beats a wrong one.
 * The content generators port these keys one for one (content/ja/_drafts/_generators/ja_text.py).
 */
import type { FuriganaSegment } from "../types";

export type InflectionSource = { surface: string; kana: string; pos?: string; furigana?: readonly FuriganaSegment[] };
export type InflectedForm = { surface: string; kana: string; furigana: FuriganaSegment[] };

const HAN = /[\p{Script=Han}々〆]/u;

/** Godan final kana → its a-row (nai stem), i-row (masu stem), te and ta endings. */
const GODAN: Readonly<Record<string, readonly [string, string, string, string]>> = {
  う: ["わ", "い", "って", "った"],
  つ: ["た", "ち", "って", "った"],
  る: ["ら", "り", "って", "った"],
  む: ["ま", "み", "んで", "んだ"],
  ぶ: ["ば", "び", "んで", "んだ"],
  ぬ: ["な", "に", "んで", "んだ"],
  く: ["か", "き", "いて", "いた"],
  ぐ: ["が", "ぎ", "いで", "いだ"],
  す: ["さ", "し", "して", "した"],
};

/** The segments without their last n characters, which must be plain kana (okurigana); null otherwise. */
function dropTail(segments: readonly FuriganaSegment[], n: number): FuriganaSegment[] | null {
  const out = segments.map((s) => ({ ...s }));
  let left = n;
  while (left > 0) {
    const last = out[out.length - 1];
    if (last === undefined || last.ruby !== undefined) return null;
    if (last.base.length <= left) {
      left -= last.base.length;
      out.pop();
    } else {
      out[out.length - 1] = { base: last.base.slice(0, -left) };
      left = 0;
    }
  }
  return out;
}

function withTail(segments: FuriganaSegment[], tail: string): FuriganaSegment[] {
  const last = segments[segments.length - 1];
  if (tail.length === 0) return segments;
  if (last !== undefined && last.ruby === undefined) return [...segments.slice(0, -1), { base: last.base + tail }];
  return [...segments, { base: tail }];
}

/** The inflection keys of one stored word: none unless it is a verb or an い-adjective written with kanji. */
export function japaneseInflectedForms(source: InflectionSource): InflectedForm[] {
  const { surface, kana, pos } = source;
  const segments = source.furigana && source.furigana.map((s) => s.base).join("") === surface ? source.furigana : undefined;
  if (!HAN.test(surface) || segments === undefined) return [];
  const out: InflectedForm[] = [];
  const add = (drop: number, tail: string, ruby?: string) => {
    const base = dropTail(segments, drop);
    if (base === null) return;
    if (ruby !== undefined) {
      const at = base.map((s) => s.ruby !== undefined).lastIndexOf(true);
      if (at < 0) return;
      base[at] = { base: base[at]!.base, ruby };
    }
    const furigana = withTail(base, tail);
    out.push({ surface: furigana.map((s) => s.base).join(""), kana: furigana.map((s) => s.ruby ?? s.base).join(""), furigana });
  };
  if (pos === "verb") {
    if (surface.endsWith("する")) {
      for (const t of ["しま", "した", "しに", "して", "しな"]) add(2, t);
    } else if (surface.endsWith("来る")) {
      for (const t of ["ま", "た", "に", "て"]) add(1, t, "き");
      add(1, "な", "こ");
    } else {
      const last = surface.slice(-1);
      const row = GODAN[last];
      if (row !== undefined) {
        const [a, i] = row;
        const iku = surface.endsWith("行く");
        const te = iku ? "って" : row[2];
        const ta = iku ? "った" : row[3];
        for (const t of [i, `${i}ま`, `${i}た`, `${i}に`, te, ta, `${a}な`]) add(1, t);
      }
      if (last === "る") {
        // The bare ichidan stem only when it ends in kana (食べ): 見 or 寝 alone would read inside other words.
        const stemEndsInKana = surface.length >= 2 && !HAN.test(surface.slice(-2, -1));
        for (const t of stemEndsInKana ? ["", "ま", "た", "に", "て", "な"] : ["ま", "た", "に", "て", "な"]) add(1, t);
      }
    }
  } else if (pos === "adjective" && surface.endsWith("い") && kana.endsWith("い")) {
    for (const t of ["く", "か"]) add(1, t);
  }
  return out;
}

/**
 * The inflection keys of a whole course, ready to append after its stored readings: a key equal to a stored surface
 * is left to the stored word, and a key two words make with different readings is dropped.
 */
export function japaneseInflections(sources: Iterable<InflectionSource>): InflectedForm[] {
  const all = [...sources];
  const stored = new Set(all.map((s) => s.surface));
  const made = new Map<string, InflectedForm>();
  const clash = new Set<string>();
  for (const source of all) {
    for (const form of japaneseInflectedForms(source)) {
      if (stored.has(form.surface)) continue;
      const first = made.get(form.surface);
      if (first === undefined) made.set(form.surface, form);
      else if (first.kana !== form.kana) clash.add(form.surface);
    }
  }
  return [...made.values()].filter((f) => !clash.has(f.surface));
}

/**
 * Furigana rebuilt from a surface and its kana when only the kana is stored (the grading lexicon): each kanji run
 * reads the kana between the literal kana runs around it (持って来る / もってくる → 持(も)って来(く)る); null when the
 * kana does not fit the surface.
 */
export function furiganaFromKana(surface: string, kana: string): FuriganaSegment[] | null {
  const runs = surface.match(/[\p{Script=Han}々〆]+|[^\p{Script=Han}々〆]+/gu) ?? [];
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${runs.map((r) => (HAN.test(r) ? "(.+?)" : escape(r))).join("")}$`, "u");
  const m = pattern.exec(kana);
  if (m === null) return null;
  let group = 1;
  return runs.map((r) => (HAN.test(r) ? { base: r, ruby: m[group++]! } : { base: r }));
}

/** Reading sources (script-reading.ts) of the inflection keys of the given sources. */
export function japaneseInflectionSources(
  sources: readonly { surface: string; pos?: string; reading: { kana?: string; furigana?: FuriganaSegment[] } }[]
): { surface: string; reading: { kana: string; furigana: FuriganaSegment[] } }[] {
  const inputs = sources.filter((s) => s.reading.kana).map((s) => ({ surface: s.surface, kana: s.reading.kana!, pos: s.pos, furigana: s.reading.furigana }));
  return japaneseInflections(inputs).map((f) => ({ surface: f.surface, reading: { kana: f.kana, furigana: f.furigana } }));
}
