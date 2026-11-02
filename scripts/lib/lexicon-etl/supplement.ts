/**
 * A later retrieval of the English kaikki dump, read for two things only (QC
 * 2026-11-01 §2.2-2.3): General American IPA per lemma, and the verb rows of
 * morphology.json. The candidate pool, frequency and anchors stay pinned to
 * their own retrieval, so the lexicon does not move under the course.
 *
 * Input: entries of the dump for the course's words, filtered from the stream
 * by content/en/_drafts/_generators/en-kaikki-subset.py, which hashes what it
 * reads. Read entry by entry and not through scanKaikki: American spellings
 * (color, practice) are alt-of senses and month names are `name` entries, and
 * both have the sounds and forms wanted here. Nothing of the dump is committed
 * but these derived rows (CC BY-SA, data files only).
 */

import { atomsFromTags, generalAmericanLines, KAIKKI_POS, type GeneralAmericanMethod, type KaikkiEntry } from "./adapters/kaikki";
import { morphologyRows } from "./derive";
import { readJsonl } from "./jsonl";

export type SourceStamp = { id: string; sha256: string; url: string; retrievedAt: string };
export type MorphVerbRows = { lemma: string; rows: { mot: string; infoVer: string }[] };
export type MorphologyDoc = { source: unknown; generator: string; notation: string; atomInventory: Record<string, number>; verbs: MorphVerbRows[]; supplement?: SourceStamp };
/** `value` is what tags select. `others` are further American lines of the page, for the comparison with an authored value. */
export type GeneralAmericanEntry = { value: string; method: GeneralAmericanMethod; others?: { value: string; method: GeneralAmericanMethod }[] };

export const SUPPLEMENT_GENERATOR = "scripts/lib/lexicon-etl/supplement.ts";

async function entriesOf(subsetPath: string, lang: string): Promise<KaikkiEntry[]> {
  const out: KaikkiEntry[] = [];
  let bad = 0;
  for await (const entry of readJsonl<KaikkiEntry>(subsetPath, () => (bad += 1))) {
    if (entry.lang_code === lang && typeof entry.word === "string") out.push(entry);
  }
  if (bad > 0) throw new Error(`${subsetPath}: ${bad} bad line(s)`);
  return out;
}

/** `word|pos` → the selected General American transcription and the page's other American lines. Etymologies of one word|pos merge in page order. */
export async function generalAmericanEntries(subsetPath: string, lang: string): Promise<Record<string, GeneralAmericanEntry>> {
  const merged = new Map<string, { value: string; method: GeneralAmericanMethod; weak: boolean }[]>();
  for (const entry of await entriesOf(subsetPath, lang)) {
    const key = `${entry.word}|${KAIKKI_POS[entry.pos] ?? entry.pos}`;
    const lines = generalAmericanLines(entry.sounds ?? [], entry.pos);
    const known = merged.get(key) ?? [];
    for (const line of lines) if (!known.some((k) => k.value === line.value)) known.push(line);
    if (known.length > 0) merged.set(key, known);
  }
  const keys = [...merged.keys()].sort();
  const out: Record<string, GeneralAmericanEntry> = {};
  for (const key of keys) {
    const lines = merged.get(key)!;
    const [first, ...rest] = [...lines.filter((l) => !l.weak), ...lines.filter((l) => l.weak)];
    // A word whose only American lines are weak forms keeps them for the comparison, but no line was selected for it.
    if (first.weak) continue;
    const others = rest.map(({ value, method }) => ({ value, method }));
    out[key] = { value: first.value, method: first.method, ...(others.length > 0 ? { others } : {}) };
  }
  return out;
}

/**
 * morphology.json with the rows of every wanted verb read afresh: verbs already
 * listed keep their place, a wanted verb that was missing is added in lemma
 * order, and a verb the retrieval does not have stays as it was.
 */
export async function refreshedMorphology(subsetPath: string, lang: string, current: MorphologyDoc, wanted: ReadonlySet<string>, stamp: SourceStamp): Promise<MorphologyDoc> {
  const forms = new Map<string, { form: string; atoms: string[] }[]>();
  for (const entry of await entriesOf(subsetPath, lang)) {
    if (entry.pos !== "verb") continue;
    const rows = forms.get(entry.word) ?? [];
    for (const f of entry.forms ?? []) {
      const atoms = typeof f.form === "string" ? atomsFromTags(f.tags ?? [], lang) : [];
      if (atoms.length > 0) rows.push({ form: f.form, atoms });
    }
    forms.set(entry.word, rows);
  }
  const fresh = (lemma: string): MorphVerbRows | null => {
    const rows = forms.get(lemma);
    return rows ? { lemma, rows: morphologyRows(lang, lemma, { forms: rows }) } : null;
  };
  const listed = new Set(current.verbs.map((v) => v.lemma));
  const kept = current.verbs.map((v) => fresh(v.lemma) ?? v);
  const added = [...wanted]
    .filter((lemma) => !listed.has(lemma))
    .sort()
    .flatMap((lemma) => fresh(lemma) ?? []);
  const verbs = [...kept, ...added];
  const atomInventory: Record<string, number> = {};
  for (const v of verbs) for (const r of v.rows) for (const a of r.infoVer.split(",")) atomInventory[a] = (atomInventory[a] ?? 0) + 1;
  return { ...current, atomInventory, verbs, supplement: stamp };
}
