/**
 * Runtime pedagogy-concept lookup (Phase 5B, per course since P1b). Reads
 * the course's compiled concepts artifact (src/content/concepts/<code>-
 * concepts.json via the artifact registry) — the app never ships
 * validation machinery, and courses without concepts simply never resolve
 * one.
 */
import { artifactsFor, memoByCourse } from "../content-registry";

/**
 * Example pair keyed by language code (`{ fr: "…", en: "…" }` for fr-en)
 * plus an optional `note`; resolve the pair with exampleTexts().
 */
export type ConceptExample = Record<string, string> & { note?: string };

export type ConceptContent = {
  id: string;
  title: string;
  shortRule: string;
  explanation: string;
  examples: ConceptExample[];
  exceptions: string[];
  memoryHint?: string;
};

type ConceptsArtifact = { byId: Record<string, ConceptContent> };

const byId = memoByCourse<Record<string, ConceptContent>>((courseId) => {
  const artifact = artifactsFor(courseId).concepts as ConceptsArtifact | undefined;
  return artifact?.byId ?? {};
});

export function conceptFor(courseId: string, conceptId: string): ConceptContent | undefined {
  return byId(courseId)[conceptId];
}
