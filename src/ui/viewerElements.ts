import { copiesOf, countTiles, findFaces, groupFaces, groupWords, isNotation, isTileGroup, readTiles, setInventory, SUIT_WORDS, tileName, writeNotation } from "../names.ts";
import { faceOf, pairPoints } from "../tiles.ts";
import { CLOTH_STYLE, ELEMENT_SIZES, ElementBase, followLanguage, isOn, languageOf, say, wearCloth } from "./elementKit.ts";

/** The tile width a viewer gives the tiles inside it, in pixels, from its `width` or `size`; null to leave it to the page's `--jarajara-tile-width`. */
function tilePixels(element: Element, fallback: number | null): number | null {
  const width = Number(element.getAttribute("width"));
  if (Number.isFinite(width) && width > 0) return Math.min(600, width);
  const size = element.getAttribute("size") as keyof typeof ELEMENT_SIZES | null;
  if (size !== null && size in ELEMENT_SIZES) return ELEMENT_SIZES[size];
  return fallback;
}

/** The attributes a viewer hands on to every tile it draws. */
const PASSED = ["design", "back", "back-colour", "mark", "lang"] as const;

/** One tile as a viewer draws it: a `<jarajara-tile>` carrying the viewer's design and back, with its caption and copies under it. */
function tileFigure(viewer: Element, code: string, options: { caption: boolean; copies: number | null; down: boolean; flip: boolean; dim?: boolean; have?: number }): string {
  const language = languageOf(viewer);
  const passed = PASSED.flatMap((name) => (viewer.getAttribute(name) === null ? [] : [` ${name}="${(viewer.getAttribute(name) as string).replace(/"/g, "&quot;")}"`])).join("");
  const copies = options.copies === null ? "" : `<span class="copies">${options.have === undefined ? say(language, "copies", { n: options.copies }) : `${options.have}/${options.copies}`}</span>`;
  const caption = options.caption ? `<span class="name">${tileName(code, language)}</span>` : "";
  return `<figure class="figure" data-code="${code}"${options.dim === true ? ' data-dim="true"' : ""}><jarajara-tile code="${code}"${passed}${options.down ? " face-down" : ""}${options.flip ? " flip" : ""}></jarajara-tile>${caption}${copies}</figure>`;
}

const FIGURE_STYLE = `
:host { display: block; max-width: 100%; box-sizing: border-box; }
:host([hidden]) { display: none; }
h3 { margin: 0 0 8px; font-size: 1rem; }
.row { display: flex; flex-wrap: wrap; gap: 10px 8px; align-items: flex-start; }
.figure { margin: 0; display: grid; justify-items: center; gap: 2px; font-size: .72rem; line-height: 1.2; text-align: center; min-width: calc(var(--jarajara-tile-width, 48px)); }
.figure[data-dim="true"] jarajara-tile { opacity: .28; }
.copies { font-variant-numeric: tabular-nums; opacity: .8; }
.copies, .name { user-select: none; -webkit-user-select: none; }
.suit { margin-bottom: 14px; }
${CLOTH_STYLE}
`;

/**
 * A GROUP OF TILES, SHOWN: `<jarajara-group group="winds">`, the four winds with their names and how many of each the
 * set holds. Any group `TILE_GROUPS` names: a suit, `honours`, `bonus`, `terminals`, `simples`, `numbers`; or tiles of
 * your own in `tiles`.
 *
 * ```html
 * <jarajara-group group="seasons" cloth="wood"></jarajara-group>
 * ```
 *
 * Attributes, all optional: `group` (unless said, `winds`); `tiles` (tiles written as codes, names or hand notation, in
 * place of `group`); `captions="off"` takes the names away; `copies="off"` takes the counts away; `heading="off"` takes the
 * group's name away; `face-down` and `flip` draw the tiles face down, to be turned over by a tap (to learn them); and
 * `design`, `back`, `back-colour`, `mark`, `size`, `width`, `lang` and `cloth` as on `<jarajara-tile>`. A tap on a tile
 * is a `jarajara-view` event, `{ code }`.
 */
export class JarajaraGroup extends ElementBase {
  static get observedAttributes(): readonly string[] {
    return ["group", "tiles", "captions", "copies", "heading", "face-down", "flip", "design", "back", "back-colour", "mark", "size", "width", "lang", "cloth"];
  }

  #root: ShadowRoot | null = null;
  #forget: (() => void) | null = null;

