// The demo page's script: the language the header's chooser picks, the cloth the header's patches choose, and each panel.
import "./dist/element-define.js";
import { WORDS } from "./words.js";
import { initPlay } from "./play.js";
import { initTile } from "./tile.js";
import { initRack } from "./rack.js";
import { initViewers } from "./viewers.js";
import { initBacks } from "./backs.js";
import { initLayouts } from "./layouts.js";
import { initTable } from "./tableDemo.js";
import { initDesigns } from "./designs.js";
import { initSounds } from "./sounds.js";

const listeners = [];
// `familyLanguage` is the family's shared script, loaded before this one.
const language = familyLanguage({ id: "jarajara", words: WORDS, onChange: (lang) => listeners.forEach((listen) => listen(lang)) });
const ctx = {
  word: (key) => language.word(key),
  lang: () => language.lang,
  onLang: (listen) => listeners.push(listen),
  /** Every element that wears a cloth takes the one the header's patches choose, and keeps it as they change. */
  cloth(elements) {
    const wear = () => {
      const name = document.documentElement.dataset.cloth ?? "green";
      for (const element of elements) element.setAttribute("cloth", name);
    };
    wear();
    document.addEventListener("family-cloth", wear);
  },
};

/** Whether the elements make their sounds: off until pressed, and remembered. Every element listed takes the `sound` attribute. */
const SOUND_KEY = "jarajara.sound";
const sound = { on: false, targets: [], listeners: [] };
try {
  sound.on = localStorage.getItem(SOUND_KEY) === "on";
} catch {
  /* A browser that keeps nothing starts silent. */
}
sound.apply = () => {
  for (const element of sound.targets) element.toggleAttribute("sound", sound.on);
  for (const listen of sound.listeners) listen(sound.on);
};
sound.set = (on) => {
  sound.on = on;
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    /* Not remembered; still switched. */
  }
  sound.apply();
};
ctx.sound = sound;
/** Elements that make their sounds when the page's Sound is on. */
ctx.soundy = (elements) => {
  sound.targets.push(...elements);
  sound.apply();
};

/** A `<pre class="snippet">`'s text, set. */
ctx.show = (id, text) => {
  document.getElementById(id).textContent = text;
};

initPlay(ctx);
initTile(ctx);
initRack(ctx);
initViewers(ctx);
initBacks(ctx);
initLayouts(ctx);
initTable(ctx);
initDesigns(ctx);
initSounds(ctx);
