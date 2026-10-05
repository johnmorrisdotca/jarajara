import { describe, expect, it } from "vitest";

import { AWASE_SAME_BLOCK, bonusRuleOfSeed, generateAwase } from "./awase.ts";
import { dailyAwase } from "./challenge.ts";
import { checkAwase } from "./check.ts";
import { computerPair } from "./computer.ts";
import { freePairs, geometryOf, overlapsOnLayer } from "./board.ts";
import { shuffleTiles } from "./deal.ts";
import { ALL_LAYOUTS, layoutExtent, layoutFor } from "./layouts.ts";
import { MEGA_LAYOUTS } from "./layouts-mega.ts";
import { seededRandom } from "./random.ts";
import { startTable } from "./table.ts";
import { bonusRuleOf, faceOf, isBonus, setPairs } from "./tiles.ts";

describe("the mega layouts", () => {
  it("are the Wall of 288 tiles and the Palace of 576, each its own width, a double set and a quadruple set", () => {
    expect(MEGA_LAYOUTS.map((layout) => [layout.key, layout.size, layout.slots.length])).toEqual([
      ["wall", 20, 288],
      ["palace", 26, 576],
    ]);
    for (const layout of MEGA_LAYOUTS) expect(layoutFor(layout.size)).toBe(layout);
    expect(new Set(ALL_LAYOUTS.map((layout) => layout.size)).size).toBe(ALL_LAYOUTS.length);
    expect(MEGA_LAYOUTS.map((layout) => layoutExtent(layout).layers)).toEqual([5, 6]);
  });

  it("are named by their width in tiles, hold no two tiles on one place, and leave nothing floating", () => {
    for (const layout of MEGA_LAYOUTS) {
      expect(layoutExtent(layout).width / 2, layout.key).toBe(layout.size);
      expect(overlapsOnLayer(layout), layout.key).toBe(false);
      const keys = layout.slots.map((slot) => slot.z * 1_000_000 + slot.y * 1_000 + slot.x);
      expect(keys, layout.key).toEqual([...keys].sort((a, b) => a - b));
      for (const slot of layout.slots.filter((one) => one.z > 0)) {
        expect(
          layout.slots.some((below) => below.z === slot.z - 1 && Math.abs(below.x - slot.x) < 2 && Math.abs(below.y - slot.y) < 2),
          `${layout.key} ${slot.x},${slot.y},${slot.z}`,
        ).toBe(true);
      }
    }
  });

  it("are the same seen from the left as from the right", () => {
    for (const layout of MEGA_LAYOUTS) {
      const mirrored = layout.slots.map((slot) => `${slot.z},${slot.y},${(layout.size - 1) * 2 - slot.x}`).sort();
      expect(mirrored, layout.key).toEqual(layout.slots.map((slot) => `${slot.z},${slot.y},${slot.x}`).sort());
    }
  });

  it("are not the slots of any other layout", () => {
    const written = ALL_LAYOUTS.map((layout) => JSON.stringify(layout.slots));
    expect(new Set(written).size).toBe(written.length);
  });
});

