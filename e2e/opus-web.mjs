/**
 * Opus playback on the web tier (release/ASSET_DELIVERY.md). Runs against a
 * web export built with LFT_ACCEPTANCE_DIAGNOSTICS=1, the only kind of export
 * that carries the acceptance-only route /diagnostics/opus
 * (src/app/diagnostics/opus.tsx): one Opus mono 16 kbps story sentence played
 * through expo-audio at rate 1, then at the listening player's slow rate.
 *
 *   LFT_ACCEPTANCE_DIAGNOSTICS=1 bunx expo export --platform web --output-dir dist-diag --clear
 *   node e2e/opus-web.mjs dist-diag
 *
 * Asserts the fixture is served as Ogg, both passes report loaded, playing
 * and finished, no decoder error arrives, and the verdict is PASS. The play
 * starts from a real click (the browser's autoplay policy). Browser:
 * E2E_BROWSER_PATH, else the first known Chromium/Chrome path. Static server
 * on E2E_PORT (default 8098).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import { chromium } from "playwright-core";

const exportDir = process.argv[2] ?? "dist-diag";
const port = Number(process.env.E2E_PORT ?? 8098);
const BASE = `http://127.0.0.1:${port}`;
const COURSE = process.env.E2E_COURSE ?? "fr-en";
const EVENTS = ["normal-loaded", "normal-playing", "normal-finished", "slow-loaded", "slow-playing", "slow-finished"];
const browserPath =
  process.env.E2E_BROWSER_PATH ??
  ["/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find(existsSync);
if (!browserPath) {
  console.error("no Chromium/Chrome found; set E2E_BROWSER_PATH");
  process.exit(2);
}

const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? ` - ${extra}` : ""}`);
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
    if (/Minified React error #418/.test(text)) return; // known static-export hydration notice (smoke-web.mjs)
    pageErrors.push(text);
  });
  const diagLines = [];
  page.on("console", (m) => {
    if (m.text().startsWith("LFT_DIAG_OPUS")) diagLines.push(m.text());
  });
  const opusResponses = [];
  page.on("response", (r) => {
    if (/\.opus(\?|$)/.test(r.url())) opusResponses.push({ status: r.status(), type: r.headers()["content-type"] ?? "" });
  });
  const byId = (id) => page.getByTestId(id);

  // Onboarding first: the root layout sends a new learner there from any route.
  await page.goto(BASE, { waitUntil: "networkidle" });
  await byId(`onboarding-course-${COURSE}`).click();
  await byId("onboarding-start").click();
  await page.waitForFunction(() => !location.pathname.includes("onboarding"));

  await page.goto(`${BASE}/diagnostics/opus`, { waitUntil: "networkidle" });
  await byId("diag-opus-screen").waitFor();
  check("the diagnostics export carries /diagnostics/opus", true);
  await byId("diag-opus-start").click();
  await page.locator('[data-testid="diag-opus-result-pass"], [data-testid="diag-opus-result-fail"]').first().waitFor({ timeout: 90000 });
  const summary = (await byId("diag-opus-summary").textContent())?.trim() ?? "";
  console.log(`  ${summary}`);
  check("the Opus fixture is fetched and served as Ogg", opusResponses.some((r) => r.status === 200 && /ogg|opus/.test(r.type)), JSON.stringify(opusResponses));
  for (const event of EVENTS) check(`playback event: ${event}`, (await byId(`diag-opus-${event}`).count()) === 1);
  check("no decoder error", (await byId("diag-opus-no-error").count()) === 1, summary.split(" | ").find((s) => s.startsWith("error=")) ?? "");
  check("verdict PASS (rate 1 and slow mode)", (await byId("diag-opus-result-pass").count()) === 1, summary);
  check("the app logged its verdict", diagLines.some((l) => l.includes("verdict=pass")), diagLines.at(-1) ?? "none");
  check("no uncaught page error", pageErrors.length === 0, pageErrors.join(" / ").slice(0, 300));
} catch (e) {
  check("opus web e2e ran to the end", false, String(e).slice(0, 300));
} finally {
  await browser?.close();
  server.kill();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
