import { describe, expect, it } from "vitest";

import { tileBackSvg } from "./backs.ts";
import { blockColours, directionOf, TILE_DEPTH, TILE_MIRRORS } from "./block.ts";
import { generateAwase } from "./awase.ts";
import { isFree, geometryOf, matchesOf } from "./board.ts";
import { lightness } from "./colour.ts";
import { loadTileDesign, TILE_DESIGNS } from "./designs.ts";
import { layoutFrame, layoutSvg, tileAt, TILE_MARKS } from "./draw.ts";
import { TILE_SIZE, tileSvg } from "./faces.ts";
import { ALL_LAYOUTS, layoutExtent, layoutFor } from "./layouts.ts";

const slotsOf = (svg: string): { slot: number; free: boolean }[] => [...svg.matchAll(/data-slot="(\d+)"[^>]*data-free="(true|false)"/g)].map((match) => ({ slot: Number(match[1]), free: match[2] === "true" }));

describe("a tile as a solid block", () => {
  it("draws a tile with its thickness, in a box that has room for it, and still has the old looks on request", async () => {
    const solid = tileSvg("B")!;
    expect(solid).toContain(`viewBox="-6 -1 37 47"`);
    expect(solid).toContain(`aria-label="east wind"`);
    expect(tileSvg("B", { flat: true })).toContain(`viewBox="-1 -1 32 42"`);
    expect(tileSvg("B", { bare: true })).toContain(`viewBox="0 0 30 40"`);
    expect(tileSvg("B", { mirror: "horizontal" })).toContain(`viewBox="-1 -1 37 47"`);
    expect(tileSvg("B", { mirror: "vertical" })).toContain(`viewBox="-6 -6 37 47"`);
    expect(tileBackSvg("jade")).toContain(`viewBox="-6 -1 37 47"`);
    expect(tileBackSvg("jade", { flat: true })).toContain(`viewBox="-1 -1 32 42"`);
    expect(tileBackSvg("jade", { bare: true })).toContain(`viewBox="0 0 30 40"`);
    // The thickness is the back plate's own colour where the back is a colour.
    expect(tileBackSvg("blue")).toContain(`fill="#2a5ea8"`);
    expect(await loadTileDesign("riichi")).not.toBeNull();
  });

  it("lifts each layer by exactly the tile's thickness, along the way the thickness shows", () => {
    for (const mirror of TILE_MIRRORS) {
      const direction = directionOf(mirror);
      const extent = { width: 16, height: 16 };
      const low = tileAt({ x: 4, y: 4, z: 0 }, 3, mirror, extent);
      const high = tileAt({ x: 4, y: 4, z: 1 }, 3, mirror, extent);
      expect(high.x - low.x).toBe(direction.x * TILE_DEPTH);
      expect(high.y - low.y).toBe(-direction.y * TILE_DEPTH);
    }
  });

  it("gives every design a seam round its faces that stands out from them, so a row of tiles can be counted", async () => {
    for (const name of TILE_DESIGNS) {
      const design = (await loadTileDesign(name))!;
      const colours = blockColours(design);
      expect(Math.abs(lightness(colours.seam) - lightness(design.colours.face)), name).toBeGreaterThanOrEqual(0.25);
      // A dark face is edged in something lighter; a light one in a highlight.
      if (lightness(design.colours.face) < 0.4) expect(lightness(colours.bevel) - lightness(design.colours.face), name).toBeGreaterThanOrEqual(0.1);
      expect(colours.body, name).not.toBe(design.colours.face);
    }
  });
});

