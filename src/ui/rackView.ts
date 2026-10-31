import {
  arrangeIndexes,
  arrangeTiles,
  groupStarts,
  TILE_ORDERS,
  type TileGrouping,
  type TileOrder,
} from "../arrange.ts";
import { redFiveIndexes } from "../designs.ts";
import { readTiles, tileName } from "../names.ts";
import {
  BLOCK_STYLE,
  BOX_UNITS,
  blockHtml,
  blockVars,
  CLOTH_STYLE,
  designNamed,
  ElementBase,
  isOn,
  languageOf,
  MARKER_STYLE,
  markerHtml,
  say,
  tileDrawing,
  tileLabel,
  wearCloth,
  widthOf,
  writeElementAttribute,
} from "./elementKit.ts";
import type { RackDetail, TileRef } from "./rackElement.ts";
import { RACK_LIFT, type RackPlace, rackPlaces, rackWidth, TILE_TALL } from "./rackLayout.ts";

/** How `<jarajara-rack>` reads its attributes and draws its tiles. Turning, sorting and dealing stay on `JarajaraRack`. */

const MOVE_MS = 460;

export const numbersIn = (text: string | null): number[] =>
  (text ?? "")
    .split(/[\s,]+/)
    .filter((word) => /^\d+$/.test(word))
    .map(Number);
export const writeNumbers = (list: Iterable<number>): string => [...new Set(list)].sort((a, b) => a - b).join(" ");

export abstract class RackView extends ElementBase {
  static get observedAttributes(): readonly string[] {
    return [
      "tiles",
      "order",
      "group",
      "face-down",
      "turned",
      "lifted",
      "marked",
      "pick",
      "capacity",
      "red-fives",
      "design",
      "back",
      "back-colour",
      "mark",
      "size",
      "width",
      "lang",
      "cloth",
      "sound",
      "theme",
      "label",
    ];
  }

