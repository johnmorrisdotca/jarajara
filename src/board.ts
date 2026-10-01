import type { MahjongBonusRule, MahjongCells, MahjongGeometry, MahjongLayout } from "./types.ts";
import { EMPTY_SLOT, matchClass } from "./tiles.ts";

/**
 * WHAT MAKES A TILE FREE, and the moves that follow from it. Pure: every
 * function takes the tiles as they lie and returns new ones.
 *
 * A tile is free when nothing lies on it — no tile on any higher layer
 * overlapping it, even by half — and at least one of its long sides, left or
 * right, has no tile touching it on its own layer. Only a free tile can be
 * taken, and only with a free tile that matches it.
 */

const GEOMETRIES = new WeakMap<MahjongLayout, MahjongGeometry>();

/** What lies on and beside each slot, worked out once for a layout and kept. */
export function geometryOf(layout: MahjongLayout): MahjongGeometry {
  const known = GEOMETRIES.get(layout);
  if (known !== undefined) return known;
  const { slots } = layout;
  const above: number[][] = slots.map(() => []);
  const left: number[][] = slots.map(() => []);
  const right: number[][] = slots.map(() => []);
  slots.forEach((slot, index) => {
    slots.forEach((other, near) => {
      if (near === index) return;
      const overlapsDown = Math.abs(other.y - slot.y) < 2;
      if (other.z > slot.z && overlapsDown && Math.abs(other.x - slot.x) < 2) above[index]!.push(near);
      if (other.z === slot.z && overlapsDown && other.x === slot.x - 2) left[index]!.push(near);
      if (other.z === slot.z && overlapsDown && other.x === slot.x + 2) right[index]!.push(near);
    });
  });
  const geometry = { layout, above, left, right };
  GEOMETRIES.set(layout, geometry);
  return geometry;
}

/** Whether two slots of one layer overlap, which no layout may have: a tile cannot share a place. */
export function overlapsOnLayer(layout: MahjongLayout): boolean {
  const { slots } = layout;
  return slots.some((slot, index) =>
    slots.some((other, near) => near > index && other.z === slot.z && Math.abs(other.x - slot.x) < 2 && Math.abs(other.y - slot.y) < 2),
  );
}

/** Whether a slot's tile could be taken now, among the slots `present` says are still filled. */
export function isFreeAmong(geometry: MahjongGeometry, present: (slot: number) => boolean, slot: number): boolean {
  if (!present(slot)) return false;
  if (geometry.above[slot]!.some(present)) return false;
  return !geometry.left[slot]!.some(present) || !geometry.right[slot]!.some(present);
}

/** Whether the tile in this slot is free. */
export function isFree(geometry: MahjongGeometry, cells: MahjongCells, slot: number): boolean {
  if (cells[slot] === EMPTY_SLOT) return false;
  // Loops rather than `isFreeAmong`'s closures: this runs for every slot of every step of every playout a deal is graded by.
  for (const over of geometry.above[slot]!) if (cells[over] !== EMPTY_SLOT) return false;
  let leftOpen = true;
  for (const side of geometry.left[slot]!) if (cells[side] !== EMPTY_SLOT) leftOpen = false;
  if (leftOpen) return true;
  for (const side of geometry.right[slot]!) if (cells[side] !== EMPTY_SLOT) return false;
  return true;
}

/** Every free tile, by slot. */
export function freeSlots(geometry: MahjongGeometry, cells: MahjongCells): number[] {
  const free: number[] = [];
  for (let slot = 0; slot < cells.length; slot += 1) if (isFree(geometry, cells, slot)) free.push(slot);
  return free;
}

/** Why a tile cannot be taken now: covered by a tile on it, or held on both sides. Null for a free tile or an empty slot. */
export function blockedBy(geometry: MahjongGeometry, cells: MahjongCells, slot: number): "covered" | "sides" | null {
  const present = (at: number) => cells[at] !== EMPTY_SLOT;
  if (!present(slot)) return null;
  if (geometry.above[slot]!.some(present)) return "covered";
  if (geometry.left[slot]!.some(present) && geometry.right[slot]!.some(present)) return "sides";
  return null;
}

/** Every pair that could be taken now, each once, lower slot first, in slot order. */
export function freePairs(geometry: MahjongGeometry, cells: MahjongCells, rule: MahjongBonusRule): [number, number][] {
  const free = freeSlots(geometry, cells);
  const pairs: [number, number][] = [];
  for (let i = 0; i < free.length; i += 1) {
    for (let j = i + 1; j < free.length; j += 1) {
      if (matchClass(cells[free[i]!]!, rule) === matchClass(cells[free[j]!]!, rule)) pairs.push([free[i]!, free[j]!]);
    }
  }
  return pairs;
}

