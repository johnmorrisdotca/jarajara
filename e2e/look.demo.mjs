// How the tiles look and what the board does for the player: boards framed and centred on what is drawn, Find, a hint that
// looks for the chosen tile's match, the board seen from the other side, a tile that tips over on its edge, and a sound for every action.
/* global PointerEvent */
import { expect, test } from "@playwright/test";

import { at, bare, open, sideways, tap } from "./demo.mjs";

const press = (page, selector, slot) => page.locator(selector).locator(`[data-slot="${slot}"]`).dispatchEvent("click");

/** The gaps between what a board draws solid (every tile's block and face, not its shadow) and the frame inside its felt, and the padding the frame keeps. */
const gaps = (page, selector) =>
  page.locator(selector).evaluate((el) => {
    const frame = el.shadowRoot.querySelector(".frame");
    const inner = frame.getBoundingClientRect();
    const style = getComputedStyle(frame);
    const border = parseFloat(style.borderLeftWidth);
    const pad = parseFloat(style.paddingLeft);
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    // The solid tile is its block and the edge laid over its face (a design's own drawing may overshoot its box, which is clipped: not measured).
    for (const part of el.shadowRoot.querySelectorAll('g[data-slot] > use[href*="-blk-"]')) {
      if (/-s\d$/.test(part.getAttribute("href"))) continue;
      const box = part.getBoundingClientRect();
      if (box.width === 0) continue;
      left = Math.min(left, box.left);
      right = Math.max(right, box.right);
      top = Math.min(top, box.top);
      bottom = Math.max(bottom, box.bottom);
    }
    return { left: left - (inner.left + border), right: inner.right - border - right, top: top - (inner.top + border), bottom: inner.bottom - border - bottom, pad };
  });

test("every layout in every design and view sits in the same box with the same distance from the frame all round", async ({ page }) => {
  const errors = await bare(page, "");
  // Every layout in the package's own tiles, in each of the four views; and the three designs on three layouts.
  await page.evaluate(async ({ sizes }) => {
    const { ALL_LAYOUTS } = await import("./dist/index.js");
    const box = document.createElement("div");
    box.id = "boards";
    document.body.append(box);
    const make = (size, design, mirror) => {
      const el = document.createElement("jarajara-layout");
      el.setAttribute("size", String(size));
      el.setAttribute("cloth", "green");
      el.setAttribute("box", "landscape");
      el.setAttribute("seed", "5");
      el.setAttribute("static", "");
      if (design !== "jarajara") el.setAttribute("design", design);
      if (mirror !== "none") el.setAttribute("mirror", mirror);
      el.dataset.board = `${size} ${design} ${mirror}`;
      box.append(el);
    };
    for (const layout of ALL_LAYOUTS) for (const mirror of ["none", "horizontal", "vertical", "both"]) make(layout.size, "jarajara", mirror);
    for (const design of ["riichi", "riichi-black"]) for (const size of sizes) make(size, design, "none");
  }, { sizes: [4, 9, 15] });
  await page.waitForFunction(() => [...document.querySelectorAll("#boards jarajara-layout")].every((el) => el.shadowRoot.querySelector(".board g[data-slot]") !== null), null, { timeout: 20000 });
  const names = await page.locator("#boards jarajara-layout").evaluateAll((els) => els.map((el) => el.dataset.board));
  expect(names.length).toBeGreaterThan(40);
  const sizes = new Set();
  for (const name of names) {
    const selector = `#boards jarajara-layout[data-board="${name}"]`;
    const got = await gaps(page, selector);
    expect(Math.abs(got.left - got.right), `${name}: left ${got.left.toFixed(1)} right ${got.right.toFixed(1)}`).toBeLessThanOrEqual(2);
    expect(Math.abs(got.top - got.bottom), `${name}: top ${got.top.toFixed(1)} bottom ${got.bottom.toFixed(1)}`).toBeLessThanOrEqual(2);
    for (const side of ["left", "right", "top", "bottom"]) expect(got[side], `${name}: ${side}`).toBeGreaterThanOrEqual(got.pad - 0.5);
    const box = await page.locator(selector).boundingBox();
    sizes.add(`${Math.round(box.width)}x${Math.round(await page.locator(selector).evaluate((el) => el.shadowRoot.querySelector(".frame").getBoundingClientRect().height))}`);
  }
  // One steady box: whatever the layout, view or design, the frame is the same size.
  expect([...sizes], "every board has the same frame").toHaveLength(1);
  expect(errors).toEqual([]);
});

