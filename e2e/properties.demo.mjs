// A framework sets a PROPERTY, not an attribute, on a custom element that has one of the name (React 19, Vue 3 and Svelte
// 5 do: `<jarajara-tile flip>` is `tile.flip = true`). Every attribute that is also a method or a read-only property must
// then reach the attribute, and the method must go on working.
import { expect, test } from "@playwright/test";

import { bare, tap } from "./demo.mjs";

test("assigning an attribute's name sets the attribute, for the ones that are methods too", async ({ page }) => {
  const errors = await bare(page, '<jarajara-tile id="t" code="east"></jarajara-tile><jarajara-rack id="r" tiles="123m"></jarajara-rack><jarajara-layout id="g" size="4" level="easy" seed="7"></jarajara-layout>');
  await page.evaluate(() => {
    const [tile, rack, layout] = ["t", "r", "g"].map((id) => document.getElementById(id));
    tile.flip = true;
    rack.tiles = "456p789s";
    rack.group = "kind";
    rack.mark = "SITE";
    rack.lifted = [0, 2];
    layout.seed = 9;
    layout.undo = "off";
    layout.mirror = "both";
  });
  await expect(page.locator("#t")).toHaveAttribute("flip", "");
  await expect(page.locator("#r")).toHaveAttribute("tiles", "456p789s");
  await expect(page.locator("#r")).toHaveAttribute("group", "kind");
  await expect(page.locator("#r")).toHaveAttribute("mark", "SITE");
  await expect(page.locator("#r")).toHaveAttribute("lifted", "0 2");
  await expect(page.locator("#g")).toHaveAttribute("seed", "9");
  await expect(page.locator("#g")).toHaveAttribute("undo", "off");
  await expect(page.locator("#g")).toHaveAttribute("mirror", "both");
  expect(await page.locator("#g").evaluate((layout) => [layout.seed, layout.mirror])).toEqual([9, "both"]);
  expect(await page.locator("#r").evaluate((rack) => rack.tiles)).toEqual(["m", "n", "o", "y", "z", "A"]);
  // A tile set flippable that way turns over when tapped.
  await tap(page, "#t");
  await expect(page.locator("#t")).toHaveAttribute("aria-label", "tile, face down");
  // And false takes the attribute away again.
  await page.evaluate(() => {
    document.getElementById("t").flip = false;
    document.getElementById("g").undo = null;
  });
  await expect(page.locator("#t")).not.toHaveAttribute("flip", /.*/);
  await expect(page.locator("#g")).not.toHaveAttribute("undo", /.*/);
  expect(errors).toEqual([]);
});

test("the methods those names also are still work", async ({ page }) => {
  const errors = await bare(page, '<jarajara-tile id="t" code="east"></jarajara-tile><jarajara-rack id="r" tiles="123m" capacity="3"></jarajara-rack><jarajara-layout id="g" size="4" level="easy" seed="7"></jarajara-layout>');
  const kinds = await page.evaluate(() => ["t", "r", "g"].map((id) => document.getElementById(id)).flatMap((el) => ["flip", "group", "mark", "undo"].filter((name) => name in el).map((name) => `${el.localName}.${name}:${typeof el[name]}`)));
  expect(kinds).toEqual(["jarajara-tile.flip:function", "jarajara-rack.group:function", "jarajara-rack.mark:function", "jarajara-layout.undo:function"]);
  await page.evaluate(() => document.getElementById("t").flip());
  await expect(page.locator("#t")).toHaveAttribute("aria-label", "tile, face down");
  await page.evaluate(() => document.getElementById("r").group("kind"));
  await page.evaluate(() => document.getElementById("r").mark(0));
  const [hint, undone] = await page.evaluate(() => {
    const layout = document.getElementById("g");
    const pair = layout.hint();
    layout.take(pair[0], pair[1]);
    return [pair.length, layout.undo()];
  });
  expect([hint, undone]).toEqual([2, true]);
  expect(await page.locator("#g").evaluate((layout) => layout.tilesLeft)).toBe(8);
  expect(errors).toEqual([]);
});
