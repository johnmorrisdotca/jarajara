import { describe, expect, it } from "vitest";

import { RACK_LIFT, rackPlaces, rackWidth, TILE_TALL } from "./rackLayout.ts";

describe("where tiles lie in a rack", () => {
  it("lays them in a row, a step apart, the first at nought", () => {
    const places = rackPlaces(4);
    expect(places.map((place) => place.x)).toEqual([0, 1.02, 2.04, 3.06]);
    expect(places.every((place) => place.y === 0)).toBe(true);
    expect(rackPlaces(0)).toEqual([]);
    expect(rackPlaces(-3)).toEqual([]);
    expect(rackPlaces(Number.NaN)).toEqual([]);
  });

  it("sets a group apart by a gap", () => {
    const places = rackPlaces(5, { breaks: [2, 4] });
    expect(places.map((place) => place.x)).toEqual([0, 1.02, 2.49, 3.51, 4.98]);
    // A break at the first tile is no gap at all.
    expect(rackPlaces(2, { breaks: [0] })[0]!.x).toBe(0);
  });

  it("raises the tiles picked up, and only those", () => {
    const places = rackPlaces(3, { lifted: [1] });
    expect(places.map((place) => place.y)).toEqual([0, -RACK_LIFT, 0]);
    expect(rackPlaces(2, { lifted: new Set([0]), lift: 0.5 })[0]!.y).toBe(-0.5);
  });

  it("measures a rack by its last tile", () => {
    expect(rackWidth(rackPlaces(1))).toBe(1);
    expect(rackWidth(rackPlaces(14))).toBeCloseTo(13 * 1.02 + 1, 5);
    expect(rackWidth([])).toBe(0);
  });

  it("knows a tile is taller than wide", () => {
    expect(TILE_TALL).toBeCloseTo(1.3125, 4);
  });

  it("is wider grouped than not, which is why a rack keeps the room of its widest", () => {
    const plain = rackWidth(rackPlaces(14));
    const grouped = rackWidth(rackPlaces(14, { breaks: [3, 6, 9, 12] }));
    expect(grouped).toBeGreaterThan(plain);
  });
});