  /** The tiles shown, as letters. */
  get shown(): string[] {
    const own = this.getAttribute("tiles");
    if (own !== null) return readTiles(own);
    const group = this.getAttribute("group");
    return (isTileGroup(group) ? groupFaces(group) : groupFaces("winds")).map((face) => face.code);
  }

  connectedCallback(): void {
    this.#forget ??= followLanguage(() => this.#draw());
    if (this.#root === null) {
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.addEventListener("click", (event) => {
        const figure = event.composedPath().find((one): one is HTMLElement => one instanceof HTMLElement && one.classList.contains("figure"));
        if (figure !== undefined) this.dispatchEvent(new CustomEvent("jarajara-view", { bubbles: true, composed: true, detail: { code: figure.dataset.code } }));
      });
    }
    this.#draw();
  }

  disconnectedCallback(): void {
    this.#forget?.();
    this.#forget = null;
  }

  attributeChangedCallback(): void {
    if (this.#root !== null) this.#draw();
  }

  #draw(): void {
    const root = this.#root as ShadowRoot;
    wearCloth(this);
    const language = languageOf(this);
    const tiles = this.shown;
    const group = this.getAttribute("group");
    const named = this.getAttribute("tiles") === null ? (isTileGroup(group) ? group : "winds") : null;
    const heading = isOn(this, "heading") || !this.hasAttribute("heading") ? (named === null ? "" : groupWords(named, language)) : "";
    const pixels = tilePixels(this, null);
    if (pixels !== null) this.style.setProperty("--jarajara-tile-width", `${pixels}px`);
    else this.style.removeProperty("--jarajara-tile-width");
    const captions = !this.hasAttribute("captions") || isOn(this, "captions");
    const counts = !this.hasAttribute("copies") || isOn(this, "copies");
    const figures = tiles.map((code) => tileFigure(this, code, { caption: captions, copies: counts ? copiesOf(code) : null, down: this.hasAttribute("face-down"), flip: isOn(this, "flip") }));
    this.setAttribute("role", "group");
    this.setAttribute("aria-label", say(language, "groupLabel", { group: heading || tiles.length, tiles: tiles.map((code) => tileName(code, language)).join(", ") }));
    root.innerHTML = `<style>${FIGURE_STYLE}</style>${heading === "" ? "" : `<h3>${heading}</h3>`}<div class="row">${figures.join("")}</div>`;
  }
}

/**
 * THE WHOLE SET, SHOWN: `<jarajara-set>`, all 42 faces by suit with how many of each the 144 tiles hold, or, with `tiles`,
 * what a hand or a wall holds of it: each face as `have/total`, faces it has none of dimmed. A suit a row.
 *
 * ```html
 * <jarajara-set mode="tiles" tiles="123m456p789s11z" size="small"></jarajara-set>
 * ```
 *
 * Attributes, all optional: `tiles` (what to count: codes, names or hand notation); `mode` (`faces`, unless said, draws each
 * face once with its count; `tiles` draws every tile of the set, four of each ordinary face, one flower, one season);
 * `captions="off"` takes the names away; and `design`, `back`, `size`, `width`, `lang` and `cloth` as on `<jarajara-tile>`.
 * A tap on a tile is a `jarajara-view` event, `{ code }`.
 */
export class JarajaraSet extends ElementBase {
  static get observedAttributes(): readonly string[] {
    return ["tiles", "mode", "captions", "design", "back", "back-colour", "mark", "size", "width", "lang", "cloth"];
  }

  #root: ShadowRoot | null = null;
  #forget: (() => void) | null = null;

  connectedCallback(): void {
    this.#forget ??= followLanguage(() => this.#draw());
    if (this.#root === null) {
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.addEventListener("click", (event) => {
        const figure = event.composedPath().find((one): one is HTMLElement => one instanceof HTMLElement && one.classList.contains("figure"));
        if (figure !== undefined) this.dispatchEvent(new CustomEvent("jarajara-view", { bubbles: true, composed: true, detail: { code: figure.dataset.code } }));
      });
    }
    this.#draw();
  }

  disconnectedCallback(): void {
    this.#forget?.();
    this.#forget = null;
  }

