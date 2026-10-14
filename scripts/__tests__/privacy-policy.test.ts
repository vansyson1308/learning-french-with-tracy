/**
 * Privacy wording (Phase 10 §42-§43, §74): the committed policy Markdown is
 * exactly the in-app source; the wording states the OS speech-service
 * network boundary instead of an over-broad "offline" promise; and no
 * learner-facing string in the app makes such a promise either.
 */
import { describe, expect, test } from "bun:test";

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

import {
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_SECTIONS_VI,
  renderPrivacyPolicyMarkdown,
} from "../../src/lib/privacy-policy";

const policyText = PRIVACY_POLICY_SECTIONS.map((s) => [s.title, ...s.paragraphs].join("\n")).join(
  "\n"
);
const policyTextVi = PRIVACY_POLICY_SECTIONS_VI.map((s) => [s.title, ...s.paragraphs].join("\n")).join(
  "\n"
);

/** Over-broad offline promises that are false on network-backed speech devices. */
const OFFLINE_PROMISES = [
  /100\s*%\s*offline/i,
  /fully offline/i,
  /completely offline/i,
  /entirely offline/i,
  /never leaves your (device|phone)/i,
  /never sent (anywhere|to anyone)/i,
  // Vietnamese equivalents (P2a): the translation may not promise more than the English.
  /100\s*%\s*ngoại tuyến/i,
  /hoàn toàn ngoại tuyến/i,
  /không bao giờ rời khỏi (thiết bị|điện thoại)/i,
  /không bao giờ (được )?gửi đi đâu/i,
];
/** Certification claims the policy must never make (the app's own honesty
 *  wording — "never an official CEFR examination" — is checked elsewhere). */
const CERTIFICATION_CLAIMS = [/certified/i, /officially recogni[sz]ed/i, /accredited by/i, /chứng nhận chính thức/i, /được công nhận chính thức/i];
const FORBIDDEN_PROMISES = [...OFFLINE_PROMISES, ...CERTIFICATION_CLAIMS];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry === "__tests__") continue;
      out.push(...sourceFiles(path));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

describe("privacy policy source and Markdown", () => {
  test("release/PRIVACY_POLICY.md is exactly the rendered in-app source", () => {
    expect(readFileSync("release/PRIVACY_POLICY.md", "utf8")).toBe(renderPrivacyPolicyMarkdown());
  });

  test("states the OS speech-service boundary rather than an offline promise (§42)", () => {
    expect(policyText).toMatch(/operating.system('s)? speech recognition/i);
    expect(policyText).toMatch(/may send the audio to the platform provider/);
    expect(policyText).toMatch(/does not operate any speech server/);
    expect(policyText).toMatch(/on-device recognition whenever your device supports it/);
    for (const pattern of FORBIDDEN_PROMISES) expect(policyText).not.toMatch(pattern);
  });

  test("the Vietnamese policy mirrors the English section by section and states the same boundary (P2a)", () => {
    expect(PRIVACY_POLICY_SECTIONS_VI.length).toBe(PRIVACY_POLICY_SECTIONS.length);
    for (let i = 0; i < PRIVACY_POLICY_SECTIONS.length; i++) {
      expect({ section: PRIVACY_POLICY_SECTIONS[i].title, paragraphs: PRIVACY_POLICY_SECTIONS_VI[i].paragraphs.length }).toEqual({
        section: PRIVACY_POLICY_SECTIONS[i].title,
        paragraphs: PRIVACY_POLICY_SECTIONS[i].paragraphs.length,
      });
    }
    expect(policyTextVi).toMatch(/nhận dạng giọng nói của hệ điều hành/);
    expect(policyTextVi).toMatch(/có thể gửi âm thanh đến nhà cung cấp nền tảng/);
    expect(policyTextVi).toMatch(/không vận hành máy chủ nhận dạng giọng nói nào/);
    expect(policyTextVi).toMatch(/bộ nhớ riêng của ứng dụng trên thiết bị/);
    expect(policyTextVi).toMatch(/Xóa ứng dụng sẽ xóa tất cả/);
    expect(policyTextVi).toMatch(/không phân tích dữ liệu/);
    expect(policyTextVi).toMatch(/không quảng cáo/);
    for (const pattern of FORBIDDEN_PROMISES) expect(policyTextVi).not.toMatch(pattern);
  });

  test("covers every item the release checklist requires (§43)", () => {
    expect(policyText).toMatch(/private storage on your device/);
    expect(policyText).toMatch(/temporary cache folder/);
    expect(policyText).toMatch(/Scored checks never keep a recording/);
    expect(policyText).toMatch(/not written to your progress data or to backups/);
    expect(policyText).toMatch(/only when you tap Export/);
    expect(policyText).toMatch(/AI tutor.*disabled/s);
    expect(policyText).toMatch(/no accounts?, no/i);
    expect(policyText).toMatch(/withdraw microphone or speech-recognition permission/);
    expect(policyText).toMatch(/Deleting the app removes all of it/);
    expect(policyText).toMatch(/no analytics/);
    expect(policyText).toMatch(/no advertising/);
  });

  test("the in-app network-speech disclosure states the same boundary (§42, §74)", () => {
    // Since P2a the disclosure is a catalogue message (speech.disclosure) in both languages.
    const en = JSON.parse(readFileSync("src/lib/i18n/catalog/en.json", "utf8")) as Record<string, string>;
    const vi = JSON.parse(readFileSync("src/lib/i18n/catalog/vi.json", "utf8")) as Record<string, string>;
    const text = en["speech.disclosure"];
    expect(text).toMatch(/device's system service/);
    expect(text).toMatch(/may use the internet/);
    expect(text).toMatch(/never uploads or stores your recording/);
    expect(text).toMatch(/skip speaking/);
    for (const pattern of OFFLINE_PROMISES) expect(text).not.toMatch(pattern);
    const textVi = vi["speech.disclosure"];
    expect(textVi).toMatch(/dịch vụ hệ thống của thiết bị/);
    expect(textVi).toMatch(/có thể dùng Internet/);
    expect(textVi).toMatch(/không bao giờ tải lên hay lưu bản ghi âm/);
    expect(textVi).toMatch(/bỏ qua phần nói/);
    for (const pattern of OFFLINE_PROMISES) expect(textVi).not.toMatch(pattern);
  });

  test("no learner-facing app string makes an over-broad offline promise", () => {
    const catalogues = ["src/lib/i18n/catalog/en.json", "src/lib/i18n/catalog/vi.json"];
    for (const file of [...sourceFiles("src/app"), ...sourceFiles("src/components"), ...sourceFiles("src/lib"), ...catalogues]) {
      // The policy source necessarily names the promises it refuses to make.
      if (file.endsWith("privacy-policy.ts")) continue;
      const source = readFileSync(file, "utf8");
      for (const pattern of OFFLINE_PROMISES) {
        expect({ file, pattern: String(pattern), hit: pattern.test(source) }).toEqual({
          file,
          pattern: String(pattern),
          hit: false,
        });
      }
    }
  });
});
