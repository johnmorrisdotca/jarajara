import { freshAwaseSeed, generateAwase } from "../awase.ts";
import { describeSlot, readSlotKeys, sortSlots } from "../arrange.ts";
import { canTake, freePairs, geometryOf, isFree, matchesOf, tilesLeft } from "../board.ts";
import { isTileMirror, TILE_MIRRORS, type TileMirror } from "../block.ts";
import { isAwaseChallenge, PURGE_GROUPS, readRun, runHint, runMarked, runPairs, runShuffle, runStart, runTake, runTick, runUndo, startRun, type AwaseOptions, type AwaseRun } from "../challenge.ts";
import type { TileDesign } from "../design.types.ts";
import { redFiveIndexes } from "../designs.ts";
import { layoutSvg } from "../draw.ts";
import { tileFaceSymbols, tileSvg } from "../faces.ts";
import { layoutFor } from "../layouts.ts";
import { decodeMoves, encodeMoves } from "../moves.ts";
import { tileName } from "../names.ts";
import { groupWords, type TileLanguage } from "../names.ts";
import { bonusRuleOf, isFaceCode, pairPoints } from "../tiles.ts";
import type { AwaseLevel, MahjongBonusRule, MahjongLayout } from "../types.ts";
import { boxOf, CLOTH_STYLE, designNamed, ElementBase, followLanguage, isOn, languageOf, lessMotion, playSound, say, wearCloth, FRAME_MARGIN, FRAME_STYLE } from "./elementKit.ts";

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

