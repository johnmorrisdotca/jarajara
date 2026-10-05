import { describe, expect, it } from "vitest";

import { generateAwase, AWASE_SAME_BLOCK } from "./awase.ts";
import { freePairs, geometryOf, overlapsOnLayer } from "./board.ts";
import { checkAwase } from "./check.ts";
import { ALL_LAYOUTS, layoutExtent, layoutFor, MAHJONG_LAYOUTS } from "./layouts.ts";
import { MORE_LAYOUTS } from "./layouts-more.ts";
import { bonusRuleOf } from "./tiles.ts";

describe("the more layouts", () => {
  it("are six, each a new width and a new name, after the five that never change", () => {
    expect(MORE_LAYOUTS.map((layout) => layout.key)).toEqual(["pagoda", "fortress", "pyramid", "bridge", "butterfly", "dragon"]);
    expect(MAHJONG_LAYOUTS.map((layout) => layout.size)).toEqual([4, 8, 9, 10, 15]);
    expect(ALL_LAYOUTS).toHaveLength(13);
    expect(new Set(ALL_LAYOUTS.map((layout) => layout.size)).size).toBe(13);
    expect(new Set(ALL_LAYOUTS.map((layout) => layout.key)).size).toBe(13);
    for (const layout of MORE_LAYOUTS) expect(layoutFor(layout.size)).toBe(layout);
  });

  it("are named by their width in tiles, and never wider than they say", () => {
    for (const layout of MORE_LAYOUTS) {
      const { width, height, layers } = layoutExtent(layout);
      expect(width / 2, layout.key).toBe(layout.size);
      expect(layers, layout.key).toBeGreaterThanOrEqual(3);
      expect(height, layout.key).toBeGreaterThan(8);
    }
  });

  it("hold an even number of tiles the set can fill, none on another's place", () => {
    for (const layout of MORE_LAYOUTS) {
      expect(layout.slots.length % 2, layout.key).toBe(0);
      expect(layout.slots.length, layout.key).toBeGreaterThanOrEqual(80);
      expect(layout.slots.length, layout.key).toBeLessThanOrEqual(144);
      expect(overlapsOnLayer(layout), layout.key).toBe(false);
      // Written in the order a deal is: layer by layer, row by row, across.
      const keys = layout.slots.map((slot) => slot.z * 1_000_000 + slot.y * 1_000 + slot.x);
      expect(keys, layout.key).toEqual([...keys].sort((a, b) => a - b));
    }
  });

  it("are all their own: no layout here has the slots of another", () => {
    const written = ALL_LAYOUTS.map((layout) => JSON.stringify(layout.slots));
    expect(new Set(written).size).toBe(written.length);
  });

  it("start with pairs to take, and never a tile with nothing to rest on", () => {
    for (const layout of MORE_LAYOUTS) {
      const deal = generateAwase(layout.size, "medium", 4242);
      expect(freePairs(geometryOf(layout), deal.givens, bonusRuleOf(deal.givens)).length, layout.key).toBeGreaterThan(3);
      // A tile on a higher layer lies over a tile below it: nothing floats.
      for (const slot of layout.slots.filter((one) => one.z > 0)) {
        expect(
          layout.slots.some((below) => below.z === slot.z - 1 && Math.abs(below.x - slot.x) < 2 && Math.abs(below.y - slot.y) < 2),
          `${layout.key} ${slot.x},${slot.y},${slot.z}`,
        ).toBe(true);
      }
    }
  });

  it("deal and clear: every seed, at every level, under both bonus rules, the deal's own answer clears it", () => {
    for (const layout of MORE_LAYOUTS) {
      for (const level of ["easy", "medium", "hard"] as const) {
        for (const seed of [1, 2, 3, 99, 20261001, 1_234_567_890, AWASE_SAME_BLOCK.from + 5]) {
          const deal = generateAwase(layout.size, level, seed);
          expect(deal.givens, `${layout.key} ${level} ${seed}`).toHaveLength(layout.slots.length);
          expect(checkAwase(layout.size, deal.givens, deal.solution), `${layout.key} ${level} ${seed}`).toEqual({ ok: true });
        }
      }
    }
  }, 120_000);
});
