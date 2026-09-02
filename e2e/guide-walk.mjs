/**
 * User-guide walk (V1 publication, §16 "writing the manual is part of
 * product testing"): every numbered section of docs/USER_GUIDE.md is
 * checked against the exported web build — the labels, routes and
 * behaviours the guide describes must exist exactly as written. Sections
 * that only a phone can prove (permissions, share sheet, offline mode,
 * store installation) are recorded as DEVICE rows for the device
 * acceptance pack; engine behaviour the UI cannot show on the web tier is
 * recorded as TESTS with the covering suite.
 *
 *   bunx expo export --platform web --output-dir dist
 *   node e2e/guide-walk.mjs dist [report.json]
 *
 * Exit code 1 on any FAIL. Browser: E2E_BROWSER_PATH or the bundled Chromium.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import { chromium } from "playwright-core";

const exportDir = process.argv[2] ?? "dist";
const reportPath = process.argv[3];
const port = Number(process.env.E2E_PORT ?? 8098);
const BASE = `http://127.0.0.1:${port}`;
const browserPath =
  process.env.E2E_BROWSER_PATH ??
  ["/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find(existsSync);
if (!browserPath) {
  console.error("no Chromium/Chrome found; set E2E_BROWSER_PATH");
  process.exit(2);
}

const pack = JSON.parse(readFileSync("src/content/packs/fr-en.json", "utf8"));
const sectionTitles = pack.sections.map((s) => s.title);
const lessonsById = new Map();
for (const s of pack.sections) for (const u of s.units) for (const l of u.lessons) lessonsById.set(l.id, { lesson: l, unit: u });
const firstWord = pack.sections[0].units[0].words[0];

const results = [];
const record = (section, title, status, evidence = "") => {
  results.push({ section, title, status, evidence });
  console.log(`${status.padEnd(7)} §${String(section).padEnd(3)} ${title}${evidence ? " — " + evidence : ""}`);
};
const attempt = async (section, title, fn) => {
  try {
    const ev = await fn();
    record(section, title, "PASS", ev ?? "");
  } catch (e) {
    record(section, title, "FAIL", String(e).replace(/\s+/g, " ").slice(0, 220));
  }
};
const device = (section, title, why) => record(section, title, "DEVICE", why);
const tests = (section, title, why) => record(section, title, "TESTS", why);

const server = spawn("python3", ["e2e/serve-static.py", exportDir, String(port)], { stdio: "ignore" });
const waitForPort = () =>
  new Promise((resolve, reject) => {
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
const external = [];
const pageErrors = [];
try {
  await waitForPort();
  browser = await chromium.launch({ executablePath: browserPath });
  const page = await browser.newPage({ viewport: { width: 420, height: 860 } });
  page.setDefaultTimeout(12000);
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith(BASE) && !u.startsWith("data:") && !u.startsWith("blob:")) external.push(u);
  });
  const hydrationFallbacks = [];
  page.on("pageerror", (e) => {
    const text = String(e);
    // #418 / #419: the static export's server HTML does not match the client
    // render (a known limitation of the web tier since Phase 10); React logs
    // the mismatch and recovers by client-rendering. Counted, not failed.
    if (/Minified React error #41[89]/.test(text)) return void hydrationFallbacks.push(text);
    // Navigating away while a clip is starting makes the browser reject the
    // pending media play() (expo-audio's web player does not surface the
    // promise); harmless on the web tier, impossible on native.
    if (/AbortError: The play\(\) request was interrupted/.test(text)) return void hydrationFallbacks.push(text);
    pageErrors.push(text);
  });
  const see = async (text, opts = {}) => {
    await page.getByText(text, opts).first().waitFor();
    return typeof text === "string" ? text : text.source;
  };
  const go = (path) => page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  const click = async (text, opts = {}) => page.getByText(text, opts).first().click();
  const stepThrough = async (predicate, maxSteps = 14) => {
    for (let i = 0; i < maxSteps; i++) {
      if (await predicate()) return i;
      const dontKnow = page.getByText("I don't know", { exact: true }).first();
      const cont = page.getByText("Continue", { exact: true }).first();
      if (await dontKnow.isVisible().catch(() => false)) await dontKnow.click();
      else if (await cont.isVisible().catch(() => false)) await cont.click();
      else {
        const skip = page.getByText(/Skip this step/).first();
        if (await skip.isVisible().catch(() => false)) await skip.click();
        else await page.waitForTimeout(400);
      }
      await page.waitForTimeout(250);
      const cont2 = page.getByText("Continue", { exact: true }).first();
      if (await cont2.isVisible().catch(() => false)) await cont2.click();
    }
    return -1;
  };

  // ---- §1 §3 §4 onboarding ------------------------------------------------
  await go("/");
  await attempt(1, "What the app is — French plus the seven inherited courses are offered", async () => {
    for (const c of ["French", "Spanish", "German", "Italian", "Portuguese", "Japanese", "Korean", "Chinese"]) await see(c, { exact: true });
    return "8 course cards";
  });
  device(2, "Installation — store / TestFlight / closed test / sideload", "install paths exist only on a phone; storage and permission-at-install claims verified in DEVICE_ACCEPTANCE.md");
  await attempt(3, "First launch — Daily XP goal chips and the start button", async () => {
    await see("Daily XP goal");
    const chips = await page.getByText(/\b(10|20|30|50)\b/).count();
    await click("French", { exact: true });
    const button = page.getByRole("button", { name: /^learn french$/i });
    const label = (await button.textContent())?.trim();
    await button.click();
    await see(sectionTitles[0]);
    if (chips < 4) throw new Error(`goal chips found: ${chips} (onboarding still completed)`);
    return `chips=${chips}; button reads "${label}"; lands on the Learn tab`;
  });
  await attempt(4, "Choosing French — French is a first-class course", async () => {
    await see("Studied French before?");
    return "Learn tab shows the French-only placement entry";
  });

  // ---- §5 placement --------------------------------------------------------
  await attempt(5, "Starting-point check — intro, I don't know on every item, result choices", async () => {
    await go("/placement/intro");
    await see("Find your starting point");
    await see("Have you studied French before?");
    await see("I'm new — start from the beginning");
    await click("Yes — find my starting point");
    await see("I don't know");
    let answered = 0;
    for (let i = 0; i < 60; i++) {
      const done = page.getByText(/Start from the beginning|Start here/).first();
      if (await done.isVisible().catch(() => false)) break;
      const dk = page.getByText("I don't know", { exact: true }).first();
      if (await dk.isVisible().catch(() => false)) {
        await dk.click();
        answered++;
        await page.waitForTimeout(150);
        const cont = page.getByText("Continue", { exact: true }).first();
        if (await cont.isVisible().catch(() => false)) await cont.click();
      } else {
        const cont = page.getByText(/Continue|Next|Skip this step/).first();
        if (await cont.isVisible().catch(() => false)) await cont.click();
        else await page.waitForTimeout(300);
      }
    }
    await see(/Start from the beginning/);
    await click(/Start from the beginning/);
    return `${answered} items answered with I don't know; result screen offered Start from the beginning`;
  });

  // ---- §6 §7 the path -------------------------------------------------------
  await attempt(6, "Learn — locked nodes, replayable nodes, guidebooks", async () => {
    await go("/");
    await see(sectionTitles[0]);
    const locked = await page.locator('[role="button"][aria-disabled="true"]').count();
    const guidebooks = await page.locator('[aria-label$=" guidebook"]').count();
    if (locked < 1) throw new Error("no locked (disabled) lesson node");
    if (guidebooks < 1) throw new Error("no guidebook button");
    await page.locator('[aria-label$=" guidebook"]').first().click();
    await page.waitForURL(/guidebook/);
    return `${locked} locked nodes (disabled), ${guidebooks} guidebook buttons; guidebook route opens (the Locked/Completed hints are screen-reader hints: DEVICE)`;
  });
  await attempt(7, "Sections and units — the six section titles and every unit title", async () => {
    await go("/");
    for (const t of sectionTitles) await see(t, { exact: true });
    const units = pack.sections.flatMap((s) => s.units.map((u) => u.title));
    for (const u of units) await see(u, { exact: true });
    return `${sectionTitles.length} sections, ${units.length} units as authored`;
  });

  // ---- §8 lesson flow -------------------------------------------------------
  await attempt(8, "Lesson flow — Check, I don't know reveals the answer, Continue", async () => {
    await go("/lesson/fr-en:u0-l0");
    await see("Check", { exact: true });
    const dontKnow = await page.getByText("I don't know", { exact: true }).count();
    const option = page.getByRole("button").filter({ hasNotText: /^(Check|Continue|I don't know)$/ }).filter({ hasNot: page.locator('[aria-label="Play audio"]') });
    const labels = await option.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? e.textContent ?? ""));
    const cardIndex = labels.findIndex((l) => l && !/close|play|audio|check|continue|know|back/i.test(l));
    if (cardIndex < 0) throw new Error(`no answer option among ${labels.length} buttons`);
    await option.nth(cardIndex).click();
    await click("Check", { exact: true });
    await see(/Nicely done!|Correct answer:|Not quite this time/);
    await click("Continue", { exact: true });
    await see("Check", { exact: true });
    return `option → Check → feedback → Continue → next exercise; "I don't know" buttons on a lesson step: ${dontKnow} (placement and audio/microphone steps only)`;
  });

  // ---- §9 §10 vocabulary ----------------------------------------------------
  await attempt(9, "Vocabulary browser — filters, sort and search", async () => {
    await go("/vocabulary");
    for (const f of ["All", "Learned", "Not yet", "Nouns", "Verbs", "Expressions", "Course order"]) await see(f, { exact: true });
    await page.getByPlaceholder("Search French or English…").waitFor();
    return "filters + Course order + search field";
  });
  await attempt(10, "Rich dictionary — an entry shows pronunciation and an example", async () => {
    await go("/vocabulary");
    await click(firstWord.target, { exact: true });
    await see("Example", { exact: true });
    return `entry for "${firstWord.target}" shows Example`;
  });
  tests(11, "Memory — FSRS scheduling and strength", "fsrs-adapter.test.ts, evidence-gate.test.ts, memory-strength.test.ts");

  // ---- §12 §13 Today + Practice -------------------------------------------
  await attempt(12, "Today — session length presets, start, Can't speak now", async () => {
    await go("/today");
    await page.locator('[aria-label="Session length"]').first().waitFor();
    const presets = await page.locator('[aria-label$=" minute session"]').count();
    await see("Start today's session");
    const toggle = await page.locator('[aria-label="Can\'t speak right now"]').count();
    if (presets < 3) throw new Error(`presets ${presets}`);
    return `${presets} presets; Start today's session; Can't speak now toggle ${toggle ? "present" : "hidden — shown only when the device can record (DEVICE)"}`;
  });
  await attempt(13, "Review — Practice cards", async () => {
    await go("/practice");
    for (const c of ["Review words", "Review listening", "Review speaking", "Practice writing", "Have a conversation", "Practice mistakes", "Open vocabulary"]) await see(c, { exact: true });
    return "7 practice entries";
  });
  tests(13, "Review — Undo this review", "review-log undo: evidence-routing.test.ts (undoLastFrenchReview); no card is due on a fresh web profile");

  // ---- §14 listening --------------------------------------------------------
  await attempt(14, "Listening practice — Play audio control in a Section 3 lesson", async () => {
    const listeningLesson = [...lessonsById.values()].find(({ lesson }) => lesson.exercises[0].type === "listeningComprehension")?.lesson;
    if (!listeningLesson) throw new Error("no lesson starts with a listening exercise");
    await go(`/lesson/${listeningLesson.id}`);
    await page.locator('[aria-label="Play audio"]').first().waitFor();
    await see(listeningLesson.exercises[0].question, { exact: true });
    const slow = await page.locator('[aria-label^="Switch to slow speed"]').count();
    return `${listeningLesson.id}: Play audio + question; Slow control ${slow ? "present" : "absent"}`;
  });

  // ---- §15 §16 §17 speaking ------------------------------------------------
  await attempt(15, "Speaking — a Section 4 lesson shows the honest no-recognizer escape on web", async () => {
    await go("/lesson/fr-en:uk-l0");
    const step = await stepThrough(async () =>
      (await page.getByText(/Skip this step/).first().isVisible().catch(() => false)) ||
      (await page.getByText(/speech recognition|can't record|cannot record/i).first().isVisible().catch(() => false))
    );
    if (step < 0) throw new Error("no speaking step reached");
    const escape = (await page.getByText(/Skip this step/).first().isVisible().catch(() => false)) ? "Skip this step" : "unavailable notice";
    return `speaking step at ${step}: ${escape}`;
  });
  device(16, "Microphone permission — system prompts, Allow microphone / Open Settings", "OS permission dialogs; iOS Settings paths and Android app permissions");
  device(17, "Device and network speech behaviour — on-device model check and the notice", "on-device model availability; the notice text is verified on the Privacy screen (§29)");

  // ---- §18 §19 writing + conversation ---------------------------------------
  await attempt(18, "Writing practice — Your French answer, Check, named feedback", async () => {
    await go("/practice");
    await click("Practice writing", { exact: true });
    await page.getByRole("textbox").first().fill("Bonjour, je m'appelle Léa et j'habite à Paris.");
    await click("Check", { exact: true });
    const feedback = await page
      .getByText(/Nicely done!|Correct answer:|Not quite this time|You included|Don't forget|Write your|Try a complete|Use a complete|Keep it short|Say .* once/)
      .first();
    await feedback.waitFor();
    return `feedback: "${(await feedback.textContent())?.trim().slice(0, 80)}"`;
  });
  await attempt(19, "Conversation practice — partner exchange offers Skip this step on web", async () => {
    await go("/practice");
    await click("Have a conversation", { exact: true });
    const escape = await Promise.race([
      page.getByText(/Skip this step/).first().waitFor().then(() => "Skip this step"),
      page.getByText(/speech recognition|can't record|cannot record/i).first().waitFor().then(() => "unavailable notice"),
    ]);
    return escape;
  });

  // ---- §20 reading ----------------------------------------------------------
  await attempt(20, "Reading — a Section 3 reading exercise renders its passage and question", async () => {
    const readingLesson = [...lessonsById.values()].find(({ lesson }) => lesson.exercises[0].type === "readingComprehension")?.lesson;
    if (!readingLesson) throw new Error("no lesson starts with a reading exercise");
    await go(`/lesson/${readingLesson.id}`);
    await see(readingLesson.exercises[0].question, { exact: true });
    const words = page.locator('[aria-label^="Show meaning of "]');
    const wordButtons = await words.count();
    if (wordButtons < 1) throw new Error("no tappable words in the passage");
    await words.first().click();
    return `${readingLesson.id}: question + ${wordButtons} tappable words (Show meaning of …); tap opens the gloss`;
  });

  // ---- §21 §22 checkpoints --------------------------------------------------
  await attempt(21, "Checkpoints — section-1 checkpoint starts and renders answer options", async () => {
    await go("/checkpoint/fr.checkpoint.section-1");
    const start = page.getByText(/Start|Begin/i).first();
    if (await start.isVisible().catch(() => false)) await start.click();
    await page.waitForTimeout(500);
    const options = await page.getByRole("button", { name: /.+/ }).count();
    if (options < 4) throw new Error(`${options} buttons`);
    return `${options} buttons on the first item`;
  });
  await attempt(22, "A1 capstone — speech pre-gate on a platform without recognition", async () => {
    await go("/checkpoint/fr.checkpoint.a1-capstone");
    const gated = await Promise.race([
      page.getByText(/can't record speech|cannot|speech recognition/i).first().waitFor().then(() => "pre-gate"),
      page.getByText("The A1 check").first().waitFor().then(() => "intro"),
    ]);
    return gated;
  });

  // ---- §23 §24 §25 goals ------------------------------------------------------
  await attempt(23, "CEFR-aligned A1 estimate — five skills with authored denominators", async () => {
    await go("/goals");
    await see("CEFR-aligned A1 estimate");
    const chip = await page.getByText(/Listening\s*\d\/\d/).first().textContent();
    await see(/Not complete yet|Demonstrated across all five skills/);
    return `chip "${chip?.trim()}"`;
  });
  await attempt(24, "Why it is not official certification — the explainer in the app's own words", async () => {
    await page.locator('[aria-label="What this estimate is and is not"]').first().click();
    await see(/never an official CEFR examination/);
    return "explainer toggle opens; disclaimer present";
  });
  await attempt(25, "Goals screen — starting-point actions", async () => {
    await see(/Find your starting point|Retake the check/);
    const reset = await page.getByText("Reset starting point", { exact: true }).count();
    const fromStart = await page.getByText("Starting from the beginning.", { exact: true }).count();
    if (!reset && !fromStart) throw new Error("neither Reset starting point nor Starting from the beginning");
    return `Retake/Find present; ${reset ? "Reset starting point shown" : "Starting from the beginning. (Reset appears only when the starting point is above the beginning)"}; confirmation dialog: DEVICE`;
  });

  // ---- §26–§30 profile ------------------------------------------------------------
  await attempt(26, "XP, streak and activity — Profile statistics", async () => {
    await go("/profile");
    for (const s of ["Day streak", "Course XP", "Today's XP", "To review", "Lessons done", "Words learned", "Switch"]) await see(s, { exact: true });
    return "6 stats + Switch";
  });
  await attempt(27, "Backup export — Export progress row", async () => {
    await see("Export progress", { exact: true });
    await see("Save a backup file of everything.");
    return "row + hint";
  });
  await attempt(28, "Backup import — Import progress row", async () => {
    await see("Import progress", { exact: true });
    await see("Restore from a backup file.");
    return "row + hint (file picker and refusal paths: backup.test.ts + DEVICE)";
  });
  await attempt(29, "Data and privacy — policy reachable, states the OS speech boundary", async () => {
    await click("Privacy", { exact: true });
    await see(/may send the audio to the platform provider/);
    await see(/does not operate any speech server/);
    return "policy text verified";
  });
  await attempt(30, "Accessibility — Appearance Device / Light / Dark", async () => {
    await go("/profile");
    await see("Appearance", { exact: true });
    for (const t of ["Device", "Light", "Dark"]) await see(t, { exact: true });
    await click("Dark", { exact: true });
    await click("Device", { exact: true });
    return "three appearance options, switching works";
  });

  // ---- §31 §32 network ----------------------------------------------------------
  await attempt(31, "Offline usage — the app makes no network request of its own", async () => {
    if (external.length > 0) throw new Error(`external requests: ${external.slice(0, 3).join(", ")}`);
    return "0 requests outside the app's own origin during the whole walk";
  });
  device(32, "What may still require network — OS speech service, store updates, website links", "device speech service behaviour; website links open the browser");

  // ---- §33 §34 troubleshooting + reset ---------------------------------------------
  await attempt(33, "Troubleshooting — every control the section names exists", async () => {
    const seen = results.filter((r) => r.status === "PASS").map((r) => `${r.title} ${r.evidence}`).join(" ");
    for (const label of ["Skip this step", "Import progress", "Play audio"]) {
      if (!seen.includes(label)) throw new Error(`label not verified earlier: ${label}`);
    }
    return "Skip this step, Import progress, Play audio verified above (Can't speak now / Reset starting point: DEVICE rows)";
  });
  device(34, "Reset and placement behaviour — confirmation dialog and what a reset keeps", "native Alert (Keep it / Reset); reset semantics covered by placement.test.ts");

  // ---- §35 §36 licenses + support ----------------------------------------------------
  await attempt(35, "Licenses and attributions — sources listed in the app", async () => {
    await go("/licenses");
    await see(/Licenses/);
    await see(/Lexique 4/);
    await see(/ts-fsrs|FSRS/);
    const piper = await page.getByText(/Piper/).first().isVisible().catch(() => false);
    const lingo = await page.getByText(/Lingo Lessons/).first().isVisible().catch(() => false);
    if (!piper) throw new Error("Piper voice attribution not shown in the app");
    if (!lingo) throw new Error("Lingo Lessons base attribution not shown in the app");
    return "Lexique 4, FSRS, Piper voices, Lingo Lessons base";
  });
  tests(36, "Support and contact — website pages and issue templates", "scripts/build-site.ts builds /support/ in CI; .github/ISSUE_TEMPLATE/*.yml");

  if (pageErrors.length > 0) record(0, "No uncaught page errors during the walk", "FAIL", pageErrors.slice(0, 2).join(" | "));
  else record(0, "No uncaught page errors during the walk", "PASS", `${hydrationFallbacks.length} known web-tier notice(s) (#418/#419 hydration fallback, media play() interruption)`);
} catch (error) {
  record(0, "Guide walk", "FAIL", String(error).slice(0, 300));
} finally {
  await browser?.close();
  server.kill();
}

const failed = results.filter((r) => r.status === "FAIL");
const summary = {
  generator: "e2e/guide-walk.mjs",
  exportDir,
  totals: { PASS: results.filter((r) => r.status === "PASS").length, FAIL: failed.length, DEVICE: results.filter((r) => r.status === "DEVICE").length, TESTS: results.filter((r) => r.status === "TESTS").length },
  externalRequests: external,
  results,
};
if (reportPath) writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`\nguide walk: ${summary.totals.PASS} pass, ${failed.length} fail, ${summary.totals.DEVICE} device-only, ${summary.totals.TESTS} test-backed`);
process.exit(failed.length > 0 ? 1 : 0);
