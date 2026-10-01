import type { TileDesign } from "./design.types.ts";
import { faceWords } from "./names.ts";
import { faceOf, MAHJONG_FACES } from "./tiles.ts";
import type { MahjongFace } from "./types.ts";

export { faceWords };

/**
 * THE FACES OF THE TILES, as SVG text: a Japanese-style set in the plainest
 * strokes that still read at thirty pixels. Characters are the numeral over a
 * red 萬; circles and bamboo are counted out in dots and sticks; the winds and
 * dragons are their characters, 中 red and 發 green, and the white dragon a
 * blue frame. The flowers and seasons carry a band of their group's colour
 * across the top, since any of a group matches any other. Every suit tile and
 * wind also has its number or letter small in the top corner, for a reader who
 * does not count dots at a glance or read 東 as east.
 *
 * Each face is drawn in the tile's own 30 by 40 (`TILE_SIZE`), and returned as
 * a string, so it goes into any page, framework or none. The tiles are light
 * objects on any table, so every colour is fixed, never a theme's. The text on
 * them cannot be selected: a tile is a thing to press, not a word to copy.
 */
export const TILE_SIZE = { width: 30, height: 40 } as const;

/** The inks a face is drawn in. */
export const TILE_INK = {
  ink: "#22231f",
  soft: "#6f6a62",
  red: "#b2302f",
  green: "#2f6b3a",
  blue: "#1f4e8c",
  ochre: "#9d6c1f",
  flower: "#b0457a",
  season: "#c2711c",
} as const;

/** The tile itself: its ivory face, the rim round it, and the bone of its side. */
export const TILE_BODY = { face: "#fffdf6", rim: "#b9ad96", side: "#d9c59b", sideEdge: "#a8926a" } as const;

/** The fonts the characters are drawn in, Japanese serif first; a page may load its own and name it here. */
export const TILE_FONT = "'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif CJK JP', serif";

const SANS = "ui-sans-serif, system-ui, sans-serif";
const UNSELECTABLE = ` style="user-select:none;-webkit-user-select:none"`;

const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
const WIND_KANJI = ["東", "南", "西", "北"];
const WIND_LETTERS = ["E", "S", "W", "N"];
const FLOWER_KANJI = ["梅", "蘭", "菊", "竹"];
const SEASON_KANJI = ["春", "夏", "秋", "冬"];

/* Circles: where each dot sits, and its radius, for one to nine. */
const DOTS: Record<number, { r: number; at: [number, number][] }> = {
  1: { r: 10, at: [[15, 20]] },
  2: { r: 6.5, at: [[15, 11], [15, 29]] },
  3: { r: 5.5, at: [[8, 9], [15, 20], [22, 31]] },
  4: { r: 5.5, at: [[9, 12], [21, 12], [9, 28], [21, 28]] },
  5: { r: 5, at: [[8, 10], [22, 10], [15, 20], [8, 30], [22, 30]] },
  6: { r: 4.6, at: [[9, 9], [21, 9], [9, 20], [21, 20], [9, 31], [21, 31]] },
  7: { r: 3.8, at: [[7, 7], [15, 11], [23, 15], [9, 24], [21, 24], [9, 33], [21, 33]] },
  8: { r: 3.8, at: [[9, 6.5], [21, 6.5], [9, 15.5], [21, 15.5], [9, 24.5], [21, 24.5], [9, 33.5], [21, 33.5]] },
  9: { r: 3.8, at: [[7, 9], [15, 9], [23, 9], [7, 20], [15, 20], [23, 20], [7, 31], [15, 31], [23, 31]] },
};

