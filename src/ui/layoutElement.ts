import { freshAwaseSeed, generateAwase } from "../awase.ts";
import { describeSlot, readSlotKeys, sortSlots } from "../arrange.ts";
import { canTake, freePairs, geometryOf, isCleared, isFree, tilesLeft } from "../board.ts";
import { shuffleTiles } from "../deal.ts";
import { layoutSvg } from "../draw.ts";
import { redFiveIndexes } from "../designs.ts";
import { tileFaceSymbols, tileSvg } from "../faces.ts";
import { layoutFor } from "../layouts.ts";
import { decodeMoves, encodeMoves, playSolve, type Replayed } from "../moves.ts";
import { tileName } from "../names.ts";
import { bonusRuleOf, isFaceCode, pairPoints } from "../tiles.ts";
import type { AwaseLevel, MahjongBonusRule, MahjongLayout, MahjongMove } from "../types.ts";
import type { TileDesign } from "../design.types.ts";
import { CLOTH_STYLE, designNamed, ElementBase, followLanguage, isOn, languageOf, lessMotion, say, wearCloth } from "./elementKit.ts";

/** How many of a thing a game allows: a number, or no limit at all. */
export type Allowance = number | null;

/** Read an allowance from an attribute: nothing or `unlimited` is no limit, `off` or `0` is none, a number is that many. */
export function allowanceOf(text: string | null): Allowance {
  if (text === null || text.trim() === "" || /^(unlimited|any|many)$/i.test(text.trim())) return null;
  if (/^(off|no|none|false)$/i.test(text.trim())) return 0;
  const count = Number(text);
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : null;
}

const LEVELS: readonly AwaseLevel[] = ["easy", "medium", "hard"];

/** What a hint is: the free pair that leaves the stacks lowest after it, so a hint never digs a tile deeper than it must. */
export function hintPair(layout: MahjongLayout, cells: string, rule: MahjongBonusRule): [number, number] | null {
  const pairs = freePairs(geometryOf(layout), cells, rule);
  let best: [number, number] | null = null;
  let height = -1;
  for (const pair of pairs) {
    const up = layout.slots[pair[0]]!.z + layout.slots[pair[1]]!.z;
    if (up > height) {
      best = pair;
      height = up;
    }
  }
  return best;
}

/**
 * A GAME OF AWASE ON ANY PAGE: `<jarajara-layout size="15">`, a stacked layout of tiles drawn on a cloth, with the
 * rules of the solitaire in it: tap a free tile, then its match, and the pair goes. The free tiles can be lit, the tiles
 * that match the one chosen ringed, a hint asked for, the tiles shuffled when no pair is left, and a move undone. The
 * same layout can be looked at lined up instead, sorted by where each slot is.
 *
 * ```html
 * <jarajara-layout size="15" level="medium" show-free controls timer cloth="green"></jarajara-layout>
 * ```
 *
 * Attributes, all optional:
 *   size           the layout's width in tiles, which names it: 15 (the Turtle, unless said), 4, 8, 9, 10 and the rest of `MAHJONG_LAYOUTS`
 *   level          `easy`, `medium` (unless said) or `hard`: how forgiving the deal is
 *   seed           the deal's seed: the same seed deals the same tiles (a fresh one unless said)
 *   cells          tiles of your own to play from, one letter a slot, `.` for a slot left empty, instead of a deal
 *   show-free      washes the blocked tiles darker so the free ones stand out
 *   show-matching  rings the tiles that match the one chosen
 *   hints          how many hints a game may use: a number, `off`, or `unlimited` (unless said)
 *   shuffles       how many shuffles a game may use, the same way
 *   undo           `off` takes undo away
 *   timer          shows the game's clock, which starts at the first pair taken and stops when the layout is clear
 *   controls       draws New deal, Undo, Hint and Shuffle buttons and the line that says how the game stands
 *   view           `stack` (unless said) draws the layout; `lined` draws its tiles lined up in a row, in the order `sort` gives, each with where it lies
 *   sort           how `lined` puts the slots in order: the keys `x`, `y` and `z`, `-` before one for the other way round: `"z y x"` (unless said), `"x"`, `"-z x"`
 *   static         the tiles may be looked at but not played
 *   design, red-fives, size is the layout's, lang, cloth   as on the other elements
 *
 * Methods: `newDeal(seed?)`, `take(a, b)`, `hint()`, `shuffle()`, `undo()`, `restore(moves)`, `sortBy(keys)`. Properties: `seed`, `cells`,
 * `moves` (as `encodeMoves` writes them), `tilesLeft`. Events, all bubbling: `jarajara-take` (`{ pair, codes, tilesLeft }`),
 * `jarajara-shuffle`, `jarajara-stuck`, `jarajara-clear` (`{ moves, seconds }`), `jarajara-hint`, `jarajara-undo` and `jarajara-deal`
 * (`{ size, level, seed }`, a deal made, which a page that keeps the game listens for).
 */
