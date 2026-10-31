/**
 * English build plugin (P4 en-vi): articles without gender, the paradigm of regular
 * and irregular verbs evidenced by the committed kaikki morphology rows, function
 * words, story endings and the English course gates. Spelling rules: en-morph.ts.
 * Regular verb forms reach the story resolver through the morphology evidence;
 * the endings here cover what is left: plurals, comparatives.
 */

import { existsSync } from "fs";

import { englishNumber, en as enRules } from "../../../src/lib/languages/en";
import { readJson, safeResolve } from "../pipeline";

import { collectTargetText, englishCourseErrors, FREE_TEXT_FILES, loadEnglishGateData, scenarioLines, scenarioRegisterErrors, targetTextErrors } from "./en-gates";
import { englishGroupRules } from "./en-morph";
import { genericPlugin } from "./generic";
import type { ArticleRules, BuildLanguagePlugin, MorphVerb, ParadigmSpec } from "./types";

/** Which articles a drill may offer. a/an follows the next word's sound: the a-an gate (en-gates.ts) reads every drill's keyed phrase. */
export const EN_ARTICLES: ArticleRules = { gender: {}, neutral: ["a", "an", "the"], genderless: true };

export const EN_PARADIGM_CELLS = ["inf", "pre:1s", "pre:2s", "pre:3s", "pre:1p", "pre:2p", "pre:3p", "pas:s", "pas:p", "participle", "ing"] as const;

const MORPHOLOGY_SOURCE = "content/en/lexicon/derived/morphology.json";

/**
 * kaikki rarely marks an English person: most verbs have only inf, ind:pre:3, par:pre and
 * par:pas, with the simple past under par:pas. So the base form evidences the plain present
 * cells, par:pas evidences the past, and which form sits in which cell is groupRules' check.
 */
function cellEvidencedBy(cellId: string, atom: string): boolean {
  if (cellId === "inf") return atom === "inf";
  if (cellId === "participle") return atom === "par:pas";
  if (cellId === "ing") return atom === "par:pre";
  if (cellId === "pre:3s") return atom === "ind:pre:3";
  if (cellId.startsWith("pas:")) return atom.startsWith("ind:pas:") || atom === "par:pas" || atom === "pl";
  return atom === "inf" || atom === "pl" || atom === "ind:pre:1" || atom === "ind:pre:2";
}

export const EN_PARADIGM: ParadigmSpec = {
  cellIds: EN_PARADIGM_CELLS,
  groups: ["regular", "irregular"],
  evidenceSource: "kaikki-en",
  loadEvidence(): MorphVerb[] | null {
    if (!existsSync(safeResolve(MORPHOLOGY_SOURCE))) return null;
    return (readJson(MORPHOLOGY_SOURCE) as { verbs: MorphVerb[] }).verbs;
  },
  cellEvidencedBy,
  groupRules: englishGroupRules,
};

/**
 * High-frequency English function words (writing plausibility floor); reviewed list. The last
 * line is what a contraction leaves after folding when it stays whole ("Don't you…?", "Yes, it's.").
 */
export const EN_FUNCTION_WORDS: readonly string[] = (
  "i you he she it we they me him her us them my your his its our their mine yours hers ours theirs " +
  "a an the this that these those some any no every each all both many much more most few little other another " +
  "in on at to from of for with without by about under over near behind between into along around after before during until past up down out off " +
  "and but or because so if than as when while then too also " +
  "what who whom whose where why how which " +
  "am is are was were be been being have has had having do does did doing done " +
  "can could will would should must may might shall not " +
  "yes no please very here there now today tomorrow yesterday " +
  "hello hi goodbye bye thanks sorry ok " +
  "don doesn didn isn aren wasn weren won couldn wouldn shouldn mustn haven hasn hadn t s m re ve ll d"
).split(" ");

export const en: BuildLanguagePlugin = genericPlugin(
  { code: "en", recognitionLocale: "en-US", ttsLocale: "en-US", script: "latin", flagAsset: "gb" },
  {
    rules: enRules,
    articleRules: EN_ARTICLES,
    paradigm: EN_PARADIGM,
    functionWords: EN_FUNCTION_WORDS,
    numberWords: englishNumber,
    targetLanguageName: "English",
    // Applied to nouns and adjectives only. A closed list first: these stem changes are the whole set the lexicon has.
    storyEndings: [
      [/^children$/, "child"],
      [/^men$/, "man"],
      [/^women$/, "woman"],
      [/^feet$/, "foot"],
      [/^teeth$/, "tooth"],
      [/^(?:better|best)$/, "good"],
      [/^(?:worse|worst)$/, "bad"],
      [/ves$/, "fe"],
      [/ves$/, "f"],
      [/ies$/, "y"],
      [/ier$/, "y"],
      [/iest$/, "y"],
      [/es$/, ""],
      [/s$/, ""],
      [/(.)\1er$/, "$1"],
      [/(.)\1est$/, "$1"],
      [/er$/, ""],
      [/er$/, "e"],
      [/est$/, ""],
      [/est$/, "e"],
    ],
    courseErrors: (pack) => {
      const rel = "content/en/lexicon/lexemes.json";
      const lexicon = existsSync(safeResolve(rel)) ? (readJson(rel) as { lexemes: Parameters<typeof englishCourseErrors>[1]["lexicon"] }).lexemes : [];
      const scenariosRel = "content/en/interaction/scenarios.json";
      const used = new Set(pack.sections.flatMap((s) => s.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises))).flatMap((e) => (e.type === "interactionScenario" ? [e.scenarioId] : [])));
      const scenarios = existsSync(safeResolve(scenariosRel))
        ? (readJson(scenariosRel) as { scenarios: Parameters<typeof scenarioRegisterErrors>[0] }).scenarios.filter((s) => used.has(s.id))
        : [];
      const { irregular, conceptIds } = loadEnglishGateData();
      const data = { lexicon, irregular };
      const freeText = FREE_TEXT_FILES.filter((f) => existsSync(safeResolve(f))).flatMap((f) => collectTargetText(readJson(f)).map((text) => ({ where: f, text })));
      const lines = scenarios.flatMap((s) => scenarioLines(s).map((text) => ({ where: s.id, text })));
      return [
        ...englishCourseErrors(pack, { ...data, conceptIds }),
        ...scenarioRegisterErrors(scenarios).map((m) => `${pack.id}: ${m}`),
        ...[...freeText, ...lines].flatMap(({ where, text }) => targetTextErrors(text, data).map((m) => `${pack.id}: ${m} (${where})`)),
      ];
    },
  }
);
