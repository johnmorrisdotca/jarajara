/**
 * What Jarajara's custom elements share: a base class that is safe to define on a server, the designs and backs each
 * element may name (a design fetched the first time one asks), the language an element speaks, the cloth it may be laid
 * on, and the drawing of one tile face up or face down.
 */
import { backBase, tileBackSvg, isBuiltInBack } from "../backs.ts";
import { blockColours, TILE_DEPTH } from "../block.ts";
import { clothVars, isCloth } from "../cloth.ts";
import type { TileDesign } from "../design.types.ts";
import { isTileDesignName, jarajaraDesign, loadTileDesign } from "../designs.ts";
import { tileSvg } from "../faces.ts";
import { findFace, tileName, type TileLanguage } from "../names.ts";
import { STRINGS, fillIn } from "./strings.ts";
import { createTileSounds, type PlayTileSoundOptions, type TileSoundKind, type TileSounds } from "./tileSounds.ts";

/** What the elements extend: HTMLElement, or on a server, where there is none, an empty class, so that importing them never throws. */
export const ElementBase: typeof HTMLElement = typeof HTMLElement === "undefined" ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

/** Define an element's tag unless it is already defined, or there is no page to define it on. */
export function defineElement(tag: string, element: CustomElementConstructor): void {
  if (typeof customElements !== "undefined" && customElements.get(tag) === undefined) customElements.define(tag, element);
}

const loadedDesigns = new Map<string, TileDesign | null>();
const loadingDesigns = new Map<string, Promise<TileDesign | null>>();

/**
 * A design as an element names it: `jarajara` at once, any other named design once it has been fetched, and until then
 * `null`, with `ready` settling when it arrives. A name that is no design is Jarajara's own.
 */
export function designNamed(name: string | null): { design: TileDesign | null; ready: Promise<unknown> | null } {
  if (name === null || name === "jarajara" || !isTileDesignName(name)) return { design: jarajaraDesign(), ready: null };
  const loaded = loadedDesigns.get(name);
  if (loaded !== undefined && loaded !== null) return { design: loaded, ready: null };
  if (!loadingDesigns.has(name)) loadingDesigns.set(name, loadTileDesign(name).then((design) => (loadedDesigns.set(name, design), design)));
  return { design: null, ready: loadingDesigns.get(name) as Promise<TileDesign | null> };
}

/** The language an element speaks: its own `lang`, or the nearest one above it, or the page's; Japanese for anything that starts `ja`. */
export function languageOf(element: Element): TileLanguage {
  const tag = element.closest("[lang]")?.getAttribute("lang") ?? (typeof document === "undefined" ? "" : document.documentElement.lang);
  return String(tag).toLowerCase().startsWith("ja") ? "ja" : "en";
}

/** The words an element says in its language, with the values filled in. */
export function say(language: TileLanguage, key: string, values: Record<string, string | number> = {}): string {
  return fillIn(STRINGS[language][key] ?? key, values);
}

/** A tile's code as an element writes it: a code, or any name a tile goes by (`east`, `3p`); null for what is no tile. */
export function codeOf(text: string | null): string | null {
  return text === null ? null : (findFace(text)?.code ?? null);
}

/** The sizes every element takes, as a tile's width in pixels. */
export const ELEMENT_SIZES = { small: 32, medium: 48, large: 72 } as const;

/** An element's tile width in CSS: its `width` in pixels, or its `size`, or the page's `--jarajara-tile-width`, or medium. */
export function widthOf(element: Element): string {
  const width = Number(element.getAttribute("width"));
  if (Number.isFinite(width) && width > 0) return `${Math.min(600, width)}px`;
  const size = element.getAttribute("size") as keyof typeof ELEMENT_SIZES | null;
  if (size !== null && size in ELEMENT_SIZES) return `${ELEMENT_SIZES[size]}px`;
  return `var(--jarajara-tile-width, ${ELEMENT_SIZES.medium}px)`;
}

