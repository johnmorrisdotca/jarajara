import { describe, expect, it } from "vitest";

import { generateAwase } from "./awase.ts";
import { layoutBox, layoutSvg, tileAt } from "./draw.ts";
import { faceWords, tileFaceSvg, tileFaceSymbols, tileSvg } from "./faces.ts";
import { MAHJONG_LAYOUTS } from "./layouts.ts";
import { faceOf, MAHJONG_FACES } from "./tiles.ts";

const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;

describe("the faces", () => {
  it("draws every one of the 42, and nothing for a letter that is no face", () => {
    for (const face of MAHJONG_FACES) expect(tileFaceSvg(face.code)?.length ?? 0).toBeGreaterThan(40);
    expect(tileFaceSvg("?")).toBeNull();
    expect(tileSvg(".")).toBeNull();
  });

  it("counts out a circle tile's dots and a bamboo tile's sticks", () => {
    for (const face of MAHJONG_FACES.filter((one) => one.suit === "circles")) {
      // Three circles a dot: the dot, its white ring and its white heart.
      expect(count(tileFaceSvg(face.code)!, /<circle/g)).toBe(face.rank * 3);
    }
    for (const face of MAHJONG_FACES.filter((one) => one.suit === "bamboo" && one.rank > 1)) {
      expect(count(tileFaceSvg(face.code)!, /height="1[04]"/g)).toBe(face.rank);
    }
  });

  it("never lets the text on a tile be selected", () => {
    for (const face of MAHJONG_FACES) {
      const svg = tileFaceSvg(face.code)!;
      expect(count(svg, /<text/g)).toBe(count(svg, /style="user-select:none/g));
    }
  });

  it("names a tile for a screen reader", () => {
    expect(faceWords(faceOf("c")!)).toBe("3 of characters");
    expect(faceWords(faceOf("B")!)).toBe("east wind");
    expect(faceWords(faceOf("F")!)).toBe("red dragon");
    expect(faceWords(faceOf("I")!)).toBe("plum (flower)");
    expect(tileSvg("B")).toContain(`aria-label="east wind"`);
  });

  it("gives every face one symbol, under the prefix asked for", () => {
    const defs = tileFaceSymbols("b1");
    expect(count(defs, /<symbol id="b1-/g)).toBe(42);
  });
});

describe("a layout, drawn", () => {
  it("draws every tile of a fresh deal once, and says which are free", () => {
    for (const layout of MAHJONG_LAYOUTS) {
      const deal = generateAwase(layout.size, "easy", 7);
      const svg = layoutSvg(layout.size, deal.givens)!;
      expect(count(svg, /data-slot=/g)).toBe(layout.slots.length);
      expect(count(svg, /data-free="true"/g)).toBeGreaterThan(0);
      const box = layoutBox(layout.size)!;
      expect(svg).toContain(`viewBox="0 0 ${box.width} ${box.height}"`);
    }
  });

  it("leaves out a tile taken, rings the one chosen, and washes the blocked when asked", () => {
    const deal = generateAwase(4, "easy", 7);
    const taken = `.${deal.givens.slice(1)}`;
    const svg = layoutSvg(4, taken, { chosen: 1, showFree: true })!;
    expect(svg).not.toContain(`data-slot="0"`);
    expect(svg).toContain(`aria-pressed="true"`);
    expect(layoutSvg(4, "abc")).toBeNull();
    expect(layoutSvg(99, deal.givens)).toBeNull();
  });

  it("lifts a tile up and right by its layer, as the site draws it", () => {
    expect(tileAt({ x: 0, y: 0, z: 0 }, 3)).toEqual({ x: 5, y: 15 });
    expect(tileAt({ x: 2, y: 4, z: 1 }, 3)).toEqual({ x: 40, y: 90 });
  });
});
