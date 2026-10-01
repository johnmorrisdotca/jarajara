// The layouts: one looked over, its slots sorted by x, y and z; and every layout as a deal, to play.
import { ALL_LAYOUTS as LAYOUTS, layoutExtent } from "./dist/index.js";
import { generateAwase } from "./dist/awase-entry.js";
import { layoutSvg } from "./dist/faces-entry.js";
import { readSlotKeys } from "./dist/index.js";

export function initLayouts(ctx) {
  const inspect = document.getElementById("inspect");
  const sizeSelect = document.getElementById("inspect-size");
  const note = document.getElementById("inspect-note");
  const layoutName = (layout) => ctx.word("layouts")[layout.key] ?? layout.key;
  let size = 8;
  let keys = "z y x";

  const fill = () => {
    sizeSelect.replaceChildren(...LAYOUTS.map((layout) => Object.assign(document.createElement("option"), { value: String(layout.size), textContent: `${layoutName(layout)} (${layout.size})`, selected: layout.size === size })));
    for (const button of document.querySelectorAll("[data-sort]")) button.setAttribute("aria-pressed", String(button.dataset.sort === keys));
  };
  const draw = () => {
    inspect.setAttribute("size", String(size));
    inspect.setAttribute("sort", keys);
    const layout = LAYOUTS.find((one) => one.size === size);
    note.textContent = ctx.word("inspectNote")(layout.slots.length, readSlotKeys(keys).join(" "));
    ctx.show("inspect-code", `<jarajara-layout size="${size}" view="lined" sort="${keys}" static></jarajara-layout>\n\nimport { sortSlots } from "@johnmorrisdotca/jarajara";\nsortSlots(layout, ${JSON.stringify(readSlotKeys(keys))});   // the slots, in that order`);
    fill();
  };
  sizeSelect.addEventListener("change", () => {
    size = Number(sizeSelect.value);
    draw();
  });
  for (const button of document.querySelectorAll("[data-sort]")) {
    button.addEventListener("click", () => {
      keys = button.dataset.sort;
      draw();
    });
  }
  draw();

  // The gallery: each layout dealt, as a picture to tap.
  const gallery = document.getElementById("gallery");
  const paint = () => {
    gallery.replaceChildren(
      ...LAYOUTS.map((layout) => {
        const deal = generateAwase(layout.size, "easy", 20261001 + layout.size);
        const { layers } = layoutExtent(layout);
        const card = document.createElement(layout.key === "tiny" ? "div" : "button");
        card.className = "gallery-card";
        card.dataset.size = String(layout.size);
        card.setAttribute("data-testid", `gallery-${layout.key}`);
        if (card.tagName === "BUTTON") card.type = "button";
        card.innerHTML = `<span class="gallery-pic" aria-hidden="true">${layoutSvg(layout.size, deal.givens, { prefix: `g${layout.size}` })}</span><span class="gallery-name">${layoutName(layout)}</span><span class="gallery-meta">${layout.slots.length} ${ctx.word("tiles")} · ${layers} ${ctx.word("layers")}</span>`;
        if (layout.key !== "tiny") {
          card.addEventListener("click", () => {
            document.querySelector(`#layouts [data-value="${layout.size}"]`)?.click();
            document.getElementById("play").scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
        return card;
      }),
    );
  };
  paint();
  ctx.onLang(() => {
    fill();
    draw();
    paint();
  });
  ctx.cloth([inspect]);
}
