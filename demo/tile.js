// The one-tile panel: <jarajara-tile> in any size, back and design, named by its letter.
import { MAHJONG_FACES, tileName } from "./dist/index.js";
import { TILE_BACKS, TILE_DESIGNS } from "./dist/faces-entry.js";

export function initTile(ctx) {
  const tile = document.getElementById("one-tile");
  const pick = document.getElementById("tile-pick");
  const design = document.getElementById("tile-design");
  const back = document.getElementById("tile-back");
  const designs = [...TILE_DESIGNS];
  const state = { code: "B", design: "jarajara", back: "", size: "large", red: false };

  const fill = () => {
    pick.replaceChildren(
      ...MAHJONG_FACES.map((face) => {
        const option = document.createElement("option");
        option.value = face.code;
        option.textContent = `${tileName(face.code, ctx.lang())} (${face.code})`;
        option.selected = face.code === state.code;
        return option;
      }),
    );
    design.replaceChildren(
      ...designs.map((name) => Object.assign(document.createElement("option"), { value: name, textContent: name, selected: name === state.design })),
    );
    const backs = ["", ...TILE_BACKS, ...designs.filter((name) => name !== "jarajara")];
    back.replaceChildren(
      ...backs.map((name) => Object.assign(document.createElement("option"), { value: name, textContent: name === "" ? ctx.word("designOwn") ?? "own" : name, selected: name === state.back })),
    );
    for (const button of document.querySelectorAll("[data-tile-size]")) button.setAttribute("aria-pressed", String(button.dataset.tileSize === state.size));
  };

  const show = () => {
    tile.setAttribute("code", state.code);
    tile.setAttribute("size", state.size);
    tile.toggleAttribute("red", state.red);
    if (state.design === "jarajara") tile.removeAttribute("design");
    else tile.setAttribute("design", state.design);
    if (state.back === "") tile.removeAttribute("back");
    else tile.setAttribute("back", state.back);
    const attrs = [`code="${state.code}"`, state.red ? "red" : "", state.design === "jarajara" ? "" : `design="${state.design}"`, state.back === "" ? "" : `back="${state.back}"`, `size="${state.size}"`, "flip"].filter(Boolean);
    ctx.show("tile-code", `<script type="module" src="…/dist/element-define.js"></script>\n<jarajara-tile ${attrs.join(" ")}></jarajara-tile>`);
    fill();
  };

  pick.addEventListener("change", () => {
    state.code = pick.value;
    show();
  });
  design.addEventListener("change", () => {
    state.design = design.value;
    show();
  });
  back.addEventListener("change", () => {
    state.back = back.value;
    show();
  });
  for (const button of document.querySelectorAll("[data-tile-size]")) {
    button.addEventListener("click", () => {
      state.size = button.dataset.tileSize;
      show();
    });
  }
  document.getElementById("tile-red").addEventListener("click", () => {
    state.red = !state.red;
    document.getElementById("tile-red").setAttribute("aria-pressed", String(state.red));
    show();
  });
  ctx.onLang(fill);
  ctx.soundy([tile]);
  show();
}