test("the demo's game keeps one box when another layout is chosen, and the box fits the window with its controls", async ({ page }) => {
  const errors = await open(page);
  const size = () => page.locator(at("game")).evaluate((el) => {
    const frame = el.shadowRoot.querySelector(".frame").getBoundingClientRect();
    const whole = el.getBoundingClientRect();
    return { frame: `${Math.round(frame.width)}x${Math.round(frame.height)}`, whole: `${Math.round(whole.width)}x${Math.round(whole.height)}`, bottom: Math.round(whole.bottom + window.scrollY) };
  });
  const first = await size();
  for (const value of ["8", "9", "10", "15", "11"]) {
    await tap(page, page.locator(`#layouts [data-value="${value}"]`));
    expect(await size(), `layout ${value}`).toMatchObject({ frame: first.frame, whole: first.whole });
  }
  const viewport = page.viewportSize();
  // On a desk the board, its status and buttons are all in the first window; on a phone the board fits the width.
  if (viewport.width >= 1000) expect(first.bottom).toBeLessThanOrEqual(viewport.height + 40);
  else expect(parseInt(first.whole)).toBeLessThanOrEqual(viewport.width);
  expect(await sideways(page)).toBe(false);
  expect(errors).toEqual([]);
});

/** The slots lit by Find, as a solid ring (free) and a dashed ring (held). */
const lit = (page, selector) =>
  page.locator(selector).evaluate((el) => {
    const solid = [];
    const dashed = [];
    for (const g of el.shadowRoot.querySelectorAll("g[data-slot]")) {
      if (g.querySelector('rect[stroke="#1c6e8c"][stroke-width="2.4"]')) solid.push(Number(g.dataset.slot));
      if (g.querySelector('rect[stroke="#1c6e8c"][stroke-dasharray]')) dashed.push(Number(g.dataset.slot));
    }
    return { solid, dashed };
  });

