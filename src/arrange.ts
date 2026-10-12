import { seededRandom, shuffled } from "./random.ts";
import { faceOf, MAHJONG_FACES } from "./tiles.ts";
import type { MahjongLayout, MahjongSuit } from "./types.ts";

/**
 * THE THINGS DONE WITH TILES IN FRONT OF YOU, as plain functions over lists of codes: sorting them, grouping them
 * by suit or kind, mixing them, and putting the slots of a layout in order by where they are (x, y, z). The rack
 * element is these drawn; a page that draws its own uses them as they are.
 */

/** How a hand is put in order: as dealt, by suit then rank, by rank across the suits, by kind, or by the letters.
 *
 * @example
 * ```ts
 * import type { TileOrder } from "@johnmorrisdotca/jarajara";
 *
 * const value: TileOrder = "suit";
 * console.log(value);
 * ```
 */
export type TileOrder = "dealt" | "suit" | "rank" | "kind" | "code";

/** The orders, in the order a list offers them.
 *
 * @example
 * ```ts
 * import { TILE_ORDERS } from "@johnmorrisdotca/jarajara";
 * console.log(TILE_ORDERS);
 * ```
 */
export const TILE_ORDERS: readonly TileOrder[] = ["dealt", "suit", "rank", "kind", "code"];

/** How tiles are grouped, with a gap between groups: by suit (circles with circles), or by kind (numbers, honours, bonus tiles).
 *
 * @example
 * ```ts
 * import type { TileGrouping } from "@johnmorrisdotca/jarajara";
 *
 * const value: TileGrouping = "kind";
 * console.log(value);
 * ```
 */
export type TileGrouping = "suit" | "kind";

const SUIT_AT = new Map<MahjongSuit, number>(["characters", "circles", "bamboo", "winds", "dragons", "flowers", "seasons"].map((suit, at) => [suit as MahjongSuit, at]));
const FACE_AT = new Map(MAHJONG_FACES.map((face, at) => [face.code, at]));
const NUMBER_SUITS = new Set<MahjongSuit>(["characters", "circles", "bamboo"]);

/** The kind of a tile: `0` numbers (characters, circles, bamboo), `1` honours (winds, dragons), `2` bonus tiles (flowers, seasons); 3 for a letter that is none.
 *
 * @param code - The one-character face code or tile identifier.
 * @returns The kind of a tile: `0` numbers (characters, circles, bamboo), `1` honours (winds, dragons), `2` bonus tiles (flowers, seasons); 3 for a letter that is none.
 * @example
 * ```ts
 * import { kindOf } from "@johnmorrisdotca/jarajara";
 *
 * console.log(kindOf("a"));
 * ```
 */
export function kindOf(code: string): number {
  const suit = faceOf(code)?.suit;
  if (suit === undefined) return 3;
  return NUMBER_SUITS.has(suit) ? 0 : suit === "winds" || suit === "dragons" ? 1 : 2;
}

/** The suit's place in the set's order, or 99 for a letter that is no tile. */
const suitAt = (code: string): number => SUIT_AT.get(faceOf(code)?.suit as MahjongSuit) ?? 99;

/**
 * The places the tiles take in an order, as the numbers of the tiles in the order they come: `[2, 0, 1]` has the third
 * tile first. Every sort is stable, so equal tiles stay as they were. `suit` is the set's own order (characters,
 * circles, bamboo, winds, dragons, flowers, seasons, each by rank); `rank` puts every one together, then every two,
 * and so on, within each rank by suit, the honours after; `kind` groups numbers, honours and bonus tiles and puts each
 * in suit order; `code` is the letters' own order; `dealt` is the list as it was.
 *
 * @param codes - The tile face codes in current order.
 * @param order - The native tile sorting mode.
 * @returns The places the tiles take in an order, as the numbers of the tiles in the order they come: `[2, 0, 1]` has the third tile first. Every sort is stable, so equal tiles stay as they were. `suit` is the set's own order (characters, circles, bamboo, winds, dragons, flowers, seasons, each by rank); `rank` puts every one together, then every two, and so on, within each rank by suit, the honours after; `kind` groups numbers, honours and bonus tiles and puts each in suit order; `code` is the letters' own order; `dealt` is the list as it was.
 * @example
 * ```ts
 * import { arrangeIndexes } from "@johnmorrisdotca/jarajara";
 *
 * console.log(arrangeIndexes(["F","a","b"],"suit"));
 * ```
 */
