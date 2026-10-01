// The viewers: a tile looked up by what it is called, a group of the set, the whole set as an inventory, and the backs.
import { expect, test } from "@playwright/test";

import { at, bare, open, tap } from "./demo.mjs";

const shadow = (page, selector, inner) => page.locator(selector).evaluate((el, sel) => el.shadowRoot.querySelector(sel)?.textContent ?? null, inner);

test("the viewer finds a tile by its name, code, kanji or notation, and says what it is", async ({ page }) => {
  const errors = await bare(page, '<jarajara-viewer id="v" query="east" editable></jarajara-viewer>');
  const text = () => page.locator("#v").evaluate((el) => el.shadowRoot.querySelector(".card")?.textContent ?? el.shadowRoot.querySelector(".empty").textContent);
  expect(await text()).toContain("east wind");
  expect(await text()).toContain("1z");
  const input = page.locator("#v input");
  for (const [typed, expected] of [["3 of circles", "3 of circles"], ["red dragon", "red dragon"], ["五萬", "5 of characters"], ["7z", "red dragon"], ["plum", "plum (flower)"]]) {
    await input.fill(typed);
    await input.press("Enter");
    expect(await text(), typed).toContain(expected);
  }
  await input.fill("nonsense");
  await input.press("Enter");
  expect(await text()).toBe("No tile is called that.");
  // A hand is a row to choose from: choosing one shows it.
  await input.fill("123m");
  await tap(page, "#v button[data-action='look']");
  await page.locator("#v").evaluate((el) => el.shadowRoot.querySelectorAll("[data-pick]")[2].click());
  expect(await text()).toContain("3 of characters");
  expect(errors).toEqual([]);
});

test("a group shows its tiles with names and counts, and face down it is turned over by a tap", async ({ page }) => {
  const errors = await bare(page, '<jarajara-group id="g" group="dragons"></jarajara-group><jarajara-group id="h" group="seasons" face-down flip></jarajara-group><jarajara-group id="o" tiles="abc" copies="off" captions="off" heading="off"></jarajara-group>');
  const figures = (id) => page.locator(id).evaluate((el) => [...el.shadowRoot.querySelectorAll(".figure")].map((f) => f.textContent.trim()));
  expect(await figures("#g")).toEqual(["red dragon×4", "green dragon×4", "white dragon×4"]);
  expect(await shadow(page, "#g", "h3")).toBe("Dragons");
  expect(await figures("#h")).toEqual(["spring (season)×1", "summer (season)×1", "autumn (season)×1", "winter (season)×1"]);
  expect(await figures("#o")).toEqual(["", "", ""]);
  expect(await shadow(page, "#o", "h3")).toBeNull();
  const tile = page.locator("#h jarajara-tile").first();
  await expect(tile).toHaveAttribute("face-down", "");
  await tap(page, tile);
  await expect(tile).not.toHaveAttribute("face-down", "");
  expect(errors).toEqual([]);
});

test("the set shows 42 faces with how many each, or all 144 tiles, and counts what a hand holds", async ({ page }) => {
  const errors = await bare(page, '<jarajara-set id="s"></jarajara-set><jarajara-set id="t" mode="tiles" tiles="123m11z"></jarajara-set>');
  expect(await page.locator("#s").evaluate((el) => el.shadowRoot.querySelectorAll(".figure").length)).toBe(42);
  expect(await page.locator("#s").evaluate((el) => el.getAttribute("aria-label"))).toBe("The set: 144 tiles in 42 faces");
  expect(await page.locator("#t").evaluate((el) => el.shadowRoot.querySelectorAll(".figure").length)).toBe(144);
  // Five tiles are held: the others are dimmed.
  expect(await page.locator("#t").evaluate((el) => el.shadowRoot.querySelectorAll('.figure:not([data-dim="true"])').length)).toBe(5);
  expect(await page.locator("#t").evaluate((el) => el.getAttribute("aria-label"))).toBe("5 of 144 tiles");
  expect(errors).toEqual([]);
});

test("the demo's viewers answer the quick lookups and the hand's count", async ({ page }) => {
  const errors = await open(page);
  await tap(page, '[data-testid="viewer-chips"] button:has-text("haku")');
  expect(await page.locator('[data-testid="viewer"]').evaluate((el) => el.shadowRoot.querySelector(".card").textContent)).toContain("white dragon");
  await page.selectOption('[data-testid="group-pick"]', "terminals");
  expect(await page.locator('[data-testid="group"]').evaluate((el) => el.shadowRoot.querySelectorAll(".figure").length)).toBe(6);
  await page.fill(at("set-hand"), "123m456p789s11z");
  await expect(page.locator(at("set-count"))).toHaveText("11 of 144 tiles");
  await tap(page, at("set-tiles"));
  expect(await page.locator(at("set")).evaluate((el) => el.shadowRoot.querySelectorAll(".figure").length)).toBe(144);
  expect(errors).toEqual([]);
});

test("the backs panel draws every back, and a colour and a mark change it", async ({ page }) => {
  const errors = await open(page);
  for (const name of ["jade", "bamboo", "blue", "red", "ink"]) await expect(page.locator(at(`back-${name}`))).toBeVisible();
  await tap(page, at("back-bamboo"));
  await expect(page.locator(at("back-show") + " svg")).toHaveAttribute("data-back", "bamboo");
  await page.fill(at("back-mark"), "SITE");
  await expect(page.locator(at("back-show"))).toContainText("SITE");
  await expect(page.locator(at("back-code"))).toContainText('mark="SITE"');
  await page.locator(at("back-colour")).evaluate((el) => {
    el.value = "#aa3355";
    el.dispatchEvent(new Event("input"));
  });
  await expect(page.locator(at("back-show") + " svg")).toContainText("SITE");
  expect(await page.locator(at("back-show")).innerHTML()).toContain("#aa3355");
  expect(errors).toEqual([]);
});
