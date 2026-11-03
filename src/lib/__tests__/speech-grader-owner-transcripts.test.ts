/**
 * P4b task 3: the speech grader over REAL recognizer transcripts for
 * ja/zh/ko (src/lib/__fixtures__/speech/owner-recognizer-transcripts.json,
 * collected by the owner on the phone — text only, no audio). Until the
 * owner adds samples, each language's case is skipped, never faked.
 */
import { describe, expect, test } from "bun:test";

import fixture from "../__fixtures__/speech/owner-recognizer-transcripts.json";
import { languageRules } from "../languages";
import { gradeSpokenAttempt } from "../speech/grader";

type Sample = { said: string; heard: string; alternatives?: string[]; expected: boolean; readings?: Record<string, string> };

const NOTATION: Readonly<Record<string, string>> = { ja: "kana", zh: "pinyin" };

describe("speech grader on owner-collected recognizer transcripts", () => {
  for (const lang of ["ja", "zh", "ko"] as const) {
    const samples = (fixture as unknown as Record<string, Sample[]>)[lang] ?? [];
    test.skipIf(samples.length === 0)(`${lang}: ${samples.length} real transcript(s) grade as expected`, () => {
      for (const s of samples) {
        const base = languageRules(lang);
        const entries = Object.entries(s.readings ?? {}).map(([surface, value]) => ({ surface, reading: { value, notation: NOTATION[lang] ?? "" } }));
        const rules = entries.length > 0 && base.withLexicon ? base.withLexicon({ entries }) : base;
        const result = gradeSpokenAttempt({ finalTranscript: s.heard, alternatives: s.alternatives ?? [] }, { acceptedVariants: [s.said] }, rules);
        expect({ said: s.said, heard: s.heard, correct: result.correct }).toEqual({ said: s.said, heard: s.heard, correct: s.expected });
      }
    });
  }
});
