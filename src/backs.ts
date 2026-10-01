import type { TileDesign } from "./design.types.ts";
import { tileBackDrawing, TILE_BODY, TILE_FONT } from "./faces.ts";

/**
 * THE BACKS OF THE TILES, drawn as SVG in the tile's own 30 by 40: what a tile lying face down shows. Five are drawn
 * here, each in the colours a real set's backs are made in: `jade`, the green of most sets, with a lattice; `bamboo`,
 * the colour of the bamboo that old sets were backed with, with its grain and nodes; `blue` and `red`, flat colours
 * with a ring; and `ink`, near black with a field of dots. A design brings its own as well (`riichi`, `riichi-black`),
 * named like the design. Any of the five may be given a colour of its own and a few letters of writing.
 */
export const TILE_BACKS = ["jade", "bamboo", "blue", "red", "ink"] as const;

/** A back's name: one of the five drawn here, or a design's own (`riichi`, `riichi-black`). */
export type TileBackName = (typeof TILE_BACKS)[number] | (string & {});

/** How a back is drawn. Every field may be left out. */
export type TileBackOptions = {
  /** The back's colour as `#rgb` or `#rrggbb`, in place of its own; its lines are worked out from it. */
  colour?: string;
  /** A few letters written across the middle of it, a site's name: at most 8 are drawn. */
  mark?: string;
  /** What a screen reader says. Unless said, "tile, face down". An empty string makes the picture decoration. */
  title?: string;
  /** A design whose own back is drawn, for the names a design brings (`riichi`). */
  design?: TileDesign;
};

type Look = { base: string; line: string; kind: "lattice" | "grain" | "ring" | "dots" };

const LOOKS: Record<(typeof TILE_BACKS)[number], Look> = {
  jade: { base: "#2f7a5a", line: "#a6d6bd", kind: "lattice" },
  bamboo: { base: "#d9b774", line: "#a07a3b", kind: "grain" },
  blue: { base: "#2a5ea8", line: "#b5cdf0", kind: "ring" },
  red: { base: "#b23a33", line: "#f2bdb7", kind: "ring" },
  ink: { base: "#26282d", line: "#8d919b", kind: "dots" },
};

/** Whether a name is one of the five backs drawn here. */
export function isBuiltInBack(name: string): name is (typeof TILE_BACKS)[number] {
  return (TILE_BACKS as readonly string[]).includes(name);
}

function rgb(text: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text.trim());
  if (hex === null) return null;
  const full = hex[1]!.length === 3 ? [...hex[1]!].map((digit) => digit + digit).join("") : hex[1]!;
  return [0, 2, 4].map((at) => parseInt(full.slice(at, at + 2), 16)) as [number, number, number];
}

function mix(from: [number, number, number], to: [number, number, number], share: number): string {
  return `#${from.map((value, at) => Math.round(value + (to[at]! - value) * share).toString(16).padStart(2, "0")).join("")}`;
}

/** The colours of a back, with a colour of the caller's laid over it: a light line on a dark colour, a dark one on a light. */
function lookOf(name: (typeof TILE_BACKS)[number], colour: string | undefined): Look {
  const own = LOOKS[name];
  const parsed = colour === undefined ? null : rgb(colour);
  if (parsed === null) return own;
  const light = (0.299 * parsed[0] + 0.587 * parsed[1] + 0.114 * parsed[2]) / 255 > 0.58;
  return { ...own, base: mix(parsed, parsed, 0), line: light ? mix(parsed, [0, 0, 0], 0.4) : mix(parsed, [255, 255, 255], 0.6) };
}

const round = (value: number): string => String(Math.round(value * 100) / 100);

