import type { MahjongLayout, MahjongSlot } from "./types.ts";

/**
 * THE MEGA LAYOUTS, for more than one set of tiles. A set is 144 tiles, so these are laid with a double set (288) and a
 * quadruple set (576), drawn as the others are: Jarajara's own, tile by tile, in the same slot format as `layouts.ts`,
 * and none a copy of any other game's. A shape is an idea anyone may draw (a wall with towers, a palace round a
 * courtyard); these two are drawn here from scratch.
 *
 * Written in whole tiles, a rectangle at a time (`block`), and mirrored (`both`, `four`) so each is symmetrical and
 * its count can be read off the drawing: the tests count it. A layout's `size` is its width in tiles, as the others'.
 * They are separate from `MAHJONG_LAYOUTS` and `MORE_LAYOUTS` for the same reason those two are apart: a new layout is a
 * new size, never an old one made different.
 */

/** A rectangle of tiles on one layer, from column `x0` to `x1` and row `y0` to `y1`, in whole tiles, inclusive. */
function block(z: number, x0: number, y0: number, x1: number, y1: number): MahjongSlot[] {
  const slots: MahjongSlot[] = [];
  for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) slots.push({ x: x * 2, y: y * 2, z });
  return slots;
}

/** The tiles in the order a deal is written in: layer by layer, row by row, across. */
function inOrder(slots: MahjongSlot[]): MahjongSlot[] {
  return [...slots].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
}

/** Tiles that fall in two shapes of a layer once, so a rectangle drawn twice over itself is not two tiles on one place. */
function once(slots: MahjongSlot[]): MahjongSlot[] {
  const seen = new Set<string>();
  return slots.filter((slot) => {
    const key = `${slot.z},${slot.y},${slot.x}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * THE GREAT WALL 長城, 288 tiles, twenty across: a stretch of wall with its walkway along the top, a watchtower at each
 * end and the gate tower in the middle, which rises in five layers above the rest. The wall is four tiles thick; the
 * towers stand out of it two rows to the front and behind, and the gate tower is the highest.
 */
function greatWall(): MahjongLayout {
  const width = 20;
  const mirror = (z: number, x0: number, y0: number, x1: number, y1: number) => [...block(z, x0, y0, x1, y1), ...block(z, width - 1 - x1, y0, width - 1 - x0, y1)];
  const wall = [
    ...block(0, 0, 3, 19, 6),
    ...mirror(0, 1, 1, 4, 8),
    ...block(0, 8, 1, 11, 8),
    ...block(1, 1, 4, 18, 5),
    ...mirror(1, 1, 2, 4, 7),
    ...block(1, 8, 2, 11, 7),
    ...mirror(2, 1, 3, 4, 6),
    ...block(2, 8, 3, 11, 6),
    ...mirror(3, 2, 3, 3, 6),
    ...block(3, 9, 3, 10, 6),
    ...block(4, 9, 4, 10, 5),
  ];
  return { size: width, key: "wall", slots: inOrder(once(wall)) };
}

/**
 * THE PALACE 宮殿, 576 tiles, twenty-six across: a wall round a courtyard with a gate in its south side, a tower at each
 * corner and one either side of the gate, and the great hall in the middle, climbing in six steps from a broad floor to a
 * ridge.
 */
function palace(): MahjongLayout {
  const width = 26;
  const height = 16;
  const across = (x: number) => width - 1 - x;
  const down = (y: number) => height - 1 - y;
  /** A rectangle in each of the four corners, mirrored across and down. */
  const four = (z: number, x0: number, y0: number, x1: number, y1: number) => [
    ...block(z, x0, y0, x1, y1),
    ...block(z, across(x1), y0, across(x0), y1),
    ...block(z, x0, down(y1), x1, down(y0)),
    ...block(z, across(x1), down(y1), across(x0), down(y0)),
  ];
  const gate = width / 2 - 2;
  const wall = [
    ...block(0, 0, 0, width - 1, 0),
    ...block(0, 0, height - 1, gate - 1, height - 1),
    ...block(0, gate + 4, height - 1, width - 1, height - 1),
    ...block(0, 0, 0, 0, height - 1),
    ...block(0, width - 1, 0, width - 1, height - 1),
    ...four(0, 0, 0, 3, 3),
    ...four(1, 0, 0, 3, 3),
    ...four(2, 1, 1, 2, 2),
    ...four(3, 1, 1, 2, 2),
    ...block(0, gate - 2, height - 3, gate - 1, height - 1),
    ...block(0, gate + 4, height - 3, gate + 5, height - 1),
    ...block(1, gate - 2, height - 3, gate - 1, height - 1),
    ...block(1, gate + 4, height - 3, gate + 5, height - 1),
  ];
  const hall: [number, number][] = [
    [5, 4],
    [6, 5],
    [7, 5],
    [9, 6],
    [10, 6],
    [11, 7],
  ];
  hall.forEach(([x, y], z) => wall.push(...block(z, x, y, across(x), down(y))));
  return { size: width, key: "palace", slots: inOrder(once(wall)) };
}

export const MEGA_LAYOUTS: readonly MahjongLayout[] = [greatWall(), palace()];
