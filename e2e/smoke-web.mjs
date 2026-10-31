/**
 * Phase 10 browser E2E over the exported web build (honestly labelled: the
 * web tier has no speech recognizer, so speech surfaces must show their
 * blocked/skip affordances, never crash). Since P2a every selector is a
 * testID and every expected label comes from the UI catalogue of the
 * language the export was built with (UI_LANG=vi|en), so the same walk
 * runs against an English and a Vietnamese export.
 *
 *   bunx expo export --platform web --output-dir dist
 *   node e2e/smoke-web.mjs dist
 *   EXPO_PUBLIC_UI_LANG=vi bunx expo export --platform web --output-dir dist-vi --clear
 *   UI_LANG=vi node e2e/smoke-web.mjs dist-vi
 *
 * Browser: E2E_BROWSER_PATH, else the first of the known Chromium/Chrome
 * paths. Starts its own static server on E2E_PORT (default 8099).
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { chromium } from "playwright-core";

import { UI_LANG, languageName, t } from "./i18n.mjs";

const exportDir = process.argv[2] ?? "dist";
const port = Number(process.env.E2E_PORT ?? 8099);
const BASE = `http://127.0.0.1:${port}`;
const browserPath =
  process.env.E2E_BROWSER_PATH ??
  ["/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find(
    existsSync
  );
if (!browserPath) {
  console.error("no Chromium/Chrome found; set E2E_BROWSER_PATH");
  process.exit(2);
}

// P2b: the course under test — `fr-en` by default, `fr-vi` for the Vietnamese lane
// (same curriculum, Vietnamese explanations; everything below reads the pack).
const COURSE = process.env.E2E_COURSE ?? "fr-en";
const pack = JSON.parse(readFileSync(`src/content/packs/${COURSE}.json`, "utf8"));
const lastSection = pack.sections[pack.sections.length - 1];
// The policy boundary sentence in each language (assertion text, not a selector).
const POLICY_BOUNDARY = {
  en: [/may send the audio to the platform provider/, /does not operate any speech server/],
  vi: [/có thể gửi âm thanh đến nhà cung cấp nền tảng/, /không vận hành máy chủ nhận dạng giọng nói nào/],
}[UI_LANG];

const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
};

const server = spawn("python3", ["e2e/serve-static.py", exportDir, String(port)], { stdio: "ignore" });
const waitForPort = () =>
  new Promise((resolve, reject) => {
    const started = Date.now();
    const tryConnect = () => {
      const socket = net.connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - started > 15000) reject(new Error("server did not start"));
        else setTimeout(tryConnect, 200);
      });
    };
    tryConnect();
  });

let browser;
try {
  await waitForPort();
  browser = await chromium.launch({ executablePath: browserPath });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const consoleErrors = [];
  // React #418 (hydration mismatch of the static HTML) is a known,
  // pre-existing web-tier limitation of the static export (present on the
  // Phase 9 build too); React recovers by client-rendering. Anything else
  // uncaught fails the run.
  page.on("pageerror", (e) => {
    const text = String(e);
    if (/Minified React error #418/.test(text)) return;
    consoleErrors.push(text);
  });
  const byId = (id) => page.getByTestId(id);

  // 1. Onboarding on first load — in the export's UI language.
  await page.goto(BASE, { waitUntil: "networkidle" });
  await byId(`onboarding-course-${COURSE}`).click();
  const startLabel = (await byId("onboarding-start").textContent())?.trim();
  const expectedStart = t("onboarding.learn", { language: languageName("fr") });
  check(`onboarding start button reads the ${UI_LANG} label`, startLabel?.toLowerCase() === expectedStart.toLowerCase(), `"${startLabel}"`);
  await byId("onboarding-start").click();
  check("onboarding completes into the app", true);

  // 2. Path shows all sections incl. the last one.
  await byId(`learn-section-${lastSection.id}`).waitFor();
  check("path renders the last section", true, lastSection.title);

  // 3. Goals: estimate card, per-domain n/m chips, capstone link, limit explainer.
  await page.goto(`${BASE}/goals`, { waitUntil: "networkidle" });
  const estimateLabel = (await byId("a1-estimate-label").textContent())?.trim();
  check("goals: estimate label in the UI language", estimateLabel === t("goals.estimateLabel").replace("{level}", "A1"), `"${estimateLabel}"`);
  await byId("a1-domain-chips").waitFor();
  const listeningChip = await byId("a1-domain-chip-spoken_reception").innerText();
  const listeningName = t("domain.spoken_reception");
  check("goals: chips show the authored denominator", new RegExp(`${listeningName}\\s*0/3`).test(listeningChip), listeningChip.trim());
  await byId("a1-domain-detail").waitFor();
  await byId("capstone-link").waitFor();
  await byId("estimate-limits-toggle").click();
  const limits = await byId("estimate-limits").innerText();
  check("goals: limit explainer states the honesty wording", limits.includes(t("goals.limits1").slice(2, 40)), limits.slice(0, 60));
  const disclaimer = (await byId("goals-disclaimer").textContent())?.trim();
  check("goals: CEFR disclaimer present", disclaimer === t("goals.disclaimer"));

  // 4. Practice: the two French cards.
  await page.goto(`${BASE}/practice`, { waitUntil: "networkidle" });
  await byId("practice-writing-card").waitFor();
  await byId("practice-conversation-card").waitFor();
  check("practice: writing + conversation cards", true);

  // 5. Writing practice grades a submission honestly.
  await byId("practice-writing").click();
  // The day seeds the task order, so the first task is guided writing or a form.
  const writingFields = page.locator('[data-testid="writing-input"], [data-testid^="form-field-"]');
  await writingFields.first().waitFor();
  for (const field of await writingFields.all()) await field.fill("bonjour");
  await byId("session-check").click();
  await page.waitForTimeout(400);
  const feedback = await byId("session-feedback").first().textContent().catch(() => null);
  check("writing practice grades a submission", feedback !== null && feedback.trim().length > 0, (feedback ?? "").trim());

  // 6. Conversation practice on web shows the honest no-recognizer escape.
  await page.goto(`${BASE}/practice`, { waitUntil: "networkidle" });
  await byId("practice-conversation").click();
  await byId("interaction-goal").waitFor();
  const escape = await Promise.race([
    byId("speak-blocked").waitFor().then(() => "blocked-panel"),
    byId("speak-skip").first().waitFor().then(() => "skip-link"),
  ]);
  check("conversation on web shows the honest no-recognizer escape", true, escape);

  // 7. Capstone route opens and pre-gates speech (blocked on web).
  await page.goto(`${BASE}/checkpoint/fr.checkpoint.a1-capstone`, { waitUntil: "networkidle" });
  await byId("checkpoint-speech-blocked").waitFor();
  check("capstone route opens with the speech pre-gate on web", true, "pre-gate");

  // 8. A scored MCQ checkpoint renders its options (seeded order, one screen).
  await page.goto(`${BASE}/checkpoint/fr.checkpoint.section-1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const optionCards = await byId("option-card").count();
  check("section-1 checkpoint renders answer options", optionCards >= 4, `${optionCards} options`);

  // 9. Profile → Privacy: the policy is reachable in-app and states the boundary.
  await page.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  await byId("language-card").waitFor();
  await byId("privacy-link").click();
  await byId("privacy-policy").waitFor();
  const policy = await byId("privacy-policy").innerText();
  check("privacy policy reachable from Profile and states the OS speech boundary", POLICY_BOUNDARY.every((re) => re.test(policy)));

  // 10. Licenses & attributions reachable.
  await page.goto(`${BASE}/licenses`, { waitUntil: "networkidle" });
  await byId("licenses-screen").waitFor();
  const licenses = await byId("licenses-screen").innerText();
  check("licenses screen reachable with data provenance", /Lexique 4/.test(licenses));

  check("no uncaught page errors during the flow", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
} catch (error) {
  check("E2E flow", false, String(error).slice(0, 300));
} finally {
  await browser?.close();
  server.kill();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed (UI_LANG=${UI_LANG})`);
process.exit(failed === 0 ? 0 : 1);