function pattern(name: string, look: Look): string {
  const stroke = `fill="none" stroke="${look.line}"`;
  const inset = `<rect x="2.4" y="2.4" width="25.2" height="35.2" rx="1.8" ${stroke} stroke-width="0.7"/>`;
  switch (look.kind) {
    case "lattice": {
      const lines: string[] = [];
      for (let c = -30; c <= 70; c += 5) {
        lines.push(`<line x1="${c}" y1="0" x2="${c + 40}" y2="40"/><line x1="${c + 40}" y1="0" x2="${c}" y2="40"/>`);
      }
      return `${inset}<clipPath id="jjb-${name}"><rect x="3.2" y="3.2" width="23.6" height="33.6" rx="1.2"/></clipPath><g clip-path="url(#jjb-${name})" stroke="${look.line}" stroke-width="0.45" opacity="0.7">${lines.join("")}</g>`;
    }
    case "grain": {
      const xs = [4.5, 8, 11.6, 15, 18.5, 22, 25.5];
      const grain = xs.map((x, at) => `<line x1="${x}" y1="${4 + (at % 3)}" x2="${x + ((at % 2) - 0.5)}" y2="${36 - (at % 4)}"/>`).join("");
      return `<g stroke="${look.line}" stroke-width="0.5" opacity="0.8">${grain}</g><g stroke="${look.line}" stroke-width="1.3" stroke-linecap="round"><line x1="2.5" y1="13" x2="27.5" y2="13"/><line x1="2.5" y1="27" x2="27.5" y2="27"/></g>`;
    }
    case "ring":
      return `${inset}<circle cx="15" cy="20" r="8.5" ${stroke} stroke-width="1.1"/><circle cx="15" cy="20" r="3.2" fill="${look.line}"/><g stroke="${look.line}" stroke-width="0.8"><line x1="15" y1="8" x2="15" y2="9.6"/><line x1="15" y1="30.4" x2="15" y2="32"/><line x1="3" y1="20" x2="4.6" y2="20"/><line x1="25.4" y1="20" x2="27" y2="20"/></g>`;
    case "dots": {
      const dots: string[] = [];
      for (let y = 6; y <= 35; y += 5.8) for (let x = 6; x <= 25; x += 6) dots.push(`<circle cx="${x + (Math.round(y / 5.8) % 2 === 0 ? 0 : 3)}" cy="${round(y)}" r="0.9"/>`);
      return `${inset}<g fill="${look.line}" opacity="0.85">${dots.join("")}</g>`;
    }
  }
}

function markOf(text: string | undefined, look: Look): string {
  const letters = (text ?? "").trim().slice(0, 8);
  if (letters === "") return "";
  const size = Math.min(7.5, 21 / Math.max(1, letters.length) + 1.2);
  const plate = Math.max(8, letters.length * size * 0.62 + 2.6);
  const safe = letters.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<rect x="${round(15 - plate / 2)}" y="${round(20 - size * 0.8)}" width="${round(plate)}" height="${round(size * 1.6)}" rx="1" fill="${look.base}" opacity="0.88"/><text x="15" y="${round(20 + size * 0.34)}" font-size="${round(size)}" font-weight="700" fill="${look.line}" text-anchor="middle" font-family="${TILE_FONT}" style="user-select:none;-webkit-user-select:none">${safe}</text>`;
}

/**
 * A back's plate and pattern in the tile's 30 by 40, without the sliver of side or the `<svg>`: the inside of a
 * `<symbol>`, or the back an element puts behind a tile it turns over. For a name that is no back drawn here, the
 * `design` given (its own back), and otherwise the jade one.
 */
export function tileBackFace(name: TileBackName = "jade", options: TileBackOptions = {}): string {
  if (!isBuiltInBack(name)) {
    if (options.design !== undefined) return tileBackDrawing(options.design);
    return tileBackFace("jade", options);
  }
  const look = lookOf(name, options.colour);
  const rim = rgb(look.base) === null ? look.line : mix(rgb(look.base)!, [0, 0, 0], 0.35);
  return `<rect x="0" y="0" width="30" height="40" rx="3" fill="${look.base}" stroke="${rim}" stroke-width="0.8"/>${pattern(name, look)}${markOf(options.mark, look)}`;
}

/**
 * One tile's back on its own, as a whole `<svg>` in the same box as `tileSvg`: the back with a sliver of the tile's
 * side. Null for a name that is no back drawn here and no `design` to bring it.
 */
export function tileBackSvg(name: TileBackName = "jade", options: TileBackOptions = {}): string | null {
  if (!isBuiltInBack(name) && options.design === undefined) return null;
  const said = options.title ?? "tile, face down";
  const named = said === "" ? ` aria-hidden="true"` : ` role="img" aria-label="${said}"`;
  const side = !isBuiltInBack(name) && options.design !== undefined ? options.design.colours.side : TILE_BODY.side;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 32 42"${named} data-back="${name}">` +
    `<rect x="-0.5" y="-0.5" width="31" height="41" rx="3" fill="${side}"/>` +
    `${tileBackFace(name, options)}</svg>`
  );
}
