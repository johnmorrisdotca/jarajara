import { describe, expect, it } from "vitest";

import { arrangeIndexes, arrangeTiles, describeSlot, groupStarts, groupTiles, kindOf, mixTiles, readSlotKeys, sortSlots } from "./arrange.ts";
import { layoutFor } from "./layouts.ts";

describe("arranging tiles", () => {
  it("sorts by the set's own order, rank across suits, kind, or letter, and is stable", () => {
    const hand = ["F", "l", "a", "B", "m", "a", "I", "j"];
    expect(arrangeTiles(hand, "suit")).toEqual(["a", "a", "j", "l", "m", "B", "F", "I"]);
    expect(arrangeTiles(hand, "rank")).toEqual(["a", "a", "j", "l", "m", "B", "F", "I"]);
    expect(arrangeTiles(hand, "kind")).toEqual(["a", "a", "j", "l", "m", "B", "F", "I"]);
    expect(arrangeTiles(hand, "code")).toEqual(["B", "F", "I", "a", "a", "j", "l", "m"]);
    expect(arrangeTiles(hand, "dealt")).toEqual(hand);
    // The input is left alone.
    expect(hand).toEqual(["F", "l", "a", "B", "m", "a", "I", "j"]);
  });

  it("puts ranks together across the suits for rank order, the honours after", () => {
    // 2 characters (b), 1 circles (j), 2 circles (k), 1 characters (a), east (B).
    expect(arrangeTiles(["b", "j", "k", "a", "B"], "rank")).toEqual(["a", "j", "b", "k", "B"]);
  });

  it("answers the places the tiles come from", () => {
    expect(arrangeIndexes(["b", "a", "b", "a"], "suit")).toEqual([1, 3, 0, 2]);
    expect(arrangeIndexes(["b", "a"], "dealt")).toEqual([0, 1]);
  });

  it("knows a tile's kind", () => {
    expect([kindOf("a"), kindOf("B"), kindOf("F"), kindOf("I"), kindOf("M"), kindOf("?")]).toEqual([0, 1, 1, 2, 2, 3]);
  });

  it("groups by suit or by kind, a gap after each run", () => {
    const hand = ["B", "a", "j", "c", "F", "I", "k"];
    expect(groupTiles(hand, "suit")).toEqual([["a", "c"], ["j", "k"], ["B"], ["F"], ["I"]]);
    expect(groupTiles(hand, "kind")).toEqual([["a", "c", "j", "k"], ["B", "F"], ["I"]]);
    expect(groupStarts(["a", "c", "j", "k", "B"], "suit")).toEqual([2, 4]);
    expect(groupStarts([], "suit")).toEqual([]);
  });

  it("mixes into another order with the same tiles, the same way for the same seed", () => {
    const hand = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const mixed = mixTiles(hand, 7);
    expect([...mixed].sort()).toEqual(hand);
    expect(mixed).not.toEqual(hand);
    expect(mixTiles(hand, 7)).toEqual(mixed);
    expect(mixTiles(["a", "a", "a"], 1)).toEqual(["a", "a", "a"]);
    expect(mixTiles([], 1)).toEqual([]);
  });
});

describe("sorting a layout's slots", () => {
  const layout = layoutFor(15)!;

  it("reads the keys, and drops what is no axis", () => {
    expect(readSlotKeys("z y x")).toEqual(["z", "y", "x"]);
    expect(readSlotKeys("X,-z")).toEqual(["x", "-z"]);
    expect(readSlotKeys("up down")).toEqual([]);
    expect(readSlotKeys(null)).toEqual([]);
  });

  it("puts them in the layout's own order by z, y, x", () => {
    expect(sortSlots(layout, ["z", "y", "x"])).toEqual(layout.slots.map((_, at) => at));
    expect(sortSlots(layout)).toEqual(layout.slots.map((_, at) => at));
  });

  it("sorts by x, y or z, the other way with a minus, and keeps every slot once", () => {
    for (const keys of [["x"], ["y"], ["z"], ["-z", "x"], ["x", "y", "z"], ["-x", "-y", "-z"]] as const) {
      const order = sortSlots(layout, keys);
      expect([...order].sort((a, b) => a - b)).toEqual(layout.slots.map((_, at) => at));
    }
    const byX = sortSlots(layout, ["x"]).map((at) => layout.slots[at]!.x);
    expect(byX).toEqual([...byX].sort((a, b) => a - b));
    const byTop = sortSlots(layout, ["-z"]).map((at) => layout.slots[at]!.z);
    expect(byTop[0]).toBe(4);
    expect(byTop.at(-1)).toBe(0);
    // Slots equal on the first key keep the layout's order.
    const columns = sortSlots(layout, ["x", "y", "z"]).map((at) => layout.slots[at]!);
    expect(columns[0]).toEqual({ x: 0, y: 7, z: 0 });
  });

  it("says where a slot lies, in tiles and from layer 1", () => {
    expect(describeSlot(layout, 0)).toEqual({ x: 1, y: 0, z: 1 });
    expect(describeSlot(layout, 9999)).toBeNull();
  });
});
