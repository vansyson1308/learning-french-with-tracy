/**
 * Japanese verb and adjective morphology (P4c session 3) from a later retrieval of the Japanese kaikki dump, filtered
 * to the course's words by content/ja/_drafts/_generators/ja-kaikki-subset.py. It tags the nine cells the ja build
 * plugin declares (scripts/lib/languages/ja-morph.ts) — plain / polite × non-past / past × affirmative / negative,
 * and the te-form — so authored paradigm tables can be evidenced row by row.
 *
 * What a Wiktionary page states, read from its tables (kaikki `forms`, `source` "conjugation" / "inflection"):
 *  - verbs, the conjugation table of every verb: terminative (dictionary form), negative (…ない), perfective (…た),
 *    formal (…ます), conjunctive (…て); many common verbs also carry the "key constructions" table (rows with a
 *    `roman` field): polite (…ます / …ました), negative + polite (…ません / …ませんでした), negative (…なかった), past.
 *    That second table is taken only when its polite non-past equals the first table's formal form — some pages
 *    write ruby there (来きます), and a row is evidence only when it is the word as written;
 *  - i-adjectives, the inflection table: informal / formal × negative / past and conjunctive (…くて).
 * A cell the page states nowhere is COMPOSED from a stated row of the same page — …ない → …なかった,
 * …ます → …ません / …ました / …ませんでした — and its row says so (atom "composed"). Nothing is generated
 * from the lemma alone: no stated row, no cell.
 *
 * Rows keep the kanji and the kana spellings the page gives (食べます, たべます); rōmaji rows are dropped. Each row is
 * `{ mot, infoVer }` with one cell id as its atom (plus "composed"), after an `inf` row for the lemma.
 */
import { readJsonl } from "./jsonl";

export const JA_MORPHOLOGY_CELLS = [
  "plain:nonpast:aff",
  "plain:nonpast:neg",
  "plain:past:aff",
  "plain:past:neg",
  "polite:nonpast:aff",
  "polite:nonpast:neg",
  "polite:past:aff",
  "polite:past:neg",
  "te",
] as const;
type Cell = (typeof JA_MORPHOLOGY_CELLS)[number];

export type JaKaikkiForm = { form?: string; tags?: string[]; roman?: string; source?: string };
export type JaKaikkiEntry = { word?: string; pos?: string; lang_code?: string; forms?: JaKaikkiForm[] };
export type JaMorphRow = { mot: string; infoVer: string };
export type JaMorphWord = { lemma: string; rows: JaMorphRow[] };
export type JaLexeme = { lemma: string; partOfSpeech: string; reading?: { kana?: string } };

const HAN = /[\p{Script=Han}々]/u;
const JAPANESE = /^[\p{Script=Han}々ぁ-ゖァ-ヺー]+$/u;

const tagKey = (tags: readonly string[] | undefined) => [...(tags ?? [])].sort().join(" ");

/** A form as written: drop a trailing " [rōmaji]" note; null when it is not Japanese text (rōmaji rows, "-"). */
function written(form: string | undefined): string | null {
  if (typeof form !== "string") return null;
  const text = form.replace(/\s*\[[^\]]*\]\s*$/, "").trim();
  return JAPANESE.test(text) ? text : null;
}

/** The cell a verb form fills, by its tags and ending; null for every other form. */
function verbCell(tags: string, form: string): Cell | null {
  switch (tags) {
    case "terminative":
      return "plain:nonpast:aff";
    case "negative":
      return form.endsWith("なかった") ? "plain:past:neg" : form.endsWith("ない") ? "plain:nonpast:neg" : null;
    case "perfective":
      return "plain:past:aff";
    case "":
      return /[ただ]$/.test(form) ? "plain:past:aff" : null;
    case "formal":
      return form.endsWith("ます") ? "polite:nonpast:aff" : null;
    case "polite":
      return form.endsWith("ました") ? "polite:past:aff" : form.endsWith("ます") ? "polite:nonpast:aff" : null;
    case "negative polite":
      return form.endsWith("ませんでした") ? "polite:past:neg" : form.endsWith("ません") ? "polite:nonpast:neg" : null;
    case "conjunctive":
      return /[てで]$/.test(form) ? "te" : null;
    default:
      return null;
  }
}

