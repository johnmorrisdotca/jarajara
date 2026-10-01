import { blockColours, blockSvg, directionOf, faceEdgeSvg, isTileMirror, shadowSvg, SHADOW_LAYERS, shadowReach, TILE_DEPTH, type TileMirror } from "./block.ts";
import { isFree, geometryOf } from "./board.ts";
import { isCloth, JARAJARA_CLOTHS, type Cloth } from "./cloth.ts";
import type { TileDesign } from "./design.types.ts";
import { redFiveIndexes } from "./designs.ts";
import { faceWords, tileBodySvg, tileColours, TILE_SIZE, tileFaceSymbols } from "./faces.ts";
import { layoutExtent, layoutFor } from "./layouts.ts";
import { EMPTY_SLOT, faceOf } from "./tiles.ts";
import type { MahjongSlot } from "./types.ts";

export { TILE_DEPTH };

/**
 * A LAYOUT, DRAWN: every tile a solid block (an ivory face over a darker back plate, its thickness showing on two
 * sides), each layer lifted by exactly the tile's thickness, so the stacks read as stacks, and every tile casting a
 * soft shadow that lengthens with its layer. Drawn far to near (lower layers first, then from the back row forward and
 * from the far side across) so every tile's sides are covered by the tiles in front of it, as on a table.
 *
 * The picture is a string, so it goes into any page. Each tile is a `<g>` carrying `data-slot`, `data-face` and
 * `data-free`, for a page to listen on. The table under it is the page's; the picture has no background.
 *
 * It may be drawn as the other side of the table sees it (`mirror`): left to right, top to bottom or both. That is a
 * view only: a tile's `data-slot` is still its slot in the layout, so freeness, moves and saved games do not change.
 */

/** The marks a page may put on tiles: the one chosen, ones hinted, the matches Find lights, and a wash over the blocked. */
export const TILE_MARKS = { chosen: "#dbe8d3", chosenRing: "#52664b", hinted: "#9d6c1f", blockedWash: "rgba(34, 35, 31, 0.26)", shadow: "#2a1d0e", gold: "#d4a017", found: "#1c6e8c" } as const;

/** Where a slot's tile face is drawn, raised by its layer along the thickness's direction. With a view that turns the board (`mirror`) the layout's `width` and `height` in half-tiles are needed too. */
export function tileAt(slot: MahjongSlot, layers: number, mirror: TileMirror = "none", extent?: { width: number; height: number }): { x: number; y: number } {
  const direction = directionOf(extent === undefined ? "none" : mirror);
  const across = direction.x < 0 ? (extent as { width: number }).width - 2 - slot.x : slot.x;
  const down = direction.y < 0 ? (extent as { height: number }).height - 2 - slot.y : slot.y;
  return {
    x: (direction.x < 0 ? layers - slot.z : 1 + slot.z) * TILE_DEPTH + (across * TILE_SIZE.width) / 2,
    y: (direction.y < 0 ? 1 + slot.z : layers - slot.z) * TILE_DEPTH + (down * TILE_SIZE.height) / 2,
  };
}

/** The drawing's width and height for a layout's size, room left for the thickness and the layers. Null for a size with no layout. The same in every view. */
export function layoutBox(size: number): { width: number; height: number } | null {
  const layout = layoutFor(size);
  if (layout === null) return null;
  const { width, height, layers } = layoutExtent(layout);
  return { width: (width * TILE_SIZE.width) / 2 + (layers + 1) * TILE_DEPTH, height: (height * TILE_SIZE.height) / 2 + (layers + 1) * TILE_DEPTH };
}

/** The drawing's viewBox: where it starts and how large it is, in the face's units. */
export type LayoutFrame = { x: number; y: number; width: number; height: number };

/**
 * THE TILES' DRAWN EXTENT, plus an even margin: the smallest box that holds every tile of a layout as it is drawn, with
 * its thickness and its layer offsets, in whichever view (`mirror`) puts them. A page that centres this box centres what
 * the eye sees, not the grid of slots, so the space from the outermost solid pixel to a frame round it is the same on both
 * sides. The soft shadow is left out unless `shadow` is true: it falls one way only, so counting it would push the solid
 * tiles off centre by its reach; it spills into the margin instead, which is why a frame wants a margin of at least a few
 * units. Taken tiles do not change the box: it is the layout's, so a game keeps one steady frame. `margin` defaults to 0.
 * Null for a size with no layout.
 */
