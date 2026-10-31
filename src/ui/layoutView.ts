import { describeSlot, readSlotKeys, sortSlots } from "../arrange.ts";
import type { TileMirror } from "../block.ts";
import { canTake, geometryOf, isFree, matchesOf, tilesLeft } from "../board.ts";
import { type AwaseRun, PURGE_GROUPS, readRun, runMarked, runPairs, runStart, runTick } from "../challenge.ts";
import type { TileDesign } from "../design.types.ts";
import { redFiveIndexes } from "../designs.ts";
import { layoutSvg } from "../draw.ts";
import { tileFaceSymbols, tileSvg } from "../faces.ts";
import { layoutFor } from "../layouts.ts";
import { groupWords, type TileLanguage, tileName } from "../names.ts";
import { bonusRuleOf } from "../tiles.ts";
import type { MahjongBonusRule, MahjongLayout } from "../types.ts";
import {
  boxOf,
  CLOTH_STYLE,
  designNamed,
  ElementBase,
  FRAME_MARGIN,
  FRAME_STYLE,
  isOn,
  languageOf,
  lessMotion,
  playSound,
  say,
  wearCloth,
} from "./elementKit.ts";

/** How `<jarajara-layout>` is drawn, how its clock runs and how a pointer is read. The deal stays on `JarajaraLayout`. */

