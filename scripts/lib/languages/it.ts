/**
 * Italian build plugin (P3d it): il/lo/la/un/uno/una/i/gli/le article↔gender
 * evidence (l' and un' are elided and prove nothing here), the present-indicative
 * paradigm cells evidenced by the committed kaikki morphology rows, the regular
 * -are/-ere/-ire/-isc- written paradigms with the spelling rules (cerchi, mangi),
 * the required auxiliary of every paradigm table, and the Italian course gates.
 */

import { existsSync } from "fs";

import { italianNumber, it as itRules } from "../../../src/lib/languages/it";
import { readJson, safeResolve } from "../pipeline";

import { genericPlugin } from "./generic";
import { italianCourseErrors, loadItalianGateData, scenarioRegisterErrors } from "./it-gates";
import type { ArticleRules, BuildLanguagePlugin, MorphVerb, ParadigmSpec } from "./types";

export const IT_ARTICLES: ArticleRules = {
  gender: { il: "masculine", lo: "masculine", la: "feminine", un: "masculine", uno: "masculine", una: "feminine", i: "masculine", gli: "masculine", le: "feminine" },
  neutral: ["l'", "un'"],
  // "le uova", "le dita": a masculine singular with a feminine plural, so `le` proves nothing there.
  neutralBefore: { articles: ["le"], noun: /^(?:uov|dit|bracci|orecch|pai|labbr|ginocch|lenzuol|oss)/i },
};

export const IT_PARADIGM_CELLS = ["inf", "pre:1s", "pre:2s", "pre:3s", "pre:1p", "pre:2p", "pre:3p", "participle"] as const;

const MORPHOLOGY_SOURCE = "content/it/lexicon/derived/morphology.json";

function cellEvidencedBy(cellId: string, atom: string): boolean {
  if (cellId === "inf") return atom === "inf";
  if (cellId === "participle") return atom === "par:pas";
  const person = cellId.slice(4, 5);
  return atom === `ind:pre:${person}`;
}

/** The present of a regular verb, with the -care/-gare h and the -iare single i (cerchi, paghi, mangi, studi). */
function regularPresent(lemma: string, group: string): string[] | null {
  const stem = lemma.slice(0, -3);
  if (group === "are-regular") {
    const front = /[cg]$/.test(stem) ? `${stem}h` : stem;
    const i = stem.endsWith("i") ? stem.slice(0, -1) : front;
    return [`${stem}o`, `${i}i`, `${stem}a`, `${i}iamo`, `${stem}ate`, `${stem}ano`];
  }
  if (group === "ere-regular") return [`${stem}o`, `${stem}i`, `${stem}e`, `${stem}iamo`, `${stem}ete`, `${stem}ono`];
  if (group === "ire-regular") return [`${stem}o`, `${stem}i`, `${stem}e`, `${stem}iamo`, `${stem}ite`, `${stem}ono`];
  if (group === "isc-regular") return [`${stem}isco`, `${stem}isci`, `${stem}isce`, `${stem}iamo`, `${stem}ite`, `${stem}iscono`];
  return null;
}

/**
 * The source lists some one-syllable verb forms only in their old accented spelling
 * (hò, stò, sò, fà, và): standard Italian writes them without the accent (ho, sto, so,
 * fa, va). Such a row also evidences the plain form; a row is never removed.
 */
export function withPlainMonosyllables(verbs: MorphVerb[]): MorphVerb[] {
  return verbs.map((v) => ({
    ...v,
    rows: v.rows.flatMap((r) => (/^[^aeiouàèéìòù]*[àèéìòù]$/.test(r.mot) ? [r, { ...r, mot: r.mot.normalize("NFD").replace(/[̀-ͯ]/g, "") }] : [r])),
  }));
}

function groupRules(table: { lemma: string; group: string; cells: Record<string, string> }, err: (m: string) => void) {
  const expected = regularPresent(table.lemma, table.group);
  if (expected === null) return;
  ["pre:1s", "pre:2s", "pre:3s", "pre:1p", "pre:2p", "pre:3p"].forEach((cell, i) => {
    const form = table.cells[cell];
    if (form !== undefined && form !== expected[i]) err(`${table.lemma}: ${table.group} ${cell} must be "${expected[i]}", got "${form}"`);
  });
}

