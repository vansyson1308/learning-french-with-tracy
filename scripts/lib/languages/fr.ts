/**
 * French build plugin (P1c): the rules the French pipeline shipped with,
 * moved here unchanged — le/la/l'/un/une article↔gender evidence, the
 * elision-safety rule for article drills, the présent/infinitive/participle
 * paradigm cells evidenced by the committed Lexique 4 verb-morphology rows,
 * the regular -er written paradigm, the Whisper normalisation the ASR
 * audit used, and the reviewed function-word list of the writing floor.
 * Golden-pinned: any change here changes French validation or artifacts.
 */

import { existsSync } from "fs";

import { fr as frRules } from "../../../src/lib/languages/fr";
import { acceptedNumberSpellings, frenchNumber } from "../../../src/lib/learning/french-numbers";
import { readJson, safeResolve } from "../pipeline";

import { genericPlugin } from "./generic";
import type { ArticleRules, BuildLanguagePlugin, MorphVerb, ParadigmSpec } from "./types";

export const FR_ARTICLES: ArticleRules = {
  gender: { le: "masculine", la: "feminine", un: "masculine", une: "feminine" },
  neutral: ["l'"],
  // §57 elision safety: le/la cannot be drilled on a noun that takes l'
  // (vowel- or h-initial — h aspiré vs muet is exactly the ambiguity the
  // program says generated exercises must avoid).
  elisionSensitiveNoun: /^[aeiouyâàäéèêëîïôöûüœh]/i,
  elisionSensitiveArticles: ["le", "la"],
};

export const FR_PARADIGM_CELLS = [
  "inf",
  "pre:1s",
  "pre:2s",
  "pre:3s",
  "pre:1p",
  "pre:2p",
  "pre:3p",
  "participle",
] as const;

const MORPHOLOGY_SOURCE = "content/fr/lexicon/derived/verb-morphology.json";

/**
 * §26 consumption contract: a cell is evidenced by a row of the same lemma
 * whose orthographic form matches and whose analysis set carries the
 * cell's mood:tense:person atom (row-level number is documented as noisy
 * and never gates).
 */
function cellEvidencedBy(cellId: string, atom: string): boolean {
  if (cellId === "inf") return atom === "inf";
  if (cellId === "participle") return atom.startsWith("par:pas");
  const person = cellId.slice(4, 5); // "pre:1s" → "1"
  return atom === `ind:pre:${person}`;
}

/** Regular -er verbs must follow the written paradigm they claim to teach. */
function groupRules(table: { lemma: string; group: string; cells: Record<string, string> }, err: (m: string) => void) {
  if (table.group !== "er-regular") return;
  const first = table.cells["pre:1s"];
  const stemEz = table.cells.inf?.endsWith("er") ? `${table.cells.inf.slice(0, -2)}ez` : undefined;
  if (first !== undefined) {
    if (table.cells["pre:2s"] !== `${first}s`) err(`${table.lemma}: er-regular 2s must be 1s + s`);
    if (table.cells["pre:3s"] !== first) err(`${table.lemma}: er-regular 3s must equal 1s`);
    if (table.cells["pre:3p"] !== `${first}nt`) err(`${table.lemma}: er-regular 3p must be 1s + nt`);
  }
  if (stemEz !== undefined && table.cells["pre:2p"] !== stemEz) {
    err(`${table.lemma}: er-regular 2p must be stem + ez`);
  }
}

export const FR_PARADIGM: ParadigmSpec = {
  cellIds: FR_PARADIGM_CELLS,
  groups: ["er-regular", "irregular"],
  evidenceSource: "lexique-4",
  loadEvidence(): MorphVerb[] | null {
    if (!existsSync(safeResolve(MORPHOLOGY_SOURCE))) return null;
    return (readJson(MORPHOLOGY_SOURCE) as { verbs: MorphVerb[] }).verbs;
  },
  cellEvidencedBy,
  groupRules,
  attributes: { auxiliary: ["avoir", "être"] },
};

/**
 * High-frequency French function words and formulae the curriculum uses
 * constantly but that are not lexicon headwords. Authored, reviewed list —
 * the plausibility floor never guesses beyond it.
 */
export const FR_FUNCTION_WORDS: readonly string[] = (
  "je tu il elle on nous vous ils elles moi toi lui " +
  "le la les l un une des du de d au aux " +
  "mon ma mes ton ta tes son sa ses notre votre nos vos leur leurs " +
  "ce cette ces c ca cela qui que qu quoi ou où quand comment pourquoi combien " +
  "et mais donc car ne n pas plus tres très aussi bien " +
  "a à dans en sur sous avec sans pour chez avant apres après " +
  "est suis es sommes etes êtes sont ai as avons avez ont " +
  "y voila voilà oui non merci bonjour bonsoir salut madame monsieur " +
  "s m t se me te il-y-a"
).split(" ");

export const fr: BuildLanguagePlugin = genericPlugin(
  {
    code: "fr",
    recognitionLocale: "fr-FR",
    ttsLocale: "fr-FR",
    script: "latin",
    flagAsset: "fr",
    numberDrill: { accepted: acceptedNumberSpellings, expected: (n) => frenchNumber(n).traditional },
  },
  {
    rules: frRules,
    articleRules: FR_ARTICLES,
    numberWords: (n) => frenchNumber(n).traditional,
    normalizeForAsr: {
      ligatures: { "œ": "oe", "æ": "ae" },
      apostropheSplit: true,
      wordChars: "a-z\\u00e0-\\u00ff0-9",
      whisperLanguage: "fr",
    },
    paradigm: FR_PARADIGM,
    functionWords: FR_FUNCTION_WORDS,
    targetLanguageName: "French",
  }
);
