import { freshAwaseSeed, generateAwase } from "../awase.ts";
import { computerPair } from "../computer.ts";
import { layoutSvg } from "../draw.ts";
import { tileFaceSymbols } from "../faces.ts";
import { layoutFor } from "../layouts.ts";
import { AWASE_TABLE, isComputerSeat, playAtTable, readTable, seatName, SEAT_WINDS, startTable, tablePlayersAsked, tidySeatName } from "../table.ts";
import type { AwaseTable, AwaseTableState } from "../table.types.ts";
import type { AwaseLevel } from "../types.ts";
import { CLOTH_STYLE, designNamed, ElementBase, followLanguage, isOn, languageOf, playSound, say, wearCloth } from "./elementKit.ts";

const LEVELS: readonly AwaseLevel[] = ["easy", "medium", "hard"];

/**
 * AWASE AT A TABLE, ON ANY PAGE: `<jarajara-table players="3">`, two to four players round one layout, each taking a
 * free pair in turn: the seats with their winds and scores, the layout on a cloth, and computers playing the seats that
 * are not people's. Plain suit pairs score one, ones and nines two, a wind three, a dragon four; a flower or season pair
 * scores two and its taker goes again; most points when the layout is clear wins.
 *
 * ```html
 * <jarajara-table players="3" people="1" names="Ann" cloth="blue"></jarajara-table>
 * ```
 *
 * Attributes, all optional:
 *   players    how many sit at the table, two to four (2 unless said)
 *   people     how many of the seats are people's, the first ones; the rest are computers (1 unless said)
 *   names      the people's names, separated by commas; a seat with none is called by its wind
 *   size       the layout's width in tiles (10, the Castle, unless said), level, seed   as on `<jarajara-layout>`
 *   delay      how long a computer thinks before it takes its pair, in milliseconds (700 unless said)
 *   show-free  washes the blocked tiles darker
 *   sound      each pair taken, and a game won, make their sounds
 *   design, lang, cloth   as on the other elements
 *
 * `deal(seed?)` deals again. The `table` property holds the game as `encodeTable` keeps it. Each pair taken is a
 * `jarajara-table` event that bubbles, its detail `{ seat, pair, codes, points, scores, over, winners }`.
 */
export class JarajaraTable extends ElementBase {
  static get observedAttributes(): readonly string[] {
    return ["players", "people", "names", "size", "level", "seed", "delay", "show-free", "design", "lang", "cloth", "sound"];
  }

  #root: ShadowRoot | null = null;
  #forget: (() => void) | null = null;
  #table: AwaseTable | null = null;
  #state: AwaseTableState | null = null;
  #chosen: number | null = null;
  #note = "";
  #timer: ReturnType<typeof setTimeout> | null = null;
  #dealtFrom: string | null = null;
  #built = "";

  /** The game as it stands, as `encodeTable` keeps it. */
  get table(): AwaseTable | null {
    return this.#table;
  }

  /** Deal again: the same table, with `seed` or a new one. */
  deal(seed?: number): void {
    const players = tablePlayersAsked(this.getAttribute("players") ?? 2);
    const seats = Math.max(AWASE_TABLE.least, players === 1 ? 2 : players);
    const people = Math.max(0, Math.min(seats, Math.floor(Number(this.getAttribute("people") ?? 1))));
    const names = (this.getAttribute("names") ?? "").split(",").map(tidySeatName);
    const size = Number(this.getAttribute("size"));
    const layout = layoutFor(size) === null ? 10 : size;
    const level = this.getAttribute("level") as AwaseLevel | null;
    const asked = this.getAttribute("seed");
    let chosen = seed;
    if (chosen === undefined && asked !== null && asked !== this.#dealtFrom && Number.isInteger(Number(asked)) && Number(asked) > 0) {
      chosen = Number(asked);
      this.#dealtFrom = asked;
    }
    const deal = generateAwase(layout, level !== null && LEVELS.includes(level) ? level : "medium", chosen ?? freshAwaseSeed("group"));
    this.#table = startTable(deal, Array.from({ length: seats }, (_, at) => (at < people ? { name: names[at] ?? "" } : { name: "", computer: true as const })));
    this.#state = readTable(this.#table);
    this.#chosen = null;
    this.#note = "";
    this.#draw();
    this.#maybeComputer();
  }

  connectedCallback(): void {
    this.#forget ??= followLanguage(() => this.#draw());
    if (this.#root === null) {
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.addEventListener("click", (event) => {
        const tile = event.composedPath().find((one): one is Element => one instanceof Element && one.hasAttribute("data-slot"));
        if (tile !== undefined) this.#tapped(Number(tile.getAttribute("data-slot")), tile.getAttribute("data-free") === "true");
      });
      this.deal();
      return;
    }
    this.#draw();
    this.#maybeComputer();
  }

  disconnectedCallback(): void {
    this.#forget?.();
    this.#forget = null;
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
  }

  attributeChangedCallback(name: string, before: string | null, after: string | null): void {
    if (this.#root === null || before === after) return;
    if (["players", "people", "names", "size", "level", "seed"].includes(name)) this.deal();
    else this.#draw();
  }

  #tapped(slot: number, free: boolean): void {
    const table = this.#table;
    const state = this.#state;
    if (table === null || state === null || state.over || isComputerSeat(table, state.turn)) return;
    const language = languageOf(this);
    if (!free) {
      this.#note = say(language, "blocked");
      this.#draw();
      return;
    }
    this.#note = "";
    if (this.#chosen === null || this.#chosen === slot) {
      this.#chosen = this.#chosen === slot ? null : slot;
      this.#draw();
      return;
    }
    if (!this.#take(this.#chosen, slot)) {
      this.#note = say(language, "noMatch");
      this.#chosen = slot;
      this.#draw();
    }
  }

