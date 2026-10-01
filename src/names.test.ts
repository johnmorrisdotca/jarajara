import { describe, expect, it } from "vitest";

import { copiesOf, countTiles, faceWords, faceWordsJa, findFace, findFaces, groupFaces, groupWords, isNotation, readNotation, readTiles, setInventory, TILE_GROUPS, tileName, writeNotation, writeTiles } from "./names.ts";
import { MAHJONG_FACES } from "./tiles.ts";

describe("names", () => {
  it("names every face in English and in Japanese, and no two alike", () => {
    expect(new Set(MAHJONG_FACES.map((face) => faceWords(face))).size).toBe(42);
    expect(new Set(MAHJONG_FACES.map((face) => faceWordsJa(face))).size).toBe(42);
    expect(tileName("c")).toBe("3 of characters");
    expect(tileName("c", "ja")).toBe("三萬");
    expect(tileName("B", "ja")).toBe("東");
    expect(tileName("F", "ja")).toBe("中");
    expect(tileName("?")).toBe("?");
  });

  it("finds a tile from its code, either name, or the notation", () => {
    expect(findFace("F")?.code).toBe("F");
    expect(findFace("f")?.code).toBe("f");
    for (const face of MAHJONG_FACES) {
      expect(findFace(faceWords(face))?.code, faceWords(face)).toBe(face.code);
      expect(findFace(faceWordsJa(face))?.code, faceWordsJa(face)).toBe(face.code);
    }
    for (const text of ["3 of circles", "circles 3", "three circles", "3-circles", "Circles-3", "3p", "3 pin", "三筒"]) expect(findFace(text)?.code, text).toBe("l");
    for (const [text, code] of [["east", "B"], ["East Wind", "B"], ["ton", "B"], ["1z", "B"], ["4z", "E"], ["red", "F"], ["7z", "F"], ["6z", "G"], ["hatsu", "G"], ["white dragon", "H"], ["5z", "H"], ["haku", "H"], ["plum", "I"], ["bamboo flower", "L"], ["1f", "I"], ["spring", "M"], ["4t", "P"], ["flower 2", "J"], ["0m", "e"], ["0p", "n"], ["0s", "w"]] as const) {
      expect(findFace(text)?.code, text).toBe(code);
    }
    for (const text of ["", "  ", "nothing", "8z", "10p", "3", "bamboo", "circles"]) expect(findFace(text), text).toBeNull();
  });

  it("finds a group's tiles by its name", () => {
    expect(findFaces("winds")).toHaveLength(4);
    expect(findFaces("dragon")).toHaveLength(3);
    expect(findFaces("honours")).toHaveLength(7);
    expect(findFaces("bamboo")).toHaveLength(9);
    expect(findFaces("east").map((face) => face.code)).toEqual(["B"]);
    expect(findFaces("nonsense")).toEqual([]);
  });

  it("splits the 144 tiles into groups that add up", () => {
    const sizes = Object.fromEntries(TILE_GROUPS.map((group) => [group, groupFaces(group).length]));
    expect(sizes).toMatchObject({ characters: 9, circles: 9, bamboo: 9, winds: 4, dragons: 3, flowers: 4, seasons: 4, numbers: 27, honours: 7, bonus: 8, terminals: 6, simples: 21 });
    for (const group of TILE_GROUPS) expect(groupWords(group, "en").length).toBeGreaterThan(2);
    expect(groupWords("winds", "ja")).toBe("風牌");
  });

  it("counts the set: 144 tiles in 42 faces", () => {
    const inventory = setInventory();
    expect(inventory).toHaveLength(42);
    expect(inventory.reduce((total, one) => total + one.copies, 0)).toBe(144);
    expect(copiesOf("a")).toBe(4);
    expect(copiesOf("I")).toBe(1);
    expect(copiesOf("?")).toBe(0);
    expect([...countTiles("aabF?").entries()]).toEqual([["a", 2], ["b", 1], ["F", 1]]);
  });

  it("writes hands as notation and reads them back", () => {
    expect(writeNotation("abcjklsBBCFGH")).toBe("123m123p1s112765z");
    expect(isNotation("123m456p")).toBe(true);
    expect(isNotation("abc")).toBe(false);
    expect(readNotation("123m456p11z")).toEqual(["a", "b", "c", "m", "n", "o", "B", "B"]);
    expect(readNotation("8z")).toBeNull();
    expect(readNotation("hello")).toBeNull();
    for (let take = 0; take < 5; take += 1) {
      const codes = MAHJONG_FACES.filter((_, at) => (at + take) % 3 === 0).map((face) => face.code);
      expect(readNotation(writeNotation(codes))).toEqual(codes);
    }
  });

  it("reads a list of tiles in whatever spelling it is given", () => {
    expect(readTiles("abcF")).toEqual(["a", "b", "c", "F"]);
    expect(readTiles("a b, c;F")).toEqual(["a", "b", "c", "F"]);
    expect(readTiles("east red-dragon 3p")).toEqual(["B", "F", "l"]);
    expect(readTiles("123m 11z")).toEqual(["a", "b", "c", "B", "B"]);
    expect(readTiles("a.b")).toEqual(["a", "b"]);
    expect(readTiles("bamboo winds F")).toEqual(["F"]);
    expect(readTiles(null)).toEqual([]);
    expect(writeTiles(readTiles("east plum ?"))).toBe("BI");
  });
});
