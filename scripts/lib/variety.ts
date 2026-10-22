/**
 * Language variety (P3e): a course teaches ONE production variety
 * (content/<lang>/VARIETY.md — Spanish: Peninsular). Lexemes marked
 * `variety: { region, equivalent }` are regional forms: accepted in graded
 * answers (alternatives, acceptedVariants, rubric variants, required
 * concepts) and shown as notes on their equivalent, but never in the
 * target text a course models — prompts, options, sentences, readings,
 * clip transcripts, speech targets, model answers, partner lines.
 */

import type { PackSource, RichLexicon } from "../../content/schema";

/** Fields whose strings are never target-language model text. */
const SKIP_KEYS = new Set([
  "id", "clipId", "readingId", "speechItemId", "writingTaskId", "scenarioId", "modelClipId", "modelAudioRef", "rephraseClipId",
  "next", "noMatchNext", "startNodeId", "intent", "lexemeRefs", "evidenceLexemeRefs", "objectiveRefs", "objectiveTargets", "objectives",
  "sourceRef", "sourceRefs", "vi", "en", "translation", "native", "gloss", "instruction", "question", "goal", "label", "description",
  "relations", "confusables", "pronunciation", "frequency", "topic", "glosses",
]);
/** Accepted-answer lists: regional forms belong here. */
const ACCEPT_KEYS = new Set(["alternatives", "acceptedVariants", "variants", "requiredConcepts"]);

export type RegionalForm = { word: string; region: string; equivalent: string };

export function regionalForms(lexicon: RichLexicon): RegionalForm[] {
  const bySurface = new Map(lexicon.lexemes.map((l) => [l.id, l.surface]));
  return lexicon.lexemes
    .filter((l) => l.variety)
    .map((l) => ({ word: l.lookupForm.toLowerCase(), region: l.variety!.region, equivalent: bySurface.get(l.variety!.equivalent) ?? l.variety!.equivalent }));
}

function matcher(forms: RegionalForm[]): (text: string) => RegionalForm | undefined {
  const L = "a-záéíóúñüA-ZÁÉÍÓÚÑÜ";
  const rx = forms.map((f) => ({ f, re: new RegExp(`(?<![${L}])${f.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:s|es)?(?![${L}])`, "i") }));
  return (text) => rx.find(({ re }) => re.test(text))?.f;
}

/** Every regional form in a document's target-language text, with its JSON path. */
export function regionalFormHits(doc: unknown, forms: RegionalForm[], where: string): string[] {
  if (forms.length === 0) return [];
  const find = matcher(forms);
  const hits: string[] = [];
  const walk = (node: unknown, path: string, key?: string): void => {
    if (key !== undefined && (SKIP_KEYS.has(key) || ACCEPT_KEYS.has(key))) return;
    if (typeof node === "string") {
      const f = find(node);
      if (f) hits.push(`${where}${path}: regional form "${f.word}" (${f.region}) in target text — the course models "${f.equivalent}" (VARIETY.md); regional forms belong in accepted-answer lists`);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((x, i) => walk(x, `${path}[${i}]`, key));
      return;
    }
    if (node && typeof node === "object") {
      const o = node as Record<string, unknown>;
      if (o.variety !== undefined && o.surface !== undefined) return; // a regional lexeme itself
      for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`, k);
    }
  };
  walk(doc, "");
  return hits;
}

/** Errors for a target: its non-standalone course packs and rich sources. */
export function varietyErrors(input: { lang: string; lexicon: RichLexicon | null; packs: PackSource[]; sources: { rel: string; doc: unknown }[] }): string[] {
  if (!input.lexicon) return [];
  const forms = regionalForms(input.lexicon);
  const errors: string[] = [];
  for (const pack of input.packs) errors.push(...regionalFormHits(pack, forms, `variety (${input.lang}) ${pack.id}`));
  for (const { rel, doc } of input.sources) errors.push(...regionalFormHits(doc, forms, `variety (${input.lang}) ${rel}`));
  return errors;
}
