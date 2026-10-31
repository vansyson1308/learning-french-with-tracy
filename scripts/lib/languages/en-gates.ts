/**
 * English course gates (brief en-vi §2–3), run by content:validate on every English
 * course. Each rule is narrow on purpose: it names mistakes Vietnamese learners make,
 * and a gate that fires on correct English is a bug.
 *
 *  - a-an: a/an against the SOUND of the next word (an hour, a university, a European,
 *    an honest). A capital "A" or "An" inside a sentence is a label or a name (An is a
 *    Vietnamese name); opening a sentence it counts only before a known noun or adjective.
 *    Unknown initialisms, digits and usage that varies (an hotel, an herb) are quiet.
 *  - third-person: he/she/it + base form. Quiet after an auxiliary, after and/or (plural
 *    subject), after that/suggest/recommend (mandative subjunctive), and on verbs whose
 *    past is the base (put, read, cost). `it` counts only opening a clause: "Let it go".
 *  - do-support: He don't; I doesn't; Does you; Do he; Does he goes; Did he went; didn't went.
 *  - very-verb: I very like; very likes. "very like" after be means "similar to": quiet.
 *  - object-subject: Me is, opening a sentence. "What scares me is the dark" is right.
 *  - countability: a water, two money, informations; a closed list, and quiet before
 *    another noun (a water bottle) because only a known clause word may follow.
 *  - concept-card: the cards the brief requires exist and are shown in a lesson.
 *  - scenario-register: slang does not sit beside sir or madam.
 */
import { existsSync } from "fs";

import type { PackSource } from "../../../content/schema";
import { readJson, safeResolve } from "../pipeline";

import { englishPastRegular, englishThirdPerson, MODAL_VERBS, type IrregularVerb } from "./en-morph";

export { collectTargetText } from "./it-gates";

export const CONCEPTS_PATH = "content/en/pedagogy/concepts.json";
export const IRREGULAR_PATH = "content/en/lexicon/irregular-forms.json";
/** Files holding free English text the sentence rules also read. */
export const FREE_TEXT_FILES = ["content/en/reception/reading.json", "content/en/reception/listening.json", "content/en/stories/stories.json"];
export const REQUIRED_CONCEPTS = ["en:concept:articles", "en:concept:be", "en:concept:present-do-does", "en:concept:past-did", "en:concept:final-consonants", "en:concept:s-ed-pronunciation"] as const;

type Lexeme = { id: string; lemma: string; partOfSpeech: string };
type Exercise = PackSource["sections"][number]["units"][number]["lessons"][number]["exercises"][number];
export type EnglishGateData = { lexicon: Lexeme[]; irregular: { verbs: Record<string, IrregularVerb> } | null };

// ---------------------------------------------------------------------------
// Sentence tokens
// ---------------------------------------------------------------------------

type Token = { word: string; lower: string; gap: string };

function tokensOf(text: string): Token[] {
  const out: Token[] = [];
  let end = 0;
  for (const m of text.matchAll(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)) {
    out.push({ word: m[0], lower: m[0].toLowerCase().replace(/’/g, "'"), gap: text.slice(end, m.index) });
    end = m.index + m[0].length;
  }
  return out;
}

