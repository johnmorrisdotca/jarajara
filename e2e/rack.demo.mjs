// <jarajara-rack>: tiles lined up, turned, sorted, grouped, mixed, taken out, put in, marked, picked up and spun.
import { expect, test } from "@playwright/test";

import { at, bare, box, open, sideways, tap } from "./demo.mjs";

const HAND = "FbaBjIcBaGdH";
const SET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP";
const rack = '<jarajara-rack id="r" tiles="' + HAND + '" capacity="14" pick></jarajara-rack>';

/** The rack's tiles left to right as the page draws them: [{ code, down }]. */
const lying = (page, selector = "#r") =>
  page.locator(selector).evaluate((el) => {
    const slots = [...el.shadowRoot.querySelectorAll(".slot")].sort((a, b) => Number(a.style.getPropertyValue("--x")) - Number(b.style.getPropertyValue("--x")));
    return slots.map((slot) => ({ index: Number(slot.dataset.index), down: slot.dataset.down === "true", lifted: slot.dataset.lifted === "true", face: slot.querySelector(".face svg")?.getAttribute("data-face") ?? null }));
  });
const order = async (page, selector) => (await lying(page, selector)).map((one) => HAND[one.index]).join("");

test("lines the tiles up as they were written, in codes, names or notation", async ({ page }) => {
  const errors = await bare(page, `${rack}<jarajara-rack id="n" tiles="east red-dragon 3p"></jarajara-rack><jarajara-rack id="h" tiles="123m11z"></jarajara-rack>`);
  expect(await order(page)).toBe(HAND);
  await expect(page.locator("#r")).toHaveAttribute("aria-label", /^12 tiles: red dragon, 2 of characters/);
  expect((await lying(page, "#n")).map((one) => one.face)).toEqual(["B", "F", "l"]);
  expect((await lying(page, "#h")).map((one) => one.face)).toEqual(["a", "b", "c", "B", "B"]);
  expect(await page.locator("#r").evaluate((el) => el.tiles.join(""))).toBe(HAND);
  expect(errors).toEqual([]);
});

test("turns every tile over, one by one, or only the ones named, and a tile face down has no face in the page", async ({ page }) => {
  const errors = await bare(page, rack);
  const events = [];
  await page.exposeFunction("told", (detail) => events.push(detail));
  await page.evaluate(() => document.addEventListener("jarajara-rack", (event) => window.told(event.detail)));
  await page.locator("#r").evaluate((el) => el.hide({ oneByOne: true, gap: 20 }));
  await expect(page.locator("#r")).toHaveAttribute("aria-label", "12 tiles, face down");
  let slots = await lying(page);
  expect(slots.every((one) => one.down && one.face === null)).toBe(true);
  await page.locator("#r").evaluate((el) => el.show());
  slots = await lying(page);
  expect(slots.every((one) => !one.down && one.face !== null)).toBe(true);
  // Only some: tiles by their places, and every tile of a face by its letter.
  await page.locator("#r").evaluate((el) => el.toggle([0, 3]));
  slots = await lying(page);
  expect(slots.filter((one) => one.down).map((one) => one.index)).toEqual([0, 3]);
  await page.locator("#r").evaluate((el) => el.toggle("B"));
  expect((await lying(page)).filter((one) => one.down).map((one) => HAND[one.index]).sort().join("")).toBe("BF");
  // Turning them all turns the whole rack the other way about.
  await page.locator("#r").evaluate((el) => el.toggle());
  expect((await lying(page)).filter((one) => one.down).length).toBe(10);
  expect(events.length).toBeGreaterThan(2);
  expect(events.at(-1)).toMatchObject({ tiles: HAND.split("") });
  expect(errors).toEqual([]);
});

