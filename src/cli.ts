import { SEED_MOST, bonusRuleOfSeed, freshAwaseSeed, generateAwase } from "./awase.ts";
import { checkAwase } from "./check.ts";
import { dailyAwase } from "./challenge.ts";
import { computerPair } from "./computer.ts";
import { ALL_LAYOUTS, layoutExtent, layoutFor } from "./layouts.ts";
import { decodeMoves } from "./moves.ts";
import { SUIT_WORDS, copiesOf, findFaces, readNotation, tileName, writeNotation, type TileLanguage } from "./names.ts";
import { AWASE_TABLE, encodeTable, playAtTable, readTable, startTable } from "./table.ts";
import type { AwaseTable } from "./table.types.ts";
import { faceOf } from "./tiles.ts";
import type { AwaseLevel, MahjongBonusRule, MahjongLayout } from "./types.ts";
import { CLI_STRINGS, LAYOUT_NAMES_JA } from "./cliWords.ts";
import { fillIn } from "./ui/strings.ts";
import { VERSION } from "./version.ts";

/**
 * The command line, as a pure function: arguments and surroundings in, what to print and the exit code out.
 * `bin/jarajara.mjs` is the few lines that hand it the real process. Nothing here touches a file, a terminal or the
 * network, so every line of it is tested as plain data. Every deal comes from its seed, so the same command prints the
 * same tiles on every machine.
 */

/** What the command line is run in. All of it is optional. */
export type CliSurroundings = {
  /** The environment, for the language (`LC_ALL`, `LC_MESSAGES`, `LANG`). */
  env?: Record<string, string | undefined>;
  /** Standard input, when `--stdin` asks for it: the moves for `check`. */
  stdin?: string;
  /** The system's language where the environment names none: what `Intl` says, on Windows. */
  locale?: string;
  /** Where a seed comes from when none is given: random numbers from 0 up to 1. `Math.random` unless given. */
  random?: () => number;
  /** The day for `daily` when `--date` is not given, as 2026-10-01. Today, in UTC, unless given. */
  today?: () => string;
};

/** What the command line came to. */
export type CliResult = {
  /** 0 when all went well, 1 when what was asked for could not be done, 2 when the command itself was wrong. */
  code: 0 | 1 | 2;
  /** For standard output. */
  out: string;
  /** For standard error. */
  err: string;
};

/** The language the command line speaks: `--lang`, or the environment's, or the system's; Japanese for `ja…`, English for anything else. */
export function cliLanguage(flag: string | undefined, env: Record<string, string | undefined> = {}, locale?: string): TileLanguage {
  const named = [flag, env.LC_ALL, env.LC_MESSAGES, env.LANG].find((value) => value !== undefined && value !== "" && value !== "C" && value !== "POSIX" && !value.startsWith("C."));
  return (named ?? locale ?? "en").toLowerCase().startsWith("ja") ? "ja" : "en";
}

const FLAGS_WITH_VALUES: Record<string, string> = { "-l": "layout", "--layout": "layout", "--level": "level", "-s": "seed", "--seed": "seed", "--rule": "rule", "-p": "players", "--players": "players", "--date": "date", "--givens": "givens", "--lang": "lang" };
const FLAGS: Record<string, string> = { "--stdin": "stdin", "-j": "json", "--json": "json", "-h": "help", "--help": "help", "-v": "version", "--version": "version" };
const LEVELS: readonly AwaseLevel[] = ["easy", "medium", "hard"];
const RULES: readonly MahjongBonusRule[] = ["group", "same"];

type Asked = { values: Record<string, string>; flags: Set<string>; words: string[]; wrong: { message: "unknownOption" | "needsValue"; part: string } | null };

