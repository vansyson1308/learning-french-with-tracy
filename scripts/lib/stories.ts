/**
 * Graded stories (P5b): comprehensible input built from the learner's own
 * lexicon. Loader, tokenizer, lexical resolver, validator and compiled
 * artifacts for `content/<lang>/stories/stories.json`.
 *
 * Every word token of a story resolves — to a lexeme of the target's
 * lexicon (directly, through the committed verb morphology, or through a
 * plural/gender ending), to a closed-class function word, to a declared
 * name, or to an explicit `tokenMap` entry. Nothing is guessed silently: an
 * unresolved token is a validation error.
 *
 * Grading: lexemes take a band from their position in the target's syllabus
 * (first / second half of its level, `lexemeBands`). A story of band X may
 * use function words, names, numbers and lexemes of band ≤ X; anything else
 * must be one of its 3–5 declared new lexemes, and the new-word tokens may
 * be at most 5 % of the text (≥ 95 % known at band).
 *
 * Audio: each sentence is one deterministic reception asset (same key
 * derivation and generation workflow as listening clips, clip id
 * `<storyId>#<n>`), so per-sentence offsets come straight from the
 * generated durations.
 */

import { existsSync, readdirSync } from "fs";

import {
  STORY_BANDS,
  storiesSchema,
  type NativeText,
  type RichLexicon,
  type Stories,
  type StoryBand,
  type StorySource,
  type Syllabus,
} from "../../content/schema";
import { assetFileName, codecFor, codecRecipe, type AudioCodec, type CodecSettings } from "./audio-codec";
import { buildPlugin } from "./languages";
import { pickNative } from "./native-text";
import { canonicalJson, readJson, safeResolve, type ValidationResult } from "./pipeline";
import { receptionAssetKey, receptionAssetsDir, receptionPipelineVersion } from "./reception";

export const STORY_MIN_TOKENS = 150;
export const STORY_MAX_TOKENS = 400;
export const MICRO_STORY_MIN_TOKENS = 50;
export const MICRO_STORY_MAX_TOKENS = 100;
export const STORY_MIN_COVERAGE = 0.95;
/** Same single-clip cap as a teaching listening clip (P7 §58). */
export const STORY_SENTENCE_MAX_CHARS = 220;

export function storiesSourcePath(lang: string): string {
  return `content/${lang}/stories/stories.json`;
}

