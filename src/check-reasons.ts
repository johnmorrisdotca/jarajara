import type { AwaseCheck } from "./types.ts";

/**
 * Why `checkAwase` will not take a solve, as a stable code and the English sentence it says. None of them has a gap
 * to fill, so a site says each code in its own words and needs nothing more.
 *
 * | Code | Said when |
 * | --- | --- |
 * | `givens-not-deal` | the tiles are not a deal of that layout |
 * | `answer-not-moves` | the answer cannot be read as a list of moves |
 * | `move-not-allowed` | a move breaks the rules (a pair that does not match or is not free, or a shuffle made while a pair was left) |
 * | `tiles-left` | every move was allowed and the layout is not clear |
 *
 * @example
 * ```ts
 * import { AWASE_CHECK_REASONS } from "@johnmorrisdotca/jarajara/awase";
 *
 * console.log(AWASE_CHECK_REASONS["tiles-left"]);
 * ```
 */
export const AWASE_CHECK_REASONS = {
  "givens-not-deal": "the givens are not a deal of that layout",
  "answer-not-moves": "the answer is not a list of moves",
  "move-not-allowed": "a move the rules do not allow",
  "tiles-left": "tiles are left on the layout",
} as const;

/**
 * A reason `checkAwase` can give, by its stable code.
 *
 * @example
 * ```ts
 * import type { AwaseCheckCode } from "@johnmorrisdotca/jarajara/awase";
 *
 * const code: AwaseCheckCode = "tiles-left";
 * console.log(code);
 * ```
 */
export type AwaseCheckCode = keyof typeof AWASE_CHECK_REASONS;

/**
 * A refusal: `{ ok: false }`, the English `reason` and the code.
 *
 * @param code - Why the solve is not taken.
 * @returns The refusal `checkAwase` gives.
 * @example
 * ```ts
 * import { awaseRefusal } from "@johnmorrisdotca/jarajara/awase";
 *
 * console.log(awaseRefusal("tiles-left"));
 * ```
 */
export function awaseRefusal(code: AwaseCheckCode): Extract<AwaseCheck, { ok: false }> {
  return { ok: false, reason: AWASE_CHECK_REASONS[code], code };
}
