// The play panel: Awase on any layout and level, as the <jarajara-layout> element plays it, kept on this device between visits.
import { MAHJONG_LAYOUTS } from "./dist/index.js";
import { TILE_DESIGNS as DESIGNS } from "./dist/faces-entry.js";

const KEY = "jarajara.page";
const LEVELS = ["easy", "medium", "hard"];
const ALLOWANCES = ["unlimited", "3", "1", "off"];

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
      button.className = "fam-button";
      button.textContent = label(value);
      button.dataset.value = String(value);
      button.setAttribute("aria-pressed", String(value === chosen));
      button.addEventListener("click", () => choose(value));
      return button;
    }),
  );
}

/** A select filled with options, one chosen. */
function options(select, values, label, chosen) {
  select.replaceChildren(
    ...values.map((value) => {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = label(value);
      option.selected = String(value) === String(chosen);
      return option;
    }),
  );
}

export function initPlay(ctx) {
  const game = document.getElementById("game");
  const layouts = MAHJONG_LAYOUTS.filter((layout) => layout.key !== "tiny");
  const sizes = layouts.map((layout) => layout.size);
  const kept = read();
  const state = {
    size: sizes.includes(kept.size) ? kept.size : 15,
    level: LEVELS.includes(kept.level) ? kept.level : "easy",
    showFree: kept.showFree === true,
    showMatching: kept.showMatching === true,
    hints: ALLOWANCES.includes(kept.hints) ? kept.hints : "unlimited",
    shuffles: ALLOWANCES.includes(kept.shuffles) ? kept.shuffles : "unlimited",
    undo: kept.undo === "off" ? "off" : "on",
    design: DESIGNS.includes(kept.design) ? kept.design : "jarajara",
    seed: Number.isInteger(kept.seed) ? kept.seed : null,
    moves: typeof kept.moves === "string" ? kept.moves : "",
  };

  const save = () => write({ ...state, moves: game.moves, seed: game.seed });
  const apply = () => {
    game.toggleAttribute("show-free", state.showFree);
    game.toggleAttribute("show-matching", state.showMatching);
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
    const allowance = (value) => (value === "unlimited" ? ctx.word("unlimited") : value === "off" ? ctx.word("off") : value);
    for (const [id, key] of [["hints", "hints"], ["shuffles", "shuffles"]]) {
      const select = document.getElementById(id);
      options(select, ALLOWANCES, allowance, state[key]);
      select.onchange = () => {
        state[key] = select.value;
        apply();
        save();
      };
    }
    const designSelect = document.getElementById("game-design");
    options(designSelect, ["jarajara", ...DESIGNS.filter((name) => name !== "jarajara")], (name) => name, state.design);
    designSelect.onchange = () => {
      state.design = designSelect.value;
      apply();
      save();
    };
    const undo = document.getElementById("undo-allowed");
    options(undo, ["on", "off"], (value) => (value === "on" ? ctx.word("on") : ctx.word("off")), state.undo);
    undo.onchange = () => {
      state.undo = undo.value;
      apply();
      save();
    };
    for (const [id, key] of [["show-free", "showFree"], ["show-matching", "showMatching"]]) {
      document.getElementById(id).setAttribute("aria-pressed", String(state[key]));
    }
  };
  const refresh = () => {
    labels();
    save();
  };

  for (const [id, key] of [["show-free", "showFree"], ["show-matching", "showMatching"]]) {
    document.getElementById(id).addEventListener("click", () => {
      state[key] = !state[key];
      apply();
      refresh();
    });
  }

  // The kept game: the layout and level, then the deal's seed, then the moves played on it.
  apply();
  game.setAttribute("size", String(state.size));
  game.setAttribute("level", state.level);
  if (state.seed !== null) {
    game.setAttribute("seed", String(state.seed));
    if (state.moves !== "") game.restore(state.moves);
  }
  // Whatever happens on the board is kept.
  for (const name of ["jarajara-deal", "jarajara-take", "jarajara-shuffle", "jarajara-undo", "jarajara-clear"]) game.addEventListener(name, save);
  labels();
  save();
  ctx.onLang(labels);
  ctx.cloth([game]);
  ctx.soundy([game]);
}