  attributeChangedCallback(): void {
    if (this.#root !== null) this.#draw();
  }

  #draw(): void {
    const root = this.#root as ShadowRoot;
    wearCloth(this);
    const language = languageOf(this);
    const own = this.getAttribute("tiles");
    const counts = own === null ? null : countTiles(readTiles(own));
    const every = this.getAttribute("mode") === "tiles";
    const captions = this.hasAttribute("captions") ? isOn(this, "captions") : !every;
    const pixels = tilePixels(this, every ? ELEMENT_SIZES.small : null);
    if (pixels !== null) this.style.setProperty("--jarajara-tile-width", `${pixels}px`);
    else this.style.removeProperty("--jarajara-tile-width");
    const inventory = setInventory();
    const suits = [...new Set(inventory.map((one) => one.face.suit))];
    const held = counts === null ? null : [...counts.values()].reduce((total, count) => total + count, 0);
    const rows = suits.map((suit) => {
      const faces = inventory.filter((one) => one.face.suit === suit);
      const figures = faces.flatMap(({ face, copies }) => {
        const have = counts?.get(face.code) ?? 0;
        if (!every) return [tileFigure(this, face.code, { caption: captions, copies, have: counts === null ? undefined : have, down: false, flip: false, dim: counts !== null && have === 0 })];
        return Array.from({ length: copies }, (_, at) => tileFigure(this, face.code, { caption: false, copies: null, down: false, flip: false, dim: counts !== null && at >= have }));
      });
      return `<div class="suit"><h3>${SUIT_WORDS[suit][language]}</h3><div class="row">${figures.join("")}</div></div>`;
    });
    this.setAttribute("role", "group");
    this.setAttribute("aria-label", counts === null ? say(language, "setLabel", { n: 144, faces: inventory.length }) : say(language, "setHolds", { have: held ?? 0, total: 144 }));
    root.innerHTML = `<style>${FIGURE_STYLE}</style>${rows.join("")}`;
  }
}

const VIEWER_STYLE = `
.look { display: flex; gap: 8px; margin-bottom: 12px; }
.look input { flex: 1; min-width: 0; font: inherit; padding: 8px 10px; min-height: 44px; box-sizing: border-box; border-radius: 8px; border: 1px solid rgba(0,0,0,.3); background: #fffdf6; color: #22231f; user-select: text; -webkit-user-select: text; }
.look button { font: inherit; padding: 8px 14px; min-height: 44px; border-radius: 8px; border: 1px solid rgba(0,0,0,.25); background: rgba(255,255,255,.9); color: #22231f; cursor: pointer; }
.card { display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: start; min-height: 200px; }
.card dl { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; font-size: .88rem; }
.card dt { opacity: .75; }
.card dd { margin: 0; font-variant-numeric: tabular-nums; }
.card .big { font-size: 1.4rem; font-weight: 700; grid-column: 1 / -1; }
.card .big small { font-weight: 400; font-size: .85rem; opacity: .8; margin-left: 6px; }
.empty { min-height: 200px; opacity: .85; }
.picks { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.picks button { border: 2px solid transparent; background: transparent; padding: 2px; border-radius: 8px; cursor: pointer; }
.picks button[aria-pressed="true"] { border-color: var(--jarajara-focus, #b5452c); }
.picks jarajara-tile { pointer-events: none; }
`;

/**
 * A TILE LOOKED UP BY ITS CODE, NAME OR KEY: `<jarajara-viewer query="east">` shows the tile big, with what it is
 * called in English and in Japanese, its code, suit and rank, how many the set holds, what a pair of them scores at
 * the table, and how a hand writes it. A query that names several tiles (`winds`, `abcF`, `123m456p`) shows them in a row
 * to choose from.
 *
 * ```html
 * <jarajara-viewer query="3 of circles" editable></jarajara-viewer>
 * ```
 *
 * Attributes, all optional: `query` (what to look up: a code, any name `findFace` knows, a group, or a list of tiles: words apart, or hand notation);
 * `editable` adds a box to type a query into; and `design`, `back`, `size`, `width` (the big tile, large unless said),
 * `lang` and `cloth` as on `<jarajara-tile>`. `lookup(text)` looks one up; each tile shown is a `jarajara-view` event,
 * `{ code, query }`.
 */
export class JarajaraViewer extends ElementBase {
  static get observedAttributes(): readonly string[] {
    return ["query", "editable", "design", "back", "back-colour", "mark", "size", "width", "lang", "cloth"];
  }

  #root: ShadowRoot | null = null;
  #forget: (() => void) | null = null;
  #picked: string | null = null;

  /** The tiles the query names, as letters. */
  get found(): string[] {
    const query = this.getAttribute("query") ?? "";
    const faces = findFaces(query).map((face) => face.code);
    if (faces.length > 0) return faces;
    // A run of letters in one word is a word, not tiles: a list of tiles is words apart, or hand notation.
    const words = query.split(/[\s,;]+/).filter(Boolean);
    return words.length > 1 || isNotation(query.trim()) ? readTiles(query) : [];
  }

