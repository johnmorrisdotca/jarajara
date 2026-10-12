import type { AwaseLevel } from "./types.ts";

/**
 * MAHJONG FOR A TABLE: two to four people (or computers) taking turns on one
 * shared layout. See `table.ts` for the rules and docs/plans/mahjong/README.md
 * for why these.
 */

/** Who sits in a seat: a name typed on the device, or a computer.
 *
 * @example
 * ```ts
 * import type { AwaseSeat } from "@johnmorrisdotca/jarajara/table";
 *
 * const value: AwaseSeat = {name:"Seat 1",computer:true};
 * console.log(value);
 * ```
 */
export type AwaseSeat = { name: string; computer?: true };

/**
 * A GAME AT THE TABLE, as it is kept: the deal, who sits where, and every pair
 * taken, in order. Everything else — whose turn it is, the scores, the
 * shuffles, the end — is read again from these by `readTable`, so a game read
 * back out of storage is exactly the game its pairs make, or none.
 *
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import { startTable } from "@johnmorrisdotca/jarajara/table";
 * import type { AwaseTable } from "@johnmorrisdotca/jarajara/table";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const table = startTable(deal,[{name:"Seat 1"},{name:"Seat 2"}]);
 * const value: AwaseTable = table;
 * console.log(value);
 * ```
 */
export type AwaseTable = {
  size: number;
  level: AwaseLevel;
  seed: number;
  /** The deal, as the solo game writes it: a face a slot (`tiles.ts`). */
  givens: string;
  seats: readonly AwaseSeat[];
  /** Every pair taken, by its two slots, in the order they were taken. */
  takes: readonly (readonly [number, number])[];
};

/** One pair taken, as the table remembers it.
 *
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import { freePairs, geometryOf, layoutFor, pairGoesAgain, pairPoints } from "@johnmorrisdotca/jarajara";
 * import type { AwaseTake } from "@johnmorrisdotca/jarajara/table";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const layout = layoutFor(4)!;
 * const geometry = geometryOf(layout);
 * const cells = deal.givens;
 * const pair = freePairs(geometry,cells,"group")[0];
 * const value: AwaseTake = {seat:0,pair,codes:[cells[pair[0]],cells[pair[1]]],points:pairPoints(cells[pair[0]]),again:pairGoesAgain(cells[pair[0]])};
 * console.log(value);
 * ```
 */
export type AwaseTake = { seat: number; pair: readonly [number, number]; codes: readonly [string, string]; points: number; again: boolean };

/** Where a game at the table stands, read from its pairs.
 *
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import { readTable, startTable } from "@johnmorrisdotca/jarajara/table";
 * import type { AwaseTableState } from "@johnmorrisdotca/jarajara/table";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const table = startTable(deal,[{name:"Seat 1"},{name:"Seat 2"}]);
 * const state = readTable(table)!;
 * const value: AwaseTableState = state;
 * console.log(value);
 * ```
 */
export type AwaseTableState = {
  /** The tiles as they lie now. */
  cells: string;
  /** The seat to move; meaningless once `over`. */
  turn: number;
  /** Points, and pairs taken, seat by seat. */
  scores: number[];
  pairs: number[];
  taken: AwaseTake[];
  /** How many times the table ran out of pairs and the tiles were shuffled; and after which take the last was. */
  shuffles: number;
  shuffledAfter: number | null;
  /** Over: every tile taken, or the tiles left could not be freed by any shuffle. */
  over: boolean;
  /** The seats with the most points, once it is over: one, or several sharing it. */
  winners: number[];
};
