// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's
// shared header and footer, with the family's stylesheet, Jarajara's own, the page's script and the
// compiled library beside it.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

const id = "jarajara";
const ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232f5d4a'/%3E%3Crect x='24' y='12' width='52' height='72' rx='7' fill='%23d9c59b'/%3E%3Crect x='28' y='10' width='50' height='70' rx='7' fill='%23fffdf6'/%3E%3Ctext x='53' y='62' font-size='42' font-weight='700' text-anchor='middle' fill='%23b2302f'%3E中%3C/text%3E%3C/svg%3E";

const uses = [
  `import { generateAwase } from "@johnmorrisdotca/jarajara/awase";`,
  `generateAwase(15, "medium", 12345)  // the Turtle, 144 tiles, clearable`,
  `freePairs(geometry, cells, "group")  // what may be taken now`,
  `checkAwase(15, givens, answer)  // { ok: true }`,
  `layoutSvg(15, cells, { showFree: true })  // the layout, drawn`,
  `tileSvg("F")  // one tile: the red dragon`,
];
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const page = `<!doctype html>
<html lang="en">
  <head>
    ${familyHead({
      id,
      title: "Jarajara · mahjong tiles, and Awase to play",
      description: "Play Awase, the mahjong matching solitaire, on the Turtle, Castle, Fuji or Torii, at three levels, every deal clearable. Jarajara is the open-source mahjong tile library it is built on, in English and Japanese.",
      ogTitle: "Jarajara mahjong tiles",
      ogDescription: "Take the tiles away two at a time, two that match and that are both free, until the layout is clear.",
    })}
    <link rel="icon" href="${ICON}" />
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="jarajara.css" />
  </head>
  <body>
    <main>
      ${familyHeader({ id })}
      <div class="setup fam-row">
        <span class="fam-label" data-say="layout"></span>
        <div class="fam-seg" role="group" data-say-label="layout" id="layouts"></div>
      </div>
      <div class="setup fam-row">
        <span class="fam-label" data-say="level"></span>
        <div class="fam-seg" role="group" data-say-label="level" id="levels"></div>
      </div>
      <p class="how" data-say="howTo"></p>
      <div class="table">
        <div id="board"></div>
      </div>
      <div class="actions">
        <button type="button" class="fam-button" id="new" data-say="newDeal"></button>
        <button type="button" class="fam-button" id="undo" data-say="undo"></button>
        <button type="button" class="fam-button" id="hint" data-say="hint"></button>
        <button type="button" class="fam-button" id="show-free" data-say="showFree"></button>
        <button type="button" class="fam-button" id="shuffle" data-say="shuffle" data-primary="true" hidden></button>
      </div>
      <p class="status" id="status" aria-live="polite"></p>
      <p class="note" id="note" aria-live="polite"></p>
      ${familyUnreviewed({ id })}
      <section class="more" aria-labelledby="more-title">
        <h2 id="more-title" data-say="moreTitle"></h2>
        <p data-say="moreText"></p>
        <ul class="uses">
          ${uses.map((line) => `<li><code>${escape(line)}</code></li>`).join("\n          ")}
        </ul>
      </section>
      ${familyFooter({ id })}
    </main>
    <script>${FAMILY_SCRIPT}</script>
    <script type="module" src="demo.js"></script>
  </body>
</html>
`;

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true });
cpSync("dist", "site/dist", { recursive: true });
writeFileSync("site/index.html", page);
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
