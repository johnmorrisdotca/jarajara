import type { MahjongBonusRule, MahjongFace, MahjongSuit } from "./types.ts";

/**
 * THE SET: 144 tiles in 42 faces. Three suits of nine — characters 萬子,
 * circles 筒子 and bamboo 索子 — four copies of each; the four winds and the
 * three dragons, four copies of each; and one each of the four flowers and the
 * four seasons. That is the set the solitaire has always been played with.
 *
 * Each face is written as one letter (`FACE_CODES`), so a deal is a string a
 * character a slot and "." a slot emptied.
 */
const SUIT_RANKS: readonly [MahjongSuit, number][] = [
  ["characters", 9],
  ["circles", 9],
  ["bamboo", 9],
  ["winds", 4],
  ["dragons", 3],
  ["flowers", 4],
  ["seasons", 4],
];

/** One letter a face, in the order of `SUIT_RANKS`: a–i characters, j–r circles, s–A bamboo, B–E winds, F–H dragons, I–L flowers, M–P seasons. */
const FACE_CODES = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP";

/** The cell marker for a tile already removed from the layout.
 *
 * @example
 * ```ts
 * import { EMPTY_SLOT } from "@johnmorrisdotca/jarajara";
 * console.log(EMPTY_SLOT);
 * ```
 */
export const EMPTY_SLOT = ".";

/** The forty-two tile faces in stable code order, including bonus tiles.
 *
 * @example
 * ```ts
 * import { MAHJONG_FACES } from "@johnmorrisdotca/jarajara";
 * console.log(MAHJONG_FACES.length);
 * ```
 */
export const MAHJONG_FACES: readonly MahjongFace[] = (() => {
  const faces: MahjongFace[] = [];
  for (const [suit, ranks] of SUIT_RANKS) {
    for (let rank = 1; rank <= ranks; rank += 1) faces.push({ code: FACE_CODES[faces.length]!, suit, rank });
  }
  return faces;
})();

const BY_CODE = new Map(MAHJONG_FACES.map((face) => [face.code, face]));

/** The face a letter stands for, or null for anything that is not one.
 *
 * @param code - The one-character face code or tile identifier.
 * @returns The face a letter stands for, or null for anything that is not one.
 * @example
 * ```ts
 * import { faceOf } from "@johnmorrisdotca/jarajara";
 *
 * console.log(faceOf("a"));
 * ```
 */
export function faceOf(code: string): MahjongFace | null {
  return BY_CODE.get(code) ?? null;
}

/** Whether a single character names a supported tile face.
 *
 * @param code - The one-character face code or tile identifier.
 * @returns Whether a single character names a supported tile face.
 * @example
 * ```ts
 * import { isFaceCode } from "@johnmorrisdotca/jarajara";
 *
 * console.log(isFaceCode("?"));
 * ```
 */
export function isFaceCode(code: string): boolean {
  return BY_CODE.has(code);
}

/** A flower or a season: one of a kind in the set, and matched by its group under the usual rule.
 *
 * @param code - The one-character face code or tile identifier.
 * @returns A flower or a season: one of a kind in the set, and matched by its group under the usual rule.
 * @example
 * ```ts
 * import { isBonus } from "@johnmorrisdotca/jarajara";
 *
 * console.log(isBonus("I"));
 * ```
 */
export function isBonus(code: string): boolean {
  const suit = faceOf(code)?.suit;
  return suit === "flowers" || suit === "seasons";
}

/**
 * THE MATCHING RULE. Two identical tiles match; under the usual rule a flower
 * matches any flower and a season any season, since there is only one of each.
 *
 * @param code - The one-character face code or tile identifier.
 * @param rule - Grouped or identical bonus matching.
 * @returns THE MATCHING RULE. Two identical tiles match; under the usual rule a flower matches any flower and a season any season, since there is only one of each.
 * @example
 * ```ts
 * import { matchClass } from "@johnmorrisdotca/jarajara";
 *
 * console.log(matchClass("I","group"));
 * ```
 */
export function matchClass(code: string, rule: MahjongBonusRule): string {
  const face = faceOf(code);
  if (face === null) return code;
  if (rule === "group" && (face.suit === "flowers" || face.suit === "seasons")) return face.suit;
  return code;
}

/** Whether two tile face codes match under the selected bonus rule.
 *
 * @param a - The first tile slot or code specified by this signature.
 * @param b - The second tile slot or code specified by this signature.
 * @param rule - Grouped or identical bonus matching.
 * @returns Whether two tile face codes match under the selected bonus rule.
 * @example
 * ```ts
 * import { tilesMatch } from "@johnmorrisdotca/jarajara";
 *
 * console.log(tilesMatch("I","J","group"));
 * ```
 */
export function tilesMatch(a: string, b: string, rule: MahjongBonusRule): boolean {
  return a !== EMPTY_SLOT && b !== EMPTY_SLOT && matchClass(a, rule) === matchClass(b, rule);
}

