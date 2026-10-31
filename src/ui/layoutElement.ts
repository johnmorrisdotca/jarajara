import { freshAwaseSeed, generateAwase } from "../awase.ts";
import { isTileMirror, TILE_MIRRORS, type TileMirror } from "../block.ts";
import { freePairs, geometryOf, tilesLeft } from "../board.ts";
import {
  type AwaseOptions,
  type AwaseRun,
  isAwaseChallenge,
  runHint,
  runPairs,
  runShuffle,
  runTake,
  runUndo,
  startRun,
} from "../challenge.ts";
import { layoutFor } from "../layouts.ts";
import { decodeMoves, encodeMoves } from "../moves.ts";
import { isFaceCode, pairPoints } from "../tiles.ts";
import type { AwaseLevel, MahjongBonusRule, MahjongLayout } from "../types.ts";
import { followLanguage, isOn, languageOf, playSound, reflectMethod, say } from "./elementKit.ts";
import { LayoutView } from "./layoutView.ts";

/** How many of a thing a game allows: a number, or no limit at all.
 *
 * @example
 * ```ts
 * import type { Allowance } from "@johnmorrisdotca/jarajara/element";
 *
 * const value: Allowance = null;
 * console.log(value);
 * ```
 */
export type Allowance = number | null;

/** Read an allowance from an attribute: nothing or `unlimited` is no limit, `off` or `0` is none, a number is that many.
 *
 * @param text - The unknown text or encoded record to interpret.
 * @returns Read an allowance from an attribute: nothing or `unlimited` is no limit, `off` or `0` is none, a number is that many.
 * @example
 * ```ts
 * import { allowanceOf } from "@johnmorrisdotca/jarajara/element";
 *
 * console.log(allowanceOf("3"));
 * ```
 */
export function allowanceOf(text: string | null): Allowance {
  if (text === null || text.trim() === "" || /^(unlimited|any|many)$/i.test(text.trim())) return null;
  if (/^(off|no|none|false)$/i.test(text.trim())) return 0;
  const count = Number(text);
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : null;
}

const LEVELS: readonly AwaseLevel[] = ["easy", "medium", "hard"];

/** What a hint is: the free pair that leaves the stacks lowest after it, so a hint never digs a tile deeper than it must.
 *
 * @param layout - The native stacked tile positions.
 * @param cells - The face-code string in native slot order; dot marks a removed tile.
 * @param rule - Grouped or identical bonus matching.
 * @returns The preferred legal free pair, or null when no matching free pair exists.
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import { layoutFor } from "@johnmorrisdotca/jarajara";
 * import { hintPair } from "@johnmorrisdotca/jarajara/element";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const layout = layoutFor(4)!;
 * const cells = deal.givens;
 * console.log(hintPair(layout,cells,"group"));
 * ```
 */
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
 *
 * @example
 * ```ts no-run
 * import "@johnmorrisdotca/jarajara/element/define";
 * import { JarajaraLayout } from "@johnmorrisdotca/jarajara/element";
 * const tile = document.createElement("jarajara-layout") as JarajaraLayout;
 * tile.setAttribute("size","4");
 * tile.setAttribute("seed","2026");
 * document.body.append(tile);
 * console.log(tile.tagName);
 * ```
 */
export class JarajaraLayout extends LayoutView {
  static get observedAttributes(): readonly string[] {
    return [
      "size",
      "level",
      "seed",
      "cells",
      "show-free",
      "show-matching",
      "hints",
      "shuffles",
      "undo",
      "challenge",
      "timer",
      "controls",
      "view",
      "sort",
      "static",
      "design",
      "red-fives",
      "lang",
      "cloth",
      "sound",
      "find",
      "mirror",
      "flippable",
      "box",
    ];
  }

  /** The seed of the deal being played. Setting it sets the `seed` attribute, which deals again from it. */
  get seed(): number {
    return this.dealSeed;
  }
  set seed(seed: number | string) {
    this.setAttribute("seed", String(seed));
  }

  /** The tiles as they lie, one letter a slot, `.` where one has been taken. Setting it sets the `cells` attribute, a position of your own. */
  get cells(): string {
    return this.awase?.cells ?? this.givens;
  }
  set cells(cells: string) {
    this.setAttribute("cells", cells);
  }

  /** The moves played so far, written as `encodeMoves` writes them. */
  override get moves(): string {
    return encodeMoves(this.awase?.moves ?? []);
  }

  /** How many tiles are still on the layout. */
  get tilesLeft(): number {
    return tilesLeft(this.cells);
  }

  /** The points scored so far: a pair is worth its layer, and quick pairs in a row are worth more. */
  get score(): number {
    return this.awase?.score ?? 0;
  }

