import { mixTiles, type TileGrouping, type TileOrder } from "../arrange.ts";
import { readTiles } from "../names.ts";
import {
  followLanguage,
  isOn,
  lessMotion,
  playSound,
  reflectMethod,
  type SpinOptions,
  spinElement,
} from "./elementKit.ts";
import { numbersIn, RackView, writeNumbers } from "./rackView.ts";
import type { TileSoundKind } from "./tileSounds.ts";

/** How a rack's tiles are turned face down or face up.
 *
 * @example
 * ```ts
 * import type { RackTurnOptions } from "@johnmorrisdotca/jarajara/element";
 *
 * const value: RackTurnOptions = {oneByOne:true,gap:100};
 * console.log(value);
 * ```
 */
export type RackTurnOptions = {
  /** One tile after another, from the first, rather than all at once. Unless said, all at once. */
  oneByOne?: boolean;
  /** Milliseconds between one tile and the next, one by one. Unless said, 90. */
  gap?: number;
};

/**
 * Tiles as a method is given them: a number is the place of one tile in the rack as it was written (`tiles`), from 0;
 * a letter or a name (`"F"`, `"east"`, `"3p"`) is every tile of that face; a list is each of its parts.
 *
 * @example
 * ```ts
 * import type { TileRef } from "@johnmorrisdotca/jarajara/element";
 *
 * const value: TileRef = [0,1,2];
 * console.log(value);
 * ```
 */
export type TileRef = number | string | readonly (number | string)[];

/** How the rack lies, for the page to hear of: what is turned, raised and marked (by place in `tiles`), and how the tiles are put in order.
 *
 * @example
 * ```ts
 * import type { RackDetail } from "@johnmorrisdotca/jarajara/element";
 *
 * const value: RackDetail = {tiles:["a","b","c"],faceDown:false,turned:[],lifted:[],marked:[],order:"dealt",group:null};
 * console.log(value);
 * ```
 */
export type RackDetail = {
  tiles: string[];
  faceDown: boolean;
  turned: number[];
  lifted: number[];
  marked: number[];
  order: TileOrder;
  group: TileGrouping | null;
};

const TOSS_MS = 300;

/**
 * A RACK OF TILES ON ANY PAGE, lined up in front of you: `<jarajara-rack tiles="123m456p789s1112z">`. They can be
 * turned over all at once or one after another or only the ones chosen, sorted and grouped by suit or kind, mixed up,
 * taken out and put in, marked to follow while face down, picked up (raised) with a tap, and spun.
 *
 * ```html
 * <jarajara-rack tiles="FFGHBBCDE" back="bamboo" order="suit" group="kind" pick></jarajara-rack>
 * ```
 *
 * Attributes, all optional:
 *   tiles       the tiles, written as codes run together (`abcF`), as names (`east red-dragon`), or as hand notation
 *               (`123m456p789s11z`); every one of them as the tiles lie in the rack as dealt
 *   face-down   every tile shows its back; their faces are not in the page
 *   turned      the places (from 0, as dealt) of tiles that show the other side from the rest
 *   lifted      the places of tiles picked up, raised above the row
 *   marked      the places of tiles that carry a mark, a dot on the corner seen face up or face down
 *   order       `suit`, `rank`, `kind` or `code` puts the tiles in that order; left out, they lie as dealt (`arrangeTiles`)
 *   group       `suit` or `kind` leaves a gap between groups of the sorted tiles
 *   pick        a tap, or Enter or Space, picks a tile up or puts it down; `pick="one"` lets only one be up at a time
 *   capacity    how many tiles' room the rack keeps whatever it holds, so taking tiles out leaves it the size it was
 *   red-fives   draws the first five of each suit red, in a design that has red fives
 *   sound       the changes make their sounds: tiles turned, set down and picked up, shuffled
 *   design, back, back-colour, mark, size, width, lang   as on `<jarajara-tile>`
 *   cloth       lays the rack on a cloth: `green`, `blue`, `red`, `black` or `wood`
 *
 * Methods (each returns a promise that settles when the tiles have stopped moving; the motion is skipped on a device
 * that asks for less): `hide(options?)`, `show(options?)` and `toggle(tiles?, options?)` turn tiles over; `sort(order?)`,
 * `group(by?)`, `ungroup()`, `unsort()` and `mixUp(seed?)` put them in order; `take(tile)` removes one and answers its
 * letter, `add(tile, at?)` puts one in and `replace(tile, next)` swaps one; `lift(tiles?)`, `lower(tiles?)` and
 * `liftToggle(tiles)` pick up and put down; `mark(tiles)`, `unmark(tiles?)` and `spin(tiles?, options?)`. A change is a
 * `jarajara-rack` event that bubbles, its detail `RackDetail`; a tap that picks a tile is `jarajara-pick`, `{ index, code, lifted }`.
 * @example
 * ```ts
 * import { JarajaraRack } from "@johnmorrisdotca/jarajara/element";
 * console.log(JarajaraRack.observedAttributes.includes("lang")); // true
 * ```
 */