describe("a deal of more than one set", () => {
  it("holds a set's pairs for each set: 72 a set, and the one set it always was", () => {
    for (const rule of ["group", "same"] as const) {
      expect(setPairs(rule, seededRandom(5), 1)).toHaveLength(72);
      expect(setPairs(rule, seededRandom(5), 2)).toHaveLength(144);
      expect(setPairs(rule, seededRandom(5), 4)).toHaveLength(288);
      expect(setPairs(rule, seededRandom(5))).toEqual(setPairs(rule, seededRandom(5), 1));
    }
  });

  it("deals a flower or a season once under the usual rule and in identical pairs under the other, so the deal says which it is", () => {
    for (const sets of [2, 4]) {
      const group = setPairs("group", seededRandom(9), sets).flat().filter(isBonus);
      expect(group, `group ${sets}`).toHaveLength(8);
      expect(new Set(group).size, `group ${sets}`).toBe(8);
      expect(bonusRuleOf(setPairs("group", seededRandom(9), sets).flat().join("")), `group ${sets}`).toBe("group");
      const same = setPairs("same", seededRandom(9), sets);
      expect(same.flat().filter(isBonus), `same ${sets}`).toHaveLength(8 * sets);
      for (const [a, b] of same.filter(([a]) => isBonus(a))) expect(a).toBe(b);
      expect(bonusRuleOf(same.flat().join("")), `same ${sets}`).toBe("same");
    }
  });

  it("is made in a fraction of a second, with every tile of the layout dealt", () => {
    for (const layout of MEGA_LAYOUTS) {
      const started = performance.now();
      const deal = generateAwase(layout.size, "medium", 2026);
      expect(performance.now() - started, layout.key).toBeLessThan(1500);
      expect(deal.givens).toHaveLength(layout.slots.length);
      expect([...deal.givens].every((code) => faceOf(code) !== null)).toBe(true);
    }
  });

  it("can be cleared: every level, from several seeds, under both bonus rules, and the rule is the one the seed names", () => {
    for (const layout of MEGA_LAYOUTS) {
      for (const level of ["easy", "medium", "hard"] as const) {
        for (const seed of [1, 2, 99, 20261005, 1_234_567_890, AWASE_SAME_BLOCK.from + 5, AWASE_SAME_BLOCK.from + 77]) {
          const deal = generateAwase(layout.size, level, seed);
          expect(checkAwase(layout.size, deal.givens, deal.solution), `${layout.key} ${level} ${seed}`).toEqual({ ok: true });
          expect(bonusRuleOf(deal.givens), `${layout.key} ${level} ${seed}`).toBe(bonusRuleOfSeed(seed));
        }
      }
    }
  }, 120_000);

  it("is made again exactly from the same seed, and differently at the three levels", () => {
    for (const layout of MEGA_LAYOUTS) {
      expect(generateAwase(layout.size, "hard", 31)).toEqual(generateAwase(layout.size, "hard", 31));
      const levels = (["easy", "medium", "hard"] as const).map((level) => generateAwase(layout.size, level, 31).givens);
      expect(new Set(levels).size, layout.key).toBeGreaterThan(1);
    }
  });

  it("starts with pairs to take", () => {
    for (const layout of MEGA_LAYOUTS) {
      const deal = generateAwase(layout.size, "medium", 4242);
      expect(freePairs(geometryOf(layout), deal.givens, bonusRuleOf(deal.givens)).length, layout.key).toBeGreaterThan(5);
    }
  });

  it("can be shuffled when stuck, to tiles that match the ones that were left", () => {
    for (const layout of MEGA_LAYOUTS) {
      const geometry = geometryOf(layout);
      const deal = generateAwase(layout.size, "medium", 8);
      const shuffled = shuffleTiles(geometry, deal.givens, bonusRuleOf(deal.givens), 0);
      expect(shuffled, layout.key).not.toBeNull();
      expect([...shuffled!].sort().join(""), layout.key).toBe([...deal.givens].sort().join(""));
    }
  });

  it("is never the day's game, which is what it was before the mega layouts came", () => {
    for (let day = 1; day <= 366; day += 1) {
      const date = new Date(Date.UTC(2026, 0, day));
      expect(MEGA_LAYOUTS.map((layout) => layout.size)).not.toContain(dailyAwase(date).size);
    }
  });

  it("is played at a table: a computer takes a pair of the Palace's first turn in a moment", () => {
    for (const layout of MEGA_LAYOUTS) {
      const table = startTable(generateAwase(layout.size, "medium", 3), [{ name: "", computer: true }, { name: "", computer: true }]);
      const started = performance.now();
      expect(computerPair(table), layout.key).not.toBeNull();
      expect(performance.now() - started, layout.key).toBeLessThan(1500);
    }
  });
});
