/**
 * P4d Mandarin audio front-end (plan/reports/P4d-zh-audio-frontend.md): the tone sandhi for audio over stored citation
 * tones (scripts/lib/zh-sandhi.ts phraseSandhiTones), pinyin → Kokoro phonemes (the table and tone arrows adapted from
 * misaki 0.9.4 transcription.py + zh.py), clip pinyin built from the course's stored readings, and the plan → synth
 * wiring (zh by the plan's phonemes; every other language unchanged).
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import path from "path";

import { frontendRecipeForEngine, frontendRecipeForVoices, packClipRecipe, phonemeFrontendProblems, phonemeFrontendSpec, phonemeFrontendTag, storyClipRecipe } from "../lib/audio-recipe";
import { packAssetKey } from "../lib/piper-audio";
import { buildSynthScript, loadEngines, type Voice } from "../lib/tts";
import { courseReadingsReader, frontendInputsSha256 } from "../lib/tts/frontends";
import { staleFrontendMessage } from "../lib/tts/ja-frontend-inputs";
import { attachKokoroPhonemes, kokoroEngine, kokoroFrontend } from "../lib/tts/kokoro";
import { ZH_FRONTEND_INPUTS, zhFrontendInputsSha256 } from "../lib/tts/zh-frontend-inputs";
import { chineseCardinal, spellArabicNumbers } from "../lib/tts/zh-numbers";
import { strictInitialFinal, syllablePhonemes } from "../lib/tts/zh-phonemes";
import { buildZhSpeechIndex, loadZhSpeechIndex, wordParts, zhClipPhonemes, zhSaidPieces, saidPinyin, type ZhLexemeLike } from "../lib/tts/zh-readings";
import { phraseSandhiTones } from "../lib/zh-sandhi";

const ROOT = path.resolve(import.meta.dir, "../..");

/** A small lexicon in the shape of content/zh/lexicon/lexemes.json (citation tones, CC-CEDICT style). */
const LEX: ZhLexemeLike[] = (
  [
    ["你", "nǐ"], ["好", "hǎo"], ["你好", "nǐ hǎo"], ["我", "wǒ"], ["很", "hěn"], ["也", "yě"], ["有", "yǒu"], ["买", "mǎi"],
    ["小", "xiǎo"], ["老虎", "lǎo hǔ"], ["展览", "zhǎn lǎn"], ["展览馆", "zhǎn lǎn guǎn"], ["纸老虎", "zhǐ lǎo hǔ"], ["水果", "shuǐ guǒ"],
    ["不", "bù"], ["是", "shì"], ["对", "duì"], ["不对", "bù duì"], ["去", "qù"], ["不要", "bù yào"], ["来", "lái"], ["吃", "chī"],
    ["一", "yī"], ["个", "gè"], ["一样", "yī yàng"], ["天", "tiān"], ["年", "nián"], ["一起", "yī qǐ"], ["一下", "yī xià"], ["第", "dì"],
    ["十", "shí"], ["月", "yuè"], ["号", "hào"], ["统一", "tǒng yī"], ["星期", "xīng qī"], ["星期一", "xīng qī yī"], ["百", "bǎi"],
    ["二", "èr"], ["三", "sān"], ["五", "wǔ"], ["零", "líng"], ["两", "liǎng"], ["本", "běn"], ["书", "shū"], ["块", "kuài"],
    ["的", "de"], ["了", "le"], ["吗", "ma"], ["们", "men"], ["我们", "wǒ men"], ["桌子", "zhuō zi"], ["对不起", "duì bu qǐ"],
    ["哪儿", "nǎ r"], ["一点儿", "yī diǎn r"], ["玩儿", "wán r"], ["水", "shuǐ"], ["中国", "Zhōng guó"], ["绿", "lǜ"], ["女", "nǚ"],
    ["学", "xué"], ["日", "rì"], ["字", "zì"], ["二十", "èr shí"],
  ] as const
).map(([surface, pinyin]) => ({ surface, reading: { pinyin } }));
const INDEX = buildZhSpeechIndex(LEX);

/** The said pinyin (tone numbers, 5 = neutral, words spaced) of a clip, or the error. */
const said = (text: string) => {
  const r = zhSaidPieces(text, INDEX);
  return r.ok ? saidPinyin(r.pieces) : `ERROR ${r.error}`;
};
const phonemes = (text: string) => {
  const r = zhClipPhonemes(text, INDEX);
  return r.ok ? r.phonemes : `ERROR ${r.error}`;
};

