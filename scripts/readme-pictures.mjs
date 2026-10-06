// Takes the pictures the README shows, from the built demo in `site/`: `pnpm screenshots:readme` (builds the demo, then runs this).
// The family's standard is in johnmorrisdotca/.github (README-STANDARD.md); the shared part is readme-pictures-lib.mjs.
// The page is served to a browser without a port, never fetched from the live site, and the same each run: the deal is a kept
// seed, the pairs are taken by the game's own hint, a table is dealt from a seed and played by its computers, and motion is
// reduced. It waits on the elements being defined and drawn, never on a clock.
// Output: docs/images/<subject>-<desk|phone>-<light|dark>.webp.
import { takePictures } from "./readme-pictures-lib.mjs";

const READY = "#game .board svg";

/** The game the demo opens on, as it keeps it on the device: a layout by its size, a level, a seed, and what is shown. */
const kept = ({ size, level = "easy", seed = 2026, showFree = false, extra = {} }) => ({
  init: (keep) => localStorage.setItem("jarajara.page", JSON.stringify(keep)),
  state: { size, level, seed, moves: "", showFree, ...extra },
});

/** Take `pairs` pairs by the game's own hint, so that every picture is of a state a person reaches. */
const take = (pairs) => (page) =>
  page.locator("#game").evaluate((game, count) => {
    for (let taken = 0; taken < count; taken += 1) {
      const pair = game.hint();
      if (pair === null) break;
      game.take(pair[0], pair[1]);
    }
  }, pairs);

const scrollTo = (selector) => (page) => page.locator(selector).evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 16));

/** Open one of the page's tabs, and wait for its panel to show. */
const tab = (name) => async (page) => {
  await page.locator(`[data-testid="tab-${name}"]`).click();
  await page.locator(`#pane-${name}`).waitFor({ state: "visible" });
};

await takePictures({
  shots: [
    // The Turtle (144 tiles), six pairs taken, from the top of the page. On a phone: Fuji in Japanese with the free tiles lit.
    {
      subject: "hero",
      views: ["desk", "phone"],
      url: "/?lang=en&help=off",
      ...kept({ size: 15 }),
      ready: READY,
      height: 1000,
      async prepare(page, { view }) {
        if (view === "phone") {
          await page.addInitScript((keep) => localStorage.setItem("jarajara.page", JSON.stringify(keep)), { size: 9, level: "easy", seed: 2026, moves: "", showFree: true });
          await page.goto("http://jarajara.test/?lang=ja&help=off");
          await page.waitForSelector(READY);
          await take(8)(page);
          await scrollTo("#game")(page);
        } else {
          await take(6)(page);
          await page.evaluate(() => window.scrollTo(0, 0));
        }
      },
    },
    // Awase on the Turtle: the free tiles lit, and the buttons and the line that says how the game stands.
    { subject: "awase", views: ["desk"], url: "/?lang=en&help=off", ...kept({ size: 15, showFree: true }), ready: READY, target: "#game", prepare: take(6) },
    // A game with a clock: the Spark challenge on the Torii.
    { subject: "challenge", views: ["desk"], url: "/?lang=en&help=off", ...kept({ size: 8, extra: { challenge: "spark" } }), ready: READY, target: "#game", prepare: take(3) },
    // One tile, face up, with the backs to choose from.
    { subject: "tiles", views: ["desk"], url: "/?lang=en&help=off", ...kept({ size: 8 }), ready: READY, target: "#pane-tiles" },
    // A hand in a rack, sorted and grouped.
    {
      subject: "rack",
      views: ["desk"],
      url: "/?lang=en&help=off",
      ...kept({ size: 8 }),
      ready: READY,
      target: "#pane-rack",
      async prepare(page) {
        await tab("rack")(page);
        await page.locator('[data-testid="rack-sort"]').click();
        await page.locator('[data-testid="rack-group-suit"]').click();
      },
    },
    // The whole set: 42 faces and how many of each.
    { subject: "set", views: ["desk"], url: "/?lang=en&help=off", ...kept({ size: 8 }), ready: READY, target: "#pane-set", prepare: tab("set") },
    // The thirteen layouts.
    { subject: "layouts", views: ["desk"], url: "/?lang=en&help=off", ...kept({ size: 8 }), ready: READY, target: "#pane-layouts", prepare: tab("layouts") },
    // Awase at a table of two, with a computer.
    { subject: "table", views: ["desk"], url: "/?lang=en&help=off", ...kept({ size: 8 }), ready: READY, target: "#pane-table", prepare: tab("table") },
    // The designs: Jarajara's own and the riichi tiles, regular and black.
    { subject: "designs", views: ["desk"], url: "/?lang=en&help=off", ...kept({ size: 8 }), ready: READY, target: "#pane-designs", prepare: tab("designs") },
  ],
});
