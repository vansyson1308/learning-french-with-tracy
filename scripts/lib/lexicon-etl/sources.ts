/**
 * Source catalogue of the lexicon ETL v2 (P3a): every open dataset a
 * target language's derivation may read, with its official URL, licence,
 * registry id and role. Licence facts come from
 * plan/06-RESEARCH-OPEN-RESOURCES.md §1/§7 and are re-verified at fetch
 * time (the licence text of each retrieved source is captured under
 * content/<lang>/lexicon/sources/). A source whose licence is not on the
 * registry allowlist cannot be registered and therefore never ships:
 * GPL (FVDP/OVDP) and no-licence lists (Oxford 3000, Goethe Wortliste,
 * Cervantes PCIC) are deliberately absent.
 *
 * Filenames are fixed per source so the recon/extract steps, the workflow
 * and the local run all read the same scratch layout:
 *   <sources-dir>/<lang>/<artifactFilename>
 */

export type SourceRole =
  | "lexicon" // lemma / POS / forms / IPA / English glosses / examples (kaikki English edition)
  | "gloss-vi" // Vietnamese glosses + examples (kaikki Vietnamese edition)
  | "frequency" // primary frequency measurement (FrequencyWords)
  | "frequency-secondary" // wordfreq Zipf (exported at acquisition time by a pinned Python package)
  | "examples" // Tatoeba sentence pairs
  | "anchor" // exam / CEFR level lists
  | "dictionary"; // JMdict / CC-CEDICT readings + glosses

export type SourceSpec = {
  /** Registry id (content/sources/registry.json). */
  id: string;
  role: SourceRole;
  name: string;
  /** Registry licence id (must be allowlisted). */
  license: string;
  citation: string;
  /** Official download URL (never a mirror). */
  url: string;
  /** Scratch filename after download (and after decompression, when `decompress` is set). */
  artifactFilename: string;
  /** How the downloaded bytes are unpacked before parsing. */
  decompress?: "gzip" | "bzip2" | "tar.gz";
  /**
   * Raw artifacts above this size are NOT uploaded as workflow run
   * artifacts (GitHub quota); their identity (sha256, bytes) is still
   * pinned. Default: uploaded.
   */
  skipArtifactUpload?: boolean;
  /** Human notes on the licence / terms (quoted at fetch time into sources/<id>.md). */
  notes: string;
};

const KAIKKI_CITATION =
  "Ylonen, T. (2022). Wiktextract: Wiktionary as Machine-Readable Structured Data. Proceedings of the 13th Conference on Language Resources and Evaluation (LREC), pp. 1395–1403. Data: https://kaikki.org/dictionary/ (Wiktionary, CC BY-SA 4.0 / GFDL).";
const FREQUENCYWORDS_CITATION =
  "hermitdave/FrequencyWords — word frequency lists derived from OpenSubtitles2018 (content CC BY-SA 4.0, code MIT). https://github.com/hermitdave/FrequencyWords";
const WORDFREQ_CITATION =
  "Speer, R. (2022). rspeer/wordfreq: v3.0 (v3.0.2). Zenodo. https://doi.org/10.5281/zenodo.7199437 — data CC BY-SA 4.0 (includes Google Books Ngram and SUBTLEX components; see the package README for their acknowledgements).";
const TATOEBA_CITATION =
  "Tatoeba Project — sentences and translation links (CC BY 2.0 FR; per-sentence attribution to contributors). https://tatoeba.org/en/downloads";