const ADJECTIVE_CELLS: Readonly<Record<string, Cell>> = {
  "stem terminative": "plain:nonpast:aff",
  "informal negative": "plain:nonpast:neg",
  "informal past": "plain:past:aff",
  "informal negative past": "plain:past:neg",
  formal: "polite:nonpast:aff",
  "formal negative": "polite:nonpast:neg",
  "formal past": "polite:past:aff",
  "formal negative past": "polite:past:neg",
  conjunctive: "te",
};

type Stated = Map<Cell, Set<string>>;

function add(map: Stated, cell: Cell, form: string): void {
  map.set(cell, (map.get(cell) ?? new Set()).add(form));
}

/** The cells one verb entry states: its conjugation table, and its key-constructions table when it agrees. */
function verbEntryCells(entry: JaKaikkiEntry): Stated {
  const main: Stated = new Map();
  const extra: Stated = new Map();
  for (const f of entry.forms ?? []) {
    if (f.source !== "conjugation") continue;
    const form = written(f.form);
    if (form === null) continue;
    // The key-constructions table writes romanization on the row itself (or a " [rōmaji]" note on the form).
    const keyTable = typeof f.roman === "string" || (typeof f.form === "string" && f.form.includes(" ["));
    const cell = verbCell(tagKey(f.tags), form);
    if (cell !== null) add(keyTable ? extra : main, cell, form);
  }
  const formal = main.get("polite:nonpast:aff") ?? new Set<string>();
  const polite = extra.get("polite:nonpast:aff") ?? new Set<string>();
  const agrees = polite.size > 0 && [...polite].every((f) => formal.has(f));
  if (agrees) for (const [cell, forms] of extra) for (const f of forms) add(main, cell, f);
  return main;
}

function adjectiveEntryCells(entry: JaKaikkiEntry): Stated {
  const out: Stated = new Map();
  for (const f of entry.forms ?? []) {
    if (f.source !== "inflection") continue;
    const form = written(f.form);
    const cell = ADJECTIVE_CELLS[tagKey(f.tags)];
    if (form !== null && cell !== undefined) add(out, cell, form);
  }
  return out;
}

/** Whether an entry is the lexeme's word: its dictionary form is the lemma, read with the lexeme's kana. */
function isLexemeEntry(cells: Stated, lexeme: JaLexeme): boolean {
  const dictionary = cells.get("plain:nonpast:aff") ?? new Set<string>();
  if (!dictionary.has(lexeme.lemma)) return false;
  const kana = lexeme.reading?.kana;
  return !HAN.test(lexeme.lemma) || kana === undefined || dictionary.has(kana);
}

/** Compose a cell the page does not state from a stated cell of the same page (the composed atom says so). */
const COMPOSED: readonly { cell: Cell; from: Cell; ending: string; becomes: string }[] = [
  { cell: "plain:past:neg", from: "plain:nonpast:neg", ending: "ない", becomes: "なかった" },
  { cell: "polite:nonpast:neg", from: "polite:nonpast:aff", ending: "ます", becomes: "ません" },
  { cell: "polite:past:aff", from: "polite:nonpast:aff", ending: "ます", becomes: "ました" },
  { cell: "polite:past:neg", from: "polite:nonpast:aff", ending: "ます", becomes: "ませんでした" },
];

