import { EMPTY_SLOT, faceOf, isFaceCode, MAHJONG_FACES } from "./tiles.ts";
import type { MahjongFace, MahjongSuit } from "./types.ts";

/**
 * WHAT A TILE IS CALLED, and finding one from what somebody typed. A face has an English name ("3 of circles",
 * "east wind", "plum (flower)") and a Japanese one (三筒, 東, 梅); `findFace` turns either, or a code, or the notation
 * riichi players write hands in (`3p`, `1z`), back into the face. Pure text, no drawing, so a server can use it.
 */

/** The two languages a tile is named in. */
export type TileLanguage = "en" | "ja";

const WIND_NAMES = ["east", "south", "west", "north"] as const;
const DRAGON_NAMES = ["red", "green", "white"] as const;
const FLOWER_NAMES = ["plum", "orchid", "chrysanthemum", "bamboo"] as const;
const SEASON_NAMES = ["spring", "summer", "autumn", "winter"] as const;
const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;
const SUIT_KANJI: Partial<Record<MahjongSuit, string>> = { characters: "萬", circles: "筒", bamboo: "索" };
const WIND_KANJI = ["東", "南", "西", "北"] as const;
const DRAGON_KANJI = ["中", "發", "白"] as const;
const FLOWER_KANJI = ["梅", "蘭", "菊", "竹"] as const;
const SEASON_KANJI = ["春", "夏", "秋", "冬"] as const;

/** What a face is called, in English: "3 of characters", "east wind", "red dragon", "plum (flower)". */
export function faceWords(face: MahjongFace): string {
  switch (face.suit) {
    case "characters":
    case "circles":
    case "bamboo":
      return `${face.rank} of ${face.suit}`;
    case "winds":
      return `${WIND_NAMES[face.rank - 1]} wind`;
    case "dragons":
      return `${DRAGON_NAMES[face.rank - 1]} dragon`;
    case "flowers":
      return `${FLOWER_NAMES[face.rank - 1]} (flower)`;
    case "seasons":
      return `${SEASON_NAMES[face.rank - 1]} (season)`;
  }
}

/** What a face is called in Japanese: 三萬, 五筒, 七索, 東, 中, 梅, 春. */
export function faceWordsJa(face: MahjongFace): string {
  switch (face.suit) {
    case "characters":
    case "circles":
    case "bamboo":
      return `${NUMERALS[face.rank - 1]}${SUIT_KANJI[face.suit]}`;
    case "winds":
      return WIND_KANJI[face.rank - 1]!;
    case "dragons":
      return DRAGON_KANJI[face.rank - 1]!;
    case "flowers":
      return FLOWER_KANJI[face.rank - 1]!;
    case "seasons":
      return SEASON_KANJI[face.rank - 1]!;
  }
}

/** A tile's name in a language, from its code; the code itself for a letter that is no face. */
export function tileName(code: string, language: TileLanguage = "en"): string {
  const face = faceOf(code);
  if (face === null) return code;
  return language === "ja" ? faceWordsJa(face) : faceWords(face);
}

/** What a suit or group is called, in English and in Japanese. */
export const SUIT_WORDS: Readonly<Record<MahjongSuit, { en: string; ja: string }>> = {
  characters: { en: "Characters", ja: "萬子" },
  circles: { en: "Circles", ja: "筒子" },
  bamboo: { en: "Bamboo", ja: "索子" },
  winds: { en: "Winds", ja: "風牌" },
  dragons: { en: "Dragons", ja: "三元牌" },
  flowers: { en: "Flowers", ja: "花牌" },
  seasons: { en: "Seasons", ja: "季節牌" },
};

/**
 * THE GROUPS A SET FALLS INTO, for a viewer: each suit, and the bigger families people name them by: `honours`
 * (winds and dragons), `bonus` (flowers and seasons), the `numbers` (the three suits), and the `terminals` (the
 * ones and nines) and `simples` (two to eight) a hand is judged by.
 */
export const TILE_GROUPS = ["characters", "circles", "bamboo", "winds", "dragons", "flowers", "seasons", "numbers", "honours", "bonus", "terminals", "simples"] as const;

/** A group's name. */
export type TileGroup = (typeof TILE_GROUPS)[number];

const NUMBER_SUITS: readonly MahjongSuit[] = ["characters", "circles", "bamboo"];