/** `m:ss` for a number of milliseconds, rounded up to the second so a clock never reads 0:00 with time left. */
function clockOf(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
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

export abstract class LayoutView extends ElementBase {
  protected root: ShadowRoot | null = null;
  protected forget: (() => void) | null = null;
  protected givens = "";
  protected boardSize = 15;
  protected dealSeed = 0;
  /** The `seed` attribute last dealt from, so a new deal draws a fresh seed instead of dealing the same tiles again. */
  protected dealtFrom: string | null = null;
  protected awase: AwaseRun | null = null;
  protected chosen: number | null = null;
  /** The tile a mouse is over, for Find. */
  protected hover: number | null = null;
  protected hinted: number[] = [];
  protected note = "";
  /** When the first pair was taken, for a game that counts up, and how long the game took once it was won. */
  protected startedAt: number | null = null;
  protected seconds: number | null = null;
  protected ticker: ReturnType<typeof setInterval> | null = null;

  abstract get moves(): string;
  abstract get mirror(): TileMirror;
  abstract newDeal(seed?: number): void;
  abstract take(a: number, b: number): boolean;
  abstract hint(): [number, number] | null;
  abstract shuffle(): boolean;
  abstract undo(): boolean;
  abstract flipView(): TileMirror;

  protected layout(): MahjongLayout {
    return layoutFor(this.boardSize) ?? (layoutFor(15) as MahjongLayout);
  }

  protected rule(): MahjongBonusRule {
    return bonusRuleOf(this.givens);
  }

  /** The tiles as they last lay all together, as dealt or as last shuffled: what the red fives are decided by, so one stays the same tile as the others are taken. */
  protected epoch(): string {
    const run = this.awase;
    if (run === null) return this.givens;
    const last = run.moves.map((move) => "shuffle" in move).lastIndexOf(true);
    if (last === -1) return this.givens;
    return last === run.moves.length - 1 ? run.cells : (run.history[last + 1]?.cells ?? this.givens);
  }

  /** Tell the page that a game has been won or lost, once, when it first is. */
  protected finish(next: AwaseRun, before: AwaseRun): void {
    if (next.over === null || before.over !== null) return;
    this.seconds = this.elapsed();
    this.stopClock();
    if (next.over === "won")
      this.dispatchEvent(
        new CustomEvent("jarajara-clear", {
          bubbles: true,
          composed: true,
          detail: { moves: this.moves, seconds: this.seconds, score: next.score, because: next.because },
        }),
      );
    else
      this.dispatchEvent(
        new CustomEvent("jarajara-lost", { bubbles: true, composed: true, detail: { because: next.because } }),
      );
  }

  /** The game's clock goes on from the first pair: it counts the seconds, and a challenge's clock runs down. */
  protected startClock(): void {
    if (this.startedAt === null) this.startedAt = Date.now();
    if (this.awase !== null) this.awase = runStart(this.awase, Date.now());
    if ((isOn(this, "timer") || this.awase?.rules.timeMs != null) && this.ticker === null && this.awase?.over === null)
      this.ticker = setInterval(() => this.tick(), 250);
  }

  protected stopClock(): void {
    if (this.ticker !== null) clearInterval(this.ticker);
    this.ticker = null;
  }

  protected elapsed(): number {
    return this.startedAt === null ? 0 : Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
  }

  /** Once a quarter second: bring the clock up to date, and find out whether time ran out. */
  protected tick(): void {
    const run = this.awase;
    if (run === null) return;
    const next = runTick(run, Date.now());
    if (next !== run) {
      this.awase = next;
      this.finish(next, run);
      this.draw();
      return;
    }
    const clock = this.root?.querySelector(".clock");
    if (clock !== null && clock !== undefined) clock.textContent = this.clockText();
  }

  protected clockText(): string {
    const run = this.awase;
    if (run === null || !(isOn(this, "timer") || run.rules.timeMs !== null)) return "";
    // A challenge with a clock counts down; any other game counts up.
    if (run.rules.timeMs !== null) return clockOf(readRun(run, Date.now()).remainingMs ?? 0);
    const seconds = this.seconds ?? (this.startedAt === null ? 0 : Math.round((Date.now() - this.startedAt) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  protected clicked(event: Event): void {
    const path = event.composedPath();
    const button = path.find(
      (one): one is HTMLElement => one instanceof HTMLElement && one.dataset.action !== undefined,
    );
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
    const run = this.awase;
    if (tile === undefined || run === null || isOn(this, "static") || run.over !== null) return;
    const slot = Number(tile.getAttribute("data-slot"));
    const language = languageOf(this);
    this.hinted = [];
    if (tile.getAttribute("data-free") !== "true") {
      this.note = say(language, "blocked");
      this.draw();
      this.shake(slot);
      return;
    }
    this.note = "";
    this.startClock();
    if (this.chosen === null || this.chosen === slot) {
      playSound(this, this.chosen === slot ? "place" : "pick");
      this.chosen = this.chosen === slot ? null : slot;
      this.draw();
      return;
    }
    if (this.take(this.chosen, slot)) return;
    if (this.awase?.over !== null) return;
    this.note = say(language, "noMatch");
    this.chosen = slot;
    this.draw();
  }

  protected pointed(event: PointerEvent): void {
    if (event.pointerType !== "mouse" || !isOn(this, "find")) return;
    const tile = event
      .composedPath()
      .find((one): one is Element => one instanceof Element && one.hasAttribute("data-slot"));
    this.point(tile === undefined ? null : Number(tile.getAttribute("data-slot")));
  }

  /** The tile a mouse is over, and a redraw for Find if that changes what is lit. */
  protected point(slot: number | null): void {
    if (slot === this.hover) return;
    this.hover = slot;
    if (this.chosen === null && isOn(this, "find")) this.draw();
  }

  protected shake(slot: number): void {
    const tile = this.root?.querySelector(`[data-slot="${slot}"]`);
    if (tile === null || tile === undefined || lessMotion() || typeof tile.animate !== "function") return;
    const at = tile.getAttribute("transform") ?? "";
    tile.animate(
      [
        { transform: at },
        { transform: `${at} translate(-2.5 0)` },
        { transform: `${at} translate(2.5 0)` },
        { transform: at },
      ],
      { duration: 220 },
    );
  }

  /** What the challenge asks, in words: the gold tile, the group to purge, the pairs or points to reach. */
  protected goalLine(language: TileLanguage): string {
    const run = this.awase;
    if (run === null || run.rules.challenge === null) return "";
    const goal = readRun(run, Date.now()).goal;
    if (goal?.kind === "pairs") return say(language, "rush", { done: goal.done, goal: goal.of });
    if (goal?.kind === "score") return say(language, "fortune", { score: goal.done, goal: goal.of });
    if (goal?.kind === "purge") {
      const group = PURGE_GROUPS.find((one) => one.key === run.purge);
      return say(language, "purge", {
        suit: group === undefined ? "" : groupWords(group.key === "honours" ? "honours" : group.key, language),
        done: goal.done,
        goal: goal.of,
      });
    }
    if (run.rules.challenge === "gold") return say(language, "gold");
    if (run.rules.challenge === "spark")
      return say(language, "spark", { tile: run.spark === null ? "" : tileName(run.spark, language) });
    if (run.rules.challenge === "sand") return say(language, "sand");
    if (run.rules.challenge === "blackout") return say(language, "blackout");
    return "";
  }

  /** The line that says how the game stands. */
  protected statusLine(language: TileLanguage): string {
    const run = this.awase;
    if (run === null) return "";
    if (run.over === "won")
      return run.because === "cleared"
        ? say(language, "cleared", { seconds: this.seconds ?? this.elapsed() })
        : say(language, "won", { score: run.score });
    if (run.over === "lost") return say(language, run.because === "time" ? "timeUp" : "lost");
    const pairs = runPairs(run).length;
    if (pairs === 0)
      return say(language, run.rules.shuffles !== null && run.shuffles >= run.rules.shuffles ? "lost" : "stuck");
    return say(language, "left", {
      tiles: tilesLeft(run.cells),
      pairs,
      pairsWord: say(language, pairs === 1 ? "pair" : "pairs"),
    });
  }

  /** What the elements keeps of the skeleton: when it changes the whole of it is made again, otherwise only its parts are brought up to date. */
  protected built = "";

  protected draw(): void {
    const root = this.root;
    const run = this.awase;
    if (root === null || run === null) return;
    wearCloth(this);
    const language = languageOf(this);
    const { design, ready } = designNamed(this.getAttribute("design"));
    if (ready !== null) void ready.then(() => this.draw());
    const layout = this.layout();
    const cells = run.cells;
    const geometry = geometryOf(layout);
    const rule = this.rule();
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
    if (key !== this.built) {
      this.built = key;
      const symbols = design === null ? "" : tileFaceSymbols("jjl", { design, red: reds });
      const buttons = controls
        ? `<div class="controls" part="controls">${["new", "undo", "hint", "shuffle", ...(flippable ? ["flip"] : [])].map((action) => `<button type="button" part="button" data-action="${action}"></button>`).join("")}</div>`
        : "";
      const lines = status
        ? `<div class="status" part="status" aria-live="polite"><span class="goal"></span><span class="clock" part="clock"></span><span class="line"></span><span class="note"></span></div>`
        : "";
      root.innerHTML = `<style>${LAYOUT_STYLE}</style><svg class="defs" width="0" height="0" aria-hidden="true">${symbols}</svg><div class="frame" part="frame"><div class="board" part="board"></div></div>${lines}${buttons}`;
    }
    const target = isOn(this, "find") ? (this.chosen ?? this.hover) : null;
    const found = target === null ? undefined : matchesOf(geometry, cells, rule, target);
    const matching =
      this.chosen !== null && isOn(this, "show-matching")
        ? [...cells].flatMap((code, at) =>
            at !== this.chosen && code !== "." && canTake(geometry, cells, rule, this.chosen as number, at) ? [at] : [],
          )
        : [];
    const lined = this.getAttribute("view") === "lined";
    const board = root.querySelector(".board") as HTMLElement;
    board.dataset.view = lined ? "lined" : "stack";
    const ratio = boxOf(this.getAttribute("box"));
    board.style.aspectRatio = ratio === null ? "" : `var(--jarajara-box, ${ratio})`;
    board.dataset.box = ratio === null ? "none" : "fixed";
    board.dataset.playable = String(playable);
    board.innerHTML =
      design === null
        ? ""
        : lined
          ? this.lined(layout, cells, design, reds, language)
          : (layoutSvg(this.boardSize, cells, {
              chosen: this.chosen,
              hinted: this.hinted,
              matching,
              marked: runMarked(run),
              showFree: isOn(this, "show-free"),
              hideBlocked: run.rules.hideBlocked && run.over === null,
              design,
              redFives,
              prefix: "jjl",
              symbols: false,
              redFrom: this.epoch(),
              found,
              mirror: this.mirror,
              margin: FRAME_MARGIN,
            }) ?? "");
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
      button(
        "undo",
        say(language, "undo"),
        isOn(this, "static") ||
          run.history.length === 0 ||
          !run.rules.undo ||
          (run.over === "lost" && run.because === "time"),
      );
      button(
        "hint",
        `${say(language, "hint")}${hintsLeft === null ? "" : ` (${hintsLeft})`}`,
        !playable || pairs === 0 || hintsLeft === 0,
      );
      button(
        "shuffle",
        `${say(language, "shuffle")}${shufflesLeft === null ? "" : ` (${shufflesLeft})`}`,
        !playable || pairs > 0 || shufflesLeft === 0,
      );
      button("flip", say(language, "flip"), lined);
    }
    if (status) {
      set(".goal", this.goalLine(language));
      set(".line", this.statusLine(language));
      set(".clock", this.clockText());
      set(".note", this.note);
    }
    this.setAttribute("role", "group");
    this.setAttribute(
      "aria-label",
      say(language, lined ? "layoutLined" : "layoutLabel", {
        n: left,
        keys: readSlotKeys(this.getAttribute("sort")).join(" ") || "z y x",
      }),
    );
  }

  /** The tiles lined up in the order the sort keys give, each with where its slot lies. */
  protected lined(
    layout: MahjongLayout,
    cells: string,
    design: TileDesign,
    reds: boolean,
    language: TileLanguage,
  ): string {
    const order = sortSlots(
      layout,
      readSlotKeys(this.getAttribute("sort")).length === 0 ? ["z", "y", "x"] : readSlotKeys(this.getAttribute("sort")),
    );
    const redSet = reds ? redFiveIndexes(this.epoch()) : new Set<number>();
    const geometry = geometryOf(layout);
    const items = order.map((index) => {
      const code = cells[index]!;
      const at = describeSlot(layout, index)!;
      const picture =
        code === "."
          ? `<span class="gone"></span>`
          : (tileSvg(code, { design, red: redSet.has(index), title: tileName(code, language) }) ?? "");
      return `<li class="cell" data-slot="${index}" data-free="${isFree(geometry, cells, index)}"><span class="tile">${picture}</span><span class="where">x ${at.x} y ${at.y} z ${at.z}</span></li>`;
    });
    return `<ol class="lined">${items.join("")}</ol>`;
  }
}
