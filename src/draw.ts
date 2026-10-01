import { isFree, geometryOf } from "./board.ts";
import { isCloth, JARAJARA_CLOTHS, type Cloth } from "./cloth.ts";
import type { TileDesign } from "./design.types.ts";
import { redFiveIndexes } from "./designs.ts";
import { faceWords, tileBodySvg, tileColours, TILE_SIZE, tileFaceSymbols } from "./faces.ts";
import { layoutExtent, layoutFor } from "./layouts.ts";
import { EMPTY_SLOT, faceOf } from "./tiles.ts";
import type { MahjongSlot } from "./types.ts";

/**
 * A LAYOUT, DRAWN: every tile a raised ivory block, its thickness showing
 * below and to the left, each layer lifted a step up and to the right so the
 * stacks read at a glance. Drawn far to near (lower layers first, then from
 * the back row forward and from the right leftward) so every tile's sides are
 * covered by the tiles in front of it, as on a table.
 *
 * The picture is a string, so it goes into any page. Each tile is a `<g>`
 * carrying `data-slot`, `data-face` and `data-free`, for a page to listen on.
 * The table under it is the page's; the picture has no background.
 */

/** How thick a tile is, and so how far each layer is lifted, in the face's units. */
export const TILE_DEPTH = 5;

/** The marks a page may put on tiles: the one chosen, ones hinted, and a wash over the blocked. */
export const TILE_MARKS = { chosen: "#dbe8d3", chosenRing: "#52664b", hinted: "#9d6c1f", blockedWash: "rgba(34, 35, 31, 0.26)", shadow: "#2a1d0e", gold: "#d4a017" } as const;

/** Where a slot's tile face is drawn, raised up and right by its layer. */
export function tileAt(slot: MahjongSlot, layers: number): { x: number; y: number } {
  return { x: TILE_DEPTH + (slot.x * TILE_SIZE.width) / 2 + slot.z * TILE_DEPTH, y: (layers - slot.z) * TILE_DEPTH + (slot.y * TILE_SIZE.height) / 2 };
}

/** The drawing's width and height for a layout's size, room left for the thickness below and the layers above. Null for a size with no layout. */
export function layoutBox(size: number): { width: number; height: number } | null {
  const layout = layoutFor(size);
  if (layout === null) return null;
  const { width, height, layers } = layoutExtent(layout);
  return { width: (width * TILE_SIZE.width) / 2 + (layers + 1) * TILE_DEPTH, height: (height * TILE_SIZE.height) / 2 + (layers + 1) * TILE_DEPTH };
}

export type LayoutSvgOptions = {
  /** The slot chosen, ringed and tinted. */
  chosen?: number | null;
  /** Slots ringed as a hint. */
  hinted?: readonly number[];
  /** Slots ringed softly: the tiles that match the one chosen, when a page lights them. */
  matching?: readonly number[];
  /** Wash every blocked tile darker, so the free ones stand out. */
  showFree?: boolean;
  /** Draw a blocked tile blank, its face not shown, as in the blackout challenge: only a free tile shows what it is. */
  hideBlocked?: boolean;
  /** Slots marked for a challenge (a gold tile, a target suit): a gold ring and corner. */
  marked?: readonly number[];
  /** The prefix of the face symbols' ids: one a board, when a page draws several. */
  prefix?: string;
  /** A design's drawings instead of Jarajara's own, as `loadTileDesign` gives it. */
  design?: TileDesign;
  /** Draw the red fives of a design that has them: the first five of each suit in slot order is red. */
  redFives?: boolean;
  /** The tiles that decide which fives are red, when it is not the ones drawn: a game's tiles as first dealt, so the red five stays the same tile as the others are taken. Unless said, the tiles drawn. */
  redFrom?: string;
  /** Lay the layout on a cloth, a felt behind it with a margin: `green`, `blue`, `red`, `black` or `wood`. Unless said, no background. */
  cloth?: Cloth | string;
  /** Put the faces' symbols in the picture (unless said). A page that draws a board again and again keeps them once, in a `<svg>` of its own, and says `false`. */
  symbols?: boolean;
};

/** The margin a cloth leaves round the tiles, in the face's units. */
const CLOTH_MARGIN = TILE_DEPTH * 3;

/**
 * The whole layout as one `<svg>`, the tiles in `cells` where they lie (a
 * face letter a slot, "." for one taken). Null for a size with no layout or
 * cells of the wrong length.
 */
