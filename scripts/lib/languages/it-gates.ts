/**
 * Italian course gates (coordinator QC 2026-10-29 §3.4), run by content:validate
 * on every Italian course except the inherited basic pack (it-en stays as it was):
 *
 *  - noun-article: a taught noun comes with the definite article its gender and
 *    initial sound select (il/lo/la/l').
 *  - noun-plural: every taught noun has its plural with article in
 *    content/it/lexicon/noun-plurals.json ("i libri", "gli amici", "le città",
 *    "—" = no plural). A masculine noun takes `le` only for a declared irregular
 *    plural (le uova, le dita).
 *  - elision: article + noun in target text (il/lo/la/l'/i/gli/le, un/uno/una/un',
 *    al/dello/nel… articulated forms), checked against the sound, and against the
 *    lexicon's gender where the sound alone does not decide.
 *  - auxiliary: essere/avere in the passato prossimo, from the paradigm tables.
 *  - agreement: a participle after a plural or a clearly singular essere agrees in
 *    number. Gender is not checked: A1 production does not require it (CILS).
 *  - double-consonants: the minimal-pair card is followed by ≥ 6 exercises holding
 *    at least four pairs (pala/palla) — Vietnamese has no such contrast.
 *  - scenario-register: each interaction scenario keeps one form of address (tu or Lei).
 */
import { existsSync } from "fs";

import type { PackSource } from "../../../content/schema";
import { readJson, safeResolve } from "../pipeline";

export const PLURALS_PATH = "content/it/lexicon/noun-plurals.json";
export const PARADIGMS_PATH = "content/it/pedagogy/paradigms.json";
export const DOUBLE_CONSONANT_CONCEPT = "it:concept:double-consonants";
const MIN_CONCEPT_PRACTICE = 6;
const MIN_MINIMAL_PAIRS = 4;
/** Masculine singulars whose usual plural is feminine; only these may take `le`. */
const FEMININE_PLURAL_NOUNS = new Set(["uovo", "dito", "braccio", "orecchio", "paio", "labbro", "ginocchio", "lenzuolo", "osso", "centinaio", "migliaio"]);

const VOWEL = /^[aeiouàèéìíòóùúh]/i;
/** s + consonant, z, gn, ps, pn, x, y: the "impure" openings that select lo / gli / uno. */
const IMPURE = /^(?:s[^aeiouàèéìíòóùú\s]|z|gn|ps|pn|x|y)/i;

const COMMON_GENDER = /(?:ante|ente|ista)$/;

type Gender = "masculine" | "feminine";
type Lexeme = { id: string; surface: string; legacySurfaces?: string[]; partOfSpeech: string; gender?: string | null };
type Exercise = PackSource["sections"][number]["units"][number]["lessons"][number]["exercises"][number];
export type ItalianGateData = {
  lexicon: Lexeme[];
  plurals: Record<string, string> | null;
  /** Participles by the auxiliary they take, from the paradigm tables. */
  auxiliaries: { avere: string[]; essere: string[] };
};

export function expectedDefiniteArticle(noun: string, gender: Gender): string {
  if (VOWEL.test(noun)) return "l'";
  if (gender === "feminine") return "la";
  return IMPURE.test(noun) ? "lo" : "il";
}

export function expectedPluralArticle(noun: string, gender: Gender): string {
  if (gender === "feminine") return "le";
  return VOWEL.test(noun) || IMPURE.test(noun) ? "gli" : "i";
}

/** Every target-language string of an exercise (prompts, sentences, answers, options, pairs). */
function targetStrings(e: Exercise): string[] {
  const x = e as Record<string, unknown>;
  const out: string[] = [];
  const add = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(add);
    else if (v && typeof v === "object" && "text" in (v as object)) add((v as { text: unknown }).text);
    else if (v && typeof v === "object" && "target" in (v as object)) add((v as { target: unknown }).target);
  };
  // A word-bank answer is one sentence; a cloze is checked with its answer filled in (audioTarget).
  if (Array.isArray(x.answer)) out.push((x.answer as string[]).join(" "));
  else add(x.answer);
  if (e.type === "wordBank") for (const alt of (x.alternatives as string[][] | undefined) ?? []) out.push(alt.join(" "));
  else add(x.alternatives);
  for (const k of ["audioTarget", "pairs"]) add(x[k]);
  if (e.type !== "fillBlank") add(x.sentence);
  // Options and prompts are Italian only in target-facing modes.
  if (x.mode === "nativeToTarget" || x.mode === "listen") add(x.options);
  if (x.mode === "targetToNative" || (e.type === "wordBank" && x.direction === "targetToNative")) add(x.prompt);
  return out;
}