  /** Look a tile, a group or a list of tiles up; answers how many tiles it names. */
  lookup(text: string): number {
    this.#picked = null;
    this.setAttribute("query", text);
    return this.found.length;
  }

  connectedCallback(): void {
    this.#forget ??= followLanguage(() => this.#draw());
    if (this.#root === null) {
      this.#root = this.attachShadow({ mode: "open" });
      const go = () => {
        const input = this.#root?.querySelector<HTMLInputElement>("input");
        if (input !== null && input !== undefined) this.lookup(input.value);
      };
      this.#root.addEventListener("click", (event) => {
        const path = event.composedPath();
        if (path.some((one) => one instanceof HTMLElement && one.dataset.action === "look")) {
          go();
          return;
        }
        const pick = path.find((one): one is HTMLElement => one instanceof HTMLElement && one.dataset.pick !== undefined);
        if (pick !== undefined) {
          this.#picked = pick.dataset.pick as string;
          this.#draw();
          this.dispatchEvent(new CustomEvent("jarajara-view", { bubbles: true, composed: true, detail: { code: this.#picked, query: this.getAttribute("query") } }));
        }
      });
      this.#root.addEventListener("keydown", (event) => {
        if ((event as KeyboardEvent).key === "Enter" && (event.target as HTMLElement | null)?.tagName === "INPUT") go();
      });
    }
    this.#draw();
  }

  disconnectedCallback(): void {
    this.#forget?.();
    this.#forget = null;
  }

  attributeChangedCallback(name: string): void {
    if (this.#root === null) return;
    if (name === "query") this.#picked = null;
    this.#draw();
  }

  #draw(): void {
    const root = this.#root as ShadowRoot;
    wearCloth(this);
    const language = languageOf(this);
    const found = this.found;
    const shown = this.#picked !== null && found.includes(this.#picked) ? this.#picked : (found[0] ?? null);
    const query = this.getAttribute("query") ?? "";
    const typed = this.#root?.querySelector<HTMLInputElement>("input")?.value;
    const input = isOn(this, "editable")
      ? `<div class="look"><input type="text" value="${(typed ?? query).replace(/"/g, "&quot;")}" placeholder="${say(language, "viewerType")}" aria-label="${say(language, "viewerLabel")}" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="button" data-action="look">→</button></div>`
      : "";
    const pixels = tilePixels(this, ELEMENT_SIZES.large) as number;
    this.style.setProperty("--jarajara-tile-width", `${pixels}px`);
    const passed = PASSED.flatMap((name) => (this.getAttribute(name) === null ? [] : [` ${name}="${(this.getAttribute(name) as string).replace(/"/g, "&quot;")}"`])).join("");
    let body = `<div class="empty" role="status">${query.trim() === "" ? say(language, "viewerType") : say(language, "viewerNone")}</div>`;
    if (shown !== null) {
      const face = faceOf(shown)!;
      const details: [string, string][] = [
        [say(language, "viewerCode"), shown],
        [say(language, "viewerSuit"), SUIT_WORDS[face.suit][language]],
        [say(language, "viewerRank"), String(face.rank)],
        [say(language, "viewerCopies"), String(copiesOf(shown))],
        [say(language, "viewerPoints"), String(pairPoints(shown))],
        [say(language, "viewerNotation"), writeNotation([shown])],
        [say(language, "viewerJapanese"), tileName(shown, language === "ja" ? "en" : "ja")],
      ];
      const title = `<dt class="big">${tileName(shown, language)}<small>${tileName(shown, language === "ja" ? "en" : "ja")}</small></dt>`;
      body = `<div class="card"><jarajara-tile code="${shown}"${passed}></jarajara-tile><dl>${title}${details.map(([name, value]) => `<dt>${name}</dt><dd>${value}</dd>`).join("")}</dl></div>`;
    }
    const picks =
      found.length > 1
        ? `<div class="picks">${found.map((code) => `<button type="button" data-pick="${code}" aria-pressed="${code === shown}" aria-label="${tileName(code, language)}"><jarajara-tile code="${code}" width="34"${passed}></jarajara-tile></button>`).join("")}</div>`
        : "";
    this.setAttribute("role", "group");
    this.setAttribute("aria-label", say(language, "viewerLabel"));
    root.innerHTML = `<style>${FIGURE_STYLE}${VIEWER_STYLE}</style>${input}${body}${picks}`;
  }
}
