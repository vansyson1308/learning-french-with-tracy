/**
 * Spanish build plugin (P3a): el/la/los/las/un/una article↔gender
 * evidence (with the "el agua" rule — `el` before a stressed a-initial
 * feminine noun carries no gender evidence), the present-indicative
 * paradigm cells evidenced by the committed kaikki morphology rows, and
 * the regular -ar/-er/-ir written paradigms. Used by the lexicon
 * validators for `es`; the Spanish course content itself is authored in
 * P3d.
 */

import { existsSync } from "fs";

import { es as esRules } from "../../../src/lib/languages/es";
import { readJson, safeResolve } from "../pipeline";

import { genericPlugin } from "./generic";
import type { ArticleRules, BuildLanguagePlugin, MorphVerb, ParadigmSpec } from "./types";

export const ES_ARTICLES: ArticleRules = {
  gender: { el: "masculine", la: "feminine", los: "masculine", las: "feminine", un: "masculine", una: "feminine" },
  neutral: [],
  // "el agua", "el hambre": the feminine singular takes `el` before a
  // stressed /a/ — the article is then no evidence of masculine gender.
  neutralBefore: { articles: ["el", "un"], noun: /^(?:a|á|ha)/i },
};

export const ES_PARADIGM_CELLS = ["inf", "pre:1s", "pre:2s", "pre:3s", "pre:1p", "pre:2p", "pre:3p", "participle"] as const;

const MORPHOLOGY_SOURCE = "content/es/lexicon/derived/morphology.json";

function cellEvidencedBy(cellId: string, atom: string): boolean {
  if (cellId === "inf") return atom === "inf";
  if (cellId === "participle") return atom === "par:pas";
  const person = cellId.slice(4, 5);
  return atom === `ind:pre:${person}`;
}

/** Regular -ar / -er / -ir verbs must follow the written paradigm they claim. */
function groupRules(table: { lemma: string; group: string; cells: Record<string, string> }, err: (m: string) => void) {
  const endings: Record<string, string[]> = {
    "ar-regular": ["o", "as", "a", "amos", "áis", "an"],
    "er-regular": ["o", "es", "e", "emos", "éis", "en"],
    "ir-regular": ["o", "es", "e", "imos", "ís", "en"],
  };
  const expected = endings[table.group];
  if (!expected) return;
  const stem = table.lemma.slice(0, -2);
  const cells = ["pre:1s", "pre:2s", "pre:3s", "pre:1p", "pre:2p", "pre:3p"];
  cells.forEach((cell, i) => {
    const form = table.cells[cell];
    if (form !== undefined && form !== `${stem}${expected[i]}`) {
      err(`${table.lemma}: ${table.group} ${cell} must be stem + ${expected[i]} ("${stem}${expected[i]}"), got "${form}"`);
    }
  });
}

export const ES_PARADIGM: ParadigmSpec = {
  cellIds: ES_PARADIGM_CELLS,
  groups: ["ar-regular", "er-regular", "ir-regular", "irregular"],
  evidenceSource: "kaikki-en",
  loadEvidence(): MorphVerb[] | null {
    if (!existsSync(safeResolve(MORPHOLOGY_SOURCE))) return null;
    return (readJson(MORPHOLOGY_SOURCE) as { verbs: MorphVerb[] }).verbs;
  },
  cellEvidencedBy,
  groupRules,
};

/** High-frequency Spanish function words (writing plausibility floor); reviewed list. */
export const ES_FUNCTION_WORDS: readonly string[] = (
  "yo tú usted él ella nosotros nosotras vosotros vosotras ustedes ellos ellas me te se nos os le les lo la los las " +
  "el un una unos unas del al de a en con sin por para sobre entre hasta desde " +
  "mi mis tu tus su sus nuestro nuestra nuestros nuestras vuestro vuestra " +
  "este esta estos estas ese esa esos esas aquel aquella " +
  "que qué quién quiénes cuál cuáles cómo dónde cuándo cuánto cuánta cuántos cuántas por-qué " +
  "y e o u pero porque si no sí también muy más menos ya aquí allí hoy mañana ayer " +
  "es soy eres somos sois son está estoy estás estamos estáis están hay " +
  "hola adiós gracias señor señora"
).split(" ");

export const es: BuildLanguagePlugin = genericPlugin(
  { code: "es", recognitionLocale: "es-ES", ttsLocale: "es-ES", script: "latin", flagAsset: "es" },
  {
    rules: esRules,
    articleRules: ES_ARTICLES,
    normalizeForAsr: { ligatures: {}, apostropheSplit: false, wordChars: "a-z\\u00e0-\\u00ff\\u00f1", whisperLanguage: "es", metric: "wer" },
    paradigm: ES_PARADIGM,
    functionWords: ES_FUNCTION_WORDS,
    targetLanguageName: "Spanish",
  }
);
