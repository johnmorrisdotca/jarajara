// Takes the pictures the README shows, from the built demo in `site/`: `pnpm pictures` (builds the demo, then runs this).
// The page is served to a browser without a port, never fetched from the live site, and the same each run:
// the deal is a kept seed, the pairs are taken by the game's own hint, and motion is reduced.
// Output: docs/desktop.jpg (1280 wide, light, English) and docs/phone.jpg (390 by 844, dark, Japanese).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const docs = join(root, "docs");
const host = "http://jarajara.test";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".m4a": "audio/mp4" };
const QUALITY = 72;

if (!existsSync(join(site, "index.html"))) throw new Error("site/ is not built: run `pnpm pictures` (it builds the demo first)");
const browser = await chromium.launch();

/** A game of Awase on a layout (by its size number), dealt from seed 2026, with `pairs` pairs already taken. */
async function shot({ width, height, colorScheme, lang, size, pairs, showFree = false, path, scrollTo, seeEnd = false }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme, reducedMotion: "reduce", locale: "en-US", deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.route(`${host}/**`, (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(site, pathname === "/" ? "index.html" : pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ body: readFileSync(file), contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream" });
  });
  // The demo keeps its game on the device: this is the game it is opened on.
  await page.addInitScript((kept) => localStorage.setItem("jarajara.page", JSON.stringify(kept)), { size, level: "easy", seed: 2026, moves: "", showFree });
  await page.goto(`${host}/?lang=${lang}`);
  await page.waitForFunction(() => customElements.get("jarajara-layout") !== undefined);
  await page.locator("#game .board svg").first().waitFor();
  await page.locator("#game").evaluate((game, pairs) => {
    for (let taken = 0; taken < pairs; taken += 1) {
      const pair = game.hint();
      if (pair === null) break;
      game.take(pair[0], pair[1]);
    }
  }, pairs);
  await page.waitForTimeout(300);
  // Scrolled to the table: its top at the top of the window, or (on a desk) its foot at the foot, so the layout chooser stays above it.
  if (scrollTo) await page.locator(scrollTo).evaluate((element, seeEnd) => window.scrollTo(0, seeEnd ? element.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 16 : element.getBoundingClientRect().top + window.scrollY - 16), seeEnd);
  await page.mouse.move(0, 0);
  await page.screenshot({ path, type: "jpeg", quality: QUALITY });
  await context.close();
}

// The Turtle (144 tiles), a few pairs taken, with the layout chooser above the whole table.
await shot({ width: 1280, height: 1000, colorScheme: "light", lang: "en", size: 15, pairs: 6, path: join(docs, "desktop.jpg"), scrollTo: ".table-stage", seeEnd: true });
// Fuji on a phone, with the free tiles lit.
await shot({ width: 390, height: 844, colorScheme: "dark", lang: "ja", size: 9, pairs: 8, showFree: true, path: join(docs, "phone.jpg"), scrollTo: ".table-stage" });
await browser.close();