/** The arguments sorted into options and words: the command, and what it is given. */
function sortArguments(args: readonly string[]): Asked {
  const asked: Asked = { values: {}, flags: new Set(), words: [], wrong: null };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] as string;
    const [name, inline] = arg.startsWith("--") && arg.includes("=") ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)] : [arg, undefined];
    if (name in FLAGS_WITH_VALUES) {
      const value = inline ?? args[++i];
      if (value === undefined) {
        asked.wrong ??= { message: "needsValue", part: name };
        break;
      }
      asked.values[FLAGS_WITH_VALUES[name] as string] = value;
    } else if (name in FLAGS && inline === undefined) asked.flags.add(FLAGS[name] as string);
    // The first wrong option is the one reported; the rest are still read, so that the report comes in the language asked for.
    else if (arg.startsWith("-") && arg !== "-") asked.wrong ??= { message: "unknownOption", part: arg };
    else asked.words.push(arg);
  }
  return asked;
}

const whole = (text: string | undefined, least: number, most: number): number | null => (text !== undefined && /^\d{1,10}$/.test(text) && Number(text) >= least && Number(text) <= most ? Number(text) : null);

/** A layout named by its width, its key, or its name in English or Japanese. */
function findLayout(text: string): MahjongLayout | null {
  const plain = text.trim().toLowerCase();
  if (/^\d+$/.test(plain)) return layoutFor(Number(plain));
  return ALL_LAYOUTS.find((layout) => layout.key === plain || LAYOUT_NAMES_JA[layout.key] === text.trim()) ?? null;
}

/** A layout's name in a language: its key capitalised, or its Japanese name. */
function layoutName(layout: MahjongLayout, language: TileLanguage): string {
  return language === "ja" ? (LAYOUT_NAMES_JA[layout.key] ?? layout.key) : layout.key.charAt(0).toUpperCase() + layout.key.slice(1);
}

/** Whether a text is a day that exists, written 2026-10-01. */
function isDay(text: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match === null) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === text;
}

/** A layout as text, one layer at a time: a tile's face letter where its top left corner is, two characters across and two lines down to a tile, so a tile set half a tile over sits half a tile over. */
function layerText(layout: MahjongLayout, cells: string, layer: number): string {
  const { width, height } = layoutExtent(layout);
  const grid = Array.from({ length: height }, () => new Array<string>(width).fill(" "));
  layout.slots.forEach((slot, at) => {
    if (slot.z === layer) grid[slot.y]![slot.x] = cells[at]!;
  });
  const lines = grid.map((row) => row.join("").trimEnd());
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

/** `a and b`, or `a, b and c`. */
function namesList(names: readonly string[], and: string): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")}${and}${names[names.length - 1]}`;
}

