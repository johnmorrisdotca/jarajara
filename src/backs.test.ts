import { describe, expect, it } from "vitest";

import { isBuiltInBack, tileBackFace, tileBackSvg, TILE_BACKS } from "./backs.ts";
import { jarajaraDesign } from "./designs.ts";

const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;

describe("the backs", () => {
  it("draws all five, each its own", () => {
    expect(TILE_BACKS).toHaveLength(5);
    const drawn = TILE_BACKS.map((name) => tileBackSvg(name)!);
    for (const svg of drawn) {
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain(`viewBox="-1 -1 32 42"`);
    }
    expect(new Set(drawn).size).toBe(5);
    expect(isBuiltInBack("jade")).toBe(true);
    expect(isBuiltInBack("riichi")).toBe(false);
  });

  it("names a back for a screen reader unless it is decoration", () => {
    expect(tileBackSvg("bamboo")).toContain(`aria-label="tile, face down"`);
    expect(tileBackSvg("bamboo", { title: "" })).toContain(`aria-hidden="true"`);
    expect(tileBackSvg("bamboo", { title: "" })).not.toContain("aria-label");
    expect(tileBackSvg("bamboo", { title: "a hidden tile" })).toContain(`aria-label="a hidden tile"`);
  });

  it("has nothing to draw for a name that is no back and no design to bring it", () => {
    expect(tileBackSvg("nonesuch")).toBeNull();
    // As a plate inside a symbol it falls back to jade.
    expect(tileBackFace("nonesuch")).toBe(tileBackFace("jade"));
  });

  it("takes a colour of its own, and a mark that cannot be selected", () => {
    const plain = tileBackSvg("blue")!;
    const own = tileBackSvg("blue", { colour: "#aa3355" })!;
    expect(own).toContain("#aa3355");
    expect(own).not.toBe(plain);
    // A colour that is not hex is left out: the back keeps its own.
    expect(tileBackSvg("blue", { colour: "hotpink" })).toBe(plain);
    const marked = tileBackSvg("ink", { mark: "SITE" })!;
    expect(marked).toContain(">SITE</text>");
    expect(count(marked, /<text/g)).toBe(count(marked, /style="user-select:none/g));
    expect(tileBackSvg("ink", { mark: "<b>&" })).toContain("&lt;b&gt;&amp;");
    // Only eight letters are drawn.
    expect(tileBackSvg("ink", { mark: "ABCDEFGHIJ" })).toContain(">ABCDEFGH</text>");
  });

  it("draws a design's own back for a name it brings", () => {
    const design = { ...jarajaraDesign(), name: "mine", back: `<rect id="mine-back" width="30" height="40"/>` };
    expect(tileBackSvg("mine", { design })).toContain("mine-back");
    expect(tileBackFace("mine", { design })).toContain("mine-back");
  });
});
