/**
 * What Jarajara's custom elements share: a base class that is safe to define on a server, the designs and backs each
 * element may name (a design fetched the first time one asks), the language an element speaks, the cloth it may be laid
 * on, and the drawing of one tile face up or face down.
 */
import { tileBackSvg, isBuiltInBack } from "../backs.ts";
import { clothVars, isCloth } from "../cloth.ts";
import type { TileDesign } from "../design.types.ts";
import { isTileDesignName, jarajaraDesign, loadTileDesign } from "../designs.ts";
import { tileSvg } from "../faces.ts";
import { findFace, tileName, type TileLanguage } from "../names.ts";
import { STRINGS, fillIn } from "./strings.ts";

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

/** One tile's drawing as an element puts it in the page: its face, or its back. Decoration: the element names it. */
export function tileDrawing(code: string, faceDown: boolean, element: Element, design: TileDesign | null, red = false): string {
  if (faceDown) {
    const back = backFor(element, design);
    return tileBackSvg(back.name, { ...back, title: "" }) ?? "";
  }
  // A design still being fetched draws nothing yet; the element draws again when it arrives.
  if (design === null) return "";
  return tileSvg(code, { design, red, title: "" }) ?? "";
}

/** Lay an element on its cloth: the custom properties of the cloth named by `cloth`, and none, so the page's own, for no cloth. */
export function wearCloth(element: HTMLElement): void {
  const name = element.getAttribute("cloth");
  for (const property of ["--jarajara-felt", "--jarajara-felt-deep", "--jarajara-felt-ink"]) element.style.removeProperty(property);
  for (const [property, value] of Object.entries(clothVars(name))) element.style.setProperty(property, value);
  element.toggleAttribute("data-cloth", isCloth(name));
  if (isCloth(name)) element.dataset.cloth = name;
}

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
export const MARKER_STYLE = `.marker { position: absolute; left: -6%; top: -4%; width: 24%; aspect-ratio: 1; border-radius: 50%; background: var(--jarajara-marker, #f2b134); box-shadow: 0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.45); pointer-events: none; }`;

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

/** The aspect of a tile's picture, with the sliver of its side: 32 by 42 in the drawing's units. */
export const TILE_ASPECT = "32 / 42";
