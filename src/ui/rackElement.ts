import type { TileSoundKind } from "./tileSounds.ts";
import { arrangeIndexes, arrangeTiles, groupStarts, mixTiles, TILE_ORDERS, type TileGrouping, type TileOrder } from "../arrange.ts";
import { readTiles, tileName } from "../names.ts";
import { redFiveIndexes } from "../designs.ts";
import { blockHtml, blockVars, BLOCK_STYLE, BOX_UNITS, CLOTH_STYLE, designNamed, ElementBase, followLanguage, isOn, languageOf, lessMotion, markerHtml, MARKER_STYLE, playSound, reflectMethod, say, spinElement, tileDrawing, tileLabel, widthOf, wearCloth, type SpinOptions } from "./elementKit.ts";
import { RACK_LIFT, rackPlaces, rackWidth, TILE_TALL, type RackPlace } from "./rackLayout.ts";

/** How a rack's tiles are turned face down or face up. */
export type RackTurnOptions = {
  /** One tile after another, from the first, rather than all at once. Unless said, all at once. */
  oneByOne?: boolean;
  /** Milliseconds between one tile and the next, one by one. Unless said, 90. */
  gap?: number;
};

/**
 * Tiles as a method is given them: a number is the place of one tile in the rack as it was written (`tiles`), from 0;
 * a letter or a name (`"F"`, `"east"`, `"3p"`) is every tile of that face; a list is each of its parts.
 */
export type TileRef = number | string | readonly (number | string)[];

/** How the rack lies, for the page to hear of: what is turned, raised and marked (by place in `tiles`), and how the tiles are put in order. */
export type RackDetail = { tiles: string[]; faceDown: boolean; turned: number[]; lifted: number[]; marked: number[]; order: TileOrder; group: TileGrouping | null };

const TOSS_MS = 300;
const MOVE_MS = 460;

const numbersIn = (text: string | null): number[] => (text ?? "").split(/[\s,]+/).filter((word) => /^\d+$/.test(word)).map(Number);
const writeNumbers = (list: Iterable<number>): string => [...new Set(list)].sort((a, b) => a - b).join(" ");

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
 */
export class JarajaraRack extends ElementBase {
  static get observedAttributes(): readonly string[] {
    return ["tiles", "order", "group", "face-down", "turned", "lifted", "marked", "pick", "capacity", "red-fives", "design", "back", "back-colour", "mark", "size", "width", "lang", "cloth", "sound"];
  }

  #root: ShadowRoot | null = null;
  #forget: (() => void) | null = null;
  /** A number for each tile as dealt that stays with it through sorting, mixing and taking out, so it is seen to move. */
  #ids: number[] = [];
  #nextId = 1;
  #stagger = 0;
  #moving = false;
  #batching = false;
  #batched = false;
  /** Where each tile lay when last drawn, and which way it faced. */
  #seen = new Map<number, RackPlace & { down: boolean }>();
  #fresh = new Set<number>();
  #settle: (() => void) | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #told: string | null = null;
  #focus: number | null = null;

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
    return arrangeTiles(this.tiles, this.#order());
  }