/** `m:ss` for a number of milliseconds, rounded up to the second so a clock never reads 0:00 with time left. */
function clockOf(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
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
 *   challenge      `gold`, `spark`, `rush`, `fortune`, `sand`, `purge` or `blackout`: the deal played for something else (`AWASE_CHALLENGES`); the clocks and goals are worked out from the layout
 *   timer          shows the game's clock: the time left in a challenge that has a clock, otherwise the time taken, from the first pair taken until the layout is clear
 *   controls       draws New deal, Undo, Hint and Shuffle buttons and the line that says how the game stands
 *   view           `stack` (unless said) draws the layout; `lined` draws its tiles lined up in a row, in the order `sort` gives, each with where it lies
 *   sort           how `lined` puts the slots in order: the keys `x`, `y` and `z`, `-` before one for the other way round: `"z y x"` (unless said), `"x"`, `"-z x"`
 *   find           pointing at a tile (a mouse) or choosing one lights every tile that matches it: a free match (one to take with it now) in a solid ring, a held one in a dashed ring
 *   mirror         the view: `none` (unless said), `horizontal`, `vertical` or `both`: the board seen from the other side. A view only: the rules, hints and saved games keep the layout's own sides
 *   flippable      with `controls`, a Flip button that turns the view through the four
 *   box            keeps the board in one steady box whatever the layout: a ratio as `3/2`, or `landscape`, `portrait`, `square`; the layout is scaled to fit it
 *   static         the tiles may be looked at but not played
 *   sound          a tile chosen, a pair taken, a shuffle and a cleared layout make their sounds
 *   design, red-fives, lang, cloth   as on the other elements
 *
 * Methods: `newDeal(seed?)`, `take(a, b)`, `hint()`, `shuffle()`, `undo()`, `restore(moves)`, `sortBy(keys)`. Properties: `seed`, `cells`,
 * `moves` (as `encodeMoves` writes them), `tilesLeft`, `score` and `run`, the game as an `AwaseRun`. Events, all bubbling: `jarajara-take` (`{ pair, codes, tilesLeft }`),
 * `jarajara-shuffle`, `jarajara-stuck`, `jarajara-clear` (`{ moves, seconds, score }`, a game won), `jarajara-lost` (`{ because }`: `time` or `stuck`), `jarajara-hint`, `jarajara-undo` and `jarajara-deal`
 * (`{ size, level, seed }`, a deal made, which a page that keeps the game listens for).
 */
export class JarajaraLayout extends ElementBase {
  static get observedAttributes(): readonly string[] {
    return ["size", "level", "seed", "cells", "show-free", "show-matching", "hints", "shuffles", "undo", "challenge", "timer", "controls", "view", "sort", "static", "design", "red-fives", "lang", "cloth", "sound", "find", "mirror", "flippable", "box"];
  }

  #root: ShadowRoot | null = null;
  #forget: (() => void) | null = null;
  #givens = "";
  #size = 15;
  #seed = 0;
  /** The `seed` attribute last dealt from, so a new deal draws a fresh seed instead of dealing the same tiles again. */
  #dealtFrom: string | null = null;
  #run: AwaseRun | null = null;
  #chosen: number | null = null;
  /** The tile a mouse is over, for Find. */
  #hover: number | null = null;
  #hinted: number[] = [];
  #note = "";
  /** When the first pair was taken, for a game that counts up, and how long the game took once it was won. */
  #startedAt: number | null = null;
  #seconds: number | null = null;
  #ticker: ReturnType<typeof setInterval> | null = null;

  /** The seed of the deal being played. */
  get seed(): number {
    return this.#seed;
  }

  /** The tiles as they lie, one letter a slot, `.` where one has been taken. */
  get cells(): string {
    return this.#run?.cells ?? this.#givens;
  }

  /** The moves played so far, written as `encodeMoves` writes them. */
  get moves(): string {
    return encodeMoves(this.#run?.moves ?? []);
  }

  /** How many tiles are still on the layout. */
  get tilesLeft(): number {
    return tilesLeft(this.cells);
  }

  /** The points scored so far: a pair is worth its layer, and quick pairs in a row are worth more. */
  get score(): number {
    return this.#run?.score ?? 0;
  }

  /** The game as the rules hold it (`AwaseRun`): its moves, its clock, its goal and whether it is won or lost. Null before the first deal. */
  get run(): AwaseRun | null {
    return this.#run;
  }

  #layout(): MahjongLayout {
    return layoutFor(this.#size) ?? (layoutFor(15) as MahjongLayout);
  }

  #rule(): MahjongBonusRule {
    return bonusRuleOf(this.#givens);
  }

  /** The options the attributes give a game. */
  #options(): AwaseOptions {
    const challenge = this.getAttribute("challenge");
    return {
      challenge: isAwaseChallenge(challenge) ? challenge : null,
      hints: allowanceOf(this.getAttribute("hints")),
      shuffles: allowanceOf(this.getAttribute("shuffles")),
      undo: !this.hasAttribute("undo") || isOn(this, "undo"),
    };
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
    this.#run = startRun({ size: this.#size, seed: this.#seed, givens: this.#givens }, this.#options());
    this.#chosen = null;
    this.#hinted = [];
    this.#note = "";
    this.#startedAt = null;
    this.#seconds = null;
    this.#stopClock();
    this.#draw();
    this.dispatchEvent(new CustomEvent("jarajara-deal", { bubbles: true, composed: true, detail: { size: this.#size, level: this.getAttribute("level") ?? "medium", seed: this.#seed } }));
  }

  /**
   * Play a game written as text (`encodeMoves`) on the deal being played, as a kept game is opened again. Answers
   * whether every move was one the rules allow; if one was not, the game is left as it was. No time passes while it is
   * played back, so a challenge's clock is where it was kept, which is the start.
   */
  restore(moves: string): boolean {
    const decoded = decodeMoves(moves, this.#layout().slots.length);
    if (decoded === null || this.#run === null) return false;
    const now = Date.now();
    let run: AwaseRun | null = startRun({ size: this.#size, seed: this.#seed, givens: this.#givens }, this.#options(), now);
    for (const move of decoded) {
      if (run === null) break;
      run = "shuffle" in move ? runShuffle(run, now) : runTake(run, move.pair[0], move.pair[1], now);
    }
    if (run === null) return false;
    this.#run = run;
    this.#chosen = null;
    this.#hinted = [];
    this.#note = "";
    if (decoded.length > 0 && run.over === null) this.#startClock();
    this.#draw();
    return true;
  }

  /** The tiles as they last lay all together, as dealt or as last shuffled: what the red fives are decided by, so one stays the same tile as the others are taken. */
  #epoch(): string {
    const run = this.#run;
    if (run === null) return this.#givens;
    const last = run.moves.map((move) => "shuffle" in move).lastIndexOf(true);
    if (last === -1) return this.#givens;
    return last === run.moves.length - 1 ? run.cells : (run.history[last + 1]?.cells ?? this.#givens);
  }

  /** Take a pair, as a player's two taps do. Answers whether the pair could be taken: two free tiles that match, in a game that is not over. */
  take(a: number, b: number): boolean {
    const run = this.#run;
    if (run === null || isOn(this, "static")) return false;
    const before = this.cells;
    const next = runTake(run, a, b, Date.now());
    if (next === null) return false;
    // A pair taken after the clock ran out is the move that finds it out: it is not taken.
    if (next.pairs === run.pairs) {
      this.#run = next;
      this.#finish(next, run);
      this.#draw();
      return false;
    }
    this.#startClock();
    this.#run = next;
    this.#chosen = null;
    this.#hinted = [];
    this.#note = "";
    playSound(this, next.over === "won" ? "win" : "pair");
    this.dispatchEvent(new CustomEvent("jarajara-take", { bubbles: true, composed: true, detail: { pair: [a, b], codes: [before[a], before[b]], points: pairPoints(before[a]!), score: next.score, tilesLeft: tilesLeft(next.cells) } }));
    this.#finish(next, run);
    if (next.over === null && runPairs(next).length === 0) this.dispatchEvent(new CustomEvent("jarajara-stuck", { bubbles: true, composed: true, detail: { tilesLeft: tilesLeft(next.cells) } }));
    this.#draw();
    return true;
  }

  /** Tell the page that a game has been won or lost, once, when it first is. */
  #finish(next: AwaseRun, before: AwaseRun): void {
    if (next.over === null || before.over !== null) return;
    this.#seconds = this.#elapsed();
    this.#stopClock();
    if (next.over === "won") this.dispatchEvent(new CustomEvent("jarajara-clear", { bubbles: true, composed: true, detail: { moves: this.moves, seconds: this.#seconds, score: next.score, because: next.because } }));
    else this.dispatchEvent(new CustomEvent("jarajara-lost", { bubbles: true, composed: true, detail: { because: next.because } }));
  }

  /**
   * Light the pair a hint names, if hints are left and a pair can be taken. With a tile chosen it looks for that tile's
   * match first and lights it, leaving the chosen tile as it is; if that tile has no free match it says so and shows
   * another pair. Answers the pair (the chosen tile first, for its match).
   */
  hint(): [number, number] | null {
    const run = this.#run;
    if (run === null || isOn(this, "static") || run.over !== null) return null;
    const hint = runHint(run, this.#chosen);
    if (hint === null) {
      if (run.rules.hints !== null && run.hintsUsed >= run.rules.hints) {
        this.#note = say(languageOf(this), "noHints");
        this.#draw();
      }
      return null;
    }
    this.#run = hint.run;
    if (hint.found === "match") {
      this.#hinted = [hint.pair[1]];
      this.#note = "";
    } else {
      this.#hinted = [...hint.pair];
      this.#chosen = null;
      this.#note = hint.found === "other" ? say(languageOf(this), "noFreeMatch") : "";
    }
    playSound(this, "pick");
    this.dispatchEvent(new CustomEvent("jarajara-hint", { bubbles: true, composed: true, detail: { pair: hint.pair, found: hint.found } }));
    this.#draw();
    return hint.pair;
  }

  /** Shuffle the tiles that are left, which is for when no pair can be taken. Answers whether it was done. */
  shuffle(): boolean {
    const run = this.#run;
    const language = languageOf(this);
    if (run === null || isOn(this, "static") || run.over !== null) return false;
    const next = runShuffle(run, Date.now());
    if (next === null) {
      const out = run.rules.shuffles !== null && run.shuffles >= run.rules.shuffles;
      this.#note = say(language, out ? "noShuffles" : "lost");
      this.#draw();
      return false;
    }
    this.#startClock();
    this.#run = next;
    this.#chosen = null;
    this.#hinted = [];
    this.#note = "";
    playSound(this, "shuffle");
    this.dispatchEvent(new CustomEvent("jarajara-shuffle", { bubbles: true, composed: true, detail: { shuffles: next.shuffles } }));
    this.#finish(next, run);
    this.#draw();
    return true;
  }

  /** Take the last move back. Answers whether there was one to take back, and the rules allow it. */
  undo(): boolean {
    const run = this.#run;
    if (run === null || isOn(this, "static")) return false;
    const next = runUndo(run, Date.now());
    if (next === null) return false;
    this.#run = next;
    this.#chosen = null;
    this.#hinted = [];
    this.#note = "";
    if (this.#seconds !== null && next.over === null) {
      this.#seconds = null;
      this.#startClock();
    }
    playSound(this, "place");
    this.dispatchEvent(new CustomEvent("jarajara-undo", { bubbles: true, composed: true, detail: { moves: this.moves } }));
    this.#draw();
    return true;
  }

  /** Put the lined-up view in the order the keys give (`"x"`, `"-z y x"`) and show it. */
  sortBy(keys: string): void {
    this.setAttribute("sort", keys);
    this.setAttribute("view", "lined");
  }

  /** The view now: `none`, `horizontal`, `vertical` or `both`. */
  get mirror(): TileMirror {
    const asked = this.getAttribute("mirror");
    return isTileMirror(asked) ? asked : "none";
  }

  /** Turn the board to the next view (none, left to right, top to bottom, both), as the Flip button does. Only the picture changes. */
  flipView(): TileMirror {
    const next = TILE_MIRRORS[(TILE_MIRRORS.indexOf(this.mirror) + 1) % TILE_MIRRORS.length]!;
    this.setAttribute("mirror", next);
    playSound(this, "flip");
    return next;
  }

  /** The game's clock goes on from the first pair: it counts the seconds, and a challenge's clock runs down. */
  #startClock(): void {
    if (this.#startedAt === null) this.#startedAt = Date.now();
    if (this.#run !== null) this.#run = runStart(this.#run, Date.now());
    if ((isOn(this, "timer") || this.#run?.rules.timeMs != null) && this.#ticker === null && this.#run?.over === null) this.#ticker = setInterval(() => this.#tick(), 250);
  }

  #stopClock(): void {
    if (this.#ticker !== null) clearInterval(this.#ticker);
    this.#ticker = null;
  }

  #elapsed(): number {
    return this.#startedAt === null ? 0 : Math.max(1, Math.round((Date.now() - this.#startedAt) / 1000));
  }

  /** Once a quarter second: bring the clock up to date, and find out whether time ran out. */
  #tick(): void {
    const run = this.#run;
    if (run === null) return;
    const next = runTick(run, Date.now());
    if (next !== run) {
      this.#run = next;
      this.#finish(next, run);
      this.#draw();
      return;
    }
    const clock = this.#root?.querySelector(".clock");
    if (clock !== null && clock !== undefined) clock.textContent = this.#clockText();
  }

  #clockText(): string {
    const run = this.#run;
    if (run === null || !(isOn(this, "timer") || run.rules.timeMs !== null)) return "";
    // A challenge with a clock counts down; any other game counts up.
    if (run.rules.timeMs !== null) return clockOf(readRun(run, Date.now()).remainingMs ?? 0);
    const seconds = this.#seconds ?? (this.#startedAt === null ? 0 : Math.round((Date.now() - this.#startedAt) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  connectedCallback(): void {
    this.#forget ??= followLanguage(() => this.#draw());
    if (this.#root === null) {
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.addEventListener("click", (event) => this.#clicked(event));
      // Find, with a mouse: the tile pointed at lights its matches. A touch has no pointing, so it waits for a choice.
      this.#root.addEventListener("pointerover", (event) => this.#pointed(event as PointerEvent));
      this.#root.addEventListener("pointerleave", () => this.#point(null));
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
    // A different layout, level, deal, position or challenge is a new deal; anything else is the same game drawn again.
    if (["size", "level", "seed", "cells", "challenge"].includes(name)) {
      if (name === "seed") this.#seed = 0;
      this.newDeal();
      return;
    }
    // The limits are the game's own: changing them changes the rules from here on, never what has been played.
    if (["hints", "shuffles", "undo"].includes(name) && this.#run !== null) {
      const options = this.#options();
      const rules = startRun({ size: this.#size, seed: this.#seed, givens: this.#givens }, options).rules;
      this.#run = { ...this.#run, rules: { ...this.#run.rules, hints: rules.hints, shuffles: rules.shuffles, undo: rules.undo } };
    }
    if (name === "timer") {
      if (isOn(this, "timer") && this.#startedAt !== null && this.#seconds === null) this.#startClock();
      else if (this.#run?.rules.timeMs == null) this.#stopClock();
    }
    this.#draw();
  }

  #clicked(event: Event): void {
    const path = event.composedPath();
    const button = path.find((one): one is HTMLElement => one instanceof HTMLElement && one.dataset.action !== undefined);
    if (button !== undefined) {
      const action = button.dataset.action;
      if (action === "new") {
        playSound(this, "shuffle");
        this.newDeal();
      } else if (action === "undo") this.undo();
      else if (action === "hint") this.hint();
      else if (action === "shuffle") this.shuffle();
      else if (action === "flip") this.flipView();
      return;
    }
    const tile = path.find((one): one is Element => one instanceof Element && one.hasAttribute("data-slot"));
    const run = this.#run;
    if (tile === undefined || run === null || isOn(this, "static") || run.over !== null) return;
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
    this.#startClock();
    if (this.#chosen === null || this.#chosen === slot) {
      playSound(this, this.#chosen === slot ? "place" : "pick");
      this.#chosen = this.#chosen === slot ? null : slot;
      this.#draw();
      return;
    }
    if (this.take(this.#chosen, slot)) return;
    if (this.#run?.over !== null) return;
    this.#note = say(language, "noMatch");
    this.#chosen = slot;
    this.#draw();
  }

  #pointed(event: PointerEvent): void {
    if (event.pointerType !== "mouse" || !isOn(this, "find")) return;
    const tile = event.composedPath().find((one): one is Element => one instanceof Element && one.hasAttribute("data-slot"));
    this.#point(tile === undefined ? null : Number(tile.getAttribute("data-slot")));
  }

  /** The tile a mouse is over, and a redraw for Find if that changes what is lit. */
  #point(slot: number | null): void {
    if (slot === this.#hover) return;
    this.#hover = slot;
    if (this.#chosen === null && isOn(this, "find")) this.#draw();
  }

  #shake(slot: number): void {
    const tile = this.#root?.querySelector(`[data-slot="${slot}"]`);
    if (tile === null || tile === undefined || lessMotion() || typeof tile.animate !== "function") return;
    const at = tile.getAttribute("transform") ?? "";
    tile.animate([{ transform: at }, { transform: `${at} translate(-2.5 0)` }, { transform: `${at} translate(2.5 0)` }, { transform: at }], { duration: 220 });
  }

  /** What the challenge asks, in words: the gold tile, the group to purge, the pairs or points to reach. */
  #goalLine(language: TileLanguage): string {
    const run = this.#run;
    if (run === null || run.rules.challenge === null) return "";
    const goal = readRun(run, Date.now()).goal;
    if (goal?.kind === "pairs") return say(language, "rush", { done: goal.done, goal: goal.of });
    if (goal?.kind === "score") return say(language, "fortune", { score: goal.done, goal: goal.of });
    if (goal?.kind === "purge") {
      const group = PURGE_GROUPS.find((one) => one.key === run.purge);
      return say(language, "purge", { suit: group === undefined ? "" : groupWords(group.key === "honours" ? "honours" : group.key, language), done: goal.done, goal: goal.of });
    }
    if (run.rules.challenge === "gold") return say(language, "gold");
    if (run.rules.challenge === "spark") return say(language, "spark", { tile: run.spark === null ? "" : tileName(run.spark, language) });
    if (run.rules.challenge === "sand") return say(language, "sand");
    if (run.rules.challenge === "blackout") return say(language, "blackout");
    return "";
  }

  /** The line that says how the game stands. */
  #status(language: TileLanguage): string {
    const run = this.#run;
    if (run === null) return "";
    if (run.over === "won") return run.because === "cleared" ? say(language, "cleared", { seconds: this.#seconds ?? this.#elapsed() }) : say(language, "won", { score: run.score });
    if (run.over === "lost") return say(language, run.because === "time" ? "timeUp" : "lost");
    const pairs = runPairs(run).length;
    if (pairs === 0) return say(language, run.rules.shuffles !== null && run.shuffles >= run.rules.shuffles ? "lost" : "stuck");
    return say(language, "left", { tiles: tilesLeft(run.cells), pairs, pairsWord: say(language, pairs === 1 ? "pair" : "pairs") });
  }

  /** What the elements keeps of the skeleton: when it changes the whole of it is made again, otherwise only its parts are brought up to date. */
  #built = "";

  #draw(): void {
    const root = this.#root;
    const run = this.#run;
    if (root === null || run === null) return;
    wearCloth(this);
    const language = languageOf(this);
    const { design, ready } = designNamed(this.getAttribute("design"));
    if (ready !== null) void ready.then(() => this.#draw());
    const layout = this.#layout();
    const cells = run.cells;
    const geometry = geometryOf(layout);
    const rule = this.#rule();
    const pairs = runPairs(run).length;
    const left = tilesLeft(cells);
    const playable = !isOn(this, "static") && run.over === null && left > 0;
    const redFives = isOn(this, "red-fives");
    const reds = redFives && design?.red !== undefined;
    const controls = isOn(this, "controls");
    const status = controls || isOn(this, "timer") || run.rules.challenge !== null;
    // The skeleton: the faces' symbols (a design's are big, so they are made once), the board and the controls.
    const flippable = controls && isOn(this, "flippable");
    const key = [design?.name ?? "", reds, controls, status, flippable, language].join("|");
    if (key !== this.#built) {
      this.#built = key;
      const symbols = design === null ? "" : tileFaceSymbols("jjl", { design, red: reds });
      const buttons = controls ? `<div class="controls" part="controls">${["new", "undo", "hint", "shuffle", ...(flippable ? ["flip"] : [])].map((action) => `<button type="button" part="button" data-action="${action}"></button>`).join("")}</div>` : "";
      const lines = status ? `<div class="status" part="status" aria-live="polite"><span class="goal"></span><span class="clock" part="clock"></span><span class="line"></span><span class="note"></span></div>` : "";
      root.innerHTML = `<style>${LAYOUT_STYLE}</style><svg class="defs" width="0" height="0" aria-hidden="true">${symbols}</svg><div class="frame" part="frame"><div class="board" part="board"></div></div>${lines}${buttons}`;
    }
    const target = isOn(this, "find") ? (this.#chosen ?? this.#hover) : null;
    const found = target === null ? undefined : matchesOf(geometry, cells, rule, target);
    const matching = this.#chosen !== null && isOn(this, "show-matching") ? [...cells].flatMap((code, at) => (at !== this.#chosen && code !== "." && canTake(geometry, cells, rule, this.#chosen as number, at) ? [at] : [])) : [];
    const lined = this.getAttribute("view") === "lined";
    const board = root.querySelector(".board") as HTMLElement;
    board.dataset.view = lined ? "lined" : "stack";
    const ratio = boxOf(this.getAttribute("box"));
    board.style.aspectRatio = ratio === null ? "" : `var(--jarajara-box, ${ratio})`;
    board.dataset.box = ratio === null ? "none" : "fixed";
    board.dataset.playable = String(playable);
    board.innerHTML = design === null ? "" : lined ? this.#lined(layout, cells, design, reds, language) : (layoutSvg(this.#size, cells, { chosen: this.#chosen, hinted: this.#hinted, matching, marked: runMarked(run), showFree: isOn(this, "show-free"), hideBlocked: run.rules.hideBlocked && run.over === null, design, redFives, prefix: "jjl", symbols: false, redFrom: this.#epoch(), found, mirror: this.mirror, margin: FRAME_MARGIN }) ?? "");
    const hintsLeft = run.rules.hints === null ? null : Math.max(0, run.rules.hints - run.hintsUsed);
    const shufflesLeft = run.rules.shuffles === null ? null : Math.max(0, run.rules.shuffles - run.shuffles);
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
      button("undo", say(language, "undo"), isOn(this, "static") || run.history.length === 0 || !run.rules.undo || (run.over === "lost" && run.because === "time"));
      button("hint", `${say(language, "hint")}${hintsLeft === null ? "" : ` (${hintsLeft})`}`, !playable || pairs === 0 || hintsLeft === 0);
      button("shuffle", `${say(language, "shuffle")}${shufflesLeft === null ? "" : ` (${shufflesLeft})`}`, !playable || pairs > 0 || shufflesLeft === 0);
      button("flip", say(language, "flip"), lined);
    }
    if (status) {
      set(".goal", this.#goalLine(language));
      set(".line", this.#status(language));
      set(".clock", this.#clockText());
      set(".note", this.#note);
    }
    this.setAttribute("role", "group");
    this.setAttribute("aria-label", say(language, lined ? "layoutLined" : "layoutLabel", { n: left, keys: readSlotKeys(this.getAttribute("sort")).join(" ") || "z y x" }));
  }

  /** The tiles lined up in the order the sort keys give, each with where its slot lies. */
  #lined(layout: MahjongLayout, cells: string, design: TileDesign, reds: boolean, language: TileLanguage): string {
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
${FRAME_STYLE}
.board [data-free="true"] { cursor: pointer; }
.board [data-free="false"] { cursor: not-allowed; }
.board[data-playable="false"] [data-slot] { cursor: default; }
.lined { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px 6px; }
.lined .cell { display: grid; justify-items: center; gap: 2px; font-size: .62rem; line-height: 1.15; }
.lined .tile { display: block; width: 44px; aspect-ratio: 32 / 42; }
.lined .tile svg { display: block; width: 100%; height: 100%; }
.lined .gone { display: block; width: 100%; height: 100%; border: 1px dashed currentColor; border-radius: 4px; opacity: .35; box-sizing: border-box; }
.status { display: grid; grid-template-columns: 1fr auto; gap: 0 10px; margin-top: 8px; min-height: 2.7em; align-content: start; font-weight: 600; line-height: 1.35; }
.status .line { grid-column: 1; grid-row: 1; text-align: center; min-height: 1.35em; }
.status .clock { grid-column: 2; grid-row: 1; font-variant-numeric: tabular-nums; min-width: 3em; text-align: right; }
/* The goal and a note share their line: a note covers the goal while it is there. */
.status .goal, .status .note { grid-column: 1 / -1; grid-row: 2; text-align: center; min-height: 1.35em; }
.status .goal { opacity: .9; }
.status:has(.note:not(:empty)) .goal { visibility: hidden; }
.status .note { color: var(--jarajara-note, #b5452c); }
:host([data-cloth]) .status .note { color: var(--jarajara-note, #f6c3b3); }
.controls { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 4px; }
.controls button { font: inherit; padding: 8px 12px; min-height: 44px; border-radius: 8px; border: 1px solid rgba(0,0,0,.25); background: rgba(255,255,255,.9); color: #22231f; cursor: pointer; }
.controls button:disabled { opacity: .5; cursor: default; }
${CLOTH_STYLE}
`;
