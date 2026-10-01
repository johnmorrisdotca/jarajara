// The riichi designs, fetched on demand, their backs and red fives; and the tile sounds, off until asked.
import { expect, test } from "@playwright/test";

import { TILE_SOUND_KINDS } from "../dist/tile-sounds.js";
import { at, bare, fits, open, tap } from "./demo.mjs";

/** Count every audio context made, every sound started and every recording decoded. */
async function listen(page) {
  await page.addInitScript(() => {
    const heard = { contexts: 0, started: 0, decoded: 0, refused: 0 };
    window.heard = heard;
    const Real = window.AudioContext ?? window.webkitAudioContext;
    if (Real === undefined) return;
    window.AudioContext = class extends Real {
      constructor(...args) {
        super(...args);
        heard.contexts += 1;
      }
      decodeAudioData(data, ...rest) {
        const made = super.decodeAudioData(data, ...rest);
        made.then(() => (heard.decoded += 1), () => (heard.refused += 1));
        return made;
      }
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      heard.started += 1;
      return start.apply(this, args);
    };
  });
}
const heard = (page) => page.evaluate(() => ({ ...window.heard }));

test("a design is fetched only when a tile asks for it, and the default costs nothing extra", async ({ page }) => {
  const asked = [];
  page.on("request", (request) => asked.push(new URL(request.url()).pathname));
  const errors = await bare(page, '<jarajara-tile id="a" code="F" size="large"></jarajara-tile>');
  expect(asked.filter((path) => path.includes("designs/")), "the plain page fetches no design").toEqual([]);
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", '<jarajara-tile id="r" code="F" design="riichi" size="large"></jarajara-tile><jarajara-tile id="k" code="e" design="riichi-black" red size="large"></jarajara-tile>');
  });
  await expect(page.locator("#r")).toHaveAttribute("aria-label", "red dragon");
  await page.waitForFunction(() => document.querySelector("#r").shadowRoot.querySelector(".face svg") !== null);
  expect(asked.filter((path) => path.includes("designs/")).sort()).toEqual(["/dist/designs/riichi-black.js", "/dist/designs/riichi.js"]);
  const draws = (id) => page.locator(id).evaluate((el) => el.shadowRoot.querySelector(".face").innerHTML);
  const own = await draws("#a");
  expect(await draws("#r")).not.toBe(own);
  // The red five is a different picture from the plain five.
  await page.waitForFunction(() => document.querySelector("#k").shadowRoot.querySelector(".face svg") !== null);
  const red = await draws("#k");
  await page.locator("#k").evaluate((el) => el.removeAttribute("red"));
  expect(await draws("#k")).not.toBe(red);
  expect(errors).toEqual([]);
});

test("a riichi tile's back is its own, and a layout and a rack draw in the design", async ({ page }) => {
  const errors = await bare(page, '<jarajara-tile id="b" code="a" design="riichi" face-down size="large"></jarajara-tile><jarajara-layout id="l" size="4" seed="3" design="riichi-black" red-fives static></jarajara-layout><jarajara-rack id="r" tiles="123m555p" design="riichi" red-fives></jarajara-rack>');
  await page.waitForFunction(() => document.querySelector("#b").shadowRoot.querySelector(".back svg") !== null);
  expect(await page.locator("#b").evaluate((el) => el.shadowRoot.querySelector(".back svg").dataset.back)).toBe("riichi");
  // The jade back stays where it is asked for.
  await page.locator("#b").evaluate((el) => el.setAttribute("back", "jade"));
  expect(await page.locator("#b").evaluate((el) => el.shadowRoot.querySelector(".back svg").dataset.back)).toBe("jade");
  await page.waitForFunction(() => document.querySelector("#l").shadowRoot.querySelector("symbol") !== null);
  expect(await page.locator("#l").evaluate((el) => el.shadowRoot.querySelectorAll("use").length)).toBeGreaterThan(8);
  await page.waitForFunction(() => document.querySelector("#r").shadowRoot.querySelectorAll(".face svg").length === 6);
  // The first five of the circles in the rack is the red one: a picture of its own.
  const faces = await page.locator("#r").evaluate((el) => [...el.shadowRoot.querySelectorAll(".slot")].filter((s) => s.querySelector(".face svg")?.dataset.face === "n").map((s) => s.querySelector(".face").innerHTML));
  expect(faces).toHaveLength(3);
  expect(new Set(faces).size).toBe(2);
  expect(errors).toEqual([]);
});