describe("tone sandhi for audio (phraseSandhiTones through the stored words)", () => {
  const cases: [string, string, string][] = [
    // third tone before third tone; runs by word structure
    ["你好", "ni2hao3", "3-3 inside a stored word"],
    ["很好", "hen2 hao3", "3-3 across two words"],
    ["我很好", "wo2 hen2 hao3", "a run of three single-syllable words rises on all but the last"],
    ["我也很好", "wo2 ye3 hen2 hao3", "four single-syllable words: two feet (我也|很好)"],
    ["我有两本书", "wo2 you3 liang2 ben3 shu1", "a stray third syllable joins the last foot (我有|两本书)"],
    ["展览馆", "zhan2lan2guan3", "2+1 (展览|馆): both rise"],
    ["小老虎", "xiao3 lao2hu3", "1+2 (小|老虎): 老 rises inside 老虎, 小 keeps its third tone"],
    ["纸老虎", "zhi3lao2hu3", "a stored 1+2 word splits at its stored last part"],
    ["我买水果", "wo2 mai3 shui2guo3", "a word's own sandhi first, then across words"],
    ["你好吗", "ni2hao3 ma5", "a neutral tone stops the run"],
    // 不
    ["不是", "bu2 shi4", "不 before a fourth tone"],
    ["不对", "bu2dui4", "不 inside a stored word"],
    ["不去", "bu2 qu4", "不 before 去"],
    ["不要", "bu2yao4", "不要"],
    ["不好", "bu4 hao3", "不 stays bù before a third tone"],
    ["不来", "bu4 lai2", "不 stays bù before a second tone"],
    ["不吃", "bu4 chi1", "不 stays bù before a first tone"],
    ["对不起", "dui4bu5qi3", "a stored neutral 不 is left alone"],
    // 一
    ["一个", "yi2 ge4", "一 before a fourth tone"],
    ["一样", "yi2yang4", "一样"],
    ["一下", "yi2xia4", "一下"],
    ["一天", "yi4 tian1", "一 before a first tone"],
    ["一年", "yi4 nian2", "一 before a second tone"],
    ["一起", "yi4qi3", "一 before a third tone"],
    ["第一", "di4 yi1", "an ordinal keeps yī"],
    ["十一", "shi2 yi1", "after a numeral, and at the end"],
    ["一月", "yi1 yue4", "before a date unit"],
    ["统一", "tong3yi1", "at the end of a word"],
    ["星期一我去", "xing1qi1yi1 wo3 qu4", "ending a stored word, whatever follows"],
    ["一百", "yi4 bai3", "a hundred takes the sandhi"],
    // neutral tones kept
    ["我们的", "wo3men5 de5", "们 and 的 stay neutral, and 我 before a neutral keeps its tone"],
    ["我买了", "wo2 mai3 le5", "了 stays neutral"],
    ["桌子", "zhuo1zi5", "子 stays neutral"],
    // 儿化 takes no part in the sandhi
    ["哪儿有", "nar2 you3", "哪儿 before a third tone"],
    ["一点儿", "yi4dianr3", "一 before 点 (儿 set aside)"],
    // punctuation ends a phrase
    ["你，好", "ni3 , hao3", "no sandhi across a comma"],
  ];
  for (const [text, expected, why] of cases) test(`${text} → ${expected} (${why})`, () => expect(said(text)).toBe(expected));
  test("at least 25 sandhi cases", () => expect(cases.length).toBeGreaterThanOrEqual(25));

  test("the primer's flat rule is unchanged where the structure agrees (sandhiTones of the tone primer)", () => {
    expect(phraseSandhiTones([{ hanzi: "我", syllables: [{ base: "wo", tone: 3 }] }, { hanzi: "很", syllables: [{ base: "hen", tone: 3 }] }, { hanzi: "好", syllables: [{ base: "hao", tone: 3 }] }])).toEqual([[2], [2], [3]]);
  });
  test("parts that do not cover the word are ignored (the word is read as a run)", () => {
    const run = [{ base: "zhan", tone: 3 }, { base: "lan", tone: 3 }, { base: "guan", tone: 3 }];
    expect(phraseSandhiTones([{ hanzi: "展览馆", syllables: run, parts: [1, 1] }])).toEqual([[2, 2, 3]]);
    expect(phraseSandhiTones([{ hanzi: "展览馆", syllables: run, parts: [1, 2] }])).toEqual([[3, 2, 3]]);
  });
  test("a word whose hanzi and syllables differ in length is refused", () => {
    expect(() => phraseSandhiTones([{ hanzi: "你好", syllables: [{ base: "ni", tone: 3 }] }])).toThrow("2 hanzi for 1 syllables");
  });
  test("wordParts: the longest stored first part, else the longest stored last part", () => {
    expect(wordParts("展览馆", INDEX)).toEqual([2, 1]);
    expect(wordParts("纸老虎", INDEX)).toEqual([1, 2]);
    expect(wordParts("你好", INDEX)).toBeUndefined();
  });
});

