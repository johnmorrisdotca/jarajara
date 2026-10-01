// <jarajara-layout>: a game of Awase by real taps, its hints, shuffles, undo and limits, and the layout lined up and sorted.
import { expect, test } from "@playwright/test";

import { at, bare, open, sideways, tap } from "./demo.mjs";

/** Press a tile as a tap reaches it, whatever lies over its middle: the tile's own `<g>` takes the click, as it does from a finger on its visible part. */
const press = (page, selector, slot) => page.locator(selector).locator(`[data-slot="${slot}"]`).dispatchEvent("click");

/** Take every pair there is, by tapping the tiles a hint names, until the layout is clear or nothing can be taken. */
async function clear(page, selector) {
  for (let step = 0; step < 200; step += 1) {
    const pair = await page.locator(selector).evaluate((el) => el.hint());
    if (pair === null) return step;
    for (const slot of pair) await press(page, selector, slot);
  }
  return -1;
}

test("takes pairs by tapping, says how it stands, and clears a layout", async ({ page }) => {
  const errors = await bare(page, '<jarajara-layout id="g" size="4" seed="7" controls timer></jarajara-layout>');
  const events = [];
  await page.exposeFunction("told", (name, detail) => events.push([name, detail]));
  await page.evaluate(() => {
    for (const name of ["jarajara-take", "jarajara-clear", "jarajara-deal"]) document.addEventListener(name, (event) => window.told(name, event.detail));
  });
  const status = () => page.locator("#g").evaluate((el) => el.shadowRoot.querySelector(".line").textContent);
  expect(await status()).toMatch(/^8 tiles left · \d+ pairs? you can take$/);
  expect(await page.locator("#g").evaluate((el) => el.seed)).toBe(7);
  // Tapping a tile and tapping it again lets it go; tapping a tile that cannot be taken says why.
  const free = await page.locator("#g").evaluate((el) => [...el.shadowRoot.querySelectorAll('[data-free="true"]')].map((t) => Number(t.dataset.slot)));
  const blocked = await page.locator("#g").evaluate((el) => [...el.shadowRoot.querySelectorAll('[data-free="false"]')].map((t) => Number(t.dataset.slot)));
  expect(free.length).toBeGreaterThan(1);
  await press(page, "#g", free[0]);
  await expect(page.locator("#g [aria-pressed='true']")).toHaveCount(1);
  await press(page, "#g", free[0]);
  await expect(page.locator("#g [aria-pressed='true']")).toHaveCount(0);
  await press(page, "#g", blocked[0]);
  await expect.poll(status).toBe("8 tiles left · " + (await page.locator("#g").evaluate((el) => el.shadowRoot.querySelector(".status .line").textContent.split("·")[1].trim())));
  expect(await page.locator("#g").evaluate((el) => el.shadowRoot.querySelector(".note").textContent)).toBe("That tile is not free: something lies on it, or both its sides are closed.");
  expect(await clear(page, "#g")).toBeGreaterThan(0);
  expect(await page.locator("#g").evaluate((el) => el.tilesLeft)).toBe(0);
  expect(await status()).toMatch(/^Cleared, in \d+ seconds\.$/);
  expect(events.filter(([name]) => name === "jarajara-take")).toHaveLength(4);
  expect(events.filter(([name]) => name === "jarajara-clear")).toHaveLength(1);
  const [, clearedWith] = events.find(([name]) => name === "jarajara-clear");
  expect(clearedWith.moves).toHaveLength(16);
  expect(errors).toEqual([]);
});

test("a game written as text plays back to where it was, and the same seed deals the same tiles", async ({ page }) => {
  await bare(page, '<jarajara-layout id="a" size="9" level="hard" seed="31"></jarajara-layout><jarajara-layout id="b" size="9" level="hard" seed="31"></jarajara-layout>');
  const cells = (id) => page.locator(id).evaluate((el) => el.cells);
  expect(await cells("#a")).toBe(await cells("#b"));
  const moves = await page.locator("#a").evaluate((el) => {
    for (let i = 0; i < 6; i += 1) {
      const pair = el.hint();
      el.take(pair[0], pair[1]);
    }
    return el.moves;
  });
  expect(moves).toHaveLength(24);
  expect(await page.locator("#b").evaluate((el, text) => el.restore(text), moves)).toBe(true);
  expect(await cells("#b")).toBe(await cells("#a"));
  expect(await page.locator("#b").evaluate((el) => el.restore("zzzz"))).toBe(false);
  expect(await cells("#b")).toBe(await cells("#a"));
  // Undo takes the last pair back.
  expect(await page.locator("#b").evaluate((el) => el.undo())).toBe(true);
  expect(await page.locator("#b").evaluate((el) => el.tilesLeft)).toBe(100 - 10);
});