export function layoutSvg(size: number, cells: string, options: LayoutSvgOptions = {}): string | null {
  const layout = layoutFor(size);
  const box = layoutBox(size);
  if (layout === null || box === null || cells.length !== layout.slots.length) return null;
  const { chosen = null, hinted = [], matching = [], marked = [], showFree = false, hideBlocked = false, prefix = "jarajara", design, redFives = false, symbols = true } = options;
  const geometry = geometryOf(layout);
  const layers = layoutExtent(layout).layers;
  const { width: w, height: h } = TILE_SIZE;
  const colours = tileColours(design);
  const hasBody = tileBodySvg(design) !== null;
  const red = redFives && design?.red !== undefined ? redFiveIndexes(options.redFrom ?? cells) : new Set<number>();
  const order = layout.slots.map((slot, index) => ({ slot, index })).sort((a, b) => a.slot.z - b.slot.z || a.slot.y - b.slot.y || b.slot.x - a.slot.x);
  const tiles = order.map(({ slot, index }) => {
    const code = cells[index]!;
    const face = faceOf(code);
    if (code === EMPTY_SLOT || face === null) return "";
    const at = tileAt(slot, layers);
    const free = isFree(geometry, cells, index);
    const isChosen = chosen === index;
    const blank = hideBlocked && !free;
    const symbol = red.has(index) ? `${prefix}-${code}-red` : `${prefix}-${code}`;
    const parts = [
      // A raised tile's shadow on what lies under it: the higher, the darker.
      slot.z > 0 ? `<rect x="${-TILE_DEPTH * 2}" y="${TILE_DEPTH * 2}" width="${w}" height="${h}" rx="4" pointer-events="none" fill="${TILE_MARKS.shadow}" opacity="${Math.min(0.5, 0.18 + slot.z * 0.06).toFixed(2)}"/>` : "",
      `<rect x="${-TILE_DEPTH}" y="${TILE_DEPTH}" width="${w}" height="${h}" rx="3" fill="${colours.side}" stroke="${colours.sideEdge}" stroke-width="0.8"/>`,
      hasBody
        ? `<use href="#${prefix}-body" width="${w}" height="${h}"/>${isChosen ? `<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="${TILE_MARKS.chosen}" opacity="0.6"/>` : ""}`
        : `<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="${isChosen ? TILE_MARKS.chosen : colours.face}" stroke="${colours.rim}" stroke-width="0.8"/>`,
      blank ? "" : `<use href="#${symbol}" width="${w}" height="${h}"/>`,
      showFree && !free ? `<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="${TILE_MARKS.blockedWash}"/>` : "",
      matching.includes(index) ? `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="2.5" fill="none" stroke="${TILE_MARKS.chosenRing}" stroke-width="1.4" stroke-dasharray="3 2"/>` : "",
      marked.includes(index) ? `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="2.5" fill="none" stroke="${TILE_MARKS.gold}" stroke-width="2"/><circle cx="${w - 5}" cy="5" r="3.2" fill="${TILE_MARKS.gold}" stroke="#fff" stroke-width="0.8"/>` : "",
      hinted.includes(index) ? `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="2.5" fill="none" stroke="${TILE_MARKS.hinted}" stroke-width="2.6"/>` : "",
      isChosen ? `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="2.5" fill="none" stroke="${TILE_MARKS.chosenRing}" stroke-width="2.6"/>` : "",
    ];
    const name = blank ? "tile, blank" : faceWords(face);
    return `<g transform="translate(${at.x} ${at.y})" data-slot="${index}" data-face="${blank ? "" : code}" data-free="${free}" role="button" aria-label="${name}${free ? "" : ", blocked"}"${isChosen ? ` aria-pressed="true"` : ""}>${parts.join("")}</g>`;
  });
  const left = [...cells].filter((code) => code !== EMPTY_SLOT).length;
  const cloth = isCloth(options.cloth) ? options.cloth : null;
  const margin = cloth === null ? 0 : CLOTH_MARGIN;
  const felt = cloth === null ? "" : `<rect x="${-margin}" y="${-margin}" width="${box.width + 2 * margin}" height="${box.height + 2 * margin}" rx="${margin}" fill="${JARAJARA_CLOTHS[cloth].felt}" data-cloth="${cloth}"/>`;
  const defs = symbols ? tileFaceSymbols(prefix, { design, red: red.size > 0 }) : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-margin} ${-margin} ${box.width + 2 * margin} ${box.height + 2 * margin}" role="group" aria-label="Mahjong layout, ${left} tiles left" style="user-select:none;-webkit-user-select:none">${defs}${felt}${tiles.join("")}</svg>`;
}