test("Find lights every tile that matches the one pointed at or chosen: a solid ring for one that can be taken with it, a dashed one for one that is held", async ({ page }) => {
  const errors = await bare(page, '<jarajara-layout id="g" size="15" seed="7" cloth="green"></jarajara-layout><jarajara-layout id="off" size="15" seed="7"></jarajara-layout>');
  const { slot, free, blocked } = await page.locator("#g").evaluate(async (el) => {
    const { matchesOf, geometryOf, layoutFor, isFree, bonusRuleOf } = await import("./dist/index.js");
    const geometry = geometryOf(layoutFor(15));
    const rule = bonusRuleOf(el.cells);
    for (let slot = 0; slot < el.cells.length; slot += 1) {
      const found = matchesOf(geometry, el.cells, rule, slot);
      if (isFree(geometry, el.cells, slot) && found.free.length > 0 && found.blocked.length > 0) return { slot, free: found.free, blocked: found.blocked };
    }
    return null;
  });
  // With Find off, nothing is lit by choosing or pointing.
  await press(page, "#g", slot);
  expect(await lit(page, "#g")).toEqual({ solid: [], dashed: [] });
  await press(page, "#g", slot);
  await page.locator("#g").evaluate((el) => el.setAttribute("find", ""));
  // A touch has no pointing: choosing is the trigger.
  await press(page, "#g", slot);
  const chosen = await lit(page, "#g");
  expect(chosen.solid.sort((a, b) => a - b)).toEqual(free);
  expect(chosen.dashed.sort((a, b) => a - b)).toEqual(blocked);
  // The chosen tile keeps its own ring, in another colour.
  await expect(page.locator("#g [aria-pressed='true']")).toHaveCount(1);
  expect(await page.locator("#g").evaluate((el) => el.shadowRoot.querySelectorAll('[stroke="#52664b"][stroke-width="2.6"]').length)).toBe(1);
  await press(page, "#g", slot);
  expect(await lit(page, "#g")).toEqual({ solid: [], dashed: [] });
  // A mouse pointing at a tile lights its matches, and leaving it puts them out.
  await page.locator("#g").evaluate((el, slot) => el.shadowRoot.querySelector(`[data-slot="${slot}"]`).dispatchEvent(new PointerEvent("pointerover", { pointerType: "mouse", bubbles: true, composed: true })), slot);
  expect((await lit(page, "#g")).solid.sort((a, b) => a - b)).toEqual(free);
  await page.locator("#g").evaluate((el) => el.shadowRoot.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" })));
  expect(await lit(page, "#g")).toEqual({ solid: [], dashed: [] });
  // A finger passing over is not pointing.
  await page.locator("#g").evaluate((el, slot) => el.shadowRoot.querySelector(`[data-slot="${slot}"]`).dispatchEvent(new PointerEvent("pointerover", { pointerType: "touch", bubbles: true, composed: true })), slot);
  expect(await lit(page, "#g")).toEqual({ solid: [], dashed: [] });
  expect(errors).toEqual([]);
});

test("a hint looks for the chosen tile's match first, and says so when it has none", async ({ page }) => {
  const errors = await bare(page, '<jarajara-layout id="g" size="15" seed="11" controls></jarajara-layout>');
  const events = [];
  await page.exposeFunction("told", (detail) => events.push(detail));
  await page.evaluate(() => document.addEventListener("jarajara-hint", (event) => window.told(event.detail)));
  const plan = await page.locator("#g").evaluate(async (el) => {
    const { matchesOf, geometryOf, layoutFor, isFree, bonusRuleOf } = await import("./dist/index.js");
    const geometry = geometryOf(layoutFor(15));
    const rule = bonusRuleOf(el.cells);
    const slots = [...el.cells].map((_, at) => at).filter((at) => isFree(geometry, el.cells, at));
    const withMatch = slots.find((at) => matchesOf(geometry, el.cells, rule, at).free.length > 0);
    const without = slots.find((at) => matchesOf(geometry, el.cells, rule, at).free.length === 0);
    return { withMatch, matches: matchesOf(geometry, el.cells, rule, withMatch).free, without };
  });
  // Nothing chosen: any free pair, as ever.
  await tap(page, page.locator('#g').locator('[data-action="hint"]'));
  expect(events.at(-1).found).toBe("any");
  // A tile chosen that has a match: the match is lit, and the chosen tile stays chosen.
  await press(page, "#g", plan.withMatch);
  await tap(page, page.locator('#g').locator('[data-action="hint"]'));
  expect(events.at(-1).found).toBe("match");
  expect(events.at(-1).pair[0]).toBe(plan.withMatch);
  expect(plan.matches).toContain(events.at(-1).pair[1]);
  const hinted = await page.locator("#g").evaluate((el) => [...el.shadowRoot.querySelectorAll("g[data-slot]")].filter((g) => g.querySelector('rect[stroke="#9d6c1f"]')).map((g) => Number(g.dataset.slot)));
  expect(hinted).toEqual([events.at(-1).pair[1]]);
  await expect(page.locator("#g [aria-pressed='true']")).toHaveCount(1);
  // A tile with no free match: it says so, and shows another pair.
  await press(page, "#g", plan.withMatch);
  await press(page, "#g", plan.without);
  await tap(page, page.locator('#g').locator('[data-action="hint"]'));
  expect(events.at(-1).found).toBe("other");
  expect(events.at(-1).pair).not.toContain(plan.without);
  expect(await page.locator("#g").evaluate((el) => el.shadowRoot.querySelector(".note").textContent)).toBe("No free tile matches that one. Here is another pair.");
  expect(errors).toEqual([]);
});

test("the board can be seen from the other side: only the picture turns, never the rules", async ({ page }) => {
  const errors = await bare(page, '<jarajara-layout id="g" size="15" seed="3" controls flippable cloth="green"></jarajara-layout>');
  const state = () => page.locator("#g").evaluate((el) => ({ mirror: el.mirror, free: [...el.shadowRoot.querySelectorAll("g[data-slot]")].map((g) => `${g.dataset.slot}:${g.dataset.free}`).join(" "), x: Number(el.shadowRoot.querySelector('[data-slot="0"]').getAttribute("transform").match(/translate\(([\d.]+)/)[1]), cells: el.cells }));
  const plain = await state();
  expect(plain.mirror).toBe("none");
  const seen = [];
  for (const expected of ["horizontal", "vertical", "both", "none"]) {
    await tap(page, page.locator('#g').locator('[data-action="flip"]'));
    const now = await state();
    expect(now.mirror).toBe(expected);
    expect(now.free, `the free tiles in the ${expected} view`).toBe(plain.free);
    expect(now.cells).toBe(plain.cells);
    seen.push(now.x);
  }
  // Slot 0 is the layout's left: turned left to right it is drawn at the right.
  expect(seen[0]).toBeGreaterThan(plain.x);
  expect(seen[3]).toBe(plain.x);
  // A game played in a mirrored view is the same game: the moves are the layout's own.
  await page.locator("#g").evaluate((el) => el.setAttribute("mirror", "both"));
  const moves = await page.locator("#g").evaluate((el) => {
    for (let i = 0; i < 5; i += 1) {
      const pair = el.hint();
      el.take(pair[0], pair[1]);
    }
    return { moves: el.moves, seed: el.seed };
  });
  await page.locator("#g").evaluate((el) => el.setAttribute("mirror", "none"));
  expect(await page.locator("#g").evaluate((el, game) => (el.restore(game.moves), el.moves), moves)).toBe(moves.moves);
  expect(errors).toEqual([]);
});

test("a tile tips over on its edge, showing its thickness as it goes, and is still when it is turned", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors = await bare(page, '<jarajara-tile id="t" code="east" size="large" flip></jarajara-tile>');
  const edges = await page.locator("#t").evaluate((el) => el.shadowRoot.querySelectorAll(".edge").length);
  expect(edges, "a block has four edges").toBe(4);
  await page.locator("#t").evaluate((el) => {
    el.flip();
    window.running = el.shadowRoot.querySelector(".turn").getAnimations().map((a) => ({ keyframes: a.effect.getKeyframes().length, duration: a.effect.getTiming().duration }));
  });
  const running = await page.evaluate(() => window.running);
  expect(running.length).toBe(1);
  // From upright to the back, by way of lifting: three keyframes, and a turn that takes a moment.
  expect(running[0].keyframes).toBe(3);
  expect(running[0].duration).toBeGreaterThan(300);
  // Mid-turn both sides are in the page; once turned, only the back.
  expect(await page.locator("#t").evaluate((el) => [el.shadowRoot.querySelector(".face svg") !== null, el.shadowRoot.querySelector(".back svg") !== null])).toEqual([true, true]);
  await expect.poll(() => page.locator("#t").evaluate((el) => el.shadowRoot.querySelector(".face svg") === null), { timeout: 4000 }).toBe(true);
  expect(await page.locator("#t").evaluate((el) => el.shadowRoot.querySelector(".turn").getAnimations().length)).toBe(0);
  // Less motion: no turn at all, and the tile is simply the other way up.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#t").evaluate((el) => {
    el.flip();
    window.running = el.shadowRoot.querySelector(".turn").getAnimations().length;
  });
  expect(await page.evaluate(() => window.running)).toBe(0);
  await expect(page.locator("#t")).toHaveAttribute("aria-label", "east wind");
  expect(errors).toEqual([]);
});

