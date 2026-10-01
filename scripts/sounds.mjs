// Writes src/sounds.ts from the recordings in ./sounds, so a table can load them as one module
// with nothing for a bundler to configure. Run it after changing a recording: `pnpm sounds`.
// A test fails if the two fall out of step.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const files = readdirSync("sounds").filter((name) => name.endsWith(".m4a")).sort();
const entry = (name) => `  "${name.replace(".m4a", "")}":\n    "${readFileSync(`sounds/${name}`).toString("base64")}",`;
const lines = [
  "/**",
  " * The tile sounds, recorded: a tile picked up, set down, turned over, a pair knocked,",
  " * the tiles shuffled and a clatter for a win, as base64 AAC (.m4a). From Kenney's Casino Audio",
  " * pack, CC0; see docs/credits.md. Written by scripts/sounds.mjs from the files",
  " * in ./sounds, never by hand. `createTileSounds` loads this module only when",
  " * a sound is first played, so a page that stays silent never downloads it.",
  " */",
  "export const TILE_SOUND_DATA: Readonly<Record<TileSoundFile, string>> = {",
  ...files.map(entry),
  "};",
  "",
  "/** The name of one recording: its kind of sound and a number, such as `deal-2`. */",
  `export type TileSoundFile = ${files.map((name) => JSON.stringify(name.replace(".m4a", ""))).join(" | ")};`,
  "",
];
writeFileSync("src/sounds.ts", lines.join("\n"));
console.log(`src/sounds.ts: ${files.length} recordings, ${files.reduce((sum, name) => sum + readFileSync(`sounds/${name}`).length, 0)} bytes of audio.`);