export function arrangeIndexes(codes: readonly string[], order: TileOrder = "suit"): number[] {
  const indexes = codes.map((_, at) => at);
  if (order === "dealt") return indexes;
  const key = (code: string): number[] => {
    switch (order) {
      case "suit":
        return [FACE_AT.get(code) ?? 99];
      case "rank": {
        const face = faceOf(code);
        return face === null ? [99, 99, 99] : [kindOf(code) === 0 ? face.rank : 10 + kindOf(code), suitAt(code), face.rank];
      }
      case "kind":
        return [kindOf(code), FACE_AT.get(code) ?? 99];
      default:
        return [code.charCodeAt(0)];
    }
  };
  return indexes.sort((a, b) => {
    const left = key(codes[a]!);
    const right = key(codes[b]!);
    for (let i = 0; i < left.length; i += 1) if (left[i] !== right[i]) return left[i]! - right[i]!;
    return a - b;
  });
}

/** The tiles in an order, as a new list; see `arrangeIndexes` for what each order is.
 *
 * @param codes - The tile face codes in current order.
 * @param order - The native tile sorting mode.
 * @returns The tiles in an order, as a new list; see `arrangeIndexes` for what each order is.
 * @example
 * ```ts
 * import { arrangeTiles } from "@johnmorrisdotca/jarajara";
 *
 * console.log(arrangeTiles(["F","a","b"],"suit"));
 * ```
 */
export function arrangeTiles(codes: readonly string[], order: TileOrder = "suit"): string[] {
  return arrangeIndexes(codes, order).map((at) => codes[at]!);
}

/** The groups' key for a tile: its suit's place, or its kind. */
const groupKey = (code: string, by: TileGrouping): number => (by === "kind" ? kindOf(code) : suitAt(code));

/** The places in a list, already in order, where a new group starts: every place whose tile is of another suit (or kind) than the one before it.
 *
 * @param codes - The tile face codes in current order.
 * @param by - The native grouping mode.
 * @returns The places in a list, already in order, where a new group starts: every place whose tile is of another suit (or kind) than the one before it.
 * @example
 * ```ts
 * import { groupStarts } from "@johnmorrisdotca/jarajara";
 *
 * console.log(groupStarts(["a","b","F"],"suit"));
 * ```
 */
export function groupStarts(codes: readonly string[], by: TileGrouping = "suit"): number[] {
  const starts: number[] = [];
  for (let at = 1; at < codes.length; at += 1) if (groupKey(codes[at]!, by) !== groupKey(codes[at - 1]!, by)) starts.push(at);
  return starts;
}

/** The tiles split into the runs a gap is drawn between: by suit or by kind, each run in the set's order.
 *
 * @param codes - The tile face codes in current order.
 * @param by - The native grouping mode.
 * @returns The tiles split into the runs a gap is drawn between: by suit or by kind, each run in the set's order.
 * @example
 * ```ts
 * import { groupTiles } from "@johnmorrisdotca/jarajara";
 *
 * console.log(groupTiles(["a","b","F"],"suit"));
 * ```
 */
export function groupTiles(codes: readonly string[], by: TileGrouping = "suit"): string[][] {
  const sorted = arrangeTiles(codes, by === "kind" ? "kind" : "suit");
  const cuts = [0, ...groupStarts(sorted, by), sorted.length];
  return cuts.slice(0, -1).map((from, at) => sorted.slice(from, cuts[at + 1]));
}

/** The same tiles in another order, at random, or the same order for the same `seed`; never the order they were in unless there is only one to be in.
 *
 * @param codes - The tile face codes in current order.
 * @param seed - The numeric seed used to reproduce the deal or its matching rule.
 * @returns The same tiles in another order, at random, or the same order for the same `seed`; never the order they were in unless there is only one to be in.
 * @example
 * ```ts
 * import { mixTiles } from "@johnmorrisdotca/jarajara";
 *
 * console.log(mixTiles(["a","b","c"],42));
 * ```
 */
