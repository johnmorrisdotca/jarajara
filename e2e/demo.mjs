// What every demo test starts from: the built demo in `site/`, served to the page without a port, a bare page holding only
// the elements, and the helpers a test taps with.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const site = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".m4a": "audio/mp4" };

/** Serve `site/` to a page at http://jarajara.test/. */
export async function serve(page) {
  if (!existsSync(join(site, "index.html"))) throw new Error("site/ is not built: run `pnpm site` first (`pnpm test:demo` does)");
  await page.route("http://jarajara.test/**", (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(site, pathname.endsWith("/") ? `${pathname}index.html` : pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ body: readFileSync(file), contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream" });
  });
}

/** Open the demo with a query, and collect anything the page complains of. */
export async function open(page, query = "") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  // Every panel laid out (`?tabs=all`) unless the test is about the tabs, so a test can reach any control.
  await page.goto(`http://jarajara.test/${query === "" ? "?tabs=all" : query.includes("tabs=") ? query : `${query}&tabs=all`}`);
  await page.waitForFunction(() => customElements.get("jarajara-layout") !== undefined && document.querySelector('[data-testid="game"] ') !== null);
  await expect(page.locator("#game .board svg").first()).toBeVisible();
  return errors;
}

/** A page holding only what is given, with the elements registered from the built package. */
export async function bare(page, html, { lang = "en" } = {}) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.route("http://jarajara.test/bare.html", (route) =>
    route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:12px;background:#2f5d4a;color:#fff;font-family:system-ui}</style></head><body>${html}<script type="module">import "./dist/element-define.js";</script></body></html>` }),
  );
  await page.goto("http://jarajara.test/bare.html");
  await page.waitForFunction(() => customElements.get("jarajara-tile") !== undefined && customElements.get("jarajara-layout") !== undefined);
  return errors;
}

export const at = (id) => `[data-testid="${id}"]`;

/** Tap, as a finger would where the page is touched and as a mouse where it is not. */
export async function tap(page, selector) {
  const target = typeof selector === "string" ? page.locator(selector).first() : selector;
  await target.scrollIntoViewIfNeeded();
  if (test.info().project.use.hasTouch === true) await target.tap();
  else await target.click();
}

/** A box's size, to hold it to: the rounded width and height of the element. */
export async function box(page, selector) {
  const found = await page.locator(selector).first().boundingBox();
  return { width: Math.round(found.width), height: Math.round(found.height) };
}

/** Whether the page scrolls sideways. */
export function sideways(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
}

/** What a page owes a phone: no sideways scroll, nothing poking out, every target a fingertip wide, and no complaint from the console. */
export async function fits(page, errors) {
  const found = await page.evaluate(() => {
    const all = (s) => [...document.querySelectorAll(s)];
    const box = (e) => e.getBoundingClientRect();
    return {
      pageWidth: document.documentElement.scrollWidth,
      windowWidth: window.innerWidth,
      small: all("main button, main input, main select, nav a, footer .family a")
        .filter((e) => box(e).width > 0 && !e.hidden && (box(e).height < 43.5 || box(e).width < 43.5))
        .map((e) => `${e.dataset.testid ?? e.textContent}: ${Math.round(box(e).width)}x${Math.round(box(e).height)}`),
      wide: all("main *")
        .filter((e) => box(e).width > 0 && box(e).right > window.innerWidth + 0.5 && !e.closest("pre") && !e.ownerSVGElement)
        .map((e) => `${e.tagName} ${e.className}`),
    };
  });
  expect(found.pageWidth, "the page is no wider than the window").toBe(found.windowWidth);
  expect(found.wide, "nothing pokes out sideways").toEqual([]);
  expect(found.small, "every target is at least 44px").toEqual([]);
  expect(errors, "the page complained of nothing").toEqual([]);
}
