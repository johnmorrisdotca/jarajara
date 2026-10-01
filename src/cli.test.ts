import { describe, expect, it } from "vitest";

import { AWASE_SAME_BLOCK, bonusRuleOfSeed, generateAwase } from "./awase.ts";
import { dailyAwase } from "./challenge.ts";
import { CLI_STRINGS, LAYOUT_NAMES_JA } from "./cliWords.ts";
import { cliLanguage, runCli } from "./cli.ts";
import { ALL_LAYOUTS } from "./layouts.ts";
import { decodeTable, readTable } from "./table.ts";
import { VERSION } from "./version.ts";

const run = (...args: string[]) => runCli(args, { env: {} });
const parse = (...args: string[]) => JSON.parse(run(...args, "--json").out);

describe("the command line's words", () => {
  it("are said in both languages, with the same names and the same blanks to fill", () => {
    expect(Object.keys(CLI_STRINGS.ja).sort()).toEqual(Object.keys(CLI_STRINGS.en).sort());
    const blanks = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    for (const key of Object.keys(CLI_STRINGS.en)) {
      // The usage is prose, and the English layout row leaves out the name, which is the key capitalised.
      if (key === "usage" || key === "layoutRow") continue;
      expect(blanks(CLI_STRINGS.ja[key]!), key).toEqual(blanks(CLI_STRINGS.en[key]!));
    }
  });

  it("name every layout in Japanese, and no layout that is not there", () => {
    expect(Object.keys(LAYOUT_NAMES_JA).sort()).toEqual(ALL_LAYOUTS.map((layout) => layout.key).sort());
  });

  it("choose a language from the flag, then the environment, then the system", () => {
    expect(cliLanguage("ja")).toBe("ja");
    expect(cliLanguage(undefined, { LANG: "ja_JP.UTF-8" })).toBe("ja");
    expect(cliLanguage(undefined, { LANG: "C.UTF-8" }, "ja-JP")).toBe("ja");
    expect(cliLanguage(undefined, {}, "fr-CA")).toBe("en");
    expect(cliLanguage("en", { LANG: "ja_JP" })).toBe("en");
  });
});

