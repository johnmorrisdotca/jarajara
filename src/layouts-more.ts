import type { MahjongLayout, MahjongSlot } from "./types.ts";

/**
 * MORE LAYOUTS, JARAJARA'S OWN. A shape is an idea anyone may draw (a pyramid, a bridge, a butterfly), so each of these
 * is drawn here from scratch, tile by tile, in the same slot format as the five of `layouts.ts`, and none is a copy of any
 * other game's layout. They are separate from `MAHJONG_LAYOUTS` on purpose: that list is what itsutsu.com's kept games
 * were made on and never changes, and a new layout is a new size, never an old one made different.
 *
 * Each is drawn as grids, one per layer, a character a tile: `X` is a tile and anything else is empty. A layer may be
 * shifted by half a tile across and down (`dx`, `dy`, in half tiles), so a tile can lie half over the two below it. A
 * layout's `size` is its width in tiles (the width of the widest layer plus its shift), which is how it is named.
 */

/** One layer of a layout as a grid of tiles: a row a string, a column a tile, shifted by `dx` and `dy` half tiles. */
function layer(z: number, rows: readonly string[], dx = 0, dy = 0): MahjongSlot[] {
  const slots: MahjongSlot[] = [];
  rows.forEach((row, y) => [...row].forEach((mark, x) => mark === "X" && slots.push({ x: x * 2 + dx, y: y * 2 + dy, z })));
  return slots;
}

/** The slots in the order a deal is written in: layer by layer, row by row, across. */
function inOrder(slots: MahjongSlot[]): MahjongSlot[] {
  return [...slots].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
}

/** Make a layout from its layers, sized by its own width. */
function made(key: string, size: number, layers: MahjongSlot[][]): MahjongLayout {
  return { size, key, slots: inOrder(layers.flat()) };
}

/**
 * PAGODA 塔, eleven across: a tower of tiered roofs, each wider than the one above it, with a spire of stacked tiles up
 * its middle.
 */
const PAGODA = made("pagoda", 11, [
  layer(0, [
    ".....X.....",
    "...XXXXX...",
    ".....X.....",
    "..XXXXXXX..",
    "....XXX....",
    ".XXXXXXXXX.",
    "...XXXXX...",
    "XXXXXXXXXXX",
    "..XXXXXXX..",
    "XXXXXXXXXXX",
  ]),
  layer(1, [
    ".....X.....",
    "....XXX....",
    ".....X.....",
    "...XXXXX...",
    ".....X.....",
    "..XXXXXXX..",
    ".....X.....",
    "...XXXXX...",
  ], 0, 0),
  layer(2, [
    ".....X.....",
    "....XXX....",
    ".....X.....",
    "....XXX....",
  ], 0, 0),
  layer(3, [
    ".....X.....",
    ".....X.....",
  ], 0, 0),
]);

/**
 * FORTRESS 砦, twelve across: a wall round a courtyard with a gate in it, a tower at each corner and a keep in the
 * middle.
 */
const FORTRESS = made("fortress", 12, [
  layer(0, [
    "XXXXXXXXXXXX",
    "XXXXXXXXXXXX",
    "XX........XX",
    "XX..XXXX..XX",
    "XX..XXXX..XX",
    "XX..XXXX..XX",
    "XX........XX",
    "XXXXX..XXXXX",
    "XXXXX..XXXXX",
  ]),
  layer(1, [
    "XX........XX",
    "XX........XX",
    "............",
    "....XXXX....",
    "....XXXX....",
    "....XXXX....",
    "............",
    "XX........XX",
    "XX........XX",
  ]),
  layer(2, [
    "XX........XX",
    "............",
    "............",
    ".....XX.....",
    ".....XX.....",
    "............",
    "............",
    "XX........XX",
  ]),
]);

/**
 * PYRAMID 角錐, thirteen across: five terraces, each a half tile in from the one below, rising to a point.
 */
const PYRAMID = made("pyramid", 13, [
  layer(0, [
    "XXXXXXXXXXXXX",
    "XXXXXXXXXXXXX",
    "XXXXXXXXXXXXX",
    "XXXXXXXXXXXXX",
    "XXXXXXXXXXXXX",
    "XXXXXXXXXXXXX",
  ]),
  layer(1, [
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
  ], 2, 2),
  layer(2, [
    "XXXXXXXXX",
    "XXXXXXXXX",
  ], 4, 4),
  layer(3, ["XX"], 11, 5),
]);

/**
 * BRIDGE 橋, fourteen across: a long deck on three piers, with an arch rising in steps over its middle to a crown.
 */
const BRIDGE = made("bridge", 14, [
  layer(0, [
    "..XX......XX..",
    "XXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXX",
    "..XX..XX..XX..",
    "..XX..XX..XX..",
  ]),
  layer(1, [
    "..............",
    "XXXXXXXXXXXXXX",
    "..XXXXXXXXXX..",
  ]),
  layer(2, [
    "..............",
    "....XXXXXX....",
    "....XXXXXX....",
  ]),
  layer(3, [
    "..............",
    "......XX......",
    "......XX......",
  ]),
]);

/**
 * BUTTERFLY 蝶, sixteen across: two wings, each a large upper one and a smaller lower one, round a slender body with
 * a pair of feelers.
 */
const BUTTERFLY = made("butterfly", 16, [
  layer(0, [
    "X..............X",
    ".X............X.",
    ".XXX........XXX.",
    "XXXXXX....XXXXXX",
    "XXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXX",
    ".XXXXX....XXXXX.",
    "..XXX......XXX..",
    "..XX........XX..",
  ]),
  layer(1, [
    "................",
    "................",
    "................",
    "..XXXX....XXXX..",
    "...XXXXXXXXXX...",
    "...XXXXXXXXXX...",
    "................",
  ]),
  layer(2, [
    "................",
    "................",
    "................",
    "................",
    "......XXXX......",
    "......XXXX......",
  ]),
  layer(3, [
    "................",
    "................",
    "................",
    "................",
    ".......XX.......",
  ]),
]);

/**
 * DRAGON 龍, seventeen across: a long body on four short legs, its back ridged in three steps, a tail that curls up at one
 * end and a head with two horns raised at the other.
 */
const DRAGON = made("dragon", 17, [
  layer(0, [
    "..............X.X",
    ".X............XXX",
    ".XX.........XXXXX",
    "XXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXX",
    "..XX..XX..XX..XX.",
    "..XX..XX..XX..XX.",
  ]),
  layer(1, [
    ".................",
    "..............XXX",
    "..............XXX",
    "...XXXXXXXXXXX...",
    "...XXXXXXXXXXX...",
    "...XXXXXXXXXXX...",
  ]),
  layer(2, [
    ".................",
    ".................",
    ".................",
    ".....XXXXXXX.....",
    ".....XXXXXXX.....",
    ".....XXXXXXX.....",
  ]),
  layer(3, [
    ".................",
    ".................",
    ".................",
    ".................",
    ".......XX........",
  ]),
]);

export const MORE_LAYOUTS: readonly MahjongLayout[] = [PAGODA, FORTRESS, PYRAMID, BRIDGE, BUTTERFLY, DRAGON];