  #order(): TileOrder {
    const asked = this.getAttribute("order") as TileOrder | null;
    return asked !== null && TILE_ORDERS.includes(asked) ? asked : "dealt";
  }

  #grouping(): TileGrouping | null {
    const asked = this.getAttribute("group");
    return asked === "kind" || asked === "suit" ? asked : null;
  }

  /** The places of the tiles a reference names. */
  #indexes(ref: TileRef): number[] {
    const tiles = this.tiles;
    const parts = typeof ref === "number" || typeof ref === "string" ? [ref] : ref;
    const found = new Set<number>();
    for (const part of parts) {
      if (typeof part === "number") {
        if (Number.isInteger(part) && part >= 0 && part < tiles.length) found.add(part);
        continue;
      }
      for (const code of readTiles(part)) tiles.forEach((tile, at) => tile === code && found.add(at));
    }
    return [...found].sort((a, b) => a - b);
  }

  /** The state of the rack, read from its attributes. */
  #state() {
    return {
      down: this.hasAttribute("face-down"),
      turned: new Set(numbersIn(this.getAttribute("turned"))),
      lifted: new Set(numbersIn(this.getAttribute("lifted"))),
      marked: new Set(numbersIn(this.getAttribute("marked"))),
    };
  }

  /** Turn every tile face down where it lies: all at once, or one after another. */
  hide(options: RackTurnOptions = {}): Promise<void> {
    return this.#change(() => {
      this.toggleAttribute("face-down", true);
      this.removeAttribute("turned");
    }, options, false, "flip");
  }

  /** Turn every tile face up again. */
  show(options: RackTurnOptions = {}): Promise<void> {
    return this.#change(() => {
      this.toggleAttribute("face-down", false);
      this.removeAttribute("turned");
    }, options, false, "flip");
  }

  /**
   * Turn the tiles named over, each to its other side, where they lie: one face up goes face down and one face down
   * comes up. Unless tiles are named, every tile of the rack, so a rack half turned is turned the other way about.
   */
  toggle(tiles?: TileRef, options: RackTurnOptions = {}): Promise<void> {
    const count = this.tiles.length;
    const named = tiles === undefined ? Array.from({ length: count }, (_, at) => at) : this.#indexes(tiles);
    if (named.length === 0) return Promise.resolve();
    return this.#change(() => {
      const turned = this.#state().turned;
      for (const at of named) {
        if (turned.has(at)) turned.delete(at);
        else turned.add(at);
      }
      // Every tile turned the other way is the whole rack turned: written as the rack's own side.
      if (turned.size === count) {
        this.toggleAttribute("face-down", !this.hasAttribute("face-down"));
        this.removeAttribute("turned");
      } else if (turned.size === 0) this.removeAttribute("turned");
      else this.setAttribute("turned", writeNumbers(turned));
    }, options, false, { kind: "flip", count: named.length });
  }

  /** Put the tiles in order, sliding to their places: `suit` (unless said), `rank`, `kind` or `code`. */
  sort(order: TileOrder = "suit"): Promise<void> {
    return this.#change(() => (order === "dealt" ? this.removeAttribute("order") : this.setAttribute("order", order)), {}, false, "place");
  }

  /** Put the tiles in order by suit or kind (`suit` unless said) and set each group apart with a gap. */
  group(by: TileGrouping = "suit"): Promise<void> {
    return this.#change(() => {
      this.setAttribute("order", by === "kind" ? "kind" : "suit");
      this.setAttribute("group", by === "kind" ? "kind" : "suit");
    }, {}, false, "place");
  }

  /** Close the gaps up again; the tiles stay in the order they were put in. */
  ungroup(): Promise<void> {
    return this.#change(() => this.removeAttribute("group"), {}, false, "place");
  }

  /** Lay the tiles out in the order they were dealt, with no gaps. */
  unsort(): Promise<void> {
    return this.#change(() => {
      this.removeAttribute("order");
      this.removeAttribute("group");
    }, {}, false, "place");
  }

  /** Mix the tiles up: the same tiles in another order, each sliding to its new place. Where `seed` is given, the same mix every time. */
  mixUp(seed?: number): Promise<void> {
    const tiles = this.tiles;
    if (new Set(tiles).size < 2) return Promise.resolve();
    return this.#change(() => {
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
    }, {}, true, "shuffle");
  }

  /** Move the ids and the state of each tile with it to its new place: `to[new]` is the old place. */
  #reorder(to: readonly number[]): void {
    this.#reconcileIds();
    const place = new Map<number, number>(to.map((old, now) => [old, now]));
    this.#ids = to.map((old) => this.#ids[old]!);
    for (const name of ["turned", "lifted", "marked"] as const) {
      const was = numbersIn(this.getAttribute(name));
      if (was.length > 0) this.setAttribute(name, writeNumbers(was.map((at) => place.get(at) ?? at)));
    }
  }

  /** Drop one place and shift what comes after it, in the ids and the state. */
  #close(at: number): void {
    this.#reconcileIds();
    this.#ids.splice(at, 1);
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
    this.#reconcileIds();
    const id = this.#nextId++;
    this.#ids.splice(at, 0, id);
    for (const name of ["turned", "lifted", "marked"] as const) {
      const was = numbersIn(this.getAttribute(name));
      if (was.length > 0) this.setAttribute(name, writeNumbers(was.map((one) => (one >= at ? one + 1 : one))));
    }
    return id;
  }

  /** Take a tile out of the rack: it lifts away and the rest close up. Answers its letter, or null where there is no such tile. */
  take(tile: number | string): Promise<string | null> {
    const at = this.#indexes(tile)[0];
    if (at === undefined) return Promise.resolve(null);
    const code = this.tiles[at]!;
    const slot = lessMotion() ? null : this.#slotOf(at);
    playSound(this, "pick");
    const remove = () =>
      this.#change(() => {
        this.#close(at);
        this.setAttribute("tiles", this.tiles.filter((_, one) => one !== at).join(""));
      }, {}, true).then(() => {
        this.dispatchEvent(new CustomEvent("jarajara-take", { bubbles: true, composed: true, detail: { code, index: at } }));
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
    const place = at === "front" ? 0 : at === "end" ? tiles.length : Math.max(0, Math.min(tiles.length, Math.floor(at)));
    return this.#change(() => {
      const id = this.#open(place);
      this.#fresh.add(id);
      this.setAttribute("tiles", [...tiles.slice(0, place), code, ...tiles.slice(place)].join(""));
    }, {}, true, "place");
  }

  /** Take a tile out and put another in its stead, at the end unless `at` says. */
  async replace(tile: number | string, next: string, at: "front" | "end" | number = "end"): Promise<void> {
    if ((await this.take(tile)) === null) return;
    await this.add(next, at);
  }

  /** Pick the tiles named up, raised above the row; every tile where none is named. */
  lift(tiles?: TileRef): void {
    const named = tiles === undefined ? this.tiles.map((_, at) => at) : this.#indexes(tiles);
    if (this.#set("lifted", (now) => new Set([...now, ...named]))) playSound(this, "pick");
  }

  /** Put the tiles named down again, or every tile. */
  lower(tiles?: TileRef): void {
    if (tiles === undefined) {
      if (this.#set("lifted", () => new Set())) playSound(this, "place");
      return;
    }
    const named = new Set(this.#indexes(tiles));
    if (this.#set("lifted", (now) => new Set([...now].filter((at) => !named.has(at))))) playSound(this, "place");
  }

  /** Pick each tile named up if it lies down and put it down if it is up. */
  liftToggle(tiles: TileRef): void {
    const named = this.#indexes(tiles);
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
    const named = this.#indexes(tiles);
    if (this.#set("marked", (now) => new Set([...now, ...named]))) playSound(this, "pick");
  }

  /** Take the marks off the tiles named, or off every tile. */
  unmark(tiles?: TileRef): void {
    if (tiles === undefined) {
      if (this.#set("marked", () => new Set())) playSound(this, "place");
      return;
    }
    const named = new Set(this.#indexes(tiles));
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
    const named = tiles === undefined ? this.tiles.map((_, at) => at) : this.#indexes(tiles);
    const spins = named.flatMap((at) => {
      const spinning = this.#slotOf(at)?.querySelector<HTMLElement>(".spin");
      return spinning === null || spinning === undefined ? [] : [spinning];
    });
    if (spins.length > 0) playSound(this, "flip", { count: spins.length, gap: 70 });
    return Promise.all(spins.map((one, at) => spinElement(one, options, at * 70))).then(() => undefined);
  }

  #slotOf(at: number): HTMLElement | null {
    return this.#root?.querySelector<HTMLElement>(`.slot[data-index="${at}"]`) ?? null;
  }

  /** Make a change to the attributes as one change that is drawn and told once, and settles when the tiles have stopped moving. */
  #change(apply: () => void, options: RackTurnOptions, always = false, sound: TileSoundKind | { kind: TileSoundKind; count: number } | null = null): Promise<void> {
    const before = this.#signature();
    this.#stagger = options.oneByOne === true ? Math.max(0, options.gap ?? 90) : 0;
    this.#moving = !lessMotion();
    return new Promise((done) => {
      this.#settle?.();
      this.#settle = done;
      this.#batching = true;
      this.#batched = false;
      apply();
      this.#batching = false;
      if (this.#batched && this.#root !== null) this.#draw();
      // A change that changed nothing settles at once, and makes no sound.
      const changed = always || before !== this.#signature();
      if (changed && sound !== null) {
        const kind = typeof sound === "string" ? sound : sound.kind;
        const count = typeof sound === "string" ? this.tiles.length : sound.count;
        // Tiles turning make one click each, in step with each turning (a turn one by one keeps its own gap); the rest are a few clicks as the tiles settle.
        playSound(this, kind, kind === "flip" ? { count, gap: this.#stagger || 25 } : kind === "place" || kind === "pick" ? { count: Math.min(count, 4), gap: 60 } : {});
      }
      if (!changed) this.#finish();
    });
  }

  #signature(): string {
    // A switch such as `face-down` is an attribute with no value, so presence has to be told from absence: "" is not "not there".
    return ["tiles", "order", "group", "face-down", "turned", "lifted", "marked"].map((name) => (this.hasAttribute(name) ? `=${this.getAttribute(name)}` : "-")).join("|");
  }

  #finish(): void {
    const done = this.#settle;
    this.#settle = null;
    done?.();
  }

  /** Make sure every tile has an id: new ones where the tiles were set from outside. */
  #reconcileIds(): void {
    const count = this.tiles.length;
    if (this.#ids.length === count) return;
    this.#ids = Array.from({ length: count }, () => this.#nextId++);
    this.#seen.clear();
  }

  connectedCallback(): void {
    this.#forget ??= followLanguage(() => this.#draw());
    if (this.#root === null) {
      this.#root = this.attachShadow({ mode: "open" });
      const pick = (event: Event) => {
        if (!this.hasAttribute("pick")) return;
        const slot = event.composedPath().find((one): one is HTMLElement => one instanceof HTMLElement && one.classList.contains("slot"));
        if (slot === undefined) return;
        const at = Number(slot.dataset.index);
        const was = this.#state().lifted.has(at);
        this.#focus = at;
        if (this.getAttribute("pick") === "one") {
          this.#set("lifted", () => (was ? new Set() : new Set([at])));
          playSound(this, was ? "place" : "pick");
        } else this.liftToggle(at);
        this.dispatchEvent(new CustomEvent("jarajara-pick", { bubbles: true, composed: true, detail: { index: at, code: this.tiles[at], lifted: !was } }));
      };
      this.#root.addEventListener("click", pick);
      this.#root.addEventListener("keydown", (event) => {
        const key = (event as KeyboardEvent).key;
        if (key === "Enter" || key === " ") {
          event.preventDefault();
          pick(event);
        } else if (key === "ArrowRight" || key === "ArrowLeft") {
          const slots = [...(this.#root?.querySelectorAll<HTMLElement>(".slot") ?? [])];
          const here = slots.findIndex((slot) => slot === this.#root?.activeElement);
          slots[Math.max(0, Math.min(slots.length - 1, here + (key === "ArrowRight" ? 1 : -1)))]?.focus();
          event.preventDefault();
        }
      });
    }
    this.#draw();
  }

  disconnectedCallback(): void {
    this.#forget?.();
    this.#forget = null;
    if (this.#timer !== null) clearTimeout(this.#timer);
  }

  attributeChangedCallback(name: string): void {
    if (this.#root === null) return;
    if (this.#batching) {
      this.#batched = true;
      return;
    }
    if (name === "tiles") this.#reconcileIds();
    // A mark or a pick moves nothing; the rest of a change from outside slides the tiles to where they go.
    this.#moving = this.#moving || (!lessMotion() && ["order", "group", "capacity"].includes(name));
    this.#draw();
  }

  #draw(): void {
    const root = this.#root as ShadowRoot;
    wearCloth(this);
    const tiles = this.tiles;
    this.#reconcileIds();
    const language = languageOf(this);
    const { design, ready } = designNamed(this.getAttribute("design"));
    if (ready !== null) void ready.then(() => this.#draw());
    const state = this.#state();
    const order = this.#order();
    const grouping = this.#grouping();
    const perm = arrangeIndexes(tiles, order);
    const shown = perm.map((at) => tiles[at]!);
    const breaks = grouping === null ? [] : groupStarts(shown, grouping);
    const places = rackPlaces(shown.length, { breaks, lifted: perm.map((at, place) => (state.lifted.has(at) ? place : -1)).filter((place) => place >= 0) });
    // ONE FRAME FOR EVERY STATE: the rack keeps the room its widest arrangement takes (grouped by suit), or the room of
    // `capacity` tiles, so grouping, closing the groups up and sorting never change its size, and each state lies in the middle.
    const capacity = Math.max(shown.length, Math.floor(Number(this.getAttribute("capacity")) || 0));
    // With a capacity, the room of that many tiles and the most gaps a set of seven suits can need; without, what these tiles take at most.
    const roomy = Math.floor(Number(this.getAttribute("capacity")) || 0) > 0 ? rackWidth(rackPlaces(capacity, { breaks: [1, 2, 3, 4, 5, 6].filter((at) => at < capacity) })) : 0;
    const widest = Math.max(rackWidth(places), rackWidth(rackPlaces(shown.length, { breaks: groupStarts(arrangeTiles(tiles, "suit"), "suit") })), roomy);
    const centred = (place: RackPlace, width: number): RackPlace => ({ x: Math.round((place.x + (widest - width) / 2) * 1000) / 1000, y: place.y });
    const width = rackWidth(places);
    const end = places.map((place) => centred(place, width));
    const moving = this.#moving && this.#seen.size > 0;
    const stagger = this.#stagger;
    this.#moving = false;
    this.#stagger = 0;
    if (this.#timer !== null) clearTimeout(this.#timer);

    const downIn = (at: number) => (state.turned.has(at) ? !state.down : state.down);
    // What a screen reader hears: the tiles, or that they are face down and how many.
    const allDown = shown.length > 0 && perm.every((at) => downIn(at));
    this.setAttribute("role", "group");
    this.setAttribute("aria-label", shown.length === 0 ? say(language, "rackEmpty") : allDown && state.marked.size === 0 ? say(language, "rackFaceDown", { n: shown.length }) : say(language, "rackLabel", { n: shown.length, tiles: perm.map((at) => tileLabel(tiles[at]!, downIn(at), language)).join(", ") }));
    const reds = isOn(this, "red-fives") && design?.red !== undefined ? redFiveIndexes(shown) : new Set<number>();
    const start = perm.map((at, place) => {
      const id = this.#ids[at]!;
      const was = this.#seen.get(id);
      if (!moving) return end[place]!;
      if (was !== undefined) return { x: was.x, y: was.y };
      return { x: end[place]!.x, y: end[place]!.y - 1.1 };
    });
    const slots = perm.map((at, place) => {
      const id = this.#ids[at]!;
      const down = downIn(at);
      const before = moving ? (this.#seen.get(id)?.down ?? down) : down;
      const code = tiles[at]!;
      // A face is in the page only while it may show: never for a tile face down at both ends of a change.
      const face = !(before && down) ? tileDrawing(code, false, this, design, reds.has(place)) : "";
      const back = tileDrawing(code, true, this, design);
      const marked = state.marked.has(at);
      const lifted = state.lifted.has(at);
      const picks = this.hasAttribute("pick");
      const label = tileLabel(code, down, language);
      const said = marked ? say(language, "tileMarked", { tile: label }) : lifted ? say(language, "tileLifted", { tile: label }) : label;
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
      this.#seen = new Map(perm.map((at, place) => [this.#ids[at]!, { ...end[place]!, down: downIn(at) }]));
      this.#fresh.clear();
      this.#announce();
      if (this.#focus !== null) {
        this.#root?.querySelector<HTMLElement>(`.slot[data-index="${this.#focus}"]`)?.focus({ preventScroll: true });
        this.#focus = null;
      }
    };
    all.forEach((slot, place) => put(slot, start[place]!, moving ? (this.#seen.get(this.#ids[perm[place]!]!)?.down ?? downIn(perm[place]!)) : downIn(perm[place]!)));
    if (!moving) {
      finish();
      this.#finish();
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
    this.#timer = setTimeout(() => {
      this.#timer = null;
      // Once still, drawn again where it lies: the faces of tiles face down leave the page.
      finish();
      this.#draw();
      this.#finish();
    }, length + 40);
    this.#seen = new Map(perm.map((at, place) => [this.#ids[at]!, { ...end[place]!, down: downIn(at) }]));
  }

  #detail(): RackDetail {
    const state = this.#state();
    return { tiles: this.tiles, faceDown: state.down, turned: [...state.turned].sort((a, b) => a - b), lifted: [...state.lifted].sort((a, b) => a - b), marked: [...state.marked].sort((a, b) => a - b), order: this.#order(), group: this.#grouping() };
  }

  /** Tell the page of a change, once, and of the first drawing not at all. */
  #announce(): void {
    const detail = this.#detail();
    const now = JSON.stringify(detail);
    const first = this.#told === null;
    if (now === this.#told) return;
    this.#told = now;
    if (first) return;
    this.dispatchEvent(new CustomEvent("jarajara-rack", { bubbles: true, composed: true, detail }));
  }

  /** The tiles as they lie, in words, for a screen reader. */
  get description(): string {
    const language = languageOf(this);
    const tiles = this.arranged;
    if (tiles.length === 0) return say(language, "rackEmpty");
    return say(language, "rackLabel", { n: tiles.length, tiles: tiles.map((code) => tileName(code, language)).join(", ") });
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
reflectMethod(JarajaraRack, "group");
reflectMethod(JarajaraRack, "mark");