/** Whether a text names a group. */
export function isTileGroup(text: unknown): text is TileGroup {
  return typeof text === "string" && (TILE_GROUPS as readonly string[]).includes(text);
}

/** The faces of a group, in the set's order. */
export function groupFaces(group: TileGroup): MahjongFace[] {
  switch (group) {
    case "numbers":
      return MAHJONG_FACES.filter((face) => NUMBER_SUITS.includes(face.suit));
    case "honours":
      return MAHJONG_FACES.filter((face) => face.suit === "winds" || face.suit === "dragons");
    case "bonus":
      return MAHJONG_FACES.filter((face) => face.suit === "flowers" || face.suit === "seasons");
    case "terminals":
      return MAHJONG_FACES.filter((face) => NUMBER_SUITS.includes(face.suit) && (face.rank === 1 || face.rank === 9));
    case "simples":
      return MAHJONG_FACES.filter((face) => NUMBER_SUITS.includes(face.suit) && face.rank >= 2 && face.rank <= 8);
    default:
      return MAHJONG_FACES.filter((face) => face.suit === group);
  }
}

/** What a group is called, in English and in Japanese. */
export function groupWords(group: TileGroup, language: TileLanguage = "en"): string {
  const words: Record<string, { en: string; ja: string }> = {
    ...SUIT_WORDS,
    numbers: { en: "Numbers", ja: "数牌" },
    honours: { en: "Honours", ja: "字牌" },
    bonus: { en: "Bonus tiles", ja: "花牌と季節牌" },
    terminals: { en: "Terminals", ja: "老頭牌" },
    simples: { en: "Simples", ja: "中張牌" },
  };
  return words[group]![language];
}

/** How many of a face the set holds: four of every ordinary face, one of each flower and season. */
export function copiesOf(code: string): number {
  const face = faceOf(code);
  if (face === null) return 0;
  return face.suit === "flowers" || face.suit === "seasons" ? 1 : 4;
}

/** The whole set as an inventory: each of the 42 faces and how many of it the 144 tiles hold. */
export function setInventory(): { face: MahjongFace; copies: number }[] {
  return MAHJONG_FACES.map((face) => ({ face, copies: copiesOf(face.code) }));
}

/** How many of each face a list of tiles holds, by code; faces it holds none of are left out. */
export function countTiles(codes: Iterable<string>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const code of codes) if (isFaceCode(code)) counts.set(code, (counts.get(code) ?? 0) + 1);
  return counts;
}

const WORD_NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
const SUIT_WORDS_IN: Record<string, MahjongSuit> = {
  characters: "characters", character: "characters", man: "characters", wan: "characters", 萬: "characters", 萬子: "characters", 万: "characters",
  circles: "circles", circle: "circles", dots: "circles", dot: "circles", coins: "circles", pin: "circles", 筒: "circles", 筒子: "circles",
  bamboo: "bamboo", bamboos: "bamboo", sticks: "bamboo", sou: "bamboo", 索: "bamboo", 索子: "bamboo",
};
const NOTATION_SUITS: Record<string, MahjongSuit> = { m: "characters", p: "circles", s: "bamboo", z: "winds", f: "flowers", t: "seasons" };

const faceBy = (suit: MahjongSuit, rank: number): MahjongFace | null => MAHJONG_FACES.find((face) => face.suit === suit && face.rank === rank) ?? null;