test("the demo's designs panel changes the set and the layout, with red fives and the riichi backs", async ({ page }) => {
  const errors = await open(page);
  await tap(page, at("design-riichi-black"));
  await expect(page.locator(at("design-set"))).toHaveAttribute("design", "riichi-black");
  await expect(page.locator(at("design-layout"))).toHaveAttribute("design", "riichi-black");
  await tap(page, at("design-red"));
  await expect(page.locator(at("design-layout"))).toHaveAttribute("red-fives", "");
  await expect(page.locator(at("design-set"))).toHaveAttribute("mode", "tiles");
  await expect(page.locator(at("design-code"))).toContainText('design="riichi-black"');
  await expect(page.locator(at("back-riichi") + " svg")).toBeVisible();
  await tap(page, at("back-riichi-black"));
  await expect(page.locator(at("back-show") + " svg")).toHaveAttribute("data-back", "riichi-black");
  expect(errors).toEqual([]);
});

test("a sound is made only when asked for: none by a page that stays silent, one by each button, the game's when its switch is on", async ({ page }) => {
  await listen(page);
  const errors = await open(page);
  expect(await heard(page), "a silent page makes no audio context").toMatchObject({ contexts: 0, started: 0 });
  await expect(page.locator(`${at("sound-kinds")} button`)).toHaveCount(TILE_SOUND_KINDS.length);
  let before = 0;
  for (const kind of TILE_SOUND_KINDS) {
    await tap(page, at(`sound-${kind}`));
    await page.waitForFunction((n) => window.heard.started > n, before);
    before = (await heard(page)).started;
  }
  const after = await heard(page);
  expect(after.contexts).toBe(1);
  expect(after.decoded + after.refused).toBe(16);
  // The switch: off until pressed, then the game is heard as it is played, and it is remembered.
  await expect(page.locator(at("sound-toggle"))).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(at("game"))).not.toHaveAttribute("sound", /.*/);
  await tap(page, at("sound-toggle"));
  await expect(page.locator(at("game"))).toHaveAttribute("sound", "");
  await expect(page.locator(at("rack"))).toHaveAttribute("sound", "");
  await expect(page.locator(at("one-tile"))).toHaveAttribute("sound", "");
  const started = (await heard(page)).started;
  await page.locator(at("game")).evaluate((el) => {
    const pair = el.hint();
    el.take(pair[0], pair[1]);
  });
  await page.waitForFunction((n) => window.heard.started > n, started);
  await page.reload();
  await expect(page.locator(at("sound-toggle"))).toHaveAttribute("aria-pressed", "true");
  await tap(page, at("sound-toggle"));
  await expect(page.locator(at("game"))).not.toHaveAttribute("sound", /.*/);
  expect(errors).toEqual([]);
});

test("an element makes no sound without `sound`, and a tile turned with it does", async ({ page }) => {
  await listen(page);
  const errors = await bare(page, '<jarajara-tile id="q" code="a" flip></jarajara-tile><jarajara-tile id="s" code="a" flip sound></jarajara-tile>');
  await tap(page, "#q");
  await page.waitForTimeout(150);
  expect((await heard(page)).contexts).toBe(0);
  await tap(page, "#s");
  await page.waitForFunction(() => window.heard.started > 0);
  expect(errors).toEqual([]);
});

test("the page fits a phone and a desk, with every target a fingertip wide, in either language", async ({ page }) => {
  const errors = await open(page);
  await fits(page, errors);
  await tap(page, "button[data-lang='ja']");
  await expect(page.locator("#sounds-title")).toHaveText("音");
  await expect(page.locator(at("sound-pair"))).toHaveText("一組");
  await fits(page, errors);
});