export function layoutFrame(size: number, options: { mirror?: TileMirror | string; margin?: number; shadow?: boolean } = {}): LayoutFrame | null {
  const layout = layoutFor(size);
  if (layout === null) return null;
  const mirror: TileMirror = isTileMirror(options.mirror) ? options.mirror : "none";
  const margin = Number.isFinite(options.margin) ? Math.max(0, options.margin as number) : 0;
  const direction = directionOf(mirror);
  const extent = layoutExtent(layout);
  const { width: w, height: h } = TILE_SIZE;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const slot of layout.slots) {
    const at = tileAt(slot, extent.layers, mirror, extent);
    // What a tile draws, as offsets from its face: the face, the far side of the block, and the widest of its shadows.
    const reach = shadowReach(Math.min(slot.z, 4));
    const reaches: [number, number][] = [[0, 0], [TILE_DEPTH, 0], ...(options.shadow === true ? SHADOW_LAYERS.map(([along, grow]): [number, number] => [TILE_DEPTH + reach * along, grow]) : [])];
    for (const [along, grow] of reaches) {
      const dx = -direction.x * along;
      const dy = direction.y * along;
      x0 = Math.min(x0, at.x + dx - grow);
      y0 = Math.min(y0, at.y + dy - grow);
      x1 = Math.max(x1, at.x + w + dx + grow);
      y1 = Math.max(y1, at.y + h + dy + grow);
    }
  }
  const round = (value: number) => Math.round(value * 100) / 100;
  return { x: round(x0 - margin), y: round(y0 - margin), width: round(x1 - x0 + 2 * margin), height: round(y1 - y0 + 2 * margin) };
}

export type LayoutSvgOptions = {
  /** The slot chosen, ringed and tinted. */
  chosen?: number | null;
  /** Slots ringed as a hint. */
  hinted?: readonly number[];
  /** Slots ringed softly: the tiles that match the one chosen, when a page lights them. */
  matching?: readonly number[];
  /** What Find lights, as `matchesOf` gives it: a free match (one that could be taken with the tile now) in a solid ring and tint, a blocked one in a dashed ring, so colour is never the only difference. */
  found?: { free: readonly number[]; blocked: readonly number[] };
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
  /** Frame the drawing on the tiles' drawn extent plus this margin (`layoutFrame`, shadow left to spill into the margin), so a page that centres the picture centres the tiles. Unless said, the old box (`layoutBox`), which leaves room for the thickness whether or not it is used. */
  margin?: number;
  /** The view: `none` (unless said), `horizontal` (left to right), `vertical` (top to bottom) or `both`. The thickness, the lift of the layers and the shadows follow it; the slots do not. */
  mirror?: TileMirror | string;
};

/** The margin a cloth leaves round the tiles, in the face's units. */
const CLOTH_MARGIN = TILE_DEPTH * 3;

/**
 * The whole layout as one `<svg>`, the tiles in `cells` where they lie (a face letter a slot, "." for one taken). Null
 * for a size with no layout or cells of the wrong length.
 */
