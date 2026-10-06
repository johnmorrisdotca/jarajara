import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { TILE_SOUND_DATA } from "./sounds.ts";

/** The recordings in sounds/ are what src/sounds.ts holds, and each is credited. */
describe("the recordings", () => {
  it("are every file in sounds/, each named in CREDITS.md, and src/sounds.ts is made from them", () => {
    const files = readdirSync("sounds").filter((name) => name.endsWith(".m4a")).sort();
    expect(files.map((name) => name.replace(".m4a", ""))).toEqual(Object.keys(TILE_SOUND_DATA).sort());
    const credits = readFileSync("CREDITS.md", "utf8");
    for (const name of files) {
      expect(credits, name).toContain(`sounds/${name}`);
      expect(readFileSync(`sounds/${name}`).toString("base64"), name).toBe(TILE_SOUND_DATA[name.replace(".m4a", "")]);
    }
  });

  it("have a recording for every kind of sound, and a licence line for the riichi designs", () => {
    const kinds = new Set(Object.keys(TILE_SOUND_DATA).map((name) => name.replace(/-\d+$/, "")));
    expect([...kinds].sort()).toEqual(["flip", "pair", "pick", "place", "shuffle", "win"]);
    const credits = readFileSync("CREDITS.md", "utf8");
    expect(credits).toContain("FluffyStuff/riichi-mahjong-tiles");
    expect(credits).toContain("CC0");
  });
});
