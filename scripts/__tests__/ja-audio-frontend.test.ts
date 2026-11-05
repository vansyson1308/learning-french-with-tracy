/**
 * P4c Japanese audio front-end (plan/reports/P4c-ja-audio-frontend.md): kana → Kokoro phonemes (the table and
 * rules adapted from misaki 0.9.4 cutlet.py), the pronunciation spelling of long vowels, numbers with counters,
 * clip kana built from stored readings, and the plan → synth-script wiring (ja only; other languages unchanged).
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import path from "path";

import { frontendRecipeForEngine, frontendRecipeForVoices, packClipRecipe, phonemeFrontendProblems, phonemeFrontendSpec, phonemeFrontendTag, receptionClipRecipe, storyClipRecipe } from "../lib/audio-recipe";
import { packAssetKey } from "../lib/piper-audio";
import { listeningClipKey, loadListening, receptionAssetKey, receptionPipelineVersion, resolveClipSegments } from "../lib/reception";
import { buildSynthScript, loadEngines, type Voice } from "../lib/tts";
import { JA_FRONTEND_INPUTS, jaFrontendInputsSha256, staleFrontendMessage } from "../lib/tts/ja-frontend-inputs";
import { buildJaSpeechIndex, jaClipPhonemes, loadJaSpeechIndex, spokenReadingsProblems, spokenTokens, type JaLexemeLike, type SpokenReadingsDoc } from "../lib/tts/ja-kana";
import { countedKana, kanjiNumberValue, numberKana, phoneKana } from "../lib/tts/ja-numbers";
import { kanaToPhonemes, pronunciationKana, tokensToPhonemes } from "../lib/tts/ja-phonemes";
import { attachKokoroPhonemes, kokoroEngine, kokoroFrontend } from "../lib/tts/kokoro";

const ROOT = path.resolve(import.meta.dir, "../..");

describe("kanaToPhonemes (misaki 0.9.4 cutlet table)", () => {
  const cases: [string, string][] = [
    ["あ", "a"],
    ["か", "ka"],
    ["き", "kʲi"],
    ["し", "ɕi"],
    ["ち", "ʨi"],
    ["つ", "ʦɨ"],
    ["ふ", "ɸɯ"],
    ["す", "sɨ"],
    ["ら", "ɾa"],
    ["わ", "βa"],
    ["を", "o"],
    ["ん", "ɴ"],
    ["が", "ɡa"],
    ["ざ", "ʣa"],
    ["しゃしん", "ɕaɕiɴ"],
    ["ちゃ", "ʨa"],
    ["じゃ", "ʥa"],
    ["にゃ", "ɲa"],
    ["みゃく", "mʲakɯ"],
    ["りょこー", "ɾʲokoː"],
    ["ぴゃ", "pʲa"],
    ["きょー", "kʲoː"],
    ["きって", "kʲiʔte"],
    ["がっこー", "ɡaʔkoː"],
    ["ざっし", "ʣaʔɕi"],
    // ん assimilates to what follows: m before b/m/p, ŋ before k/ɡ, ɲ before ɲ/ʨ/ʥ, n before n/t/d/ɾ/z, ɴ elsewhere.
    ["しんぶん", "ɕimbɯɴ"],
    ["さんぽ", "sampo"],
    ["てんぷら", "tempɯɾa"],
    ["ほんもの", "hommono"],
    ["げんき", "ɡeŋkʲi"],
    ["りんご", "ɾʲiŋɡo"],
    ["こんにちは", "koɲɲiʨiha"],
    ["かんじ", "kaɲʥi"],
    ["ほんだ", "honda"],
    ["かんざし", "kaɴʣaɕi"],
    ["きんえん", "kʲiɴeɴ"],
    ["せんせー", "seɴseː"],
    // katakana loanwords (folded to hiragana as jaconv.kata2hira does), ー, small-vowel digraphs
    ["コーヒー", "koːçiː"],
    ["パーティー", "paːtʲiː"],
    ["ファイル", "ɸaiɾɯ"],
    ["ウィンドウ", "βindoɯ"],
    ["ヴァイオリン", "vaioɾʲiɴ"],
    ["チェック", "ʨeʔkɯ"],
    ["ジュース", "ʥɨːsɨ"],
    ["ディズニー", "dʲizɨɲiː"],
    ["ぎゅーにゅー", "ɡʲɨːɲɨː"],
    ["いすゞ", "isɨzɨ"],
  ];
  for (const [kana, ps] of cases) test(`${kana} → ${ps}`, () => expect(kanaToPhonemes(kana)).toBe(ps));
  test("at least 30 cases", () => expect(cases.length).toBeGreaterThanOrEqual(30));
  test("the IPA ɡ (U+0261) of the table, never an ASCII g", () => {
    expect(kanaToPhonemes("が").codePointAt(0)).toBe(0x261);
  });
  test("refuses anything that is not kana", () => {
    expect(() => kanaToPhonemes("学生")).toThrow("not kana");
    expect(() => kanaToPhonemes("abc")).toThrow("not kana");
  });
});

describe("pronunciationKana (UniDic's long-vowel spelling)", () => {
  const cases: [string, string, boolean?][] = [
    ["せんせい", "せんせー"],
    ["とうきょう", "とーきょー"],
    ["おかあさん", "おかーさん"],
    ["おおきい", "おーきー"],
    ["かわいい", "かわいー"],
    ["ゆうびん", "ゆーびん"],
    ["きれい", "きれー"],
    ["ぎゅうにゅう", "ぎゅーにゅー"],
    ["すいえい", "すいえー"],
    ["おもう", "おもう", true],
    ["おもう", "おもー"],
    ["いう", "いう"],
    ["かいしゃ", "かいしゃ"],
    ["あおい", "あおい"],
    ["コーヒー", "コーヒー"],
    ["ケイタイ", "ケイタイ"],
    ["きんえん", "きんえん"],
  ];
  for (const [kana, pron, keep] of cases) test(`${kana}${keep ? " (verb)" : ""} → ${pron}`, () => expect(pronunciationKana(kana, { keepFinalU: keep === true })).toBe(pron));
});

describe("tokensToPhonemes (cutlet token spacing)", () => {
  test("words spaced, closing punctuation glued", () => {
    expect(tokensToPhonemes([{ kind: "kana", kana: "わたし" }, { kind: "kana", kana: "わ" }, { kind: "kana", kana: "がくせー" }, { kind: "kana", kana: "です" }, { kind: "punct", text: "。" }])).toBe("βataɕi βa ɡakɯseː desɨ.");
  });
  test("no space next to ʔ", () => {
    expect(tokensToPhonemes([{ kind: "kana", kana: "いっ" }, { kind: "kana", kana: "て" }])).toBe("iʔte");
  });
  test("quotes: a space before 「, none inside", () => {
    expect(tokensToPhonemes([{ kind: "kana", kana: "に" }, { kind: "punct", text: "「" }, { kind: "kana", kana: "こんにちわ" }, { kind: "punct", text: "」" }, { kind: "kana", kana: "と" }])).toBe("ɲi “koɲɲiʨiβa” to");
  });
  test("question and comma", () => {
    expect(tokensToPhonemes([{ kind: "kana", kana: "はい" }, { kind: "punct", text: "、" }, { kind: "kana", kana: "です" }, { kind: "kana", kana: "か" }, { kind: "punct", text: "？" }])).toBe("hai, desɨ ka?");
  });
});

describe("numbers", () => {
  test("cardinals with the 百/千 sound changes", () => {
    expect([0, 10, 11, 24, 300, 600, 800, 1200, 3000, 8000, 10000, 72000].map(numberKana)).toEqual([
      "ぜろ", "じゅう", "じゅういち", "にじゅうよん", "さんびゃく", "ろっぴゃく", "はっぴゃく", "せんにひゃく", "さんぜん", "はっせん", "いちまん", "ななまんにせん",
    ]);
  });
  test("counters", () => {
    const read = (n: number, c: string) => countedKana(n, c);
    expect([read(4, "時"), read(7, "時"), read(9, "時"), read(10, "時"), read(4, "時間")]).toEqual(["よじ", "しちじ", "くじ", "じゅうじ", "よじかん"]);
    expect([read(1, "分"), read(3, "分"), read(5, "分"), read(10, "分"), read(20, "分")]).toEqual(["いっぷん", "さんぷん", "ごふん", "じゅっぷん", "にじゅっぷん"]);
    expect([read(4, "円"), read(300, "円"), read(1500, "円")]).toEqual(["よえん", "さんびゃくえん", "せんごひゃくえん"]);
    expect([read(1, "歳"), read(6, "歳"), read(8, "歳"), read(20, "歳"), read(22, "歳")]).toEqual(["いっさい", "ろくさい", "はっさい", "はたち", "にじゅうにさい"]);
    expect([read(1, "階"), read(3, "階"), read(1, "回"), read(6, "回"), read(1, "個")]).toEqual(["いっかい", "さんがい", "いっかい", "ろっかい", "いっこ"]);
    expect([read(1, "本"), read(2, "本"), read(3, "本"), read(1, "匹"), read(3, "匹")]).toEqual(["いっぽん", "にほん", "さんぼん", "いっぴき", "さんびき"]);
    expect([read(1, "人"), read(2, "人"), read(4, "人"), read(4, "月"), read(1, "つ"), read(2, "番"), read(12, "ページ")]).toEqual(["ひとり", "ふたり", "よにん", "しがつ", "ひとつ", "にばん", "じゅうにページ"]);
  });
  test("kanji numerals", () => {
    expect(["二十四", "三千五百", "七万二千", "十", "百", "二三"].map(kanjiNumberValue)).toEqual([24, 3500, 72000, 10, 100, null]);
  });
  test("phone numbers digit by digit", () => expect(phoneKana("080-12")).toBe("ぜろはちぜろ の いちにー"));
});

/** A small lexicon in the shape of content/ja/lexicon/lexemes.json. */
const LEX: JaLexemeLike[] = [
  { surface: "私", partOfSpeech: "pronoun", reading: { kana: "わたし", furigana: [{ base: "私", ruby: "わたし" }] } },
  { surface: "学生", partOfSpeech: "noun", reading: { kana: "がくせい", furigana: [{ base: "学", ruby: "がく" }, { base: "生", ruby: "せい" }] } },
  { surface: "です", partOfSpeech: "copula", reading: { kana: "です" } },
  { surface: "東京", partOfSpeech: "noun", reading: { kana: "とうきょう", furigana: [{ base: "東", ruby: "とう" }, { base: "京", ruby: "きょう" }] } },
  { surface: "行く", partOfSpeech: "verb", reading: { kana: "いく", furigana: [{ base: "行", ruby: "い" }, { base: "く" }] } },
  { surface: "食べる", legacySurfaces: ["たべます"], partOfSpeech: "verb", reading: { kana: "たべる", furigana: [{ base: "食", ruby: "た" }, { base: "べる" }] } },
  { surface: "思う", partOfSpeech: "verb", reading: { kana: "おもう", furigana: [{ base: "思", ruby: "おも" }, { base: "う" }] } },
  { surface: "読む", partOfSpeech: "verb", reading: { kana: "よむ", furigana: [{ base: "読", ruby: "よ" }, { base: "む" }] } },
  { surface: "本", partOfSpeech: "noun", reading: { kana: "ほん", furigana: [{ base: "本", ruby: "ほん" }] } },
  { surface: "学校", partOfSpeech: "noun", reading: { kana: "がっこう", furigana: [{ base: "学", ruby: "がっ" }, { base: "校", ruby: "こう" }] } },
  { surface: "名前", partOfSpeech: "noun", reading: { kana: "なまえ", furigana: [{ base: "名", ruby: "な" }, { base: "前", ruby: "まえ" }] } },
  { surface: "花", partOfSpeech: "noun", reading: { kana: "はな", furigana: [{ base: "花", ruby: "はな" }] } },
  { surface: "さん", partOfSpeech: "suffix", reading: { kana: "さん" } },
  { surface: "時", partOfSpeech: "noun", reading: { kana: "じ", furigana: [{ base: "時", ruby: "じ" }] } },
  { surface: "三つ", partOfSpeech: "noun", reading: { kana: "みっつ", furigana: [{ base: "三", ruby: "みっ" }, { base: "つ" }] } },
];
const INDEX = buildJaSpeechIndex(LEX);
const spoken = (text: string) => {
  const r = spokenTokens(text, INDEX);
  return r.ok ? r.kana : `ERROR ${r.error}`;
};
const phonemes = (text: string) => {
  const r = jaClipPhonemes(text, INDEX);
  return r.ok ? r.phonemes : `ERROR ${r.error}`;
};

