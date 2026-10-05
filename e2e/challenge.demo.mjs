// The challenges and the new layouts, by real taps: every layout is on the page and plays; each challenge asks what it says.
import { expect, test } from "@playwright/test";

import { at, bare, fits, open, tap } from "./demo.mjs";

const press = (page, selector, slot) => page.locator(selector).locator(`[data-slot="${slot}"]`).dispatchEvent("click");

/** Take pairs by tapping the tiles a hint names, shuffling when none is left, until the game is over or nothing can be done; answers how many pairs were taken. */
async function playOut(page, selector) {
  let taken = 0;
  for (let step = 0; step < 200; step += 1) {
    const pair = await page.locator(selector).evaluate((el) => el.hint());
    if (pair === null) {
      if (await page.locator(selector).evaluate((el) => el.shuffle())) continue;
      return taken;
    }
    for (const slot of pair) await press(page, selector, slot);
    taken += 1;
  }
  return taken;
}

const line = (page, selector, name = ".line") => page.locator(selector).evaluate((el, sel) => el.shadowRoot.querySelector(sel).textContent, name);

test("every layout is offered and every one of them plays", async ({ page }) => {
  const errors = await open(page);
  const names = await page.locator("#layouts button").allTextContents();
  expect(names).toEqual(["Torii", "Fuji", "Castle", "Turtle", "Pagoda", "Fortress", "Pyramid", "Bridge", "Butterfly", "Dragon", "Wall", "Palace"]);
  await expect(page.locator(at("gallery") + " .gallery-card")).toHaveCount(13);
  for (const [size, tiles] of [[11, 94], [12, 116], [13, 142], [14, 84], [16, 112], [17, 142], [20, 288], [26, 576]]) {
    await tap(page, page.locator(`#layouts [data-value="${size}"]`));
    await expect(page.locator(at("game"))).toHaveAttribute("size", String(size));
    expect(await page.locator(at("game")).evaluate((el) => el.tilesLeft)).toBe(tiles);
    expect(await page.locator(at("game")).evaluate((el) => el.shadowRoot.querySelectorAll("[data-slot]").length)).toBe(tiles);
    // A pair can be taken at once.
    const pair = await page.locator(at("game")).evaluate((el) => el.hint());
    expect(pair).not.toBeNull();
  }
  await fits(page, errors);
});

test("a new layout is dealt from a seed the same way every time, and cleared by taking pairs", async ({ page }) => {
  const errors = await bare(page, '<jarajara-layout id="a" size="14" seed="5" level="easy"></jarajara-layout><jarajara-layout id="b" size="14" seed="5" level="easy"></jarajara-layout>');
  expect(await page.locator("#a").evaluate((el) => el.cells)).toBe(await page.locator("#b").evaluate((el) => el.cells));
  const cleared = [];
  await page.exposeFunction("told", (detail) => cleared.push(detail));
  await page.evaluate(() => document.addEventListener("jarajara-clear", (event) => window.told(event.detail)));
  expect(await playOut(page, "#a")).toBe(42);
  expect(await page.locator("#a").evaluate((el) => el.tilesLeft)).toBe(0);
  expect(cleared).toHaveLength(1);
  expect(cleared[0].score).toBeGreaterThan(4000);
  expect(errors).toEqual([]);
});

test("rush is won on the goal number of pairs, with tiles left on the layout", async ({ page }) => {
  const errors = await bare(page, '<jarajara-layout id="g" size="9" seed="31" challenge="rush" timer controls></jarajara-layout>');
  expect(await line(page, "#g", ".goal")).toBe("0 of 21 pairs");
  expect(await line(page, "#g", ".clock")).toBe("3:00");
  const won = [];
  await page.exposeFunction("told", (detail) => won.push(detail));
  await page.evaluate(() => document.addEventListener("jarajara-clear", (event) => window.told(event.detail)));
  expect(await playOut(page, "#g")).toBe(21);
  expect(won).toHaveLength(1);
  expect(won[0].because).toBe("goal");
  expect(await line(page, "#g")).toMatch(/^Won, with \d+ points\.$/);
  expect(await page.locator("#g").evaluate((el) => el.tilesLeft)).toBe(100 - 42);
  // A game that is over takes no more pairs, and undo is still the player's where the rules give it.
  expect(await page.locator("#g").evaluate((el) => el.hint())).toBeNull();
  expect(errors).toEqual([]);
});

test("a clock runs down from the first pair, and a game whose time is up is lost", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-01T10:00:00Z") });
  const errors = await bare(page, '<jarajara-layout id="g" size="4" seed="3" challenge="spark" timer controls></jarajara-layout>');
  // 8 tiles at 2.5 seconds each: twenty seconds, held until the first pair.
  expect(await line(page, "#g", ".clock")).toBe("0:20");
  await page.clock.runFor(5000);
  expect(await line(page, "#g", ".clock")).toBe("0:20");
  const lost = [];
  await page.exposeFunction("told", (detail) => lost.push(detail));
  await page.evaluate(() => document.addEventListener("jarajara-lost", (event) => window.told(event.detail)));
  const pair = await page.locator("#g").evaluate((el) => el.hint());
  for (const slot of pair) await press(page, "#g", slot);
  await page.clock.runFor(8000);
  expect(await line(page, "#g", ".clock")).toMatch(/^0:1[0-2]$/);
  await page.clock.runFor(15_000);
  await expect.poll(() => line(page, "#g")).toBe("Time is up.");
  expect(lost).toEqual([{ because: "time" }]);
  expect(await line(page, "#g", ".clock")).toBe("0:00");
  // No more pairs, no undo (a spark game has none), and the buttons say so.
  expect(await page.locator("#g").evaluate((el) => el.undo())).toBe(false);
  expect(await page.locator("#g").evaluate((el) => el.shadowRoot.querySelector('[data-action="undo"]').disabled)).toBe(true);
  expect(errors).toEqual([]);
});

