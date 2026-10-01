import { describe, expect, it } from "vitest";

import { CLOTHS, clothVars, isCloth, JARAJARA_CLOTHS } from "./cloth.ts";
import { generateAwase } from "./awase.ts";
import type { TileDesign } from "./design.types.ts";
import { isTileDesignName, jarajaraDesign, loadTileDesign, redFiveIndexes, TILE_DESIGNS } from "./designs.ts";
import { layoutSvg } from "./draw.ts";
import { tileBodySvg, tileColours, tileFaceSvg, tileFaceSymbols, tileSvg } from "./faces.ts";
import { MAHJONG_FACES } from "./tiles.ts";

/** A stand-in design in a box ten times the tile's, with a plate, a red five and no flowers: what a drawn set looks like to the code. */
const made: TileDesign = {
  name: "made",
  box: [300, 400],
  body: `<rect id="plate" width="300" height="400" rx="30"/>`,
  back: `<rect width="300" height="400"/>`,
  faces: { a: `<circle id="one" r="50"/>`, e: `<circle id="five" r="50"/>` },
  red: { e: `<circle id="red-five" r="50"/>` },
  colours: { face: "#eee", rim: "#999", side: "#123456", sideEdge: "#000" },
  plate: `<rect id="light-panel" width="30" height="40"/>`,
};

describe("designs", () => {
  it("has Jarajara's own at hand, with all 42 faces", () => {
    const own = jarajaraDesign();
    expect(own.name).toBe("jarajara");
    expect(Object.keys(own.faces)).toHaveLength(42);
    expect(own.body).toBeNull();
    expect(jarajaraDesign()).toBe(own);
    expect(isTileDesignName("jarajara")).toBe(true);
    expect(isTileDesignName("nothing")).toBe(false);
    expect(TILE_DESIGNS).toContain("jarajara");
  });

  it("loads a design by name, and null for what is none", async () => {
    expect((await loadTileDesign("jarajara"))?.name).toBe("jarajara");
    expect(await loadTileDesign("nothing")).toBeNull();
  });

  it("draws the same as before for no design, and the same for Jarajara's own", () => {
    for (const face of MAHJONG_FACES) {
      expect(tileFaceSvg(face.code, jarajaraDesign())).toBe(tileFaceSvg(face.code));
      expect(tileSvg(face.code, { design: jarajaraDesign() })).toBe(tileSvg(face.code));
    }
  });

  it("fits a design's drawing to the tile, and fills in the faces it lacks with Jarajara's own on its plate", () => {
    expect(tileFaceSvg("a", made)).toBe(`<g transform="scale(0.1 0.1)"><circle id="one" r="50"/></g>`);
    expect(tileFaceSvg("e", made, true)).toContain("red-five");
    expect(tileFaceSvg("e", made, false)).toContain(`id="five"`);
    // No flower in the design: Jarajara's own, on the design's light panel.
    expect(tileFaceSvg("I", made)).toBe(`<rect id="light-panel" width="30" height="40"/>${tileFaceSvg("I")}`);
    expect(tileFaceSvg("?", made)).toBeNull();
    expect(tileBodySvg(made)).toContain("plate");
    expect(tileBodySvg(undefined)).toBeNull();
    expect(tileColours(made).side).toBe("#123456");
    expect(tileColours()).toMatchObject({ face: "#fffdf6" });
  });

  it("draws a tile on a design's plate, in its colours", () => {
    const svg = tileSvg("a", { design: made })!;
    expect(svg).toContain("#123456");
    expect(svg).toContain("plate");
    expect(svg).toContain(`aria-label="1 of characters"`);
    expect(tileSvg("a", { design: made, title: "" })).toContain(`aria-hidden="true"`);
  });

  it("makes symbols for the faces asked for, the plate, and the red fives", () => {
    const all = tileFaceSymbols("t", { design: made, red: true });
    expect(all).toContain(`id="t-body"`);
    expect(all).toContain(`id="t-e-red"`);
    expect(all.match(/<symbol/g)).toHaveLength(1 + 42 + 1);
    expect(tileFaceSymbols("t", { faces: ["a", "b"] }).match(/<symbol/g)).toHaveLength(2);
    expect(tileFaceSymbols("t").match(/<symbol/g)).toHaveLength(42);
  });

  it("makes the first five of each suit red, and only in the tiles that hold one", () => {
    // Fives: e characters, n circles, w bamboo.
    expect([...redFiveIndexes("aeenwwn")].sort()).toEqual([1, 3, 4]);
    expect([...redFiveIndexes(["a", "b"])]).toEqual([]);
    expect([...redFiveIndexes(".e.e")]).toEqual([1]);
  });
});

