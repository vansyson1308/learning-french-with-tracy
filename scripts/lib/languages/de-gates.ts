/**
 * German course gates (coordinator QC 2026-10-28 §2), run by content:validate
 * on every German course except the inherited basic pack (de-en stays as it
 * was, QC §1):
 *
 *  - noun-capital: a taught noun is written with a capital letter.
 *  - noun-article: a taught noun comes with its article (der/die/das).
 *  - noun-plural: every taught noun has its plural in
 *    content/de/lexicon/noun-plurals.json ("-e", "¨-er", "-n", "-s",
 *    "-" = unchanged, "—" = no plural / plural only).
 *  - dative-chunks: before Section 4, a dative form (dem, einem, im, am,
 *    zum, zur, vom, beim) appears only inside a declared fixed chunk
 *    (content/de/lexicon/dative-chunks.json): A1 teaches Nominativ and
 *    Akkusativ explicitly, Dativ as formulas only.
 *  - v2-separable: the verb-second and separable-verb concept cards are
 *    each followed by at least 6 exercises (lessons whose flow shows the
 *    card).
 *  - scenario-register: each interaction scenario keeps one form of
 *    address (du or Sie) — see scenarioRegisterErrors.
 */
import { existsSync } from "fs";

import type { PackSource } from "../../../content/schema";
import { readJson, safeResolve } from "../pipeline";

export const PLURALS_PATH = "content/de/lexicon/noun-plurals.json";
export const DATIVE_CHUNKS_PATH = "content/de/lexicon/dative-chunks.json";
const PLURAL_NOTATION = /^(?:—|-|¨|¨?-(?:e|er|n|en|s|se|nen)|\p{Lu}\p{L}+)$/u;
const DATIVE_FORMS = ["dem", "einem", "im", "am", "zum", "zur", "vom", "beim"];
const ARTICLE = /^(der|die|das) (\p{Lu}[\p{L}-]*)$/u;
const MIN_CONCEPT_PRACTICE = 6;
export const V2_CONCEPTS = ["de:concept:verb-second", "de:concept:separable-verbs"];

type Lexeme = { id: string; surface: string; legacySurfaces?: string[]; partOfSpeech: string };
type Exercise = PackSource["sections"][number]["units"][number]["lessons"][number]["exercises"][number];

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
  // D-10 review: a word-bank alternative is a token sequence too — one sentence, not loose words.
  if (e.type === "wordBank") for (const alt of (x.alternatives as string[][] | undefined) ?? []) out.push(alt.join(" "));
  else add(x.alternatives);
  for (const k of ["audioTarget", "pairs"]) add(x[k]);
  if (e.type !== "fillBlank") add(x.sentence);
  // Options and prompts are German only in target-facing modes.
  if (x.mode === "nativeToTarget" || x.mode === "listen" || e.type === "fillBlank") add(x.options);
  if (x.mode === "targetToNative" || e.type === "wordBank" && x.direction === "targetToNative") add(x.prompt);
  return out;
}