describe("pinyin → Kokoro phonemes (misaki 0.9.4 pinyin_to_ipa + retone)", () => {
  const cases: [string, number, string][] = [
    ["ni", 3, "ni↓"],
    ["hao", 3, "xau↓"],
    ["ma", 1, "ma→"],
    ["ma", 2, "ma↗"],
    ["ma", 4, "ma↘"],
    ["ma", 0, "ma"],
    ["shi", 4, "ʂɨ↘"],
    ["ri", 4, "ɻɨ↘"],
    ["chi", 1, "ꭧʰɨ→"],
    ["zi", 0, "ʦɨ"],
    ["ci", 2, "ʦʰɨ↗"],
    ["zhong", 1, "ꭧʊ→ŋ"],
    ["guo", 2, "kwo↗"],
    ["xue", 2, "ɕɥe↗"],
    ["lv", 4, "ly↘"],
    ["nv", 3, "ny↓"],
    ["qu", 4, "ʨʰy↘"],
    ["xuan", 3, "ɕɥɛ↓n"],
    ["yun", 2, "y↗n"],
    ["yue", 4, "ɥe↘"],
    ["yi", 1, "i→"],
    ["you", 3, "jou↓"],
    ["yang", 4, "ja↘ŋ"],
    ["wu", 3, "u↓"],
    ["wei", 4, "wei↘"],
    ["wo", 3, "wo↓"],
    ["liu", 2, "ljou↗"],
    ["dui", 4, "twei↘"],
    ["dun", 4, "twə↘n"],
    ["tian", 1, "tʰjɛ→n"],
    ["bo", 2, "pwo↗"],
    ["e", 4, "ɤ↘"],
    ["er", 4, "ɚ↘"],
    ["de", 0, "tɤ"],
    ["men", 0, "mən"],
    ["jiong", 3, "ʨjʊ↓ŋ"],
    ["n", 2, "n↗"],
  ];
  for (const [base, tone, ps] of cases) test(`${base}${tone === 0 ? 5 : tone} → ${ps}`, () => expect(syllablePhonemes(base, tone)).toBe(ps));
  test("at least 15 syllable cases", () => expect(cases.length).toBeGreaterThanOrEqual(15));
  test("ꭧ is U+AB67 (tʂ) and the U+032F / U+0329 marks never reach the output", () => {
    expect(syllablePhonemes("zhi", 1)!.codePointAt(0)).toBe(0xab67);
    for (const [b, t] of [["hao", 3], ["lai", 2], ["shi", 4], ["si", 4], ["mei", 2], ["zou", 3]] as const) expect(syllablePhonemes(b, t)!).not.toMatch(/[̯̩]/u);
  });
  test("pypinyin's strict split: y and w are not initials, u after j q x is ü, iu ui un are iou uei uen", () => {
    expect(strictInitialFinal("yi")).toEqual({ initial: null, final: "i" });
    expect(strictInitialFinal("yuan")).toEqual({ initial: null, final: "üan" });
    expect(strictInitialFinal("wen")).toEqual({ initial: null, final: "uen" });
    expect(strictInitialFinal("ju")).toEqual({ initial: "j", final: "ü" });
    expect(strictInitialFinal("niu")).toEqual({ initial: "n", final: "iou" });
    expect(strictInitialFinal("gui")).toEqual({ initial: "g", final: "uei" });
    expect(strictInitialFinal("lun")).toEqual({ initial: "l", final: "uen" });
    expect(strictInitialFinal("zhuang")).toEqual({ initial: "zh", final: "uang" });
  });
  test("a syllable pinyin does not spell, or a tone out of range, is refused", () => {
    expect(syllablePhonemes("xyz", 1)).toBeNull();
    expect(syllablePhonemes("ma", 5)).toBeNull();
  });
});