  /** The `order` attribute, reflected without conversion. */
  get order(): string | null {
    return this.getAttribute("order");
  }
  set order(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "order", value);
  }

  /** The `face-down` attribute, reflected without conversion. */
  get "face-down"(): string | null {
    return this.getAttribute("face-down");
  }
  set "face-down"(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "face-down", value);
  }

  /** Property spelling of `face-down`. */
  get faceDown(): string | null {
    return this.getAttribute("face-down");
  }
  set faceDown(value: string | number | boolean | null | undefined) {
    writeElementAttribute(this, "face-down", value);
  }

  /** The `turned` attribute, reflected without conversion. */
  get turned(): string | null {
    return this.getAttribute("turned");
  }
  set turned(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "turned", value);
  }

  /** The `marked` attribute, reflected without conversion. */
  get marked(): string | null {
    return this.getAttribute("marked");
  }
  set marked(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "marked", value);
  }

  /** The `pick` attribute, reflected without conversion. */
  get pick(): string | null {
    return this.getAttribute("pick");
  }
  set pick(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "pick", value);
  }

  /** The `capacity` attribute, reflected without conversion. */
  get capacity(): string | null {
    return this.getAttribute("capacity");
  }
  set capacity(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "capacity", value);
  }

  /** The `red-fives` attribute, reflected without conversion. */
  get "red-fives"(): string | null {
    return this.getAttribute("red-fives");
  }
  set "red-fives"(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "red-fives", value);
  }

  /** Property spelling of `red-fives`. */
  get redFives(): string | null {
    return this.getAttribute("red-fives");
  }
  set redFives(value: string | number | boolean | null | undefined) {
    writeElementAttribute(this, "red-fives", value);
  }

  /** The `design` attribute, reflected without conversion. */
  get design(): string | null {
    return this.getAttribute("design");
  }
  set design(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "design", value);
  }

  /** The `back` attribute, reflected without conversion. */
  get back(): string | null {
    return this.getAttribute("back");
  }
  set back(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "back", value);
  }

  /** The `back-colour` attribute, reflected without conversion. */
  get "back-colour"(): string | null {
    return this.getAttribute("back-colour");
  }
  set "back-colour"(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "back-colour", value);
  }

  /** Property spelling of `back-colour`. */
  get backColour(): string | null {
    return this.getAttribute("back-colour");
  }
  set backColour(value: string | number | boolean | null | undefined) {
    writeElementAttribute(this, "back-colour", value);
  }

  /** The `size` attribute, reflected without conversion. */
  get size(): string | null {
    return this.getAttribute("size");
  }
  set size(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "size", value);
  }

  /** The `width` attribute, reflected without conversion. */
  get width(): string | null {
    return this.getAttribute("width");
  }
  set width(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "width", value);
  }

  /** The `cloth` attribute, reflected without conversion. */
  get cloth(): string | null {
    return this.getAttribute("cloth");
  }
  set cloth(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "cloth", value);
  }

  /** The `sound` attribute, reflected without conversion. */
  get sound(): string | null {
    return this.getAttribute("sound");
  }
  set sound(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "sound", value);
  }

  /** The `theme` attribute, reflected without conversion. */
  get theme(): string | null {
    return this.getAttribute("theme");
  }
  set theme(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "theme", value);
  }

  /** The `label` attribute, reflected without conversion. */
  get label(): string | null {
    return this.getAttribute("label");
  }
  set label(value: string | number | boolean | readonly number[] | null | undefined) {
    writeElementAttribute(this, "label", value);
  }

  protected root: ShadowRoot | null = null;
  protected forget: (() => void) | null = null;
  /** A number for each tile as dealt that stays with it through sorting, mixing and taking out, so it is seen to move. */
  protected ids: number[] = [];
  protected nextId = 1;
  protected stagger = 0;
  protected moving = false;
  protected batching = false;
  protected batched = false;
  /** Where each tile lay when last drawn, and which way it faced. */
  protected seen = new Map<number, RackPlace & { down: boolean }>();
  protected fresh = new Set<number>();
  protected settle: (() => void) | null = null;
  protected timer: ReturnType<typeof setTimeout> | null = null;
  protected told: string | null = null;
  protected pendingFocus: number | null = null;

  /** The tiles as dealt, as letters. Setting them, to a list of letters or to any text the attribute takes, lays the rack out afresh. */
  get tiles(): string[] {
    return readTiles(this.getAttribute("tiles"));
  }
  set tiles(tiles: string | readonly string[]) {
    this.setAttribute("tiles", typeof tiles === "string" ? tiles : tiles.join(""));
  }

  /** The letters of the tiles picked up. Setting it sets the `lifted` attribute, which names their places in `tiles`, from 0, as `"0 3"` or `[0, 3]`. */
  get lifted(): string[] {
    const tiles = this.tiles;
    return numbersIn(this.getAttribute("lifted")).flatMap((at) => (tiles[at] === undefined ? [] : [tiles[at]!]));
  }
  set lifted(places: string | readonly number[]) {
    this.setAttribute("lifted", typeof places === "string" ? places : places.join(" "));
  }

  /** The tiles as they lie now, left to right: sorted if the rack is. */
  get arranged(): string[] {
    return arrangeTiles(this.tiles, this.readOrder());
  }

  protected readOrder(): TileOrder {
    const asked = this.getAttribute("order") as TileOrder | null;
    return asked !== null && TILE_ORDERS.includes(asked) ? asked : "dealt";
  }

  protected readGrouping(): TileGrouping | null {
    const asked = this.getAttribute("group");
    return asked === "kind" || asked === "suit" ? asked : null;
  }

  /** The places of the tiles a reference names. */
  protected indexes(ref: TileRef): number[] {
    const tiles = this.tiles;
    const parts = typeof ref === "number" || typeof ref === "string" ? [ref] : ref;
    const found = new Set<number>();
    for (const part of parts) {
      if (typeof part === "number") {
        if (Number.isInteger(part) && part >= 0 && part < tiles.length) found.add(part);
        continue;
      }
      for (const code of readTiles(part))
        tiles.forEach((tile, at) => {
          tile === code && found.add(at);
        });
    }
    return [...found].sort((a, b) => a - b);
  }

  /** The state of the rack, read from its attributes. */
  protected readState() {
    return {
      down: isOn(this, "face-down"),
      turned: new Set(numbersIn(this.getAttribute("turned"))),
      lifted: new Set(numbersIn(this.getAttribute("lifted"))),
      marked: new Set(numbersIn(this.getAttribute("marked"))),
    };
  }

  protected finish(): void {
    const done = this.settle;
    this.settle = null;
    done?.();
  }

  /** Make sure every tile has an id: new ones where the tiles were set from outside. */
  protected reconcileIds(): void {
    const count = this.tiles.length;
    if (this.ids.length === count) return;
    this.ids = Array.from({ length: count }, () => this.nextId++);
    this.seen.clear();
  }

  protected draw(): void {
    const root = this.root as ShadowRoot;
    wearCloth(this);
    const theme = this.getAttribute("theme");
    this.style.colorScheme = theme === "dark" || theme === "light" ? theme : "light dark";
    const tiles = this.tiles;
    this.reconcileIds();
    const language = languageOf(this);
    const { design, ready } = designNamed(this.getAttribute("design"));
    if (ready !== null) void ready.then(() => this.draw());
    const state = this.readState();
    const order = this.readOrder();
    const grouping = this.readGrouping();
    const perm = arrangeIndexes(tiles, order);
    const shown = perm.map((at) => tiles[at]!);
    const breaks = grouping === null ? [] : groupStarts(shown, grouping);
    const places = rackPlaces(shown.length, {
      breaks,
      lifted: perm.map((at, place) => (state.lifted.has(at) ? place : -1)).filter((place) => place >= 0),
    });
    // ONE FRAME FOR EVERY STATE: the rack keeps the room its widest arrangement takes (grouped by suit), or the room of
    // `capacity` tiles, so grouping, closing the groups up and sorting never change its size, and each state lies in the middle.
    const capacity = Math.max(shown.length, Math.floor(Number(this.getAttribute("capacity")) || 0));
    // With a capacity, the room of that many tiles and the most gaps a set of seven suits can need; without, what these tiles take at most.
    const roomy =
      Math.floor(Number(this.getAttribute("capacity")) || 0) > 0
        ? rackWidth(rackPlaces(capacity, { breaks: [1, 2, 3, 4, 5, 6].filter((at) => at < capacity) }))
        : 0;
    const widest = Math.max(
      rackWidth(places),
      rackWidth(rackPlaces(shown.length, { breaks: groupStarts(arrangeTiles(tiles, "suit"), "suit") })),
      roomy,
    );
    const centred = (place: RackPlace, width: number): RackPlace => ({
      x: Math.round((place.x + (widest - width) / 2) * 1000) / 1000,
      y: place.y,
    });
    const width = rackWidth(places);
    const end = places.map((place) => centred(place, width));
    const moving = this.moving && this.seen.size > 0;
    const stagger = this.stagger;
    this.moving = false;
    this.stagger = 0;
    if (this.timer !== null) clearTimeout(this.timer);

    const downIn = (at: number) => (state.turned.has(at) ? !state.down : state.down);
    // What a screen reader hears: the tiles, or that they are face down and how many.
    const allDown = shown.length > 0 && perm.every((at) => downIn(at));
    this.setAttribute("role", "group");
    this.setAttribute(
      "aria-label",
      this.getAttribute("label") ??
        (shown.length === 0
          ? say(language, "rackEmpty")
          : allDown && state.marked.size === 0
            ? say(language, "rackFaceDown", { n: shown.length })
            : say(language, "rackLabel", {
                n: shown.length,
                tiles: perm.map((at) => tileLabel(tiles[at]!, downIn(at), language)).join(", "),
              })),
    );
    const reds = isOn(this, "red-fives") && design?.red !== undefined ? redFiveIndexes(shown) : new Set<number>();
    const start = perm.map((at, place) => {
      const id = this.ids[at]!;
      const was = this.seen.get(id);
      if (!moving) return end[place]!;
      if (was !== undefined) return { x: was.x, y: was.y };
      return { x: end[place]!.x, y: end[place]!.y - 1.1 };
    });
    const slots = perm.map((at, place) => {
      const id = this.ids[at]!;
      const down = downIn(at);
      const before = moving ? (this.seen.get(id)?.down ?? down) : down;
      const code = tiles[at]!;
      // A face is in the page only while it may show: never for a tile face down at both ends of a change.
      const face = !(before && down) ? tileDrawing(code, false, this, design, reds.has(place)) : "";
      const back = tileDrawing(code, true, this, design);
      const marked = state.marked.has(at);
      const lifted = state.lifted.has(at);
      const picks = isOn(this, "pick");
      const label = tileLabel(code, down, language);
      const said = marked
        ? say(language, "tileMarked", { tile: label })
        : lifted
          ? say(language, "tileLifted", { tile: label })
          : label;
      return `<div class="slot" part="tile" style="${blockVars(this, design)}" data-id="${id}" data-index="${at}" data-place="${place}" data-down="${before}" data-lifted="${lifted}" aria-label="${said}"${picks ? ` role="button" tabindex="0" aria-pressed="${lifted}"` : ` role="img"`}><div class="spin"><div class="tile">${blockHtml(face, back)}</div>${markerHtml(marked)}</div></div>`;
    });
    const across = Math.round((widest + 0.1) * 1000) / 1000;
    root.innerHTML = `<style>${RACK_STYLE}</style><div class="rack" part="rack" style="--across:${across}">${slots.join("")}</div>`;
    this.style.setProperty("--jarajara-w", widthOf(this));
    this.style.setProperty("--jarajara-across", String(across));
    const all = [...root.querySelectorAll<HTMLElement>(".slot")];
    const put = (slot: HTMLElement, spot: RackPlace, down: boolean) => {
      slot.style.setProperty("--x", String(spot.x));
      slot.style.setProperty("--y", String(spot.y));
      slot.dataset.down = String(down);
    };
    const finish = (): void => {
      this.seen = new Map(perm.map((at, place) => [this.ids[at]!, { ...end[place]!, down: downIn(at) }]));
      this.fresh.clear();
      this.announce();
      if (this.pendingFocus !== null) {
        this.root
          ?.querySelector<HTMLElement>(`.slot[data-index="${this.pendingFocus}"]`)
          ?.focus({ preventScroll: true });
        this.pendingFocus = null;
      }
    };
    all.forEach((slot, place) => {
      put(
        slot,
        start[place]!,
        moving ? (this.seen.get(this.ids[perm[place]!]!)?.down ?? downIn(perm[place]!)) : downIn(perm[place]!),
      );
    });
    if (!moving) {
      finish();
      this.finish();
      return;
    }
    const rack = root.querySelector(".rack") as HTMLElement;
    rack.dataset.moving = "true";
    void rack.offsetWidth;
    all.forEach((slot, place) => {
      slot.style.setProperty("--delay", `${stagger * place}ms`);
      put(slot, end[place]!, downIn(perm[place]!));
    });
    const length = MOVE_MS + stagger * Math.max(0, all.length - 1);
    this.timer = setTimeout(() => {
      this.timer = null;
      // Once still, drawn again where it lies: the faces of tiles face down leave the page.
      finish();
      this.draw();
      this.finish();
    }, length + 40);
    this.seen = new Map(perm.map((at, place) => [this.ids[at]!, { ...end[place]!, down: downIn(at) }]));
  }

  protected detail(): RackDetail {
    const state = this.readState();
    return {
      tiles: this.tiles,
      faceDown: state.down,
      turned: [...state.turned].sort((a, b) => a - b),
      lifted: [...state.lifted].sort((a, b) => a - b),
      marked: [...state.marked].sort((a, b) => a - b),
      order: this.readOrder(),
      group: this.readGrouping(),
    };
  }

  /** Tell the page of a change, once, and of the first drawing not at all. */
  protected announce(): void {
    const detail = this.detail();
    const now = JSON.stringify(detail);
    const first = this.told === null;
    if (now === this.told) return;
    this.told = now;
    if (first) return;
    this.dispatchEvent(new CustomEvent("jarajara-rack", { bubbles: true, composed: true, detail }));
  }

  /** The tiles as they lie, in words, for a screen reader. */
  get description(): string {
    const language = languageOf(this);
    const tiles = this.arranged;
    if (tiles.length === 0) return say(language, "rackEmpty");
    return say(language, "rackLabel", {
      n: tiles.length,
      tiles: tiles.map((code) => tileName(code, language)).join(", "),
    });
  }
}