describe("clip kana from stored readings", () => {
  test("a kanji sentence with the topic particle", () => {
    expect(spoken("私は学生です。")).toBe("わたし わ がくせー です .");
    expect(phonemes("私は学生です。")).toBe("βataɕi βa ɡakɯseː desɨ.");
  });
  test("へ and an inflected verb (inflection key + ending)", () => {
    expect(spoken("東京へ行きます。")).toBe("とーきょー え いきます .");
    expect(phonemes("東京へ行きます。")).toBe("toːkʲoː e ikʲimasɨ.");
  });
  test("を, a katakana word the lexicon lacks, and a past form", () => {
    expect(phonemes("パンを食べました。")).toBe("paɴ o tabemaɕita.");
    expect(phonemes("本を読みます")).toBe("hoɴ o jomʲimasɨ");
  });
  test("a legacy surface that is another form is not read as the lemma (たべます, not たべる)", () => {
    expect(spoken("たべます")).toBe("たべます");
  });
  test("a verb's dictionary form keeps its final う; a te-form geminates", () => {
    expect(phonemes("思う")).toBe("omoɯ");
    expect(phonemes("学校へ行って")).toBe("ɡaʔkoː e iʔte");
  });
  test("は after a word is the particle even where a kana word starts (名前|は|なん, not はな)", () => {
    expect(spoken("名前はなんですか")).toBe("なまえ わ なん です か");
  });
  test("は after a katakana name and after さん", () => {
    expect(spoken("ナムさんは学生です")).toBe("ナム さん わ がくせー です");
    expect(spoken("ナムは学生です")).toBe("ナム わ がくせー です");
  });
  test("set expressions read wa", () => expect(phonemes("こんにちは")).toBe("koɲɲiʨiβa"));
  test("numbers: digits with a counter, a kanji numeral with a counter, a stored counter word", () => {
    expect(phonemes("学校で3時に")).toBe("ɡaʔkoː de saɲʥi ɲi");
    expect(spoken("四時です")).toBe("よじ です");
    expect(spoken("三つです")).toBe("みっつ です");
  });
  test("a kanji with no stored reading is an error, never a guess", () => {
    const r = jaClipPhonemes("猫です。", INDEX);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("猫");
  });
  test("digits Kokoro cannot read and Latin letters are errors", () => {
    expect(phonemes("3.5です")).toContain("ERROR digits");
    expect(phonemes("ATMです")).toContain("ERROR Latin letters");
  });
});

