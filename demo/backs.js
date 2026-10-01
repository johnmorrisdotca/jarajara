// The backs panel: every back drawn, recoloured, marked with a name; and the backs the riichi designs bring.
import { TILE_BACKS, TILE_DESIGNS, loadTileDesign, tileBackSvg } from "./dist/faces-entry.js";

export function initBacks(ctx) {
  const picks = document.getElementById("back-picks");
  const show = document.getElementById("back-show");
  const colour = document.getElementById("back-colour");
  const mark = document.getElementById("back-mark");
  const own = document.getElementById("back-own");
  const brought = TILE_DESIGNS.filter((name) => name !== "jarajara");
  const designs = {};
  let chosen = "jade";
  let useColour = false;
  const options = () => ({
    ...(brought.includes(chosen) ? { design: designs[chosen] } : {}),
    // A colour and a mark are for the backs drawn here; a design's own is as it was drawn.
    ...(useColour && !brought.includes(chosen) ? { colour: colour.value } : {}),
    ...(mark.value.trim() === "" || brought.includes(chosen) ? {} : { mark: mark.value.trim() }),
  });
  const draw = () => {
    for (const button of picks.children) button.setAttribute("aria-pressed", String(button.dataset.back === chosen));
    const how = options();
    show.innerHTML = tileBackSvg(chosen, { ...how, title: `${chosen} back` }) ?? "";
    const given = Object.entries(how).filter(([key]) => key !== "design").map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
    const design = brought.includes(chosen) ? `, design: await loadTileDesign("${chosen}")` : "";
    ctx.show("back-code", `import { tileBackSvg${design === "" ? "" : ", loadTileDesign"} } from "@johnmorrisdotca/jarajara/faces";\n\ntileBackSvg("${chosen}"${given.length === 0 && design === "" ? "" : `, { ${[...given, design.slice(2)].filter(Boolean).join(", ")} }`});\n\n<jarajara-tile code="a" face-down back="${chosen}"${useColour && design === "" ? ` back-colour="${colour.value}"` : ""}${how.mark === undefined ? "" : ` mark="${how.mark}"`}></jarajara-tile>`);
  };
  const button = (name) => {
    const one = document.createElement("button");
    one.type = "button";
    one.className = "back-pick";
    one.dataset.back = name;
    one.setAttribute("data-testid", `back-${name}`);
    one.innerHTML = `<span class="back-swatch"></span><span>${name}</span>`;
    one.addEventListener("click", () => {
      chosen = name;
      useColour = false;
      draw();
    });
    return one;
  };
  picks.replaceChildren(...[...TILE_BACKS, ...brought].map(button));
  for (const name of TILE_BACKS) picks.querySelector(`[data-back="${name}"] .back-swatch`).innerHTML = tileBackSvg(name, { title: "" });
  // The riichi backs arrive with their designs, fetched now that the panel is here.
  for (const name of brought) {
    loadTileDesign(name).then((design) => {
      designs[name] = design;
      picks.querySelector(`[data-back="${name}"] .back-swatch`).innerHTML = tileBackSvg(name, { design, title: "" });
      if (chosen === name) draw();
    });
  }
  own.addEventListener("click", () => {
    useColour = true;
    draw();
  });
  colour.addEventListener("input", () => {
    useColour = true;
    draw();
  });
  mark.addEventListener("input", draw);
  draw();
}
