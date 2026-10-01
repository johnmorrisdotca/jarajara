// The backs panel: every back drawn, recoloured, marked with a name.
import { TILE_BACKS, tileBackSvg } from "./dist/faces-entry.js";

export function initBacks(ctx) {
  const picks = document.getElementById("back-picks");
  const show = document.getElementById("back-show");
  const colour = document.getElementById("back-colour");
  const mark = document.getElementById("back-mark");
  const own = document.getElementById("back-own");
  let chosen = "jade";
  let useColour = false;
  const options = () => ({ ...(useColour ? { colour: colour.value } : {}), ...(mark.value.trim() === "" ? {} : { mark: mark.value.trim() }) });
  const draw = () => {
    for (const button of picks.children) button.setAttribute("aria-pressed", String(button.dataset.back === chosen));
    const how = options();
    show.innerHTML = tileBackSvg(chosen, { ...how, title: `${chosen} back` });
    const given = Object.entries(how).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
    ctx.show("back-code", `import { tileBackSvg } from "@johnmorrisdotca/jarajara/faces";\n\ntileBackSvg("${chosen}"${given.length === 0 ? "" : `, { ${given.join(", ")} }`});\n\n<jarajara-tile code="a" face-down back="${chosen}"${useColour ? ` back-colour="${colour.value}"` : ""}${how.mark === undefined ? "" : ` mark="${how.mark}"`}></jarajara-tile>`);
  };
  picks.replaceChildren(
    ...[...TILE_BACKS].map((name) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "back-pick";
      button.dataset.back = name;
      button.dataset.testid = `back-${name}`;
      button.setAttribute("data-testid", `back-${name}`);
      button.innerHTML = `<span class="back-swatch">${tileBackSvg(name, { title: "" })}</span><span>${name}</span>`;
      button.addEventListener("click", () => {
        chosen = name;
        useColour = false;
        draw();
      });
      return button;
    }),
  );
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