export function loadStories(lang: string): Stories | null {
  const rel = storiesSourcePath(lang);
  if (!existsSync(safeResolve(rel))) return null;
  const doc = storiesSchema(lang).parse(readJson(rel));
  if (doc.language !== lang) throw new Error(`${rel}: language "${doc.language}" ≠ folder "${lang}"`);
  return doc;
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

/** A piece of a sentence; the pieces concatenate to the sentence exactly. */
export type StoryPiece = { text: string; word: boolean };

const APOSTROPHE = /['’]/;

/**
 * Word segmentation (Intl.Segmenter, word granularity). An elided word is
 * split after its apostrophe — "l'homme" → "l'" + "homme", "s'il" → "s'" +
 * "il" — so the clitic resolves as a function word and the rest on its own.
 */
export function segmentSentence(lang: string, text: string): StoryPiece[] {
  const out: StoryPiece[] = [];
  const segmenter = new Intl.Segmenter(lang, { granularity: "word" });
  for (const seg of segmenter.segment(text)) {
    // A bare number is never a word token. ICU builds disagree on its
    // isWordLike (Linux: false, Windows: true); pinned so every platform
    // compiles the committed artifacts byte for byte.
    if (!seg.isWordLike || /^\p{N}+$/u.test(seg.segment)) {
      out.push({ text: seg.segment, word: false });
      continue;
    }
    let rest = seg.segment;
    let m = APOSTROPHE.exec(rest);
    while (m && m.index < rest.length - 1) {
      out.push({ text: rest.slice(0, m.index + 1), word: true });
      rest = rest.slice(m.index + 1);
      m = APOSTROPHE.exec(rest);
    }
    out.push({ text: rest, word: true });
  }
  return out;
}

/** Lower case, typographic apostrophe folded to ASCII. */
export function tokenKey(token: string): string {
  return token.toLowerCase().replace(/’/g, "'");
}

// ---------------------------------------------------------------------------
// Lexical resolver
// ---------------------------------------------------------------------------

type Morphology = { verbs: { lemma: string; rows: { mot: string }[] }[] };

/** The committed verb-form evidence of a language, when it has any. */
export function loadVerbForms(lang: string): Morphology | null {
  for (const rel of [`content/${lang}/lexicon/derived/morphology.json`, `content/${lang}/lexicon/derived/verb-morphology.json`]) {
    if (existsSync(safeResolve(rel))) return readJson(rel) as Morphology;
  }
  return null;
}

export type LexemeIndex = {
  /** One-word forms → lexeme id. */
  single: Map<string, string>;
  /** Multi-word lexemes as token sequences, longest first. */
  multi: { tokens: string[]; id: string }[];
  /** Lexeme id → part of speech (gates the plural/gender endings). */
  pos: Map<string, string>;
};

function keysOf(lang: string, form: string): string[] {
  return segmentSentence(lang, form).filter((p) => p.word).map((p) => tokenKey(p.text));
}

/**
 * Form → lexeme index. A form claimed by several lexemes resolves to a
 * lemma/lookup form before a conjugated form ("río" the river, not "río"
 * of `reír`), then a syllabus lexeme before one beyond it, the lower band
 * first, then lexicon order. A homograph the other way round ("son" of
 * `ser`, not the noun) is mapped once in the file-level tokenMap.
 */
export function buildLexemeIndex(
  lang: string,
  lexicon: RichLexicon,
  morphology: Morphology | null,
  bands: ReadonlyMap<string, StoryBand> = new Map()
): LexemeIndex {
  const candidates = new Map<string, { id: string; rank: number[] }[]>();
  const multi: { tokens: string[]; id: string }[] = [];
  const pos = new Map<string, string>();
  const byLemma = new Map<string, string>();
  const rankOf = (id: string, conjugated: number, order: number) => {
    const band = bands.get(id);
    return [conjugated, band === undefined ? 1 : 0, band === undefined ? 0 : bandRank(band), order];
  };
  const offer = (key: string, id: string, rank: number[]) => candidates.set(key, [...(candidates.get(key) ?? []), { id, rank }]);
  lexicon.lexemes.forEach((lex, order) => {
    pos.set(lex.id, lex.partOfSpeech);
    for (const form of new Set([lex.lookupForm, lex.lemma])) {
      const tokens = keysOf(lang, form);
      if (tokens.length === 1) offer(tokens[0], lex.id, rankOf(lex.id, 0, order));
      else if (tokens.length > 1) multi.push({ tokens, id: lex.id });
    }
    if (lex.partOfSpeech === "verb" && !byLemma.has(tokenKey(lex.lemma))) byLemma.set(tokenKey(lex.lemma), lex.id);
  });
  // Conjugated forms from the committed morphology evidence.
  (morphology?.verbs ?? []).forEach((verb, order) => {
    const id = byLemma.get(tokenKey(verb.lemma));
    if (!id) return;
    for (const row of verb.rows) offer(tokenKey(row.mot), id, rankOf(id, 1, order));
  });
  const single = new Map<string, string>();
  const before = (a: number[], b: number[]) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
    return false;
  };
  for (const [key, list] of candidates) {
    let best = list[0];
    for (const c of list) if (before(c.rank, best.rank)) best = c;
    single.set(key, best.id);
  }
  multi.sort((a, b) => b.tokens.length - a.tokens.length);
  return { single, multi, pos };
}

const bandRank = (b: StoryBand) => STORY_BANDS.indexOf(b);

/** Plural and gender endings tried on nouns/adjectives (Romance languages). */
const ENDINGS: readonly (readonly [RegExp, string])[] = [
  [/ones$/, "ón"],
  [/es$/, ""],
  [/s$/, ""],
  [/x$/, ""],
  [/as$/, "o"],
  [/a$/, "o"],
  [/es$/, "e"],
  [/e$/, ""],
];
const INFLECTING = new Set(["noun", "adjective", "determiner", "pronoun", "numeral"]);

export type Resolution =
  | { kind: "lexeme"; lexemeId: string }
  | { kind: "function" | "name" | "number" }
  | { kind: "unresolved" };

export function resolveToken(
  key: string,
  ctx: {
    index: LexemeIndex;
    functionWords: ReadonlySet<string>;
    tokenMap: Record<string, string>;
    /** The language's own endings (build plugin `storyEndings`); default: the Romance list. */
    endings?: readonly (readonly [RegExp, string])[];
  }
): Resolution {
  const mapped = ctx.tokenMap[key];
  if (mapped === "function" || mapped === "name") return { kind: mapped };
  if (mapped !== undefined) return { kind: "lexeme", lexemeId: mapped };
  if (ctx.functionWords.has(key)) return { kind: "function" };
  if (/^\d+([.,]\d+)?$/.test(key)) return { kind: "number" };
  const direct = ctx.index.single.get(key);
  if (direct) return { kind: "lexeme", lexemeId: direct };
  for (const [re, rep] of ctx.endings ?? ENDINGS) {
    if (!re.test(key)) continue;
    const id = ctx.index.single.get(key.replace(re, rep));
    if (id && INFLECTING.has(ctx.index.pos.get(id) ?? "")) return { kind: "lexeme", lexemeId: id };
  }
  return { kind: "unresolved" };
}

// ---------------------------------------------------------------------------
// Bands and analysis
// ---------------------------------------------------------------------------

/**
 * Syllabus position → band: first half of the level's entries is `<L>-1`, the rest `<L>-2`.
 * QC 2026-10-29 §1.2: a target may also commit the next band's list (`later`,
 * e.g. syllabus-a2-1.json, level "A2-1"); its entries all take that band.
 */
export function lexemeBands(
  syllabus: Pick<Syllabus, "level" | "entries">,
  later?: Pick<Syllabus, "level" | "entries"> | null,
  micro: ReadonlySet<string> = new Set()
): Map<string, StoryBand> {
  const bands = new Map<string, StoryBand>();
  // QC 2026-10-30 §2.2: the words of the course's first units are band A1-0.
  for (const id of micro) bands.set(id, "A1-0");
  const level = syllabus.level.toUpperCase();
  const half = Math.ceil(syllabus.entries.length / 2);
  syllabus.entries.forEach((e, i) => {
    const band = `${level}-${i < half ? 1 : 2}`;
    if (!bands.has(e.lexemeId) && (STORY_BANDS as readonly string[]).includes(band)) bands.set(e.lexemeId, band as StoryBand);
  });
  const laterBand = later?.level.toUpperCase();
  if (later && laterBand && (STORY_BANDS as readonly string[]).includes(laterBand)) {
    for (const e of later.entries) if (!bands.has(e.lexemeId)) bands.set(e.lexemeId, laterBand as StoryBand);
  }
  return bands;
}

/** Micro-stories draw on the primary course's first units only. */
export const MICRO_STORY_UNITS = 3;

/**
 * Closed-class lexemes: a language whose lexicon models pronouns, articles,
 * prepositions and conjunctions as lexemes (German) treats them as other
 * languages treat their `functionWords` — always allowed.
 */
const CLOSED_CLASS = new Set(["pronoun", "determiner", "preposition", "conjunction"]);

/**
 * Band A1-0 (QC 2026-10-30 §2.2): the lexemes the primary course teaches in
 * its first `MICRO_STORY_UNITS` units — what a learner of the first days has
 * actually met (the syllabus file alone cannot tell: unplaced frequency words
 * fall back to unit 1) — plus the closed-class lexemes.
 */
export function microBandLexemes(
  lexicon: Pick<RichLexicon, "lexemes">,
  pack: { sections: { units: { words: { target: string }[] }[] }[] } | null | undefined,
  /** The target's frozen surface → id map: the lexeme a pack word IS (a surface can name two lexemes). */
  idMap?: Readonly<Record<string, string>>
): Set<string> {
  if (!pack) return new Set();
  const taught = pack.sections.flatMap((s) => s.units).slice(0, MICRO_STORY_UNITS).flatMap((u) => u.words.map((w) => w.target));
  // A taught surface counts for every lexeme it spells ("Hallo": the pack's id and the syllabus interjection).
  const keys = new Set(taught.map((t) => t.toLocaleLowerCase()));
  const mapped = new Set(taught.map((t) => idMap?.[t]).filter((id): id is string => id !== undefined));
  return new Set(
    lexicon.lexemes
      .filter((l) => !l.variety && (CLOSED_CLASS.has(l.partOfSpeech) || mapped.has(l.id) || keys.has(l.surface.toLocaleLowerCase())))
      .map((l) => l.id)
  );
}

/** Word-token range of a story: micro-stories are short (QC 2026-10-30 §2.2). */
export function storyTokenRange(band: StoryBand): { min: number; max: number } {
  return band === "A1-0" ? { min: MICRO_STORY_MIN_TOKENS, max: MICRO_STORY_MAX_TOKENS } : { min: STORY_MIN_TOKENS, max: STORY_MAX_TOKENS };
}

export type AnalyzedPiece = { text: string; lexemeId?: string };
export type StoryAnalysis = {
  id: string;
  band: StoryBand;
  tokens: number;
  unknownTokens: number;
  coverage: number;
  /** Distinct lexemes of the story in first-use order. */
  lexemes: string[];
  /** Lexemes beyond the band that are NOT declared new (validation errors). */
  undeclared: string[];
  unresolved: string[];
  sentences: AnalyzedPiece[][];
};

export function analyzeStory(
  lang: string,
  story: StorySource,
  ctx: {
    index: LexemeIndex;
    functionWords: ReadonlySet<string>;
    bands: Map<string, StoryBand>;
    tokenMap?: Record<string, string>;
    endings?: readonly (readonly [RegExp, string])[];
  }
): StoryAnalysis {
  const tokenMap = Object.fromEntries(
    Object.entries({ ...(ctx.tokenMap ?? {}), ...(story.tokenMap ?? {}) }).map(([k, v]) => [tokenKey(k), v])
  );
  const newSet = new Set(story.newLexemes);
  const lexemes: string[] = [];
  const undeclared = new Set<string>();
  const unresolved = new Set<string>();
  let tokens = 0;
  let unknownTokens = 0;
  const count = (id: string) => {
    if (!lexemes.includes(id)) lexemes.push(id);
    const band = ctx.bands.get(id);
    const known = !newSet.has(id) && band !== undefined && bandRank(band) <= bandRank(story.band);
    if (!known) {
      unknownTokens += 1;
      if (!newSet.has(id)) undeclared.add(id);
    }
  };
  const sentences = story.sentences.map((sentence) => {
    const pieces = segmentSentence(lang, sentence.text);
    const out: AnalyzedPiece[] = [];
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      if (!piece.word) {
        out.push({ text: piece.text });
        continue;
      }
      // Multi-word lexemes first (greedy, longest), spanning the gaps between words.
      const multi = matchMulti(pieces, i, ctx.index);
      if (multi) {
        tokens += multi.words;
        for (let w = 0; w < multi.words; w++) count(multi.id);
        out.push({ text: pieces.slice(i, multi.end + 1).map((p) => p.text).join(""), lexemeId: multi.id });
        i = multi.end;
        continue;
      }
      tokens += 1;
      const key = tokenKey(piece.text);
      const r = resolveToken(key, { index: ctx.index, functionWords: ctx.functionWords, tokenMap, endings: ctx.endings });
      if (r.kind === "lexeme") {
        count(r.lexemeId);
        out.push({ text: piece.text, lexemeId: r.lexemeId });
      } else {
        if (r.kind === "unresolved") {
          unresolved.add(key);
          unknownTokens += 1;
        }
        out.push({ text: piece.text });
      }
    }
    return mergePlain(out);
  });
  return {
    id: story.id,
    band: story.band,
    tokens,
    unknownTokens,
    coverage: tokens === 0 ? 0 : (tokens - unknownTokens) / tokens,
    lexemes,
    undeclared: [...undeclared].sort(),
    unresolved: [...unresolved].sort(),
    sentences,
  };
}