/** Bare noun form (no article) → its genders; a noun both ways (il/la collega) does not decide. */
function nounGenders(lexicon: Lexeme[]): Map<string, Set<Gender>> {
  const genders = new Map<string, Set<Gender>>();
  for (const l of lexicon) {
    if (l.partOfSpeech !== "noun" || (l.gender !== "masculine" && l.gender !== "feminine")) continue;
    const bare = l.surface.replace(/^(?:il|lo|la|i|gli|le) |^l'/i, "").toLowerCase();
    // -ante, -ente, -ista nouns take both genders (l'insegnante, un'insegnante, un insegnante).
    const both = COMMON_GENDER.test(bare) ? (["masculine", "feminine"] as const) : [l.gender];
    genders.set(bare, new Set([...(genders.get(bare) ?? []), ...both]));
  }
  return genders;
}

/**
 * Article + word in one string. Sound rules hold for every word after a form
 * that is only ever an article (il, i, al, del…); `lo`, `la`, `gli`, `le` are
 * also clitic pronouns ("Lo vedo", "Gli parlo", "La amo"), so those are checked
 * only before a word the lexicon knows as a noun.
 */
function articleProblems(text: string, genders: Map<string, Set<Gender>>): string[] {
  const out: string[] = [];
  const said = (m: string) => out.push(`"${m}" in "${text}"`);
  const pairRe = /(?:^|[^\p{L}'’])(\p{L}+)[  ]+(\p{L}+)/gu;
  const lower = text.toLowerCase();
  for (const m of lower.matchAll(/(?:^|[^\p{L}])(l|un|dell|all|dall|nell|sull)['’] +\p{L}/gu)) said(m[0].trim());
  for (const m of lower.matchAll(/(?:^|[^\p{L}])l['’](\p{L}+)/gu)) if (!VOWEL.test(m[1])) said(m[0].trim());
  for (const m of lower.matchAll(/(?:^|[^\p{L}])un['’](\p{L}+)/gu)) {
    const g = genders.get(m[1]);
    if (!VOWEL.test(m[1]) || (g?.has("masculine") && !g.has("feminine"))) said(m[0].trim());
  }
  // Overlapping scan: each word is the second word of one pair and the first of the next.
  let at = 0;
  while (at < lower.length) {
    pairRe.lastIndex = at;
    const m = pairRe.exec(lower);
    if (!m) break;
    at = m.index + 1 + (m[0].search(/\p{L}/u) > 0 ? m[0].search(/\p{L}/u) : 0) + m[1].length;
    const [article, word] = [m[1], m[2]];
    const g = genders.get(word);
    const isNoun = g !== undefined;
    const fem = g?.has("feminine") === true && !g.has("masculine");
    const masc = g?.has("masculine") === true && !g.has("feminine");
    const vowel = VOWEL.test(word);
    const impure = IMPURE.test(word);
    const wrong = (() => {
      switch (article) {
        case "il":
        case "al":
        case "del":
        case "dal":
        case "nel":
        case "sul":
        case "col":
          return vowel || impure;
        case "i":
        case "ai":
        case "dei":
        case "dai":
        case "nei":
        case "sui":
          return vowel || impure;
        // uno and una are also the number and the pronoun ("uno e cinquanta", "una in tasca"): nouns only.
        case "uno":
          return isNoun && (vowel || !impure);
        case "una":
          return isNoun && vowel;
        case "un":
          return impure || (vowel && fem);
        case "lo":
        case "allo":
        case "dello":
        case "dallo":
        case "nello":
        case "sullo":
          return isNoun && !impure;
        case "la":
        case "alla":
        case "della":
        case "dalla":
        case "nella":
        case "sulla":
          return isNoun && (vowel || masc);
        case "gli":
        case "agli":
        case "degli":
        case "dagli":
        case "negli":
        case "sugli":
          return isNoun && !vowel && !impure;
        default:
          return false;
      }
    })();
    if (wrong) said(`${article} ${word}`);
  }
  return out;
}

const PLURAL_ESSERE = /(?:^|[^\p{L}])(siamo|siete)\s+(\p{L}+)/giu;
const SINGULAR_ESSERE = /(?:^|[^\p{L}])(è|sei)\s+(\p{L}+)/giu;
const AVERE = /(?:^|[^\p{L}])(ho|hai|ha|abbiamo|avete|hanno)\s+(\p{L}+)/giu;
// Not `è`: "È scritto", "è chiuso" are passives or adjectives.
const ESSERE = /(?:^|[^\p{L}])(sono|sei|siamo|siete)\s+(\p{L}+)/giu;

/** Essere-participle stem: andato/andata/andati/andate → andat. */
const stemOf = (participle: string) => participle.toLowerCase().replace(/[oaie]$/, "");

function auxiliaryProblems(text: string, aux: ItalianGateData["auxiliaries"]): { rule: "auxiliary" | "agreement"; detail: string }[] {
  const out: { rule: "auxiliary" | "agreement"; detail: string }[] = [];
  const essereStems = new Set(aux.essere.map(stemOf));
  // A verb taking both (ha vissuto / è vissuto) is never an error.
  const avereOnly = new Set(aux.avere.map((p) => p.toLowerCase()).filter((p) => !essereStems.has(stemOf(p))));
  const avereStems = new Set(aux.avere.map(stemOf));
  for (const m of text.matchAll(AVERE)) if (essereStems.has(stemOf(m[2])) && !avereStems.has(stemOf(m[2])) && /[oaie]$/i.test(m[2])) out.push({ rule: "auxiliary", detail: `"${m[1]} ${m[2]}" in "${text}" (takes essere)` });
  for (const m of text.matchAll(ESSERE)) if (avereOnly.has(m[2].toLowerCase())) out.push({ rule: "auxiliary", detail: `"${m[1]} ${m[2]}" in "${text}" (takes avere)` });
  for (const m of text.matchAll(PLURAL_ESSERE)) if (essereStems.has(stemOf(m[2])) && /[oa]$/i.test(m[2])) out.push({ rule: "agreement", detail: `"${m[1]} ${m[2]}" in "${text}"` });
  for (const m of text.matchAll(SINGULAR_ESSERE)) if (essereStems.has(stemOf(m[2])) && /[ie]$/i.test(m[2])) out.push({ rule: "agreement", detail: `"${m[1]} ${m[2]}" in "${text}"` });
  return out;
}

/** One free target-language string (a story sentence, a reading): the elision, auxiliary and agreement rules. */
export function targetTextErrors(text: string, input: Pick<ItalianGateData, "lexicon" | "auxiliaries">): string[] {
  return [
    ...articleProblems(text, nounGenders(input.lexicon)).map((d) => `elision: ${d}`),
    ...auxiliaryProblems(text, input.auxiliaries).map((p) => `${p.rule}: ${p.detail}`),
  ];
}

/** Files holding free Italian text the elision, auxiliary and agreement rules also read. */
export const FREE_TEXT_FILES = ["content/it/reception/reading.json", "content/it/reception/listening.json", "content/it/stories/stories.json"];

/** The target-language text of a reception or story file: paragraphs, clip segments, story sentences. */
export function collectTargetText(doc: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.text === "string") out.push(o.text);
      for (const [k, x] of Object.entries(o)) if (k !== "translation" && k !== "supportGlossary" && k !== "questions") walk(x);
    }
  };
  walk(doc);
  return out;
}

/** Minimal pairs the drill must hold: a word and the same word with one doubled consonant. */
function minimalPairsIn(words: Set<string>): number {
  let pairs = 0;
  for (const w of words) {
    const single = w.replace(/([b-df-hj-np-tv-z])\1/g, "$1");
    if (single !== w && words.has(single)) pairs += 1;
  }
  return pairs;
}

export function italianCourseErrors(pack: PackSource, input: ItalianGateData): string[] {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`${pack.id}: ${m}`);
  const bySurface = new Map<string, Lexeme>();
  for (const l of input.lexicon) {
    bySurface.set(l.surface, l);
    for (const s of l.legacySurfaces ?? []) bySurface.set(s, l);
  }
  const lessons = pack.sections.flatMap((s) => s.units.flatMap((u) => u.lessons));

  for (const s of pack.sections)
    for (const u of s.units)
      for (const w of u.words) {
        const lex = bySurface.get(w.target);
        if (!lex || lex.partOfSpeech !== "noun" || (lex.gender !== "masculine" && lex.gender !== "feminine")) continue;
        const m = /^(il|lo|la|i|gli|le) (.+)$|^(l')(.+)$/.exec(w.target);
        if (!m) {
          err(`noun-article: "${w.target}" (${u.id}) is taught without its article`);
          continue;
        }
        const article = m[1] ?? m[3];
        const bare = m[2] ?? m[4];
        const pluralOnly = article === "i" || article === "gli" || article === "le";
        const expected = pluralOnly ? expectedPluralArticle(bare, lex.gender) : expectedDefiniteArticle(bare, lex.gender);
        if (article !== expected) {
          err(`noun-article: "${w.target}" (${u.id}) must take "${expected}"`);
          continue;
        }
        if (input.plurals === null) {
          err(`noun-plural: ${PLURALS_PATH} is missing`);
          return errors;
        }
        const pl = input.plurals[lex.id];
        if (pl === undefined) {
          err(`noun-plural: "${w.target}" (${lex.id}, ${u.id}) has no plural in ${PLURALS_PATH}`);
          continue;
        }
        if (pl === "—") continue;
        const parts = /^(i|gli|le) (.+)$/.exec(pl);
        if (!parts) err(`noun-plural: ${lex.id} plural "${pl}" must be article + plural, or —`);
        else if (parts[1] !== expectedPluralArticle(parts[2], lex.gender) && !(parts[1] === "le" && FEMININE_PLURAL_NOUNS.has(bare))) {
          err(`noun-plural: ${lex.id} plural "${pl}" must take "${expectedPluralArticle(parts[2], lex.gender)}"`);
        }
      }

  const genders = nounGenders(input.lexicon);
  for (const l of lessons)
    for (const e of l.exercises)
      for (const text of targetStrings(e)) {
        for (const d of articleProblems(text, genders)) err(`elision: ${e.id} ${d}`);
        for (const p of auxiliaryProblems(text, input.auxiliaries)) err(`${p.rule}: ${e.id} ${p.detail}`);
      }

  // Double consonants: the card, its practice, and the pairs inside that practice.
  let shown = false;
  let practice = 0;
  const drilled = new Set<string>();
  const byId = new Map(lessons.flatMap((l) => l.exercises.map((e) => [e.id, e] as const)));
  for (const l of lessons) {
    const flow = (l as { flow?: { concept?: string; exercise?: string }[] }).flow ?? [];
    const at = flow.findIndex((f) => f.concept === DOUBLE_CONSONANT_CONCEPT);
    if (at < 0) continue;
    shown = true;
    const after = flow.slice(at + 1);
    const next = after.findIndex((f) => f.concept !== undefined);
    for (const f of next < 0 ? after : after.slice(0, next)) {
      if (f.exercise === undefined) continue;
      practice += 1;
      const e = byId.get(f.exercise);
      if (e) for (const t of targetStrings(e)) for (const w of t.toLowerCase().match(/\p{L}+/gu) ?? []) drilled.add(w);
    }
  }
  if (!shown) err(`double-consonants: no lesson flow shows ${DOUBLE_CONSONANT_CONCEPT}`);
  else if (practice < MIN_CONCEPT_PRACTICE) err(`double-consonants: ${DOUBLE_CONSONANT_CONCEPT} is followed by ${practice} exercise(s) (< ${MIN_CONCEPT_PRACTICE})`);
  else if (minimalPairsIn(drilled) < MIN_MINIMAL_PAIRS) err(`double-consonants: the drill holds ${minimalPairsIn(drilled)} minimal pair(s) (< ${MIN_MINIMAL_PAIRS})`);
  return errors;
}

const TU_FORMS = new Set(["tu", "ti", "te", "tuo", "tua", "tuoi", "tue", "vuoi", "puoi", "devi", "sai", "stai", "hai", "sei", "ti chiami", "scusa", "senti", "dimmi"]);
const LEI_ALWAYS = new Set(["può", "vuole", "deve", "scusi", "senta", "mi dica"]);
const LEI_CAPITAL = new Set(["Lei", "Le", "La", "Suo", "Sua", "Suoi", "Sue"]);

/** tu / Lei markers of one line; a capitalised form opening a sentence may be la/le the article, so it does not count. */
function registerMarkers(line: string): { tu: boolean; lei: boolean } {
  let tu = false;
  let lei = false;
  let sentenceStart = true;
  for (const raw of line.split(/\s+/)) {
    const word = raw.replace(/^["'(«“]+|[.,!?;:"')»”]+$/gu, "");
    if (word !== "") {
      const lower = word.toLowerCase();
      if (TU_FORMS.has(lower)) tu = true;
      if (LEI_ALWAYS.has(lower)) lei = true;
      // "Lei" opening a sentence is still formal you only when no verb says "she": taken as a marker.
      if (LEI_CAPITAL.has(word) && (!sentenceStart || word === "Lei")) lei = true;
      sentenceStart = false;
    }
    if (/[.!?]["”»]?$/u.test(raw)) sentenceStart = true;
  }
  return { tu, lei };
}

type ScenarioNode = { kind: string; text?: string; rephraseText?: string; expected?: { acceptedVariants?: string[] }[] };

/** scenario-register: partner lines, rephrasings, endings and accepted answers may not mix tu with Lei. */
export function scenarioRegisterErrors(scenarios: { id: string; nodes: Record<string, ScenarioNode> }[]): string[] {
  const errors: string[] = [];
  for (const s of scenarios) {
    const lines = Object.values(s.nodes).flatMap((n) => [
      ...(n.text !== undefined ? [n.text] : []),
      ...(n.rephraseText !== undefined ? [n.rephraseText] : []),
      ...(n.expected ?? []).flatMap((x) => x.acceptedVariants ?? []),
    ]);
    const marks = lines.map((l) => ({ l, ...registerMarkers(l) }));
    const tu = marks.filter((m) => m.tu);
    const lei = marks.filter((m) => m.lei);
    if (tu.length > 0 && lei.length > 0) errors.push(`scenario-register: ${s.id} mixes tu ("${tu[0].l}") and Lei ("${lei[0].l}")`);
  }
  return errors;
}

type ParadigmFile = { tables: { lemma: string; cells: Record<string, string>; attributes?: { auxiliary?: string } }[] };

/** Load the data files the gates read (absent = empty: the course has not reached that step). */
export function loadItalianGateData(): Pick<ItalianGateData, "plurals" | "auxiliaries"> {
  const plurals = existsSync(safeResolve(PLURALS_PATH)) ? (readJson(PLURALS_PATH) as { plurals: Record<string, string> }).plurals : null;
  const tables = existsSync(safeResolve(PARADIGMS_PATH)) ? (readJson(PARADIGMS_PATH) as ParadigmFile).tables : [];
  const auxiliaries = { avere: [] as string[], essere: [] as string[] };
  for (const t of tables) {
    const participle = t.cells.participle;
    const aux = t.attributes?.auxiliary;
    if (participle && (aux === "avere" || aux === "essere")) auxiliaries[aux].push(participle);
  }
  return { plurals, auxiliaries };
}