describe("a layout drawn in a design", () => {
  const deal = generateAwase(9, "easy", 11);

  it("draws a design's plate and symbols, and its red fives where it has them", () => {
    const svg = layoutSvg(9, deal.givens, { design: made, redFives: true })!;
    expect(svg).toContain(`id="jarajara-body"`);
    expect(svg).toContain(`href="#jarajara-body"`);
    expect(svg).toContain("#123456");
    expect(svg).toContain("-e-red");
    // Without the option, no red.
    expect(layoutSvg(9, deal.givens, { design: made })!).not.toContain("-e-red\"/>");
    // A design with no red fives draws none.
    expect(layoutSvg(9, deal.givens, { design: { ...made, red: undefined }, redFives: true })!).not.toContain("-e-red");
  });

  it("keeps a red five on the same tile as the others are taken, when told where to look", () => {
    const first = redFiveIndexes(deal.givens);
    const cells = [...deal.givens].map((code, at) => (first.has(at) ? "." : code)).join("");
    const kept = layoutSvg(9, cells, { design: made, redFives: true, redFrom: deal.givens })!;
    const moved = layoutSvg(9, cells, { design: made, redFives: true })!;
    expect(kept).not.toBe(moved);
  });

  it("leaves the symbols out when a page keeps them once", () => {
    const lean = layoutSvg(9, deal.givens, { symbols: false })!;
    const whole = layoutSvg(9, deal.givens)!;
    expect(lean).not.toContain("<symbol");
    expect(whole).toContain("<symbol");
    expect(lean.length).toBeLessThan(whole.length - 20000);
  });

  it("draws blocked tiles blank when asked, rings the matching, and marks the gold", () => {
    const blank = layoutSvg(9, deal.givens, { hideBlocked: true })!;
    expect(blank).toContain(`data-face=""`);
    expect(blank).toContain("tile, blank");
    expect(layoutSvg(9, deal.givens, { matching: [0, 1] })).toContain("stroke-dasharray");
    expect(layoutSvg(9, deal.givens, { marked: [0] })).toContain("#d4a017");
  });

  it("lays the layout on a cloth with a margin round it", () => {
    const bare = layoutSvg(9, deal.givens)!;
    const felt = layoutSvg(9, deal.givens, { cloth: "wood" })!;
    expect(felt).toContain(`data-cloth="wood"`);
    expect(felt).toContain(JARAJARA_CLOTHS.wood.felt);
    expect(bare).not.toContain("data-cloth");
    expect(layoutSvg(9, deal.givens, { cloth: "plaid" })).toBe(bare);
    expect(felt).toMatch(/viewBox="-\d+ -\d+ /);
  });
});

describe("the cloths", () => {
  it("are the family's five", () => {
    expect(CLOTHS).toEqual(["green", "blue", "red", "black", "wood"]);
    expect(JARAJARA_CLOTHS.green.felt).toBe("#2f5d4a");
    expect(JARAJARA_CLOTHS.wood).toEqual({ felt: "#e2ba7a", deep: "#c4954f", ink: "#2b1d0e" });
  });

  it("are named by a text, and give their colours as custom properties", () => {
    expect(isCloth("blue")).toBe(true);
    expect(isCloth("toString")).toBe(false);
    expect(isCloth(7)).toBe(false);
    expect(clothVars("red")).toEqual({ "--jarajara-felt": "#a3342e", "--jarajara-felt-deep": "#7a231f", "--jarajara-felt-ink": "#f3efe4" });
    expect(clothVars("plaid")).toEqual({});
    expect(clothVars(null)).toEqual({});
  });
});
