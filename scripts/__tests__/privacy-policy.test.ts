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
  renderPrivacyPolicyMarkdown,
} from "../../src/lib/privacy-policy";

const policyText = PRIVACY_POLICY_SECTIONS.map((s) => [s.title, ...s.paragraphs].join("\n")).join(
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
];
/** Certification claims the policy must never make (the app's own honesty
 *  wording — "never an official CEFR examination" — is checked elsewhere). */
const CERTIFICATION_CLAIMS = [/certified/i, /officially recogni[sz]ed/i, /accredited by/i];
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
    const source = readFileSync("src/lib/speech/step-policy.ts", "utf8");
    const start = source.indexOf("NETWORK_DISCLOSURE_TEXT =");
    const text = source.slice(start, source.indexOf(";", start));
    expect(text).toMatch(/device's system service/);
    expect(text).toMatch(/may use the internet/);
    expect(text).toMatch(/never uploads or stores your recording/);
    expect(text).toMatch(/skip speaking/);
    for (const pattern of OFFLINE_PROMISES) expect(text).not.toMatch(pattern);
  });

  test("no learner-facing app string makes an over-broad offline promise", () => {
    for (const file of [...sourceFiles("src/app"), ...sourceFiles("src/components"), ...sourceFiles("src/lib")]) {
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