describe("the audio supplement content/audio/ja-spoken-readings.json", () => {
  test("shape problems", () => {
    const doc: SpokenReadingsDoc = {
      version: 1,
      language: "ja",
      note: "x",
      readings: [
        { surface: "箸", partOfSpeech: "noun", kana: "はし" },
        { surface: "はし", partOfSpeech: "noun", kana: "はし" },
        { surface: "泊まる", partOfSpeech: "verb", kana: "とめる" },
        { surface: "私", partOfSpeech: "pronoun", kana: "watashi" },
      ],
    };
    const problems = spokenReadingsProblems(doc);
    expect(problems.some((p) => p.includes("はし: a kana word"))).toBe(true);
    expect(problems.some((p) => p.includes("泊まる") && p.includes("does not fit"))).toBe(true);
    expect(problems.some((p) => p.includes("私") && p.includes("not kana"))).toBe(true);
    expect(problems.some((p) => p.includes("箸"))).toBe(false);
  });
  test("the committed file is valid and every committed canary, listening and story sentence resolves", () => {
    const read = (rel: string) => JSON.parse(readFileSync(path.join(ROOT, rel), "utf8"));
    const loaded = loadJaSpeechIndex(read, (rel) => existsSync(path.join(ROOT, rel)));
    expect(loaded.problems).toEqual([]);
    const index = loaded.index!;
    const texts = [
      ...read("content/ja/reception/audio-canary.json").items.map((i: { text: string }) => i.text),
      ...read("content/ja/reception/listening.json").clips.flatMap((c: { segments: { text: string }[] }) => c.segments.map((s) => s.text)),
      ...read("content/ja/stories/stories.json").stories.flatMap((s: { sentences: { text: string }[] }) => s.sentences.map((x) => x.text)),
    ];
    const failures = texts.map((t) => [t, jaClipPhonemes(t, index)] as const).filter(([, r]) => !r.ok);
    expect(failures.map(([t, r]) => `${t}: ${r.ok ? "" : r.error}`)).toEqual([]);
  });
});

