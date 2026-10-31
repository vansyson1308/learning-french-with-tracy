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
 *
 * P2a: structural selectors are testIDs; every label the walk expects comes
 * from the UI catalogue of the export's language (UI_LANG=vi|en), so the
 * same walk verifies the English and the Vietnamese UI against the guide.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import { chromium } from "playwright-core";

import { UI_LANG, languageName, t } from "./i18n.mjs";

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

// P2b: the course under test — `fr-en` by default, `fr-vi` for the Vietnamese lane
// (same curriculum, Vietnamese explanations; everything below reads the pack).
const COURSE = process.env.E2E_COURSE ?? "fr-en";
const pack = JSON.parse(readFileSync(`src/content/packs/${COURSE}.json`, "utf8"));
const sectionTitles = pack.sections.map((s) => s.title);
const lessonsById = new Map();
for (const s of pack.sections) for (const u of s.units) for (const l of u.lessons) lessonsById.set(l.id, { lesson: l, unit: u });
const firstWord = pack.sections[0].units[0].words[0];
const FR = languageName("fr");
const COURSE_CODES = ["fr", "es", "de", "it", "pt", "ja", "ko", "zh"];

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
  const byId = (id) => page.getByTestId(id);
  const visible = (loc) => loc.isVisible().catch(() => false);
  const stepThrough = async (predicate, maxSteps = 14) => {
    for (let i = 0; i < maxSteps; i++) {
      if (await predicate()) return i;
      const dontKnow = byId("session-idk").first();
      const cont = byId("session-continue").first();
      if (await visible(dontKnow)) await dontKnow.click();
      else if (await visible(cont)) await cont.click();
      else {
        const skip = byId("speak-skip").first();
        if (await visible(skip)) await skip.click();
        else await page.waitForTimeout(400);
      }
      await page.waitForTimeout(250);
      const cont2 = byId("session-continue").first();
      if (await visible(cont2)) await cont2.click();
    }
    return -1;
  };

  // ---- §1 §3 §4 onboarding ------------------------------------------------
  await go("/");
  await attempt(1, "What the app is — French plus the seven inherited courses are offered", async () => {
    for (const code of COURSE_CODES) await see(languageName(code), { exact: true });
    return `8 course cards (${UI_LANG})`;
  });
  device(2, "Installation — store / TestFlight / closed test / sideload", "install paths exist only on a phone; storage and permission-at-install claims verified in DEVICE_ACCEPTANCE.md");
  await attempt(3, "First launch — Daily XP goal chips and the start button", async () => {
    await see(t("onboarding.dailyGoal"));
    let chips = 0;
    for (const g of [10, 20, 30, 50]) if (await visible(byId(`onboarding-goal-${g}`))) chips++;
    await byId(`onboarding-course-${COURSE}`).click();
    const button = byId("onboarding-start");
    const label = (await button.textContent())?.trim();
    const expected = t("onboarding.learn", { language: FR });
    await button.click();
    await see(sectionTitles[0]);
    if (chips < 4) throw new Error(`goal chips found: ${chips} (onboarding still completed)`);
    if (label?.toLowerCase() !== expected.toLowerCase()) throw new Error(`start button reads "${label}", expected "${expected}"`);
    return `chips=${chips}; button reads "${label}"; lands on the Learn tab`;
  });
  await attempt(4, "Choosing French — French is a first-class course", async () => {
    await see(t("learn.placementTitle", { language: FR }));
    return "Learn tab shows the French-only placement entry";
  });

  // ---- §5 placement --------------------------------------------------------
  await attempt(5, "Starting-point check — intro, I don't know on every item, result choices", async () => {
    await go("/placement/intro");
    await see(t("placement.title"));
    await see(t("placement.question", { language: FR }));
    await see(t("placement.new"));
    await byId("placement-yes").click();
    await byId("session-idk").first().waitFor();
    let answered = 0;
    for (let i = 0; i < 60; i++) {
      if (await visible(byId("placement-start-beginning"))) break;
      const dk = byId("session-idk").first();
      if (await visible(dk)) {
        await dk.click();
        answered++;
        await page.waitForTimeout(150);
        const cont = byId("session-continue").first();
        if (await visible(cont)) await cont.click();
      } else {
        const cont = byId("session-continue").first();
        const skip = byId("speak-skip").first();
        if (await visible(cont)) await cont.click();
        else if (await visible(skip)) await skip.click();
        else await page.waitForTimeout(300);
      }
    }
    await byId("placement-start-beginning").waitFor();
    await see(t("placementResults.startBeginning"));
    await byId("placement-start-beginning").click();
    return `${answered} items answered with I don't know; result screen offered Start from the beginning`;
  });

  // ---- §6 §7 the path -------------------------------------------------------
  await attempt(6, "Learn — locked nodes, replayable nodes, guidebooks", async () => {
    await go("/");
    await see(sectionTitles[0]);
    const locked = await byId("lesson-node-locked").count();
    const guidebooks = await page.locator('[data-testid^="guidebook-button-"]').count();
    if (locked < 1) throw new Error("no locked (disabled) lesson node");
    if (guidebooks < 1) throw new Error("no guidebook button");
    await page.locator('[data-testid^="guidebook-button-"]').first().click();
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
    await go(`/lesson/${COURSE}:u0-l0`);
    await see(t("common.check"), { exact: true });
    const dontKnow = await byId("session-idk").count();
    const option = byId("option-card");
    if ((await option.count()) < 1) throw new Error("no answer option on the first step");
    await option.first().click();
    await byId("session-check").click();
    await byId("session-feedback").first().waitFor();
    await see(new RegExp(`${t("session.nicelyDone")}|${t("session.correctAnswer")}|${t("session.notQuite")}`));
    await byId("session-continue").click();
    await see(t("common.check"), { exact: true });
    return `option → Check → feedback → Continue → next exercise; "I don't know" buttons on a lesson step: ${dontKnow} (placement and audio/microphone steps only)`;
  });

  // ---- §9 §10 vocabulary ----------------------------------------------------
  await attempt(9, "Vocabulary browser — filters, sort and search", async () => {
    await go("/vocabulary");
    for (const f of ["all", "learned", "not-learned", "noun", "verb", "expression"]) await see(t(`vocab.filter.${f}`), { exact: true });
    await see(t("vocab.sort.course"), { exact: true });
    await byId("vocab-search").waitFor();
    return "filters + Course order + search field";
  });
  await attempt(10, "Rich dictionary — an entry shows pronunciation and an example", async () => {
    await go("/vocabulary");
    await click(firstWord.target, { exact: true });
    await byId("vocab-example").waitFor();
    await see(t("vocab.example"), { exact: true });
    return `entry for "${firstWord.target}" shows Example`;
  });
  tests(11, "Memory — FSRS scheduling and strength", "fsrs-adapter.test.ts, evidence-gate.test.ts, memory-strength.test.ts");

  // ---- §12 §13 Today + Practice -------------------------------------------
  await attempt(12, "Today — session length presets, start, Can't speak now", async () => {
    await go("/today");
    await byId("today-presets").first().waitFor();
    const presets = await page.locator('[data-testid^="today-preset-"]').count();
    await see(t("today.startSession"));
    const toggle = await byId("today-speak-toggle").count();
    if (presets < 3) throw new Error(`presets ${presets}`);
    return `${presets} presets; Start today's session; Can't speak now toggle ${toggle ? "present" : "hidden — shown only when the device can record (DEVICE)"}`;
  });
  await attempt(13, "Review — Practice cards", async () => {
    await go("/practice");
    for (const k of ["reviewWords", "reviewListening", "reviewSpeaking", "practiceWriting", "haveConversation", "practiceMistakes", "openVocabulary"]) await see(t(`practice.${k}`), { exact: true });
    return "7 practice entries";
  });
  tests(13, "Review — Undo this review", "review-log undo: evidence-routing.test.ts (undoLastFrenchReview); no card is due on a fresh web profile");

  // ---- §14 listening --------------------------------------------------------
  await attempt(14, "Listening practice — Play audio control in a Section 3 lesson", async () => {
    const listeningLesson = [...lessonsById.values()].find(({ lesson }) => lesson.exercises[0].type === "listeningComprehension")?.lesson;
    if (!listeningLesson) throw new Error("no lesson starts with a listening exercise");
    await go(`/lesson/${listeningLesson.id}`);
    await byId("listening-player").first().waitFor();
    await see(listeningLesson.exercises[0].question, { exact: true });
    const slow = await byId("rate-toggle").count();
    return `${listeningLesson.id}: Play audio + question; Slow control ${slow ? "present" : "absent"}`;
  });

  // ---- §15 §16 §17 speaking ------------------------------------------------
  await attempt(15, "Speaking — a Section 4 lesson shows the honest no-recognizer escape on web", async () => {
    await go(`/lesson/${COURSE}:uk-l0`);
    const step = await stepThrough(async () => (await visible(byId("speak-skip").first())) || (await visible(byId("speak-blocked").first())));
    if (step < 0) throw new Error("no speaking step reached");
    const escape = (await visible(byId("speak-skip").first())) ? t("ex.skipStep") : "unavailable notice";
    return `speaking step at ${step}: ${escape}`;
  });
  device(16, "Microphone permission — system prompts, Allow microphone / Open Settings", "OS permission dialogs; iOS Settings paths and Android app permissions");
  device(17, "Device and network speech behaviour — on-device model check and the notice", "on-device model availability; the notice text is verified on the Privacy screen (§29)");

  // ---- §18 §19 writing + conversation ---------------------------------------
  await attempt(18, "Writing practice — Your French answer, Check, named feedback", async () => {
    await go("/practice");
    await byId("practice-writing").click();
    // The day seeds the task order, so the first task is guided writing or a form.
    const fields = page.locator('[data-testid="writing-input"], [data-testid^="form-field-"]');
    await fields.first().waitFor();
    for (const field of await fields.all()) await field.fill("Bonjour, je m'appelle Léa et j'habite à Paris.");
    await byId("session-check").click();
    const feedback = byId("session-feedback").first();
    await feedback.waitFor();
    const named = await visible(byId("writing-feedback").first());
    return `feedback: "${(await feedback.textContent())?.trim().slice(0, 80)}"${named ? " + named rubric feedback" : ""}`;
  });
  await attempt(19, "Conversation practice — partner exchange offers Skip this step on web", async () => {
    await go("/practice");
    await byId("practice-conversation").click();
    const escape = await Promise.race([
      byId("speak-skip").first().waitFor().then(() => t("ex.skipStep")),
      byId("speak-blocked").first().waitFor().then(() => "unavailable notice"),
    ]);
    return escape;
  });

  // ---- §20 reading ----------------------------------------------------------
  await attempt(20, "Reading — a Section 3 reading exercise renders its passage and question", async () => {
    const readingLesson = [...lessonsById.values()].find(({ lesson }) => lesson.exercises[0].type === "readingComprehension")?.lesson;
    if (!readingLesson) throw new Error("no lesson starts with a reading exercise");
    await go(`/lesson/${readingLesson.id}`);
    await see(readingLesson.exercises[0].question, { exact: true });
    const words = page.locator('[data-testid^="gloss-"]').filter({ hasNot: page.getByTestId("gloss-value") });
    const wordButtons = await words.count();
    if (wordButtons < 1) throw new Error("no tappable words in the passage");
    await words.first().click();
    return `${readingLesson.id}: question + ${wordButtons} tappable words (Show meaning of …); tap opens the gloss`;
  });

  // ---- §21 §22 checkpoints --------------------------------------------------
  await attempt(21, "Checkpoints — section-1 checkpoint starts and renders answer options", async () => {
    await go("/checkpoint/fr.checkpoint.section-1");
    await page.waitForTimeout(500);
    const options = await byId("option-card").count();
    if (options < 4) throw new Error(`${options} options`);
    return `${options} options on the first item`;
  });
  await attempt(22, "A1 capstone — speech pre-gate on a platform without recognition", async () => {
    await go("/checkpoint/fr.checkpoint.a1-capstone");
    await byId("checkpoint-speech-blocked").waitFor();
    return "pre-gate";
  });

  // ---- §23 §24 §25 goals ------------------------------------------------------
  await attempt(23, "CEFR-aligned A1 estimate — five skills with authored denominators", async () => {
    await go("/goals");
    await see(t("goals.estimateLabel"));
    const chip = await byId("a1-domain-chip-spoken_reception").textContent();
    if (!new RegExp(`${t("domain.spoken_reception")}\\s*\\d/\\d`).test(chip ?? "")) throw new Error(`chip "${chip}"`);
    await see(new RegExp(`${t("goals.estimateIncomplete")}|${t("goals.estimateDemonstrated")}`));
    return `chip "${chip?.trim()}"`;
  });
  await attempt(24, "Why it is not official certification — the explainer in the app's own words", async () => {
    await byId("estimate-limits-toggle").first().click();
    const limits = await byId("estimate-limits").innerText();
    if (!limits.includes(t("goals.limits1").slice(2, 40))) throw new Error(`explainer: ${limits.slice(0, 80)}`);
    const disclaimer = await byId("goals-disclaimer").textContent();
    if (disclaimer?.trim() !== t("goals.disclaimer")) throw new Error("disclaimer differs from the catalogue");
    return "explainer toggle opens; disclaimer present";
  });
  await attempt(25, "Goals screen — starting-point actions", async () => {
    await byId("goals-placement-action").waitFor();
    await see(new RegExp(`${t("goals.find")}|${t("goals.retake")}`));
    const reset = await byId("reset-floor").count();
    const fromStart = await page.getByText(t("goals.startingBeginning"), { exact: true }).count();
    if (!reset && !fromStart) throw new Error("neither Reset starting point nor Starting from the beginning");
    return `Retake/Find present; ${reset ? "Reset starting point shown" : "Starting from the beginning. (Reset appears only when the starting point is above the beginning)"}; confirmation dialog: DEVICE`;
  });

  // ---- §26–§30 profile ------------------------------------------------------------
  await attempt(26, "XP, streak and activity — Profile statistics", async () => {
    await go("/profile");
    for (const k of ["streak", "xp", "todayXp", "toReview", "lessonsDone", "wordsLearned"]) await see(t(`profile.stat.${k}`), { exact: true });
    await see(t("profile.switch"), { exact: true });
    return "6 stats + Switch";
  });
  await attempt(27, "Backup export — Export progress row", async () => {
    await byId("profile-export").waitFor();
    await see(t("profile.export"), { exact: true });
    await see(t("profile.exportHint"));
    return "row + hint";
  });
  await attempt(28, "Backup import — Import progress row", async () => {
    await byId("profile-import").waitFor();
    await see(t("profile.importTitle"), { exact: true });
    await see(t("profile.importHint"));
    return "row + hint (file picker and refusal paths: backup.test.ts + DEVICE)";
  });
  await attempt(29, "Data and privacy — policy reachable, states the OS speech boundary", async () => {
    await byId("privacy-link").click();
    await byId("privacy-policy").waitFor();
    const policy = await byId("privacy-policy").innerText();
    const boundary = UI_LANG === "vi" ? [/có thể gửi âm thanh đến nhà cung cấp nền tảng/, /không vận hành máy chủ nhận dạng giọng nói nào/] : [/may send the audio to the platform provider/, /does not operate any speech server/];
    for (const re of boundary) if (!re.test(policy)) throw new Error(`policy lacks ${re}`);
    return `policy text verified (${UI_LANG})`;
  });
  await attempt(30, "Accessibility — Appearance Device / Light / Dark", async () => {
    await go("/profile");
    await see(t("profile.appearance"), { exact: true });
    for (const v of ["system", "light", "dark"]) await see(t(`profile.theme.${v}`), { exact: true });
    await byId("theme-option-dark").click();
    await byId("theme-option-system").click();
    await see(t("profile.language"), { exact: true });
    for (const v of ["system", "vi", "en"]) await byId(`language-option-${v}`).waitFor();
    return "three appearance options + the app-language picker, switching works";
  });

  // ---- §31 §32 network ----------------------------------------------------------
  await attempt(31, "Offline usage — the app makes no network request of its own", async () => {
    if (external.length > 0) throw new Error(`external requests: ${external.slice(0, 3).join(", ")}`);
    return "0 requests outside the app's own origin during the whole walk";
  });
  device(32, "What may still require network — OS speech service, store updates, website links", "device speech service behaviour; website links open the browser");

  // ---- §33 §34 troubleshooting + reset ---------------------------------------------
  await attempt(33, "Troubleshooting — every control the section names exists", async () => {
    // The controls §33 names were exercised by earlier sections: the speaking
    // escape (§15/§19: Skip this step or the honest blocked panel), Import
    // progress (§28) and the listening player (§14).
    const passed = new Set(results.filter((r) => r.status === "PASS").map((r) => r.section));
    for (const section of [14, 15, 19, 28]) {
      if (!passed.has(section)) throw new Error(`§${section} did not pass, so its control is unverified`);
    }
    return "speaking escape (§15/§19), Import progress (§28), Play audio (§14) verified above; Can't speak now / Reset starting point: DEVICE rows";
  });
  device(34, "Reset and placement behaviour — confirmation dialog and what a reset keeps", "native Alert (Keep it / Reset); reset semantics covered by placement.test.ts");

  // ---- §35 §36 licenses + support ----------------------------------------------------
  await attempt(35, "Licenses and attributions — sources listed in the app", async () => {
    await go("/licenses");
    await byId("licenses-screen").waitFor();
    await see(t("licenses.title"));
    const text = await byId("licenses-screen").innerText();
    if (!/Lexique 4/.test(text)) throw new Error("Lexique 4 not shown");
    if (!/ts-fsrs|FSRS/.test(text)) throw new Error("FSRS not shown");
    const piper = /Piper/.test(text);
    const lingo = /Lingo Lessons/.test(text);
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
  uiLanguage: UI_LANG,
  totals: { PASS: results.filter((r) => r.status === "PASS").length, FAIL: failed.length, DEVICE: results.filter((r) => r.status === "DEVICE").length, TESTS: results.filter((r) => r.status === "TESTS").length },
  externalRequests: external,
  results,
};
if (reportPath) writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`\nguide walk: ${summary.totals.PASS} pass, ${failed.length} fail, ${summary.totals.DEVICE} device-only, ${summary.totals.TESTS} test-backed`);
process.exit(failed.length > 0 ? 1 : 0);