describe("the command line", () => {
  it("prints its usage with no command or --help, and its version with --version", () => {
    expect(run()).toEqual({ code: 0, out: CLI_STRINGS.en.usage, err: "" });
    expect(run("--help").out).toContain("Usage: jarajara");
    expect(run("--version")).toEqual({ code: 0, out: `${VERSION}\n`, err: "" });
    expect(run("--lang", "ja", "-h").out).toContain("使い方");
  });

  it("names every command and option the usage lists", () => {
    for (const command of ["layouts", "deal", "daily", "check", "play", "tile"]) expect(CLI_STRINGS.en.usage).toContain(`  ${command} `);
    for (const option of ["--layout", "--level", "--seed", "--rule", "--players", "--date", "--givens", "--stdin", "--json", "--lang", "--help", "--version"]) expect(CLI_STRINGS.en.usage).toContain(option);
  });

  it("says a wrong command, option or value with exit code 2 and where to look", () => {
    for (const args of [["nothing"], ["layouts", "--nope"], ["deal", "--seed"], ["deal", "--seed", "0"], ["deal", "--seed", "2147483648"], ["deal", "--layout", "99"], ["deal", "--level", "hard-ish"], ["deal", "--rule", "other"], ["play", "--players", "5"], ["daily", "--date", "2026-02-30"], ["deal", "--lang", "fr"], ["tile"]]) {
      const result = run(...args);
      expect(result.code, args.join(" ")).toBe(2);
      expect(result.out).toBe("");
      expect(result.err).toMatch(/^jarajara: .+\n.*--help.*\n$/);
    }
    expect(run("--lang", "ja", "nothing").err).toContain("コマンドはありません");
  });

  it("lists every layout by width, with its tiles and layers", () => {
    const layouts = parse("layouts").layouts;
    expect(layouts.map((layout: { key: string }) => layout.key).sort()).toEqual(ALL_LAYOUTS.map((layout) => layout.key).sort());
    expect(layouts.map((layout: { size: number }) => layout.size)).toEqual([...layouts.map((layout: { size: number }) => layout.size)].sort((a: number, b: number) => a - b));
    const turtle = layouts.find((layout: { key: string }) => layout.key === "turtle");
    expect(turtle).toMatchObject({ size: 15, name: "Turtle", nameJa: "亀", tiles: 144, layers: 5 });
    expect(run("layouts").out.trim().split("\n")).toHaveLength(ALL_LAYOUTS.length);
    expect(run("layouts", "--lang", "ja").out).toContain("亀");
  });

  it("makes the deal the package makes, layer by layer, and says its answer", () => {
    const deal = generateAwase(15, "medium", 12345);
    const out = parse("deal", "--seed", "12345");
    expect(out).toMatchObject({ layout: "turtle", size: 15, level: "medium", seed: 12345, rule: "group", tiles: 144, givens: deal.givens, solution: deal.solution });
    expect(out.layers).toHaveLength(5);
    // Every tile is on the page exactly once.
    const letters = out.layers.flat().join("").replace(/ /g, "");
    expect([...letters].sort()).toEqual([...deal.givens].sort());
    const text = run("deal", "--seed", "12345").out;
    expect(text).toContain("Turtle, 144 tiles, medium, seed 12345, usual rule");
    expect(text).toContain(`Tiles: ${deal.givens}`);
    expect(text).toContain(`One way to clear it: ${deal.solution}`);
    expect(text).toContain("Layer 5");
    expect(run("deal", "--seed", "12345").out).toBe(text);
  });

  it("takes a layout by width, key or Japanese name, and a level", () => {
    const small = generateAwase(8, "hard", 3);
    for (const layout of ["8", "torii", "Torii", "鳥居"]) expect(parse("deal", "-l", layout, "--level", "hard", "-s", "3").givens).toBe(small.givens);
  });

  it("draws a seed when none is given, says so on standard error, and keeps to the rule asked for", () => {
    const fresh = runCli(["deal", "--layout", "4"], { random: () => 0.5 });
    expect(fresh.err).toMatch(/^jarajara: no seed given; drew \d+\.\n$/);
    const same = runCli(["deal", "--layout", "4", "--rule", "same", "--json"], { random: () => 0.25 });
    const body = JSON.parse(same.out);
    expect(same.err).toBe("");
    expect(body.rule).toBe("same");
    expect(body.seed).toBeGreaterThanOrEqual(AWASE_SAME_BLOCK.from);
    expect(bonusRuleOfSeed(body.seed)).toBe("same");
    expect(run("deal", "--seed", "5", "--rule", "same").code).toBe(2);
  });

  it("gives the day's game as the package works it out, and the deal command that plays it", () => {
    const day = dailyAwase("2026-10-01");
    const out = parse("daily", "--date", "2026-10-01");
    expect(out).toMatchObject({ date: "2026-10-01", size: day.size, level: day.level, seed: day.seed, challenge: day.challenge });
    const text = run("daily", "--date", "2026-10-01").out;
    expect(text).toContain(`jarajara deal --layout ${day.size} --level ${day.level} --seed ${day.seed}`);
    expect(runCli(["daily"], { today: () => "2026-10-01" }).out).toBe(text);
    expect(run("daily").out).toMatch(/^\d{4}-\d{2}-\d{2}: /);
  });

  it("checks a solve: the deal's own answer clears it, and anything else says why it does not", () => {
    const deal = generateAwase(9, "easy", 41);
    const cleared = run("check", deal.solution, "-l", "9", "--level", "easy", "-s", "41");
    expect(cleared.code).toBe(0);
    expect(cleared.out).toMatch(/^Cleared: 50 pairs and \d+ shuffles take every tile\.\n$/);
    const byGivens = parse("check", deal.solution, "-l", "9", "--givens", deal.givens);
    expect(byGivens).toMatchObject({ ok: true, pairs: 50, layout: "fuji" });
    const half = run("check", deal.solution.slice(0, 40), "-l", "9", "--level", "easy", "-s", "41");
    expect(half).toEqual({ code: 1, out: "", err: "Not cleared: tiles are left on the layout.\n" });
    expect(run("check", "0001", "-l", "9", "--givens", deal.givens).err).toContain("a move the rules do not allow");
    expect(run("check", "0a?", "-l", "9", "--givens", deal.givens).err).toContain("not a list of moves");
    expect(run("check", "0000", "-l", "9", "--givens", "abc").err).toContain("not a deal of that layout");
    expect(parse("check", "0000", "-l", "9", "--givens", deal.givens)).toMatchObject({ ok: false });
    expect(run("check", deal.solution, "-l", "9").code).toBe(2);
    expect(run("check", "-l", "9", "-s", "41").code).toBe(2);
    expect(runCli(["check", "--stdin", "-l", "9", "--level", "easy", "-s", "41"], { stdin: `${deal.solution}\n` }).code).toBe(0);
    expect(runCli(["check", "--stdin", "-l", "9", "-s", "41"], { stdin: "" }).code).toBe(2);
  });

  it("looks a tile up by name, code or notation, and a hand tile by tile", () => {
    expect(parse("tile", "three", "circles").tiles).toEqual([{ code: "l", en: "3 of circles", ja: "三筒", suit: "circles", rank: 3, copies: 4, notation: "3p" }]);
    expect(parse("tile", "東").tiles[0].code).toBe("B");
    expect(parse("tile", "plum").tiles[0]).toMatchObject({ copies: 1, notation: "1f" });
    expect(parse("tile", "winds").tiles).toHaveLength(4);
    expect(parse("tile", "12m3p").tiles.map((tile: { code: string }) => tile.code)).toEqual(["a", "b", "l"]);
    expect(run("tile", "east").out).toBe("B  east wind  東  Winds 1, 4 in the set, written 1z\n");
    expect(run("tile", "east", "--lang", "ja").out).toContain("セットに4枚");
    expect(run("tile", "no", "such", "tile")).toEqual({ code: 1, out: "", err: "jarajara: no tile is called that.\n" });
  });

  it("plays computers at a table to the end, and writes the game so a page can replay it", () => {
    const out = parse("play", "--players", "3", "--layout", "8", "--seed", "5");
    expect(out).toMatchObject({ layout: "torii", size: 8, seed: 5, over: true });
    expect(out.players).toEqual(["Computer 1", "Computer 2", "Computer 3"]);
    expect(out.scores).toHaveLength(3);
    expect(out.pairs.reduce((a: number, b: number) => a + b, 0)).toBe(32);
    const table = decodeTable(out.table)!;
    const state = readTable(table)!;
    expect(state.over).toBe(true);
    expect(state.scores).toEqual(out.scores);
    expect(out.winners).toEqual(state.winners);
    const text = run("play", "--players", "3", "--layout", "8", "--seed", "5").out;
    expect(text).toContain("Awase at a table of 3: Torii, medium, seed 5. 32 pairs taken");
    expect(text).toMatch(/Computer 1: \d+ points, \d+ pairs\n/);
    expect(text).toMatch(/(Winner|Tied): Computer \d/);
    expect(run("play", "--players", "2", "--layout", "8", "--seed", "5", "--lang", "ja").out).toContain("コンピュータ1");
    expect(run("play", "-l", "8", "-s", "5").out).toContain("table of 2");
  });
});
