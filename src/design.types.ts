/**
 * A SET OF DRAWN TILES, a design: how the tile itself is drawn, its back, and each face's picture. Every drawing is
 * what goes inside an `<svg>` of the design's own box, so a design may be drawn at any scale (Jarajara's own is in a
 * box 30 by 40, the riichi sets in one 300 by 400) and is fitted to the tile's 30 by 40 when it is used.
 */
export type TileDesign = {
  /** The design's name, as an element's `design` attribute and `loadTileDesign` take it: `jarajara`, `riichi`, `riichi-black`. */
  name: string;
  /** The width and height each tile's drawing is made in. */
  box: readonly [number, number];
  /** The tile's own plate, the ivory the face is on, with its rounded corners; null for the plain rounded rectangle Jarajara draws. */
  body: string | null;
  /** The back of a tile, plate and pattern, as a tile lying face down shows it. */
  back: string;
  /** Each face's drawing, by its code (`a`–`P`), without the tile under it. A face the design has no drawing for is Jarajara's own. */
  faces: Readonly<Record<string, string>>;
  /** The red fives, by the face's code (`e`, `n`, `w`: the fives of characters, circles and bamboo), for a design that has them. */
  red?: Readonly<Record<string, string>>;
  /** The colours the tile's thickness and rim are drawn in where a board stacks tiles. `body` is the colour of the back plate under the ivory (a real tile's green): the thickness shows in it. */
  colours: { face: string; rim: string; side: string; sideEdge: string; body?: string };
  /** What is drawn on the plate under a face the design has no drawing for, so Jarajara's own ink reads on it: a light panel on a dark tile. */
  plate?: string;
};