export function mixTiles(codes: readonly string[], seed?: number): string[] {
  if (new Set(codes).size < 2) return [...codes];
  const random = seed === undefined ? Math.random : seededRandom(seed);
  for (let tries = 0; tries < 20; tries += 1) {
    const mixed = shuffled(codes, random);
    if (mixed.join("") !== codes.join("")) return mixed;
  }
  return [...codes].reverse();
}

/** What a layout's slots are put in order by: where a tile is across (x), down (y), and how high (z).
 *
 * @example
 * ```ts
 * import type { SlotAxis } from "@johnmorrisdotca/jarajara";
 *
 * const value: SlotAxis = "z";
 * console.log(value);
 * ```
 */
export type SlotAxis = "x" | "y" | "z";

/** One key of a sort: an axis, and `-` before it for the other way round (`-z`, the highest first).
 *
 * @example
 * ```ts
 * import type { SlotSortKey } from "@johnmorrisdotca/jarajara";
 *
 * const value: SlotSortKey = "-y";
 * console.log(value);
 * ```
 */
export type SlotSortKey = SlotAxis | `-${SlotAxis}`;

/** The keys a text names, `"z y x"`, `"x,-z"`, in order; anything that is no axis is dropped.
 *
 * @param text - The unknown text or encoded record to interpret.
 * @returns The keys a text names, `"z y x"`, `"x,-z"`, in order; anything that is no axis is dropped.
 * @example
 * ```ts
 * import { readSlotKeys } from "@johnmorrisdotca/jarajara";
 *
 * console.log(readSlotKeys("z,y,x"));
 * ```
 */
export function readSlotKeys(text: string | null | undefined): SlotSortKey[] {
  if (typeof text !== "string") return [];
  return text
    .toLowerCase()
    .split(/[\s,>]+/)
    .filter((word): word is SlotSortKey => /^-?[xyz]$/.test(word));
}

/**
 * The slots of a layout, as their numbers, put in order by the keys: `["z", "y", "x"]` is layer by layer, row by row,
 * across (the layout's own order), `["x"]` lines them up from the left, `["-z"]` has the top of the stacks first. Slots
 * equal in every key keep their own order, and a key left out is settled last, in the order x, y, z, so the result is
 * the same whatever the keys.
 *
 * @param layout - The native stacked tile positions.
 * @param keys - The native slot axes and sort directions.
 * @returns The slots of a layout, as their numbers, put in order by the keys: `["z", "y", "x"]` is layer by layer, row by row, across (the layout's own order), `["x"]` lines them up from the left, `["-z"]` has the top of the stacks first. Slots equal in every key keep their own order, and a key left out is settled last, in the order x, y, z, so the result is the same whatever the keys.
 * @example
 * ```ts
 * import { layoutFor, sortSlots } from "@johnmorrisdotca/jarajara";
 *
 * const layout = layoutFor(4)!;
 * console.log(sortSlots(layout,["z","y","x"]));
 * ```
 */
export function sortSlots(layout: MahjongLayout, keys: readonly SlotSortKey[] = ["z", "y", "x"]): number[] {
  const value = (index: number, key: SlotSortKey): number => {
    const slot = layout.slots[index]!;
    const sign = key.startsWith("-") ? -1 : 1;
    return sign * slot[key.replace("-", "") as SlotAxis];
  };
  return layout.slots
    .map((_, index) => index)
    .sort((a, b) => {
      for (const key of keys) {
        const diff = value(a, key) - value(b, key);
        if (diff !== 0) return diff;
      }
      return a - b;
    });
}

/** Where a slot is, in tiles: across and down from the layout's corner (halves where a tile sits between two), and which layer, from 1.
 *
 * @param layout - The native stacked tile positions.
 * @param index - The shuffle count or slot index specified by the signature.
 * @returns The slot’s tile coordinates and one-based layer, or null for an out-of-range slot index.
 * @example
 * ```ts
 * import { describeSlot, layoutFor } from "@johnmorrisdotca/jarajara";
 *
 * const layout = layoutFor(4)!;
 * console.log(describeSlot(layout,0));
 * ```
 */
export function describeSlot(layout: MahjongLayout, index: number): { x: number; y: number; z: number } | null {
  const slot = layout.slots[index];
  return slot === undefined ? null : { x: slot.x / 2, y: slot.y / 2, z: slot.z + 1 };
}
