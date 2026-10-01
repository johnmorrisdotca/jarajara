// Writes src/designs/riichi.ts and src/designs/riichi-black.ts, the two riichi designs, from FluffyStuff's riichi
// mahjong tiles (public domain, CC0: see docs/credits.md). Run by hand, once:
//
//   node scripts/designs-riichi.mjs <a checkout of github.com/FluffyStuff/riichi-mahjong-tiles>
//
// The checkout holds Regular/ and Black/, each with every face as its own 300 by 400 .svg, the tile's plate
// (Front.svg) and its back (Back.svg). Each drawing is made smaller with svgo, its size taken off, and its ids
// given a prefix of its own, so any number may be in one page. The faces go in as they are, the plate and back
// beside them, and the red fives (Man5-Dora.svg and the like) as `red`. Nothing here runs in CI or is published.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { optimize } from "svgo";

const from = process.argv[2];
if (from === undefined) {
  console.error("Usage: node scripts/designs-riichi.mjs <a checkout of FluffyStuff/riichi-mahjong-tiles>");
  process.exit(2);
}

/** Jarajara's face letters: a–i characters (Man), j–r circles (Pin), s–A bamboo (Sou), B–E winds, F–H dragons. */
const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP";
const FILES = {};
for (const [prefix, start] of [["Man", 0], ["Pin", 9], ["Sou", 18]]) for (let rank = 1; rank <= 9; rank += 1) FILES[LETTERS[start + rank - 1]] = `${prefix}${rank}`;
Object.assign(FILES, { B: "Ton", C: "Nan", D: "Shaa", E: "Pei", F: "Chun", G: "Hatsu", H: "Haku" });
const RED = { e: "Man5-Dora", n: "Pin5-Dora", w: "Sou5-Dora" };

const small = (svg, id) =>
  optimize(svg, {
    multipass: true,
    floatPrecision: 1,
    plugins: [{ name: "preset-default", params: { overrides: { cleanupIds: { minify: true } } } }, "convertStyleToAttrs", "removeDimensions", { name: "prefixIds", params: { prefix: id, delim: "-" } }],
  }).data;
const inside = (svg) => svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"));

const STYLES = [
  { folder: "Regular", file: "riichi", name: "riichi", constant: "RIICHI", words: "regular", colours: { face: "#f3efe9", rim: "#c8c1b4", side: "#d8d1c3", sideEdge: "#a39a89" }, plate: "" },
  { folder: "Black", file: "riichi-black", name: "riichi-black", constant: "RIICHI_BLACK", words: "black", colours: { face: "#1c1c1c", rim: "#000000", side: "#2a2a2a", sideEdge: "#000000" }, plate: `<rect x="1.4" y="1.6" width="27.2" height="36.8" rx="2.4" fill="#f3efe9"/>` },
];

mkdirSync("src/designs", { recursive: true });
for (const style of STYLES) {
  const read = (name) => inside(small(readFileSync(join(from, style.folder, `${name}.svg`), "utf8"), `r${style.words[0]}${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`));
  const faces = Object.fromEntries(Object.entries(FILES).map(([code, name]) => [code, read(name)]));
  const red = Object.fromEntries(Object.entries(RED).map(([code, name]) => [code, read(name)]));
  const body = read("Front");
  const back = read("Back");
  const size = [body, back, ...Object.values(faces), ...Object.values(red)].reduce((sum, one) => sum + one.length, 0);
  writeFileSync(
    `src/designs/${style.file}.ts`,
    [
      "/**",
      ` * The ${style.words} riichi design: FluffyStuff's riichi mahjong tiles (public domain, CC0; see docs/credits.md), the 34`,
      " * faces of a riichi set with the tile's own plate and back and the red fives. It draws no flowers or seasons, so those",
      " * are Jarajara's own within it. Written by scripts/designs-riichi.mjs, never by hand. It is its own entry",
      " * (and fetched by an element only when asked for), because it is about 100 kB of drawings.",
      " *",
      " * ```ts",
      ` * import { ${style.constant} } from "@johnmorrisdotca/jarajara/designs/${style.file}";`,
      " * import { tileSvg } from \"@johnmorrisdotca/jarajara/faces\";",
      " *",
      ` * tileSvg("F", { design: ${style.constant} });`,
      " * ```",
      " */",
      'import type { TileDesign } from "../design.types.ts";',
      "",
      `/** The ${style.words} riichi tiles, drawn in a box 300 by 400. */`,
      `export const ${style.constant}: TileDesign = {`,
      `  name: ${JSON.stringify(style.name)},`,
      "  box: [300, 400],",
      `  body: ${JSON.stringify(body)},`,
      `  back: ${JSON.stringify(back)},`,
      `  faces: ${JSON.stringify(faces, null, 2).replace(/\n/g, "\n  ")},`,
      `  red: ${JSON.stringify(red, null, 2).replace(/\n/g, "\n  ")},`,
      `  colours: ${JSON.stringify(style.colours)},`,
      ...(style.plate === "" ? [] : [`  plate: ${JSON.stringify(style.plate)},`]),
      "};",
      "",
    ].join("\n"),
  );
  console.log(`src/designs/${style.file}.ts: ${Object.keys(faces).length} faces, ${Object.keys(red).length} red fives, ${size} bytes of drawings`);
}
