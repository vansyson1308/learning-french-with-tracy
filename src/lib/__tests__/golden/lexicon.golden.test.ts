/**
 * Lexicon goldens (P1a): the runtime index lookups, article cues, the
 * search ranking for the researched queries, and the repository's
 * detail/list views over the real compiled French data.
 */
import { describe, test } from "bun:test";

import frWebFallback from "../../../content/lexicon/fr-web-fallback.json";
import {
  allLexemeMeta,
  articleCueFor,
  lexemeIdForLookupForm,
  lexemeMetaFor,
  lexiconIndexContentHash,
} from "../../learning/lexicon-index";
import { foldForSearch, searchTokens } from "../../learning/lexicon-search";
import { GeneratedLexiconRepository, type GeneratedLexiconData } from "../../lexicon/generated-repository";
import { expectGolden } from "./helpers";

const repo = new GeneratedLexiconRepository(frWebFallback as GeneratedLexiconData);
const QUERIES = ["café", "cafe", "oeuf", "œuf", "le", "gar", "the man", "xyzzy"];
const TEN = allLexemeMeta("fr-en").slice(0, 10).map((m) => m.id);

describe("lexicon goldens (fr)", () => {
  test("runtime index: ten lookups + article cues + lookup-form resolution", () => {
    expectGolden("lexicon/index", {
      contentHash: lexiconIndexContentHash("fr-en"),
      count: allLexemeMeta("fr-en").length,
      lookups: TEN.map((id) => ({ id, meta: lexemeMetaFor("fr-en", id), articleCue: articleCueFor("fr-en", lexemeMetaFor("fr-en", id)!) })),
      byLookupForm: ["homme", "femme", "cafe", "café", "pain", "eau", "nonexistent"].map((f) => ({
        form: f,
        id: lexemeIdForLookupForm("fr-en", f),
      })),
      unknown: lexemeMetaFor("fr-en", "fr:w:does-not-exist"),
    });
  });

  test("search: tokens, folding and ranked results", async () => {
    const results: Record<string, unknown> = {};
    for (const q of QUERIES) {
      results[q] = {
        tokens: searchTokens(q),
        folded: foldForSearch(q),
        ids: (await repo.search(q)).map((r) => r.id),
      };
    }
    expectGolden("lexicon/search", results);
  });

  test("repository: detail of ten lexemes and the three list orders", async () => {
    expectGolden("lexicon/repository", {
      details: await Promise.all(TEN.map((id) => repo.getById(id))),
      examples: await Promise.all(TEN.slice(0, 3).map((id) => repo.getExamples(id))),
      courseOrder: (await repo.list({ sort: "course" })).map((r) => r.id),
      alphaOrder: (await repo.list({ sort: "alpha" })).map((r) => r.id),
      frequencyOrder: (await repo.list({ sort: "frequency" })).map((r) => r.id),
      nouns: (await repo.list({ pos: "noun" })).map((r) => r.id),
    });
  });
});
