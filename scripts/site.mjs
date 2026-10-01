// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's
// shared header and footer, with the family's stylesheet, Jarajara's own, the page's script and the
// compiled library beside it.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { API_CSS, apiPage } from "./api.mjs";
import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

const id = "jarajara";
const ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232f5d4a'/%3E%3Crect x='24' y='12' width='52' height='72' rx='7' fill='%23d9c59b'/%3E%3Crect x='28' y='10' width='50' height='70' rx='7' fill='%23fffdf6'/%3E%3Ctext x='53' y='62' font-size='42' font-weight='700' text-anchor='middle' fill='%23b2302f'%3E中%3C/text%3E%3C/svg%3E";

const uses = [
  `import { generateAwase } from "@johnmorrisdotca/jarajara/awase";`,
  `generateAwase(15, "medium", 12345)  // the Turtle, 144 tiles, clearable`,
  `freePairs(geometry, cells, "group")  // what may be taken now`,
  `checkAwase(15, givens, answer)  // { ok: true }`,
  `layoutSvg(15, cells, { showFree: true, cloth: "green" })  // the layout, drawn`,
  `tileSvg("F")  // one tile: the red dragon`,
  `tileBackSvg("bamboo")  // its back`,
  `findFace("three circles")  // a tile by its name; readTiles("123m456p11z") for a hand`,
  `sortSlots(layout, ["x", "y", "z"])  // a layout's slots, by where they lie`,
  `<script type="module" src=".../element-define.js">  then <jarajara-tile>, <jarajara-rack>, <jarajara-layout> ...`,
];
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The page's body: the panels, with the lines of use filled in, and what a release adds in its own place. */
const body = readFileSync("demo/body.html", "utf8")
  .replace("__UNREVIEWED__", familyUnreviewed({ id }))
  .replace("__USES__", uses.map((line) => `<li><code>${escape(line)}</code></li>`).join("\n            "))
  .replace("__CHALLENGE_ROW__", "")
  .replace("__TILE_EXTRAS__", "")
  .replace("__MORE_PANELS__", "")
  .trimEnd();

const page = `<!doctype html>
<html lang="en">
  <head>
    ${familyHead({
      id,
      title: "Jarajara · mahjong tiles, and Awase to play",
      description: "Play Awase, the mahjong matching solitaire, and see the tiles, racks, layouts and tables Jarajara draws on any page. Jarajara is the open-source mahjong tile library it is built on, in English and Japanese.",
      ogTitle: "Jarajara mahjong tiles",
      ogDescription: "Take the tiles away two at a time, two that match and that are both free, until the layout is clear.",
    })}
    <link rel="icon" href="${ICON}" />
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="jarajara.css" />
  </head>
  <body>
    <main>
      ${familyHeader({ id, links: [{ href: "api.html", say: "pageApi" }] })}
${body}
      ${familyFooter({ id })}
    </main>
    <script>${FAMILY_SCRIPT}</script>
    <script type="module" src="page.js"></script>
  </body>
</html>
`;

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
for (const file of readdirSync("demo").filter((name) => /\.(css|js)$/.test(name))) cpSync(`demo/${file}`, `site/${file}`);
cpSync("dist", "site/dist", { recursive: true });
writeFileSync("site/index.html", page);
// The API reference, made from the source: every export of every entry point.
writeFileSync("site/api.css", API_CSS);
writeFileSync("site/api.html", apiPage({ id, name: "Jarajara", icon: ICON }));
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