describe("clip pinyin and phonemes from stored readings", () => {
  test("a sentence: words spaced, closing marks glued", () => {
    expect(phonemes("你好！")).toBe("ni↗xau↓!");
    expect(phonemes("我很好。")).toBe("wo↗ xə↗n xau↓.");
  });
  test("measure words and digits: 2 → 两 before a measure word, 1个 yí gè, 100块 yì bǎi", () => {
    expect(said("我有2本书。")).toBe("wo2 you3 liang2 ben3 shu1 .");
    expect(said("1个")).toBe("yi2 ge4");
    expect(said("100块")).toBe("yi4 bai3 kuai4");
    expect(said("我11月去")).toBe("wo3 shi2 yi1 yue4 qu4");
    expect(said("第1")).toBe("di4 yi1");
    expect(said("20个")).toBe("er4shi2 ge4");
  });
  test("了 and a measure word in one clip", () => {
    expect(said("我买了一本书。")).toBe("wo2 mai3 le5 yi4 ben3 shu1 .");
    expect(phonemes("我买了一本书。")).toBe("wo↗ mai↓ lɤ i↘ pə↓n ʂu→.");
  });
  test("儿化: written onto the syllable before it, replacing its -n", () => {
    expect(phonemes("哪儿")).toBe("na↓ɚ");
    expect(phonemes("一点儿")).toBe("i↘tjɛ↓ɚ");
    expect(phonemes("玩儿")).toBe("wa↗ɚ");
  });
  test("a capitalised proper-noun reading is read like any other", () => expect(phonemes("中国")).toBe("ꭧʊ→ŋkwo↗"));
  test("fullwidth punctuation maps to the Kokoro marks; a phrase break stops the sandhi", () => {
    expect(phonemes("你好，我很好？")).toBe("ni↗xau↓, wo↗ xə↗n xau↓?");
  });
  test("a hanzi without a stored reading is an error, never a guess", () => {
    const r = zhClipPhonemes("我喜欢猫。", INDEX);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("喜欢猫");
  });
  test("Latin letters, decimals, times and leading zeros are errors", () => {
    expect(phonemes("我有ATM")).toContain("ERROR");
    expect(phonemes("3.5块")).toContain("ERROR the number");
    expect(phonemes("8:30")).toContain("ERROR the number");
    expect(phonemes("8：30")).toContain("ERROR the number");
    expect(phonemes("0123")).toContain("digits said one by one");
  });
  test("a stored reading that does not give one syllable per hanzi is an error", () => {
    const bad = buildZhSpeechIndex([{ surface: "你好", reading: { pinyin: "nǐhǎo" } }]);
    const r = zhClipPhonemes("你好", bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("one syllable per hanzi");
  });
});

describe("numbers in hanzi", () => {
  test("cardinals", () => {
    expect([0, 2, 10, 11, 15, 20, 21, 100, 110, 1005, 2000, 10500, 20000, 150000].map(chineseCardinal)).toEqual([
      "零", "二", "十", "十一", "十五", "二十", "二十一", "一百", "一百一十", "一千零五", "两千", "一万零五百", "两万", "十五万",
    ]);
    expect(chineseCardinal(1e8)).toBeNull();
  });
  test("a four-digit year before 年 is said digit by digit; 2 before a measure word is 两", () => {
    expect(spellArabicNumbers("2026年")).toEqual({ ok: true, text: "二零二六年" });
    expect(spellArabicNumbers("3年")).toEqual({ ok: true, text: "三年" });
    expect(spellArabicNumbers("2个、12个")).toEqual({ ok: true, text: "两个、十二个" });
    expect(spellArabicNumbers("１５块")).toEqual({ ok: true, text: "十五块" });
  });
});

/** The committed zh layer file, promoted or still staged under content/zh/_drafts/staged (before promote). */
function zhContent(rel: string): string {
  const staged = rel.replace("content/zh/", "content/zh/_drafts/staged/content/zh/");
  return existsSync(path.join(ROOT, rel)) ? rel : staged;
}

describe("the committed lexicon reads every listening and story sentence", () => {
  const read = (rel: string) => JSON.parse(readFileSync(path.join(ROOT, rel), "utf8"));
  const loaded = loadZhSpeechIndex(read, (rel) => existsSync(path.join(ROOT, rel)));
  /** Kokoro-82M config.json `vocab` at the pinned revision f3ff357… (sha256 5abb01e2…): the symbols the model reads. */
  const VOCAB = new Set([...";:,.!?—…\"()“” ", "̃", ..."ʣʥʦʨᵝꭧAIOQSTWYᵊabcdefhijklmnopqrstuvwxyzɑɐɒæβɔɕçɖðʤəɚɛɜɟɡɥɨɪʝɯɰŋɳɲɴøɸθœɹɾɻʁɽʂʃʈʧʊʋʌɣɤχʎʒʔˈˌːʰʲ↓→↗↘ᵻ"]);

  test("the index loads", () => expect(loaded.problems).toEqual([]));
  test("every listening segment and story sentence resolves, within the model vocabulary", () => {
    const index = loaded.index!;
    const texts: string[] = [
      ...read(zhContent("content/zh/reception/listening.json")).clips.flatMap((c: { segments: { text: string }[] }) => c.segments.map((s) => s.text)),
      ...read(zhContent("content/zh/stories/stories.json")).stories.flatMap((s: { sentences: { text: string }[] }) => s.sentences.map((x) => x.text)),
    ];
    expect(texts.length).toBeGreaterThan(1000);
    const results = texts.map((t) => [t, zhClipPhonemes(t, index)] as const);
    expect(results.filter(([, r]) => !r.ok).map(([t, r]) => `${t}: ${r.ok ? "" : r.error}`)).toEqual([]);
    const outside = new Set(results.flatMap(([, r]) => (r.ok ? [...r.phonemes].filter((c) => !VOCAB.has(c)) : [])));
    expect([...outside]).toEqual([]);
  });
  test("every syllable the lexicon stores is spelt within the model vocabulary", () => {
    const lexemes = read("content/zh/lexicon/lexemes.json").lexemes as ZhLexemeLike[];
    const bad: string[] = [];
    for (const l of lexemes) {
      const r = zhClipPhonemes(l.surface, loaded.index!);
      if (!r.ok) bad.push(`${l.surface}: ${r.error}`);
      else if ([...r.phonemes].some((c) => !VOCAB.has(c))) bad.push(`${l.surface}: ${r.phonemes}`);
    }
    expect(bad).toEqual([]);
  });
  test("the canary fails closed: an item it cannot read names a missing lexicon word", () => {
    const items = read("content/zh/reception/audio-canary.json").items as { text: string }[];
    for (const item of items) {
      const r = zhClipPhonemes(item.text, loaded.index!);
      if (!r.ok) expect(r.error).toMatch(/no stored word (has|reads)/);
    }
  });
});

describe("plan → synth-script wiring (zh by the plan's phonemes)", () => {
  const engines = loadEngines();
  const file = { path: "voices/x.pt", sha256: null, bytes: null };
  const voice = (id: string, language: string): Voice => ({ id, engine: "kokoro", language, note: "", files: { voiceFile: file }, speaker: null, declaredDataset: null, declaredLicense: null, status: "selected", gateReason: null });
  const zh = voice("kokoro-zf_xiaobei", "zh");
  const es = voice("kokoro-ef_dora", "es");
  const reader = () => ({ read: (t: string) => zhClipPhonemes(t, INDEX), problems: [] });

  test("engines.json: zh uses the course-readings front-end; misaki[zh] (jieba, pypinyin, cn2an) is not installed", () => {
    expect(kokoroFrontend(engines, "zh")).toBe("course-readings");
    expect(engines.engines.kokoro.install.join(" ")).not.toMatch(/misaki\[zh\]|jieba|pypinyin|cn2an/);
    expect(engines.engines.kokoro.langCodes.zh).toBe("z");
  });

  test("the plan attaches phonemes to zh Kokoro segments only, inputs untouched", () => {
    const clips: { clipId: string; segments: { voiceId: string; text: string; phonemes?: string }[] }[] = [
      { clipId: "a", segments: [{ voiceId: zh.id, text: "你好！" }] },
      { clipId: "b", segments: [{ voiceId: es.id, text: "Hola." }] },
    ];
    const out = attachKokoroPhonemes(clips, new Map([zh, es].map((v) => [v.id, v])), engines, reader);
    expect(out.problems).toEqual([]);
    expect(out.clips[0]!.segments[0]!.phonemes).toBe("ni↗xau↓!");
    expect(out.clips[1]!.segments[0]).toEqual({ voiceId: es.id, text: "Hola." });
    expect(clips[0]!.segments[0]).toEqual({ voiceId: zh.id, text: "你好！" });
  });

  test("a clip the front-end cannot read is a plan problem naming the clip", () => {
    const bad = attachKokoroPhonemes([{ clipId: "zh.clip.x", segments: [{ voiceId: zh.id, text: "猫" }] }], new Map([[zh.id, zh]]), engines, reader);
    expect(bad.problems).toHaveLength(1);
    expect(bad.problems[0]).toContain("kokoro zh front-end: zh.clip.x:");
  });

  test("a front-end that cannot load reports its problem once and attaches nothing", () => {
    let calls = 0;
    const clips: { clipId: string; segments: { voiceId: string; text: string; phonemes?: string }[] }[] = [1, 2].map((n) => ({ clipId: `c${n}`, segments: [{ voiceId: zh.id, text: "你好" }] }));
    const out = attachKokoroPhonemes(clips, new Map([[zh.id, zh]]), engines, () => {
      calls += 1;
      return { read: null, problems: ["no lexicon"] };
    });
    expect(calls).toBe(1);
    expect(out.problems).toEqual(["no lexicon"]);
    expect(out.clips[0]!.segments[0]!.phonemes).toBeUndefined();
  });

  test("courseReadingsReader: zh and ja load, another language has none", () => {
    const read = (rel: string) => JSON.parse(readFileSync(path.join(ROOT, rel), "utf8"));
    const exists = (rel: string) => existsSync(path.join(ROOT, rel));
    const zhReader = courseReadingsReader("zh", read, exists);
    expect(zhReader.problems).toEqual([]);
    expect(zhReader.read!("你好")).toEqual({ ok: true, phonemes: "ni↗xau↓", pinyin: "ni2hao3" } as never);
    expect(courseReadingsReader("ja", read, exists).read).not.toBeNull();
    expect(courseReadingsReader("es", read, exists).read).toBeNull();
    expect(courseReadingsReader("zh", read, () => false).problems[0]).toContain("content/zh/lexicon/lexemes.json does not exist");
  });

  test("a zh voice synthesises from the plan's phonemes (--lang-code z --input phonemes); es is unchanged", () => {
    const script = buildSynthScript({
      clips: [
        { assetKey: "kzh", pipelineVersion: 3, segments: [{ voiceId: zh.id, speaker: null, text: "你好！", phonemes: "ni↗xau↓!" }] },
        { assetKey: "kes", pipelineVersion: 4, segments: [{ voiceId: es.id, speaker: null, text: "Hola." }] },
      ],
      voices: [zh, es],
      engines,
      downloadsDir: "/dl",
      wavDir: "/wav",
      outDir: "/out",
    });
    const zhLine = script.split("\n").find((l) => l.includes("kokoro-zf_xiaobei.voiceFile.1"))!;
    const esLine = script.split("\n").find((l) => l.includes("kokoro-ef_dora.voiceFile.1"))!;
    expect(zhLine).toContain("--lang-code 'z'");
    expect(zhLine).toContain("--input phonemes");
    expect(esLine).not.toContain("--input");
    expect(script).toContain('{"phonemes":"ni↗xau↓!","text":"你好！","out":"/wav/kzh.seg0.wav"}');
    expect(script).toContain('{"text":"Hola.","out":"/wav/kes.seg0.wav"}');
  });

  test("a zh segment without phonemes fails the synth script (never falls back to misaki's G2P)", () => {
    expect(() => kokoroEngine.synthScript([{ voiceId: zh.id, speaker: null, text: "你好", wavPath: "/w.wav" }], new Map([[zh.id, zh]]), "/dl", "/wav", engines)).toThrow("re-run plan");
  });
});

describe("re-render gate: the front-end version is part of every zh Kokoro key", () => {
  const readText = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");
  const spec = phonemeFrontendSpec("zh")!;
  const engines = loadEngines();

  test("engines.json declares zh's front-end with a version and the hash of its inputs", () => {
    expect(spec.id).toBe("course-readings");
    expect(phonemeFrontendProblems("zh", spec)).toEqual([]);
    for (const rel of ZH_FRONTEND_INPUTS) expect(existsSync(path.join(ROOT, rel)), rel).toBe(true);
    expect(frontendInputsSha256("zh", readText)).toBe(zhFrontendInputsSha256(readText));
    expect(frontendInputsSha256("es", readText)).toBeNull();
  });

  test("the recorded inputsSha256 is the hash of the current readings and front-end sources", () => {
    const actual = zhFrontendInputsSha256(readText);
    // On failure: a reading or a front-end table/rule changed, so blessed zh clips would keep the old pronunciation.
    if (actual !== spec.inputsSha256) throw new Error(staleFrontendMessage("zh", spec.inputsSha256, actual));
    expect(actual).toBe(spec.inputsSha256);
  });

  test("the hash moves with a pinyin and with a front-end source, not with a gloss, a grader or line endings", () => {
    const base = zhFrontendInputsSha256(readText);
    const lexicon = JSON.parse(readText("content/zh/lexicon/lexemes.json")) as { lexemes: { reading?: { pinyin?: string }; glosses?: Record<string, string> }[] };
    const withLexicon = (doc: unknown) => (rel: string) => (rel === "content/zh/lexicon/lexemes.json" ? JSON.stringify(doc) : readText(rel));
    const target = lexicon.lexemes.findIndex((l) => l.reading?.pinyin === "hǎo");
    expect(target).toBeGreaterThanOrEqual(0);
    const reread = { lexemes: lexicon.lexemes.map((l, i) => (i === target ? { ...l, reading: { ...l.reading, pinyin: "hào" } } : l)) };
    const reglossed = { lexemes: lexicon.lexemes.map((l, i) => (i === target ? { ...l, glosses: { ...l.glosses, vi: "khác" } } : l)) };
    expect(zhFrontendInputsSha256(withLexicon(reread))).not.toBe(base);
    expect(zhFrontendInputsSha256(withLexicon(reglossed))).toBe(base);
    expect(zhFrontendInputsSha256((rel) => (rel === "scripts/lib/zh-sandhi.ts" ? `${readText(rel)}\n// x` : readText(rel)))).not.toBe(base);
    expect(zhFrontendInputsSha256((rel) => (rel === "src/lib/languages/zh.ts" ? `${readText(rel)}\n// a grader change` : readText(rel)))).toBe(base);
    expect(zhFrontendInputsSha256((rel) => readText(rel).replace(/\n/g, "\r\n"))).toBe(base);
  });

  test("zh keys carry the version: a bump re-keys pack and story clips", () => {
    const tag = phonemeFrontendTag(spec);
    expect(tag).toBe(`phonemes=course-readings-v${spec.version}`);
    const bumped = { ...spec, version: spec.version + 1 };
    expect(frontendRecipeForEngine("zh", "kokoro")).toBe(tag);
    expect(frontendRecipeForEngine("zh", "kokoro", bumped)).not.toBe(tag);
    expect(frontendRecipeForEngine("zh", "piper")).toBeNull();
    expect(packClipRecipe({ language: "zh", engine: "kokoro", text: "水", pipelineVersion: 3, synthesis: null })).toBe(tag);
    expect(packClipRecipe({ language: "zh", engine: "kokoro", text: "水", pipelineVersion: 3, synthesis: null, codec: "opus", encoding: engines.encoding })).toBe(`${tag}|opus-16k-lim3`);
    expect(packAssetKey("zh", "kokoro-zf_xiaobei", null, "水", 3, tag)).not.toBe(packAssetKey("zh", "kokoro-zf_xiaobei", null, "水", 3));
    expect(frontendRecipeForVoices("zh", ["kokoro-zf_xiaobei", "kokoro-zm_yunjian"])).toBe(tag);
    expect(storyClipRecipe("zh", ["kokoro-zf_xiaobei"], "opus", engines.encoding)).toBe(`${tag}|opus-16k-lim3`);
  });
});