  #take(a: number, b: number): boolean {
    const table = this.#table;
    const state = this.#state;
    if (table === null || state === null) return false;
    const played = playAtTable(table, a, b, state);
    if (played === null) return false;
    const seat = state.turn;
    this.#table = played.table;
    this.#state = played.state;
    this.#chosen = null;
    this.#note = "";
    const last = played.state.taken[played.state.taken.length - 1]!;
    playSound(this, played.state.over ? "win" : "pair");
    this.#draw();
    this.dispatchEvent(new CustomEvent("jarajara-table", { bubbles: true, composed: true, detail: { seat, pair: [a, b], codes: last.codes, points: last.points, scores: played.state.scores, over: played.state.over, winners: played.state.winners } }));
    this.#maybeComputer();
    return true;
  }

  /** A computer's turn: after a pause, it takes its pair. */
  #maybeComputer(): void {
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
    const table = this.#table;
    const state = this.#state;
    if (table === null || state === null || state.over || !this.isConnected || !isComputerSeat(table, state.turn)) return;
    const delay = Math.max(0, Number.isFinite(Number(this.getAttribute("delay") ?? 700)) ? Number(this.getAttribute("delay") ?? 700) : 700);
    this.#timer = setTimeout(() => {
      this.#timer = null;
      const pair = this.#table === null ? null : computerPair(this.#table, this.#state);
      if (pair !== null) this.#take(pair[0], pair[1]);
    }, delay);
  }

  #draw(): void {
    const root = this.#root;
    const table = this.#table;
    const state = this.#state;
    if (root === null || table === null || state === null) return;
    wearCloth(this);
    const language = languageOf(this);
    const { design, ready } = designNamed(this.getAttribute("design"));
    if (ready !== null) void ready.then(() => this.#draw());
    const key = [design?.name ?? "", table.seats.length, language].join("|");
    if (key !== this.#built) {
      this.#built = key;
      root.innerHTML = `<style>${TABLE_STYLE}</style><svg class="defs" width="0" height="0" aria-hidden="true">${design === null ? "" : tileFaceSymbols("jjt", { design })}</svg><ol class="seats" part="seats"></ol><div class="board" part="board"></div><p class="status" aria-live="polite"></p>`;
    }
    const seats = root.querySelector(".seats") as HTMLElement;
    seats.innerHTML = table.seats
      .map((_, at) => {
        const wind = SEAT_WINDS[at]!;
        return `<li class="seat" data-seat="${at}" data-turn="${!state.over && state.turn === at}" data-winner="${state.over && state.winners.includes(at)}"${!state.over && state.turn === at ? ' aria-current="true"' : ""}><span class="wind" aria-hidden="true">${wind.kanji}</span><span class="who">${seatName(table.seats, at)}</span><span class="score">${state.scores[at]}</span></li>`;
      })
      .join("");
    const board = root.querySelector(".board") as HTMLElement;
    const mine = !state.over && !isComputerSeat(table, state.turn);
    board.dataset.playable = String(mine);
    board.innerHTML = design === null ? "" : (layoutSvg(table.size, state.cells, { chosen: this.#chosen, showFree: isOn(this, "show-free"), design, prefix: "jjt", symbols: false }) ?? "");
    const status = root.querySelector(".status") as HTMLElement;
    const turnName = seatName(table.seats, state.turn);
    const text = state.over
      ? say(language, "tableOver", { names: state.winners.map((seat) => seatName(table.seats, seat)).join(", ") })
      : isComputerSeat(table, state.turn)
        ? say(language, "tableThinking", { name: turnName })
        : say(language, "tableTurn", { name: turnName });
    status.textContent = this.#note === "" ? text : `${text} ${this.#note}`;
    this.setAttribute("role", "group");
    this.setAttribute("aria-label", say(language, "tableLabel", { n: table.seats.length }));
  }
}

const TABLE_STYLE = `
:host { display: block; max-width: 100%; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
:host([hidden]) { display: none; }
.defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.seats { list-style: none; margin: 0 0 10px; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 6px; }
.seat { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 6px; padding: 6px 10px; min-height: 40px; box-sizing: border-box; border-radius: 8px; background: rgba(0,0,0,.18); border: 2px solid transparent; }
.seat[data-turn="true"] { border-color: var(--jarajara-felt-ink, currentColor); background: rgba(255,255,255,.14); }
.seat[data-winner="true"] { border-color: #d4a017; }
.wind { font-size: 1.1rem; }
.who { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.score { font-weight: 700; font-variant-numeric: tabular-nums; }
.board { width: 100%; margin: 0 auto; touch-action: manipulation; }
.board svg { display: block; width: 100%; height: auto; }
.board[data-playable="true"] [data-free="true"] { cursor: pointer; }
.board[data-playable="false"] [data-slot] { cursor: default; }
.status { margin: 10px 0 0; min-height: 2.8em; text-align: center; font-weight: 600; }
${CLOTH_STYLE}
`;
