// The demo page's own script: a game of Awase to play on any layout and at any level, drawn by the package's own
// faces, kept on this device between visits, and spoken in the language the header's chooser picks.
import { bonusRuleOf, canTake, decodeMoves, encodeMoves, freePairs, geometryOf, isCleared, layoutFor, playSolve, tilesLeft } from "./dist/index.js";
import { freshAwaseSeed, generateAwase } from "./dist/awase-entry.js";
import { layoutBox, layoutSvg } from "./dist/faces-entry.js";

// The page's own words, in the two languages it speaks. Set as text, never as HTML.
const WORDS = {
  en: {
    pitch: "Mahjong tiles for JavaScript and TypeScript. Below is Awase, the matching solitaire: take the tiles away two at a time, two that match and that are both free, until the layout is clear.",
    name: "Jarajara (ジャラジャラ) is the rattle of mahjong tiles being shuffled.",
    nameLink: "About the name",
    layout: "Layout",
    level: "Level",
    layouts: { 8: "Torii", 9: "Fuji", 10: "Castle", 15: "Turtle" },
    levels: { easy: "Easy", medium: "Medium", hard: "Hard" },
    newDeal: "New deal",
    undo: "Undo",
    hint: "Hint",
    showFree: "Light the free tiles",
    shuffle: "Shuffle",
    howTo: "A tile is free when nothing lies on it and its left or right side is open. Tap a free tile, then its match.",
    left: (tiles, pairs) => `${tiles} tiles left · ${pairs} ${pairs === 1 ? "pair" : "pairs"} you can take`,
    stuck: "No pair can be taken. Shuffle the tiles that are left, or undo.",
    lost: "No shuffle can free what is left. Undo, or try a new deal.",
    blocked: "That tile is not free: something lies on it, or both its sides are closed.",
    noMatch: "Those two do not match.",
    cleared: (seconds) => `Cleared, in ${seconds} seconds.`,
    moreTitle: "Using it",
    moreText: "The game above is the package itself: the deal, the rules, the shuffle and the drawing. Each line below is all it takes.",
    foot: "Every deal is laid in reverse, so every deal can be cleared. Your game stays on this device.",
  },
  ja: {
    pitch: "JavaScriptとTypeScriptのための麻雀牌です。下は「合わせ」、牌を二枚ずつ取り除く一人遊びです。同じ牌で、どちらも空いている二枚を取り、すべての牌がなくなれば完成です。",
    name: "「ジャラジャラ」は、麻雀牌を混ぜるときの音です。",
    nameLink: "名前について（英語）",
    layout: "配置",
    level: "難しさ",
    layouts: { 8: "鳥居", 9: "富士", 10: "城", 15: "亀" },
    levels: { easy: "やさしい", medium: "ふつう", hard: "むずかしい" },
    newDeal: "新しく配る",
    undo: "戻す",
    hint: "ヒント",
    showFree: "取れる牌を明るく",
    shuffle: "混ぜる",
    howTo: "上に何も載っておらず、左か右が空いている牌が取れます。取れる牌を押し、次に同じ牌を押します。",
    left: (tiles, pairs) => `残り${tiles}枚・取れる組${pairs}`,
    stuck: "取れる組がありません。残りの牌を混ぜるか、戻してください。",
    lost: "混ぜても取れる牌が出ません。戻すか、新しく配ってください。",
    blocked: "その牌はまだ取れません。上に牌が載っているか、両側がふさがっています。",
    noMatch: "その二枚は同じ牌ではありません。",
    cleared: (seconds) => `完成！${seconds}秒でした。`,
    moreTitle: "使い方",
    moreText: "上の遊びは、このパッケージそのもの（配り方、ルール、混ぜ方、描き方）で動いています。下の各行がそれぞれ必要なコードのすべてです。",
    foot: "どの配りも逆順に並べているので、必ず完成できます。遊びの続きはこの端末に残ります。",
  },
};

const SIZES = [8, 9, 10, 15];
const LEVELS = ["easy", "medium", "hard"];
const KEY = "jarajara.page";

const board = document.getElementById("board");
const status = document.getElementById("status");
const note = document.getElementById("note");

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
};
const write = (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* Not kept; still played. */
  }
};

const kept = read();
const game = {
  size: SIZES.includes(kept.size) ? kept.size : 15,
  level: LEVELS.includes(kept.level) ? kept.level : "easy",
  seed: Number.isInteger(kept.seed) ? kept.seed : freshAwaseSeed("group"),
  moves: [],
  chosen: null,
  hinted: [],
  showFree: kept.showFree === true,
  started: Date.now(),
  done: null,
};
let deal = generateAwase(game.size, game.level, game.seed);
if (typeof kept.moves === "string") game.moves = decodeMoves(kept.moves, deal.givens.length) ?? [];
let played = playSolve(game.size, deal.givens, game.moves);
if (played === null) {
  game.moves = [];
  played = playSolve(game.size, deal.givens, game.moves);
}

