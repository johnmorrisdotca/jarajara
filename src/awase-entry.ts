/**
 * Awase (合わせ, "matching"): the matching solitaire. Take away the tiles two at a time, two that match and that are
 * both free (nothing on top, and an open side), until the layout is clear. A deal is made from a seed at three
 * levels, every one of them clearable, and a finished game is checked in one pass.
 */
export * from "./awase.ts";
export * from "./check.ts";
export * from "./challenge.ts";
export type { AwaseCheck, AwaseDeal, AwaseLevel } from "./types.ts";
