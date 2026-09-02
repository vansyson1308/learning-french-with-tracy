/**
 * Web-tier storyboard previews (SCREENSHOT_MANIFEST.md): the same frames as
 * the store storyboard, captured from the exported web build at a phone
 * viewport. Documentation only — never a store submission.
 *
 *   bunx expo export --platform web --output-dir dist
 *   node e2e/screenshots.mjs dist dist-screens
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
const browserPath =
  process.env.E2E_BROWSER_PATH ??
  ["/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find(existsSync);
if (!browserPath) {
  console.error("no Chromium/Chrome found; set E2E_BROWSER_PATH");
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });
const pack = JSON.parse(readFileSync("src/content/packs/fr-en.json", "utf8"));
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
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
  page.setDefaultTimeout(15000);
  const shot = (name) => page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
  const go = (p) => page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });

  await go("/");
  await page.getByText("French", { exact: true }).first().click();
  await page.getByRole("button", { name: /^learn french$/i }).click();
  await page.getByText(pack.sections[0].title).first().waitFor();
  await shot("01-learn");

  await go("/lesson/fr-en:u0-l0");
  await page.getByText("Check", { exact: true }).first().waitFor();
  const option = page.getByRole("button").filter({ hasNotText: /^(Check|Continue)$/ });
  const labels = await option.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? e.textContent ?? ""));
  const idx = labels.findIndex((l) => l && !/close|play|audio|check|continue|know|back/i.test(l));
  if (idx >= 0) {
    await option.nth(idx).click();
    await page.getByText("Check", { exact: true }).first().click();
    await page.getByText(/Nicely done!|Correct answer:|Not quite this time/).first().waitFor();
  }
  await shot("02-lesson");

  await go("/today");
  await page.getByText("Start today's session").first().waitFor();
  await shot("03-today");

  if (listening) {
    await go(`/lesson/${listening.id}`);
    await page.locator('[aria-label="Play audio"]').first().waitFor();
    await shot("04-listening");
  }

  await go("/practice");
  await page.getByText("Practice writing", { exact: true }).first().click();
  await page.getByRole("textbox").first().fill("Bonjour, je m'appelle Léa.");
  await page.getByText("Check", { exact: true }).first().click();
  await page.getByText(/Nicely done!|Correct answer:|Not quite this time|You included|Don't forget|Try a complete|Use a complete|Keep it short/).first().waitFor();
  await shot("06-writing");

  await go("/goals");
  await page.getByText("CEFR-aligned A1 estimate").first().waitFor();
  await shot("07-goals");

  await go("/vocabulary");
  await page.getByText(pack.sections[0].units[0].words[0].target, { exact: true }).first().click();
  await page.getByText("Example", { exact: true }).first().waitFor();
  await shot("08-vocabulary");
  console.log(`storyboard previews written to ${outDir}/ (web tier, documentation only)`);
} finally {
  await browser?.close();
  server.kill();
}