function rowsOf(lemma: string, cells: Stated, composeVerbCells: boolean): JaMorphRow[] {
  const rows: JaMorphRow[] = [{ mot: lemma, infoVer: "inf" }];
  for (const cell of JA_MORPHOLOGY_CELLS) {
    for (const mot of [...(cells.get(cell) ?? [])].sort()) rows.push({ mot, infoVer: cell });
    if (!composeVerbCells || (cells.get(cell)?.size ?? 0) > 0) continue;
    const rule = COMPOSED.find((c) => c.cell === cell);
    if (!rule) continue;
    const composed = [...(cells.get(rule.from) ?? [])].filter((f) => f.endsWith(rule.ending)).map((f) => f.slice(0, -rule.ending.length) + rule.becomes);
    for (const mot of [...new Set(composed)].sort()) rows.push({ mot, infoVer: `${cell},composed` });
  }
  return rows;
}

function merged(entries: readonly Stated[]): Stated {
  const out: Stated = new Map();
  for (const e of entries) for (const [cell, forms] of e) for (const f of forms) add(out, cell, f);
  return out;
}

/** The kaikki headwords that may hold a lexeme's table: the lemma, and the noun of a する verb (勉強 for 勉強する). */
function headwordsOf(lemma: string): string[] {
  return lemma.endsWith("する") && lemma.length > 2 ? [lemma, lemma.slice(0, -2)] : [lemma];
}

/** Morphology rows of the course's verbs and i-adjectives, from the entries of the filtered dump (pure). */
export function japaneseMorphologyFromEntries(entries: readonly JaKaikkiEntry[], lexemes: readonly JaLexeme[]): { verbs: JaMorphWord[]; adjectives: JaMorphWord[] } {
  const byWord = new Map<string, JaKaikkiEntry[]>();
  for (const e of entries) {
    if (e.lang_code !== "ja" || typeof e.word !== "string") continue;
    byWord.set(e.word, [...(byWord.get(e.word) ?? []), e]);
  }
  const verbs: JaMorphWord[] = [];
  const adjectives: JaMorphWord[] = [];
  for (const lexeme of lexemes) {
    const isVerb = lexeme.partOfSpeech === "verb";
    if (!isVerb && lexeme.partOfSpeech !== "adjective") continue;
    const stated = headwordsOf(lexeme.lemma)
      .flatMap((w) => byWord.get(w) ?? [])
      .filter((e) => e.pos === (isVerb ? "verb" : "adj"))
      .map((e) => (isVerb ? verbEntryCells(e) : adjectiveEntryCells(e)))
      .filter((cells) => isLexemeEntry(cells, lexeme));
    if (stated.length === 0) continue;
    const word = { lemma: lexeme.lemma, rows: rowsOf(lexeme.lemma, merged(stated), isVerb) };
    (isVerb ? verbs : adjectives).push(word);
  }
  const byLemma = (a: JaMorphWord, b: JaMorphWord) => (a.lemma < b.lemma ? -1 : a.lemma > b.lemma ? 1 : 0);
  return { verbs: verbs.sort(byLemma), adjectives: adjectives.sort(byLemma) };
}

/** The same, reading the subset file. */
export async function japaneseMorphology(subsetPath: string, lexemes: readonly JaLexeme[]): Promise<{ verbs: JaMorphWord[]; adjectives: JaMorphWord[] }> {
  const entries: JaKaikkiEntry[] = [];
  let bad = 0;
  for await (const entry of readJsonl<JaKaikkiEntry>(subsetPath, () => (bad += 1))) entries.push(entry);
  if (bad > 0) throw new Error(`${subsetPath}: ${bad} bad line(s)`);
  return japaneseMorphologyFromEntries(entries, lexemes);
}

export const JA_MORPHOLOGY_NOTATION =
  "ja (P4c): one atom per row — inf (the lemma), or one of the nine paradigm cells plain|polite:nonpast|past:aff|neg and te, as the page's conjugation / inflection tables state them; ',composed' marks a cell the page states nowhere, written from a stated row of the same page (…ない → …なかった, …ます → …ません / …ました / …ませんでした). Verbs not in the course keep the rows of the first retrieval (inf, formal = the polite non-past).";