describe("plan → synth-script wiring (ja only)", () => {
  const engines = loadEngines();
  const file = { path: "voices/x.pt", sha256: null, bytes: null };
  const voice = (id: string, language: string): Voice => ({ id, engine: "kokoro", language, note: "", files: { voiceFile: file }, speaker: null, declaredDataset: null, declaredLicense: null, status: "selected", gateReason: null });
  const ja = voice("kokoro-jf_alpha", "ja");
  const es = voice("kokoro-ef_dora", "es");

  test("engines.json: ja (and zh, P4d) use the course-readings front-end; misaki is installed without extras", () => {
    expect(kokoroFrontend(engines, "ja")).toBe("course-readings");
    expect(kokoroFrontend(engines, "es")).toBeNull();
    expect(kokoroFrontend(engines, "zh")).toBe("course-readings");
    const install = engines.engines.kokoro.install.join(" ");
    expect(install).not.toContain("misaki[");
    expect(install).toContain('"misaki==0.9.4"');
    expect(install).not.toMatch(/unidic|pyopenjtalk|fugashi|jieba|pypinyin|cn2an/);
  });

  test("the plan attaches phonemes to ja Kokoro segments only", () => {
    const clips: { clipId: string; segments: { voiceId: string; text: string; phonemes?: string }[] }[] = [
      { clipId: "a", segments: [{ voiceId: ja.id, text: "私は学生です。" }] },
      { clipId: "b", segments: [{ voiceId: es.id, text: "Hola." }] },
    ];
    const out = attachKokoroPhonemes(clips, new Map([ja, es].map((v) => [v.id, v])), engines, () => ({ read: (t) => jaClipPhonemes(t, INDEX), problems: [] }));
    expect(out.problems).toEqual([]);
    expect(out.clips[0]!.segments[0]!.phonemes).toBe("βataɕi βa ɡakɯseː desɨ.");
    expect(out.clips[1]!.segments[0]).toEqual({ voiceId: es.id, text: "Hola." });
    expect(clips[0]!.segments[0]).toEqual({ voiceId: ja.id, text: "私は学生です。" });
    const bad = attachKokoroPhonemes([{ clipId: "c", segments: [{ voiceId: ja.id, text: "猫" }] }], new Map([[ja.id, ja]]), engines, () => ({ read: (t) => jaClipPhonemes(t, INDEX), problems: [] }));
    expect(bad.problems[0]).toContain("c:");
  });

  test("a ja voice synthesises from the plan's phonemes (--input phonemes); es is unchanged", () => {
    const script = buildSynthScript({
      clips: [
        { assetKey: "kja", pipelineVersion: 4, segments: [{ voiceId: ja.id, speaker: null, text: "私は学生です。", phonemes: "βataɕi βa ɡakɯseː desɨ." }] },
        { assetKey: "kes", pipelineVersion: 4, segments: [{ voiceId: es.id, speaker: null, text: "Hola." }] },
      ],
      voices: [ja, es],
      engines,
      downloadsDir: "/dl",
      wavDir: "/wav",
      outDir: "/out",
    });
    const jaLine = script.split("\n").find((l) => l.includes("kokoro-jf_alpha.voiceFile.1"))!;
    const esLine = script.split("\n").find((l) => l.includes("kokoro-ef_dora.voiceFile.1"))!;
    expect(jaLine).toContain("--lang-code 'j'");
    expect(jaLine).toContain("--input phonemes");
    expect(esLine).not.toContain("--input");
    expect(script).toContain('{"phonemes":"βataɕi βa ɡakɯseː desɨ.","text":"私は学生です。","out":"/wav/kja.seg0.wav"}');
    expect(script).toContain('{"text":"Hola.","out":"/wav/kes.seg0.wav"}');
  });

  test("a ja segment without phonemes fails the synth script (never falls back to misaki)", () => {
    expect(() => kokoroEngine.synthScript([{ voiceId: ja.id, speaker: null, text: "私", wavPath: "/w.wav" }], new Map([[ja.id, ja]]), "/dl", "/wav", engines)).toThrow("re-run plan");
  });
});

