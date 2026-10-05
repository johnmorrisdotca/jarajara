/**
 * Jarajara: mahjong tiles for JavaScript and TypeScript. The full set of 144 tiles in 42 faces, the stacked layouts
 * tile games are played on, which tiles are free, matching, dealing, shuffling and a game written as text. The
 * games are their own entries: `@johnmorrisdotca/jarajara/awase` (the matching solitaire) and
 * `@johnmorrisdotca/jarajara/table` (Awase for two to four, pairs that score).
 */
export * from "./tiles.ts";
export * from "./layouts.ts";
export { MORE_LAYOUTS } from "./layouts-more.ts";
export { MEGA_LAYOUTS } from "./layouts-mega.ts";
export * from "./board.ts";
export * from "./deal.ts";
export * from "./moves.ts";
export * from "./names.ts";
export * from "./arrange.ts";
export type * from "./types.ts";
export { seededRandom, shuffled } from "./random.ts";
export type { Random } from "./random.ts";
export { VERSION } from "./version.ts";
