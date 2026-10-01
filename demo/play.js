// The play panel: Awase on any layout and level, as the <jarajara-layout> element plays it, kept on this device between visits.
import { ALL_LAYOUTS } from "./dist/index.js";
import { TILE_DESIGNS as DESIGNS } from "./dist/faces-entry.js";
import { AWASE_CHALLENGES, dailyAwase } from "./dist/awase-entry.js";

const KEY = "jarajara.page";
const LEVELS = ["easy", "medium", "hard"];
const ALLOWANCES = ["unlimited", "3", "1", "off"];
const VIEWS = ["none", "horizontal", "vertical", "both"];

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

/** A row of buttons, one pressed. */
function segment(host, values, label, chosen, choose) {
  host.replaceChildren(
    ...values.map((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label(value);
      button.dataset.value = String(value);
      button.setAttribute("aria-pressed", String(value === chosen));
      button.addEventListener("click", () => choose(value));
      return button;
    }),
  );
}

export function initPlay(ctx) {
  const game = document.getElementById("game");
  const layouts = ALL_LAYOUTS.filter((layout) => layout.key !== "tiny");
  const sizes = layouts.map((layout) => layout.size);
  const kept = read();
  const state = {
    size: sizes.includes(kept.size) ? kept.size : 15,
    level: LEVELS.includes(kept.level) ? kept.level : "easy",
    showFree: kept.showFree === true,
    showMatching: kept.showMatching === true,
    find: kept.find === true,
    view: VIEWS.includes(kept.view) ? kept.view : "none",
    hints: ALLOWANCES.includes(kept.hints) ? kept.hints : "unlimited",
    shuffles: ALLOWANCES.includes(kept.shuffles) ? kept.shuffles : "unlimited",
    undo: kept.undo === "off" ? "off" : "on",
    design: DESIGNS.includes(kept.design) ? kept.design : "jarajara",
    challenge: AWASE_CHALLENGES.includes(kept.challenge) ? kept.challenge : "none",
    seed: Number.isInteger(kept.seed) ? kept.seed : null,
    moves: typeof kept.moves === "string" ? kept.moves : "",
  };

  const save = () => write({ ...state, moves: game.moves, seed: game.seed });
  const apply = () => {
    game.toggleAttribute("show-free", state.showFree);
    game.toggleAttribute("show-matching", state.showMatching);
    game.toggleAttribute("find", state.find);
    game.setAttribute("mirror", state.view);
    game.setAttribute("hints", state.hints);
    game.setAttribute("shuffles", state.shuffles);
    game.setAttribute("undo", state.undo);
    if (state.design === "jarajara") game.removeAttribute("design");
    else game.setAttribute("design", state.design);
    game.toggleAttribute("red-fives", state.design !== "jarajara");
  };
  const labels = () => {
    const layoutName = (size) => ctx.word("layouts")[layouts.find((layout) => layout.size === size).key];
    segment(document.getElementById("layouts"), sizes, layoutName, state.size, (size) => {
      state.size = size;
      game.setAttribute("size", String(size));
      refresh();
    });
    segment(document.getElementById("levels"), LEVELS, (level) => ctx.word("levels")[level], state.level, (level) => {
      state.level = level;
      game.setAttribute("level", level);
      refresh();
    });
    segment(document.getElementById("challenge-picks"), ["none", ...AWASE_CHALLENGES], (name) => (name === "none" ? ctx.word("challengeNone") : ctx.word("challenges")[name]), state.challenge, (name) => {
      state.challenge = name;
      if (name === "none") game.removeAttribute("challenge");
      else game.setAttribute("challenge", name);
      refresh();
    });
    document.getElementById("challenge-note").textContent = state.challenge === "none" ? "" : ctx.word("challengeNotes")[state.challenge];
    const allowance = (value) => (value === "unlimited" ? ctx.word("unlimited") : value === "off" ? ctx.word("off") : value);
    for (const key of ["hints", "shuffles"]) {
      segment(document.getElementById(key), ALLOWANCES, allowance, state[key], (value) => {
        state[key] = value;
        apply();
        refresh();
      });
    }
    segment(document.getElementById("game-design"), ["jarajara", ...DESIGNS.filter((name) => name !== "jarajara")], (name) => name, state.design, (name) => {
      state.design = name;
      apply();
      refresh();
    });
    segment(document.getElementById("undo-allowed"), ["on", "off"], (value) => (value === "on" ? ctx.word("on") : ctx.word("off")), state.undo, (value) => {
      state.undo = value;
      apply();
      refresh();
    });
    segment(document.getElementById("game-view"), VIEWS, (name) => ctx.word("views")[name], state.view, (name) => {
      state.view = name;
      apply();
      refresh();
    });
    for (const [id, key] of [["show-free", "showFree"], ["show-matching", "showMatching"], ["find", "find"]]) {
      document.getElementById(id).setAttribute("aria-pressed", String(state[key]));
    }
  };
  const refresh = () => {
    labels();
    save();
  };

  for (const [id, key] of [["show-free", "showFree"], ["show-matching", "showMatching"], ["find", "find"]]) {
    document.getElementById(id).addEventListener("click", () => {
      state[key] = !state[key];
      apply();
      refresh();
    });
  }

  document.getElementById("daily").addEventListener("click", () => {
    const day = dailyAwase(new Date());
    state.size = day.size;
    state.level = day.level;
    state.challenge = day.challenge;
    game.setAttribute("size", String(day.size));
    game.setAttribute("level", day.level);
    game.setAttribute("challenge", day.challenge);
    game.newDeal(day.seed);
    refresh();
    document.getElementById("challenge-note").textContent = `${ctx.word("dailyNote")} ${day.date}: ${ctx.word("challenges")[day.challenge]}. ${ctx.word("challengeNotes")[day.challenge]}`;
  });

  // The kept game: the layout and level, then the deal's seed, then the moves played on it.
  apply();
  game.setAttribute("size", String(state.size));
  game.setAttribute("level", state.level);
  if (state.challenge !== "none") game.setAttribute("challenge", state.challenge);
  if (state.seed !== null) {
    game.setAttribute("seed", String(state.seed));
    if (state.moves !== "") game.restore(state.moves);
  }
  // Whatever happens on the board is kept.
  for (const name of ["jarajara-deal", "jarajara-take", "jarajara-shuffle", "jarajara-undo", "jarajara-clear", "jarajara-lost"]) game.addEventListener(name, save);
  labels();
  save();
  ctx.onLang(labels);
  ctx.cloth([game]);
  ctx.soundy([game]);
}