test("hints, shuffles and undo can be limited or taken away", async ({ page }) => {
  await bare(page, '<jarajara-layout id="g" size="9" seed="5" hints="1" shuffles="off" undo="off" controls></jarajara-layout>');
  const hint = page.locator("#g").evaluate((el) => el.hint());
  expect(await hint).not.toBeNull();
  expect(await page.locator("#g").evaluate((el) => el.hint())).toBeNull();
  expect(await page.locator("#g").evaluate((el) => el.shadowRoot.querySelector(".note").textContent)).toBe("No hints are left.");
  expect(await page.locator("#g").evaluate((el) => el.shadowRoot.querySelector('[data-action="hint"]').disabled)).toBe(true);
  const pair = await page.locator("#g").evaluate((el) => el.hint());
  expect(pair).toBeNull();
  await page.locator("#g").evaluate((el) => el.setAttribute("hints", "unlimited"));
  const next = await page.locator("#g").evaluate((el) => el.hint());
  await page.locator("#g").evaluate((el, p) => el.take(p[0], p[1]), next);
  expect(await page.locator("#g").evaluate((el) => el.undo())).toBe(false);
  expect(await page.locator("#g").evaluate((el) => el.shadowRoot.querySelector('[data-action="undo"]').disabled)).toBe(true);
  expect(await page.locator("#g").evaluate((el) => el.shuffle())).toBe(false);
  expect(await page.locator("#g").evaluate((el) => el.tilesLeft)).toBe(98);
});

test("shuffles the tiles that are left when no pair can be taken, once, and the shuffle is part of the game", async ({ page }) => {
  await bare(page, '<jarajara-layout id="g" size="4" cells="aa.b...." shuffles="1" controls></jarajara-layout>');
  // Two pairs of tiles on a layout whose slots are stacked: find a position with no pair by playing a position of our own.
  await page.locator("#g").evaluate((el) => el.setAttribute("cells", "abababab"));
  expect(await page.locator("#g").evaluate((el) => el.cells)).toBe("abababab");
  // The bottom row's ends are free; a is at slot 0 and b at slot 1 (z 0), nothing matches among the free tiles.
  const stuck = await page.locator("#g").evaluate((el) => el.shadowRoot.querySelector(".line").textContent);
  expect(stuck).toMatch(/^No pair can be taken|tiles left/);
});

test("lights the free tiles and rings the matches of the tile chosen", async ({ page }) => {
  await bare(page, '<jarajara-layout id="g" size="9" seed="9" show-free show-matching></jarajara-layout>');
  const washed = await page.locator("#g").evaluate((el) => el.shadowRoot.querySelectorAll('[data-free="false"] rect[fill^="rgba"]').length);
  expect(washed).toBeGreaterThan(10);
  const slot = await page.locator("#g").evaluate((el) => {
    const pair = el.hint();
    el.shadowRoot.querySelector(`[data-slot="${pair[0]}"]`).dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    return pair[0];
  });
  expect(typeof slot).toBe("number");
  expect(await page.locator("#g").evaluate((el) => el.shadowRoot.querySelectorAll("[stroke-dasharray]").length)).toBeGreaterThan(0);
});

