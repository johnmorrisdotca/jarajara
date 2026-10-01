// The designs panel: Jarajara's own tiles and the two riichi sets, the red fives, and a layout drawn in each.
import { TILE_DESIGNS } from "./dist/faces-entry.js";

export function initDesigns(ctx) {
  const picks = document.getElementById("design-picks");
  const red = document.getElementById("design-red");
  const set = document.getElementById("design-set");
  const layout = document.getElementById("design-layout");
  const rack = document.getElementById("design-rack");
  let chosen = "jarajara";
  let reds = false;
  const draw = () => {
    for (const element of [set, layout, rack]) {
      if (chosen === "jarajara") element.removeAttribute("design");
      else element.setAttribute("design", chosen);
    }
    layout.toggleAttribute("red-fives", reds);
    rack.toggleAttribute("red-fives", reds);
    set.toggleAttribute("red-fives", reds);
    set.setAttribute("mode", reds ? "tiles" : "faces");
    set.setAttribute("captions", "off");
    red.setAttribute("aria-pressed", String(reds));
    for (const button of picks.children) button.setAttribute("aria-pressed", String(button.dataset.design === chosen));
    ctx.show("design-code", `<jarajara-tile code="F" design="${chosen}"></jarajara-tile>\n<jarajara-layout size="8" design="${chosen}"${reds ? " red-fives" : ""} static></jarajara-layout>\n\nimport { loadTileDesign, tileSvg } from "@johnmorrisdotca/jarajara/faces";\ntileSvg("F", { design: await loadTileDesign("${chosen}") });`);
  };
  picks.replaceChildren(
    ...TILE_DESIGNS.map((name) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.design = name;
      button.setAttribute("data-testid", `design-${name}`);
      button.textContent = name;
      button.addEventListener("click", () => {
        chosen = name;
        draw();
      });
      return button;
    }),
  );
  red.addEventListener("click", () => {
    reds = !reds;
    draw();
  });
  draw();
  ctx.cloth([layout]);
}