  /** The game as the rules hold it (`AwaseRun`): its moves, its clock, its goal and whether it is won or lost. Null before the first deal. */
  get run(): AwaseRun | null {
    return this.awase;
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
  override newDeal(seed?: number): void {
    const size = Number(this.getAttribute("size"));
    this.boardSize = layoutFor(size) === null ? 15 : size;
    const level = this.getAttribute("level") as AwaseLevel | null;
    const asked = this.getAttribute("seed");
    if (Number.isInteger(seed)) this.dealSeed = seed as number;
    else if (asked !== null && asked !== this.dealtFrom && Number.isInteger(Number(asked)) && Number(asked) > 0) {
      this.dealSeed = Number(asked);
      this.dealtFrom = asked;
    } else this.dealSeed = freshAwaseSeed("group");
    const own = this.getAttribute("cells");
    if (
      own !== null &&
      own.length === this.layout().slots.length &&
      [...own].every((code) => code === "." || isFaceCode(code))
    )
      this.givens = own;
    else
      this.givens = generateAwase(
        this.boardSize,
        level !== null && LEVELS.includes(level) ? level : "medium",
        this.dealSeed,
      ).givens;
    this.awase = startRun({ size: this.boardSize, seed: this.dealSeed, givens: this.givens }, this.#options());
    this.chosen = null;
    this.hinted = [];
    this.note = "";
    this.startedAt = null;
    this.seconds = null;
    this.stopClock();
    this.draw();
    this.dispatchEvent(
      new CustomEvent("jarajara-deal", {
        bubbles: true,
        composed: true,
        detail: { size: this.boardSize, level: this.getAttribute("level") ?? "medium", seed: this.dealSeed },
      }),
    );
  }

  /**
   * Play a game written as text (`encodeMoves`) on the deal being played, as a kept game is opened again. Answers
   * whether every move was one the rules allow; if one was not, the game is left as it was. No time passes while it is
   * played back, so a challenge's clock is where it was kept, which is the start.
   */
  restore(moves: string): boolean {
    const decoded = decodeMoves(moves, this.layout().slots.length);
    if (decoded === null || this.awase === null) return false;
    const now = Date.now();
    let run: AwaseRun | null = startRun(
      { size: this.boardSize, seed: this.dealSeed, givens: this.givens },
      this.#options(),
      now,
    );
    for (const move of decoded) {
      if (run === null) break;
      run = "shuffle" in move ? runShuffle(run, now) : runTake(run, move.pair[0], move.pair[1], now);
    }
    if (run === null) return false;
    this.awase = run;
    this.chosen = null;
    this.hinted = [];
    this.note = "";
    if (decoded.length > 0 && run.over === null) this.startClock();
    this.draw();
    return true;
  }

  /** Take a pair, as a player's two taps do. Answers whether the pair could be taken: two free tiles that match, in a game that is not over. */
  override take(a: number, b: number): boolean {
    const run = this.awase;
    if (run === null || isOn(this, "static")) return false;
    const before = this.cells;
    const next = runTake(run, a, b, Date.now());
    if (next === null) return false;
    // A pair taken after the clock ran out is the move that finds it out: it is not taken.
    if (next.pairs === run.pairs) {
      this.awase = next;
      this.finish(next, run);
      this.draw();
      return false;
    }
    this.startClock();
    this.awase = next;
    this.chosen = null;
    this.hinted = [];
    this.note = "";
    playSound(this, next.over === "won" ? "win" : "pair");
    this.dispatchEvent(
      new CustomEvent("jarajara-take", {
        bubbles: true,
        composed: true,
        detail: {
          pair: [a, b],
          codes: [before[a], before[b]],
          points: pairPoints(before[a]!),
          score: next.score,
          tilesLeft: tilesLeft(next.cells),
        },
      }),
    );
    this.finish(next, run);
    if (next.over === null && runPairs(next).length === 0)
      this.dispatchEvent(
        new CustomEvent("jarajara-stuck", {
          bubbles: true,
          composed: true,
          detail: { tilesLeft: tilesLeft(next.cells) },
        }),
      );
    this.draw();
    return true;
  }

  /**
   * Light the pair a hint names, if hints are left and a pair can be taken. With a tile chosen it looks for that tile's
   * match first and lights it, leaving the chosen tile as it is; if that tile has no free match it says so and shows
   * another pair. Answers the pair (the chosen tile first, for its match).
   */
  override hint(): [number, number] | null {
    const run = this.awase;
    if (run === null || isOn(this, "static") || run.over !== null) return null;
    const hint = runHint(run, this.chosen);
    if (hint === null) {
      if (run.rules.hints !== null && run.hintsUsed >= run.rules.hints) {
        this.note = say(languageOf(this), "noHints");
        this.draw();
      }
      return null;
    }
    this.awase = hint.run;
    if (hint.found === "match") {
      this.hinted = [hint.pair[1]];
      this.note = "";
    } else {
      this.hinted = [...hint.pair];
      this.chosen = null;
      this.note = hint.found === "other" ? say(languageOf(this), "noFreeMatch") : "";
    }
    playSound(this, "pick");
    this.dispatchEvent(
      new CustomEvent("jarajara-hint", {
        bubbles: true,
        composed: true,
        detail: { pair: hint.pair, found: hint.found },
      }),
    );
    this.draw();
    return hint.pair;
  }

  /** Shuffle the tiles that are left, which is for when no pair can be taken. Answers whether it was done. */
  override shuffle(): boolean {
    const run = this.awase;
    const language = languageOf(this);
    if (run === null || isOn(this, "static") || run.over !== null) return false;
    const next = runShuffle(run, Date.now());
    if (next === null) {
      const out = run.rules.shuffles !== null && run.shuffles >= run.rules.shuffles;
      this.note = say(language, out ? "noShuffles" : "lost");
      this.draw();
      return false;
    }
    this.startClock();
    this.awase = next;
    this.chosen = null;
    this.hinted = [];
    this.note = "";
    playSound(this, "shuffle");
    this.dispatchEvent(
      new CustomEvent("jarajara-shuffle", { bubbles: true, composed: true, detail: { shuffles: next.shuffles } }),
    );
    this.finish(next, run);
    this.draw();
    return true;
  }

  /** Take the last move back. Answers whether there was one to take back, and the rules allow it. */
  override undo(): boolean {
    const run = this.awase;
    if (run === null || isOn(this, "static")) return false;
    const next = runUndo(run, Date.now());
    if (next === null) return false;
    this.awase = next;
    this.chosen = null;
    this.hinted = [];
    this.note = "";
    if (this.seconds !== null && next.over === null) {
      this.seconds = null;
      this.startClock();
    }
    playSound(this, "place");
    this.dispatchEvent(
      new CustomEvent("jarajara-undo", { bubbles: true, composed: true, detail: { moves: this.moves } }),
    );
    this.draw();
    return true;
  }

  /** Put the lined-up view in the order the keys give (`"x"`, `"-z y x"`) and show it. */
  sortBy(keys: string): void {
    this.setAttribute("sort", keys);
    this.setAttribute("view", "lined");
  }

  /** The view now: `none`, `horizontal`, `vertical` or `both`. Setting it sets the `mirror` attribute. */
  override get mirror(): TileMirror {
    const asked = this.getAttribute("mirror");
    return isTileMirror(asked) ? asked : "none";
  }
  set mirror(view: TileMirror | string) {
    this.setAttribute("mirror", view);
  }

  /** Turn the board to the next view (none, left to right, top to bottom, both), as the Flip button does. Only the picture changes. */
  override flipView(): TileMirror {
    const next = TILE_MIRRORS[(TILE_MIRRORS.indexOf(this.mirror) + 1) % TILE_MIRRORS.length]!;
    this.setAttribute("mirror", next);
    playSound(this, "flip");
    return next;
  }

  connectedCallback(): void {
    this.forget ??= followLanguage(() => this.draw());
    if (this.root === null) {
      this.root = this.attachShadow({ mode: "open" });
      this.root.addEventListener("click", (event) => this.clicked(event));
      // Find, with a mouse: the tile pointed at lights its matches. A touch has no pointing, so it waits for a choice.
      this.root.addEventListener("pointerover", (event) => this.pointed(event as PointerEvent));
      this.root.addEventListener("pointerleave", () => this.point(null));
      this.newDeal();
      return;
    }
    this.draw();
  }

  disconnectedCallback(): void {
    this.forget?.();
    this.forget = null;
    this.stopClock();
  }

  attributeChangedCallback(name: string, before: string | null, after: string | null): void {
    if (this.root === null || before === after) return;
    // A different layout, level, deal, position or challenge is a new deal; anything else is the same game drawn again.
    if (["size", "level", "seed", "cells", "challenge"].includes(name)) {
      if (name === "seed") this.dealSeed = 0;
      this.newDeal();
      return;
    }
    // The limits are the game's own: changing them changes the rules from here on, never what has been played.
    if (["hints", "shuffles", "undo"].includes(name) && this.awase !== null) {
      const options = this.#options();
      const rules = startRun({ size: this.boardSize, seed: this.dealSeed, givens: this.givens }, options).rules;
      this.awase = {
        ...this.awase,
        rules: { ...this.awase.rules, hints: rules.hints, shuffles: rules.shuffles, undo: rules.undo },
      };
    }
    if (name === "timer") {
      if (isOn(this, "timer") && this.startedAt !== null && this.seconds === null) this.startClock();
      else if (this.awase?.rules.timeMs == null) this.stopClock();
    }
    this.draw();
  }
}

reflectMethod(JarajaraLayout, "undo");
