import { isFaceCode } from "../tiles.ts";
import { codeOf, designNamed, ElementBase, followLanguage, isOn, languageOf, lessMotion, markerHtml, MARKER_STYLE, playSound, say, spinElement, tileDrawing, tileLabel, TILE_ASPECT, widthOf, type SpinOptions } from "./elementKit.ts";

/**
 * ONE TILE ON ANY PAGE: `<jarajara-tile code="F">`, in any design and with any back, face up or face down, turned over
 * by a tap when it has `flip`.
 *
 * ```html
 * <jarajara-tile code="east" back="bamboo" flip size="large"></jarajara-tile>
 * ```
 *
 * Attributes, all optional but `code`:
 *   code          the tile: its letter (`F`), or any name it goes by (`east`, `red dragon`, `3p`, `三筒`)
 *   design        `jarajara` (unless said); the riichi sets are named in `TILE_DESIGNS` and fetched the first time they are asked for
 *   back          `jade` (unless said), `bamboo`, `blue`, `red` or `ink`, or a design's own back; `back-colour` and `mark` as `tileBackSvg` takes them
 *   face-down     shows the back; the face is not in the page while it is down
 *   flip          a tap, Enter or Space turns it over, with a turn that a device asking for less motion skips
 *   marked        a mark on its corner, seen face up and face down, to follow it as it moves
 *   red           draws the red five of a design that has one, for a five
 *   size          `small`, `medium` (unless said) or `large`; or `width` in pixels; or the page's `--jarajara-tile-width`
 *   sound         the turn makes a sound
 *   lang          `ja` for Japanese names; the page's language unless said
 *
 * Each turn is a `jarajara-flip` event that bubbles, with `{ code, faceDown }` as its detail. `spin(options?)`
 * spins it where it lies, slowing to a stop as it was.
 */
export class JarajaraTile extends ElementBase {
  static get observedAttributes(): readonly string[] {
    return ["code", "design", "back", "back-colour", "mark", "face-down", "flip", "marked", "red", "size", "width", "lang", "sound"];
  }

  #root: ShadowRoot | null = null;
  #forget: (() => void) | null = null;
  #turning = false;

  /** Whether the tile shows its back. Setting it turns the tile over, as a tap would, but with no event. */
  get faceDown(): boolean {
    return this.hasAttribute("face-down");
  }
  set faceDown(down: boolean) {
    this.toggleAttribute("face-down", down);
  }

  /** The tile's letter, however `code` was written; null when it names no tile. */
  get tile(): string | null {
    return codeOf(this.getAttribute("code"));
  }

  /** Turn the tile over, as a tap does: the turn and the `jarajara-flip` event. */
  flip(): void {
    const code = this.tile;
    if (code === null) return;
    // Turning, both sides are drawn, so the face is in the page only while it can be seen.
    this.#turning = !lessMotion();
    this.faceDown = !this.faceDown;
    playSound(this, "flip");
    this.dispatchEvent(new CustomEvent("jarajara-flip", { bubbles: true, composed: true, detail: { code, faceDown: this.faceDown } }));
  }

  /** Spin the tile where it lies, as a flick sets one turning on a table: fast, then slowing to a stop as it was (`SpinOptions`). */
  spin(options: SpinOptions = {}): Promise<void> {
    const spinning = this.#root?.querySelector<HTMLElement>(".spin");
    return spinning === null || spinning === undefined ? Promise.resolve() : spinElement(spinning, options);
  }

  connectedCallback(): void {
    this.#forget ??= followLanguage(() => this.#draw());
    if (this.#root === null) {
      this.#root = this.attachShadow({ mode: "open" });
      this.addEventListener("click", () => {
        if (isOn(this, "flip")) this.flip();
      });
      this.addEventListener("keydown", (event) => {
        if (!isOn(this, "flip") || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        this.flip();
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
    const code = this.tile;
    const known = code !== null && isFaceCode(code);
    const language = languageOf(this);
    const { design, ready } = designNamed(this.getAttribute("design"));
    if (ready !== null) void ready.then(() => this.#draw());
    const down = this.faceDown;
    const turning = this.#turning;
    this.#turning = false;
    const flips = isOn(this, "flip");
    this.setAttribute("role", flips ? "button" : "img");
    if (flips) this.tabIndex = this.tabIndex < 0 ? 0 : this.tabIndex;
    else this.removeAttribute("tabindex");
    const marked = known && this.hasAttribute("marked");
    const name = known ? tileLabel(code, down, language) : "";
    this.setAttribute("aria-label", known && marked ? say(language, "tileMarked", { tile: name }) : name);
    const red = this.hasAttribute("red");
    // The side not shown is drawn only for the length of a turn, so the face of a tile lying face down is not in the page.
    const face = known && (!down || turning) ? tileDrawing(code, false, this, design, red) : "";
    const back = known && (down || turning) ? tileDrawing(code, true, this, design) : "";
    root.innerHTML = `<style>${TILE_STYLE}</style><div class="spin"><div class="tile" part="tile" data-down="${down}"${turning ? ' data-turning="true"' : ""}><div class="side face" part="face">${face}</div><div class="side back" part="back">${back}</div></div>${markerHtml(marked)}</div>`;
    this.style.setProperty("--jarajara-w", widthOf(this));
    if (turning) {
      const inner = root.querySelector(".tile") as HTMLElement;
      // Start from the side that was showing, then turn.
      inner.dataset.down = String(!down);
      void inner.offsetWidth;
      inner.dataset.down = String(down);
      // Once turned, the side that went out of sight is taken out of the page; the timer is for a turn that never reports its end.
      let done = false;
      const settle = () => {
        if (done) return;
        done = true;
        this.#draw();
      };
      inner.addEventListener("transitionend", settle, { once: true });
      setTimeout(settle, 1500);
    }
  }
}

const TILE_STYLE = `
:host { display: inline-block; user-select: none; -webkit-user-select: none; width: var(--jarajara-w, 48px); aspect-ratio: ${TILE_ASPECT}; perspective: 800px; vertical-align: middle; -webkit-tap-highlight-color: transparent; }
:host([flip]) { cursor: pointer; }
:host(:focus-visible) { outline: 3px solid var(--jarajara-focus, #b5452c); outline-offset: 3px; border-radius: 8%; }
.spin { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
.tile { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform var(--jarajara-flip-ms, 450ms) cubic-bezier(.3, .7, .3, 1); }
.tile[data-down="true"] { transform: rotateY(180deg); }
.side { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.back { transform: rotateY(180deg); }
.side svg { display: block; width: 100%; height: 100%; filter: drop-shadow(0 1px 2px rgba(0,0,0,.28)); }
@media (prefers-reduced-motion: reduce) { .tile { transition: none; } }
${MARKER_STYLE}
`;
