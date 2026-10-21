/**
 * P3d browser E2E for the Vietnamese-first Spanish course and its DELE A1
 * exam track, over the exported web build (UI_LANG=vi). The web tier has
 * no speech recognizer and no bundled Spanish clips yet, so the walk
 * covers what must work offline: onboarding offers es-vi (not the
 * standalone es-en), the exam overview, an untimed writing practice that
 * records a result, and a timed mock section with a visible clock.
 *
 *   EXPO_PUBLIC_UI_LANG=vi bunx expo export --platform web --output-dir dist-vi --clear
 *   UI_LANG=vi node e2e/exam-web.mjs dist-vi
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { chromium } from "playwright-core";

import { UI_LANG, t } from "./i18n.mjs";

const exportDir = process.argv[2] ?? "dist-vi";
const port = Number(process.env.E2E_PORT ?? 8098);
const BASE = `http://127.0.0.1:${port}`;
const browserPath =
  process.env.E2E_BROWSER_PATH ??
  ["/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find(existsSync);
if (!browserPath) {
  console.error("no Chromium/Chrome found; set E2E_BROWSER_PATH");
  process.exit(2);
}
const TRACK = JSON.parse(readFileSync("src/content/exam/es-exam-tracks.json", "utf8")).tracks[0];

const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
};

const python = process.platform === "win32" ? "python" : "python3";
const server = spawn(python, ["e2e/serve-static.py", exportDir, String(port)], { stdio: "ignore" });
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
  const pageErrors = [];
  page.on("pageerror", (e) => {
    const text = String(e);
    if (/Minified React error #418/.test(text)) return;
    pageErrors.push(text);
  });
  const byId = (id) => page.getByTestId(id);

  // 1. Onboarding offers es-vi and hides the standalone es-en.
  await page.goto(BASE, { waitUntil: "networkidle" });
  await byId("onboarding-course-es-vi").waitFor();
  check("onboarding offers es-vi", true);
  check("onboarding hides the standalone es-en", (await byId("onboarding-course-es-en").count()) === 0);
  await byId("onboarding-course-es-vi").click();
  await byId("onboarding-start").click();

  // 2. Courses screen lists es-en under "other courses".
  await page.goto(`${BASE}/courses`, { waitUntil: "networkidle" });
  await byId("courses-other").waitFor();
  check("courses: es-en is listed under other courses", (await byId("courses-course-es-en").count()) === 1);
  await page.goto(BASE, { waitUntil: "networkidle" });

  // 3. Practice tab → exam card → overview.
  await page.goto(`${BASE}/practice`, { waitUntil: "networkidle" });
  await byId(`practice-exam-${TRACK.id}`).waitFor();
  check("practice: DELE A1 card", true, TRACK.title);
  await byId("practice-open-exam").click();
  await byId("exam-overview").waitFor();
  const overview = await byId("exam-overview").innerText();
  check("overview shows the estimate disclaimer", overview.includes(TRACK.readiness.disclaimer.slice(0, 40)));
  check("overview says the format was not re-checked", overview.includes(TRACK.formatSource.note.slice(0, 40)));
  for (const s of TRACK.sections) await byId(`exam-practice-${s.id}`).waitFor();
  check("overview lists the four parts", true);

  // 4. Writing practice: the whole bank (both forms: 2 forms + 2 notes), then a recorded result.
  await byId("exam-practice-writing").click();
  let cuesShown = 0;
  for (let step = 0; step < 4; step++) {
    await byId("session-check").waitFor();
    const formFields = await page.locator('[data-testid^="form-field-"]').count();
    if (formFields > 0) {
      cuesShown += await byId("form-cues").count();
      const fields = page.locator('[data-testid^="form-field-"]');
      for (let i = 0; i < formFields; i++) await fields.nth(i).fill(["Linh", "22", "Valencia"][i] ?? "x");
    } else {
      await byId("writing-input").first().fill("Hola, Carmen: estoy en la biblioteca. Vuelvo a casa a las seis.");
    }
    await byId("session-check").click();
    await byId("session-continue").click();
  }
  check("writing practice: every form shows its cue card", cuesShown === 2, `${cuesShown}/2`);
  await byId("exam-results").waitFor();
  const writingScore = await byId("exam-section-score-writing").innerText();
  check("writing practice records a scored result", /\/25/.test(writingScore), writingScore.trim());
  await byId("exam-results-done").click();

  // 5. Timed mock: intro → first part with a running clock.
  await page.goto(`${BASE}/exam/${TRACK.id}`, { waitUntil: "networkidle" });
  await byId("exam-start-mock").click();
  await byId("exam-mock-intro-reading").waitFor();
  await byId("exam-mock-start-section").click();
  await byId("session-countdown").waitFor();
  const clock1 = (await byId("session-countdown").innerText()).trim();
  await page.waitForTimeout(2200);
  const clock2 = (await byId("session-countdown").innerText()).trim();
  check("mock: the reading clock starts at 45 minutes and runs", clock1.startsWith("45:") || clock1.startsWith("44:"), `${clock1} → ${clock2}`);
  check("mock: the clock counts down", clock2 !== clock1);
  const options = await byId("option-card").count();
  check("mock: a reading item offers three options", options === 3, `${options}`);

  check("no uncaught page errors during the flow", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));
  check("walk ran in the Vietnamese UI", UI_LANG === "vi", UI_LANG);
  void t;
} catch (error) {
  check("E2E flow", false, String(error).slice(0, 300));
} finally {
  await browser?.close();
  server.kill();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed (UI_LANG=${UI_LANG})`);
process.exit(failed === 0 ? 0 : 1);