const adjacent = (tokens: Token[], i: number) => i < tokens.length && /^[ \t ]+$/.test(tokens[i].gap);
const opensSentence = (tokens: Token[], i: number) => i === 0 || /[.!?:;"“”«»()\n]/.test(tokens[i].gap);
const opensClause = (tokens: Token[], i: number) => opensSentence(tokens, i) || tokens[i].gap.includes(",");
const words = (list: string) => new Set(list.split(" "));
const WH = words("what where when why how who which");
const FREQUENCY_ADVERBS = words("always usually often sometimes never rarely also just only still");
const SUBJECTS_3S = words("he she it");
const SUBJECTS_OTHER = words("i you we they");

// ---------------------------------------------------------------------------
// a / an
// ---------------------------------------------------------------------------

/** Vowel letter, consonant sound. */
const YOO_SOUND = /^(?:eu|ewe|uni(?:corn|form|fy|on|que|t|vers|cycle|sex|lateral)|us(?:e|ing|ual|ur)|ut(?:ah|ensil|ilit|opia)|ukr|ukulele|ufo|urin|uran|one$|once$)/;
/** Written h, vowel sound. */
const SILENT_H = /^(?:hour|honest|honou?r|heir)/;
/** Speakers differ: an hotel, an historic day, an herb (US) all occur in good English. */
const VARIES = /^(?:herb|hotel|histor(?:ic|ical)|homage)/;
/** Initialisms read letter by letter; other capitals may be read as a word (a SIM, a PIN, a NATO). */
const INITIALISMS = words("ATM CEO CV DVD EU FAQ GPS HR ID IT MBA PDF SMS TV UK US USB VIP");
const VOWEL_NAMED_LETTERS = /^[AEFHILMNORSX]/;
/** Vowel-initial function words: after "a" they mean the letter, as in "a or an". */
const NOT_AFTER_A = words("and or an is are am in on at of if as it us up out off our any all");
/** Consonant-initial function words: after "an" they mean the word, as in "an before a vowel". */
const NOT_AFTER_AN = words("before but by for from not that the to when with then a");
/** "the a in apple": a word being talked about. */
const MENTIONS_LETTER = words("the letter word article");

function initialSound(word: string): "vowel" | "consonant" | null {
  const head = word.split(/[-'’]/)[0];
  if (!/^[A-Za-z]/.test(head)) return null;
  if (/^[A-Z]{2,}\d*$/.test(head)) return INITIALISMS.has(head) ? (VOWEL_NAMED_LETTERS.test(head) ? "vowel" : "consonant") : null;
  if (head.length === 1) {
    if (head === "I" || head !== head.toUpperCase()) return null;
    return VOWEL_NAMED_LETTERS.test(head) ? "vowel" : "consonant";
  }
  const lower = head.toLowerCase();
  if (VARIES.test(lower)) return null;
  if (SILENT_H.test(lower)) return "vowel";
  if (YOO_SOUND.test(lower)) return "consonant";
  return /^[aeiou]/.test(lower) ? "vowel" : "consonant";
}

/** Is this token an article at all? Capitals are labels and names unless they open a sentence before a known word. */
function isArticle(tokens: Token[], i: number, describing: ReadonlySet<string>): boolean {
  const { word } = tokens[i];
  if (word === "a" || word === "an") return i === 0 || !MENTIONS_LETTER.has(tokens[i - 1].lower);
  if (word !== "A" && word !== "An") return false;
  return opensSentence(tokens, i) && adjacent(tokens, i + 1) && describing.has(tokens[i + 1].lower);
}

function articleProblems(tokens: Token[], describing: ReadonlySet<string>): string[] {
  const out: string[] = [];
  tokens.forEach((t, i) => {
    if (!adjacent(tokens, i + 1) || !isArticle(tokens, i, describing)) return;
    const next = tokens[i + 1];
    const sound = initialSound(next.word);
    const isA = t.lower === "a";
    if (sound === null || (isA ? NOT_AFTER_A : NOT_AFTER_AN).has(next.lower)) return;
    if (isA && sound === "vowel") out.push(`a-an: "${t.word} ${next.word}" takes an`);
    if (!isA && sound === "consonant") out.push(`a-an: "${t.word} ${next.word}" takes a`);
  });
  return out;
}

// ---------------------------------------------------------------------------
// Verbs
// ---------------------------------------------------------------------------

type VerbFacts = {
  /** Base forms that cannot be read as a past tense (not put, read, cost). */
  bases: ReadonlySet<string>;
  thirdPerson: ReadonlySet<string>;
  pasts: ReadonlySet<string>;
};

/** Past forms that are also a base form in their own right: did he found a company, did he fell a tree. */
const ALSO_BASE = words("found fell ground wound lay");

function verbFacts(input: EnglishGateData): VerbFacts {
  const bases = new Set<string>();
  const thirdPerson = new Set<string>();
  const pasts = new Set<string>();
  for (const l of input.lexicon) {
    const lemma = l.lemma.toLowerCase();
    if (l.partOfSpeech !== "verb" || lemma === "be" || MODAL_VERBS.has(lemma)) continue;
    const forms = input.irregular?.verbs[l.id]?.past.split(",").map((p) => p.trim()) ?? [englishPastRegular(lemma)];
    if (!forms.includes(lemma)) {
      bases.add(lemma);
      for (const f of forms) if (!ALSO_BASE.has(f)) pasts.add(f);
    }
    thirdPerson.add(englishThirdPerson(lemma));
  }
  return { bases, thirdPerson, pasts };
}

const AUXILIARIES = words("do does did don't doesn't didn't dont doesnt didnt will would can could should must may might shall won't wouldn't can't cannot couldn't shouldn't mustn't");
/** Before he/she the base form is right, or the rule cannot tell: plural subjects and the mandative subjunctive. */
const BASE_ALLOWED_AFTER = words("and or nor that suggest suggests suggested recommend recommends recommended insist insists insisted demand demands demanded");
/** `it` opens a clause in these too; "Let it go", "Make it work" do not. */
const CONNECTORS = words("because if when so but");

function verbAfter(tokens: Token[], i: number): number {
  if (!adjacent(tokens, i + 1)) return -1;
  if (FREQUENCY_ADVERBS.has(tokens[i + 1].lower)) return adjacent(tokens, i + 2) ? i + 2 : -1;
  return i + 1;
}

function thirdPersonProblems(tokens: Token[], verbs: VerbFacts): string[] {
  const out: string[] = [];
  tokens.forEach((t, i) => {
    if (!SUBJECTS_3S.has(t.lower) || t.word === t.word.toUpperCase()) return;
    const prev = i > 0 && !opensClause(tokens, i) ? tokens[i - 1].lower : null;
    if (prev !== null && (AUXILIARIES.has(prev) || BASE_ALLOWED_AFTER.has(prev))) return;
    if (t.lower === "it" && prev !== null && !CONNECTORS.has(prev)) return;
    const v = verbAfter(tokens, i);
    if (v < 0 || !verbs.bases.has(tokens[v].lower)) return;
    const after = adjacent(tokens, v + 1) ? tokens[v + 1].lower : null;
    if (after === "not" && (tokens[v].lower === "need" || tokens[v].lower === "do")) return;
    out.push(`third-person: "${t.word} ${tokens[v].word}" takes ${englishThirdPerson(tokens[v].lower)}`);
  });
  return out;
}

const NEGATIVE_PRESENT = words("don't doesn't dont doesnt");
const NEGATIVE_PAST = words("didn't didnt");

/** After a negative auxiliary, where the next word is the verb; -1 when it is a clause opener (the next word is its subject). */
function negatedVerb(tokens: Token[], i: number): number {
  const t = tokens[i];
  if (NEGATIVE_PRESENT.has(t.lower) || NEGATIVE_PAST.has(t.lower)) return opensQuestion(tokens, i) ? -1 : verbAfter(tokens, i);
  if ((t.lower === "do" || t.lower === "does" || t.lower === "did") && adjacent(tokens, i + 1) && tokens[i + 1].lower === "not") return opensQuestion(tokens, i) ? -1 : verbAfter(tokens, i + 1);
  return -1;
}

const opensQuestion = (tokens: Token[], i: number) => opensClause(tokens, i) || WH.has(tokens[i - 1].lower);

function isPastAux(lower: string): boolean {
  return lower === "did" || NEGATIVE_PAST.has(lower);
}

/** He don't, He do not, I doesn't, They does. */
function subjectAgreement(tokens: Token[], i: number): string | null {
  const t = tokens[i];
  if (!adjacent(tokens, i + 1)) return null;
  const next = tokens[i + 1].lower;
  const third = SUBJECTS_3S.has(t.lower) && t.word !== t.word.toUpperCase() && (t.lower !== "it" || opensClause(tokens, i));
  if (third && (next === "don't" || next === "dont" || (next === "do" && adjacent(tokens, i + 2) && tokens[i + 2].lower === "not"))) return `"${t.word} ${tokens[i + 1].word}" takes doesn't`;
  if (SUBJECTS_OTHER.has(t.lower) && (next === "does" || next === "doesn't" || next === "doesnt")) return `"${t.word} ${tokens[i + 1].word}" takes do`;
  return null;
}

/** Does you, What does they, Do he, Why don't she; "It does you good" and "What I do he does" are not questions. */
function invertedAgreement(tokens: Token[], i: number): string | null {
  const t = tokens[i];
  if (!adjacent(tokens, i + 1) || !opensQuestion(tokens, i)) return null;
  const subject = tokens[i + 1].lower;
  if ((t.lower === "does" || t.lower === "doesn't" || t.lower === "doesnt") && SUBJECTS_OTHER.has(subject)) return `"${t.word} ${tokens[i + 1].word}" takes do`;
  if ((t.lower === "do" || t.lower === "don't" || t.lower === "dont") && (subject === "he" || subject === "she")) return `"${t.word} ${tokens[i + 1].word}" takes does`;
  return null;
}

/** The verb stays in the base form after do, does, did: Does he goes, Did he went, He didn't went. */
function inflectedAfterAux(tokens: Token[], i: number, verbs: VerbFacts): string | null {
  const t = tokens[i];
  if (!AUXILIARIES.has(t.lower) || MODAL_VERBS.has(t.lower) || !/^(?:do|did)/.test(t.lower)) return null;
  const inverted = opensQuestion(tokens, i) && adjacent(tokens, i + 1) && (SUBJECTS_3S.has(tokens[i + 1].lower) || SUBJECTS_OTHER.has(tokens[i + 1].lower)) ? verbAfter(tokens, i + 1) : -1;
  const v = inverted >= 0 ? inverted : negatedVerb(tokens, i);
  if (v < 0) return null;
  const form = tokens[v].lower;
  if (verbs.thirdPerson.has(form) || (isPastAux(t.lower) && verbs.pasts.has(form))) return `"${t.word} … ${tokens[v].word}" takes the base form`;
  return null;
}

function doSupportProblems(tokens: Token[], verbs: VerbFacts): string[] {
  const out: string[] = [];
  tokens.forEach((_, i) => {
    for (const detail of [subjectAgreement(tokens, i), invertedAgreement(tokens, i), inflectedAfterAux(tokens, i, verbs)]) {
      if (detail !== null) out.push(`do-support: ${detail}`);
    }
  });
  return out;
}

// ---------------------------------------------------------------------------
// Very, object pronouns, countability
// ---------------------------------------------------------------------------

const VERY_BASE = words("like love want enjoy need hate");
const VERY_THIRD = words("likes loves wants enjoys needs hates");
const VERY_SUBJECTS = words("i you we they he she");

function veryProblems(tokens: Token[]): string[] {
  const out: string[] = [];
  tokens.forEach((t, i) => {
    if (t.lower !== "very" || !adjacent(tokens, i + 1)) return;
    const next = tokens[i + 1].lower;
    const subject = i > 0 && adjacent(tokens, i) && VERY_SUBJECTS.has(tokens[i - 1].lower);
    if (VERY_THIRD.has(next) || (subject && VERY_BASE.has(next))) out.push(`very-verb: "very ${tokens[i + 1].word}": use "${next} … very much"`);
  });
  return out;
}

const OBJECT_PRONOUNS = words("me him her them us");
const BE_FORMS = words("am is are was were");

function objectSubjectProblems(tokens: Token[]): string[] {
  const out: string[] = [];
  tokens.forEach((t, i) => {
    if (OBJECT_PRONOUNS.has(t.lower) && opensSentence(tokens, i) && adjacent(tokens, i + 1) && BE_FORMS.has(tokens[i + 1].lower)) out.push(`object-subject: "${t.word} ${tokens[i + 1].word}" needs a subject pronoun`);
  });
  return out;
}

/** Nouns Vietnamese learners count; not coffee or beer (a coffee is fine), not fruit, hair, paper (a fruit, a hair, a paper). */
const UNCOUNTABLE = words("water rice money milk bread information luggage meat salt sugar traffic weather music news advice furniture homework");
const WRONG_PLURALS = words("informations luggages advices furnitures homeworks");
/** "one water, please" is everyday ordering; "Channel two news" is a name. */
const COUNTING = words("two three four five six seven eight nine ten eleven twelve many several");
/** After the noun only these prove it is the head: "a water bottle" must stay quiet. */
const CLAUSE_WORDS = words("is are was were and or but please for in on at with from to of here there now today tomorrow yesterday every very too not");

function countabilityProblems(tokens: Token[]): string[] {
  const out: string[] = [];
  tokens.forEach((t, i) => {
    if (WRONG_PLURALS.has(t.lower)) out.push(`countability: "${t.word}" has no plural`);
    if (!adjacent(tokens, i + 1) || !UNCOUNTABLE.has(tokens[i + 1].lower)) return;
    const noun = tokens[i + 1];
    const article = t.word === "a" || t.word === "an" || ((t.word === "A" || t.word === "An") && opensSentence(tokens, i));
    if (!article && !(COUNTING.has(t.lower) && noun.lower !== "news")) return;
    const headOfPhrase = !adjacent(tokens, i + 2) || CLAUSE_WORDS.has(tokens[i + 2].lower);
    if (headOfPhrase) out.push(`countability: "${t.word} ${noun.word}": ${noun.lower} is uncountable`);
  });
  return out;
}

// ---------------------------------------------------------------------------
// Whole strings, whole packs
// ---------------------------------------------------------------------------

function describingWords(lexicon: Lexeme[]): Set<string> {
  return new Set(lexicon.filter((l) => l.partOfSpeech === "noun" || l.partOfSpeech === "adjective").map((l) => l.lemma.toLowerCase()));
}

function sentenceProblems(text: string, describing: ReadonlySet<string>, verbs: VerbFacts): string[] {
  const tokens = tokensOf(text);
  return [...articleProblems(tokens, describing), ...thirdPersonProblems(tokens, verbs), ...doSupportProblems(tokens, verbs), ...veryProblems(tokens), ...objectSubjectProblems(tokens), ...countabilityProblems(tokens)];
}

/** One free target-language string (a story sentence, a reading): every sentence rule, as `rule: detail`. */
export function targetTextErrors(text: string, input: EnglishGateData): string[] {
  return sentenceProblems(text, describingWords(input.lexicon), verbFacts(input)).map((p) => `${p} in "${text}"`);
}

/**
 * The English strings of an exercise. Only the keyed option is read (a wrong distractor may
 * teach a contrast), and a native-language side is never read: "an toàn" is not "an" + consonant.
 */
function targetStrings(e: Exercise): string[] {
  const x = e as Record<string, unknown>;
  const audio = typeof x.audioTarget === "string" ? [x.audioTarget] : [];
  const prompt = typeof x.prompt === "string" ? x.prompt : "";
  switch (e.type) {
    case "select":
      return [...audio, ...(e.mode === "targetToNative" ? [e.prompt] : [e.options[e.correct]?.text ?? ""])];
    case "wordBank":
      if (e.direction === "targetToNative") return [...audio, prompt];
      return [...audio, e.answer.join(" "), ...(e.alternatives ?? []).map((a) => a.join(" "))];
    case "typeAnswer":
      return e.mode === "translate" ? [...audio, prompt] : [...audio, e.answer, ...e.alternatives];
    case "fillBlank":
      return [...audio, e.sentence.replace("___", e.options[e.correct] ?? "")];
    case "articleSelect":
      return [`${e.articles[e.correct] ?? ""} ${e.noun}`];
    case "conjugationCloze":
      return [e.sentence.replace("___", e.answer)];
    case "dictation":
      return [e.answer, ...e.alternatives];
    case "speakRepetition":
    case "speakProduction":
      return [e.target, ...e.acceptedVariants];
    case "match":
      return e.pairs.map((p) => p.target);
    default:
      return [];
  }
}

function conceptProblems(pack: PackSource, conceptIds: readonly string[] | null): string[] {
  const shown = new Set(
    pack.sections.flatMap((s) => s.units.flatMap((u) => u.lessons)).flatMap((l) => ((l as { flow?: { concept?: string }[] }).flow ?? []).flatMap((f) => (f.concept === undefined ? [] : [f.concept])))
  );
  const known = new Set(conceptIds ?? []);
  return REQUIRED_CONCEPTS.flatMap((id) => {
    if (!known.has(id)) return [`concept-card: ${id} is missing from ${CONCEPTS_PATH}`];
    return shown.has(id) ? [] : [`concept-card: no lesson flow shows ${id}`];
  });
}

export function englishCourseErrors(pack: PackSource, input: EnglishGateData & { conceptIds: readonly string[] | null }): string[] {
  const describing = describingWords(input.lexicon);
  const verbs = verbFacts(input);
  const lessons = pack.sections.flatMap((s) => s.units.flatMap((u) => u.lessons));
  return [
    ...lessons.flatMap((l) => l.exercises.flatMap((e) => targetStrings(e).flatMap((text) => sentenceProblems(text, describing, verbs).map((p) => `${e.id} ${p} in "${text}"`)))),
    ...conceptProblems(pack, input.conceptIds),
  ].map((m) => {
    // `rule: detail`, with the exercise id moved after the rule.
    const at = m.indexOf(" ");
    return m.startsWith("concept-card") ? `${pack.id}: ${m}` : `${pack.id}: ${m.slice(at + 1).replace(": ", `: ${m.slice(0, at)} `)}`;
  });
}

const SLANG = words("gonna wanna gotta gimme dunno kinda ain't y'all");
const FORMAL_ADDRESS = words("sir madam ma'am");

type ScenarioNode = { kind: string; text?: string; rephraseText?: string; expected?: { acceptedVariants?: string[] }[] };

/** The lines of a scenario a learner sees or says. */
export function scenarioLines(s: { nodes: Record<string, ScenarioNode> }): string[] {
  return Object.values(s.nodes).flatMap((n) => [...(n.text !== undefined ? [n.text] : []), ...(n.rephraseText !== undefined ? [n.rephraseText] : []), ...(n.expected ?? []).flatMap((x) => x.acceptedVariants ?? [])]);
}

/** scenario-register: English has no tu/Lei, so only the clash a learner could copy is an error. */
export function scenarioRegisterErrors(scenarios: { id: string; nodes: Record<string, ScenarioNode> }[]): string[] {
  return scenarios.flatMap((s) => {
    const lines = scenarioLines(s);
    const has = (set: ReadonlySet<string>) => lines.find((l) => tokensOf(l).some((t) => set.has(t.lower)));
    const slang = has(SLANG);
    const formal = has(FORMAL_ADDRESS);
    return slang !== undefined && formal !== undefined ? [`scenario-register: ${s.id} mixes slang ("${slang}") and formal address ("${formal}")`] : [];
  });
}

/** Load the data files the gates read (absent = empty: the course has not reached that step). */
export function loadEnglishGateData(): { irregular: EnglishGateData["irregular"]; conceptIds: string[] | null } {
  const irregular = existsSync(safeResolve(IRREGULAR_PATH)) ? (readJson(IRREGULAR_PATH) as NonNullable<EnglishGateData["irregular"]>) : null;
  const conceptIds = existsSync(safeResolve(CONCEPTS_PATH)) ? (readJson(CONCEPTS_PATH) as { concepts: { id: string }[] }).concepts.map((c) => c.id) : null;
  return { irregular, conceptIds };
}