const RACK_STYLE = `
:host { display: block; width: calc(var(--jarajara-w, 48px) * var(--jarajara-across, 1)); max-width: 100%; margin-inline: auto; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; container-type: inline-size; box-sizing: content-box; }
:host([hidden]) { display: none; }
.rack { --tw: min(var(--jarajara-w, 48px), calc(100cqw / var(--across))); position: relative; width: 100%; height: calc(var(--tw) * (${TILE_TALL} + 2 * ${RACK_LIFT} + .08)); }
.slot { position: absolute; left: calc(var(--tw) * (var(--x) + .05)); top: calc(var(--tw) * (var(--y) + ${RACK_LIFT} + .02)); width: var(--tw); --u: calc(var(--tw) / ${BOX_UNITS}); aspect-ratio: ${BOX_UNITS} / 47; perspective: 900px; }
.slot:focus-visible { outline: 3px solid var(--jarajara-focus, #b5452c); outline-offset: 2px; border-radius: 8%; }
:host([pick]) .slot { cursor: pointer; }
.spin { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
.tile { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
.slot[data-down="true"] .turn { transform: rotateY(180deg); }
${BLOCK_STYLE}
.rack[data-moving="true"] .slot { transition: left ${MOVE_MS}ms cubic-bezier(.3,.7,.3,1), top ${MOVE_MS}ms cubic-bezier(.3,.7,.3,1); }
.slot[data-lifted="true"] { transition: top 160ms ease-out; }
@media (prefers-reduced-motion: reduce) { .rack[data-moving="true"] .slot, .turn, .slot[data-lifted="true"] { transition: none; } }
${MARKER_STYLE}
${CLOTH_STYLE}
`;