/* The colour of each dot, in the order above: blue, green and a red at the heart where a real set puts one. */
function dotColour(rank: number, index: number): string {
  if (rank === 1) return TILE_INK.red;
  if (rank === 3 || rank === 5) return index === (rank === 3 ? 1 : 2) ? TILE_INK.red : rank === 3 ? TILE_INK.blue : TILE_INK.green;
  if (rank === 7) return index < 3 ? TILE_INK.green : TILE_INK.red;
  if (rank === 9) return index >= 3 && index < 6 ? TILE_INK.red : TILE_INK.blue;
  if (rank === 6) return index < 2 ? TILE_INK.green : TILE_INK.red;
  return index % 2 === 0 ? TILE_INK.blue : TILE_INK.green;
}

/* Bamboo: each stick's centre, top and length, and whether it is the red one, for two to nine. */
const STICKS: Record<number, [number, number, number, boolean?][]> = {
  2: [[15, 4, 14], [15, 22, 14]],
  3: [[15, 4, 14], [10, 22, 14], [20, 22, 14]],
  4: [[10, 4, 14], [20, 4, 14], [10, 22, 14], [20, 22, 14]],
  5: [[8, 4, 14], [22, 4, 14], [15, 13, 14, true], [8, 22, 14], [22, 22, 14]],
  6: [[7, 4, 14], [15, 4, 14], [23, 4, 14], [7, 22, 14], [15, 22, 14], [23, 22, 14]],
  7: [[15, 3, 10, true], [7, 15, 10], [15, 15, 10], [23, 15, 10], [7, 27, 10], [15, 27, 10], [23, 27, 10]],
  8: [[6, 4, 14], [12, 4, 14], [18, 4, 14], [24, 4, 14], [6, 22, 14], [12, 22, 14], [18, 22, 14], [24, 22, 14]],
  9: [[7, 3, 10], [15, 3, 10, true], [23, 3, 10], [7, 15, 10], [15, 15, 10, true], [23, 15, 10], [7, 27, 10], [15, 27, 10, true], [23, 27, 10]],
};

const round = (n: number): string => String(Math.round(n * 1000) / 1000);

function stick(x: number, y: number, length: number, red: boolean): string {
  const colour = red ? TILE_INK.red : TILE_INK.green;
  return `<g><rect x="${round(x - 1.7)}" y="${y}" width="3.4" height="${length}" rx="1.4" fill="${colour}"/><line x1="${round(x - 1.7)}" x2="${round(x + 1.7)}" y1="${y + length / 2}" y2="${y + length / 2}" stroke="#fff" stroke-width="0.8"/></g>`;
}

/** A small number or letter in the top-left corner. */
function index(text: string): string {
  return `<text x="3.2" y="8" font-size="6.5" font-weight="700" fill="${TILE_INK.soft}" font-family="${SANS}"${UNSELECTABLE}>${text}</text>`;
}

function glyph(text: string, y: number, size: number, colour: string): string {
  return `<text x="15" y="${y}" font-size="${size}" font-weight="700" fill="${colour}" text-anchor="middle" font-family="${TILE_FONT}"${UNSELECTABLE}>${text}</text>`;
}