/** Whether these two slots are a pair that may be taken now. */
export function canTake(geometry: MahjongGeometry, cells: MahjongCells, rule: MahjongBonusRule, a: number, b: number): boolean {
  if (a === b || a < 0 || b < 0 || a >= cells.length || b >= cells.length) return false;
  if (!isFree(geometry, cells, a) || !isFree(geometry, cells, b)) return false;
  return matchClass(cells[a]!, rule) === matchClass(cells[b]!, rule);
}

/** The tiles with a pair taken. The caller has asked `canTake`. */
export function takePair(cells: MahjongCells, a: number, b: number): MahjongCells {
  const next = [...cells];
  next[a] = EMPTY_SLOT;
  next[b] = EMPTY_SLOT;
  return next.join("");
}

/** How many tiles are still on the layout. */
export function tilesLeft(cells: MahjongCells): number {
  let count = 0;
  for (const code of cells) if (code !== EMPTY_SLOT) count += 1;
  return count;
}

/** Whether every tile has been taken. */
export function isCleared(cells: MahjongCells): boolean {
  return tilesLeft(cells) === 0;
}

/** Which tile Find would show for a slot: the ones that could be taken with it now, and the ones that match but are held. */
export type MatchesOf = {
  /** The slots that match the tile and could be taken with it now: both are free. Empty when the tile itself is held. */
  free: number[];
  /** The other slots that match it: held by a tile on top or on both sides (or, when the tile itself is held, every match). */
  blocked: number[];
};

/**
 * EVERY TILE THAT MATCHES A SLOT'S, under the bonus rule in play, told apart by whether it could be taken with it now.
 * A tile's own slot is never in either list, and an empty slot has no matches. Pure: it reads the tiles as they lie.
 */
export function matchesOf(geometry: MahjongGeometry, cells: MahjongCells, rule: MahjongBonusRule, slot: number): MatchesOf {
  const none: MatchesOf = { free: [], blocked: [] };
  if (!Number.isInteger(slot) || slot < 0 || slot >= cells.length || cells[slot] === EMPTY_SLOT) return none;
  const wanted = matchClass(cells[slot]!, rule);
  const takeable = isFree(geometry, cells, slot);
  const result: MatchesOf = { free: [], blocked: [] };
  for (let other = 0; other < cells.length; other += 1) {
    if (other === slot || cells[other] === EMPTY_SLOT || matchClass(cells[other]!, rule) !== wanted) continue;
    if (takeable && isFree(geometry, cells, other)) result.free.push(other);
    else result.blocked.push(other);
  }
  return result;
}

/** What a hint found: a pair with the chosen tile in it (`match`), another pair because the chosen tile has no free match (`other`), a pair when no tile was chosen (`any`), or no pair at all (`none`). */
export type HintKind = "match" | "other" | "any" | "none";

/** A hint: the pair to show (the chosen tile first, for a `match`) and what kind of answer it is. */
export type Hint = { pair: [number, number] | null; found: HintKind };

/**
 * A HINT, WHICH LOOKS FIRST FOR THE CHOSEN TILE'S MATCH. With a free tile chosen, the answer is a free tile that matches
 * it, as a pair with the chosen tile first (`found: "match"`), the one that leaves the stacks lowest after it; if it has
 * none, any free pair, said so (`"other"`), so a page can say "no free match for that tile" before it shows another. With
 * nothing chosen (or a chosen tile that is not free) it is any free pair as ever (`"any"`): the one lifting the layers
 * highest, so a hint never digs a tile deeper than it must. With no pair at all, `pair` is null and `found` is `"none"`.
 */
export function hintFor(geometry: MahjongGeometry, cells: MahjongCells, rule: MahjongBonusRule, chosen?: number | null): Hint {
  const slots = geometry.layout.slots;
  const height = (a: number, b: number) => slots[a]!.z + slots[b]!.z;
  const best = (pairs: [number, number][]): [number, number] | null => {
    let top: [number, number] | null = null;
    let up = -1;
    for (const pair of pairs) {
      if (height(pair[0], pair[1]) > up) {
        top = pair;
        up = height(pair[0], pair[1]);
      }
    }
    return top;
  };
  const pairs = freePairs(geometry, cells, rule);
  if (pairs.length === 0) return { pair: null, found: "none" };
  if (chosen !== undefined && chosen !== null && isFree(geometry, cells, chosen)) {
    const own = pairs.filter(([a, b]) => a === chosen || b === chosen).map(([a, b]): [number, number] => (a === chosen ? [a, b] : [b, a]));
    const pair = best(own);
    if (pair !== null) return { pair, found: "match" };
    return { pair: best(pairs), found: "other" };
  }
  return { pair: best(pairs), found: "any" };
}
