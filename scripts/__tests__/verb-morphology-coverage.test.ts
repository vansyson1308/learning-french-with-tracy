/**
 * §26 conjugation-source sufficiency — the machine-checkable record of the
 * Phase 5A decision: Lexique 4 recovers the verb morphology the Phase 5B
 * scope needs (présent, futur proche, passé composé), so NO additional
 * dataset (Morphalou, original audited tables) is required.
 *
 * Consumption contract (evidence-driven, see LEXIQUE4_COLUMNS.md): on
 * high-frequency homographic forms, 9_InfoVER is a FORM-LEVEL union of
 * verbal readings (the être-lemma row for "suis" also lists suivre's
 * imp:pre:2/ind:pre:2; "sommes" lists sommer's readings), and 8_Nombre is
 * row-level AND noisy (observed: the "peux" row carries nombre "p" though
 * je/tu peux is singular), so number must never gate evidence. Therefore
 * Phase 5B AUTHORS its conjugation cells and VERIFIES each (form, cell)
 * against this evidence — an authored cell must be supported by a row of
 * the lemma whose form matches and whose atom set carries the cell's
 * mood:tense:person. These tests pin that such evidence exists for the
 * whole curriculum scope (singular and plural présent forms are always
 * orthographically distinct here, so ≥2 distinct forms per person proves
 * both numbers are recoverable).
 */
import { describe, expect, test } from "bun:test";

import { loadSourceManifest } from "../lib/lexicon";
import { readJson } from "../lib/pipeline";

type VerbRows = {
  lemma: string;
  found: boolean;
  rows: { mot: string; cgram: string; infoVer: string; nombre: string; ipa: string }[];
};
const morph = readJson("content/fr/lexicon/derived/verb-morphology.json") as {
  source: { sha256: string };
  atomicAnalyses: Record<string, number>;
  verbs: VerbRows[];
};

/** Distinct orthographic forms of the verb whose atom set carries the atom. */
function formsEvidencing(verb: VerbRows, atom: string): Set<string> {
  const forms = new Set<string>();
  for (const row of verb.rows) {
    if (row.infoVer.split(",").includes(atom)) forms.add(row.mot);
  }
  return forms;
}

const CURRICULUM_VERBS = [
  "être", "avoir", "aller", "faire", "aimer", "parler", "manger", "habiter",
  "travailler", "regarder", "écouter", "donner", "jouer", "acheter", "penser",
  "vouloir", "pouvoir", "devoir", "savoir", "venir", "voir", "prendre",
  "dire", "boire", "finir", "choisir", "dormir", "sortir", "partir",
];

describe("Lexique 4 verb-morphology sufficiency (§26 decision record)", () => {
  test("derived data is pinned to the manifest artifact", () => {
    const pinned = loadSourceManifest().retrieval.sha256;
    expect(pinned).not.toBeNull();
    expect(morph.source.sha256).toBe(pinned as string);
  });

  test("the atomic analysis system carries the scope's moods and tenses", () => {
    const atoms = Object.keys(morph.atomicAnalyses);
    expect(atoms).toContain("inf");
    expect(atoms).toContain("ind:pre:1");
    expect(atoms).toContain("ind:pre:3");
    expect(atoms).toContain("par:pas:");
  });

  test("every curriculum verb evidences infinitive, both numbers of every présent person, and past participle", () => {
    const byLemma = new Map(morph.verbs.map((v) => [v.lemma, v]));
    for (const lemma of CURRICULUM_VERBS) {
      const verb = byLemma.get(lemma);
      expect(verb, `verb ${lemma} missing from the derived data`).toBeDefined();
      expect(verb!.found).toBe(true);
      expect(formsEvidencing(verb!, "inf").size, `${lemma}: no infinitive evidence`).toBeGreaterThanOrEqual(1);
      for (const person of ["1", "2", "3"]) {
        const forms = formsEvidencing(verb!, `ind:pre:${person}`);
        // Two distinct forms per person = the singular and plural forms
        // are both recoverable (they never share spelling in this scope).
        expect(forms.size, `${lemma}: présent person ${person} has ${forms.size} form(s)`).toBeGreaterThanOrEqual(2);
      }
      const hasParticiple = verb!.rows.some((r) =>
        r.infoVer.split(",").some((a) => a.startsWith("par:pas"))
      );
      expect(hasParticiple, `${lemma}: no past participle evidence`).toBe(true);
    }
  });

  test("passé composé auxiliaries: être and avoir carry AUX-category présent rows", () => {
    for (const lemma of ["être", "avoir"]) {
      const verb = morph.verbs.find((v) => v.lemma === lemma)!;
      const auxPresent = verb.rows.some(
        (r) => r.cgram === "AUX" && r.infoVer.split(",").some((a) => a.startsWith("ind:pre:"))
      );
      expect(auxPresent, `${lemma}: no AUX présent rows`).toBe(true);
    }
  });

  test("the form-level union is REAL (the reason blind extraction is forbidden)", () => {
    // The être-lemma row for "suis" also lists suivre's readings — the
    // documented evidence behind the authored-cells-verified-against-
    // evidence consumption contract.
    const etre = morph.verbs.find((v) => v.lemma === "être")!;
    const suis = etre.rows.find((r) => r.mot === "suis" && r.cgram === "VER");
    expect(suis?.infoVer.split(",")).toContain("imp:pre:2");
  });

  test("per-form IPA rides along for pronunciation teaching", () => {
    const etre = morph.verbs.find((v) => v.lemma === "être")!;
    const suis = etre.rows.find((r) => r.mot === "suis");
    expect(suis?.ipa).toBe("sɥi");
  });
});
