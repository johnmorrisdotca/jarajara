import { lightness, shade } from "./colour.ts";
import type { TileDesign } from "./design.types.ts";

/**
 * A TILE AS A SOLID BLOCK. A real tile is a slab: an ivory face laid over a darker back plate, with thickness you see
 * on two of its sides. Every drawing here treats it so, in the way the layouts of the established games do (see
 * docs/LOOK.md): the tile's thickness and the lift of each layer are ONE vector, so a tile on the next layer up is
 * exactly as far from the one below as the tile is thick, and the stacks read as stacks. The face is drawn in the tile's
 * own 30 by 40; the block is drawn behind it, from the face to the far side in `BLOCK_STEPS` steps, so that the
 * rounded corners stay round, with the ivory layer nearest the face and the back plate's own colour beyond it, and a
 * soft shadow under it that lengthens with the layer.
 */

/** How thick a tile is, and so how far each layer is lifted, in the face's units. */
export const TILE_DEPTH = 5;

/** The steps a block's thickness is drawn in: the first `LIP_STEPS` are the ivory layer, the rest the back plate. */
const BLOCK_STEPS = 5;
const LIP_STEPS = 3;

/** The ways a board may be looked at: as it is, turned left to right, turned top to bottom, or both. The rules never see it. */
export const TILE_MIRRORS = ["none", "horizontal", "vertical", "both"] as const;

/** One of the four views. */
export type TileMirror = (typeof TILE_MIRRORS)[number];

/** Whether a text names a view. */
export function isTileMirror(text: unknown): text is TileMirror {
  return typeof text === "string" && (TILE_MIRRORS as readonly string[]).includes(text);
}

/**
 * Which way a view lifts the layers and shows the thickness: `x` is 1 when each layer is lifted to the right (and the
 * thickness shows on the left), -1 the other way round; `y` is 1 when it is lifted upward (thickness below), -1 downward.
 */
export type BlockDirection = { x: 1 | -1; y: 1 | -1 };

/** The direction a view draws in. */
export function directionOf(mirror: TileMirror | undefined): BlockDirection {
  return { x: mirror === "horizontal" || mirror === "both" ? -1 : 1, y: mirror === "vertical" || mirror === "both" ? -1 : 1 };
}

/** The colours a block is drawn in. */
export type BlockColours = {
  /** The ivory layer's side, and the line between it and the back plate. */
  lip: string;
  lipEdge: string;
  /** The back plate's side, and its outline. */
  body: string;
  bodyEdge: string;
  /** The line round every face, which contrasts with it, so a row of tiles can be counted. */
  seam: string;
  /** The light line just inside it, which gives the face a raised edge. */
  bevel: string;
  /** The shadow a tile casts. */
  shadow: string;
};

/**
 * The colours of a design's blocks, from its own: the back plate is `colours.body` (the green of most real tiles unless
 * the design says another, or the caller's `body`), the ivory layer a shade of the face, and the seam round the face is the design's `rim` if it
 * stands out from the face, otherwise a line that does: darker on a light face, lighter on a dark one.
 */
export function blockColours(design?: TileDesign, body?: string): BlockColours {
  const colours = design?.colours ?? { face: "#fffdf6", rim: "#b9ad96", side: "#d9c59b", sideEdge: "#a8926a" };
  const face = colours.face;
  const dark = lightness(face) < 0.4;
  const plate = body ?? colours.body ?? (dark ? shade(face, -0.25) : "#3a8a68");
  const stands = Math.abs(lightness(face) - lightness(colours.rim)) >= 0.28;
  return {
    lip: dark ? shade(face, 0.2) : shade(face, -0.09),
    lipEdge: dark ? shade(face, 0.42) : shade(face, -0.32),
    body: plate,
    bodyEdge: lightness(plate) < 0.3 ? shade(plate, 0.3) : shade(plate, -0.5),
    seam: stands ? colours.rim : dark ? shade(face, 0.5) : shade(face, -0.45),
    bevel: dark ? shade(face, 0.36) : "#ffffff",
    shadow: "#14100a",
  };
}

/** The three layers a shadow is drawn in: how far along its reach each lies, how much wider than the tile, and how dark. */
export const SHADOW_LAYERS = [[0.35, 1, 0.16], [0.65, 2.2, 0.11], [1, 3.6, 0.07]] as const;

