import type { Random } from "./random.ts";
import type { MahjongBonusRule, MahjongGeometry } from "./types.ts";
import { EMPTY_SLOT, matchClass } from "./tiles.ts";

/**
 * PLAYING A DEAL OUT AT RANDOM, the fast way. A player who takes any free pair at random is how a deal is graded
 * (`clearRate`), sixteen times for each of five deals, so this is the work that sets how long a deal takes to make.
 * Asking "which pairs are free" afresh after every pair (`freePairs`) costs the square of the free tiles for every
 * step, which is nothing on 144 tiles and two seconds on 576. So the free tiles are kept as they change: taking a pair
 * can only change the tiles it lay on and the ones beside it, and the pair taken is found by counting, not listing.
 *
 * It makes exactly the choices the plain way makes: the same free tiles in the same order, one number from `random`
 * for each pair taken, and the pair that number names among all the free pairs in the order `freePairs` lists them
 * (lower slot first, then in slot order). `playout.test.ts` holds it to that, and `site.fixture.test.ts` holds every
 * deal itsutsu.com made.
 */

/** The slots lying directly under each slot, worked out once for a layout and kept. */
const UNDER = new WeakMap<MahjongGeometry, readonly (readonly number[])[]>();

function underOf(geometry: MahjongGeometry): readonly (readonly number[])[] {
  const known = UNDER.get(geometry);
  if (known !== undefined) return known;
  const under: number[][] = geometry.above.map(() => []);
  geometry.above.forEach((over, slot) => over.forEach((on) => under[on]!.push(slot)));
  UNDER.set(geometry, under);
  return under;
}

/** How often a player taking any free pair at random clears this deal, out of `times`. */
export function clearRate(geometry: MahjongGeometry, cells: string, rule: MahjongBonusRule, random: Random, times: number): number {
  return playOut(geometry, cells, rule, random, times).cleared / times;
}

/**
 * HOW FAR a player taking any free pair at random gets, on average, as a share of the tiles taken (0 to 1). A deal on
 * more than one set of tiles is cleared at random so seldom that `clearRate` of sixteen games says nothing about it (the
 * Great Wall is cleared about one game in fifty), while how far a game gets before it is stuck tells a forgiving
 * deal from an unforgiving one in sixteen games as well as it does in a hundred.
 */
export function clearShare(geometry: MahjongGeometry, cells: string, rule: MahjongBonusRule, random: Random, times: number): number {
  const tiles = [...cells].filter((code) => code !== EMPTY_SLOT).length;
  return playOut(geometry, cells, rule, random, times).taken / (tiles * times);
}

function playOut(geometry: MahjongGeometry, cells: string, rule: MahjongBonusRule, random: Random, times: number): { cleared: number; taken: number } {
  const count = cells.length;
  const under = underOf(geometry);
  const classNumber = new Map<string, number>();
  const classes = new Int32Array(count);
  for (let slot = 0; slot < count; slot += 1) {
    if (cells[slot] === EMPTY_SLOT) continue;
    const key = matchClass(cells[slot]!, rule);
    if (!classNumber.has(key)) classNumber.set(key, classNumber.size);
    classes[slot] = classNumber.get(key)!;
  }
  const present = new Uint8Array(count);
  const free = new Uint8Array(count);
  const later = new Int32Array(count);
  const seen = new Int32Array(classNumber.size);
  const list = new Int32Array(count);
  const freshFree = (slot: number): number => {
    if (present[slot] === 0) return 0;
    for (const over of geometry.above[slot]!) if (present[over] === 1) return 0;
    let leftHeld = false;
    for (const side of geometry.left[slot]!) if (present[side] === 1) leftHeld = true;
    if (!leftHeld) return 1;
    for (const side of geometry.right[slot]!) if (present[side] === 1) return 0;
    return 1;
  };
  let cleared = 0;
  let taken = 0;
  for (let game = 0; game < times; game += 1) {
    let left = 0;
    for (let slot = 0; slot < count; slot += 1) {
      present[slot] = cells[slot] === EMPTY_SLOT ? 0 : 1;
      left += present[slot]!;
    }
    const total = left;
    for (let slot = 0; slot < count; slot += 1) free[slot] = freshFree(slot);
    for (;;) {
      // The free tiles in slot order, and for each how many free tiles after it match it: a pair for every one.
      let freeCount = 0;
      for (let slot = 0; slot < count; slot += 1) if (free[slot] === 1) list[freeCount++] = slot;
      seen.fill(0);
      let pairs = 0;
      for (let at = freeCount - 1; at >= 0; at -= 1) {
        const slot = list[at]!;
        later[at] = seen[classes[slot]!]!;
        pairs += later[at]!;
        seen[classes[slot]!] += 1;
      }
      if (pairs === 0) break;
      let pick = Math.floor(random() * pairs);
      let first = 0;
      while (pick >= later[first]!) {
        pick -= later[first]!;
        first += 1;
      }
      const a = list[first]!;
      let second = first + 1;
      for (;; second += 1) {
        if (classes[list[second]!] === classes[a]) {
          if (pick === 0) break;
          pick -= 1;
        }
      }
      const b = list[second]!;
      present[a] = 0;
      present[b] = 0;
      left -= 2;
      for (const gone of [a, b]) {
        free[gone] = 0;
        for (const slot of under[gone]!) free[slot] = freshFree(slot);
        for (const slot of geometry.left[gone]!) free[slot] = freshFree(slot);
        for (const slot of geometry.right[gone]!) free[slot] = freshFree(slot);
      }
    }
    if (left === 0) cleared += 1;
    taken += total - left;
  }
  return { cleared, taken };
}
