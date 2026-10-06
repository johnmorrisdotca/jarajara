/**
 * The sounds of a mahjong table: a tile picked up, set down or turned over, a pair knocked together, the tiles
 * shuffled, a clatter for a win. Off unless a table asks: nothing plays and nothing is fetched until `play`.
 *
 * ```ts
 * import { createTileSounds } from "@johnmorrisdotca/jarajara/tile-sounds";
 *
 * const sounds = createTileSounds();
 * sounds.play("shuffle");
 * sounds.play("place", { count: 13, delay: 900 });
 * ```
 *
 * The recordings themselves are `@johnmorrisdotca/jarajara/sounds`, loaded by the first sound played. Kenney's Casino
 * Audio, CC0: see CREDITS.md.
 */
export { MOST_SOUNDS_AT_ONCE, TILE_SOUND_KINDS, createTileSounds, soundTimes } from "./ui/tileSounds.ts";
export type { PlayTileSoundOptions, TileSoundData, TileSoundKind, TileSoundWindow, TileSounds, TileSoundsOptions } from "./ui/tileSounds.ts";
