/**
 * The vocabulary of Mahjong Solitaire: tiles on a stacked layout, taken off in
 * matching pairs of free tiles. See docs/plans/mahjong/README.md.
 */

/** The suits and honours of a mahjong set, and the two kinds of bonus tile.
 *
 * @example
 * ```ts
 * import type { MahjongSuit } from "@johnmorrisdotca/jarajara";
 *
 * const value: MahjongSuit = "characters";
 * console.log(value);
 * ```
 */
export type MahjongSuit = "characters" | "circles" | "bamboo" | "winds" | "dragons" | "flowers" | "seasons";

/** One face of the set: its suit and its rank within it (1–9 for a suit, 1–4 or 1–3 for the rest).
 *
 * @example
 * ```ts
 * import { faceOf } from "@johnmorrisdotca/jarajara";
 * import type { MahjongFace } from "@johnmorrisdotca/jarajara";
 *
 * const face = faceOf("a")!;
 * const value: MahjongFace = face;
 * console.log(value);
 * ```
 */
export type MahjongFace = { code: string; suit: MahjongSuit; rank: number };

/**
 * How a flower or a season matches. `group`, the usual rule: any flower takes
 * any flower and any season any season. `same`: only an identical tile, and
 * the deal holds bonus tiles in identical pairs.
 *
 * @example
 * ```ts
 * import type { MahjongBonusRule } from "@johnmorrisdotca/jarajara";
 *
 * const value: MahjongBonusRule = "group";
 * console.log(value);
 * ```
 */
export type MahjongBonusRule = "group" | "same";

/** A place in a layout: a tile's top-left corner in half-tile units across and down, and its layer.
 *
 * @example
 * ```ts
 * import type { MahjongSlot } from "@johnmorrisdotca/jarajara";
 *
 * const value: MahjongSlot = {x:0,y:0,z:0};
 * console.log(value);
 * ```
 */
export type MahjongSlot = { x: number; y: number; z: number };

/** A stacked layout: its slots in reading order (layer by layer, row by row), which is the order a deal is written in.
 *
 * @example
 * ```ts
 * import { layoutFor } from "@johnmorrisdotca/jarajara";
 * import type { MahjongLayout } from "@johnmorrisdotca/jarajara";
 *
 * const layout = layoutFor(4)!;
 * const value: MahjongLayout = layout;
 * console.log(value);
 * ```
 */
export type MahjongLayout = {
  /** The layout's width in tiles: its "size", unique among the layouts. */
  size: number;
  key: string;
  slots: readonly MahjongSlot[];
};

/**
 * What stands on and beside each slot, worked out once per layout: the slots
 * over it (any higher layer overlapping it), and the slots touching its left
 * and right sides on its own layer.
 *
 * @example
 * ```ts
 * import { geometryOf, layoutFor } from "@johnmorrisdotca/jarajara";
 * import type { MahjongGeometry } from "@johnmorrisdotca/jarajara";
 *
 * const layout = layoutFor(4)!;
 * const geometry = geometryOf(layout);
 * const value: MahjongGeometry = geometry;
 * console.log(value);
 * ```
 */
export type MahjongGeometry = {
  layout: MahjongLayout;
  above: readonly (readonly number[])[];
  left: readonly (readonly number[])[];
  right: readonly (readonly number[])[];
};

/**
 * The tiles as they lie: a face code for each slot of the layout, "." where
 * the tile has been taken. The same string the givens are written as.
 *
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import type { MahjongCells } from "@johnmorrisdotca/jarajara";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const cells = deal.givens;
 * const value: MahjongCells = cells;
 * console.log(value);
 * ```
 */
export type MahjongCells = string;

/** One move of a solve: a pair taken, by its two slots, or a shuffle of what is left.
 *
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import { freePairs, geometryOf, layoutFor } from "@johnmorrisdotca/jarajara";
 * import type { MahjongMove } from "@johnmorrisdotca/jarajara";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const layout = layoutFor(4)!;
 * const geometry = geometryOf(layout);
 * const cells = deal.givens;
 * const pair = freePairs(geometry,cells,"group")[0];
 * const value: MahjongMove = {pair};
 * console.log(value);
 * ```
 */
export type MahjongMove = { pair: readonly [number, number] } | { shuffle: true };

/** How hard a deal of Awase is: the easiest of a seed's candidate deals to clear, the middle one, or the hardest.
 *
 * @example
 * ```ts
 * import type { AwaseLevel } from "@johnmorrisdotca/jarajara/awase";
 *
 * const value: AwaseLevel = "easy";
 * console.log(value);
 * ```
 */
export type AwaseLevel = "easy" | "medium" | "hard";

/** A deal of Awase: its layout's size, its level and seed, the tiles where they lie, and one way to clear them.
 *
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import type { AwaseDeal } from "@johnmorrisdotca/jarajara/awase";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const value: AwaseDeal = deal;
 * console.log(value);
 * ```
 */
export type AwaseDeal = { size: number; level: AwaseLevel; seed: number; givens: string; solution: string };

/** What a check of a finished game says: cleared, or the first reason it is not.
 *
 * @example
 * ```ts
 * import { checkAwase, generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import type { AwaseCheck } from "@johnmorrisdotca/jarajara/awase";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const value: AwaseCheck = checkAwase(4,deal.givens,deal.solution);
 * console.log(value);
 * ```
 */
export type AwaseCheck = { ok: true } | { ok: false; reason: string };
