/**
 * The tiles, drawn: each of the 42 faces as SVG text, a tile on its own, its back, and a whole layout of stacked tiles,
 * on a cloth if you like. Strings, not components, so they go into any page with any framework or none.
 */

export * from "./backs.ts";
export type { BlockColours, BlockDirection, TileMirror } from "./block.ts";
export { blockColours, blockSvg, directionOf, faceEdgeSvg, isTileMirror, shadowSvg, TILE_MIRRORS } from "./block.ts";
export * from "./cloth.ts";
export type * from "./design.types.ts";
export * from "./designs.ts";
export * from "./draw.ts";
export * from "./faces.ts";
