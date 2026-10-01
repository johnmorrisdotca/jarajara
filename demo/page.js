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
import { initChallenges } from "./challenges.js";

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

/** The tabs under the game: one panel at a time, by tap or arrow keys, and a link to anything inside a panel (`#rack-panel`) opens its tab. */
function initTabs() {
  const tabs = [...document.querySelectorAll('#tabs [role="tab"]')];
  const panes = new Map(tabs.map((tab) => [tab.dataset.tab, document.getElementById(`pane-${tab.dataset.tab}`)]));
  const select = (name, focus = false) => {
    for (const tab of tabs) {
      const on = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      panes.get(tab.dataset.tab).hidden = !on;
      if (on && focus) tab.focus();
    }
  };
  tabs.forEach((tab, at) => {
    tab.addEventListener("click", () => select(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (step === 0) return;
      event.preventDefault();
      select(tabs[(at + step + tabs.length) % tabs.length].dataset.tab, true);
    });
  });
  const open = (id) => {
    const found = id === "" ? null : document.getElementById(id.replace(/^#/, ""));
    const pane = found?.closest('[role="tabpanel"]');
    if (pane !== null && pane !== undefined) select(pane.id.replace(/^pane-/, ""));
  };
  select("tiles");
  open(location.hash);
  // `?tabs=all` lays every panel out one under another, for a browser test or a printout.
  if (new URLSearchParams(location.search).get("tabs") === "all") {
    for (const pane of panes.values()) pane.hidden = false;
    for (const tab of tabs) tab.setAttribute("aria-selected", "true");
  }
  window.addEventListener("hashchange", () => open(location.hash));
}

initPlay(ctx);
initTabs();
initTile(ctx);
initRack(ctx);
initViewers(ctx);
initBacks(ctx);
initLayouts(ctx);
initTable(ctx);
initDesigns(ctx);
initSounds(ctx);
initChallenges(ctx);
