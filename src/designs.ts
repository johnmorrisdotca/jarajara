import { tileBackFace } from "./backs.ts";
import type { TileDesign } from "./design.types.ts";
import { TILE_BODY, tileFaceSvg } from "./faces.ts";
import { MAHJONG_FACES } from "./tiles.ts";

/**
 * THE DESIGNS A TILE MAY BE DRAWN IN. `jarajara` is the package's own, drawn in plain strokes and always at hand;
 * `riichi` and `riichi-black` are FluffyStuff's riichi tiles (CC0, see CREDITS.md), regular and black, with their
 * own backs and red fives, and each is fetched the first time it is asked for, so a page that stays with the default
 * pays nothing for them. They draw no flowers or seasons, so those stay Jarajara's own within them.
 */
export const TILE_DESIGNS = ["jarajara", "riichi", "riichi-black"] as const;

/** A design's name. */
export type TileDesignName = (typeof TILE_DESIGNS)[number];

/** Whether a text names one of the designs. */
export function isTileDesignName(text: unknown): text is TileDesignName {
  return typeof text === "string" && (TILE_DESIGNS as readonly string[]).includes(text);
}

let own: TileDesign | null = null;

/** Jarajara's own design as a design, made the first time it is asked for: the 42 faces, its jade back and the plain ivory tile. */
export function jarajaraDesign(): TileDesign {
  own ??= {
    name: "jarajara",
    box: [30, 40],
    body: null,
    back: tileBackFace("jade"),
    faces: Object.fromEntries(MAHJONG_FACES.map((face) => [face.code, tileFaceSvg(face.code) as string])),
    colours: TILE_BODY,
  };
  return own;
}

/**
 * A design by name. `jarajara` at once; `riichi` and `riichi-black` fetched now, and kept. Null for a name that is
 * no design. The drawings are `@johnmorrisdotca/jarajara/designs/riichi` and `/designs/riichi-black` if a bundler
 * should be told of them by name.
 */
export async function loadTileDesign(name: TileDesignName | string): Promise<TileDesign | null> {
  if (name === "jarajara") return jarajaraDesign();
  if (name === "riichi") return (await import("./designs/riichi.ts")).RIICHI;
  if (name === "riichi-black") return (await import("./designs/riichi-black.ts")).RIICHI_BLACK;
  return null;
}

/** The codes of the fives of characters, circles and bamboo: the tiles a set may make red. */
export const RED_FIVE_CODES = ["e", "n", "w"] as const;

/**
 * WHICH TILES OF A LIST ARE THE RED FIVES. A set holds one red five of each suit, drawn in place of one of its four
 * fives, and a face's letter cannot say which, so the first five of each suit in the list (in the layout's slot
 * order, or the hand's) is the red one. A pure function of the tiles, so the same tiles are red every time.
 */
export function redFiveIndexes(codes: Iterable<string>): Set<number> {
  const seen = new Set<string>();
  const red = new Set<number>();
  let index = 0;
  for (const code of codes) {
    if ((RED_FIVE_CODES as readonly string[]).includes(code) && !seen.has(code)) {
      seen.add(code);
      red.add(index);
    }
    index += 1;
  }
  return red;
}
