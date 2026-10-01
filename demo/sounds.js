// The sounds panel: each kind of sound on a tap, and the page's Sound switch for the elements.
import { TILE_SOUND_KINDS, createTileSounds } from "./dist/tile-sounds.js";

export function initSounds(ctx) {
  const kinds = document.getElementById("sound-kinds");
  // The panel's own sounds, played when pressed whether or not the switch is on.
  let sounds = null;
  const paint = () => {
    kinds.replaceChildren(
      ...TILE_SOUND_KINDS.map((kind) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "fam-button";
        button.setAttribute("data-testid", `sound-${kind}`);
        button.textContent = ctx.word("soundKinds")[kind];
        button.addEventListener("click", () => {
          sounds ??= createTileSounds();
          sounds.play(kind);
        });
        return button;
      }),
    );
  };
  const toggles = [document.getElementById("sound-toggle"), document.getElementById("tile-sound")].filter(Boolean);
  const mark = (on) => {
    for (const toggle of toggles) toggle.setAttribute("aria-pressed", String(on));
  };
  for (const toggle of toggles) toggle.addEventListener("click", () => ctx.sound.set(!ctx.sound.on));
  ctx.sound.listeners.push(mark);
  mark(ctx.sound.on);
  paint();
  ctx.onLang(paint);
}