/**
 * LET A FRAMEWORK SET AN ATTRIBUTE THAT IS ALSO A METHOD. React, Vue and Svelte set a property, not an attribute, on a
 * custom element that has one of the name (`<jarajara-tile flip>` is `tile.flip = true`), and `flip` is a method too, so
 * the assignment would replace the method and leave the attribute unset. This makes the name an accessor: reading it
 * still gives the method, so `tile.flip()` goes on working, and writing it sets the attribute (`true` or `""` turns it
 * on, `false`, `null` and `undefined` take it away, any other value is the attribute's text).
 */
export function reflectMethod(element: { prototype: object }, name: string): void {
  const method = (element.prototype as Record<string, unknown>)[name];
  Object.defineProperty(element.prototype, name, {
    configurable: true,
    get() {
      return method;
    },
    set(this: Element, value: unknown) {
      if (value === false || value === null || value === undefined) this.removeAttribute(name);
      else this.setAttribute(name, value === true ? "" : String(value));
    },
  });
}

/** Whether the person has asked their device for less motion. */
export function lessMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** An attribute that is on when present, unless it says "false", "off", "0" or "no". */
export function isOn(element: Element, name: string): boolean {
  const value = element.getAttribute(name);
  return value !== null && !["false", "off", "0", "no"].includes(value.toLowerCase());
}

const speakers = new Set<() => void>();
let listening: MutationObserver | null = null;
/**
 * Redraw an element when the page changes its language (`<html lang>`), as a language chooser does, until the function
 * returned is called. One watcher serves every element on the page.
 */
