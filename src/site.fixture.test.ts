import { describe, expect, it } from "vitest";

import fixture from "./site.fixture.json" with { type: "json" };
import { generateAwase } from "./awase.ts";
import { computerPair } from "./computer.ts";
import { MAHJONG_LAYOUTS } from "./layouts.ts";
import { decodeMoves, playSolve } from "./moves.ts";
import { seededRandom } from "./random.ts";
import { encodeTable, readTable, startTable, takeAtTable } from "./table.ts";
import { MAHJONG_FACES, matchClass, pairPoints, setPairs } from "./tiles.ts";

/**
 * EVERYTHING ITSUTSU.COM MADE BEFORE THE MOVE, MADE AGAIN. Recorded from the site on 2026-10-01, the day Mahjong came
 * here: deals of every layout, level and bonus rule with the game the deal's own answer plays out, and whole games at
 * a table of computers. People's kept games and fastest times are on these deals, so a change that alters any of them
 * is a new version of the rules, never a fix.
 */
describe("the deals and games itsutsu.com made", () => {
  it("deals every recorded seed exactly as before, and its answer plays out to the same end", () => {
    for (const was of fixture.deals) {
      const deal = generateAwase(was.size, was.level as "easy" | "medium" | "hard", was.seed);
      expect(deal.givens, `${was.size} ${was.level} ${was.seed}`).toBe(was.givens);
      expect(deal.solution).toBe(was.solution);
      const played = playSolve(was.size, deal.givens, decodeMoves(deal.solution, deal.givens.length)!);
      expect(played?.cells ?? null).toBe(was.playedCells);
      expect(played?.shuffles ?? null).toBe(was.shuffles);
    }
    expect(fixture.deals).toHaveLength(66);
  }, 600_000);

  it("plays every recorded table of computers to the same end, the same scores and the same winners", () => {
    for (const was of fixture.tables) {
      const deal = generateAwase(was.size, "medium", was.seed);
      let table = startTable(deal, Array.from({ length: was.seats }, () => ({ name: "", computer: true as const })));
      for (let step = 0; step < 400; step += 1) {
        const pair = computerPair(table);
        if (pair === null) break;
        const next = takeAtTable(table, pair[0], pair[1]);
        if (next === null) break;
        table = next;
      }
      const state = readTable(table)!;
      expect(encodeTable(table)).toBe(was.code);
      expect(state.scores).toEqual(was.scores);
      expect(state.winners ?? null).toEqual(was.winners);
      expect(state.over).toBe(was.over);
    }
  }, 600_000);

  it("keeps the set, every face's scoring and matching, and every layout's tiles", () => {
    for (const was of fixture.sets) expect(setPairs(was.rule as "group" | "same", seededRandom(42)).map((pair) => pair.join("")).join(" ")).toBe(was.pairs);
    expect(MAHJONG_FACES.map((face) => ({ ...face, points: pairPoints(face.code), group: matchClass(face.code, "group"), same: matchClass(face.code, "same") }))).toEqual(fixture.faces);
    expect(MAHJONG_LAYOUTS.map((layout) => ({ size: layout.size, key: layout.key, slots: layout.slots.length }))).toEqual(fixture.layouts);
  });
});
