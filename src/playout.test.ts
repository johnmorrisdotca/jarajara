import { describe, expect, it } from "vitest";

import { freePairs, geometryOf, takePair, tilesLeft } from "./board.ts";
import { hashText, layPairs } from "./deal.ts";
import { ALL_LAYOUTS } from "./layouts.ts";
import { clearRate } from "./playout.ts";
import { seededRandom, shuffled, type Random } from "./random.ts";
import { setPairs } from "./tiles.ts";
import type { MahjongBonusRule } from "./types.ts";

/** The plain way, as `clearRate` was first written: list every free pair afresh after each one is taken. */
function plainRate(cells: string, layoutSize: number, rule: MahjongBonusRule, random: Random, times: number): number {
  const geometry = geometryOf(ALL_LAYOUTS.find((layout) => layout.size === layoutSize)!);
  let cleared = 0;
  for (let game = 0; game < times; game += 1) {
    let tiles = cells;
    for (;;) {
      const pairs = freePairs(geometry, tiles, rule);
      if (pairs.length === 0) break;
      const [a, b] = pairs[Math.floor(random() * pairs.length)]!;
      tiles = takePair(tiles, a, b);
    }
    if (tilesLeft(tiles) === 0) cleared += 1;
  }
  return cleared / times;
}

describe("playing a deal out at random", () => {
  it("makes every choice the plain way makes: the same rate, and the same stream of numbers used", () => {
    for (const layout of ALL_LAYOUTS) {
      const geometry = geometryOf(layout);
      for (const rule of ["group", "same"] as const) {
        for (const seed of [3, 41]) {
          const make = seededRandom(hashText(`playout-test:${layout.key}:${rule}:${seed}`) || 1);
          const sets = Math.ceil(layout.slots.length / 144);
          const pairs = shuffled(setPairs(rule, make, sets), make).slice(0, layout.slots.length / 2);
          const laid = layPairs(geometry, layout.slots.map(() => true), pairs, make);
          expect(laid, `${layout.key} ${rule} ${seed}`).not.toBeNull();
          const quick = seededRandom(seed);
          const plain = seededRandom(seed);
          const times = layout.slots.length > 300 ? 3 : 12;
          expect(clearRate(geometry, laid!.cells, rule, quick, times), `${layout.key} ${rule} ${seed}`).toBe(plainRate(laid!.cells, layout.size, rule, plain, times));
          // The same number of draws from the stream, so the games after it would go the same way.
          expect(quick()).toBe(plain());
        }
      }
    }
  }, 120_000);
});
