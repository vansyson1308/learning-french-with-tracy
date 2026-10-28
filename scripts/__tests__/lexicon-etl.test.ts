/**
 * Lexicon ETL v2 unit tests (P3a). The adapters and the derivation are
 * exercised on small synthetic fixtures shaped exactly like the real
 * sources (kaikki JSONL, FrequencyWords, wordfreq CSV, Tatoeba TSV, the
 * anchor CSVs, JMdict XML, CC-CEDICT), so a silently broken rule can never
 * reach the committed evidence. The real dumps never enter the test suite.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

import { SourceManifestV2Schema, type SourceManifestV2 } from "../../content/schema";
import { parseCsv, readCefrJ, readHsk30, readNgsl } from "../lib/lexicon-etl/adapters/anchors";
import { pinyinNumbersToMarks, readCedict, readJmdict } from "../lib/lexicon-etl/adapters/dictionaries";
import { readFrequencyWords, readWordfreqCsv } from "../lib/lexicon-etl/adapters/frequency";
import { atomsFromTags, cleanGloss, scanKaikki, viGlossFromSense } from "../lib/lexicon-etl/adapters/kaikki";
import { isLearnerSentence } from "../lib/lexicon-etl/adapters/tatoeba";
import { deriveLanguage, normalizeFormFor, wordShapeFor } from "../lib/lexicon-etl/derive";
import { buildManifestV2, manifestView } from "../lib/lexicon-etl/manifest";
import { DECLARED_NOT_RETRIEVED, LEXICON_SOURCES, sourceIdsFor, sourcesFor } from "../lib/lexicon-etl/sources";
import { projectTopicFor } from "../lib/lexicon-etl/topics";
import { loadRegistry } from "../lib/pipeline";

const scratch = mkdtempSync(path.join(tmpdir(), "lexicon-etl-"));
const write = (rel: string, text: string) => {
  const abs = path.join(scratch, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, text);
  return abs;
};

const entry = (o: Record<string, unknown>) => JSON.stringify({ lang_code: "es", ...o });

describe("kaikki adapter", () => {
  test("keeps lemma entries of the candidate parts of speech, indexes form-of senses, reads gender/IPA/examples", async () => {
    const file = write("es/kaikki.jsonl", [
      entry({ word: "casa", pos: "noun", senses: [{ glosses: ["house"], tags: ["feminine"], examples: [{ text: "Mi casa es grande.", english: "My house is big." }] }], forms: [{ form: "casas", tags: ["plural"] }], sounds: [{ ipa: "/ˈkasa/" }], categories: [{ name: "Buildings", orig: "es:Buildings" }] }),
      entry({ word: "casas", pos: "noun", senses: [{ glosses: ["plural of casa"], tags: ["form-of", "plural"], form_of: [{ word: "casa" }] }] }),
      entry({ word: "hablar", pos: "verb", senses: [{ glosses: ["to talk; to speak"] }], forms: [{ form: "hablo", tags: ["first-person", "indicative", "present", "singular"] }, { form: "hablado", tags: ["participle", "past"] }, { form: "háblalo", tags: ["combined-form", "imperative"] }], sounds: [{ ipa: "[aˈβlaɾ]" }, { ipa: "/aˈblaɾ/" }] }),
      entry({ word: "Madrid", pos: "name", senses: [{ glosses: ["capital of Spain"] }] }),
      entry({ word: "casa", pos: "verb", senses: [{ glosses: ["inflection of casar:", "third-person singular present indicative"], tags: ["form-of"], form_of: [{ word: "casar" }] }] }),
      "not json",
    ].join("\n"));
    const scan = await scanKaikki(file, { lang: "es", sourceId: "kaikki-en", glossLanguage: "en" });
    expect(scan.badLines).toBe(1);
    expect([...scan.lemmas.keys()].sort()).toEqual(["casa|noun", "hablar|verb"]);
    const casa = scan.lemmas.get("casa|noun")!;
    expect(casa.gender).toBe("feminine");
    expect(casa.ipa).toBe("ˈkasa");
    expect(casa.examples[0]).toEqual({ target: "Mi casa es grande.", translations: { en: "My house is big." }, source: "kaikki-en", key: "casa|noun|0" });
    expect(casa.topics).toEqual(["buildings"]);
    expect(casa.senseCount).toBe(1);
    const hablar = scan.lemmas.get("hablar|verb")!;
    expect(hablar.ipa).toBe("aˈblaɾ"); // broad transcription preferred
    expect(hablar.forms.map((f) => [f.form, f.atoms])).toEqual([
      ["hablo", ["ind:pre:1", "sg"]],
      ["hablado", ["par:pas"]],
    ]);
    expect([...scan.formOf.get("casas")!]).toEqual(["casa"]);
    expect([...scan.formOf.get("casa")!]).toEqual(["casar"]);
  });

  test("keepWords bounds memory: entries outside the set are skipped, form targets are still indexed", async () => {
    const file = write("es/kaikki2.jsonl", [entry({ word: "perro", pos: "noun", senses: [{ glosses: ["dog"], tags: ["masculine"] }] }), entry({ word: "gato", pos: "noun", senses: [{ glosses: ["cat"], tags: ["masculine"] }] })].join("\n"));
    const scan = await scanKaikki(file, { lang: "es", sourceId: "kaikki-en", glossLanguage: "en", keepWords: new Set(["perro"]) });
    expect([...scan.lemmas.keys()]).toEqual(["perro|noun"]);
  });

  test("usage tags restrict a lemma only when every sense carries one; tagged senses give no glosses or examples beside plain ones", async () => {
    const file = write("es/kaikki3.jsonl", [
      entry({ word: "andar", pos: "verb", senses: [{ glosses: ["to walk"], examples: [{ text: "Ando mucho.", english: "I walk a lot." }] }, { glosses: ["to fare (dated)"], tags: ["dated"], examples: [{ text: "Anda la cosa.", english: "Old usage." }] }] }),
      entry({ word: "andar", pos: "verb", etymology_number: 2, senses: [{ glosses: ["to go about (slang)"], tags: ["slang"] }] }),
      entry({ word: "maravedí", pos: "noun", senses: [{ glosses: ["an old coin"], tags: ["historical"] }, { glosses: ["money (archaic)"], tags: ["archaic"] }] }),
      entry({ word: "guay", pos: "adj", tags: ["colloquial", "slang"], senses: [{ glosses: ["cool"] }] }),
    ].join("\n"));
    const scan = await scanKaikki(file, { lang: "es", sourceId: "kaikki-en", glossLanguage: "en" });
    const andar = scan.lemmas.get("andar|verb")!;
    expect(andar.usageTags).toEqual([]);
    expect(andar.glosses).toEqual(["to walk"]);
    expect(andar.examples.map((x) => x.target)).toEqual(["Ando mucho."]);
    expect(andar.senseCount).toBe(3);
    expect(scan.lemmas.get("maravedí|noun")!.usageTags).toEqual(["archaic", "historical"]);
    expect(scan.lemmas.get("maravedí|noun")!.glosses).toEqual(["an old coin", "money (archaic)"]);
    expect(scan.lemmas.get("guay|adjective")!.usageTags).toEqual(["slang"]);
  });

  test("tag atoms follow the Lexique-style notation and ignore combined/table rows", () => {
    expect(atomsFromTags(["first-person", "present", "singular", "subjunctive"])).toEqual(["sub:pre:1", "sg"]);
    expect(atomsFromTags(["second-person", "imperative", "singular"])).toEqual(["imp:pre:2", "sg"]);
    expect(atomsFromTags(["third-person", "preterite", "plural"])).toEqual(["ind:pas:3", "pl"]);
    expect(atomsFromTags(["first-person", "imperfect", "singular"])).toEqual(["ind:imp:1", "sg"]);
    expect(atomsFromTags(["gerund"])).toEqual(["ger"]);
    expect(atomsFromTags(["feminine", "plural"])).toEqual(["pl", "f"]);
    expect(atomsFromTags(["accusative", "combined-form", "infinitive", "object-third-person"])).toEqual([]);
    expect(atomsFromTags(["table-tags"])).toEqual([]);
  });

  test("gloss cleaning and the Vietnamese sense reduction", () => {
    expect(cleanGloss("(colloquial) house; home.")).toBe("house; home");
    expect(cleanGloss("house (Classifier: 所 m; 棟 m)")).toBe("house");
    expect(viGlossFromSense("Nhà ở, căn nhà, tòa nhà; chỗ ở.")).toBe("nhà ở");
    expect(viGlossFromSense("gđ Radio, truyền thanh.")).toBe("radio");
    expect(viGlossFromSense("Xem casar")).toBeNull();
    expect(viGlossFromSense("Dạng biến tố của aguar:\n## trần thuật")).toBeNull();
  });
});

describe("frequency adapters", () => {
  test("FrequencyWords: rank by file order, per-million relative to the list total", async () => {
    const file = write("es/fw.txt", "de 60\nla 30\nque 10\nbad\n");
    const list = await readFrequencyWords(file);
    expect(list.total).toBe(100);
    expect(list.byWord.get("la")).toEqual({ word: "la", count: 30, rank: 2, perMillion: 300000 });
  });
  test("wordfreq export: header skipped, first occurrence wins", async () => {
    const file = write("es/wf.csv", "word,zipf\ncasa,5.77\ncasa,1.00\n");
    const m = await readWordfreqCsv(file);
    expect(m.get("casa")).toBe(5.77);
  });
});

describe("anchor and dictionary adapters", () => {
  test("csv parsing handles quotes and CRLF", () => {
    expect(parseCsv('a,"b,c",d\r\n1,"he said ""hi""",3\n')).toEqual([["a", "b,c", "d"], ["1", 'he said "hi"', "3"]]);
  });
  test("HSK 3.0, CEFR-J (lowest level wins, variants split) and NGSL (rank bands)", () => {
    const hsk = readHsk30(write("zh/hsk30.csv", "ID,Simplified,Traditional,Pinyin,POS,Level\nL1-0001,爱,愛,ài,V,1\nL2-0001,爱,愛,ài,V,2\n"));
    expect(hsk.levels.get("爱")).toBe("HSK1");
    const cefr = readCefrJ(write("en/cefrj.csv", "headword,pos,CEFR\na.m./am,adverb,A1\nabandon,verb,B1\nabandon,noun,A2\n"));
    expect(cefr.levels.get("am")).toBe("A1");
    expect(cefr.levels.get("abandon|verb")).toBe("B1");
    expect(cefr.levels.get("abandon")).toBe("A2");
    const ngsl = readNgsl(write("en/ngsl.csv", "Lemma,SFI Rank,SFI,Adjusted Frequency per Million (U)\nthe,1,87.85,60910\nzone,2500,40,2\n"));
    expect(ngsl.ranks!.get("the")).toBe(1);
    expect(ngsl.levels.get("zone")).toBe("NGSL-3k");
  });
  test("JMdict entries and CC-CEDICT lines (pinyin tone marks)", async () => {
    const jm = readJmdict(write("ja/JMdict_e.xml", "<JMdict><entry><ent_seq>1</ent_seq><k_ele><keb>家</keb></k_ele><r_ele><reb>いえ</reb></r_ele><sense><gloss>house</gloss><gloss>home</gloss></sense></entry></JMdict>"));
    expect(jm.get("家")).toEqual({ word: "家", reading: "いえ", glosses: ["house", "home"] });
    const cedict = await readCedict(write("zh/cedict.txt", "# comment\n你好 你好 [ni3 hao3] /hello; hi/\n房子 房子 [fang2 zi5] /house/CL:所[suo3]/\n"));
    expect(cedict.get("你好")!.reading).toBe("nǐ hǎo");
    expect(cedict.get("房子")!.glosses).toEqual(["house"]);
    expect(pinyinNumbersToMarks("lu:4 xue2 xiong1")).toBe("lǜ xué xiōng");
  });
});

describe("sentences, shapes, topics", () => {
  test("learner sentence filter", () => {
    expect(isLearnerSentence("Tengo que irme a dormir.")).toBe(true);
    expect(isLearnerSentence("¡Sí!")).toBe(false);
    expect(isLearnerSentence('Dijo "hola".')).toBe(false);
  });
  test("word shapes per script and Italian stress-mark normalisation", () => {
    expect(wordShapeFor("es").test("año")).toBe(true);
    expect(wordShapeFor("es").test("casa2")).toBe(false);
    expect(wordShapeFor("ja").test("食べる")).toBe(true);
    expect(normalizeFormFor("it", "màngio")).toBe("mangio");
    expect(normalizeFormFor("it", "città")).toBe("città");
    expect(normalizeFormFor("es", "màngio")).toBe("màngio");
  });
  test("topic mapping is literal; unmatched labels fall back to everyday", () => {
    expect(projectTopicFor(["dogs"])).toEqual({ topic: "animals", matched: "dogs" });
    expect(projectTopicFor(["astrology", "fruits"])).toEqual({ topic: "food", matched: "fruits" });
    expect(projectTopicFor(["quantum-mechanics"])).toEqual({ topic: "everyday", matched: null });
  });
});

describe("source catalogue and manifest", () => {
  test("every catalogued source id is registered with an allowlisted licence; declared-not-retrieved ids are not registered", () => {
    const registry = loadRegistry();
    const ids = new Set(registry.sources.map((s) => s.id));
    for (const lang of Object.keys(LEXICON_SOURCES)) {
      for (const id of sourceIdsFor(lang)) expect(ids.has(id)).toBe(true);
      for (const d of DECLARED_NOT_RETRIEVED[lang] ?? []) expect(ids.has(d.id)).toBe(false);
      for (const s of sourcesFor(lang)) expect(s.url.startsWith("https://")).toBe(true);
    }
    // Build-time anchors never ship: flagged in the registry.
    for (const id of ["openjlpt", "hsk30", "cefr-j", "ngsl"]) expect(registry.sources.find((s) => s.id === id)?.buildTimeOnly).toBe(true);
  });

  test("buildManifestV2 pins present artifacts, keeps previous pins, records blockers; the view answers fail-closed", () => {
    const ids = new Map<string, { sha256: string; bytes: number; retrievedAt: string } | null>();
    for (const s of sourcesFor("ko")) ids.set(s.artifactFilename, s.id === "frequencywords" ? { sha256: "a".repeat(64), bytes: 10, retrievedAt: "2026-10-15" } : null);
    const m = buildManifestV2("ko", ids, null);
    expect(SourceManifestV2Schema.safeParse(m).success).toBe(true);
    expect(m.frequencySourceId).toBe("frequencywords");
    expect(m.sources.find((s) => s.id === "nikl-learner-list")?.retrieval.blocker).toContain("403");
    const view = manifestView(m)!;
    expect(view.version).toBe(2);
    expect(view.primaryRetrieved).toBe(true);
    expect(view.retrieved.has("kaikki-en")).toBe(false);
    expect(view.declared.has("kaikki-en")).toBe(true);
    expect(view.sha256Of("frequencywords")).toBe("a".repeat(64));
    // A partially pinned id (several Tatoeba files, one missing) is NOT retrieved.
    expect(view.retrieved.has("tatoeba")).toBe(false);
  });
});

describe("derivation on a synthetic language", () => {
  test("pool, bands, morphology, gender endings and the pack word rule are deterministic", async () => {
    const dir = path.join(scratch, "xx-derive");
    mkdirSync(path.join(dir, "es"), { recursive: true });
    // Reuse the Spanish catalogue filenames so retrievedSpecs() finds the files.
    const lines = [
      entry({ word: "casa", pos: "noun", senses: [{ glosses: ["house"], tags: ["feminine"], examples: [{ text: "Mi casa es grande.", english: "My house is big." }] }], forms: [{ form: "casas", tags: ["plural"] }], sounds: [{ ipa: "/ˈkasa/" }] }),
      entry({ word: "casas", pos: "noun", senses: [{ glosses: ["plural of casa"], tags: ["form-of"], form_of: [{ word: "casa" }] }] }),
      entry({ word: "hablar", pos: "verb", senses: [{ glosses: ["to talk"], examples: [{ text: "Quiero hablar contigo.", english: "I want to talk to you." }] }], forms: [{ form: "hablo", tags: ["first-person", "indicative", "present", "singular"] }, { form: "hablado", tags: ["participle", "past"] }] }),
      entry({ word: "hablo", pos: "verb", senses: [{ glosses: ["first-person singular present indicative of hablar"], tags: ["form-of"], form_of: [{ word: "hablar" }] }] }),
      entry({ word: "ser", pos: "verb", senses: [{ glosses: ["to be"], examples: [{ text: "Soy alto.", english: "I am tall." }] }], forms: [{ form: "soy", tags: ["first-person", "indicative", "present", "singular"] }] }),
      entry({ word: "ser", pos: "noun", senses: [{ glosses: ["a being"], tags: ["masculine"] }] }),
      entry({ word: "yo", pos: "pron", senses: [{ glosses: ["I"] }] }),
      entry({ word: "yo", pos: "noun", senses: [{ glosses: ["Freud's concept of the ego"], tags: ["masculine"] }] }),
      entry({ word: "mesa", pos: "noun", senses: [{ glosses: ["table"], tags: ["feminine"] }], forms: [] }),
      entry({ word: "Madrid", pos: "name", senses: [{ glosses: ["capital"] }] }),
      entry({ word: "A", pos: "noun", senses: [{ glosses: ["The name of the Latin script letter A/a"] }] }),
    ];
    writeFileSync(path.join(dir, "es", "kaikki-en-es.jsonl"), lines.join("\n"));
    writeFileSync(path.join(dir, "es", "frequencywords-es.txt"), "yo 500\nser 400\ncasa 100\ncasas 50\nhablo 40\nhablar 10\nA 300\nmesa 1\n");
    writeFileSync(path.join(dir, "es", "wordfreq-es.csv"), "word,zipf\ncasa,5.77\n");
    writeFileSync(path.join(dir, "es", "kaikki-vi-es.jsonl"), [entry({ word: "casa", pos: "noun", senses: [{ glosses: ["Nhà ở, căn nhà; chỗ ở."], tags: ["feminine"] }] })].join("\n"));
    writeFileSync(path.join(dir, "es", "tatoeba-es-sentences.tsv"), "1\tspa\tLa mesa es nueva.\talice\t\\N\t2020\n2\tspa\tUna mesa.\tbob\t\\N\t2020\n");
    writeFileSync(path.join(dir, "es", "tatoeba-es-links-en.tsv"), "1\t10\n2\t11\n");
    writeFileSync(path.join(dir, "es", "tatoeba-es-links-vi.tsv"), "1\t20\n");
    writeFileSync(path.join(dir, "es", "tatoeba-eng-sentences.tsv"), "10\teng\tThe table is new.\tcarol\t\\N\t2020\n11\teng\tA table.\tdan\t\\N\t2020\n");
    writeFileSync(path.join(dir, "es", "tatoeba-vie-sentences.tsv"), "20\tvie\tCái bàn mới.\teve\t\\N\t2020\n");
    const ids = new Map<string, { sha256: string; bytes: number; retrievedAt: string } | null>();
    for (const s of sourcesFor("es")) ids.set(s.artifactFilename, { sha256: "b".repeat(64), bytes: 1, retrievedAt: "2026-10-15" });
    const manifest: SourceManifestV2 = buildManifestV2("es", ids, null);
    const run = () => deriveLanguage({ lang: "es", dir: path.join(dir, "es"), manifest, poolSize: 10 });
    const first = await run();
    const second = await run();
    expect(JSON.stringify(first.files)).toBe(JSON.stringify(second.files));
    const pool = (first.files["candidate-pool.json"] as { entries: { lemma: string; partOfSpeech: string; kind: string; frequency: { perMillion: number; band: string } | null; glosses: { vi: string[] }; examples: { source: string; translations: Record<string, string> }[]; reason: string }[] }).entries;
    const key = (e: { lemma: string; partOfSpeech: string }) => `${e.lemma}|${e.partOfSpeech}`;
    // "yo" is a pronoun first: the Freud reading absorbs nothing; the letter "A" and "Madrid" are out.
    expect(pool.map(key)).not.toContain("yo|noun");
    expect(pool.map(key)).not.toContain("A|noun");
    expect(pool.map(key)).not.toContain("Madrid|noun");
    expect(pool.find((e) => key(e) === "yo|pronoun")?.kind).toBe("function");
    // casa + casas lemmatise together (150 of the 1401 content-attributed counts), the verb outranks "el ser".
    const casa = pool.find((e) => key(e) === "casa|noun")!;
    expect(casa.frequency!.perMillion).toBeCloseTo((150 / 1401) * 1e6, 0);
    expect(casa.glosses.vi).toEqual(["nhà ở"]);
    const serVerb = pool.find((e) => key(e) === "ser|verb")!;
    const serNoun = pool.find((e) => key(e) === "ser|noun")!;
    expect(serVerb.frequency!.perMillion).toBeGreaterThan(serNoun.frequency!.perMillion);
    // Tatoeba fallback for the example-less noun, with the Vietnamese link.
    const mesa = pool.find((e) => key(e) === "mesa|noun")!;
    expect(mesa.examples[0].source).toBe("tatoeba");
    expect(mesa.examples[0].translations).toEqual({ en: "A table.", vi: undefined } as never);
    expect(mesa.examples.some((x) => x.translations.vi === "Cái bàn mới.")).toBe(true);
    // Stats + morphology + gender endings.
    const stats = first.files["frequency-stats.json"] as { freqLemme: { quantiles: Record<string, number> }; population: { size: number } };
    expect(stats.population.size).toBe(5);
    expect(stats.freqLemme.quantiles.p99).toBeGreaterThanOrEqual(stats.freqLemme.quantiles.p95);
    const morph = first.files["morphology.json"] as { verbs: { lemma: string; rows: { mot: string; infoVer: string }[] }[] };
    expect(morph.verbs.find((v) => v.lemma === "hablar")!.rows).toEqual([
      { mot: "hablar", infoVer: "inf" },
      { mot: "hablo", infoVer: "ind:pre:1,sg" },
      { mot: "hablado", infoVer: "par:pas" },
    ]);
    const credits = first.files["tatoeba-credits.json"] as { credits: Record<string, string> };
    expect(credits.credits["2"]).toBe("bob");
    expect(credits.credits["11"]).toBe("dan");
  });
});

describe("German nouns (capitalised) against a lower-case frequency list", () => {
  test("haus/häuser lemmatise to the noun Haus; the nominalised plural tagen counts mostly for Tag", async () => {
    const dir = path.join(scratch, "de-derive", "de");
    mkdirSync(dir, { recursive: true });
    const de = (o: Record<string, unknown>) => JSON.stringify({ lang_code: "de", ...o });
    const lines = [
      de({ word: "Haus", pos: "noun", senses: [{ glosses: ["house"], tags: ["neuter"], examples: [{ text: "Das Haus ist alt.", english: "The house is old." }] }, { glosses: ["home"] }], forms: [{ form: "Häuser", tags: ["plural"] }] }),
      de({ word: "Häuser", pos: "noun", senses: [{ glosses: ["plural of Haus"], tags: ["form-of"], form_of: [{ word: "Haus" }] }] }),
      de({ word: "Tag", pos: "noun", senses: [{ glosses: ["day"], tags: ["masculine"], examples: [{ text: "Guten Tag!", english: "Good day!" }] }, { glosses: ["daytime"] }, { glosses: ["date"] }], forms: [{ form: "Tagen", tags: ["dative", "plural"] }] }),
      de({ word: "Tagen", pos: "noun", senses: [{ glosses: ["dative plural of Tag"], tags: ["form-of"], form_of: [{ word: "Tag" }] }] }),
      de({ word: "tagen", pos: "verb", senses: [{ glosses: ["to meet, to sit (of a committee)"] }] }),
      de({ word: "gehen", pos: "verb", senses: [{ glosses: ["to go"], examples: [{ text: "Wir gehen.", english: "We go." }] }] }),
    ];
    writeFileSync(path.join(dir, "kaikki-en-de.jsonl"), lines.join("\n"));
    writeFileSync(path.join(dir, "frequencywords-de.txt"), "gehen 300\nhaus 100\nhäuser 20\ntag 80\ntagen 40\n");
    writeFileSync(path.join(dir, "wordfreq-de.csv"), "word,zipf\nhaus,5.5\n");
    writeFileSync(path.join(dir, "kaikki-vi-de.jsonl"), "");
    for (const f of ["tatoeba-de-sentences.tsv", "tatoeba-de-links-en.tsv", "tatoeba-de-links-vi.tsv", "tatoeba-eng-sentences.tsv", "tatoeba-vie-sentences.tsv"]) writeFileSync(path.join(dir, f), "");
    const ids = new Map<string, { sha256: string; bytes: number; retrievedAt: string } | null>();
    for (const src of sourcesFor("de")) ids.set(src.artifactFilename, { sha256: "c".repeat(64), bytes: 1, retrievedAt: "2026-10-28" });
    const result = await deriveLanguage({ lang: "de", dir, manifest: buildManifestV2("de", ids, null), poolSize: 10 });
    const pool = (result.files["candidate-pool.json"] as { entries: { lemma: string; partOfSpeech: string; frequency: { perMillion: number } | null }[] }).entries;
    const find = (lemma: string, pos: string) => pool.find((e) => e.lemma === lemma && e.partOfSpeech === pos);
    expect(find("Haus", "noun")).toBeDefined();
    expect(find("Haus", "noun")!.frequency!.perMillion).toBeCloseTo((120 / 540) * 1e6, -2);
    const tag = find("Tag", "noun")!;
    const tagen = find("tagen", "verb");
    expect(tag.frequency!.perMillion).toBeGreaterThan(tagen?.frequency?.perMillion ?? 0);
    expect(find("gehen", "verb")).toBeDefined();
  });
});
