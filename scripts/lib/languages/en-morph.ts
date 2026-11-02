/**
 * English written morphology (P4 en-vi): the regular spelling rules of the third
 * person, -ing, -ed and the plural, and the paradigm of a verb. Irregular pasts and
 * plurals come from content/en/lexicon/irregular-forms.json and noun-plurals.json;
 * nothing here guesses them. Spelling is General American: traveled, canceled.
 */

export const MODAL_VERBS: ReadonlySet<string> = new Set(["can", "could", "will", "would", "should", "must", "may", "might", "shall"]);

/** Stressed last syllable: one-syllable verbs double by their shape, longer ones only from this list. */
const DOUBLING_LONG_VERBS = new Set(["admit", "begin", "commit", "control", "forget", "occur", "permit", "prefer", "refer", "regret", "submit"]);

function doublesFinalConsonant(lemma: string): boolean {
  return DOUBLING_LONG_VERBS.has(lemma) || /^(?:[^aeiou]*|qu)[aeiou][^aeiouwxy]$/.test(lemma);
}

export function englishThirdPerson(lemma: string): string {
  if (lemma === "be") return "is";
  if (lemma === "have") return "has";
  if (MODAL_VERBS.has(lemma)) return lemma;
  if (/[^aeiou]y$/.test(lemma)) return `${lemma.slice(0, -1)}ies`;
  return /(?:s|x|z|ch|sh|o)$/.test(lemma) ? `${lemma}es` : `${lemma}s`;
}

export function englishIng(lemma: string): string {
  if (lemma.endsWith("ie")) return `${lemma.slice(0, -2)}ying`;
  if (lemma === "be" || /(?:ee|oe|ye)$/.test(lemma)) return `${lemma}ing`;
  if (lemma.endsWith("e")) return `${lemma.slice(0, -1)}ing`;
  return doublesFinalConsonant(lemma) ? `${lemma}${lemma[lemma.length - 1]}ing` : `${lemma}ing`;
}

export function englishPastRegular(lemma: string): string {
  if (lemma.endsWith("e")) return `${lemma}d`;
  if (/[^aeiou]y$/.test(lemma)) return `${lemma.slice(0, -1)}ied`;
  return doublesFinalConsonant(lemma) ? `${lemma}${lemma[lemma.length - 1]}ed` : `${lemma}ed`;
}

/** The plural of a noun that noun-plurals.json does not list (tomatoes, knives and the like are listed). */
export function englishRegularPlural(noun: string): string {
  if (/[^aeiou]y$/.test(noun)) return `${noun.slice(0, -1)}ies`;
  return /(?:s|x|z|ch|sh)$/.test(noun) ? `${noun}es` : `${noun}s`;
}

export type IrregularVerb = { past: string; participle: string };

/** The present of a verb as authored in a table: only be and have differ beyond the third-person rule. */
function presentCells(lemma: string): Record<string, string> {
  const plain = lemma === "be" ? "are" : lemma;
  return {
    "pre:1s": lemma === "be" ? "am" : lemma,
    "pre:2s": plain,
    "pre:3s": englishThirdPerson(lemma),
    "pre:1p": plain,
    "pre:2p": plain,
    "pre:3p": plain,
  };
}

/**
 * Every cell of a verb's paradigm. `pas:s` is the past after I/he/she/it and `pas:p`
 * after you/we/they: they differ only for be ("was, were" in irregular-forms.json).
 */
export function englishParadigmCells(lemma: string, irregular?: IrregularVerb): Record<string, string> {
  const pasts = irregular?.past.split(",").map((p) => p.trim()) ?? [englishPastRegular(lemma)];
  return {
    inf: lemma,
    ...presentCells(lemma),
    "pas:s": pasts[0],
    "pas:p": pasts[pasts.length - 1],
    participle: irregular?.participle ?? englishPastRegular(lemma),
    ing: englishIng(lemma),
  };
}

/** A paradigm table's spelling rules; an irregular verb's past is left to the evidence rows. */
export function englishGroupRules(table: { lemma: string; group: string; cells: Record<string, string> }, err: (m: string) => void): void {
  const expected: Record<string, string> = { ...presentCells(table.lemma), ing: englishIng(table.lemma) };
  if (table.group === "regular") {
    const past = englishPastRegular(table.lemma);
    Object.assign(expected, { "pas:s": past, "pas:p": past, participle: past });
  }
  for (const [cell, form] of Object.entries(expected)) {
    const got = table.cells[cell];
    if (got !== undefined && got !== form) err(`${table.lemma}: ${table.group} ${cell} must be "${form}", got "${got}"`);
  }
}