describe("a layout seen from the other side", () => {
  const dealt = (size: number) => generateAwase(size, "easy", 2026).givens;

  it("keeps every tile's slot and whether it is free, in every view", () => {
    for (const layout of ALL_LAYOUTS) {
      const cells = dealt(layout.size);
      const plain = slotsOf(layoutSvg(layout.size, cells)!).sort((a, b) => a.slot - b.slot);
      const geometry = geometryOf(layout);
      for (const slot of plain) expect(slot.free).toBe(isFree(geometry, cells, slot.slot));
      for (const mirror of TILE_MIRRORS) {
        const seen = slotsOf(layoutSvg(layout.size, cells, { mirror })!).sort((a, b) => a.slot - b.slot);
        expect(seen, `${layout.key} ${mirror}`).toEqual(plain);
      }
    }
  });

  it("puts the left of the layout on the right when turned left to right, and the top at the bottom when turned top to bottom", () => {
    const layout = layoutFor(15)!;
    const extent = layoutExtent(layout);
    const ground = layout.slots.filter((slot) => slot.z === 0);
    const left = ground.reduce((best, slot) => (slot.x < best.x ? slot : best));
    const right = ground.reduce((best, slot) => (slot.x > best.x ? slot : best));
    const at = (slot: typeof left, mirror: "none" | "horizontal" | "vertical") => tileAt(slot, extent.layers, mirror, extent);
    expect(at(left, "none").x).toBeLessThan(at(right, "none").x);
    expect(at(left, "horizontal").x).toBeGreaterThan(at(right, "horizontal").x);
    const top = ground.reduce((best, slot) => (slot.y < best.y ? slot : best));
    const bottom = ground.reduce((best, slot) => (slot.y > best.y ? slot : best));
    expect(at(top, "vertical").y).toBeGreaterThan(at(bottom, "vertical").y);
    expect(at(top, "none").y).toBeLessThan(at(bottom, "none").y);
  });

  it("is the same size in every view, so turning the board never moves its frame", () => {
    for (const layout of ALL_LAYOUTS) {
      const sizes = TILE_MIRRORS.map((mirror) => layoutFrame(layout.size, { mirror, margin: 3 })!).map((frame) => [frame.width, frame.height]);
      for (const size of sizes) expect(size[0]).toBeCloseTo(sizes[0]![0]!, 0);
      for (const size of sizes) expect(size[1]).toBeCloseTo(sizes[0]![1]!, 0);
    }
  });
});

describe("the frame round what is drawn", () => {
  it("holds every tile, its thickness and its shadow, and adds the margin on every side alike", () => {
    for (const layout of ALL_LAYOUTS) {
      for (const mirror of TILE_MIRRORS) {
        const tight = layoutFrame(layout.size, { mirror })!;
        const shadowed = layoutFrame(layout.size, { mirror, shadow: true })!;
        expect(shadowed.width).toBeGreaterThan(tight.width);
        const loose = layoutFrame(layout.size, { mirror, margin: 5 })!;
        expect(loose.width - tight.width).toBeCloseTo(10, 1);
        expect(loose.height - tight.height).toBeCloseTo(10, 1);
        expect(tight.x - loose.x).toBeCloseTo(5, 1);
        const extent = layoutExtent(layout);
        for (const slot of layout.slots) {
          const at = tileAt(slot, extent.layers, mirror, extent);
          expect(at.x, `${layout.key} ${mirror}`).toBeGreaterThanOrEqual(tight.x);
          expect(at.y).toBeGreaterThanOrEqual(tight.y);
          expect(at.x + TILE_SIZE.width).toBeLessThanOrEqual(tight.x + tight.width);
          expect(at.y + TILE_SIZE.height).toBeLessThanOrEqual(tight.y + tight.height);
        }
      }
    }
  });

  it("is what the picture's viewBox says when a margin is asked for, and the old box when not", () => {
    const size = 15;
    const cells = generateAwase(size, "easy", 5).givens;
    const frame = layoutFrame(size, { margin: 3 })!;
    expect(layoutSvg(size, cells, { margin: 3 })).toContain(`viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}"`);
    expect(layoutSvg(size, cells)).toMatch(/viewBox="0 0 \d+ \d+"/);
    expect(layoutFrame(99)).toBeNull();
  });
});

describe("what Find lights", () => {
  it("draws a free match in a solid ring and a held one in a dashed ring, so colour is never the only difference", () => {
    const size = 9;
    const cells = generateAwase(size, "easy", 2026).givens;
    const geometry = geometryOf(layoutFor(size)!);
    const slot = [...cells].findIndex((_, at) => isFree(geometry, cells, at) && matchesOf(geometry, cells, "group", at).blocked.length > 0 && matchesOf(geometry, cells, "group", at).free.length > 0);
    const found = matchesOf(geometry, cells, "group", slot);
    const svg = layoutSvg(size, cells, { found })!;
    const lit = (index: number) => svg.slice(svg.indexOf(`data-slot="${index}"`)).split("</g>")[0]!;
    for (const free of found.free) {
      expect(lit(free)).toContain(`stroke="${TILE_MARKS.found}" stroke-width="2.4"`);
      expect(lit(free)).not.toContain("stroke-dasharray");
    }
    for (const held of found.blocked) {
      expect(lit(held)).toContain(`stroke="${TILE_MARKS.found}" stroke-width="1.3" stroke-dasharray`);
    }
    // Not the chosen colour, nor the hint's.
    expect(TILE_MARKS.found).not.toBe(TILE_MARKS.chosenRing);
    expect(TILE_MARKS.found).not.toBe(TILE_MARKS.hinted);
    expect(layoutSvg(size, cells)!).not.toContain(TILE_MARKS.found);
  });
});
