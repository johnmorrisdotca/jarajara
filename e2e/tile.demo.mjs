// <jarajara-tile>, by real taps: on a page of its own with nothing but the element, and in the demo's panel.
import { expect, test } from "@playwright/test";

import { bare, open, tap } from "./demo.mjs";

const inside = (page, selector) => page.locator(selector).evaluate((tile) => ({ label: tile.getAttribute("aria-label"), role: tile.getAttribute("role"), down: tile.hasAttribute("face-down"), face: tile.shadowRoot.querySelector(".face").innerHTML, back: tile.shadowRoot.querySelector(".back").innerHTML }));

test("a tap turns the tile over and back; while it is down its face is not in the page", async ({ page }) => {
  const errors = await bare(page, '<jarajara-tile id="t" code="F" flip></jarajara-tile>');
  const turns = [];
  await page.exposeFunction("turned", (detail) => turns.push(detail));
  await page.evaluate(() => document.addEventListener("jarajara-flip", (event) => window.turned(event.detail)));
  let s = await inside(page, "#t");
  expect(s).toMatchObject({ label: "red dragon", role: "button", down: false, back: "" });
  expect(s.face).toContain("<svg");
  await tap(page, "#t");
  await expect(page.locator("#t")).toHaveAttribute("aria-label", "tile, face down");
  s = await inside(page, "#t");
  expect(s.down).toBe(true);
  expect(s.face, "the face is gone once the tile lies face down").toBe("");
  expect(s.back).toContain('data-back="jade"');
  await page.locator("#t").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#t")).toHaveAttribute("aria-label", "red dragon");
  expect(turns).toEqual([{ code: "F", faceDown: true }, { code: "F", faceDown: false }]);
  expect(errors).toEqual([]);
});

test("a tile is named by its letter or any name it goes by, and in Japanese on a Japanese page", async ({ page }) => {
  const errors = await bare(page, '<jarajara-tile id="a" code="east"></jarajara-tile><jarajara-tile id="b" code="3p"></jarajara-tile><jarajara-tile id="c" code="nothing"></jarajara-tile><jarajara-tile id="d" code="五萬" lang="ja" face-down></jarajara-tile>');
  await expect(page.locator("#a")).toHaveAttribute("aria-label", "east wind");
  await expect(page.locator("#b")).toHaveAttribute("aria-label", "3 of circles");
  await expect(page.locator("#c")).toHaveAttribute("aria-label", "");
  await expect(page.locator("#d")).toHaveAttribute("aria-label", "伏せた牌");
  // A tile that is not flippable is a picture, not a control.
  await expect(page.locator("#a")).toHaveAttribute("role", "img");
  expect(await page.locator("#a").getAttribute("tabindex")).toBeNull();
  expect(errors).toEqual([]);
});

test("every size and width, and a back of its own, in a steady box", async ({ page }) => {
  await bare(page, '<jarajara-tile id="s" code="a" size="small"></jarajara-tile><jarajara-tile id="m" code="a"></jarajara-tile><jarajara-tile id="l" code="a" size="large" face-down back="bamboo" mark="HI" back-colour="#336699" flip></jarajara-tile><jarajara-tile id="w" code="a" width="100"></jarajara-tile>');
  const width = (id) => page.locator(id).evaluate((el) => Math.round(el.getBoundingClientRect().width));
  expect([await width("#s"), await width("#m"), await width("#l"), await width("#w")]).toEqual([32, 48, 72, 100]);
  const before = await page.locator("#l").boundingBox();
  await tap(page, "#l");
  await expect(page.locator("#l")).toHaveAttribute("aria-label", "1 of characters");
  await page.waitForTimeout(100);
  const after = await page.locator("#l").boundingBox();
  expect({ w: after.width, h: after.height }).toEqual({ w: before.width, h: before.height });
  const back = await page.locator("#l").evaluate((el) => (el.toggleAttribute("face-down", true), el.shadowRoot.querySelector(".back").innerHTML));
  expect(back).toContain("#336699");
  expect(back).toContain(">HI</text>");
});

test("the text on a tile cannot be selected, and a mark rides on it face up and face down", async ({ page }) => {
  await bare(page, '<jarajara-tile id="t" code="B" size="large" marked></jarajara-tile>');
  expect(await page.locator("#t").evaluate((el) => getComputedStyle(el).userSelect)).toBe("none");
  await expect(page.locator("#t")).toHaveAttribute("aria-label", "east wind, marked");
  expect(await page.locator("#t").evaluate((el) => el.shadowRoot.querySelectorAll(".marker").length)).toBe(1);
  await page.locator("#t").evaluate((el) => (el.faceDown = true));
  expect(await page.locator("#t").evaluate((el) => el.shadowRoot.querySelectorAll(".marker").length)).toBe(1);
});

test("the demo's tile panel changes the tile, and the code under it", async ({ page }) => {
  const errors = await open(page);
  await page.selectOption('[data-testid="tile-pick"]', "I");
  await expect(page.locator('[data-testid="one-tile"]')).toHaveAttribute("aria-label", "plum (flower)");
  await tap(page, '[data-testid="tile-small"]');
  await expect(page.locator('[data-testid="one-tile"]')).toHaveAttribute("size", "small");
  await page.selectOption('[data-testid="tile-back"]', "ink");
  await expect(page.locator('[data-testid="tile-code"]')).toContainText('code="I" back="ink" size="small" flip');
  await tap(page, '[data-testid="one-tile"]');
  await expect(page.locator('[data-testid="one-tile"]')).toHaveAttribute("aria-label", "tile, face down");
  expect(errors).toEqual([]);
});