test("sorts, groups by suit or kind, closes the groups and unsorts, never changing the rack's box", async ({ page }) => {
  const errors = await bare(page, rack);
  const was = await box(page, "#r");
  await page.locator("#r").evaluate((el) => el.sort());
  expect(await order(page)).toBe(HAND.split("").sort((x, y) => SET.indexOf(x) - SET.indexOf(y)).join(""));
  expect(await box(page, "#r")).toEqual(was);
  const gaps = () => page.locator("#r").evaluate((el) => {
    const xs = [...el.shadowRoot.querySelectorAll(".slot")].map((s) => Number(s.style.getPropertyValue("--x"))).sort((a, b) => a - b);
    return xs.slice(1).map((x, i) => Math.round((x - xs[i]) * 100) / 100).filter((d) => d > 1.1).length;
  });
  expect(await gaps()).toBe(0);
  await page.locator("#r").evaluate((el) => el.group("suit"));
  // Characters, circles, winds, dragons, flowers: a gap before each group after the first.
  expect(await gaps()).toBe(4);
  expect(await box(page, "#r")).toEqual(was);
  await page.locator("#r").evaluate((el) => el.group("kind"));
  expect(await gaps()).toBe(2);
  await page.locator("#r").evaluate((el) => el.ungroup());
  expect(await gaps()).toBe(0);
  // Closing the groups leaves the tiles sorted; as dealt puts them back.
  expect(await order(page)).not.toBe(HAND);
  await page.locator("#r").evaluate((el) => el.unsort());
  expect(await order(page)).toBe(HAND);
  expect(await box(page, "#r")).toEqual(was);
  expect(errors).toEqual([]);
});

test("mixes up into another order with the same tiles, the same for the same seed", async ({ page }) => {
  const errors = await bare(page, rack);
  await page.locator("#r").evaluate((el) => el.mixUp(5));
  const first = await page.locator("#r").evaluate((el) => el.tiles.join(""));
  expect(first).not.toBe(HAND);
  expect(first.split("").sort().join("")).toBe(HAND.split("").sort().join(""));
  expect(await order(page)).not.toBe("");
  const shown = (await lying(page)).map((one) => one.face);
  expect(shown.join("")).toBe(first);
  await page.locator("#r").evaluate((el) => (el.tiles = "FbaBjIcBaGdH".split("")));
  await page.locator("#r").evaluate((el) => el.mixUp(5));
  expect(await page.locator("#r").evaluate((el) => el.tiles.join(""))).toBe(first);
  expect(errors).toEqual([]);
});

test("takes a tile out and puts one in, and a rack with a capacity keeps its size", async ({ page }) => {
  const errors = await bare(page, rack);
  const was = await box(page, "#r");
  const taken = await page.locator("#r").evaluate(async (el) => {
    const told = [];
    el.addEventListener("jarajara-take", (event) => told.push(event.detail));
    const code = await el.take("B");
    return { code, told, tiles: el.tiles.join("") };
  });
  expect(taken).toEqual({ code: "B", told: [{ code: "B", index: 3 }], tiles: "FbajIcBaGdH" });
  expect(await box(page, "#r")).toEqual(was);
  expect(await page.locator("#r").evaluate((el) => el.take("nothing"))).toBeNull();
  await page.locator("#r").evaluate((el) => el.add("east", "front"));
  expect(await page.locator("#r").evaluate((el) => el.tiles.join(""))).toBe("BFbajIcBaGdH");
  await page.locator("#r").evaluate((el) => el.add("H"));
  expect(await page.locator("#r").evaluate((el) => el.tiles.length)).toBe(13);
  expect(await box(page, "#r")).toEqual(was);
  await page.locator("#r").evaluate((el) => el.replace(0, "a"));
  expect(await page.locator("#r").evaluate((el) => el.tiles.join(""))).toMatch(/a$/);
  expect(errors).toEqual([]);
});