export function germanCourseErrors(
  pack: PackSource,
  input: {
    lexicon: Lexeme[];
    plurals: Record<string, string> | null;
    dativeChunks: string[] | null;
  }
): string[] {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`${pack.id}: ${m}`);
  const bySurface = new Map<string, Lexeme>();
  for (const l of input.lexicon) {
    bySurface.set(l.surface, l);
    for (const s of l.legacySurfaces ?? []) bySurface.set(s, l);
  }

  // Taught nouns: capital, article, plural.
  for (const s of pack.sections)
    for (const u of s.units)
      for (const w of u.words) {
        const lex = bySurface.get(w.target);
        if (!lex || lex.partOfSpeech !== "noun") continue;
        const m = ARTICLE.exec(w.target);
        if (!m) {
          const bare = w.target.split(" ").pop() ?? w.target;
          if (!/^\p{Lu}/u.test(bare)) err(`noun-capital: "${w.target}" (${u.id}) must be capitalised`);
          else err(`noun-article: "${w.target}" (${u.id}) is taught without its article`);
          continue;
        }
        if (input.plurals === null) {
          err(`noun-plural: ${PLURALS_PATH} is missing`);
          return errors;
        }
        const pl = input.plurals[lex.id];
        if (pl === undefined) err(`noun-plural: "${w.target}" (${lex.id}, ${u.id}) has no plural in ${PLURALS_PATH}`);
        else if (!PLURAL_NOTATION.test(pl)) err(`noun-plural: ${lex.id} plural "${pl}" is not in the notation (-e, -er, -n, -en, -s, -se, -nen, ¨, ¨-e, ¨-er, -, — or a full irregular plural)`);
      }

  // Dative only in declared chunks before Section 4.
  const chunks = (input.dativeChunks ?? []).map((c) => c.toLowerCase());
  const dative = new RegExp(`(^|[^\\p{L}])(${DATIVE_FORMS.join("|")})([^\\p{L}]|$)`, "iu");
  pack.sections.forEach((s, si) => {
    if (si >= 3) return;
    for (const u of s.units)
      for (const l of u.lessons)
        for (const e of l.exercises)
          for (const text of targetStrings(e)) {
            if (!dative.test(text)) continue;
            let rest = text.toLowerCase();
            for (const c of chunks) rest = rest.split(c).join(" ");
            if (dative.test(rest)) err(`dative-chunks: ${e.id} uses a dative form outside a declared chunk before Section 4: "${text}"`);
          }
  });

  // Verb-second and separable verbs: concept card + ≥ 6 exercises each.
  for (const concept of V2_CONCEPTS) {
    let practice = 0;
    let shown = false;
    for (const s of pack.sections)
      for (const u of s.units)
        for (const l of u.lessons) {
          const flow = (l as { flow?: { concept?: string; exercise?: string }[] }).flow ?? [];
          const at = flow.findIndex((f) => f.concept === concept);
          if (at < 0) continue;
          shown = true;
          // The card's practice runs until the next concept card of the lesson.
          const after = flow.slice(at + 1);
          const next = after.findIndex((f) => f.concept !== undefined);
          practice += (next < 0 ? after : after.slice(0, next)).filter((f) => f.exercise !== undefined).length;
        }
    if (!shown) err(`v2-separable: no lesson flow shows ${concept}`);
    else if (practice < MIN_CONCEPT_PRACTICE) err(`v2-separable: ${concept} is followed by ${practice} exercise(s) (< ${MIN_CONCEPT_PRACTICE})`);
  }
  return errors;
}

const DU_FORMS = new Set(["du", "dich", "dir", "dein", "deine", "deinen", "deinem", "deiner", "deines"]);
const SIE_FORMS = new Set(["Sie", "Ihnen", "Ihr", "Ihre", "Ihren", "Ihrem", "Ihrer", "Ihres"]);

/** "du" / "Sie" markers of one line; a capitalised form opening a sentence may be she/they/you-plural, so it does not count. */
function registerMarkers(line: string): { du: boolean; sie: boolean } {
  let du = false;
  let sie = false;
  let sentenceStart = true;
  for (const raw of line.split(/\s+/)) {
    const word = raw.replace(/^[„"'(¿¡]+|[.,!?;:"'“”)]+$/gu, "").replace(/'s$/, "");
    if (word !== "") {
      if (DU_FORMS.has(word.toLowerCase())) du = true;
      if (!sentenceStart && SIE_FORMS.has(word)) sie = true;
      sentenceStart = false;
    }
    if (/[.!?]["”]?$/u.test(raw)) sentenceStart = true;
  }
  return { du, sie };
}

type ScenarioNode = { kind: string; text?: string; rephraseText?: string; expected?: { acceptedVariants?: string[] }[] };

/**
 * scenario-register (QC 2026-10-28 §2): each interaction scenario keeps one
 * form of address. Partner lines, rephrasings, endings and the learner's
 * accepted answers may not mix du-forms with formal Sie/Ihnen/Ihr.
 */
export function scenarioRegisterErrors(scenarios: { id: string; nodes: Record<string, ScenarioNode> }[]): string[] {
  const errors: string[] = [];
  for (const s of scenarios) {
    const lines = Object.values(s.nodes).flatMap((n) => [
      ...(n.text !== undefined ? [n.text] : []),
      ...(n.rephraseText !== undefined ? [n.rephraseText] : []),
      ...(n.expected ?? []).flatMap((x) => x.acceptedVariants ?? []),
    ]);
    const marks = lines.map((l) => ({ l, ...registerMarkers(l) }));
    const du = marks.filter((m) => m.du);
    const sie = marks.filter((m) => m.sie);
    if (du.length > 0 && sie.length > 0) {
      errors.push(`scenario-register: ${s.id} mixes du ("${du[0].l}") and Sie ("${sie[0].l}")`);
    }
  }
  return errors;
}

/** Load the data files the gates read (null = absent). */
export function loadGermanGateData(): { plurals: Record<string, string> | null; dativeChunks: string[] | null } {
  const plurals = existsSync(safeResolve(PLURALS_PATH)) ? (readJson(PLURALS_PATH) as { plurals: Record<string, string> }).plurals : null;
  const dativeChunks = existsSync(safeResolve(DATIVE_CHUNKS_PATH)) ? (readJson(DATIVE_CHUNKS_PATH) as { chunks: string[] }).chunks : null;
  return { plurals, dativeChunks };
}