export const IT_PARADIGM: ParadigmSpec = {
  cellIds: IT_PARADIGM_CELLS,
  groups: ["are-regular", "ere-regular", "ire-regular", "isc-regular", "irregular"],
  evidenceSource: "kaikki-en",
  loadEvidence(): MorphVerb[] | null {
    if (!existsSync(safeResolve(MORPHOLOGY_SOURCE))) return null;
    return withPlainMonosyllables((readJson(MORPHOLOGY_SOURCE) as { verbs: MorphVerb[] }).verbs);
  },
  cellEvidencedBy,
  groupRules,
  attributes: { auxiliary: ["avere", "essere"] },
};

/** High-frequency Italian function words (writing plausibility floor); reviewed list. */
export const IT_FUNCTION_WORDS: readonly string[] = (
  "io tu lui lei noi voi loro mi ti si ci vi lo la li le gli ne " +
  "il i un uno una del dello della dei degli delle al allo alla ai agli alle dal dallo dalla dai dagli dalle " +
  "nel nello nella nei negli nelle sul sullo sulla sui sugli sulle " +
  "di a da in con su per tra fra senza " +
  "mio mia miei mie tuo tua tuoi tue suo sua suoi sue nostro nostra nostri nostre vostro vostra vostri vostre " +
  "questo questa questi queste quello quella quelli quelle " +
  "che chi cosa come dove quando quanto quanta quanti quante perché quale quali " +
  "e ed o oppure ma però se anche non sì no molto più meno già ancora qui qua lì là oggi domani ieri " +
  "sono sei è siamo siete ho hai ha abbiamo avete hanno c'è ci " +
  "ciao buongiorno buonasera arrivederci grazie prego signore signora"
).split(" ");

export const it: BuildLanguagePlugin = genericPlugin(
  { code: "it", recognitionLocale: "it-IT", ttsLocale: "it-IT", script: "latin", flagAsset: "it" },
  {
    rules: itRules,
    articleRules: IT_ARTICLES,
    // Doubled consonants stay: anno / ano differ. The accent stays too; only the lenient comparison folds it.
    normalizeForAsr: { ligatures: {}, apostropheSplit: true, wordChars: "a-z\\u00e0-\\u00ff0-9", whisperLanguage: "it", metric: "wer" },
    paradigm: IT_PARADIGM,
    functionWords: IT_FUNCTION_WORDS,
    numberWords: italianNumber,
    targetLanguageName: "Italian",
    // Plural and agreement endings; a stem change (amico → amici is fine, uomo → uomini is not) goes in the tokenMap.
    storyEndings: [
      [/chi$/, "co"],
      [/ghi$/, "go"],
      [/che$/, "ca"],
      [/ghe$/, "ga"],
      [/ci$/, "co"],
      [/gi$/, "go"],
      [/i$/, "io"],
      [/i$/, "o"],
      [/i$/, "e"],
      [/i$/, "a"],
      [/e$/, "a"],
      [/e$/, "o"],
      [/a$/, "o"],
    ],
    courseErrors: (pack) => {
      const rel = "content/it/lexicon/lexemes.json";
      const lexicon = existsSync(safeResolve(rel)) ? (readJson(rel) as { lexemes: { id: string; surface: string; legacySurfaces?: string[]; partOfSpeech: string; gender?: string | null }[] }).lexemes : [];
      const scenariosRel = "content/it/interaction/scenarios.json";
      const used = new Set(pack.sections.flatMap((s) => s.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises))).flatMap((e) => (e.type === "interactionScenario" ? [e.scenarioId] : [])));
      const scenarios = existsSync(safeResolve(scenariosRel))
        ? (readJson(scenariosRel) as { scenarios: Parameters<typeof scenarioRegisterErrors>[0] }).scenarios.filter((s) => used.has(s.id))
        : [];
      return [...italianCourseErrors(pack, { lexicon, ...loadItalianGateData() }), ...scenarioRegisterErrors(scenarios).map((m) => `${pack.id}: ${m}`)];
    },
  }
);