/** kaikki English-edition dump per language (name as kaikki spells it). */
function kaikkiEn(lang: string, kaikkiName: string, skipUpload = true): SourceSpec {
  return {
    id: "kaikki-en",
    role: "lexicon",
    name: `kaikki.org Wiktextract — ${kaikkiName} (English Wiktionary edition)`,
    license: "CC-BY-SA-4.0",
    citation: KAIKKI_CITATION,
    url: `https://kaikki.org/dictionary/${encodeURIComponent(kaikkiName)}/kaikki.org-dictionary-${encodeURIComponent(kaikkiName)}.jsonl`,
    artifactFilename: `kaikki-en-${lang}.jsonl`,
    skipArtifactUpload: skipUpload,
    notes:
      "Wiktionary content under CC BY-SA 4.0 (and GFDL); used under CC BY-SA 4.0 with attribution to Wiktionary contributors and kaikki.org. Per-entry provenance is the word|pos key in sourceRefs.",
  };
}

/** kaikki Vietnamese-edition dump per language (page name in Vietnamese). */
function kaikkiVi(lang: string, viName: string, skipUpload = false): SourceSpec {
  const file = viName.replace(/ /g, "");
  return {
    id: "kaikki-vi",
    role: "gloss-vi",
    name: `kaikki.org Wiktextract — ${viName} (Vietnamese Wiktionary edition)`,
    license: "CC-BY-SA-4.0",
    citation: KAIKKI_CITATION,
    url: `https://kaikki.org/viwiktionary/${encodeURIComponent(viName)}/kaikki.org-dictionary-${encodeURIComponent(file)}.jsonl`,
    artifactFilename: `kaikki-vi-${lang}.jsonl`,
    skipArtifactUpload: skipUpload,
    notes:
      "Vietnamese Wiktionary content under CC BY-SA 4.0; the Vietnamese senses are the primary native glosses. Entries whose sense text only redirects (\"Xem …\") are skipped.",
  };
}

function frequencyWords(lang: string, path: string): SourceSpec {
  return {
    id: "frequencywords",
    role: "frequency",
    name: "FrequencyWords (OpenSubtitles 2018 word frequencies)",
    license: "CC-BY-SA-4.0",
    citation: FREQUENCYWORDS_CITATION,
    url: `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/${path}`,
    artifactFilename: `frequencywords-${lang}.txt`,
    notes:
      "README: \"MIT License for code, CC-by-sa-4.0 for content\". Only the derived counts are used; per-million values are relative to the list total (documented in frequency-stats.json).",
  };
}

function wordfreq(lang: string): SourceSpec {
  return {
    id: "wordfreq",
    role: "frequency-secondary",
    name: "wordfreq 3.1.1 (Zipf frequencies)",
    license: "CC-BY-SA-4.0",
    citation: WORDFREQ_CITATION,
    url: "https://pypi.org/project/wordfreq/3.1.1/",
    artifactFilename: `wordfreq-${lang}.csv`,
    notes:
      "Exported at acquisition time by scripts/lexicon-etl/export-wordfreq.py from the pinned PyPI package (data CC BY-SA 4.0, code Apache-2.0); the export is `word,zipf` for the top 50,000 words of the `large` list when available. The author discourages dumps that strip attribution — the citation ships in ATTRIBUTIONS.md.",
  };
}

function tatoeba(lang: string, iso3: string, what: "sentences" | "links-vi" | "links-en"): SourceSpec {
  const file =
    what === "sentences"
      ? `${iso3}_sentences_detailed.tsv.bz2`
      : what === "links-vi"
        ? `${iso3}-vie_links.tsv.bz2`
        : `${iso3}-eng_links.tsv.bz2`;
  return {
    id: "tatoeba",
    role: "examples",
    name: `Tatoeba — ${what === "sentences" ? `${iso3} sentences (detailed export)` : what === "links-vi" ? `${iso3}–vie links` : `${iso3}–eng links`}`,
    license: "CC-BY-2.0-FR",
    citation: TATOEBA_CITATION,
    url: `https://downloads.tatoeba.org/exports/per_language/${iso3}/${file}`,
    artifactFilename: `tatoeba-${lang}-${what}.tsv`,
    decompress: "bzip2",
    notes:
      "Sentence text under CC BY 2.0 FR; the detailed export carries the contributor username, recorded per example in derived/tatoeba-credits.json. Audio is never used (per-contributor licences).",
  };
}