/** The names the honours and bonus tiles go by besides their English ones: Japanese readings and the kanji. */
const ALIASES: Record<string, [MahjongSuit, number]> = {
  east: ["winds", 1], "east wind": ["winds", 1], ton: ["winds", 1], 東: ["winds", 1],
  south: ["winds", 2], "south wind": ["winds", 2], nan: ["winds", 2], 南: ["winds", 2],
  west: ["winds", 3], "west wind": ["winds", 3], shaa: ["winds", 3], sha: ["winds", 3], 西: ["winds", 3],
  north: ["winds", 4], "north wind": ["winds", 4], pei: ["winds", 4], 北: ["winds", 4],
  red: ["dragons", 1], "red dragon": ["dragons", 1], chun: ["dragons", 1], 中: ["dragons", 1],
  green: ["dragons", 2], "green dragon": ["dragons", 2], hatsu: ["dragons", 2], 發: ["dragons", 2], 発: ["dragons", 2],
  white: ["dragons", 3], "white dragon": ["dragons", 3], haku: ["dragons", 3], 白: ["dragons", 3],
  plum: ["flowers", 1], "plum flower": ["flowers", 1], "plum blossom": ["flowers", 1], 梅: ["flowers", 1],
  orchid: ["flowers", 2], "orchid flower": ["flowers", 2], 蘭: ["flowers", 2],
  chrysanthemum: ["flowers", 3], "chrysanthemum flower": ["flowers", 3], mum: ["flowers", 3], 菊: ["flowers", 3],
  "bamboo flower": ["flowers", 4], "flower bamboo": ["flowers", 4], 竹: ["flowers", 4],
  spring: ["seasons", 1], "spring season": ["seasons", 1], 春: ["seasons", 1],
  summer: ["seasons", 2], "summer season": ["seasons", 2], 夏: ["seasons", 2],
  autumn: ["seasons", 3], fall: ["seasons", 3], "autumn season": ["seasons", 3], 秋: ["seasons", 3],
  winter: ["seasons", 4], "winter season": ["seasons", 4], 冬: ["seasons", 4],
};

/** A number in a tile's name: a digit, an English word, or a kanji numeral. */
function rankIn(token: string): number | null {
  if (/^[1-9]$/.test(token)) return Number(token);
  if (token in WORD_NUMBERS) return WORD_NUMBERS[token]!;
  const kanji = NUMERALS.indexOf(token as (typeof NUMERALS)[number]);
  return kanji === -1 ? null : kanji + 1;
}

/**
 * The tile a text names, or null. It takes a face's code (`F`, case matters: one letter is a code); its English
 * name in any usual spelling ("3 of circles", "circles 3", "three circles", "east wind", "plum", "red dragon"); its
 * Japanese name (三筒, 東, 中) or the readings players use (`ton`, `haku`); and the notation hands are written in,
 * a number and a suit letter: `3m` characters, `3p` circles, `3s` bamboo, `1z`–`4z` the winds and `5z`–`7z` white,
 * green and red (the riichi order), plus `1f` and `1t` for the flowers and seasons, which are Jarajara's own.
 * `0m`, `0p` and `0s` are the red fives, which are fives here.
 */
export function findFace(text: string): MahjongFace | null {
  if (typeof text !== "string") return null;
  const raw = text.trim();
  if (raw.length === 0) return null;
  if (raw.length === 1 && isFaceCode(raw)) return faceOf(raw);
  const lower = raw.toLowerCase().replace(/[-_()]+/g, " ").replace(/\s+/g, " ").replace(/\b(tiles?|of the|the)\b/g, " ").replace(/\s+/g, " ").trim();
  const alias = ALIASES[lower] ?? ALIASES[raw];
  if (alias !== undefined) return faceBy(alias[0], alias[1]);
  // The notation: a digit and a suit letter.
  const note = /^([0-9])([mpsz]|f|t)$/.exec(lower);
  if (note !== null) {
    const rank = Number(note[1]) === 0 ? 5 : Number(note[1]);
    const suit = NOTATION_SUITS[note[2]!]!;
    if (suit === "winds") return rank <= 4 ? faceBy("winds", rank) : rank <= 7 ? faceBy("dragons", ({ 5: 3, 6: 2, 7: 1 } as Record<number, number>)[rank]!) : null;
    return faceBy(suit, rank);
  }
  // A number and a suit, either way round, with or without "of".
  const tokens = lower.replace(/\bof\b/g, " ").split(/\s+/).filter(Boolean);
  const spaced = tokens.length === 1 ? raw.match(/^([一二三四五六七八九1-9])\s*(萬子?|万|筒子?|索子?)$/) : null;
  const parts = spaced === null ? tokens : [spaced[1]!, spaced[2]!];
  if (parts.length === 2) {
    const [a, b] = parts as [string, string];
    const rank = rankIn(a) ?? rankIn(b);
    const suit = SUIT_WORDS_IN[a] ?? SUIT_WORDS_IN[b];
    if (rank !== null && suit !== undefined) return faceBy(suit, rank);
    // "flower 2", "season 4"
    const bonus = a === "flower" || b === "flower" ? "flowers" : a === "season" || b === "season" ? "seasons" : null;
    if (rank !== null && bonus !== null && rank <= 4) return faceBy(bonus, rank);
  }
  return null;
}