function drawing(face: MahjongFace): string {
  switch (face.suit) {
    case "characters":
      return index(String(face.rank)) + glyph(NUMERALS[face.rank - 1]!, 19, 15, TILE_INK.ink) + glyph("萬", 35, 13, TILE_INK.red);
    case "circles": {
      const dots = DOTS[face.rank]!;
      const corner = face.rank > 1 ? index(String(face.rank)) : "";
      return (
        corner +
        dots.at
          .map(
            ([x, y], at) =>
              `<g><circle cx="${x}" cy="${y}" r="${dots.r}" fill="${dotColour(face.rank, at)}"/><circle cx="${x}" cy="${y}" r="${round(dots.r * 0.55)}" fill="none" stroke="#fff" stroke-width="${round(dots.r * 0.18)}"/><circle cx="${x}" cy="${y}" r="${round(dots.r * 0.18)}" fill="#fff"/></g>`,
          )
          .join("")
      );
    }
    case "bamboo":
      if (face.rank === 1) {
        // The one of bamboo is a bird on a real set: here a sparrow, green with a red crest, so it is never read as a stick.
        return (
          `<g>${index("1")}` +
          `<ellipse cx="15" cy="23" rx="8" ry="7" fill="${TILE_INK.green}"/>` +
          `<circle cx="20" cy="14" r="4.5" fill="${TILE_INK.green}"/>` +
          `<path d="M 18 9.5 L 20 6 L 22 9.5 Z" fill="${TILE_INK.red}"/>` +
          `<path d="M 24 13.5 L 28 14.5 L 24 15.5 Z" fill="${TILE_INK.ochre}"/>` +
          `<path d="M 8 24 L 3 34 L 12 29 Z" fill="${TILE_INK.blue}"/>` +
          `<circle cx="21" cy="13" r="1" fill="#fff"/>` +
          `<line x1="13" x2="12" y1="30" y2="36" stroke="${TILE_INK.red}" stroke-width="1.2"/>` +
          `<line x1="17" x2="18" y1="30" y2="36" stroke="${TILE_INK.red}" stroke-width="1.2"/></g>`
        );
      }
      return index(String(face.rank)) + STICKS[face.rank]!.map(([x, y, length, red]) => stick(x, y, length, red === true)).join("");
    case "winds":
      return index(WIND_LETTERS[face.rank - 1]!) + glyph(WIND_KANJI[face.rank - 1]!, 29, 21, TILE_INK.ink);
    case "dragons":
      if (face.rank === 3) {
        return `<g fill="none" stroke="${TILE_INK.blue}"><rect x="5" y="6" width="20" height="28" rx="1.5" stroke-width="2.2"/><rect x="9" y="10" width="12" height="20" rx="1" stroke-width="1.2"/></g>`;
      }
      return glyph(face.rank === 1 ? "中" : "發", 29, 22, face.rank === 1 ? TILE_INK.red : TILE_INK.green);
    case "flowers":
    case "seasons": {
      const flower = face.suit === "flowers";
      const band = flower ? TILE_INK.flower : TILE_INK.season;
      return (
        `<rect x="2" y="2" width="26" height="7" rx="1.5" fill="${band}"/>` +
        `<text x="15" y="7.6" font-size="5.5" font-weight="700" fill="#fff" text-anchor="middle" font-family="${SANS}"${UNSELECTABLE}>${flower ? "FLOWER" : "SEASON"}</text>` +
        glyph((flower ? FLOWER_KANJI : SEASON_KANJI)[face.rank - 1]!, 30, 18, band) +
        `<text x="25" y="37" font-size="6" font-weight="700" fill="${TILE_INK.soft}" text-anchor="middle" font-family="${SANS}"${UNSELECTABLE}>${face.rank}</text>`
      );
    }
  }
}

/**
 * One face's drawing, in the tile's own 30 by 40, with no tile under it: the
 * inside of a `<symbol>` or a `<g>`, for a board that draws its own tiles.
 * Null for a letter that is no face. With a `design`, that design's drawing of
 * the face (fitted to the 30 by 40), or Jarajara's own where it has none.
 */
export function tileFaceSvg(code: string, design?: TileDesign, red = false): string | null {
  const face = faceOf(code);
  if (face === null) return null;
  if (design === undefined) return drawing(face);
  const own = (red ? design.red?.[code] : undefined) ?? design.faces[code];
  if (own !== undefined) return fitted(design, own);
  return `${design.plate ?? ""}${drawing(face)}`;
}

/** A drawing made in a design's box, fitted to the tile's 30 by 40. */
function fitted(design: TileDesign, inner: string): string {
  const [w, h] = design.box;
  if (w === TILE_SIZE.width && h === TILE_SIZE.height) return inner;
  return `<g transform="scale(${round(TILE_SIZE.width / w)} ${round(TILE_SIZE.height / h)})">${inner}</g>`;
}

