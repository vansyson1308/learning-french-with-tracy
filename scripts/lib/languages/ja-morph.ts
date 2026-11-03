/**
 * Japanese verb paradigm (P4b stage 5, task 6): the cells a ja paradigm
 * table fills — plain / polite × non-past / past × affirmative / negative,
 * and the te-form — and the written rules of the regular groups, used as
 * the plugin's group rules (scripts/lib/languages/ja.ts). Kana and kanji
 * spellings both work: only the final kana of the dictionary form changes.
 *
 *  - ichidan (食べる, 見る): drop る, add ない / た / なかった / ます … / て;
 *  - godan (書く, 飲む, 買う): the final u-kana moves to its a- / i-row
 *    and the te / ta forms take the sound change (書いて, 泳いで, 話して,
 *    待って, 死んで, 飲んで, 遊んで, 帰って, 買って); 行く → 行って;
 *    ある → ない (plain negative);
 *  - irregular: する (and every …する verb), 来る / くる.
 */

export const JA_PARADIGM_CELLS = [
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
export type JaCell = (typeof JA_PARADIGM_CELLS)[number];

export const JA_GROUPS = ["ichidan", "godan", "irregular"] as const;
export type JaGroup = (typeof JA_GROUPS)[number];

/** Godan final kana → its a-row (negative stem; う → わ), i-row (polite stem), and te/ta endings. */
const GODAN: Readonly<Record<string, { a: string; i: string; te: string; ta: string }>> = {
  う: { a: "わ", i: "い", te: "って", ta: "った" },
  つ: { a: "た", i: "ち", te: "って", ta: "った" },
  る: { a: "ら", i: "り", te: "って", ta: "った" },
  む: { a: "ま", i: "み", te: "んで", ta: "んだ" },
  ぶ: { a: "ば", i: "び", te: "んで", ta: "んだ" },
  ぬ: { a: "な", i: "に", te: "んで", ta: "んだ" },
  く: { a: "か", i: "き", te: "いて", ta: "いた" },
  ぐ: { a: "が", i: "ぎ", te: "いで", ta: "いだ" },
  す: { a: "さ", i: "し", te: "して", ta: "した" },
};

function fromStems(plainNeg: string, masuStem: string, te: string, ta: string, dictionary: string): Record<JaCell, string> {
  const negStem = plainNeg.slice(0, -1); // …な(い)
  return {
    "plain:nonpast:aff": dictionary,
    "plain:nonpast:neg": plainNeg,
    "plain:past:aff": ta,
    "plain:past:neg": `${negStem}かった`,
    "polite:nonpast:aff": `${masuStem}ます`,
    "polite:nonpast:neg": `${masuStem}ません`,
    "polite:past:aff": `${masuStem}ました`,
    "polite:past:neg": `${masuStem}ませんでした`,
    te,
  };
}

/** Every cell of a verb in a regular group (or a known irregular), or null when the rules do not apply. */
export function japaneseParadigmCells(lemma: string, group: JaGroup): Record<JaCell, string> | null {
  if (group === "ichidan") {
    if (!lemma.endsWith("る")) return null;
    const stem = lemma.slice(0, -1);
    return fromStems(`${stem}ない`, stem, `${stem}て`, `${stem}た`, lemma);
  }
  if (group === "godan") {
    const final = lemma.slice(-1);
    const row = GODAN[final];
    if (row === undefined) return null;
    const stem = lemma.slice(0, -1);
    const iku = lemma.endsWith("行く") || lemma.endsWith("いく");
    const te = iku ? `${stem}って` : `${stem}${row.te}`;
    const ta = iku ? `${stem}った` : `${stem}${row.ta}`;
    const plainNeg = lemma === "ある" ? "ない" : `${stem}${row.a}ない`;
    return fromStems(plainNeg, `${stem}${row.i}`, te, ta, lemma);
  }
  if (lemma.endsWith("する")) {
    const stem = lemma.slice(0, -2);
    return fromStems(`${stem}しない`, `${stem}し`, `${stem}して`, `${stem}した`, lemma);
  }
  if (lemma === "来る") return fromStems("来ない", "来", "来て", "来た", lemma);
  if (lemma === "くる") return fromStems("こない", "き", "きて", "きた", lemma);
  return null;
}

/** Group rules for authored paradigm tables: every cell must be the rule's form. */
export function japaneseGroupRules(table: { lemma: string; group: string; cells: Record<string, string> }, err: (m: string) => void): void {
  if (!(JA_GROUPS as readonly string[]).includes(table.group)) return;
  const expected = japaneseParadigmCells(table.lemma, table.group as JaGroup);
  if (expected === null) {
    err(`${table.lemma}: no ${table.group} rule conjugates it — check the group`);
    return;
  }
  for (const cell of JA_PARADIGM_CELLS) {
    const got = table.cells[cell];
    if (got !== undefined && got !== expected[cell]) err(`${table.lemma}: ${table.group} ${cell} must be "${expected[cell]}", got "${got}"`);
  }
}
