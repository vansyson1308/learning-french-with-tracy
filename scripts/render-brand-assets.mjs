/**
 * Render the brand mark (assets/brand/icon.svg) to every PNG the app and the
 * stores need, with the bundled Chromium (Playwright) — no native image
 * tooling required and no hand-edited bitmaps: change the SVG, re-run.
 *
 *   node scripts/render-brand-assets.mjs
 *
 * Outputs (assets/images/): icon.png 1024² opaque (iOS/App Store),
 * android-icon-foreground.png 1024² (mark only, transparent; kept inside
 * the adaptive-icon safe zone), android-icon-background.png 1024² (gradient),
 * android-icon-monochrome.png 1024² (white silhouette, transparent),
 * splash-icon.png 512² (mark only, transparent), favicon.png 48².
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const SVG = readFileSync(path.join(ROOT, "assets/brand/icon.svg"), "utf8");
const OUT = path.join(ROOT, "assets/images");
mkdirSync(OUT, { recursive: true });

const browserPath =
  process.env.E2E_BROWSER_PATH ??
  ["/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find(existsSync);
if (!browserPath) {
  console.error("no Chromium found; set E2E_BROWSER_PATH");
  process.exit(2);
}

/** Variant = which SVG groups to show, at what scale, on what backdrop. */
// Store graphics (never bundled into the app): Play's 512² listing icon and
// the 1024×500 feature graphic — the mark plus the product's display name
// from release/product.json, on the brand blue, no screenshot inside.
const PRODUCT = JSON.parse(readFileSync(path.join(ROOT, "release/product.json"), "utf8"));
const STORE_OUT = path.join(ROOT, "release/store");
mkdirSync(STORE_OUT, { recursive: true });

const VARIANTS = [
  { file: "icon.png", size: 1024, show: ["background", "mark"], scale: 1, transparent: false },
  { file: "android-icon-background.png", size: 1024, show: ["background"], scale: 1, transparent: false },
  // Adaptive icons are masked to ~66% of the canvas: keep the mark inside it.
  { file: "android-icon-foreground.png", size: 1024, show: ["mark"], scale: 0.62, transparent: true },
  { file: "android-icon-monochrome.png", size: 1024, show: ["mark"], scale: 0.62, transparent: true, mono: true },
  { file: "splash-icon.png", size: 512, show: ["mark"], scale: 0.9, transparent: true },
  { file: "favicon.png", size: 48, show: ["background", "mark"], scale: 1, transparent: false },
  { file: "play-icon-512.png", size: 512, show: ["background", "mark"], scale: 1, transparent: false, out: STORE_OUT },
];

function featureGraphicHtml() {
  const mark = variantSvg({ show: ["background", "mark"], scale: 0.62, transparent: true })
    .replace('<g id="background">', '<g id="background" visibility="hidden">')
    .replace('width="1024" height="1024"', 'width="420" height="420"');
  return `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;width:1024px;height:500px;overflow:hidden;font-family:'DejaVu Sans',sans-serif}
    .bg{position:absolute;inset:0;background:linear-gradient(135deg,#1D4ED8 0%,#0EA5E9 100%)}
    .mark{position:absolute;left:40px;top:40px}
    .text{position:absolute;left:470px;top:0;height:500px;display:flex;flex-direction:column;justify-content:center;color:#fff}
    .name{font-size:66px;font-weight:700;line-height:1.05;letter-spacing:-1px}
    .tag{font-size:28px;margin-top:22px;opacity:.92}
  </style></head><body><div class="bg"></div><div class="mark">${mark}</div>
  <div class="text"><div class="name">${PRODUCT.displayName.replace(" with ", "<br>with ")}</div><div class="tag">${PRODUCT.tagline ?? ""}</div></div></body></html>`;
}

function variantSvg(v) {
  let svg = SVG;
  for (const id of ["background", "mark"]) {
    if (!v.show.includes(id)) svg = svg.replace(`<g id="${id}">`, `<g id="${id}" visibility="hidden">`);
  }
  if (v.mono) svg = svg.replace('fill="#FF6B6B"', 'fill="#ffffff"');
  if (v.scale !== 1) {
    const t = (1024 - 1024 * v.scale) / 2;
    svg = svg.replace('<g id="mark">', `<g id="mark" transform="translate(${t} ${t}) scale(${v.scale})">`);
  }
  return svg;
}

const browser = await chromium.launch({ executablePath: browserPath });
try {
  for (const v of VARIANTS) {
    const page = await browser.newPage({ viewport: { width: v.size, height: v.size }, deviceScaleFactor: 1 });
    const svg = variantSvg(v).replace('width="1024" height="1024"', `width="${v.size}" height="${v.size}"`);
    await page.setContent(
      `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:${v.transparent ? "transparent" : "#1D4ED8"};}svg{display:block}</style></head><body>${svg}</body></html>`
    );
    await page.screenshot({
      path: path.join(v.out ?? OUT, v.file),
      omitBackground: v.transparent,
      clip: { x: 0, y: 0, width: v.size, height: v.size },
    });
    await page.close();
    console.log(`rendered ${v.file} (${v.size}x${v.size}${v.transparent ? ", transparent" : ""})`);
  }
  const feature = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  await feature.setContent(featureGraphicHtml());
  await feature.screenshot({ path: path.join(STORE_OUT, "feature-graphic-1024x500.png"), clip: { x: 0, y: 0, width: 1024, height: 500 } });
  await feature.close();
  console.log("rendered release/store/feature-graphic-1024x500.png and play-icon-512.png");
} finally {
  await browser.close();
}