export class JarajaraLayout extends ElementBase {
  static get observedAttributes(): readonly string[] {
    return ["size", "level", "seed", "cells", "show-free", "show-matching", "hints", "shuffles", "undo", "timer", "controls", "view", "sort", "static", "design", "red-fives", "lang", "cloth"];
  }

  #root: ShadowRoot | null = null;
  #forget: (() => void) | null = null;
  #givens = "";
  #size = 15;
  #seed = 0;
  /** The `seed` attribute last dealt from, so a new deal draws a fresh seed instead of dealing the same tiles again. */
  #dealtFrom: string | null = null;
  #moves: MahjongMove[] = [];
  #played: Replayed | null = null;
  #chosen: number | null = null;
  #hinted: number[] = [];
  #hintsUsed = 0;
  #note = "";
  #startedAt: number | null = null;
  #seconds: number | null = null;
  #ticker: ReturnType<typeof setInterval> | null = null;

  /** The seed of the deal being played. */
  get seed(): number {
    return this.#seed;
  }

  /** The tiles as they lie, one letter a slot, `.` where one has been taken. */
  get cells(): string {
    return this.#played?.cells ?? this.#givens;
  }

  /** The moves played so far, written as `encodeMoves` writes them. */
  get moves(): string {
    return encodeMoves(this.#moves);
  }

  /** How many tiles are still on the layout. */
  get tilesLeft(): number {
    return tilesLeft(this.cells);
  }

  #layout(): MahjongLayout {
    return layoutFor(this.#size) ?? (layoutFor(15) as MahjongLayout);
  }

  #rule(): MahjongBonusRule {
    return bonusRuleOf(this.#givens);
  }

  #shufflesUsed(): number {
    return this.#played?.shuffles ?? 0;
  }