const TATOEBA_VI_SENTENCES: SourceSpec = {
  id: "tatoeba",
  role: "examples",
  name: "Tatoeba — vie sentences (detailed export)",
  license: "CC-BY-2.0-FR",
  citation: TATOEBA_CITATION,
  url: "https://downloads.tatoeba.org/exports/per_language/vie/vie_sentences_detailed.tsv.bz2",
  artifactFilename: "tatoeba-vie-sentences.tsv",
  decompress: "bzip2",
  notes: "Vietnamese side of the Tatoeba links (same licence terms).",
};

const TATOEBA_EN_SENTENCES: SourceSpec = {
  id: "tatoeba",
  role: "examples",
  name: "Tatoeba — eng sentences (detailed export)",
  license: "CC-BY-2.0-FR",
  citation: TATOEBA_CITATION,
  url: "https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences_detailed.tsv.bz2",
  artifactFilename: "tatoeba-eng-sentences.tsv",
  decompress: "bzip2",
  skipArtifactUpload: true,
  notes: "English side of the Tatoeba links (same licence terms).",
};

const OPENJLPT: SourceSpec = {
  id: "openjlpt",
  role: "anchor",
  name: "OpenJLPT 0.1.0 (JLPT N5–N1 vocabulary, level labels from Jonathan Waller's lists)",
  license: "CC-BY-SA-4.0",
  citation:
    "OpenJLPT 0.1.0 (CC BY-SA 4.0), https://github.com/evanclan/OpenJLPT — levels from Jonathan Waller's JLPT resources (CC BY), readings/glosses via JMdict (EDRDG, CC BY-SA 4.0), examples from Tatoeba (CC BY 2.0 FR).",
  url: "https://files.pythonhosted.org/packages/db/ff/aa9e17790d5c7f8a5354758942782f13c942767b46d5cbd3067147f7e94f/openjlpt-0.1.0.tar.gz",
  artifactFilename: "openjlpt-0.1.0.tar.gz",
  decompress: "tar.gz",
  notes:
    "The JLPT publishes no official lists; OpenJLPT's N5–N1 groupings are the community-standard Waller lists (NOTICE.md). Used for the N5/N4 anchor levels only.",
};

const HSK30: SourceSpec = {
  id: "hsk30",
  role: "anchor",
  name: "ivankra/hsk30 — HSK 3.0 vocabulary levels (2021 standard)",
  license: "MIT",
  citation: "ivankra/hsk30 (MIT), https://github.com/ivankra/hsk30 — transcription of the HSK 3.0 standard published by the PRC Ministry of Education.",
  url: "https://raw.githubusercontent.com/ivankra/hsk30/master/hsk30.csv",
  artifactFilename: "hsk30.csv",
  notes:
    "Level labels are facts about the standard; entries are regenerated from CC-CEDICT / kaikki, never copied from the list. The README's copyright caveat (Ministry site asserts copyright; data may be public domain under PRC law) is recorded here.",
};

const JMDICT: SourceSpec = {
  id: "jmdict",
  role: "dictionary",
  name: "JMdict (EDRDG) — Japanese–English dictionary (JMdict_e)",
  license: "CC-BY-SA-4.0",
  citation:
    "JMdict — Electronic Dictionary Research and Development Group (EDRDG), CC BY-SA 4.0, https://www.edrdg.org/jmdict/j_jmdict.html; licence statement https://www.edrdg.org/edrdg/licence.html",
  url: "https://www.edrdg.org/pub/Nihongo/JMdict_e.gz",
  artifactFilename: "JMdict_e.xml",
  decompress: "gzip",
  notes:
    "EDRDG licence: attribution on a separate About/Sources screen of the app (not only a launch screen) and the licence files included or linked — the Licences screen lists this entry. Readings (r_ele) and English senses used.",
};