export function followLanguage(redraw: () => void): () => void {
  speakers.add(redraw);
  if (listening === null && typeof MutationObserver !== "undefined" && typeof document !== "undefined") {
    listening = new MutationObserver(() => {
      for (const one of [...speakers]) one();
    });
    listening.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  return () => speakers.delete(redraw);
}

/** The back an element draws: the one named by `back`, or the design's own (jade for Jarajara's), with the colour and mark it was given. */
export function backFor(element: Element, design: TileDesign | null): { name: string; design?: TileDesign; colour?: string; mark?: string } {
  const asked = element.getAttribute("back");
  const colour = element.getAttribute("back-colour") ?? undefined;
  const mark = element.getAttribute("mark") ?? undefined;
  const extras = { ...(colour === undefined ? {} : { colour }), ...(mark === undefined ? {} : { mark }) };
  if (asked !== null && isBuiltInBack(asked)) return { name: asked, ...extras };
  // A back named for a design is that design's own, once the design is here.
  if (asked !== null && isTileDesignName(asked) && asked !== "jarajara") {
    const wanted = designNamed(asked).design;
    return wanted === null ? { name: "jade", ...extras } : { name: asked, design: wanted, ...extras };
  }
  if (design !== null && design.name !== "jarajara") return { name: design.name, design, ...extras };
  return { name: "jade", ...extras };
}

/** What a screen reader says for a tile: its name, or that it is face down. */
export function tileLabel(code: string, faceDown: boolean, language: TileLanguage): string {
  return faceDown ? say(language, "tileFaceDown") : tileName(code, language);
}

/** One tile's drawing as an element puts it in the page: its face, or its back, alone (`bare`), for the element's block to give it thickness. Decoration: the element names it. */
export function tileDrawing(code: string, faceDown: boolean, element: Element, design: TileDesign | null, red = false): string {
  if (faceDown) {
    const back = backFor(element, design);
    return tileBackSvg(back.name, { ...back, title: "", bare: true }) ?? "";
  }
  // A design still being fetched draws nothing yet; the element draws again when it arrives.
  if (design === null) return "";
  return tileSvg(code, { design, red, title: "", bare: true }) ?? "";
}

/** Lay an element on its cloth: the custom properties of the cloth named by `cloth`, and none, so the page's own, for no cloth. */
export function wearCloth(element: HTMLElement): void {
  const name = element.getAttribute("cloth");
  for (const property of ["--jarajara-felt", "--jarajara-felt-deep", "--jarajara-felt-ink"]) element.style.removeProperty(property);
  for (const [property, value] of Object.entries(clothVars(name))) element.style.setProperty(property, value);
  element.toggleAttribute("data-cloth", isCloth(name));
  if (isCloth(name)) element.dataset.cloth = name;
}

/** The margin round the tiles' drawn extent, in the face's units: a little air so a ring or a shadow is never cut by the frame. */
export const FRAME_MARGIN = 3;

/** A `box` attribute as a CSS aspect ratio: `3/2`, `1.5`, or a name; null for nothing (the board then takes the height its layout gives it). */
export function boxOf(text: string | null): string | null {
  if (text === null) return null;
  const named = { landscape: "3 / 2", portrait: "2 / 3", square: "1 / 1" }[text.trim().toLowerCase() as "landscape" | "portrait" | "square"];
  if (named !== undefined) return named;
  const parts = text.split("/").map((part) => Number(part.trim()));
  const [across, down = 1] = parts;
  return parts.length <= 2 && across !== undefined && Number.isFinite(across) && across > 0 && Number.isFinite(down) && down > 0 ? `${across} / ${down}` : null;
}

/**
 * THE FRAME EVERY BOARD SITS IN, on a cloth: an inner panel inside the felt with a rim, a little dark inside, and one
 * padding all round (`--jarajara-pad`), so that tiles are always the same distance from the frame whichever layout is on
 * it. The picture is drawn on its tiles' drawn extent (`layoutFrame`), so it is centred on what the eye sees. With `box`
 * the board is one steady box, the layout scaled to fit it and centred in it.
 */
export const FRAME_STYLE = `
.frame { box-sizing: border-box; }
:host([data-cloth]) .frame { border: 1.5px solid color-mix(in srgb, var(--jarajara-felt-ink, #f3efe4) 30%, transparent); border-radius: 10px; padding: var(--jarajara-pad, 14px); background: rgba(0,0,0,.12); box-shadow: inset 0 2px 10px rgba(0,0,0,.22); }
.board { width: 100%; margin: 0 auto; touch-action: manipulation; }
.board svg { display: block; width: 100%; height: auto; }
.board[data-box="fixed"] svg { height: 100%; }
`;

/** The look of a cloth under an element, for every element that has one: the felt, its deep edge, and the ink written on it. */
export const CLOTH_STYLE = `
:host([data-cloth]) { background: radial-gradient(120% 90% at 50% 20%, var(--jarajara-felt) 0%, var(--jarajara-felt-deep) 100%); color: var(--jarajara-felt-ink); border-radius: 12px; padding: 10px; box-sizing: border-box; }
`;

/**
 * A MARK ON A TILE, to follow it while it is face down and moves about: a round dot on its top left corner, the same
 * face up and face down, since it is drawn on the tile and not on either side. `--jarajara-marker` colours it.
 */
export function markerHtml(marked: boolean): string {
  return marked ? '<div class="marker" part="marker" aria-hidden="true"></div>' : "";
}

/** The mark's look, for every element that draws one. */
export const MARKER_STYLE = `.marker { position: absolute; left: 9%; top: -3%; width: 24%; aspect-ratio: 1; border-radius: 50%; background: var(--jarajara-marker, #f2b134); box-shadow: 0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.45); pointer-events: none; }`;

/** How a tile is spun. */
export type SpinOptions = {
  /** Which way it spins. Unless said, clockwise. */
  direction?: "clockwise" | "anticlockwise";
  /** How many whole turns before it comes to rest where it lay. Unless said, 3; at most 20. */
  turns?: number;
  /** How long the spin takes, in milliseconds. Unless said, 700 and 420 a turn. */
  ms?: number;
};

/**
 * A TILE SPUN ON THE TABLE, as a flick sets a real one turning: fast at first, then slowed by the cloth until it stops,
 * a whole number of turns later, lying as it was. `delay` starts it a little after the others where several spin. Settles
 * at once on a device that asks for less motion, and when the spin is cut short.
 */
export function spinElement(element: HTMLElement, options: SpinOptions = {}, delay = 0): Promise<void> {
  if (lessMotion() || typeof element.animate !== "function") return Promise.resolve();
  const turns = Math.min(20, Math.max(1, Math.round(Number.isFinite(options.turns) ? (options.turns as number) : 3)));
  const sign = options.direction === "anticlockwise" ? -1 : 1;
  const ms = Number.isFinite(options.ms) && (options.ms as number) > 0 ? (options.ms as number) : 700 + 420 * turns;
  const run = element.animate([{ transform: "rotate(0deg)" }, { transform: `rotate(${sign * 360 * turns}deg)` }], { duration: ms, delay, easing: "cubic-bezier(.06, .72, .2, 1)" });
  return run.finished.then(
    () => undefined,
    () => undefined,
  );
}

/** The aspect of a tile's picture, face and thickness: 37 by 47 in the drawing's units (`TILE_BOX`). */
export const TILE_ASPECT = "37 / 47";

/** The width of a tile's box in the drawing's units, the unit the turning block is sized in. */
export const BOX_UNITS = 37;

/** How thick a turning block is, as a share of a face's width: a real tile is about this fat, so edge on it reads as a slab. */
export const BLOCK_THICKNESS = 0.45;

/**
 * The colours a turning block's edges are drawn in, as custom properties for the element that holds it: the ivory layer,
 * the line between it and the back plate, and the back plate, which is the back's own colour where the back is drawn
 * here and the design's `body` otherwise.
 */
export function blockVars(element: Element, design: TileDesign | null): string {
  const back = backFor(element, design);
  const colours = blockColours(design ?? undefined, backBase(back.name, back) ?? undefined);
  return `--jj-lip:${colours.lip};--jj-lip-edge:${colours.lipEdge};--jj-body:${colours.body};--jj-body-edge:${colours.bodyEdge};--jj-seam:${colours.seam}`;
}

/**
 * The inside of a turning tile: its face and its back as two planes a block's thickness apart, and the four edges between
 * them. Put in a box whose `--u` is a drawing unit in pixels (the box is `BOX_UNITS` of them across), under `BLOCK_STYLE`.
 */
export function blockHtml(face: string, back: string): string {
  return `<div class="ground"></div><div class="shear"><div class="turn"><div class="plane side face" part="face">${face}</div><div class="plane side back" part="back">${back}</div><div class="plane edge e-l"></div><div class="plane edge e-r"></div><div class="plane edge e-t"></div><div class="plane edge e-b"></div></div></div>`;
}

/**
 * HOW A TURNING TILE LOOKS: a real block, turned about its upright axis. The planes are in 3D, the block is seen as the
 * layouts draw it (its thickness on the left and below, by an oblique shear of exactly `TILE_DEPTH` units over the whole
 * thickness), so at rest it is the picture the layouts draw, and as it turns the edges swing round, ivory layer and back
 * plate together, and the tile tips over on its edge showing it. Under `prefers-reduced-motion` the turn is left out.
 */
const T = `calc(var(--u) * ${30 * BLOCK_THICKNESS})`;
export const BLOCK_STYLE = `
.ground { position: absolute; left: calc(var(--u) * 1); top: calc(var(--u) * 6); width: calc(var(--u) * 30); height: calc(var(--u) * 40); border-radius: calc(var(--u) * 3); box-shadow: calc(var(--u) * -1) calc(var(--u) * 1.4) calc(var(--u) * 2.4) rgba(0,0,0,.34); pointer-events: none; }
.shear { position: absolute; left: calc(var(--u) * ${18.5}); top: calc(var(--u) * ${23.5}); width: 0; height: 0; transform-style: preserve-3d; transform: matrix3d(1,0,0,0, 0,1,0,0, ${(TILE_DEPTH / (30 * BLOCK_THICKNESS)).toFixed(4)},${(-TILE_DEPTH / (30 * BLOCK_THICKNESS)).toFixed(4)},1,0, 0,0,0,1); }
.turn { position: absolute; left: 0; top: 0; width: 0; height: 0; transform-style: preserve-3d; transition: transform var(--jarajara-flip-ms, 520ms) cubic-bezier(.45, .1, .25, 1) var(--delay, 0ms); }
.plane { position: absolute; }
.side { left: calc(var(--u) * -15); top: calc(var(--u) * -20); width: calc(var(--u) * 30); height: calc(var(--u) * 40); backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.side svg { display: block; width: 100%; height: 100%; }
.face { transform: translateZ(calc(${T} / 2)); }
.back { transform: rotateY(180deg) translateZ(calc(${T} / 2)); }
.edge { box-shadow: inset 0 0 0 .5px var(--jj-body-edge, #1d4a38); }
.e-l, .e-r { left: calc(${T} / -2); top: calc(var(--u) * -20); width: ${T}; height: calc(var(--u) * 40); }
.e-t, .e-b { left: calc(var(--u) * -15); top: calc(${T} / -2); width: calc(var(--u) * 30); height: ${T}; }
.e-l { transform: translateX(calc(var(--u) * -15)) rotateY(-90deg); background: linear-gradient(to right, var(--jj-body, #3a8a68) 0 40%, var(--jj-lip, #e9ddc2) 40% 100%); }
.e-r { transform: translateX(calc(var(--u) * 15)) rotateY(90deg); background: linear-gradient(to right, var(--jj-lip, #e9ddc2) 0 60%, var(--jj-body, #3a8a68) 60% 100%); filter: brightness(.82); }
.e-t { transform: translateY(calc(var(--u) * -20)) rotateX(90deg); background: linear-gradient(to bottom, var(--jj-body, #3a8a68) 0 40%, var(--jj-lip, #e9ddc2) 40% 100%); }
.e-b { transform: translateY(calc(var(--u) * 20)) rotateX(-90deg); background: linear-gradient(to bottom, var(--jj-lip, #e9ddc2) 0 60%, var(--jj-body, #3a8a68) 60% 100%); filter: brightness(.78); }
@media (prefers-reduced-motion: reduce) { .turn { transition: none; } }
`;

let sounds: TileSounds | null = null;
/** One set of sounds for every element on the page, made the first time an element with `sound` makes one. */
export function pageSounds(): TileSounds {
  sounds ??= createTileSounds();
  return sounds;
}

/**
 * Give every element on the page another player for its sounds: a page's own, or a test's stand-in that only records
 * what was asked. Pass `null` to go back to the package's own, made again when next needed.
 */
export function setPageSounds(next: TileSounds | null): void {
  if (next === null) sounds?.close();
  sounds = next;
  playing.length = 0;
}

/** The sounds begun and when each was due to end, so that a burst of changes cannot stack into a roar. */
const playing: { until: number; heard: number }[] = [];

/** The most clicks sounding at one moment, across every element on the page. */
export const MOST_SOUNDING = 12;

/** How long a sound is heard for after it starts, in milliseconds, on top of the spacing of a run of them. */
const SOUND_TAIL_MS = 180;

/**
 * Make a sound if the element has `sound`; nothing, and nothing fetched, if it does not. The page holds at most
 * `MOST_SOUNDING` clicks at once: a sound asked for while that many are still sounding is left out.
 */
export function playSound(element: Element, kind: TileSoundKind, options?: PlayTileSoundOptions): void {
  if (!isOn(element, "sound")) return;
  const now = typeof performance === "undefined" ? Date.now() : performance.now();
  for (let at = playing.length - 1; at >= 0; at -= 1) if (playing[at]!.until <= now) playing.splice(at, 1);
  const heard = Math.min(options?.count ?? 1, 8);
  if (playing.reduce((sum, one) => sum + one.heard, 0) + heard > MOST_SOUNDING) return;
  playing.push({ heard, until: now + (options?.delay ?? 0) + Math.max(0, (options?.count ?? 1) - 1) * (options?.gap ?? 85) + SOUND_TAIL_MS });
  pageSounds().play(kind, options);
}
