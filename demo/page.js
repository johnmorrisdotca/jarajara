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