const CEDICT: SourceSpec = {
  id: "cedict",
  role: "dictionary",
  name: "CC-CEDICT (MDBG) — Chinese–English dictionary",
  license: "CC-BY-SA-4.0",
  citation: "CC-CEDICT, community maintained, published by MDBG under CC BY-SA 4.0, https://www.mdbg.net/chinese/dictionary?page=cedict",
  url: "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz",
  artifactFilename: "cedict.txt",
  decompress: "gzip",
  notes: "The 2026 export header states CC BY-SA 4.0. Pinyin (numbered tones, converted to tone marks at derivation) and English senses used.",
};

const CEFRJ: SourceSpec = {
  id: "cefr-j",
  role: "anchor",
  name: "CEFR-J Vocabulary Profile 1.5 (Tono Lab, TUFS) via Open Language Profiles",
  license: "CEFR-J-terms",
  citation:
    "The CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies. Retrieved via https://github.com/openlanguageprofiles/olp-en-cefrj (cefrj-vocabulary-profile-1.5.csv).",
  url: "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv",
  artifactFilename: "cefrj-vocabulary-profile-1.5.csv",
  notes:
    "Terms of use (olp-en-cefrj README): \"can be used for research and commercial purposes with no charge, provided that you cite the dataset properly\"; copyright Tono Laboratory, TUFS. Used as a build-time selection anchor (level labels) only — no CEFR-J text ships.",
};

const NGSL: SourceSpec = {
  id: "ngsl",
  role: "anchor",
  name: "New General Service List 1.2 (Browne, Culligan & Phillips) — frequency statistics",
  license: "CC-BY-SA-4.0",
  citation: "Browne, C., Culligan, B. & Phillips, J. (2013). The New General Service List 1.2 (CC BY-SA 4.0). https://www.newgeneralservicelist.com/new-general-service-list",
  url: "https://www.newgeneralservicelist.com/s/NGSL_12_stats.csv",
  artifactFilename: "ngsl-1.2-stats.csv",
  notes: "Lemma, SFI rank, SFI, adjusted frequency per million. Used as the English rank anchor.",
};

/** ISO 639-3 codes Tatoeba uses for the per-language exports. */
export const TATOEBA_ISO3: Record<string, string> = {
  es: "spa",
  de: "deu",
  it: "ita",
  pt: "por",
  ja: "jpn",
  ko: "kor",
  zh: "cmn",
  en: "eng",
  fr: "fra",
};

