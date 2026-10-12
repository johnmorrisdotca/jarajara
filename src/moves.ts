import { canTake, freePairs, geometryOf } from "./board.ts";
import { shuffleTiles } from "./deal.ts";
import { layoutFor } from "./layouts.ts";
import type { MahjongBonusRule, MahjongCells, MahjongMove } from "./types.ts";
import { EMPTY_SLOT, bonusRuleOf, isFaceCode } from "./tiles.ts";

/**
 * A SOLVE AS IT IS WRITTEN: every move in order, a pair as its two slots in
 * two base-36 characters each ("0a1c"), a shuffle as "*". The answer handed in
 * and the run kept half way are both this, so a run opened again replays to
 * exactly where it was left, and the server checks a solve by playing it.
 *
 * @example
 * ```ts
 * import { SHUFFLE_MARK } from "@johnmorrisdotca/jarajara";
 * console.log(SHUFFLE_MARK);
 * ```
 */
export const SHUFFLE_MARK = "*";

const SLOT_CHARS = 2;

function slotText(slot: number): string {
  return slot.toString(36).padStart(SLOT_CHARS, "0");
}

/** Write pair takes and shuffles as the native compact move record.
 *
 * @param moves - The native pair and shuffle moves in chronological order.
 * @returns Write pair takes and shuffles as the native compact move record.
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import { encodeMoves, freePairs, geometryOf, layoutFor } from "@johnmorrisdotca/jarajara";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const layout = layoutFor(4)!;
 * const geometry = geometryOf(layout);
 * const cells = deal.givens;
 * const pair = freePairs(geometry,cells,"group")[0];
 * console.log(encodeMoves([{pair}]));
 * ```
 */
export function encodeMoves(moves: readonly MahjongMove[]): string {
  return moves.map((move) => ("shuffle" in move ? SHUFFLE_MARK : `${slotText(move.pair[0])}${slotText(move.pair[1])}`)).join("");
}

/** The moves a string holds, each slot below `slots`; null for anything else.
 *
 * @param text - The unknown text or encoded record to interpret.
 * @param slots - The slot-count bound for decoding a move record.
 * @returns The moves a string holds, each slot below `slots`; null for anything else.
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import { decodeMoves, encodeMoves, freePairs, geometryOf, layoutFor } from "@johnmorrisdotca/jarajara";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const layout = layoutFor(4)!;
 * const geometry = geometryOf(layout);
 * const cells = deal.givens;
 * const pair = freePairs(geometry,cells,"group")[0];
 * console.log(decodeMoves(encodeMoves([{pair}]),cells.length));
 * ```
 */
export function decodeMoves(text: string, slots: number): MahjongMove[] | null {
  if (typeof text !== "string") return null;
  const moves: MahjongMove[] = [];
  let at = 0;
  while (at < text.length) {
    if (text[at] === SHUFFLE_MARK) {
      moves.push({ shuffle: true });
      at += 1;
      continue;
    }
    const chunk = text.slice(at, at + SLOT_CHARS * 2);
    if (!/^[0-9a-z]{4}$/.test(chunk)) return null;
    const a = parseInt(chunk.slice(0, SLOT_CHARS), 36);
    const b = parseInt(chunk.slice(SLOT_CHARS), 36);
    if (a >= slots || b >= slots || a === b) return null;
    moves.push({ pair: [a, b] });
    at += SLOT_CHARS * 2;
  }
  return moves;
}

/** Whether a deal is written right for a layout: one face a slot, nothing empty.
 *
 * @param size - The native layout size identifier, measured in tiles across.
 * @param givens - The original face-code deal in native slot order.
 * @returns Whether a deal is written right for a layout: one face a slot, nothing empty.
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import { dealFits } from "@johnmorrisdotca/jarajara";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const cells = deal.givens;
 * console.log(dealFits(4,cells));
 * ```
 */
export function dealFits(size: number, givens: string): boolean {
  const layout = layoutFor(size);
  return layout !== null && typeof givens === "string" && givens.length === layout.slots.length && [...givens].every(isFaceCode);
}

/** Where a solve stands after its moves: the tiles, and how many shuffles it has had.
 *
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import { freePairs, geometryOf, layoutFor, playSolve } from "@johnmorrisdotca/jarajara";
 * import type { Replayed } from "@johnmorrisdotca/jarajara";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const layout = layoutFor(4)!;
 * const geometry = geometryOf(layout);
 * const cells = deal.givens;
 * const pair = freePairs(geometry,cells,"group")[0];
 * const value: Replayed = playSolve(4,cells,[{pair}],"group")!;
 * console.log(value);
 * ```
 */
export type Replayed = { cells: MahjongCells; shuffles: number };

/**
 * PLAY THE MOVES ON THE DEAL, refusing the first that the rules do not allow:
 * a pair that is not two free tiles that match, or a shuffle while a pair
 * could still be taken (Shuffle is for when you are stuck), or one that
 * cannot help. Null for a deal or a move that does not read.
 *
 * @param size - The native layout size identifier, measured in tiles across.
 * @param givens - The original face-code deal in native slot order.
 * @param moves - The native pair and shuffle moves in chronological order.
 * @param rule - Grouped or identical bonus matching.
 * @returns PLAY THE MOVES ON THE DEAL, refusing the first that the rules do not allow: a pair that is not two free tiles that match, or a shuffle while a pair could still be taken (Shuffle is for when you are stuck), or one that cannot help. null for a deal or a move that does not read.
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import { freePairs, geometryOf, layoutFor, playSolve } from "@johnmorrisdotca/jarajara";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const layout = layoutFor(4)!;
 * const geometry = geometryOf(layout);
 * const cells = deal.givens;
 * const pair = freePairs(geometry,cells,"group")[0];
 * console.log(playSolve(4,cells,[{pair}],"group")?.cells);
 * ```
 */
export function playSolve(size: number, givens: string, moves: readonly MahjongMove[], rule: MahjongBonusRule = bonusRuleOf(givens)): Replayed | null {
  const layout = layoutFor(size);
  if (layout === null || !dealFits(size, givens)) return null;
  const geometry = geometryOf(layout);
  let cells = givens;
  let shuffles = 0;
  for (const move of moves) {
    if ("shuffle" in move) {
      if (freePairs(geometry, cells, rule).length > 0) return null;
      const next = shuffleTiles(geometry, cells, rule, shuffles);
      if (next === null) return null;
      cells = next;
      shuffles += 1;
      continue;
    }
    const [a, b] = move.pair;
    if (!canTake(geometry, cells, rule, a, b)) return null;
    const next = [...cells];
    next[a] = EMPTY_SLOT;
    next[b] = EMPTY_SLOT;
    cells = next.join("");
  }
  return { cells, shuffles };
}
