/**
 * Multi-source manifest helpers (P3a): build the v2 manifest of a language
 * from the source catalogue + the identities recorded at acquisition, and
 * answer the fail-closed questions the validators ask ("is source X
 * retrieved and pinned?", "which source backs frequency?").
 */

import type { SourceManifest, SourceManifestV1, SourceManifestV2 } from "../../../content/schema";

import { DECLARED_NOT_RETRIEVED, sourcesFor, type SourceSpec } from "./sources";

export type ArtifactIdentity = { sha256: string; bytes: number; retrievedAt: string };

export function isV2(m: SourceManifest): m is SourceManifestV2 {
  return (m as { version?: unknown }).version === 2;
}

/** The questions every consumer asks, answered uniformly for v1 (Lexique) and v2 manifests. */
export type ManifestView = {
  version: 1 | 2;
  /** v1: the one external source id; v2: the frequency measurement source. */
  primaryId: string | null;
  primaryRetrieved: boolean;
  primarySha256: string | null;
  /** Ids the manifest declares (retrieved or not). */
  declared: Set<string>;
  /** Ids with every artifact retrieved and pinned. */
  retrieved: Set<string>;
  /** sha256 of a retrieved source's artifact (v2: the first artifact of that id). */
  sha256Of(id: string): string | null;
};

export function manifestView(m: SourceManifest | null): ManifestView | null {
  if (m === null) return null;
  if (!isV2(m)) {
    const v1 = m as SourceManifestV1;
    const retrieved = v1.retrieval.status === "retrieved";
    return {
      version: 1,
      primaryId: v1.source.id,
      primaryRetrieved: retrieved,
      primarySha256: v1.retrieval.sha256,
      declared: new Set([v1.source.id]),
      retrieved: new Set(retrieved ? [v1.source.id] : []),
      sha256Of: (id) => (id === v1.source.id ? v1.retrieval.sha256 : null),
    };
  }
  const declared = new Set<string>();
  const retrievedIds = new Set<string>();
  const notRetrieved = new Set<string>();
  const firstSha = new Map<string, string>();
  for (const s of m.sources) {
    declared.add(s.id);
    if (s.retrieval.status === "retrieved") {
      if (!firstSha.has(s.id) && s.retrieval.sha256) firstSha.set(s.id, s.retrieval.sha256);
    } else notRetrieved.add(s.id);
  }
  // An id is retrieved only when EVERY artifact of that id is pinned.
  for (const id of declared) if (!notRetrieved.has(id)) retrievedIds.add(id);
  const primaryRetrieved = retrievedIds.has(m.frequencySourceId);
  return {
    version: 2,
    primaryId: m.frequencySourceId,
    primaryRetrieved,
    primarySha256: primaryRetrieved ? (firstSha.get(m.frequencySourceId) ?? null) : null,
    declared,
    retrieved: retrievedIds,
    sha256Of: (id) => (retrievedIds.has(id) ? (firstSha.get(id) ?? null) : null),
  };
}

/** Assemble the v2 manifest for a language from the catalogue and the identities of the artifacts on disk. */
export function buildManifestV2(
  lang: string,
  identities: Map<string, ArtifactIdentity | null>,
  previous: SourceManifestV2 | null
): SourceManifestV2 {
  const specs: SourceSpec[] = sourcesFor(lang);
  const sources: SourceManifestV2["sources"] = specs.map((s) => {
    const idn = identities.get(s.artifactFilename) ?? null;
    const prev = previous?.sources.find((p) => p.artifactFilename === s.artifactFilename);
    const retrieval: SourceManifestV2["sources"][number]["retrieval"] = idn
      ? { status: "retrieved", retrievedAt: idn.retrievedAt, sha256: idn.sha256, bytes: idn.bytes }
      : prev?.retrieval.status === "retrieved"
        ? prev.retrieval
        : { status: "not-retrieved", retrievedAt: null, sha256: null, bytes: null, blocker: "not downloaded in this run" };
    return { id: s.id, role: s.role, name: s.name, license: s.license, citation: s.citation, url: s.url, artifactFilename: s.artifactFilename, retrieval, notes: s.notes };
  });
  for (const d of DECLARED_NOT_RETRIEVED[lang] ?? []) {
    sources.push({
      id: d.id,
      role: d.id.startsWith("nikl") ? "anchor" : "frequency-secondary",
      name: d.name,
      license: d.id.startsWith("nikl") ? "KOGL-1" : "CC-BY-4.0",
      citation: d.name,
      url: "(see notes)",
      artifactFilename: `${d.id}.tsv`,
      retrieval: { status: "not-retrieved", retrievedAt: null, sha256: null, bytes: null, blocker: d.reason },
      notes: d.reason,
    });
  }
  const frequency = specs.find((s) => s.role === "frequency");
  if (!frequency) throw new Error(`${lang}: the source catalogue has no frequency source`);
  return {
    version: 2,
    language: lang,
    generator: "scripts/lexicon-etl.ts",
    sources,
    frequencySourceId: frequency.id,
    notes:
      `Lexicon ETL v2 (P3a) source manifest for ${lang}: every artifact is downloaded from its official location by the dispatch-only workflow .github/workflows/lexicon-source.yml (or a developer run of scripts/lexicon-etl.ts fetch), hashed, and pinned here; raw dumps are never committed. A retrieval that does not hash to the pin is source-version drift and extract refuses to run (re-pin deliberately with recon). Declared sources whose download could not be completed stay "not-retrieved" with the blocker recorded and can never be cited by a lexeme.`,
  };
}