  /** Deal again, from `seed` or a fresh one, at the size and level the attributes give. */
  newDeal(seed?: number): void {
    const size = Number(this.getAttribute("size"));
    this.#size = layoutFor(size) === null ? 15 : size;
    const level = this.getAttribute("level") as AwaseLevel | null;
    const asked = this.getAttribute("seed");
    if (Number.isInteger(seed)) this.#seed = seed as number;
    else if (asked !== null && asked !== this.#dealtFrom && Number.isInteger(Number(asked)) && Number(asked) > 0) {
      this.#seed = Number(asked);
      this.#dealtFrom = asked;
    } else this.#seed = freshAwaseSeed("group");
    const own = this.getAttribute("cells");
    if (own !== null && own.length === this.#layout().slots.length && [...own].every((code) => code === "." || isFaceCode(code))) this.#givens = own;
    else this.#givens = generateAwase(this.#size, level !== null && LEVELS.includes(level) ? level : "medium", this.#seed).givens;
    this.#moves = [];
    this.#chosen = null;
    this.#hinted = [];
    this.#hintsUsed = 0;
    this.#note = "";
    this.#startedAt = null;
    this.#seconds = null;
    this.#played = this.#playedFrom(this.#moves);
    this.#draw();
    this.dispatchEvent(new CustomEvent("jarajara-deal", { bubbles: true, composed: true, detail: { size: this.#size, level: this.getAttribute("level") ?? "medium", seed: this.#seed } }));
  }

  /**
   * Play a game written as text (`encodeMoves`) on the deal being played, as a kept game is opened again. Answers
   * whether every move was one the rules allow; if one was not, the game is left as it was.
   */
  restore(moves: string): boolean {
    const decoded = decodeMoves(moves, this.#layout().slots.length);
    const played = decoded === null ? null : this.#playedFrom(decoded);
    if (decoded === null || played === null) return false;
    this.#moves = decoded;
    this.#played = played;
    this.#chosen = null;
    this.#hinted = [];
    this.#note = "";
    if (decoded.length > 0 && !isCleared(played.cells)) this.#startClock();
    this.#draw();
    return true;
  }

  /** The moves played on this deal, from its givens: by the rules' own replay, or, for a position of your own with slots left empty, move by move. */
  #playedFrom(moves: readonly MahjongMove[]): Replayed | null {
    if (!this.#givens.includes(".")) return playSolve(this.#size, this.#givens, moves);
    let cells = this.#givens;
    let shuffles = 0;
    const geometry = geometryOf(this.#layout());
    const rule = this.#rule();
    for (const move of moves) {
      if ("shuffle" in move) {
        const next = shuffleTiles(geometry, cells, rule, shuffles);
        if (next === null) return null;
        cells = next;
        shuffles += 1;
      } else if (canTake(geometry, cells, rule, move.pair[0], move.pair[1])) cells = [...cells].map((code, at) => (at === move.pair[0] || at === move.pair[1] ? "." : code)).join("");
      else return null;
    }
    return { cells, shuffles };
  }

  /** The tiles as they last lay all together, as dealt or as last shuffled: what the red fives are decided by, so one stays the same tile as the others are taken. */
  #epoch(): string {
    const last = this.#moves.map((move) => "shuffle" in move).lastIndexOf(true);
    return last === -1 ? this.#givens : (this.#playedFrom(this.#moves.slice(0, last + 1))?.cells ?? this.#givens);
  }

  /** Take a pair, as a player's two taps do. Answers whether the pair could be taken: two free tiles that match. */
  take(a: number, b: number): boolean {
    const cells = this.cells;
    if (isOn(this, "static") || !canTake(geometryOf(this.#layout()), cells, this.#rule(), a, b)) return false;
    this.#startClock();
    const next = [...this.#moves, { pair: [a, b] as [number, number] }];
    const played = this.#playedFrom(next);
    if (played === null) return false;
    this.#moves = next;
    this.#played = played;
    this.#chosen = null;
    this.#hinted = [];
    this.#note = "";
    this.dispatchEvent(new CustomEvent("jarajara-take", { bubbles: true, composed: true, detail: { pair: [a, b], codes: [cells[a], cells[b]], points: pairPoints(cells[a]!), tilesLeft: tilesLeft(played.cells) } }));
    if (isCleared(played.cells)) {
      this.#seconds = this.#elapsed();
      this.#stopClock();
      this.dispatchEvent(new CustomEvent("jarajara-clear", { bubbles: true, composed: true, detail: { moves: this.moves, seconds: this.#seconds } }));
    } else if (freePairs(geometryOf(this.#layout()), played.cells, this.#rule()).length === 0) {
      this.dispatchEvent(new CustomEvent("jarajara-stuck", { bubbles: true, composed: true, detail: { tilesLeft: tilesLeft(played.cells) } }));
    }
    this.#draw();
    return true;
  }

  /** Light the pair a hint names, if hints are left and a pair can be taken. Answers the pair. */
  hint(): [number, number] | null {
    const allowed = allowanceOf(this.getAttribute("hints"));
    if (isOn(this, "static") || isCleared(this.cells)) return null;
    if (allowed !== null && this.#hintsUsed >= allowed) {
      this.#note = say(languageOf(this), "noHints");
      this.#draw();
      return null;
    }
    const pair = hintPair(this.#layout(), this.cells, this.#rule());
    if (pair === null) return null;
    this.#hintsUsed += 1;
    this.#hinted = [...pair];
    this.#chosen = null;
    this.#note = "";
    this.dispatchEvent(new CustomEvent("jarajara-hint", { bubbles: true, composed: true, detail: { pair } }));
    this.#draw();
    return pair;
  }

  /** Shuffle the tiles that are left, which is for when no pair can be taken. Answers whether it was done. */
  shuffle(): boolean {
    const allowed = allowanceOf(this.getAttribute("shuffles"));
    const language = languageOf(this);
    if (isOn(this, "static") || isCleared(this.cells)) return false;
    if (allowed !== null && this.#shufflesUsed() >= allowed) {
      this.#note = say(language, "noShuffles");
      this.#draw();
      return false;
    }
    const next = [...this.#moves, { shuffle: true as const }];
    const played = this.#playedFrom(next);
    if (played === null || freePairs(geometryOf(this.#layout()), this.cells, this.#rule()).length > 0) {
      this.#note = say(language, "lost");
      this.#draw();
      return false;
    }
    this.#moves = next;
    this.#played = played;
    this.#chosen = null;
    this.#hinted = [];
    this.#note = "";
    this.dispatchEvent(new CustomEvent("jarajara-shuffle", { bubbles: true, composed: true, detail: { shuffles: played.shuffles } }));
    this.#draw();
    return true;
  }

  /** Take the last move back. Answers whether there was one to take back. */
  undo(): boolean {
    if (isOn(this, "static") || !this.#undoAllowed() || this.#moves.length === 0) return false;
    this.#moves = this.#moves.slice(0, -1);
    this.#played = this.#playedFrom(this.#moves);
    this.#chosen = null;
    this.#hinted = [];
    this.#note = "";
    if (this.#seconds !== null) {
      this.#seconds = null;
      this.#startClock();
    }
    this.dispatchEvent(new CustomEvent("jarajara-undo", { bubbles: true, composed: true, detail: { moves: this.moves } }));
    this.#draw();
    return true;
  }

  #undoAllowed(): boolean {
    return !this.hasAttribute("undo") || isOn(this, "undo");
  }

  /** Put the lined-up view in the order the keys give (`"x"`, `"-z y x"`) and show it. */
  sortBy(keys: string): void {
    this.setAttribute("sort", keys);
    this.setAttribute("view", "lined");
  }

  #startClock(): void {
    if (this.#startedAt !== null) return;
    this.#startedAt = Date.now();
    if (isOn(this, "timer") && this.#ticker === null) this.#ticker = setInterval(() => this.#tick(), 1000);
  }

  #stopClock(): void {
    if (this.#ticker !== null) clearInterval(this.#ticker);
    this.#ticker = null;
  }

  #elapsed(): number {
    return this.#startedAt === null ? 0 : Math.max(1, Math.round((Date.now() - this.#startedAt) / 1000));
  }

  #tick(): void {
    const clock = this.#root?.querySelector(".clock");
    if (clock !== null && clock !== undefined) clock.textContent = this.#clockText();
  }

  #clockText(): string {
    if (!isOn(this, "timer")) return "";
    const seconds = this.#seconds ?? (this.#startedAt === null ? 0 : Math.round((Date.now() - this.#startedAt) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  connectedCallback(): void {
    this.#forget ??= followLanguage(() => this.#draw());
    if (this.#root === null) {
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.addEventListener("click", (event) => this.#clicked(event));
      this.newDeal();
      return;
    }
    this.#draw();
  }

  disconnectedCallback(): void {
    this.#forget?.();
    this.#forget = null;
    this.#stopClock();
  }

  attributeChangedCallback(name: string, before: string | null, after: string | null): void {
    if (this.#root === null || before === after) return;
    // A different layout, level, deal or position is a new deal; anything else is the same game drawn again.
    if (["size", "level", "seed", "cells"].includes(name)) {
      if (name === "seed") this.#seed = 0;
      this.newDeal();
      return;
    }
    if (name === "timer") {
      if (isOn(this, "timer") && this.#startedAt !== null && this.#seconds === null) this.#startClock();
      else this.#stopClock();
    }
    this.#draw();
  }

  #clicked(event: Event): void {
    const path = event.composedPath();
    const button = path.find((one): one is HTMLElement => one instanceof HTMLElement && one.dataset.action !== undefined);
    if (button !== undefined) {
      const action = button.dataset.action;
      if (action === "new") this.newDeal();
      else if (action === "undo") this.undo();
      else if (action === "hint") this.hint();
      else if (action === "shuffle") this.shuffle();
      return;
    }
    const tile = path.find((one): one is Element => one instanceof Element && one.hasAttribute("data-slot"));
    if (tile === undefined || isOn(this, "static") || isCleared(this.cells)) return;
    const slot = Number(tile.getAttribute("data-slot"));
    const language = languageOf(this);
    this.#hinted = [];
    if (tile.getAttribute("data-free") !== "true") {
      this.#note = say(language, "blocked");
      this.#draw();
      this.#shake(slot);
      return;
    }
    this.#note = "";
    if (this.#chosen === null || this.#chosen === slot) {
      this.#chosen = this.#chosen === slot ? null : slot;
      this.#draw();
      return;
    }
    if (this.take(this.#chosen, slot)) return;
    this.#note = say(language, "noMatch");
    this.#chosen = slot;
    this.#draw();
  }

  #shake(slot: number): void {
    const tile = this.#root?.querySelector(`[data-slot="${slot}"]`);
    if (tile === null || tile === undefined || lessMotion() || typeof tile.animate !== "function") return;
    const at = tile.getAttribute("transform") ?? "";
    tile.animate([{ transform: at }, { transform: `${at} translate(-2.5 0)` }, { transform: `${at} translate(2.5 0)` }, { transform: at }], { duration: 220 });
  }

  /** The line that says how the game stands. */
  #status(language: "en" | "ja"): string {
    const cells = this.cells;
    if (isCleared(cells)) return say(language, "cleared", { seconds: this.#seconds ?? this.#elapsed() });
    const pairs = freePairs(geometryOf(this.#layout()), cells, this.#rule()).length;
    if (pairs === 0) return say(language, this.#shufflesLeft() === 0 ? "lost" : "stuck");
    return say(language, "left", { tiles: tilesLeft(cells), pairs, pairsWord: say(language, pairs === 1 ? "pair" : "pairs") });
  }

  #shufflesLeft(): number | null {
    const allowed = allowanceOf(this.getAttribute("shuffles"));
    return allowed === null ? null : Math.max(0, allowed - this.#shufflesUsed());
  }

  /** What the drawn skeleton was made for: when it changes the whole of it is made again, otherwise only its parts are brought up to date. */
  #built = "";

  #draw(): void {
    const root = this.#root;
    if (root === null || this.#played === null) return;
    wearCloth(this);
    const language = languageOf(this);
    const { design, ready } = designNamed(this.getAttribute("design"));
    if (ready !== null) void ready.then(() => this.#draw());
    const layout = this.#layout();
    const cells = this.cells;
    const geometry = geometryOf(layout);
    const rule = this.#rule();
    const pairs = freePairs(geometry, cells, rule).length;
    const left = tilesLeft(cells);
    const playable = !isOn(this, "static") && left > 0;
    const redFives = isOn(this, "red-fives");
    const reds = redFives && design?.red !== undefined;
    const controls = isOn(this, "controls");
    const status = controls || isOn(this, "timer");
    // The skeleton: the faces' symbols (a design's are big, so they are made once), the board and the controls.
    const key = [design?.name ?? "", reds, controls, status, language].join("|");
    if (key !== this.#built) {
      this.#built = key;
      const symbols = design === null ? "" : tileFaceSymbols("jjl", { design, red: reds });
      const buttons = controls ? `<div class="controls" part="controls">${["new", "undo", "hint", "shuffle"].map((action) => `<button type="button" part="button" data-action="${action}"></button>`).join("")}</div>` : "";
      const lines = status ? `<div class="status" part="status" aria-live="polite"><span class="line"></span><span class="clock" part="clock"></span><span class="note"></span></div>` : "";
      root.innerHTML = `<style>${LAYOUT_STYLE}</style><svg class="defs" width="0" height="0" aria-hidden="true">${symbols}</svg><div class="board" part="board"></div>${lines}${buttons}`;
    }
    const matching = this.#chosen !== null && isOn(this, "show-matching") ? [...cells].flatMap((code, at) => (at !== this.#chosen && code !== "." && canTake(geometry, cells, rule, this.#chosen as number, at) ? [at] : [])) : [];
    const lined = this.getAttribute("view") === "lined";
    const board = root.querySelector(".board") as HTMLElement;
    board.dataset.view = lined ? "lined" : "stack";
    board.dataset.playable = String(playable);
    board.innerHTML = design === null ? "" : lined ? this.#lined(layout, cells, design, reds, language) : (layoutSvg(this.#size, cells, { chosen: this.#chosen, hinted: this.#hinted, matching, showFree: isOn(this, "show-free"), design, redFives, prefix: "jjl", symbols: false, redFrom: this.#epoch() }) ?? "");
    const allowedHints = allowanceOf(this.getAttribute("hints"));
    const hintsLeft = allowedHints === null ? null : Math.max(0, allowedHints - this.#hintsUsed);
    const shufflesLeft = this.#shufflesLeft();
    const set = (selector: string, text: string) => {
      const found = root.querySelector(selector);
      if (found !== null) found.textContent = text;
    };
    if (controls) {
      const button = (action: string, label: string, disabled: boolean) => {
        const found = root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
        if (found === null) return;
        found.textContent = label;
        found.disabled = disabled;
      };
      button("new", say(language, "newDeal"), false);
      button("undo", say(language, "undo"), isOn(this, "static") || this.#moves.length === 0 || !this.#undoAllowed());
      button("hint", `${say(language, "hint")}${hintsLeft === null ? "" : ` (${hintsLeft})`}`, !playable || pairs === 0 || hintsLeft === 0);
      button("shuffle", `${say(language, "shuffle")}${shufflesLeft === null ? "" : ` (${shufflesLeft})`}`, !playable || pairs > 0 || shufflesLeft === 0);
    }
    if (status) {
      set(".line", this.#status(language));
      set(".clock", this.#clockText());
      set(".note", this.#note);
    }
    this.setAttribute("role", "group");
    this.setAttribute("aria-label", say(language, lined ? "layoutLined" : "layoutLabel", { n: left, keys: readSlotKeys(this.getAttribute("sort")).join(" ") || "z y x" }));
  }

  /** The tiles lined up in the order the sort keys give, each with where its slot lies. */
  #lined(layout: MahjongLayout, cells: string, design: TileDesign, reds: boolean, language: "en" | "ja"): string {
    const order = sortSlots(layout, readSlotKeys(this.getAttribute("sort")).length === 0 ? ["z", "y", "x"] : readSlotKeys(this.getAttribute("sort")));
    const redSet = reds ? redFiveIndexes(this.#epoch()) : new Set<number>();
    const geometry = geometryOf(layout);
    const items = order.map((index) => {
      const code = cells[index]!;
      const at = describeSlot(layout, index)!;
      const picture = code === "." ? `<span class="gone"></span>` : (tileSvg(code, { design, red: redSet.has(index), title: tileName(code, language) }) ?? "");
      return `<li class="cell" data-slot="${index}" data-free="${isFree(geometry, cells, index)}"><span class="tile">${picture}</span><span class="where">x ${at.x} y ${at.y} z ${at.z}</span></li>`;
    });
    return `<ol class="lined">${items.join("")}</ol>`;
  }
}

const LAYOUT_STYLE = `
:host { display: block; max-width: 100%; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
:host([hidden]) { display: none; }
.defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.board { width: 100%; margin: 0 auto; touch-action: manipulation; }
.board svg { display: block; width: 100%; height: auto; }
.board [data-free="true"] { cursor: pointer; }
.board [data-free="false"] { cursor: not-allowed; }
.board[data-playable="false"] [data-slot] { cursor: default; }
.lined { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px 6px; }
.lined .cell { display: grid; justify-items: center; gap: 2px; font-size: .62rem; line-height: 1.15; }
.lined .tile { display: block; width: 44px; aspect-ratio: 32 / 42; }
.lined .tile svg { display: block; width: 100%; height: 100%; }
.lined .gone { display: block; width: 100%; height: 100%; border: 1px dashed currentColor; border-radius: 4px; opacity: .35; box-sizing: border-box; }
.status { display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; margin-top: 10px; min-height: 4.2em; align-content: start; font-weight: 600; }
.status .line { text-align: center; grid-column: 1 / -1; min-height: 1.4em; }
.status .clock { grid-column: 2; grid-row: 1; font-variant-numeric: tabular-nums; }
.status .note { grid-column: 1 / -1; text-align: center; min-height: 1.4em; color: var(--jarajara-note, #b5452c); }
.controls { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 8px; }
.controls button { font: inherit; padding: 8px 14px; min-height: 44px; border-radius: 8px; border: 1px solid rgba(0,0,0,.25); background: rgba(255,255,255,.9); color: #22231f; cursor: pointer; }
.controls button:disabled { opacity: .5; cursor: default; }
${CLOTH_STYLE}
`;