test("a tap raises a tile and a second puts it down; marks follow a tile through a sort and a turn", async ({ page }) => {
  const errors = await bare(page, rack);
  const picks = [];
  await page.exposeFunction("picked", (detail) => picks.push(detail));
  await page.evaluate(() => document.addEventListener("jarajara-pick", (event) => window.picked(event.detail)));
  const slot = (index) => page.locator("#r").locator(`.slot[data-index="${index}"]`);
  await tap(page, slot(2));
  expect(picks).toEqual([{ index: 2, code: "a", lifted: true }]);
  await expect(page.locator("#r")).toHaveAttribute("lifted", "2");
  const top = (index) => page.locator("#r").evaluate((el, i) => el.shadowRoot.querySelector(`.slot[data-index="${i}"]`).getBoundingClientRect().top, index);
  expect(await top(2)).toBeLessThan(await top(1));
  await tap(page, slot(2));
  await expect(page.locator("#r")).not.toHaveAttribute("lifted", /./);
  // The rack's own keys: Enter on a focused tile picks it.
  await slot(5).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#r")).toHaveAttribute("lifted", "5");
  await page.locator("#r").evaluate((el) => el.lower());
  // A mark rides on its tile, not its place.
  await page.locator("#r").evaluate((el) => el.mark(4));
  await page.locator("#r").evaluate((el) => el.sort());
  await page.locator("#r").evaluate((el) => el.hide());
  const marked = await page.locator("#r").evaluate((el) => [...el.shadowRoot.querySelectorAll(".slot")].filter((s) => s.querySelector(".marker")).map((s) => Number(s.dataset.index)));
  expect(marked).toEqual([4]);
  await page.locator("#r").evaluate((el) => el.unmark());
  expect(await page.locator("#r").evaluate((el) => el.shadowRoot.querySelectorAll(".marker").length)).toBe(0);
  expect(errors).toEqual([]);
});

test("a tile taken out is not the tile that was marked: the marks and turns shift with the places", async ({ page }) => {
  await bare(page, rack);
  await page.locator("#r").evaluate(async (el) => {
    el.mark(5);
    el.toggle(6);
    await el.take(0);
  });
  expect(await page.locator("#r").evaluate((el) => [el.getAttribute("marked"), el.getAttribute("turned")])).toEqual(["4", "5"]);
});

test("spins its tiles where they lie and settles, and says nothing of a tile it does not hold", async ({ page }) => {
  await bare(page, rack);
  const done = await page.locator("#r").evaluate(async (el) => {
    await el.spin([1, 2], { turns: 1, ms: 50 });
    await el.spin("nothing");
    return true;
  });
  expect(done).toBe(true);
});

test("fits a phone: a long rack is drawn smaller, never wider than its room", async ({ page }) => {
  await bare(page, '<jarajara-rack id="w" tiles="' + HAND + HAND + '" size="large" group="suit" order="suit"></jarajara-rack>');
  const wide = await page.locator("#w").boundingBox();
  const room = await page.evaluate(() => document.documentElement.clientWidth);
  expect(wide.width).toBeLessThanOrEqual(room);
  expect(await sideways(page)).toBe(false);
});

test("the demo's rack panel works its buttons", async ({ page }) => {
  const errors = await open(page);
  await tap(page, at("rack-hide"));
  await expect(page.locator(at("rack"))).toHaveAttribute("aria-label", /face down/);
  await tap(page, at("rack-show"));
  await tap(page, at("rack-toggle"));
  await expect(page.locator(at("rack-note"))).toHaveText("Nothing is raised: tap a tile first.");
  await tap(page, page.locator(at("rack")).locator(".slot").nth(0));
  await tap(page, at("rack-take"));
  await expect.poll(() => page.locator(at("rack")).evaluate((el) => el.tiles.length)).toBe(13);
  await tap(page, at("rack-add"));
  await expect.poll(() => page.locator(at("rack")).evaluate((el) => el.tiles.length)).toBe(14);
  await tap(page, at("rack-group-suit"));
  await expect(page.locator(at("rack"))).toHaveAttribute("group", "suit");
  await tap(page, at("rack-new"));
  await expect(page.locator(at("rack"))).not.toHaveAttribute("group", /./);
  await expect(page.locator(at("rack-code"))).toContainText("<jarajara-rack");
  expect(errors).toEqual([]);
});