const save = () => write({ size: game.size, level: game.level, seed: game.seed, moves: encodeMoves(game.moves), showFree: game.showFree });
const geometry = () => geometryOf(layoutFor(game.size));
const cells = () => played.cells;
const rule = () => bonusRuleOf(deal.givens);

const language = familyLanguage({ id: "jarajara", words: WORDS, onChange: () => render() });
const word = (key) => language.word(key);

/** A row of buttons, one pressed. */
function segment(host, values, label, chosen, choose) {
  host.replaceChildren(
    ...values.map((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fam-button";
      button.textContent = label(value);
      button.setAttribute("aria-pressed", String(value === chosen));
      button.addEventListener("click", () => choose(value));
      return button;
    }),
  );
}

function newDeal(size = game.size, level = game.level) {
  game.size = size;
  game.level = level;
  game.seed = freshAwaseSeed("group");
  deal = generateAwase(game.size, game.level, game.seed);
  game.moves = [];
  game.chosen = null;
  game.hinted = [];
  game.started = Date.now();
  game.done = null;
  note.textContent = "";
  replay();
}

function replay() {
  played = playSolve(game.size, deal.givens, game.moves);
  save();
  render();
}

function render() {
  segment(document.getElementById("layouts"), SIZES, (size) => word("layouts")[size], game.size, (size) => newDeal(size, game.level));
  segment(document.getElementById("levels"), LEVELS, (level) => word("levels")[level], game.level, (level) => newDeal(game.size, level));
  const box = layoutBox(game.size);
  // Never taller than most of the window: a tall layout is narrowed to fit rather than scrolled past.
  board.style.maxWidth = `calc(70vh * ${(box.width / box.height).toFixed(3)})`;
  board.innerHTML = layoutSvg(game.size, cells(), { chosen: game.chosen, hinted: game.hinted, showFree: game.showFree });
  document.getElementById("show-free").setAttribute("aria-pressed", String(game.showFree));
  const pairs = freePairs(geometry(), cells(), rule()).length;
  const left = tilesLeft(cells());
  const shuffle = document.getElementById("shuffle");
  shuffle.hidden = !(pairs === 0 && left > 0);
  document.getElementById("undo").disabled = game.moves.length === 0;
  document.getElementById("hint").disabled = pairs === 0;
  if (isCleared(cells())) {
    if (game.done === null) game.done = Math.max(1, Math.round((Date.now() - game.started) / 1000));
    status.textContent = word("cleared")(game.done);
    status.dataset.solved = "true";
    return;
  }
  status.dataset.solved = "false";
  status.textContent = pairs === 0 ? word("stuck") : word("left")(left, pairs);
}

function shake(slot) {
  const tile = board.querySelector(`[data-slot="${slot}"]`);
  if (tile === null || typeof tile.animate !== "function" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  tile.animate([{ transform: tile.getAttribute("transform") }, { transform: `${tile.getAttribute("transform")} translate(-2.5 0)` }, { transform: `${tile.getAttribute("transform")} translate(2.5 0)` }, { transform: tile.getAttribute("transform") }], { duration: 240 });
}

board.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-slot]");
  if (tile === null || isCleared(cells())) return;
  const slot = Number(tile.dataset.slot);
  game.hinted = [];
  if (tile.dataset.free !== "true") {
    note.textContent = word("blocked");
    shake(slot);
    return;
  }
  note.textContent = "";
  if (game.chosen === null || game.chosen === slot) {
    game.chosen = game.chosen === slot ? null : slot;
    render();
    return;
  }
  if (canTake(geometry(), cells(), rule(), game.chosen, slot)) {
    game.moves = [...game.moves, { pair: [game.chosen, slot] }];
    game.chosen = null;
    replay();
    return;
  }
  note.textContent = word("noMatch");
  game.chosen = slot;
  render();
});

document.getElementById("new").addEventListener("click", () => newDeal());
document.getElementById("undo").addEventListener("click", () => {
  game.moves = game.moves.slice(0, -1);
  game.chosen = null;
  game.hinted = [];
  game.done = null;
  note.textContent = "";
  replay();
});
document.getElementById("hint").addEventListener("click", () => {
  const pair = freePairs(geometry(), cells(), rule())[0];
  game.hinted = pair === undefined ? [] : [...pair];
  render();
});
document.getElementById("show-free").addEventListener("click", () => {
  game.showFree = !game.showFree;
  save();
  render();
});
document.getElementById("shuffle").addEventListener("click", () => {
  const next = [...game.moves, { shuffle: true }];
  if (playSolve(game.size, deal.givens, next) === null) {
    note.textContent = word("lost");
    return;
  }
  game.moves = next;
  game.chosen = null;
  note.textContent = "";
  replay();
});

render();