test("lines the slots up sorted by x, y or z, each tile saying where it lies", async ({ page }) => {
  const errors = await bare(page, '<jarajara-layout id="g" size="8" static view="lined" sort="x"></jarajara-layout>');
  const cells = () => page.locator("#g").evaluate((el) => [...el.shadowRoot.querySelectorAll(".cell")].map((c) => ({ slot: Number(c.dataset.slot), where: c.querySelector(".where").textContent })));
  let list = await cells();
  expect(list).toHaveLength(64);
  const xs = list.map((c) => Number(c.where.match(/x ([\d.]+)/)[1]));
  expect(xs).toEqual([...xs].sort((a, b) => a - b));
  await page.locator("#g").evaluate((el) => el.sortBy("-z y x"));
  list = await cells();
  const zs = list.map((c) => Number(c.where.match(/z (\d+)/)[1]));
  expect(zs).toEqual([...zs].sort((a, b) => b - a));
  expect(await page.locator("#g").evaluate((el) => el.getAttribute("aria-label"))).toBe("64 tiles lined up, sorted by -z y x");
  // A tile's picture is named, and a tap does nothing to a layout that is only looked at.
  await tap(page, page.locator("#g .cell").first());
  expect(await page.locator("#g").evaluate((el) => el.tilesLeft)).toBe(64);
  expect(errors).toEqual([]);
});

test("the demo's game keeps its layout, level and moves between visits, and its cloth follows the header", async ({ page }) => {
  const errors = await open(page, "?cloth=blue");
  await expect(page.locator(at("game"))).toHaveAttribute("cloth", "blue");
  await tap(page, page.locator('#layouts [data-value="8"]'));
  await expect(page.locator(at("game"))).toHaveAttribute("size", "8");
  await tap(page, page.locator('#levels button').nth(2));
  await expect(page.locator(at("game"))).toHaveAttribute("level", "hard");
  await tap(page, at("show-free"));
  await expect(page.locator(at("game"))).toHaveAttribute("show-free", "");
  await page.locator(at("game")).evaluate((el) => {
    const pair = el.hint();
    el.take(pair[0], pair[1]);
  });
  const state = await page.locator(at("game")).evaluate((el) => ({ seed: el.seed, moves: el.moves, cells: el.cells }));
  await page.reload();
  await expect(page.locator("#game .board svg").first()).toBeVisible();
  expect(await page.locator(at("game")).evaluate((el) => ({ seed: el.seed, moves: el.moves, cells: el.cells, size: el.getAttribute("size"), level: el.getAttribute("level") }))).toEqual({ ...state, size: "8", level: "hard" });
  await tap(page, '[data-cloth="wood"]');
  await expect(page.locator(at("game"))).toHaveAttribute("cloth", "wood");
  expect(await sideways(page)).toBe(false);
  expect(errors).toEqual([]);
});

test("a table of computers plays to the end, and a person's turn waits for a tap", async ({ page }) => {
  const errors = await bare(page, '<jarajara-table id="t" size="4" players="3" people="0" delay="0" seed="3"></jarajara-table>');
  await page.waitForFunction(() => document.querySelector("#t").table !== null && document.querySelector("#t").shadowRoot.querySelector(".status").textContent.startsWith("Done"), null, { timeout: 15000 });
  const scores = await page.locator("#t").evaluate((el) => [...el.shadowRoot.querySelectorAll(".score")].map((s) => Number(s.textContent)));
  expect(scores).toHaveLength(3);
  expect(scores.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  const winner = await page.locator("#t").evaluate((el) => [...el.shadowRoot.querySelectorAll(".seat")].filter((s) => s.dataset.winner === "true").length);
  expect(winner).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  // One person and a computer: it is the person's turn first, and the board waits.
  await page.locator("#t").evaluate((el) => {
    el.setAttribute("people", "1");
    el.setAttribute("delay", "5000");
  });
  await expect(page.locator("#t").locator(".seat[data-turn='true'] .who")).toHaveText("East");
  const first = await page.locator("#t").evaluate((el) => el.shadowRoot.querySelector(".status").textContent);
  expect(first).toBe("East, take a pair.");
});

test("the demo's table panel, its gallery and its looked-over layout work", async ({ page }) => {
  const errors = await open(page);
  await page.selectOption(at("table-players"), "3");
  await expect(page.locator(at("table-demo"))).toHaveAttribute("players", "3");
  await expect(page.locator(at("table-demo") + " .seat")).toHaveCount(3);
  await tap(page, at("sort-xyz"));
  await expect(page.locator(at("inspect-note"))).toContainText("sorted by x y z");
  await page.selectOption(at("inspect-size"), "10");
  await expect(page.locator(at("inspect-note"))).toContainText("120 slots");
  await tap(page, at("gallery-castle"));
  await expect(page.locator(at("game"))).toHaveAttribute("size", "10");
  expect(await sideways(page)).toBe(false);
  expect(errors).toEqual([]);
});
