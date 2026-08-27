/**
 * Runtime pedagogy-concept lookup (Phase 5B). Reads the compiled artifact
 * (src/content/concepts/fr-concepts.json, emitted by compile-content from
 * the authored content/fr/pedagogy/concepts.json) — the app never ships
 * validation machinery, and courses without concepts simply never resolve
 * one.
 */
import frConcepts from "../../content/concepts/fr-concepts.json";

export type ConceptExample = { fr: string; en: string; note?: string };

export type ConceptContent = {
  id: string;
  title: string;
  shortRule: string;
  explanation: string;
  examples: ConceptExample[];
  exceptions: string[];
  memoryHint?: string;
};

const byId = frConcepts.byId as Record<string, ConceptContent>;

export function conceptFor(conceptId: string): ConceptContent | undefined {
  return byId[conceptId];
}