/** Run the command line. See `jarajara --help` for what it takes. */
export function runCli(args: readonly string[], around: CliSurroundings = {}): CliResult {
  const asked = sortArguments(args);
  const env = around.env ?? {};
  const lang = asked.values.lang;
  const language = cliLanguage(lang, env, around.locale);
  const t = CLI_STRINGS[language] as Record<string, string>;
  const wrong = (message: string): CliResult => ({ code: 2, out: "", err: `jarajara: ${message}\n${t.tryHelp}\n` });
  if (asked.wrong !== null) return wrong(fillIn(t[asked.wrong.message] as string, { part: asked.wrong.part }));
  if (lang !== undefined && lang !== "en" && lang !== "ja") return wrong(t.langBad as string);
  const [command, ...rest] = asked.words;
  if (asked.flags.has("help") || (command === undefined && !asked.flags.has("version"))) return { code: 0, out: t.usage as string, err: "" };
  if (asked.flags.has("version")) return { code: 0, out: `${VERSION}\n`, err: "" };
  const json = asked.flags.has("json");
  const print = (body: Record<string, unknown>) => `${JSON.stringify({ generator: `jarajara ${VERSION}`, ...body }, null, 2)}\n`;
  const words = (key: string, values: Record<string, string | number> = {}) => fillIn(t[key] as string, values);

  if (command === "layouts") {
    const bySize = [...ALL_LAYOUTS].sort((a, b) => a.size - b.size);
    if (json) return { code: 0, out: print({ layouts: bySize.map((layout) => ({ size: layout.size, key: layout.key, name: layoutName(layout, "en"), nameJa: layoutName(layout, "ja"), tiles: layout.slots.length, layers: layoutExtent(layout).layers })) }), err: "" };
    const wide = Math.max(...bySize.map((layout) => layout.key.length));
    const tiles = String(Math.max(...bySize.map((layout) => layout.slots.length))).length;
    return { code: 0, out: bySize.map((layout) => `${words("layoutRow", { size: String(layout.size).padStart(2), key: layout.key.padEnd(wide), name: layoutName(layout, language), tiles: String(layout.slots.length).padStart(tiles), layers: layoutExtent(layout).layers })}\n`).join(""), err: "" };
  }

  if (command === "tile") {
    const text = rest.join(" ").trim();
    if (text === "") return wrong(t.tileNeeds as string);
    const found = findFaces(text);
    // A name, a code or a hand written in notation; a word that is none of them is not read as a run of letters.
    const hand = text.split(/\s+/).map((word) => readNotation(word));
    const codes = found.length > 0 ? found.map((face) => face.code) : hand.every((word) => word !== null) ? hand.flat() as string[] : [];
    if (codes.length === 0) return { code: 1, out: "", err: `jarajara: ${t.tileNone}\n` };
    const tiles = codes.map((code) => {
      const face = faceOf(code)!;
      return { code, en: tileName(code, "en"), ja: tileName(code, "ja"), suit: face.suit, rank: face.rank, copies: copiesOf(code), notation: writeNotation([code]) };
    });
    if (json) return { code: 0, out: print({ tiles }), err: "" };
    return { code: 0, out: tiles.map((tile) => `${words("tileLine", { ...tile, suit: SUIT_WORDS[tile.suit][language] })}\n`).join(""), err: "" };
  }

  if (command === "daily") {
    const date = asked.values.date ?? around.today?.() ?? new Date().toISOString().slice(0, 10);
    if (!isDay(date)) return wrong(t.dateBad as string);
    const day = dailyAwase(date);
    const layout = layoutFor(day.size)!;
    if (json) return { code: 0, out: print({ ...day, layout: layout.key, tiles: layout.slots.length }), err: "" };
    return { code: 0, out: `${words("dailyLine", { date: day.date, name: layoutName(layout, language), level: day.level, seed: day.seed, challenge: day.challenge })}\n${words("dailyDeal", { size: day.size, level: day.level, seed: day.seed })}\n`, err: "" };
  }

  if (command !== "deal" && command !== "check" && command !== "play") return wrong(words("noCommand", { part: command ?? "" }));

  // The layout, the level, the rule and the seed, which every other command takes.
  const layout = asked.values.layout === undefined ? (layoutFor(15) as MahjongLayout) : findLayout(asked.values.layout);
  if (layout === null) return wrong(words("layoutBad", { part: asked.values.layout ?? "" }));
  const level = (asked.values.level ?? "medium") as AwaseLevel;
  if (!LEVELS.includes(level)) return wrong(t.levelBad as string);
  const ruleAsked = asked.values.rule as MahjongBonusRule | undefined;
  if (ruleAsked !== undefined && !RULES.includes(ruleAsked)) return wrong(t.ruleBad as string);

  if (command === "check") {
    const text = asked.flags.has("stdin") ? (around.stdin ?? "").trim() : rest[0];
    let givens = asked.values.givens;
    if (givens === undefined && asked.values.seed !== undefined) {
      const seed = whole(asked.values.seed, 1, SEED_MOST);
      if (seed === null) return wrong(t.seedBad as string);
      givens = generateAwase(layout.size, level, seed).givens;
    }
    if (givens === undefined || text === undefined || text === "") return wrong(t.checkNeeds as string);
    const checked = checkAwase(layout.size, givens, text);
    const moves = checked.ok ? (decodeMoves(text, givens.length) ?? []) : [];
    const pairs = moves.filter((move) => "pair" in move).length;
    const shuffles = moves.length - pairs;
    const reasons: Record<string, string> = { "the givens are not a deal of that layout": "checkNotDeal", "the answer is not a list of moves": "checkNotMoves", "a move the rules do not allow": "checkNotAllowed", "tiles are left on the layout": "checkLeft" };
    if (json) return { code: checked.ok ? 0 : 1, out: print({ ...checked, layout: layout.key, size: layout.size, ...(checked.ok ? { pairs, shuffles } : {}) }), err: "" };
    if (checked.ok) return { code: 0, out: `${words("checkCleared", { pairs, shuffles })}\n`, err: "" };
    return { code: 1, out: "", err: `${words("checkNot", { reason: t[reasons[checked.reason] ?? "checkNotAllowed"] as string })}\n` };
  }

  // The seed: named, or drawn and said.
  let err = "";
  let seed: number;
  if (asked.values.seed !== undefined) {
    const read = whole(asked.values.seed, 1, SEED_MOST);
    if (read === null) return wrong(t.seedBad as string);
    seed = read;
    if (ruleAsked !== undefined && bonusRuleOfSeed(seed) !== ruleAsked) return wrong(words("seedRuleClash", { seed, seedRule: bonusRuleOfSeed(seed), rule: ruleAsked }));
  } else {
    seed = freshAwaseSeed(ruleAsked ?? "group", around.random ?? Math.random);
    if (!json) err = `jarajara: ${words("freshSeed", { seed })}\n`;
  }
  const rule = bonusRuleOfSeed(seed);
  const deal = generateAwase(layout.size, level, seed);

  if (command === "deal") {
    const layers = layoutExtent(layout).layers;
    if (json) return { code: 0, out: print({ layout: layout.key, size: layout.size, level, seed, rule, tiles: layout.slots.length, givens: deal.givens, solution: deal.solution, layers: Array.from({ length: layers }, (_, z) => layerText(layout, deal.givens, z).split("\n")) }), err };
    const head = words("dealHead", { name: layoutName(layout, language), tiles: layout.slots.length, level, seed, rule: t[`rule_${rule}`] as string });
    const body = Array.from({ length: layers }, (_, z) => `${words("layerHead", { n: z + 1 })}\n${layerText(layout, deal.givens, z)}\n`).join("\n");
    return { code: 0, out: `${head}\n\n${body}\n${words("dealTiles", { givens: deal.givens })}\n${words("dealAnswer", { answer: deal.solution })}\n`, err };
  }

  // A table of computers, played to the end.
  const count = asked.values.players === undefined ? 2 : whole(asked.values.players, AWASE_TABLE.least, AWASE_TABLE.most);
  if (count === null) return wrong(words("playersBad", { least: AWASE_TABLE.least, most: AWASE_TABLE.most }));
  let table: AwaseTable = startTable(deal, Array.from({ length: count }, () => ({ name: "", computer: true as const })));
  let state = readTable(table)!;
  while (!state.over) {
    const pair = computerPair(table, state);
    if (pair === null) break;
    const next = playAtTable(table, pair[0], pair[1], state);
    if (next === null) break;
    table = next.table;
    state = next.state;
  }
  const names = Array.from({ length: count }, (_, seat) => words("seatName", { n: seat + 1 }));
  const winners = state.winners.map((seat) => names[seat] as string);
  if (json) return { code: 0, out: print({ layout: layout.key, size: layout.size, level, seed, rule, players: names, scores: state.scores, pairs: state.pairs, shuffles: state.shuffles, over: state.over, winners: state.winners, table: encodeTable(table) }), err };
  const lines = [words("played", { n: count, name: layoutName(layout, language), level, seed, pairs: state.taken.length, shuffles: state.shuffles }), ...names.map((name, seat) => words("seatLine", { name, points: state.scores[seat] as number, pairs: state.pairs[seat] as number })), words(winners.length > 1 ? "winners" : "winner", { names: namesList(winners, t.and as string) })];
  return { code: 0, out: `${lines.join("\n")}\n`, err };
}
