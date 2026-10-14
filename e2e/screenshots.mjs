/**
 * Web-tier storyboard previews (SCREENSHOT_MANIFEST.md): the same frames as
 * the store storyboard, captured from the exported web build at a phone
 * viewport, in BOTH UI languages (P2a) — the app language is switched
 * through the Profile picker, so one export serves both sets. Output:
 * <outDir>/<lang>/NN-name.png. Documentation only — never a store
 * submission.
 *
 *   bunx expo export --platform web --output-dir dist
 *   node e2e/screenshots.mjs dist screenshots
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { chromium } from "playwright-core";

const exportDir = process.argv[2] ?? "dist";
const outDir = process.argv[3] ?? "dist-screens";
const port = Number(process.env.E2E_PORT ?? 8097);
const BASE = `http://127.0.0.1:${port}`;
const LANGS = ["en", "vi"];
const browserPath =
  process.env.E2E_BROWSER_PATH ??
  ["/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find(existsSync);
if (!browserPath) {
  console.error("no Chromium/Chrome found; set E2E_BROWSER_PATH");
  process.exit(2);
}
// P2b: the course under test — `fr-en` by default, `fr-vi` for the Vietnamese lane
// (same curriculum, Vietnamese explanations; everything below reads the pack).
const COURSE = process.env.E2E_COURSE ?? "fr-en";
const pack = JSON.parse(readFileSync(`src/content/packs/${COURSE}.json`, "utf8"));
const lessons = pack.sections.flatMap((s) => s.units.flatMap((u) => u.lessons));
const listening = lessons.find((l) => l.exercises[0].type === "listeningComprehension");

const server = spawn("python3", ["e2e/serve-static.py", exportDir, String(port)], { stdio: "ignore" });
await new Promise((resolve, reject) => {
  const started = Date.now();
  const tryConnect = () => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => (socket.destroy(), resolve()));
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
  browser = await chromium.launch({ executablePath: browserPath });
  for (const lang of LANGS) {
    const dir = path.join(outDir, lang);
    mkdirSync(dir, { recursive: true });
    const context = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const shot = (name) => page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: false });
    const go = (p) => page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
    const byId = (id) => page.getByTestId(id);

    await go("/");
    await byId(`onboarding-course-${COURSE}`).click();
    await byId("onboarding-start").click();
    await byId(`learn-section-${pack.sections[0].id}`).waitFor();
    // Pin the UI language through the in-app picker (persisted per profile).
    await go("/profile");
    await byId(`language-option-${lang}`).click();
    await page.waitForTimeout(300);
    await go("/");
    await byId(`learn-section-${pack.sections[0].id}`).waitFor();
    await shot("01-learn");

    await go(`/lesson/${COURSE}:u0-l0`);
    await byId("session-check").waitFor();
    const options = byId("option-card");
    if ((await options.count()) > 0) {
      await options.first().click();
      await byId("session-check").click();
      await byId("session-feedback").first().waitFor();
    }
    await shot("02-lesson");

    await go("/today");
    await byId("today-start").waitFor();
    await shot("03-today");

    if (listening) {
      await go(`/lesson/${listening.id}`);
      await byId("listening-player").first().waitFor();
      await shot("04-listening");
    }

    await go("/practice");
    await byId("practice-writing").click();
    await byId("writing-input").first().fill("Bonjour, je m'appelle Léa.");
    await byId("session-check").click();
    await byId("session-feedback").first().waitFor();
    await shot("06-writing");

    await go("/goals");
    await byId("a1-estimate-label").waitFor();
    await shot("07-goals");

    await go("/vocabulary");
    await page.getByText(pack.sections[0].units[0].words[0].target, { exact: true }).first().click();
    await byId("vocab-example").waitFor();
    await shot("08-vocabulary");

    await go("/profile");
    await byId("language-card").waitFor();
    await shot("09-profile");
    await context.close();
    console.log(`storyboard previews (${lang}) written to ${dir}/`);
  }
  console.log("web tier, documentation only");
} finally {
  await browser?.close();
  server.kill();
}