export class JarajaraRack extends RackView {
  /** Turn every tile face down where it lies: all at once, or one after another. */
  hide(options: RackTurnOptions = {}): Promise<void> {
    return this.#change(
      () => {
        this.toggleAttribute("face-down", true);
        this.removeAttribute("turned");
      },
      options,
      false,
      "flip",
    );
  }

  /** Turn every tile face up again. */
  show(options: RackTurnOptions = {}): Promise<void> {
    return this.#change(
      () => {
        this.toggleAttribute("face-down", false);
        this.removeAttribute("turned");
      },
      options,
      false,
      "flip",
    );
  }

  /**
   * Turn the tiles named over, each to its other side, where they lie: one face up goes face down and one face down
   * comes up. Unless tiles are named, every tile of the rack, so a rack half turned is turned the other way about.
   */
  toggle(tiles?: TileRef, options: RackTurnOptions = {}): Promise<void> {
    const count = this.tiles.length;
    const named = tiles === undefined ? Array.from({ length: count }, (_, at) => at) : this.indexes(tiles);
    if (named.length === 0) return Promise.resolve();
    return this.#change(
      () => {
        const turned = this.readState().turned;
        for (const at of named) {
          if (turned.has(at)) turned.delete(at);
          else turned.add(at);
        }
        // Every tile turned the other way is the whole rack turned: written as the rack's own side.
        if (turned.size === count) {
          this.toggleAttribute("face-down", !isOn(this, "face-down"));
          this.removeAttribute("turned");
        } else if (turned.size === 0) this.removeAttribute("turned");
        else this.setAttribute("turned", writeNumbers(turned));
      },
      options,
      false,
      { kind: "flip", count: named.length },
    );
  }

  /** Put the tiles in order, sliding to their places: `suit` (unless said), `rank`, `kind` or `code`. */
  sort(order: TileOrder = "suit"): Promise<void> {
    return this.#change(
      () => (order === "dealt" ? this.removeAttribute("order") : this.setAttribute("order", order)),
      {},
      false,
      "place",
    );
  }

  /** Put the tiles in order by suit or kind (`suit` unless said) and set each group apart with a gap. */
  group(by: TileGrouping = "suit"): Promise<void> {
    return this.#change(
      () => {
        this.setAttribute("order", by === "kind" ? "kind" : "suit");
        this.setAttribute("group", by === "kind" ? "kind" : "suit");
      },
      {},
      false,
      "place",
    );
  }

  /** Close the gaps up again; the tiles stay in the order they were put in. */
  ungroup(): Promise<void> {
    return this.#change(() => this.removeAttribute("group"), {}, false, "place");
  }

  /** Lay the tiles out in the order they were dealt, with no gaps. */
  unsort(): Promise<void> {
    return this.#change(
      () => {
        this.removeAttribute("order");
        this.removeAttribute("group");
      },
      {},
      false,
      "place",
    );
  }

  /** Mix the tiles up: the same tiles in another order, each sliding to its new place. Where `seed` is given, the same mix every time. */
  mixUp(seed?: number): Promise<void> {
    const tiles = this.tiles;
    if (new Set(tiles).size < 2) return Promise.resolve();
    return this.#change(
      () => {
        const mixed = mixTiles(tiles, seed);
        // Each tile keeps its id, state and place in the new order: find which old tile went where.
        const taken = new Set<number>();
        const to = mixed.map((code) => {
          const old = tiles.findIndex((tile, at) => tile === code && !taken.has(at));
          taken.add(old);
          return old;
        });
        this.#reorder(to);
        this.setAttribute("tiles", mixed.join(""));
      },
      {},
      true,
      "shuffle",
    );
  }

  /** Move the ids and the state of each tile with it to its new place: `to[new]` is the old place. */
  #reorder(to: readonly number[]): void {
    this.reconcileIds();
    const place = new Map<number, number>(to.map((old, now) => [old, now]));
    this.ids = to.map((old) => this.ids[old]!);
    for (const name of ["turned", "lifted", "marked"] as const) {
      const was = numbersIn(this.getAttribute(name));
      if (was.length > 0) this.setAttribute(name, writeNumbers(was.map((at) => place.get(at) ?? at)));
    }
  }

  /** Drop one place and shift what comes after it, in the ids and the state. */
  #close(at: number): void {
    this.reconcileIds();
    this.ids.splice(at, 1);
    for (const name of ["turned", "lifted", "marked"] as const) {
      const was = numbersIn(this.getAttribute(name));
      if (was.length === 0) continue;
      const next = was.filter((one) => one !== at).map((one) => (one > at ? one - 1 : one));
      if (next.length === 0) this.removeAttribute(name);
      else this.setAttribute(name, writeNumbers(next));
    }
  }

  /** Open a place and shift what comes after it, in the ids and the state, for a tile put in. */
  #open(at: number): number {
    this.reconcileIds();
    const id = this.nextId++;
    this.ids.splice(at, 0, id);
    for (const name of ["turned", "lifted", "marked"] as const) {
      const was = numbersIn(this.getAttribute(name));
      if (was.length > 0) this.setAttribute(name, writeNumbers(was.map((one) => (one >= at ? one + 1 : one))));
    }
    return id;
  }

  /** Take a tile out of the rack: it lifts away and the rest close up. Answers its letter, or null where there is no such tile. */
  take(tile: number | string): Promise<string | null> {
    const at = this.indexes(tile)[0];
    if (at === undefined) return Promise.resolve(null);
    const code = this.tiles[at]!;
    const slot = lessMotion() ? null : this.#slotOf(at);
    playSound(this, "pick");
    const remove = () =>
      this.#change(
        () => {
          this.#close(at);
          this.setAttribute("tiles", this.tiles.filter((_, one) => one !== at).join(""));
        },
        {},
        true,
      ).then(() => {
        this.dispatchEvent(
          new CustomEvent("jarajara-take", { bubbles: true, composed: true, detail: { code, index: at } }),
        );
        return code;
      });
    if (slot === null) return remove();
    // The tile lifts up and away, turning a little as it goes; then the rack closes up after it.
    slot.style.transition = `transform ${TOSS_MS}ms ease-in, opacity ${TOSS_MS}ms ease-in`;
    slot.style.transform = "translateY(-115%) rotate(-14deg)";
    slot.style.opacity = "0";
    return new Promise((done) => setTimeout(() => void remove().then(done), TOSS_MS));
  }

  /** Put a tile in, at the `"front"`, at the `"end"` (unless said) or at a place in the order dealt: it drops in from above. A letter or a name; nothing for what is no tile. */
  add(tile: string, at: "front" | "end" | number = "end"): Promise<void> {
    const code = readTiles(tile)[0];
    if (code === undefined) return Promise.resolve();
    const tiles = this.tiles;
    const place =
      at === "front" ? 0 : at === "end" ? tiles.length : Math.max(0, Math.min(tiles.length, Math.floor(at)));
    return this.#change(
      () => {
        const id = this.#open(place);
        this.fresh.add(id);
        this.setAttribute("tiles", [...tiles.slice(0, place), code, ...tiles.slice(place)].join(""));
      },
      {},
      true,
      "place",
    );
  }

  /** Take a tile out and put another in its stead, at the end unless `at` says. */
  async replace(tile: number | string, next: string, at: "front" | "end" | number = "end"): Promise<void> {
    if ((await this.take(tile)) === null) return;
    await this.add(next, at);
  }

  /** Pick the tiles named up, raised above the row; every tile where none is named. */
  lift(tiles?: TileRef): void {
    const named = tiles === undefined ? this.tiles.map((_, at) => at) : this.indexes(tiles);
    if (this.#set("lifted", (now) => new Set([...now, ...named]))) playSound(this, "pick");
  }

  /** Put the tiles named down again, or every tile. */
  lower(tiles?: TileRef): void {
    if (tiles === undefined) {
      if (this.#set("lifted", () => new Set())) playSound(this, "place");
      return;
    }
    const named = new Set(this.indexes(tiles));
    if (this.#set("lifted", (now) => new Set([...now].filter((at) => !named.has(at))))) playSound(this, "place");
  }

  /** Pick each tile named up if it lies down and put it down if it is up. */
  liftToggle(tiles: TileRef): void {
    const named = this.indexes(tiles);
    let raised = false;
    const changed = this.#set("lifted", (now) => {
      const next = new Set(now);
      for (const at of named) {
        if (next.has(at)) next.delete(at);
        else {
          next.add(at);
          raised = true;
        }
      }
      return next;
    });
    if (changed) playSound(this, raised ? "pick" : "place");
  }

  /** Mark the tiles named, with a dot on the corner that shows face up and face down alike, to follow them as they move. */
  mark(tiles: TileRef): void {
    const named = this.indexes(tiles);
    if (this.#set("marked", (now) => new Set([...now, ...named]))) playSound(this, "pick");
  }

  /** Take the marks off the tiles named, or off every tile. */
  unmark(tiles?: TileRef): void {
    if (tiles === undefined) {
      if (this.#set("marked", () => new Set())) playSound(this, "place");
      return;
    }
    const named = new Set(this.indexes(tiles));
    if (this.#set("marked", (now) => new Set([...now].filter((at) => !named.has(at))))) playSound(this, "place");
  }

  /** Deal a new hand: the tiles written as `tiles` (codes, names or hand notation), none turned, raised, marked or in order. The tiles are shuffled in, with a sound. */
  deal(tiles: string): void {
    this.setAttribute("tiles", tiles);
    for (const name of ["face-down", "turned", "lifted", "marked", "order", "group"]) this.removeAttribute(name);
    playSound(this, "shuffle");
  }

  /** Change a set of places kept in an attribute. Answers whether it changed. */
  #set(name: "lifted" | "marked", next: (now: Set<number>) => Set<number>): boolean {
    const before = numbersIn(this.getAttribute(name));
    const now = next(new Set(before));
    if (now.size === 0) this.removeAttribute(name);
    else this.setAttribute(name, writeNumbers(now));
    return writeNumbers(new Set(before)) !== writeNumbers(now);
  }

  /**
   * Spin the tiles named (or every tile) where they lie, as a flick sets a tile turning on a table: fast, then slowing
   * to a stop as it was, a whole number of turns later. Several spin together, each a moment after the one before.
   * Settles when every tile is still; at once where motion is reduced.
   */
  spin(tiles?: TileRef, options: SpinOptions = {}): Promise<void> {
    const named = tiles === undefined ? this.tiles.map((_, at) => at) : this.indexes(tiles);
    const spins = named.flatMap((at) => {
      const spinning = this.#slotOf(at)?.querySelector<HTMLElement>(".spin");
      return spinning === null || spinning === undefined ? [] : [spinning];
    });
    if (spins.length > 0) playSound(this, "flip", { count: spins.length, gap: 70 });
    return Promise.all(spins.map((one, at) => spinElement(one, options, at * 70))).then(() => undefined);
  }

  #slotOf(at: number): HTMLElement | null {
    return this.root?.querySelector<HTMLElement>(`.slot[data-index="${at}"]`) ?? null;
  }

  /** Make a change to the attributes as one change that is drawn and told once, and settles when the tiles have stopped moving. */
  #change(
    apply: () => void,
    options: RackTurnOptions,
    always = false,
    sound: TileSoundKind | { kind: TileSoundKind; count: number } | null = null,
  ): Promise<void> {
    const before = this.#signature();
    this.stagger = options.oneByOne === true ? Math.max(0, options.gap ?? 90) : 0;
    this.moving = !lessMotion();
    return new Promise((done) => {
      this.settle?.();
      this.settle = done;
      this.batching = true;
      this.batched = false;
      apply();
      this.batching = false;
      if (this.batched && this.root !== null) this.draw();
      // A change that changed nothing settles at once, and makes no sound.
      const changed = always || before !== this.#signature();
      if (changed && sound !== null) {
        const kind = typeof sound === "string" ? sound : sound.kind;
        const count = typeof sound === "string" ? this.tiles.length : sound.count;
        // Tiles turning make one click each, in step with each turning (a turn one by one keeps its own gap); the rest are a few clicks as the tiles settle.
        playSound(
          this,
          kind,
          kind === "flip"
            ? { count, gap: this.stagger || 25 }
            : kind === "place" || kind === "pick"
              ? { count: Math.min(count, 4), gap: 60 }
              : {},
        );
      }
      if (!changed) this.finish();
    });
  }

  #signature(): string {
    // A switch such as `face-down` is an attribute with no value, so presence has to be told from absence: "" is not "not there".
    return ["tiles", "order", "group", "face-down", "turned", "lifted", "marked"]
      .map((name) => (this.hasAttribute(name) ? `=${this.getAttribute(name)}` : "-"))
      .join("|");
  }

  connectedCallback(): void {
    this.forget ??= followLanguage(() => this.draw());
    if (this.root === null) {
      this.root = this.attachShadow({ mode: "open" });
      const pick = (event: Event) => {
        if (!isOn(this, "pick")) return;
        const slot = event
          .composedPath()
          .find((one): one is HTMLElement => one instanceof HTMLElement && one.classList.contains("slot"));
        if (slot === undefined) return;
        const at = Number(slot.dataset.index);
        const was = this.readState().lifted.has(at);
        this.pendingFocus = at;
        if (this.getAttribute("pick") === "one") {
          this.#set("lifted", () => (was ? new Set() : new Set([at])));
          playSound(this, was ? "place" : "pick");
        } else this.liftToggle(at);
        this.dispatchEvent(
          new CustomEvent("jarajara-pick", {
            bubbles: true,
            composed: true,
            detail: { index: at, code: this.tiles[at], lifted: !was },
          }),
        );
      };
      this.root.addEventListener("click", pick);
      this.root.addEventListener("keydown", (event) => {
        const key = (event as KeyboardEvent).key;
        if (key === "Enter" || key === " ") {
          event.preventDefault();
          pick(event);
        } else if (key === "ArrowRight" || key === "ArrowLeft") {
          const slots = [...(this.root?.querySelectorAll<HTMLElement>(".slot") ?? [])];
          const active = this.root?.activeElement;
          const here = active instanceof HTMLElement ? slots.indexOf(active) : -1;
          slots[Math.max(0, Math.min(slots.length - 1, here + (key === "ArrowRight" ? 1 : -1)))]?.focus();
          event.preventDefault();
        }
      });
    }
    this.draw();
  }

  disconnectedCallback(): void {
    this.forget?.();
    this.forget = null;
    if (this.timer !== null) clearTimeout(this.timer);
  }

  attributeChangedCallback(name: string): void {
    if (this.root === null) return;
    if (this.batching) {
      this.batched = true;
      return;
    }
    if (name === "tiles") this.reconcileIds();
    // A mark or a pick moves nothing; the rest of a change from outside slides the tiles to where they go.
    this.moving = this.moving || (!lessMotion() && ["order", "group", "capacity"].includes(name));
    this.draw();
  }
}

// React, Vue and Svelte set a property they find on the element class itself. The accessors live on the
// drawing parent, so each one is also on this class, which is where those frameworks look.
for (const name of Object.getOwnPropertyNames(RackView.prototype)) {
  if (Object.hasOwn(JarajaraRack.prototype, name)) continue;
  const descriptor = Object.getOwnPropertyDescriptor(RackView.prototype, name);
  if (descriptor?.get !== undefined || descriptor?.set !== undefined)
    Object.defineProperty(JarajaraRack.prototype, name, descriptor);
}

reflectMethod(JarajaraRack, "group");
reflectMethod(JarajaraRack, "mark");
