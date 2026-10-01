// The demo page as a whole: no sideways scroll at a phone's width or a desk's, every panel there, the language and the cloth.
import { expect, test } from "@playwright/test";

import { at, open, sideways, tap } from "./demo.mjs";

test("every panel is on the page and nothing scrolls sideways", async ({ page }) => {
  const errors = await open(page);
  for (const id of ["play", "tile-panel", "rack-panel", "viewer-panel", "set-panel", "backs", "layouts-panel", "gallery-panel", "table-panel"]) await expect(page.locator(`#${id}`)).toBeVisible();
  expect(await sideways(page)).toBe(false);
  // Nothing of the page is wider than the window it is in.
  const widest = await page.evaluate(() => Math.max(...[...document.querySelectorAll("main *")].map((el) => el.getBoundingClientRect().right)));
  expect(widest).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth) + 1);
  expect(errors).toEqual([]);
});

test("switching to Japanese changes the page's words and the elements' own", async ({ page }) => {
  const errors = await open(page);
  await tap(page, "button[data-lang='ja']");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("#play-title")).toHaveText("合わせ（一人遊び）");
  await expect(page.locator(at("one-tile"))).toHaveAttribute("aria-label", "東");
  await expect(page.locator(at("rack"))).toHaveAttribute("aria-label", /^14枚の牌：/);
  expect(await page.locator(at("game")).evaluate((el) => el.shadowRoot.querySelector(".line").textContent)).toMatch(/^残り\d+枚/);
  await tap(page, "button[data-lang='en']");
  await expect(page.locator(at("one-tile"))).toHaveAttribute("aria-label", "east wind");
  expect(errors).toEqual([]);
});

test("the header's cloth patches lay every table on the cloth chosen", async ({ page }) => {
  const errors = await open(page);
  for (const name of ["red", "black", "wood", "green"]) {
    await tap(page, `button[data-cloth="${name}"]`);
    for (const id of ["game", "set", "inspect", "table-demo"]) await expect(page.locator(at(id))).toHaveAttribute("cloth", name);
  }
  const felt = await page.locator(at("game")).evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(felt).toContain("#2f5d4a".replace("#2f5d4a", "rgb(47, 93, 74)"));
  expect(errors).toEqual([]);
});
