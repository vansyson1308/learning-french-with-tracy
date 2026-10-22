/**
 * P3e audio QA fixes: Korean is scored by character error rate (SenseVoice
 * spaces Hangul arbitrarily), and one-word clips are checked by absolute
 * duration, not speaking rate (the ja/zh "technical failures").
 */
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "bun:test";

import { buildPlugin } from "../lib/languages";
import { rateIssue, SHORT_DURATION_BAND } from "../lib/piper-audio";

const python = process.platform === "win32" ? "python" : "python3";
const score = (lang: string, ref: string, hyp: string, spec?: unknown) => {
  const out = spawnSync(python, ["-I", "scripts/audio-asr-audit.py", "score", lang, ref, hyp, ...(spec ? [JSON.stringify(spec)] : [])], { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  if (out.status !== 0) throw new Error(out.stderr);
  return JSON.parse(out.stdout) as { metric: string; score: number };
};

describe("ASR metric per script", () => {
  test("Korean: the canary pair that scored WER 2.0 is a perfect CER 0", () => {
    expect(score("ko", "커피와 피자를 팔아요.", "커 피와 피 자를 팔 아요")).toEqual({ metric: "cer", score: 0 });
    expect(score("ko", "밥을 먹고 책을 읽었습니다.", "밥 을 먹 고 책 을 읽 었 습니다")).toEqual({ metric: "cer", score: 0 });
  });

  test("a real Korean error still counts", () => {
    expect(score("ko", "안녕하세요", "안녕하요").score).toBeCloseTo(0.2, 5);
  });

  test("the plan's metric comes from the language plugin: CER for Han, kana, Hangul; WER for Latin", () => {
    expect(buildPlugin("ko").normalizeForAsr.metric).toBe("cer");
    expect(buildPlugin("ja").normalizeForAsr.metric).toBe("cer");
    expect(buildPlugin("zh").normalizeForAsr.metric).toBe("cer");
    expect(buildPlugin("es").normalizeForAsr.metric).toBe("wer");
    expect(score("es", "Hola, buenos días.", "hola buenos dias", buildPlugin("es").normalizeForAsr).metric).toBe("wer");
  });
});

describe("speaking-rate check", () => {
  const han: [number, number] = [1.2, 12];
  test("one- and two-character words at a normal ~1-2 s pass (were 'duration implausible')", () => {
    expect(rateIssue("犬", 1.228, han)).toBeNull();
    expect(rateIssue("公园", 2.194, han)).toBeNull();
    expect(rateIssue("小", 0.888, han)).toBeNull();
    expect(rateIssue("sí", 0.6, [4, 30])).toBeNull();
  });

  test("short clips outside the absolute band and sentences off-rate still fail", () => {
    expect(rateIssue("大", SHORT_DURATION_BAND[1] + 1, han)).toContain("implausible for a 1-character transcript");
    expect(rateIssue("我们去那儿玩一会儿，吃一点儿东西。", 30, han)).toContain("chars/sec");
  });
});