/** How far past the block's far side a shadow reaches for a tile on a layer: a little for one on the table, more the higher. */
export function shadowReach(layer: number): number {
  return 1.4 + layer * 1.2;
}

const num = (value: number): string => String(Math.round(value * 100) / 100);

/** A rounded tile-sized rectangle at an offset, in the face's own units. */
function slab(dx: number, dy: number, grow: number, attrs: string): string {
  return `<rect x="${num(dx - grow)}" y="${num(dy - grow)}" width="${num(30 + 2 * grow)}" height="${num(40 + 2 * grow)}" rx="${num(3 + grow)}" ${attrs}/>`;
}

/**
 * The shadow a tile casts on what lies under it: soft, in three widening layers, falling the way the thickness shows and
 * reaching further the higher the tile (`layer` 0 is a tile on the table: a tight contact shadow). Under the block.
 */
export function shadowSvg(colours: BlockColours, direction: BlockDirection, layer: number): string {
  const sx = -direction.x;
  const sy = direction.y;
  const reach = shadowReach(layer);
  return SHADOW_LAYERS.map(([along, grow, opacity]) => slab(sx * (TILE_DEPTH + reach * along), sy * (TILE_DEPTH + reach * along), grow, `fill="${colours.shadow}" opacity="${opacity}"`)).join("");
}

/**
 * The block drawn behind a face: the back plate and the ivory layer in steps from the far side to the face, and the
 * shading of the sides (the side the light falls on lighter, the other darker). The face is drawn over it by the caller.
 * For a tile seen from its back (`side: "back"`) the back plate is the near layer and the ivory the far one.
 */
export function blockSvg(colours: BlockColours, direction: BlockDirection, side: "face" | "back" = "face"): string {
  const sx = -direction.x;
  const sy = direction.y;
  const parts: string[] = [];
  for (let step = BLOCK_STEPS; step >= 1; step -= 1) {
    const at = (step / BLOCK_STEPS) * TILE_DEPTH;
    // Seen from the face the ivory layer is nearest; seen from the back it is the far one.
    const boundary = side === "face" ? LIP_STEPS : BLOCK_STEPS - LIP_STEPS;
    const lip = side === "face" ? step <= LIP_STEPS : step > boundary;
    const edge = step === BLOCK_STEPS ? ` stroke="${lip ? colours.lipEdge : colours.bodyEdge}" stroke-width="0.8"` : step === boundary ? ` stroke="${colours.lipEdge}" stroke-width="0.5"` : "";
    parts.push(slab(sx * at, sy * at, 0, `fill="${lip ? colours.lip : colours.body}"${edge}`));
  }
  // The sides' shading: a quad along each visible side, from the face's edge to the far side.
  const r = 3;
  const dx = sx * TILE_DEPTH;
  const dy = sy * TILE_DEPTH;
  const vx = sx < 0 ? 0 : 30;
  const hy = sy > 0 ? 40 : 0;
  const quad = (points: [number, number][], fill: string, opacity: number) => `<polygon points="${points.map(([x, y]) => `${num(x)},${num(y)}`).join(" ")}" fill="${fill}" opacity="${opacity}"/>`;
  parts.push(quad([[vx, r], [vx + dx, r + dy], [vx + dx, 40 - r + dy], [vx, 40 - r]], sx < 0 ? "#ffffff" : "#000000", sx < 0 ? 0.1 : 0.16));
  parts.push(quad([[r, hy], [r + dx, hy + dy], [30 - r + dx, hy + dy], [30 - r, hy]], sy > 0 ? "#000000" : "#ffffff", sy > 0 ? 0.24 : 0.1));
  return parts.join("");
}

/** The outline and the raised edge laid over a face, in the face's own units. */
export function faceEdgeSvg(colours: BlockColours): string {
  return `<rect x="0" y="0" width="30" height="40" rx="3" fill="none" stroke="${colours.seam}" stroke-width="0.9" pointer-events="none"/><rect x="1" y="1" width="28" height="38" rx="2.2" fill="none" stroke="${colours.bevel}" stroke-width="0.7" opacity="0.85" pointer-events="none"/>`;
}