/** Every tile a text names: the one face `findFace` finds, or, for the name of a group (`winds`, `honours`, `circles`), all of its faces. */
export function findFaces(text: string): MahjongFace[] {
  const one = findFace(text);
  if (one !== null) return [one];
  const name = typeof text === "string" ? text.trim().toLowerCase().replace(/[-_\s]+/g, " ") : "";
  if (isTileGroup(name)) return groupFaces(name);
  const singular: Record<string, TileGroup> = { wind: "winds", dragon: "dragons", flower: "flowers", season: "seasons", honour: "honours", honor: "honours", honors: "honours", circle: "circles", character: "characters", terminal: "terminals", simple: "simples", number: "numbers" };
  return singular[name] === undefined ? [] : groupFaces(singular[name]!);
}

/** One suit's letter in the hand notation, and which letter a face is written with. */
const NOTATION_OF = (face: MahjongFace): { suit: string; rank: number } => {
  switch (face.suit) {
    case "characters":
      return { suit: "m", rank: face.rank };
    case "circles":
      return { suit: "p", rank: face.rank };
    case "bamboo":
      return { suit: "s", rank: face.rank };
    case "winds":
      return { suit: "z", rank: face.rank };
    case "dragons":
      return { suit: "z", rank: ({ 1: 7, 2: 6, 3: 5 } as Record<number, number>)[face.rank]! };
    case "flowers":
      return { suit: "f", rank: face.rank };
    case "seasons":
      return { suit: "t", rank: face.rank };
  }
};

/**
 * Tiles written the way hands are: digits then a suit letter, `123m456p789s1112z`. Runs of one suit share its
 * letter. Anything that is no tile is left out. `readNotation` is its inverse.
 */
export function writeNotation(codes: Iterable<string>): string {
  let out = "";
  let digits = "";
  let suit = "";
  for (const code of codes) {
    const face = faceOf(code);
    if (face === null) continue;
    const note = NOTATION_OF(face);
    if (note.suit !== suit && digits !== "") {
      out += digits + suit;
      digits = "";
    }
    suit = note.suit;
    digits += String(note.rank);
  }
  return out + (digits === "" ? "" : digits + suit);
}

/** Whether a text is written as hand notation, `123m456p`: nothing but digit runs each closed by a suit letter. */
export function isNotation(text: string): boolean {
  return /^(?:[0-9]+[mpszft])+$/i.test(text.trim());
}

/** The tiles a hand's notation writes, as codes in the order written; null when the text is not notation or names a tile there is not (`8z`). */
export function readNotation(text: string): string[] | null {
  const trimmed = text.trim().toLowerCase();
  if (!isNotation(trimmed)) return null;
  const codes: string[] = [];
  for (const [, digits, suit] of trimmed.matchAll(/([0-9]+)([mpszft])/g)) {
    for (const digit of digits!) {
      const face = findFace(`${digit}${suit}`);
      if (face === null) return null;
      codes.push(face.code);
    }
  }
  return codes;
}

/**
 * A LIST OF TILES AS TEXT, read the forgiving way: each word is a tile's name (`east`, `red-dragon`, `3p`) or a
 * run of one-letter codes (`abcF`), and hand notation (`123m456p`) is read as it is written. Words that are no
 * tile are dropped, and so is `.`, the empty slot. A bare word that is a name wins over its letters, so `east` is the
 * east wind and not four tiles.
 */
export function readTiles(text: string | null | undefined): string[] {
  if (typeof text !== "string") return [];
  const out: string[] = [];
  for (const word of text.split(/[\s,;]+/).filter(Boolean)) {
    const notation = readNotation(word);
    if (notation !== null) {
      out.push(...notation);
      continue;
    }
    const named = word.length > 1 ? findFace(word) : null;
    if (named !== null) {
      out.push(named.code);
      continue;
    }
    // The name of a suit or a group is not a run of codes, however its letters spell.
    if (word.length > 1 && (word.toLowerCase() in SUIT_WORDS_IN || findFaces(word).length > 1)) continue;
    for (const letter of word) if (letter !== EMPTY_SLOT && isFaceCode(letter)) out.push(letter);
  }
  return out;
}

/** Tiles as their one-letter codes run together, `abcF`: what `readTiles` reads and a layout's cells are written in. */
export function writeTiles(codes: Iterable<string>): string {
  return [...codes].filter(isFaceCode).join("");
}
