/**
 * Chinese build plugin (P4b stage 5, task 6): the generic CJK defaults
 * (trigram FTS, character error rate, no articles) and NO verb paradigm —
 * Mandarin verbs do not inflect, so conjugationCloze stays invalid for zh.
 * Instead the plugin declares the grammar concepts a zh course teaches
 * where other languages drill paradigm cells: measure words (the same list
 * the runtime plugin turns 2 into 两 before) and the aspect particles
 * 了 / 过 / 着 and progressive 在.
 */
import { CHINESE_MEASURE_WORDS } from "../../../src/lib/languages/zh";

import { genericPlugin } from "./generic";
import type { BuildLanguagePlugin, GrammarConcept } from "./types";

export const ZH_GRAMMAR_CONCEPTS: readonly GrammarConcept[] = [
  { id: "zh:concept:measure-words", kind: "measure-word", forms: CHINESE_MEASURE_WORDS },
  { id: "zh:concept:aspect-le", kind: "aspect-particle", forms: ["了"] },
  { id: "zh:concept:aspect-guo", kind: "aspect-particle", forms: ["过", "過"] },
  { id: "zh:concept:aspect-zhe", kind: "aspect-particle", forms: ["着", "著"] },
  { id: "zh:concept:aspect-zai", kind: "aspect-particle", forms: ["在", "正在"] },
];

export const zh: BuildLanguagePlugin = genericPlugin(
  { code: "zh", recognitionLocale: "zh-CN", ttsLocale: "zh-CN", script: "han", flagAsset: "cn", readings: ["pinyin"] },
  { grammarConcepts: ZH_GRAMMAR_CONCEPTS }
);
