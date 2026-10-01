import { describe, expect, it } from "vitest";

import { generateAwase } from "./awase.ts";
import { freePairs, geometryOf, hintFor, isFree, matchesOf } from "./board.ts";
import { runHint, startRun } from "./challenge.ts";
import { layoutFor } from "./layouts.ts";
import { faceOf, matchClass } from "./tiles.ts";
import { hintPair } from "./ui/layoutElement.ts";

const layout9 = layoutFor(9)!;
const geometry = geometryOf(layout9);
const dealt = generateAwase(9, "easy", 2026).givens;

/** A board with only these slots filled, each with the face given. */
const slotsOf = (cells: string): number[] => Array.from({ length: cells.length }, (_, at) => at);
const lone = (faces: Record<number, string>) => [...dealt].map((_, at) => faces[at] ?? ".").join("");

describe("a hint that looks first for the chosen tile's match", () => {
  it("with nothing chosen, is the same free pair the old hint gave", () => {
    const hint = hintFor(geometry, dealt, "group");
    expect(hint.found).toBe("any");
    expect(hint.pair).toEqual(hintPair(layout9, dealt, "group"));
    expect(hintFor(geometry, dealt, "group", null)).toEqual(hint);
    expect(hintFor(geometry, dealt, "group", undefined)).toEqual(hint);
  });

  it("with a free tile chosen that has a free match, gives that match, the chosen tile first", () => {
    const [a, b] = freePairs(geometry, dealt, "group")[3]!;
    const hint = hintFor(geometry, dealt, "group", b);
    expect(hint.found).toBe("match");
    expect(hint.pair![0]).toBe(b);
    expect(matchClass(dealt[hint.pair![0]]!, "group")).toBe(matchClass(dealt[hint.pair![1]]!, "group"));
    expect(isFree(geometry, dealt, hint.pair![1])).toBe(true);
    // The first of a pair named the other way round is still the chosen one.
    expect(hintFor(geometry, dealt, "group", a).pair![0]).toBe(a);
  });

  it("with a free tile chosen that has no free match, falls back to any free pair and says so", () => {
    // Look through deals for a free tile whose every match is held: there are plenty.
    let seen = 0;
    for (let seed = 1; seed <= 60 && seen < 3; seed += 1) {
      const cells = generateAwase(9, "easy", seed).givens;
      for (let slot = 0; slot < cells.length; slot += 1) {
        if (!isFree(geometry, cells, slot) || matchesOf(geometry, cells, "group", slot).free.length > 0) continue;
        const hint = hintFor(geometry, cells, "group", slot);
        expect(hint.found).toBe("other");
        expect(hint.pair).toEqual(hintFor(geometry, cells, "group").pair);
        expect(hint.pair).not.toContain(slot);
        seen += 1;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("with no pair at all, is null and says none, chosen or not", () => {
    const cells = lone({ 0: "a", 1: "d" });
    expect(freePairs(geometry, cells, "group")).toEqual([]);
    expect(hintFor(geometry, cells, "group")).toEqual({ pair: null, found: "none" });
    expect(hintFor(geometry, cells, "group", 0)).toEqual({ pair: null, found: "none" });
    expect(hintFor(geometry, ".".repeat(dealt.length), "group")).toEqual({ pair: null, found: "none" });
  });

  it("treats a chosen tile that is not free as nothing chosen", () => {
    const covered = slotsOf(dealt).find((slot) => !isFree(geometry, dealt, slot))!;
    expect(hintFor(geometry, dealt, "group", covered)).toEqual(hintFor(geometry, dealt, "group"));
  });

  it("is what a game's hint gives, counted against the hints it may use", () => {
    const run = startRun({ size: 9, seed: 2026, givens: dealt }, { hints: 2 });
    const [, b] = freePairs(geometry, dealt, "group")[0]!;
    const hint = runHint(run, b)!;
    expect(hint.found).toBe("match");
    expect(hint.pair[0]).toBe(b);
    expect(hint.run.hintsUsed).toBe(1);
    expect(runHint(run)!.found).toBe("any");
  });
});

describe("the tiles that match one", () => {
  it("tells the ones that could be taken with it now from the ones that are held, and leaves out itself", () => {
    const slot = slotsOf(dealt).find((one) => isFree(geometry, dealt, one) && matchesOf(geometry, dealt, "group", one).blocked.length > 0)!;
    const found = matchesOf(geometry, dealt, "group", slot);
    expect(found.free.length + found.blocked.length).toBeGreaterThan(0);
    expect([...found.free, ...found.blocked]).not.toContain(slot);
    for (const other of found.free) expect(isFree(geometry, dealt, other)).toBe(true);
    for (const other of found.blocked) expect(isFree(geometry, dealt, other)).toBe(false);
    const every = slotsOf(dealt).filter((other) => other !== slot && matchClass(dealt[other]!, "group") === matchClass(dealt[slot]!, "group"));
    expect([...found.free, ...found.blocked].sort((a, b) => a - b)).toEqual(every);
  });

  it("calls every match held when the tile itself is held, since none can be taken with it now", () => {
    const covered = slotsOf(dealt).find((slot) => !isFree(geometry, dealt, slot))!;
    const found = matchesOf(geometry, dealt, "group", covered);
    expect(found.free).toEqual([]);
    expect(found.blocked.length).toBeGreaterThan(0);
  });

  it("follows the bonus rule: any flower matches any flower in a group game, only the same tile when it must be identical", () => {
    const turtle = layoutFor(15)!;
    const wide = generateAwase(15, "easy", 7).givens;
    const flowers = [...wide].flatMap((code, at) => (faceOf(code)!.suit === "flowers" ? [at] : []));
    expect(flowers.length).toBeGreaterThan(1);
    const g = geometryOf(turtle);
    const grouped = matchesOf(g, wide, "group", flowers[0]!);
    expect(grouped.free.length + grouped.blocked.length).toBe(flowers.length - 1);
    const same = matchesOf(g, wide, "same", flowers[0]!);
    expect(same.free.length + same.blocked.length).toBeLessThan(grouped.free.length + grouped.blocked.length);
  });

  it("has nothing for an empty slot or a slot that is not one", () => {
    const cells = `.${dealt.slice(1)}`;
    expect(matchesOf(geometry, cells, "group", 0)).toEqual({ free: [], blocked: [] });
    expect(matchesOf(geometry, cells, "group", -1)).toEqual({ free: [], blocked: [] });
    expect(matchesOf(geometry, cells, "group", 9999)).toEqual({ free: [], blocked: [] });
  });
});