/** Every source a language's derivation reads, in catalogue order. */
export const LEXICON_SOURCES: Record<string, SourceSpec[]> = {
  es: [kaikkiEn("es", "Spanish"), kaikkiVi("es", "Tiếng Tây Ban Nha"), frequencyWords("es", "2018/es/es_50k.txt"), wordfreq("es"), tatoeba("es", "spa", "sentences"), tatoeba("es", "spa", "links-en"), tatoeba("es", "spa", "links-vi"), TATOEBA_EN_SENTENCES, TATOEBA_VI_SENTENCES],
  de: [kaikkiEn("de", "German"), kaikkiVi("de", "Tiếng Đức"), frequencyWords("de", "2018/de/de_50k.txt"), wordfreq("de"), tatoeba("de", "deu", "sentences"), tatoeba("de", "deu", "links-en"), tatoeba("de", "deu", "links-vi"), TATOEBA_EN_SENTENCES, TATOEBA_VI_SENTENCES],
  it: [kaikkiEn("it", "Italian"), kaikkiVi("it", "Tiếng Ý"), frequencyWords("it", "2018/it/it_50k.txt"), wordfreq("it"), tatoeba("it", "ita", "sentences"), tatoeba("it", "ita", "links-en"), tatoeba("it", "ita", "links-vi"), TATOEBA_EN_SENTENCES, TATOEBA_VI_SENTENCES],
  // Brazilian Portuguese is the course variety (content and voice, see BUILD_LANGUAGES).
  pt: [kaikkiEn("pt", "Portuguese"), kaikkiVi("pt", "Tiếng Bồ Đào Nha"), frequencyWords("pt", "2018/pt_br/pt_br_50k.txt"), wordfreq("pt"), tatoeba("pt", "por", "sentences"), tatoeba("pt", "por", "links-en"), tatoeba("pt", "por", "links-vi"), TATOEBA_EN_SENTENCES, TATOEBA_VI_SENTENCES],
  ja: [kaikkiEn("ja", "Japanese"), kaikkiVi("ja", "Tiếng Nhật"), frequencyWords("ja", "2018/ja/ja_full.txt"), wordfreq("ja"), OPENJLPT, JMDICT, tatoeba("ja", "jpn", "sentences"), tatoeba("ja", "jpn", "links-en"), tatoeba("ja", "jpn", "links-vi"), TATOEBA_EN_SENTENCES, TATOEBA_VI_SENTENCES],
  // The Vietnamese Wiktionary has no Korean extract on kaikki (checked 2026-10-15); glosses stay TODO:vi until P4e.
  ko: [kaikkiEn("ko", "Korean"), frequencyWords("ko", "2018/ko/ko_50k.txt"), wordfreq("ko"), tatoeba("ko", "kor", "sentences"), tatoeba("ko", "kor", "links-en"), tatoeba("ko", "kor", "links-vi"), TATOEBA_EN_SENTENCES, TATOEBA_VI_SENTENCES],
  zh: [kaikkiEn("zh", "Chinese"), kaikkiVi("zh", "Tiếng Trung Quốc"), frequencyWords("zh", "2018/zh_cn/zh_cn_full.txt"), wordfreq("zh"), HSK30, CEDICT, tatoeba("zh", "cmn", "sentences"), tatoeba("zh", "cmn", "links-en"), tatoeba("zh", "cmn", "links-vi"), TATOEBA_EN_SENTENCES, TATOEBA_VI_SENTENCES],
  en: [kaikkiEn("en", "English"), kaikkiVi("en", "Tiếng Anh", true), frequencyWords("en", "2018/en/en_50k.txt"), wordfreq("en"), CEFRJ, NGSL, tatoeba("en", "eng", "sentences"), tatoeba("en", "eng", "links-vi"), TATOEBA_VI_SENTENCES],
};

/** Sources the research names but no machine-fetchable, licence-confirmed artifact exists for (recorded, never guessed). */
export const DECLARED_NOT_RETRIEVED: Record<string, { id: string; name: string; reason: string }[]> = {
  pt: [
    {
      id: "subtlex-pt",
      name: "SUBTLEX-PT (Soares et al. 2015, CC BY)",
      reason: "No stable public download URL was found at acquisition time (the Lingua Libre template page lists the citation only); FrequencyWords pt_br + wordfreq pt serve as the frequency sources until the owner supplies the file.",
    },
  ],
  ko: [
    {
      id: "nikl-learner-list",
      name: "NIKL 한국어 학습용 어휘 목록 (KOGL Type 1)",
      reason: "korean.go.kr answers HTTP 403 to non-browser downloads; the list must be downloaded by hand (owner action) and placed as sources/ko/nikl-learner-list.tsv before the Korean anchors can be derived.",
    },
  ],
};

export function sourcesFor(lang: string): SourceSpec[] {
  const list = LEXICON_SOURCES[lang];
  if (!list) throw new Error(`no lexicon sources are catalogued for "${lang}"`);
  return list;
}

export function sourceById(lang: string, id: string): SourceSpec | undefined {
  return sourcesFor(lang).find((s) => s.id === id);
}

/** Distinct source ids (several Tatoeba files share one registry id). */
export function sourceIdsFor(lang: string): string[] {
  return [...new Set(sourcesFor(lang).map((s) => s.id))];
}
