// The viewer panels: a tile looked up, a group of the set, and the whole set as an inventory.
import { TILE_GROUPS, countTiles, groupWords, readTiles } from "./dist/index.js";

const CHIPS = ["east", "3p", "red dragon", "plum", "五萬", "winds", "123m456p", "haku", "characters-9", "spring"];

export function initViewers(ctx) {
  const viewer = document.getElementById("viewer");
  const chips = document.getElementById("viewer-chips");
  chips.replaceChildren(
    ...CHIPS.map((text) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fam-button";
      button.textContent = text;
      button.addEventListener("click", () => {
        viewer.lookup(text);
        ctx.show("viewer-code", `<jarajara-viewer query="${text}" editable></jarajara-viewer>\n\nviewer.lookup("${text}");`);
      });
      return button;
    }),
  );
  viewer.addEventListener("jarajara-view", () => {
    ctx.show("viewer-code", `<jarajara-viewer query="${viewer.getAttribute("query")}" editable></jarajara-viewer>`);
  });
  ctx.show("viewer-code", `<jarajara-viewer query="east" editable></jarajara-viewer>\n<jarajara-group group="winds"></jarajara-group>`);

  // A group.
  const group = document.getElementById("group");
  const pick = document.getElementById("group-pick");
  const hidden = document.getElementById("group-hidden");
  const fill = () => {
    const chosen = group.getAttribute("group") ?? "winds";
    pick.replaceChildren(...TILE_GROUPS.map((name) => Object.assign(document.createElement("option"), { value: name, textContent: groupWords(name, ctx.lang()), selected: name === chosen })));
  };
  pick.addEventListener("change", () => {
    group.setAttribute("group", pick.value);
    ctx.show("viewer-code", `<jarajara-group group="${pick.value}"${group.hasAttribute("face-down") ? " face-down flip" : ""}></jarajara-group>`);
  });
  hidden.addEventListener("click", () => {
    const on = !group.hasAttribute("face-down");
    group.toggleAttribute("face-down", on);
    group.toggleAttribute("flip", on);
    hidden.setAttribute("aria-pressed", String(on));
  });

  // The whole set.
  const set = document.getElementById("set");
  const count = document.getElementById("set-count");
  const hand = document.getElementById("set-hand");
  let mode = "faces";
  const refresh = () => {
    set.setAttribute("mode", mode);
    const text = hand.value.trim();
    if (text === "") set.removeAttribute("tiles");
    else set.setAttribute("tiles", text);
    for (const button of document.querySelectorAll("[data-set-mode]")) button.setAttribute("aria-pressed", String(button.dataset.setMode === mode));
    const have = [...countTiles(readTiles(text)).values()].reduce((total, n) => total + n, 0);
    count.textContent = text === "" ? "" : ctx.word("setCount")(have, 144);
    ctx.show("set-code", `<jarajara-set${mode === "tiles" ? ' mode="tiles"' : ""}${text === "" ? "" : ` tiles="${text}"`}></jarajara-set>`);
  };
  for (const button of document.querySelectorAll("[data-set-mode]")) {
    button.addEventListener("click", () => {
      mode = button.dataset.setMode;
      refresh();
    });
  }
  hand.addEventListener("input", refresh);
  fill();
  refresh();
  ctx.onLang(() => {
    fill();
    refresh();
  });
}