/** The tile's own plate in a design, fitted to the tile's 30 by 40; null for a design that draws the plain rounded rectangle. */
export function tileBodySvg(design: TileDesign | undefined): string | null {
  return design === undefined || design.body === null ? null : fitted(design, design.body);
}

/** The back of a tile in a design, plate and pattern, fitted to the tile's 30 by 40. */
export function tileBackDrawing(design: TileDesign): string {
  return fitted(design, design.back);
}

/** The colours of a tile's rim and thickness: a design's, or Jarajara's own ivory and bone. */
export function tileColours(design?: TileDesign): { face: string; rim: string; side: string; sideEdge: string } {
  return design?.colours ?? TILE_BODY;
}

/** How a set of symbols is made. */
export type TileSymbolOptions = {
  /** A design's drawings instead of Jarajara's own. */
  design?: TileDesign;
  /** Only these faces' symbols, for a board that holds few of them. Unless said, all 42. */
  faces?: Iterable<string>;
  /** Also a symbol of each red five, `<prefix>-e-red`, for a design that has them. */
  red?: boolean;
};

/**
 * Every face as a `<symbol>` in one `<defs>`, ids `<prefix>-<code>`, so a board
 * of 144 tiles draws 42 pictures and places each with a `<use>`. A design with
 * a plate of its own adds it as `<prefix>-body`, and its red fives are
 * `<prefix>-<code>-red`.
 */
export function tileFaceSymbols(prefix: string, options: TileSymbolOptions = {}): string {
  const { design, red = false } = options;
  const wanted = options.faces === undefined ? null : new Set(options.faces);
  const box = `viewBox="0 0 ${TILE_SIZE.width} ${TILE_SIZE.height}"`;
  const symbols: string[] = [];
  const body = tileBodySvg(design);
  if (body !== null) symbols.push(`<symbol id="${prefix}-body" ${box}>${body}</symbol>`);
  for (const face of MAHJONG_FACES) {
    if (wanted !== null && !wanted.has(face.code)) continue;
    symbols.push(`<symbol id="${prefix}-${face.code}" ${box}>${tileFaceSvg(face.code, design)}</symbol>`);
    if (red && design?.red?.[face.code] !== undefined) symbols.push(`<symbol id="${prefix}-${face.code}-red" ${box}>${tileFaceSvg(face.code, design, true)}</symbol>`);
  }
  return `<defs>${symbols.join("")}</defs>`;
}

/** How a tile on its own is drawn. */
export type TileSvgOptions = {
  /** A design's drawing instead of Jarajara's own. */
  design?: TileDesign;
  /** The red five of a design that has one, for a five. */
  red?: boolean;
  /** What a screen reader says. Unless said, the tile's name in English. An empty string makes the picture decoration. */
  title?: string;
};

/** The `<svg>` opening a tile's picture: its box with room for the sliver of its side, and its name. */
function tileOpen(face: MahjongFace, title: string | undefined): string {
  const said = title ?? faceWords(face);
  const named = said === "" ? ` aria-hidden="true"` : ` role="img" aria-label="${said}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 32 42"${named} data-face="${face.code}">`;
}

/**
 * One tile on its own, as a whole `<svg>`: the face on its ivory, with a
 * sliver of its side, named for a screen reader. Its width and height are the
 * caller's, through CSS; the picture keeps its 3 by 4. Null for a letter that
 * is no face.
 */
export function tileSvg(code: string, options: TileSvgOptions = {}): string | null {
  const face = faceOf(code);
  if (face === null) return null;
  const { design, red = false } = options;
  const colours = tileColours(design);
  const body = tileBodySvg(design);
  return (
    tileOpen(face, options.title) +
    `<rect x="-0.5" y="-0.5" width="31" height="41" rx="3" fill="${colours.side}"/>` +
    (body === null ? `<rect x="0" y="0" width="30" height="40" rx="3" fill="${colours.face}" stroke="${colours.rim}" stroke-width="0.8"/>` : body) +
    `${tileFaceSvg(code, design, red)}</svg>`
  );
}