test("the gold pair and the purge's tiles are ringed in gold, and a purge is won when its group is gone", async ({ page }) => {
  const errors = await bare(page, '<jarajara-layout id="g" size="9" seed="31" challenge="gold"></jarajara-layout><jarajara-layout id="p" size="9" seed="31" challenge="purge"></jarajara-layout>');
  const gold = (id) => page.locator(id).evaluate((el) => el.shadowRoot.querySelectorAll('[stroke="#d4a017"]').length);
  expect(await gold("#g")).toBeGreaterThanOrEqual(2);
  const marked = await gold("#p");
  expect(marked).toBeGreaterThanOrEqual(8);
  // Take pairs of the gold tiles whenever they can be, any other pair when not, shuffling when stuck.
  for (let guard = 0; guard < 120; guard += 1) {
    const moved = await page.locator("#p").evaluate((el) => {
      if (el.run.over !== null) return "over";
      const gold = new Set([...el.shadowRoot.querySelectorAll("g[data-slot]")].filter((g) => g.querySelector('[stroke="#d4a017"]')).map((g) => Number(g.dataset.slot)));
      const free = [...el.shadowRoot.querySelectorAll('g[data-free="true"]')].map((g) => Number(g.dataset.slot));
      const cells = el.cells;
      for (const a of free) for (const b of free) if (a < b && cells[a] === cells[b] && (gold.has(a) || gold.has(b)) && el.take(a, b)) return "taken";
      const pair = el.hint();
      if (pair !== null) return el.take(pair[0], pair[1]) ? "taken" : "stuck";
      return el.shuffle() ? "shuffled" : "stuck";
    });
    if (moved === "over" || moved === "stuck") break;
  }
  expect(await page.locator("#p").evaluate((el) => [el.run.over, el.run.because])).toEqual(["won", "purged"]);
  expect(await gold("#p")).toBe(0);
  expect(errors).toEqual([]);
});

test("blackout draws the covered tiles blank, and only the free ones show what they are", async ({ page }) => {
  const errors = await bare(page, '<jarajara-layout id="g" size="9" seed="31" challenge="blackout" controls></jarajara-layout>');
  const faces = () => page.locator("#g").evaluate((el) => [...el.shadowRoot.querySelectorAll("g[data-slot]")].map((g) => ({ free: g.dataset.free === "true", face: g.dataset.face })));
  const drawn = await faces();
  expect(drawn.filter((tile) => tile.free).every((tile) => tile.face !== "")).toBe(true);
  expect(drawn.filter((tile) => !tile.free).every((tile) => tile.face === "")).toBe(true);
  expect(drawn.filter((tile) => !tile.free).length).toBeGreaterThan(20);
  expect(await page.locator("#g").evaluate((el) => el.shadowRoot.querySelector('[data-action="undo"]').disabled)).toBe(true);
  expect(await line(page, "#g", ".goal")).toBe("Only free tiles show their faces.");
  // Taking pairs uncovers faces.
  await playOut(page, "#g");
  expect(await page.locator("#g").evaluate((el) => el.tilesLeft)).toBe(0);
  expect(errors).toEqual([]);
});

test("sand shows the clock counting down and lets every pair add to it", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-01T10:00:00Z") });
  await bare(page, '<jarajara-layout id="g" size="9" seed="31" challenge="sand" timer></jarajara-layout>');
  expect(await line(page, "#g", ".clock")).toBe("0:45");
  const pair = await page.locator("#g").evaluate((el) => el.hint());
  for (const slot of pair) await press(page, "#g", slot);
  await page.clock.runFor(2000);
  // 45 s, five added by the pair, two spent.
  expect(await line(page, "#g", ".clock")).toMatch(/^0:4[7-9]$/);
});

test("the demo's challenge buttons set the game's challenge, and today's game is the same for everybody", async ({ page }) => {
  const errors = await open(page);
  await expect(page.locator(at("challenge-picks") + " button")).toHaveText(["Plain", "Gold", "Spark", "Rush", "Fortune", "Sand", "Purge", "Blackout"]);
  await tap(page, page.locator(at("challenge-picks") + " button", { hasText: "Rush" }));
  await expect(page.locator(at("game"))).toHaveAttribute("challenge", "rush");
  await expect(page.locator(at("challenge-note"))).toContainText("three minutes");
  await tap(page, page.locator(at("challenge-picks") + " button", { hasText: "Plain" }));
  await expect(page.locator(at("game"))).not.toHaveAttribute("challenge", /./);
  await tap(page, at("daily"));
  const today = await page.evaluate(async () => {
    const { dailyAwase } = await import("./dist/awase-entry.js");
    return dailyAwase(new Date());
  });
  await expect(page.locator(at("game"))).toHaveAttribute("size", String(today.size));
  await expect(page.locator(at("game"))).toHaveAttribute("challenge", today.challenge);
  expect(await page.locator(at("game")).evaluate((el) => el.seed)).toBe(today.seed);
  await expect(page.locator(at("challenge-note"))).toContainText(today.date);
  await expect(page.locator(at("challenge-list") + " li")).toHaveCount(7);
  await fits(page, errors);
});