describe("re-render gate: the front-end version is part of every ja Kokoro key", () => {
  const readText = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");
  const spec = phonemeFrontendSpec("ja")!;
  const engines = loadEngines();

  test("engines.json declares ja's front-end with a version and the hash of its inputs", () => {
    expect(spec.id).toBe("course-readings");
    expect(phonemeFrontendProblems("ja", spec)).toEqual([]);
    expect(phonemeFrontendProblems("ja", { id: "course-readings", version: 0, inputsSha256: "x" })).toHaveLength(2);
    for (const rel of JA_FRONTEND_INPUTS) expect(existsSync(path.join(ROOT, rel)), rel).toBe(true);
  });

  test("the recorded inputsSha256 is the hash of the current readings, supplement and front-end sources", () => {
    const actual = jaFrontendInputsSha256(readText);
    // On failure: a reading, the supplement or a front-end table/rule changed, so blessed ja clips would keep the old pronunciation.
    if (actual !== spec.inputsSha256) throw new Error(staleFrontendMessage("ja", spec.inputsSha256, actual));
    expect(actual).toBe(spec.inputsSha256);
  });

  test("the hash moves with a reading and with a front-end source, not with a gloss", () => {
    const base = jaFrontendInputsSha256(readText);
    const lexicon = JSON.parse(readText("content/ja/lexicon/lexemes.json")) as { lexemes: { reading?: { kana?: string }; glosses?: Record<string, string> }[] };
    const withLexicon = (doc: unknown) => (rel: string) => (rel === "content/ja/lexicon/lexemes.json" ? JSON.stringify(doc) : readText(rel));
    const target = lexicon.lexemes.findIndex((l) => l.reading?.kana);
    const reread = { lexemes: lexicon.lexemes.map((l, i) => (i === target ? { ...l, reading: { ...l.reading, kana: `${l.reading!.kana}ー` } } : l)) };
    const reglossed = { lexemes: lexicon.lexemes.map((l, i) => (i === target ? { ...l, glosses: { ...l.glosses, vi: "khác" } } : l)) };
    expect(jaFrontendInputsSha256(withLexicon(reread))).not.toBe(base);
    expect(jaFrontendInputsSha256(withLexicon(reglossed))).toBe(base);
    expect(jaFrontendInputsSha256((rel) => (rel === "scripts/lib/tts/ja-phonemes.ts" ? `${readText(rel)}\n// x` : readText(rel)))).not.toBe(base);
    // Line endings are not an input (a Windows checkout hashes the same).
    expect(jaFrontendInputsSha256((rel) => readText(rel).replace(/\n/g, "\r\n"))).toBe(base);
  });

  test("ja keys carry the version: a bump re-keys pack, listening and story clips; other languages have no tag", () => {
    const tag = phonemeFrontendTag(spec);
    expect(tag).toBe(`phonemes=course-readings-v${spec.version}`);
    const bumped = { ...spec, version: spec.version + 1 };
    expect(frontendRecipeForEngine("ja", "kokoro")).toBe(tag);
    expect(frontendRecipeForEngine("ja", "kokoro", bumped)).not.toBe(tag);
    expect(frontendRecipeForEngine("ja", "melotts")).toBeNull();
    expect(packClipRecipe({ language: "ja", engine: "kokoro", text: "水", pipelineVersion: 3, synthesis: null })).toBe(tag);
    expect(packAssetKey("ja-vi", "kokoro-jf_alpha", null, "水", 3, tag)).not.toBe(packAssetKey("ja-vi", "kokoro-jf_alpha", null, "水", 3));
    expect(frontendRecipeForVoices("ja", ["kokoro-jf_alpha", "kokoro-jm_kumo"])).toBe(tag);
    expect(storyClipRecipe("ja", ["kokoro-jf_alpha"], "opus", engines.encoding)).toBe(`${tag}|opus-16k-lim3`);
    const listening = loadListening("ja")!;
    const clip = listening.clips[0]!;
    const segments = resolveClipSegments(listening, clip);
    // ja listening clips are Opus (encoding.codecByLanguage.ja; scripts/__tests__/ja-audio-opus.test.ts): the codec follows the front-end.
    expect(receptionClipRecipe("ja", clip.id, segments.map((s) => s.voiceId))).toBe(`${tag}|opus-16k-lim3`);
    expect(receptionClipRecipe("ja", clip.id, segments.map((s) => s.voiceId), null, "mp3")).toBe(tag);
    expect(listeningClipKey("ja", listening, clip)).toBe(receptionAssetKey("ja", segments, receptionPipelineVersion("ja"), `${tag}|opus-16k-lim3`));
    expect(listeningClipKey("ja", listening, clip)).not.toBe(receptionAssetKey("ja", segments, receptionPipelineVersion("ja"), `${phonemeFrontendTag(bumped)}|opus-16k-lim3`));
    for (const lang of ["fr", "de", "es", "en", "it", "pt", "ko"]) {
      expect(phonemeFrontendSpec(lang)).toBeNull();
      expect(frontendRecipeForEngine(lang, "kokoro")).toBeNull();
      expect(packClipRecipe({ language: lang, engine: "kokoro", text: "x y z w", pipelineVersion: 3, synthesis: null })).toBeNull();
      expect(receptionClipRecipe(lang, `${lang}.clip.none`, ["kokoro-ef_dora"], null)).toBeNull();
      expect(storyClipRecipe(lang, ["kokoro-ef_dora"], "mp3", engines.encoding)).toBeNull();
    }
  });
});