function matchMulti(pieces: StoryPiece[], start: number, index: LexemeIndex): { id: string; end: number; words: number } | null {
  for (const m of index.multi) {
    let p = start;
    let ok = true;
    let end = start;
    for (let t = 0; t < m.tokens.length; t++) {
      while (p < pieces.length && !pieces[p].word && t > 0) {
        if (pieces[p].text.trim() !== "") {
          ok = false;
          break;
        }
        p++;
      }
      if (!ok || p >= pieces.length || !pieces[p].word || tokenKey(pieces[p].text) !== m.tokens[t]) {
        ok = false;
        break;
      }
      end = p;
      p++;
    }
    if (ok) return { id: m.id, end, words: m.tokens.length };
  }
  return null;
}

/** Adjacent pieces without a lexeme are merged (smaller artifact, same text). */
function mergePlain(pieces: AnalyzedPiece[]): AnalyzedPiece[] {
  const out: AnalyzedPiece[] = [];
  for (const p of pieces) {
    const last = out[out.length - 1];
    if (last && last.lexemeId === undefined && p.lexemeId === undefined) last.text += p.text;
    else out.push({ ...p });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Audio identity
// ---------------------------------------------------------------------------

export function storyClipId(storyId: string, sentenceIndex: number): string {
  return `${storyId}#${sentenceIndex + 1}`;
}

export function storySentenceSegments(stories: Stories, sentence: StorySource["sentences"][number]) {
  const cast = stories.voiceCast[sentence.speaker];
  return [{ voiceId: cast.voiceId, speaker: cast.speaker, text: sentence.text }];
}

/**
 * Pipeline version of a language's story sentences: the voice manifest's
 * `storyPipelineVersion` when it sets one (Spanish: 4 = 24 kbps speech, so
 * 460 sentences fit the 12 MB per-language budget), else the reception one
 * (French: 1, frozen).
 */
export function storyPipelineVersion(lang: string): number {
  const rel = `content/${lang}/reception/audio-source-manifest.json`;
  if (!existsSync(safeResolve(rel))) return receptionPipelineVersion(lang);
  const v = (readJson(rel) as { storyPipelineVersion?: unknown }).storyPipelineVersion;
  return typeof v === "number" ? v : receptionPipelineVersion(lang);
}

/**
 * The codec of a language's story sentences: content/audio/engines.json
 * `encoding.codecByLayer.story` (opus since CI proved Opus playback on
 * API 30, API 34 and web, release/ASSET_DELIVERY.md); French is always mp3.
 */
export function storyCodec(lang: string): AudioCodec {
  return codecFor(storyEncoding(), "story", lang);
}

function storyEncoding(): CodecSettings | undefined {
  return (readJson("content/audio/engines.json") as { encoding?: CodecSettings }).encoding;
}

/** An mp3 story sentence keeps its key; an opus one carries the codec in its key. */
export function storySentenceAssetKey(lang: string, stories: Stories, sentence: StorySource["sentences"][number], codec: AudioCodec = storyCodec(lang)): string {
  return receptionAssetKey(lang, storySentenceSegments(stories, sentence), storyPipelineVersion(lang), codecRecipe(codec, storyEncoding()));
}

/** `<key>.mp3` or `<key>.opus`, by the story codec. */
export function storySentenceFile(lang: string, stories: Stories, sentence: StorySource["sentences"][number], codec: AudioCodec = storyCodec(lang)): string {
  return assetFileName(storySentenceAssetKey(lang, stories, sentence, codec), codec);
}

// ---------------------------------------------------------------------------
// Which stories bundle their sentence audio (QC 2026-10-29b §2.3)
// ---------------------------------------------------------------------------

/**
 * At most this many stories per course bundle sentence audio: the band-1
 * stories, the first of the reading order after the micro-stories. 12 at
 * MP3 24 kbps; 18 since story audio is Opus 16 kbps (about the same bytes,
 * release/ASSET_DELIVERY.md). Every other story is read with the device voice.
 */
export const STORY_AUDIO_MAX_BUNDLED = 18;

/**
 * The `storyAudio` field of content/<lang>/reception/audio-source-manifest.json:
 *  - absent: every story bundles its audio (legacy);
 *  - `{ bundled: false, reason }`: none does;
 *  - `{ bundled: "band-1", stories: [ids], reason }`: the listed stories do.
 */
export type StoryAudioPolicy =
  | { kind: "all" }
  | { kind: "none"; reason: string }
  | { kind: "band-1"; stories: string[]; reason: string };

export function parseStoryAudio(raw: unknown): StoryAudioPolicy {
  if (raw === undefined || raw === null) return { kind: "all" };
  const r = raw as { bundled?: unknown; stories?: unknown; reason?: unknown };
  const reason = typeof r.reason === "string" ? r.reason : "";
  if (r.bundled === false) return { kind: "none", reason };
  if (r.bundled === "band-1") return { kind: "band-1", stories: Array.isArray(r.stories) ? r.stories.filter((x): x is string => typeof x === "string") : [], reason };
  throw new Error(`storyAudio.bundled must be false or "band-1" (got ${JSON.stringify(r.bundled)})`);
}

export function storyAudioPolicy(lang: string): StoryAudioPolicy {
  const rel = `content/${lang}/reception/audio-source-manifest.json`;
  if (!existsSync(safeResolve(rel))) return { kind: "all" };
  return parseStoryAudio((readJson(rel) as { storyAudio?: unknown }).storyAudio);
}

/** Reading order: band, then authored order (the compiled `order`). */
export function storyReadingOrder(stories: Pick<Stories, "stories">): string[] {
  return [...stories.stories]
    .map((s, i) => ({ id: s.id, rank: bandRank(s.band), i }))
    .sort((x, y) => x.rank - y.rank || x.i - y.i)
    .map((x) => x.id);
}

/** The reading order the band-1 audio list follows: micro-stories (A1-0) are read with the device voice and come before it. */
export function bandOneOrder(stories: Pick<Stories, "stories">): string[] {
  const micro = new Set(stories.stories.filter((s) => s.band === "A1-0").map((s) => s.id));
  return storyReadingOrder(stories).filter((id) => !micro.has(id));
}

/** Ids of the stories whose sentence audio is bundled. */
export function bundledStoryIds(stories: Pick<Stories, "stories">, policy: StoryAudioPolicy): Set<string> {
  if (policy.kind === "all") return new Set(stories.stories.map((s) => s.id));
  if (policy.kind === "none") return new Set();
  const known = new Set(stories.stories.map((s) => s.id));
  return new Set(policy.stories.filter((id) => known.has(id)));
}

/** Declaration problems (pure; tested): unknown or repeated ids, over the cap, not the start of the reading order. */
export function storyAudioProblems(stories: Pick<Stories, "stories">, policy: StoryAudioPolicy): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (policy.kind !== "band-1") return { errors, warnings };
  const known = new Set(stories.stories.map((s) => s.id));
  if (!policy.reason.trim()) errors.push("storyAudio: a reason is required");
  if (policy.stories.length === 0) errors.push('storyAudio: "band-1" lists no story');
  if (new Set(policy.stories).size !== policy.stories.length) errors.push("storyAudio: a story is listed twice");
  for (const id of policy.stories) if (!known.has(id)) errors.push(`storyAudio: ${id} is not a story of this language`);
  if (policy.stories.length > STORY_AUDIO_MAX_BUNDLED) errors.push(`storyAudio: ${policy.stories.length} stories listed; band-1 bundles at most ${STORY_AUDIO_MAX_BUNDLED} (release/ASSET_DELIVERY.md)`);
  const head = bandOneOrder(stories).slice(0, policy.stories.length);
  const listed = new Set(policy.stories);
  const outside = head.filter((id) => !listed.has(id));
  if (outside.length > 0) warnings.push(`storyAudio: the band-1 list is not the start of the reading order (${outside.slice(0, 3).join(", ")} comes earlier and has no bundled audio) — update the list and re-run the audio workflow`);
  return { errors, warnings };
}

/** Every asset file name the BUNDLED stories of a language reference (`<key>.mp3`, or `.opus` by the story codec). */
export function storyAssetFiles(lang: string, stories: Stories | null, policy: StoryAudioPolicy = storyAudioPolicy(lang), codec: AudioCodec = storyCodec(lang)): Set<string> {
  const out = new Set<string>();
  if (!stories) return out;
  const bundled = bundledStoryIds(stories, policy);
  for (const story of stories.stories) {
    if (!bundled.has(story.id)) continue;
    for (const s of story.sentences) out.add(storySentenceFile(lang, stories, s, codec));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const CEFR_TEXT = /\b(CEFR|[ABC][12](?:[-.]\d)?)\b/;

export function validateStories(input: {
  lang: string;
  stories: Stories;
  lexicon: RichLexicon;
  syllabus: Pick<Syllabus, "level" | "entries"> | null;
  /** The next band's committed list (lexicon/syllabus-a2-1.json), if any. */
  laterSyllabus?: Pick<Syllabus, "level" | "entries"> | null;
  nativeCodes: readonly string[];
  /** Voice ids of content/<lang>/reception/audio-source-manifest.json (null: no manifest). */
  receptionVoices: ReadonlySet<string> | null;
  /** Which stories bundle audio (default: the voice manifest's `storyAudio`). */
  storyAudio?: StoryAudioPolicy;
  /** Band A1-0 vocabulary (`microBandLexemes` of the primary course). */
  microLexemes?: ReadonlySet<string>;
}): ValidationResult & { analyses: StoryAnalysis[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { lang, stories } = input;
  const err = (m: string) => errors.push(`stories (${lang}): ${m}`);
  const lexemeIds = new Set(input.lexicon.lexemes.map((l) => l.id));
  const glossOf = new Map(input.lexicon.lexemes.map((l) => [l.id, l.glosses as Record<string, string | undefined>]));
  const functionWords = new Set(stories.functionWords.map(tokenKey));
  const micro = input.microLexemes ?? new Set<string>();
  const bands = input.syllabus ? lexemeBands(input.syllabus, input.laterSyllabus, micro) : new Map<string, StoryBand>();
  // Token resolution ignores band A1-0: a micro band must never re-resolve the
  // words of existing stories ("Hallo" stays the interjection the syllabus places).
  const resolutionBands = input.syllabus ? lexemeBands(input.syllabus, input.laterSyllabus) : bands;
  const index = buildLexemeIndex(lang, input.lexicon, loadVerbForms(lang), resolutionBands);
  if (!input.syllabus) err("the target has no syllabus — stories are graded by syllabus band");

  for (const [speaker, cast] of Object.entries(stories.voiceCast)) {
    if (input.receptionVoices && !input.receptionVoices.has(cast.voiceId)) err(`voiceCast.${speaker} uses ${cast.voiceId}, not a voice of the reception manifest`);
  }
  const voiceOf = (s: "N" | "A" | "B") => `${stories.voiceCast[s].voiceId}|${stories.voiceCast[s].speaker}`;

  const native = (where: string, text: NativeText) => {
    for (const code of input.nativeCodes) if (!text[code]?.trim()) err(`${where}: missing ${code} text`);
    for (const value of Object.values(text)) if (CEFR_TEXT.test(value)) err(`${where}: no CEFR/level labels in learner-facing story text ("${value}")`);
  };

  const seen = new Set<string>();
  const analyses: StoryAnalysis[] = [];
  for (const story of stories.stories) {
    if (seen.has(story.id)) err(`duplicate story id ${story.id}`);
    seen.add(story.id);
    if (CEFR_TEXT.test(story.title)) err(`${story.id}: no CEFR/level labels in the title`);
    native(`${story.id}.blurb`, story.blurb);
    story.sentences.forEach((s, i) => {
      if (/[\t\n\r]/.test(s.text)) err(`${story.id}#${i + 1}: sentence text must be single-line`);
      if (s.text.length > STORY_SENTENCE_MAX_CHARS) err(`${story.id}#${i + 1}: ${s.text.length} chars exceeds the ${STORY_SENTENCE_MAX_CHARS}-char sentence cap`);
      native(`${story.id}#${i + 1}.translation`, s.translation);
    });
    if (story.sentences.some((s) => s.speaker !== "N") && voiceOf("A") === voiceOf("B")) {
      err(`${story.id}: a story with dialogue needs two distinct voices (voiceCast A ≠ B)`);
    }
    story.questions.forEach((q, i) => {
      native(`${story.id}.questions[${i}].prompt`, q.prompt);
      q.options.forEach((o, j) => native(`${story.id}.questions[${i}].options[${j}]`, o));
      if (q.answer >= q.options.length) err(`${story.id}.questions[${i}]: answer ${q.answer} has no option`);
    });
    if (!story.questions.some((q) => q.kind === "infer")) err(`${story.id}: at least one question must ask for an inference`);
    if (new Set(story.newLexemes).size !== story.newLexemes.length) err(`${story.id}: newLexemes repeats a lexeme`);
    for (const id of story.newLexemes) {
      if (!lexemeIds.has(id)) err(`${story.id}: new lexeme ${id} is not in the lexicon`);
      for (const code of input.nativeCodes) if (!glossOf.get(id)?.[code]) err(`${story.id}: new lexeme ${id} has no ${code} gloss (the word check shows it)`);
    }
    for (const [surface, target] of Object.entries({ ...(stories.tokenMap ?? {}), ...(story.tokenMap ?? {}) })) {
      if (target !== "function" && target !== "name" && !lexemeIds.has(target)) err(`${story.id}: tokenMap "${surface}" → unknown lexeme ${target}`);
    }

    const a = analyzeStory(lang, story, { index, functionWords, bands, tokenMap: stories.tokenMap, endings: buildPlugin(lang).storyEndings });
    analyses.push(a);
    const range = storyTokenRange(story.band);
    if (a.tokens < range.min || a.tokens > range.max) err(`${story.id}: ${a.tokens} word tokens (band ${story.band} stories are ${range.min}–${range.max})`);
    if (story.band === "A1-0" && micro.size === 0) err(`${story.id}: band A1-0 needs the primary course's unit 1–${MICRO_STORY_UNITS} vocabulary`);
    if (a.unresolved.length > 0) err(`${story.id}: unresolved tokens ${a.unresolved.slice(0, 12).join(", ")}${a.unresolved.length > 12 ? " …" : ""} — use lexicon words, or map them in tokenMap`);
    if (a.undeclared.length > 0) err(`${story.id}: ${a.undeclared.join(", ")} beyond band ${story.band} — declare as new (3–5) or replace`);
    for (const id of story.newLexemes) if (!a.lexemes.includes(id)) err(`${story.id}: new lexeme ${id} never occurs in the text`);
    if (a.coverage < STORY_MIN_COVERAGE) err(`${story.id}: ${(a.coverage * 100).toFixed(1)} % known at band ${story.band} (≥ ${STORY_MIN_COVERAGE * 100} %; ${a.unknownTokens} of ${a.tokens} tokens new or unresolved)`);
  }

  // Bundled audio (QC 2026-10-29b §2.3: band-1 stories only; the others are
  // read with the device voice and need no asset): once a generation run has
  // produced story sentences, every sentence of a bundled story must resolve
  // to its committed asset; before that, text-only.
  const policy = input.storyAudio ?? storyAudioPolicy(lang);
  const declared = storyAudioProblems(stories, policy);
  for (const e of declared.errors) err(e);
  for (const w of declared.warnings) warnings.push(`stories (${lang}): ${w}`);
  const planRel = `content/${lang}/reception/generated-plan.json`;
  const generated = existsSync(safeResolve(planRel))
    ? ((readJson(planRel) as { clips?: { clipId: string }[] }).clips ?? []).some((c) => c.clipId.includes(".story."))
    : false;
  const dirAbs = safeResolve(receptionAssetsDir(lang));
  const files = existsSync(dirAbs) ? new Set(readdirSync(dirAbs)) : new Set<string>();
  const missing = [...storyAssetFiles(lang, stories, policy)].filter((f) => !files.has(f));
  if (missing.length > 0) {
    if (generated) err(`${missing.length} story sentence assets missing (e.g. ${missing[0]}) — re-run the audio generate workflow (layer reception)`);
    else warnings.push(`stories (${lang}): ${missing.length} sentences have no generated audio yet (bootstrap — dispatch the audio workflow, layer reception)`);
  }
  return { errors, warnings, analyses };
}

// ---------------------------------------------------------------------------
// Compiled artifacts
// ---------------------------------------------------------------------------

/**
 * Per-story audio mode of the compiled artifact (QC 2026-10-29b §2.3), read
 * by the reader: "bundled" when the story is declared band-1 AND every
 * sentence's asset is committed; otherwise "device-voice" (the reader uses
 * expo-speech, labelled "Giọng đọc của máy", or text only without a voice).
 */
export type StoryAudioMode = "bundled" | "device-voice";

export function storyAudioMode(lang: string, stories: Stories, storyId: string, bundled: ReadonlySet<string>, hasAsset: (file: string) => boolean, codec: AudioCodec = storyCodec(lang)): StoryAudioMode {
  const story = stories.stories.find((s) => s.id === storyId);
  if (!story || !bundled.has(storyId) || story.sentences.length === 0) return "device-voice";
  return story.sentences.every((s) => hasAsset(storySentenceFile(lang, stories, s, codec))) ? "bundled" : "device-voice";
}

const committedStoryAsset = (lang: string) => (file: string) => existsSync(safeResolve(receptionAssetsDir(lang), file));

export function compileStoriesArtifact(input: {
  stories: Stories;
  analyses: StoryAnalysis[];
  nativeCode: string;
  durations: Map<string, number>;
  /** Which stories bundle audio (default: the voice manifest's `storyAudio`). */
  storyAudio?: StoryAudioPolicy;
  /** Whether a story asset is committed (default: the file exists under assets/audio/<lang>-reception). */
  hasAsset?: (file: string) => boolean;
}): string {
  const { stories } = input;
  const lang = stories.language;
  const analysisOf = new Map(input.analyses.map((a) => [a.id, a]));
  const bundled = bundledStoryIds(stories, input.storyAudio ?? storyAudioPolicy(lang));
  const hasAsset = input.hasAsset ?? committedStoryAsset(lang);
  const byId: Record<string, unknown> = {};
  for (const story of stories.stories) {
    const a = analysisOf.get(story.id)!;
    let at = 0;
    let timed = true;
    const sentences = story.sentences.map((s, i) => {
      const durationSec = input.durations.get(storyClipId(story.id, i)) ?? null;
      // A start is known while every earlier sentence's duration is.
      const startSec = timed ? Number(at.toFixed(3)) : null;
      if (durationSec === null) timed = false;
      else at += durationSec;
      return {
        speaker: s.speaker,
        text: s.text,
        translation: pickNative(s.translation, input.nativeCode, `${story.id}#${i + 1}.translation`),
        pieces: a.sentences[i].map((p) => (p.lexemeId ? [p.text, p.lexemeId] : [p.text])),
        assetKey: storySentenceAssetKey(lang, stories, s),
        startSec,
        durationSec,
      };
    });
    byId[story.id] = {
      id: story.id,
      band: story.band,
      title: story.title,
      blurb: pickNative(story.blurb, input.nativeCode, `${story.id}.blurb`),
      tokens: a.tokens,
      lexemes: a.lexemes,
      newLexemes: story.newLexemes,
      audio: storyAudioMode(lang, stories, story.id, bundled, hasAsset),
      sentences,
      questions: story.questions.map((q, i) => ({
        kind: q.kind,
        prompt: pickNative(q.prompt, input.nativeCode, `${story.id}.questions[${i}].prompt`),
        options: q.options.map((o, j) => pickNative(o, input.nativeCode, `${story.id}.questions[${i}].options[${j}]`)),
        answer: q.answer,
      })),
    };
  }
  const order = storyReadingOrder(stories);
  // Compact, one story per line: pieces are many short tuples, and the chunk ships per course.
  const lines = order.map((id, i) => `${JSON.stringify(id)}:${JSON.stringify(byId[id])}${i < order.length - 1 ? "," : ""}`);
  return `{"version":${stories.version},"language":${JSON.stringify(lang)},"order":${JSON.stringify(order)},"byId":{\n${lines.join("\n")}\n}}\n`;
}

/**
 * Static require map (assetKey → bundled MP3) for the story sentences whose
 * generated asset exists; the validator errors on a missing one once the
 * stories have been generated, so a shipped build plays every sentence.
 */
export function compileStoryAssetsModule(stories: Stories, requirePrefix: string, policy: StoryAudioPolicy = storyAudioPolicy(stories.language)): string {
  const lang = stories.language;
  const lines = [
    "/**",
    " * Generated by scripts/compile-content.ts — do not edit.",
    " * Graded-story sentence audio (P5b): assetKey → bundled deterministic MP3.",
    " */",
    "",
    "export const STORY_SENTENCE_ASSETS: Record<string, number> = {",
  ];
  const bundled = bundledStoryIds(stories, policy);
  const codec = storyCodec(lang);
  const keys = [...new Set(stories.stories.filter((st) => bundled.has(st.id)).flatMap((st) => st.sentences.map((s) => storySentenceAssetKey(lang, stories, s, codec))))].sort();
  for (const key of keys) {
    const file = assetFileName(key, codec);
    if (!existsSync(safeResolve(receptionAssetsDir(lang), file))) continue;
    lines.push(`  "${key}": require("${requirePrefix}/${receptionAssetsDir(lang)}/${file}"),`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

/** Per-story grading facts for review (content/reports/<lang>/stories-coverage.json). */
export function compileStoriesReport(analyses: StoryAnalysis[], stories: Stories): string {
  const newOf = new Map(stories.stories.map((s) => [s.id, s.newLexemes]));
  return canonicalJson({
    generator: "scripts/lib/stories.ts",
    rule: `every token resolves; ≥ ${STORY_MIN_COVERAGE * 100} % of tokens known at the story's band; ${STORY_MIN_TOKENS}–${STORY_MAX_TOKENS} tokens; 3–5 declared new lexemes`,
    stories: analyses.map((a) => ({
      id: a.id,
      band: a.band,
      tokens: a.tokens,
      coverage: Number(a.coverage.toFixed(4)),
      distinctLexemes: a.lexemes.length,
      newLexemes: newOf.get(a.id) ?? [],
    })),
  });
}