test("every design draws a seam round each face that stands out from it, so a row of tiles can be counted", async ({ page }) => {
  const errors = await bare(page, '<jarajara-layout id="a" size="15" seed="2" static></jarajara-layout><jarajara-layout id="b" size="15" seed="2" static design="riichi"></jarajara-layout><jarajara-layout id="c" size="15" seed="2" static design="riichi-black"></jarajara-layout>');
  await page.waitForFunction(() => ["a", "b", "c"].every((id) => document.getElementById(id).shadowRoot.querySelector("[id$='-e']") !== null));
  for (const id of ["a", "b", "c"]) {
    const seam = await page.locator(`#${id}`).evaluate((el) => {
      const edge = el.shadowRoot.querySelector("[id$='-e'] rect");
      const bevel = el.shadowRoot.querySelectorAll("[id$='-e'] rect")[1];
      return { seam: edge.getAttribute("stroke"), bevel: bevel.getAttribute("stroke") };
    });
    expect(seam.seam).not.toBe("#000000");
    expect(seam.seam).not.toBe(seam.bevel);
  }
  expect(errors).toEqual([]);
});

test("every action of the tile, the rack and the board makes its sound from the element's own method, and a burst is never a roar", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = await bare(page, '<jarajara-tile id="t" code="east" flip sound></jarajara-tile><jarajara-rack id="r" tiles="234m567p3456s11z77z" capacity="14" pick sound></jarajara-rack><jarajara-layout id="g" size="4" seed="7" controls sound></jarajara-layout><jarajara-layout id="quiet" size="4" seed="7" controls></jarajara-layout>');
  await page.evaluate(async () => {
    const { setPageSounds } = await import("./dist/element.js");
    window.heard = [];
    const stub = { play: (kind, options) => window.heard.push([kind, options?.count ?? 1]), load: async () => true, muted: false, setMuted() {}, volume: 0.6, close() {} };
    setPageSounds(stub);
    // Installing the stand-in again also clears what the page counts as still sounding: each action is heard on its own.
    window.reinstall = () => setPageSounds(stub);
  });
  /** The sounds one action makes: the kinds, in order. */
  const sounds = async (action) => {
    await page.evaluate(() => {
      window.heard.length = 0;
      window.reinstall();
    });
    await page.evaluate(action);
    await page.waitForTimeout(40);
    return page.evaluate(() => window.heard.map(([kind]) => kind));
  };
  const expectSound = async (name, action, kinds) => expect(await sounds(action), name).toEqual(kinds);
  await expectSound("the tile turned", () => document.getElementById("t").flip(), ["flip"]);
  await expectSound("the tile spun", () => document.getElementById("t").spin(), ["flip"]);
  await expectSound("face down", () => document.getElementById("r").hide(), ["flip"]);
  await expectSound("face up", () => document.getElementById("r").show(), ["flip"]);
  await expectSound("face down, one by one", () => document.getElementById("r").hide({ oneByOne: true, gap: 40 }), ["flip"]);
  expect(await page.evaluate(() => window.heard.at(-1)[1]), "one click for each tile turned").toBe(14);
  await page.evaluate(() => {
    window.reinstall();
    return document.getElementById("r").show();
  });
  await expectSound("sort", () => document.getElementById("r").sort(), ["place"]);
  await expectSound("group by suit", () => document.getElementById("r").group("suit"), ["place"]);
  await expectSound("group by kind", () => document.getElementById("r").group("kind"), ["place"]);
  await expectSound("close the groups", () => document.getElementById("r").ungroup(), ["place"]);
  await expectSound("as dealt", () => document.getElementById("r").unsort(), ["place"]);
  await expectSound("mix up", () => document.getElementById("r").mixUp(3), ["shuffle"]);
  await expectSound("raise a tile", () => document.getElementById("r").lift(0), ["pick"]);
  await expectSound("turn the raised", () => document.getElementById("r").toggle([0]), ["flip"]);
  await expectSound("lower a tile", () => document.getElementById("r").lower(0), ["place"]);
  await expectSound("lower nothing", () => document.getElementById("r").lower(0), []);
  await expectSound("mark", () => document.getElementById("r").mark(1), ["pick"]);
  await expectSound("clear the marks", () => document.getElementById("r").unmark(), ["place"]);
  await expectSound("spin", () => document.getElementById("r").spin(), ["flip"]);
  await expectSound("put a tile in", () => document.getElementById("r").add("F"), ["place"]);
  await expectSound("take a tile out", () => document.getElementById("r").take(0), ["pick"]);
  await expectSound("a new hand", () => document.getElementById("r").deal("112233m445566p77z"), ["shuffle"]);
  // Tapping a tile raises and lowers it, once each.
  await page.evaluate(() => {
    window.heard.length = 0;
    window.reinstall();
  });
  await tap(page, page.locator("#r .slot").first());
  await tap(page, page.locator("#r .slot").first());
  expect(await page.evaluate(() => window.heard.map(([kind]) => kind))).toEqual(["pick", "place"]);
  // The board: a hint, a pair taken, an undo, a new deal and a shuffle.
  await expectSound("a hint", () => document.getElementById("g").hint(), ["pick"]);
  await expectSound("a pair taken", () => {
    const g = document.getElementById("g");
    const pair = g.hint();
    g.take(pair[0], pair[1]);
  }, ["pick", "pair"]);
  await expectSound("an undo", () => document.getElementById("g").undo(), ["place"]);
  await page.evaluate(() => {
    window.heard.length = 0;
    window.reinstall();
  });
  await page.locator("#g").locator('[data-action="new"]').click();
  expect(await page.evaluate(() => window.heard.map(([kind]) => kind))).toEqual(["shuffle"]);
  // Play at random until no pair can be taken: then the tiles may be shuffled.
  expect(await page.evaluate(async () => {
    const { runPairs } = await import("./dist/awase-entry.js");
    const g = document.getElementById("g");
    for (let seed = 1; seed < 400; seed += 1) {
      g.setAttribute("size", "9");
      g.setAttribute("seed", String(seed));
      for (let guard = 0; guard < 80 && runPairs(g.run).length > 0; guard += 1) {
        const pairs = runPairs(g.run);
        const pair = pairs[(seed * 7 + guard * 13) % pairs.length];
        g.take(pair[0], pair[1]);
      }
      if (g.tilesLeft > 0 && runPairs(g.run).length === 0) return true;
    }
    return false;
  }), "found a game with no pair left").toBe(true);
  await expectSound("a shuffle", () => document.getElementById("g").shuffle(), ["shuffle"]);
  // Taking the last pair of a layout is a win, with its own clatter.
  const won = await sounds(() => {
    const g = document.getElementById("g");
    g.setAttribute("size", "4");
    g.setAttribute("cells", "aaaaaaaa");
    for (let guard = 0; guard < 8 && g.tilesLeft > 0; guard += 1) {
      const pair = g.hint();
      g.take(pair[0], pair[1]);
    }
  });
  expect(won.at(-1), "the last pair is the win").toBe("win");
  expect(won.filter((kind) => kind === "win")).toHaveLength(1);
  // The element's own sound switch: without `sound`, nothing is asked of the player.
  expect(await sounds(() => {
    const quiet = document.getElementById("quiet");
    const pair = quiet.hint();
    quiet.take(pair[0], pair[1]);
    quiet.undo();
  })).toEqual([]);
  // A burst of changes never stacks into a roar: only so many clicks sound at once.
  await page.evaluate(() => {
    window.heard.length = 0;
    window.reinstall();
    const r = document.getElementById("r");
    for (let i = 0; i < 12; i += 1) r.toggle();
  });
  const total = await page.evaluate(() => window.heard.reduce((sum, [, count]) => sum + Math.min(count, 8), 0));
  expect(total).toBeGreaterThan(0);
  expect(total).toBeLessThanOrEqual(12);
  expect(errors).toEqual([]);
});
