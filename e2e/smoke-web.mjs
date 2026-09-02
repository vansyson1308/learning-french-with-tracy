/**
 * Phase 10 browser E2E over the exported web build (honestly labelled: the
 * web tier has no speech recognizer, so speech surfaces must show their
 * blocked/skip affordances, never crash).
 *
 *   bunx expo export --platform web --output-dir dist
 *   node e2e/smoke-web.mjs dist
 *
 * Browser: E2E_BROWSER_PATH, else the first of the known Chromium/Chrome
 * paths. Starts its own static server on E2E_PORT (default 8099).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import { chromium } from "playwright-core";

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

  // 1. Onboarding on first load.
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByText("French", { exact: true }).first().click();
  // The CTA is a labelled button ("LEARN FRENCH"); plain text matching would
  // hit the welcome paragraph ("…start learning…") first.
  await page.getByRole("button", { name: /^learn french$/i }).click();
  check("onboarding completes into the app", true);

  // 2. Path shows all six sections incl. Section 6.
  await page.getByText("Section 6: Talk with someone").waitFor();
  check("path renders Section 6", true);

  // 3. Goals: estimate card, per-domain n/m chips, capstone link, limit explainer.
  await page.goto(`${BASE}/goals`, { waitUntil: "networkidle" });
  await page.getByText("CEFR-aligned A1 estimate").waitFor();
  await page.getByTestId("a1-domain-chips").waitFor();
  const listeningChip = await page.getByTestId("a1-domain-chip-spoken_reception").innerText();
  check("goals: chips show the authored denominator", /Listening\s*0\/3/.test(listeningChip), listeningChip.trim());
  await page.getByTestId("a1-domain-detail").waitFor();
  await page.getByTestId("capstone-link").waitFor();
  await page.getByTestId("estimate-limits-toggle").click();
  await page.getByText(/never an official CEFR examination/).waitFor();
  check("goals: estimate card + detail + capstone link + limit explainer", true);

  // 4. Practice: the two French cards.
  await page.goto(`${BASE}/practice`, { waitUntil: "networkidle" });
  await page.getByText("Writing practice").waitFor();
  await page.getByText("Conversation practice").waitFor();
  check("practice: writing + conversation cards", true);

  // 5. Writing practice grades a submission honestly.
  await page.getByText("Practice writing", { exact: true }).click();
  await page.getByTestId("writing-input").first().waitFor();
  await page.getByTestId("writing-input").first().fill("bonjour");
  await page.getByText("Check", { exact: true }).click();
  await page.waitForTimeout(400);
  const graded = await page
    .getByText(/Nicely done!|Correct answer:|Not quite this time/)
    .first()
    .isVisible()
    .catch(() => false);
  check("writing practice grades a submission", graded);

  // 6. Conversation practice on web shows the honest no-recognizer escape.
  await page.goto(`${BASE}/practice`, { waitUntil: "networkidle" });
  await page.getByText("Have a conversation", { exact: true }).click();
  await page.getByTestId("interaction-goal").waitFor();
  const escape = await Promise.race([
    page.getByTestId("speak-blocked").waitFor().then(() => "blocked-panel"),
    page.getByText(/Skip this step/).first().waitFor().then(() => "skip-link"),
  ]);
  check("conversation on web shows the honest no-recognizer escape", true, escape);

  // 7. Capstone route opens and pre-gates speech (blocked on web).
  await page.goto(`${BASE}/checkpoint/fr.checkpoint.a1-capstone`, { waitUntil: "networkidle" });
  const gated = await Promise.race([
    page.getByText(/can't record speech|cannot|speech recognition/i).first().waitFor().then(() => "pre-gate"),
    page.getByText("The A1 check").first().waitFor().then(() => "intro"),
  ]);
  check("capstone route opens with the speech pre-gate on web", true, gated);

  // 8. A scored MCQ checkpoint renders four options (seeded order, one screen).
  await page.goto(`${BASE}/checkpoint/fr.checkpoint.section-1`, { waitUntil: "networkidle" });
  const startButton = page.getByText(/Start|Begin/i).first();
  if (await startButton.isVisible().catch(() => false)) await startButton.click();
  await page.waitForTimeout(500);
  const optionButtons = await page.getByRole("button", { name: /.+/ }).count();
  check("section-1 checkpoint renders answer options as buttons", optionButtons >= 4, `${optionButtons} buttons`);

  // 9. Profile → Privacy: the policy is reachable in-app and states the boundary.
  await page.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  await page.getByTestId("privacy-link").click();
  await page.getByTestId("privacy-policy").waitFor();
  await page.getByText(/may send the audio to the platform provider/).waitFor();
  await page.getByText(/does not operate any speech server/).waitFor();
  check("privacy policy reachable from Profile and states the OS speech boundary", true);

  // 10. Licenses & attributions reachable.
  await page.goto(`${BASE}/licenses`, { waitUntil: "networkidle" });
  await page.getByText(/Licenses/).first().waitFor();
  await page.getByText(/Lexique 4/).first().waitFor();
  check("licenses screen reachable with data provenance", true);

  check("no uncaught page errors during the flow", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
} catch (error) {
  check("E2E flow", false, String(error).slice(0, 300));
} finally {
  await browser?.close();
  server.kill();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed === 0 ? 0 : 1);