/**
 * The deal's rule, read from the deal itself: a bonus tile dealt twice can
 * only be the Identical rule, since the usual one deals each flower and season
 * once. A deal holding no bonus tile plays alike under both, and says `group`.
 *
 * @param cells - The face-code string in native slot order; dot marks a removed tile.
 * @returns The deal's rule, read from the deal itself: a bonus tile dealt twice can only be the Identical rule, since the usual one deals each flower and season once. A deal holding no bonus tile plays alike under both, and says `group`.
 * @example
 * ```ts
 * import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
 * import { bonusRuleOf } from "@johnmorrisdotca/jarajara";
 *
 * const deal = generateAwase(4,"easy",2026);
 * const cells = deal.givens;
 * console.log(bonusRuleOf(cells));
 * ```
 */
export function bonusRuleOf(cells: string): MahjongBonusRule {
  const seen = new Set<string>();
  for (const code of cells) {
    if (!isBonus(code)) continue;
    if (seen.has(code)) return "same";
    seen.add(code);
  }
  return "group";
}

/**
 * EVERY PAIR THE SET HOLDS, 72 of them: each ordinary face twice (four
 * copies), and the eight bonus tiles as four pairs — two flowers and two
 * seasons, split at random under the usual rule, or four faces drawn twice
 * each under the Identical rule. `random` decides the splits; the order is the
 * set's, and the deal shuffles it.
 *
 * `sets` is how many sets a mega layout is dealt (2 for 288 tiles, 4 for 576), 1 unless said, and a deal of one set is
 * exactly what it has always been. More sets are each set's pairs again, with one difference under the usual rule: a
 * flower or a season is dealt once, since a deal that held one twice would be read as the Identical rule
 * (`bonusRuleOf`). The bonus pairs a further set would have held are four more pairs of ordinary faces, drawn at
 * random, so the tile count is the same.
 *
 * @param rule - Grouped or identical bonus matching.
 * @param random - A reproducible random source returning values in [0,1).
 * @param sets - The number of complete physical tile sets.
 * @returns EVERY PAIR THE SET HOLDS, 72 of them: each ordinary face twice (four copies), and the eight bonus tiles as four pairs — two flowers and two seasons, split at random under the usual rule, or four faces drawn twice each under the Identical rule. `random` decides the splits; the order is the set's, and the deal shuffles it.
 * @example
 * ```ts
 * import { seededRandom, setPairs } from "@johnmorrisdotca/jarajara";
 *
 * console.log(setPairs("group",seededRandom(42)).length);
 * ```
 */
export function setPairs(rule: MahjongBonusRule, random: () => number, sets = 1): [string, string][] {
  const pairs: [string, string][] = [];
  const ordinary = MAHJONG_FACES.filter((face) => face.suit !== "flowers" && face.suit !== "seasons");
  const bonus = MAHJONG_FACES.filter((face) => face.suit === "flowers" || face.suit === "seasons").map((face) => face.code);
  for (let set = 0; set < sets; set += 1) {
    for (const face of ordinary) pairs.push([face.code, face.code], [face.code, face.code]);
    if (set > 0 && rule === "group") {
      for (let extra = 0; extra < 4; extra += 1) {
        const face = ordinary[Math.floor(random() * ordinary.length)]!;
        pairs.push([face.code, face.code]);
      }
      continue;
    }
    const mixed = bonus.map((code) => ({ code, key: random() }));
    if (rule === "group") {
      for (const suit of ["flowers", "seasons"] as const) {
        const group = mixed.filter((each) => faceOf(each.code)!.suit === suit).sort((a, b) => a.key - b.key);
        pairs.push([group[0]!.code, group[1]!.code], [group[2]!.code, group[3]!.code]);
      }
    } else {
      const drawn = mixed.sort((a, b) => a.key - b.key).slice(0, 4);
      for (const each of drawn) pairs.push([each.code, each.code]);
    }
  }
  return pairs;
}

/**
 * WHAT A PAIR IS WORTH AT THE TABLE (`table.ts`): the plain suit tiles one,
 * the ones and nines two, the winds three and the dragons four — the honours
 * and terminals are the tiles a mahjong hand prizes — and a flower or season
 * pair two, with another turn, as a bonus tile draws again in the full game.
 *
 * @param code - The one-character face code or tile identifier.
 * @returns WHAT A PAIR IS WORTH AT THE TABLE (`table.ts`): the plain suit tiles one, the ones and nines two, the winds three and the dragons four — the honours and terminals are the tiles a mahjong hand prizes — and a flower or season pair two, with another turn, as a bonus tile draws again in the full game.
 * @example
 * ```ts
 * import { pairPoints } from "@johnmorrisdotca/jarajara";
 *
 * console.log(pairPoints("F"));
 * ```
 */
export function pairPoints(code: string): number {
  const face = faceOf(code);
  if (face === null) return 0;
  switch (face.suit) {
    case "winds":
      return 3;
    case "dragons":
      return 4;
    case "flowers":
    case "seasons":
      return 2;
    default:
      return face.rank === 1 || face.rank === 9 ? 2 : 1;
  }
}

/** Whether taking this pair gives its taker another turn at the table: a flower or season pair.
 *
 * @param code - The one-character face code or tile identifier.
 * @returns Whether taking this pair gives its taker another turn at the table: a flower or season pair.
 * @example
 * ```ts
 * import { pairGoesAgain } from "@johnmorrisdotca/jarajara";
 *
 * console.log(pairGoesAgain("I"));
 * ```
 */
export function pairGoesAgain(code: string): boolean {
  return isBonus(code);
}