export function layoutSvg(size: number, cells: string, options: LayoutSvgOptions = {}): string | null {
  const layout = layoutFor(size);
  const box = layoutBox(size);
  if (layout === null || box === null || cells.length !== layout.slots.length) return null;
  const { chosen = null, hinted = [], matching = [], marked = [], found, showFree = false, hideBlocked = false, prefix = "jarajara", design, redFives = false, symbols = true } = options;
  const mirror: TileMirror = isTileMirror(options.mirror) ? options.mirror : "none";
  const direction = directionOf(mirror);
  const geometry = geometryOf(layout);
  const extent = layoutExtent(layout);
  const layers = extent.layers;
  const { width: w, height: h } = TILE_SIZE;
  const colours = blockColours(design);
  const faceColour = tileColours(design).face;
  const hasBody = tileBodySvg(design) !== null;
  const red = redFives && design?.red !== undefined ? redFiveIndexes(options.redFrom ?? cells) : new Set<number>();
  const order = layout.slots.map((slot, index) => ({ slot, index })).sort((a, b) => a.slot.z - b.slot.z || a.slot.y - b.slot.y || b.slot.x - a.slot.x);
  const freeFound = new Set(found?.free ?? []);
  const blockedFound = new Set(found?.blocked ?? []);
  const id = `${prefix}-blk-${design?.name ?? "jarajara"}-${direction.x > 0 ? "r" : "l"}${direction.y > 0 ? "u" : "d"}`;
  const ring = (inset: number, extra: string) => `<rect x="${inset}" y="${inset}" width="${w - 2 * inset}" height="${h - 2 * inset}" rx="2.5" fill="none" ${extra}/>`;
  const tiles = order.map(({ slot, index }) => {
    const code = cells[index]!;
    const face = faceOf(code);
    if (code === EMPTY_SLOT || face === null) return "";
    const at = tileAt(slot, layers, mirror, extent);
    const free = isFree(geometry, cells, index);
    const isChosen = chosen === index;
    const blank = hideBlocked && !free;
    const symbol = red.has(index) ? `${prefix}-${code}-red` : `${prefix}-${code}`;
    const parts = [
      `<use href="#${id}-s${Math.min(slot.z, 4)}" pointer-events="none"/>`,
      `<use href="#${id}"/>`,
      hasBody
        ? `<use href="#${prefix}-body" width="${w}" height="${h}"/>${isChosen ? `<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="${TILE_MARKS.chosen}" opacity="0.6"/>` : ""}`
        : `<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="${isChosen ? TILE_MARKS.chosen : faceColour}"/>`,
      `<use href="#${id}-e" pointer-events="none"/>`,
      blank ? "" : `<use href="#${symbol}" width="${w}" height="${h}"/>`,
      showFree && !free ? `<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="${TILE_MARKS.blockedWash}"/>` : "",
      matching.includes(index) ? ring(1, `stroke="${TILE_MARKS.chosenRing}" stroke-width="1.4" stroke-dasharray="3 2"`) : "",
      freeFound.has(index) ? `<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="${TILE_MARKS.found}" opacity="0.24"/>${ring(1, `stroke="${TILE_MARKS.found}" stroke-width="2.4"`)}` : "",
      blockedFound.has(index) ? `<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="${TILE_MARKS.found}" opacity="0.1"/>${ring(1.6, `stroke="${TILE_MARKS.found}" stroke-width="1.3" stroke-dasharray="1.6 1.6"`)}` : "",
      marked.includes(index) ? `${ring(1, `stroke="${TILE_MARKS.gold}" stroke-width="2"`)}<circle cx="${w - 5}" cy="5" r="3.2" fill="${TILE_MARKS.gold}" stroke="#fff" stroke-width="0.8"/>` : "",
      hinted.includes(index) ? ring(1, `stroke="${TILE_MARKS.hinted}" stroke-width="2.6"`) : "",
      isChosen ? ring(1, `stroke="${TILE_MARKS.chosenRing}" stroke-width="2.6"`) : "",
    ];
    const name = blank ? "tile, blank" : faceWords(face);
    return `<g transform="translate(${at.x} ${at.y})" data-slot="${index}" data-face="${blank ? "" : code}" data-free="${free}" role="button" aria-label="${name}${free ? "" : ", blocked"}"${isChosen ? ` aria-pressed="true"` : ""}>${parts.join("")}</g>`;
  });
  const left = [...cells].filter((code) => code !== EMPTY_SLOT).length;
  const cloth = isCloth(options.cloth) ? options.cloth : null;
  const framed = options.margin === undefined ? null : layoutFrame(size, { mirror, margin: options.margin });
  const view = framed ?? { x: 0, y: 0, width: box.width, height: box.height };
  const margin = cloth === null ? 0 : CLOTH_MARGIN;
  const felt = cloth === null ? "" : `<rect x="${view.x - margin}" y="${view.y - margin}" width="${view.width + 2 * margin}" height="${view.height + 2 * margin}" rx="${margin}" fill="${JARAJARA_CLOTHS[cloth].felt}" data-cloth="${cloth}"/>`;
  const faces = symbols ? tileFaceSymbols(prefix, { design, red: red.size > 0 }) : "";
  // The block, its shadow for each layer in use, and the edge laid over a face are drawn once and placed with a <use>.
  const used = new Set(layout.slots.map((slot) => Math.min(slot.z, 4)));
  const defs = `<defs><g id="${id}">${blockSvg(colours, direction)}</g><g id="${id}-e">${faceEdgeSvg(colours)}</g>${[...used].map((z) => `<g id="${id}-s${z}">${shadowSvg(colours, direction, z)}</g>`).join("")}</defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.x - margin} ${view.y - margin} ${view.width + 2 * margin} ${view.height + 2 * margin}" role="group" aria-label="Mahjong layout, ${left} tiles left" style="user-select:none;-webkit-user-select:none">${faces}${defs}${felt}${tiles.join("")}</svg>`;
}
