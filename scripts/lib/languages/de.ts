/**
 * German build plugin (P3d de): article↔gender evidence from the forms
 * that prove it for a singular noun (die/eine, das, den/einen — `der`,
 * `ein`, `dem`, `des` are ambiguous across genders and cases), the
 * present-indicative paradigm cells evidenced by the committed
 * kaikki morphology rows, the regular (weak) written paradigm, and the
 * ASR normalisation (ß → ss, umlauts kept).
 */

import { existsSync } from "fs";

import { de as deRules } from "../../../src/lib/languages/de";
import { readJson, safeResolve } from "../pipeline";

import { genericPlugin } from "./generic";
import type { ArticleRules, BuildLanguagePlugin, MorphVerb, ParadigmSpec } from "./types";

export const DE_ARTICLES: ArticleRules = {
  // Only forms that prove the gender of a singular noun: die/eine (feminine
  // nominative/accusative), das (neuter), den/einen (masculine accusative).
  // `der` is also the feminine dative/genitive ("in der Küche"): a surface
  // article, never evidence.
  gender: { die: "feminine", eine: "feminine", das: "neuter", den: "masculine", einen: "masculine" },
  neutral: ["der"],
  // Nouns in -er/-el/-en/-chen/-lein have a plural identical to the singular:
  // "die Fenster" is plural, so `die` before them proves nothing.
  neutralBefore: { articles: ["die"], noun: /(?:er|el|en|chen|lein)$/ },
};

export const DE_PARADIGM_CELLS = ["inf", "pre:1s", "pre:2s", "pre:3s", "pre:1p", "pre:2p", "pre:3p", "participle"] as const;

const MORPHOLOGY_SOURCE = "content/de/lexicon/derived/morphology.json";

function cellEvidencedBy(cellId: string, atom: string): boolean {
  if (cellId === "inf") return atom === "inf";
  if (cellId === "participle") return atom === "par:pas";
  const person = cellId.slice(4, 5);
  return atom === `ind:pre:${person}`;
}

/**
 * Regular (weak) verbs: stem + e, st, t, en, t, en — with the linking e
 * after a stem in -d/-t or consonant + m/n (arbeit-e-st, öffn-e-t), and
 * -n instead of -en for -eln/-ern verbs (wir sammeln).
 */
function groupRules(table: { lemma: string; group: string; cells: Record<string, string> }, err: (m: string) => void) {
  if (table.group !== "regular") return;
  const elnErn = /(?:el|er)n$/.test(table.lemma);
  const stem = elnErn ? table.lemma.slice(0, -1) : table.lemma.replace(/en$/, "");
  const linking = !elnErn && /(?:[dt]|[^aeiouäöülr][mn])$/.test(stem) ? "e" : "";
  const plural = elnErn ? "n" : "en";
  const expected: Record<string, string> = {
    "pre:1s": `${elnErn ? stem.replace(/e([lr])$/, "$1") : stem}e`,
    "pre:2s": `${stem}${linking}st`,
    "pre:3s": `${stem}${linking}t`,
    "pre:1p": `${stem}${plural}`,
    "pre:2p": `${stem}${linking}t`,
    "pre:3p": `${stem}${plural}`,
  };
  for (const [cell, form] of Object.entries(expected)) {
    const got = table.cells[cell];
    if (got !== undefined && got !== form) err(`${table.lemma}: regular ${cell} must be "${form}", got "${got}"`);
  }
}

export const DE_PARADIGM: ParadigmSpec = {
  cellIds: DE_PARADIGM_CELLS,
  groups: ["regular", "irregular"],
  evidenceSource: "kaikki-en",
  loadEvidence(): MorphVerb[] | null {
    if (!existsSync(safeResolve(MORPHOLOGY_SOURCE))) return null;
    return (readJson(MORPHOLOGY_SOURCE) as { verbs: MorphVerb[] }).verbs;
  },
  cellEvidencedBy,
  groupRules,
};

/** High-frequency German function words (writing plausibility floor); reviewed list. */
export const DE_FUNCTION_WORDS: readonly string[] = (
  "ich du er sie es wir ihr mich dich sich uns euch mir dir ihm ihnen man " +
  "der die das den dem des ein eine einen einem einer eines kein keine keinen keinem " +
  "mein meine dein deine sein seine ihr ihre unser unsere euer eure " +
  "dieser diese dieses diesen diesem " +
  "in im an am auf aus bei mit nach seit von vom zu zum zur für ohne um durch gegen über unter vor hinter neben zwischen " +
  "und oder aber denn sondern weil dass wenn ob als wie " +
  "wer was wo wann warum wie woher wohin welche welcher welches " +
  "nicht nein ja doch auch noch schon sehr nur hier da dort heute morgen jetzt " +
  "bin bist ist sind seid war habe hast hat haben habt hatte " +
  "hallo tschüss danke bitte"
).split(" ");

export const de: BuildLanguagePlugin = genericPlugin(
  { code: "de", recognitionLocale: "de-DE", ttsLocale: "de-DE", script: "latin", flagAsset: "de" },
  {
    rules: deRules,
    articleRules: DE_ARTICLES,
    normalizeForAsr: { ligatures: { ß: "ss" }, apostropheSplit: false, wordChars: "a-z\\u00e4\\u00f6\\u00fc0-9", whisperLanguage: "de", metric: "wer" },
    paradigm: DE_PARADIGM,
    functionWords: DE_FUNCTION_WORDS,
    targetLanguageName: "German",
  }
);
