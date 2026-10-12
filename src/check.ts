import type { AwaseCheck } from "./types.ts";
import { isCleared } from "./board.ts";
import { dealFits, decodeMoves, playSolve } from "./moves.ts";

/**
 * Whether a solve clears a Mahjong deal: the check the browser makes to say
 * "cleared" and the server makes before it pays. It plays the moves on the
 * deal — every pair two free tiles that match, every shuffle made only when no
 * pair was left and drawn exactly as the rules draw it — and asks that the
 * layout ends empty. A few thousand steps at most, and no search.
 *
 * @param size - The native layout size identifier, measured in tiles across.
 * @param givens - The original face-code deal in native slot order.
 * @param answer - The native move record claiming to clear the deal.
 * @returns Whether a solve clears a Mahjong deal: the check the browser makes to say "cleared" and the server makes before it pays. It plays the moves on the deal — every pair two free tiles that match, every shuffle made only when no pair was left and drawn exactly as the rules draw it — and asks that the layout ends empty. A few thousand steps at most, and no search.
 * @example
 * ```ts
 * import { checkAwase, generateAwase } from "@johnmorrisdotca/jarajara/awase";
 *
 * const deal = generateAwase(4,"easy",2026);
 * console.log(checkAwase(4,deal.givens,deal.solution));
 * ```
 */
export function checkAwase(size: number, givens: string, answer: string): AwaseCheck {
  if (!dealFits(size, givens)) return { ok: false, reason: "the givens are not a deal of that layout" };
  const moves = decodeMoves(answer, givens.length);
  if (moves === null) return { ok: false, reason: "the answer is not a list of moves" };
  const played = playSolve(size, givens, moves);
  if (played === null) return { ok: false, reason: "a move the rules do not allow" };
  if (!isCleared(played.cells)) return { ok: false, reason: "tiles are left on the layout" };
  return { ok: true };
}
