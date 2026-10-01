import { canTake, freePairs, geometryOf, isCleared, tilesLeft } from "./board.ts";
import { hashText, shuffleTiles } from "./deal.ts";
import { ALL_LAYOUTS, layoutFor } from "./layouts.ts";
import { AWASE_SAME_BLOCK } from "./awase.ts";
import { EMPTY_SLOT, bonusRuleOf, faceOf, MAHJONG_FACES } from "./tiles.ts";
import type { AwaseLevel, MahjongBonusRule, MahjongCells, MahjongMove } from "./types.ts";

/**
 * AWASE WITH RULES YOU CHOOSE: options a game may be given (hints, shuffles and undo given, limited or taken away) and
 * the challenges worth playing a deal for. The ideas come from the challenge modes of good mahjong solitaires (see
 * docs/credits.md); the code and the numbers are Jarajara's own. None of it touches a deal: a challenge is played on
 * exactly the tiles `generateAwase` made, so every deal here can still be cleared, and `checkAwase` still judges a
 * solve by the tiles alone.
 *
 * A game is an `AwaseRun`: plain data, changed only by returning a new one. It has no clock of its own: every move
 * is given `at`, milliseconds on any clock the caller keeps (only the differences matter), so a run is as testable as
 * any other rule here and a server may replay one.
 *
 * The challenges, each the same deal played for something else:
 *   gold       take a pair of the gold face, four tiles ringed in gold: hunt it down, the stacks permitting
 *   spark      clear the layout before time runs out; a pair of the spark face adds time and sends the spark on
 *   rush       make the goal number of pairs before time runs out; the layout need not be cleared
 *   fortune    reach the goal score before time runs out; fast pairs in a row build a multiplier
 *   sand       clear the layout from a little time, every pair adding some, to a limit
 *   purge      take every tile of the marked group before time runs out
 *   blackout   clear the layout with only the free tiles showing their faces; no undo
 */
export const AWASE_CHALLENGES = ["gold", "spark", "rush", "fortune", "sand", "purge", "blackout"] as const;

/** A challenge's name. */
export type AwaseChallenge = (typeof AWASE_CHALLENGES)[number];

/** Whether a text names a challenge. */
export function isAwaseChallenge(text: unknown): text is AwaseChallenge {
  return typeof text === "string" && (AWASE_CHALLENGES as readonly string[]).includes(text);
}

/** What the options of a game say. Every field may be left out. */
export type AwaseOptions = {
  /** A challenge to play the deal as. Unless said, plain Awase. */
  challenge?: AwaseChallenge | null;
  /** How many hints the game may use: a number, or `null` for as many as it likes (unless said). */
  hints?: number | null;
  /** How many shuffles: a number, or `null` for as many as it likes (unless said). */
  shuffles?: number | null;
  /** Whether a move may be taken back. Unless said, it may, unless the challenge forbids it. */
  undo?: boolean;
};

/** What a game is played by, worked out from its options and its challenge. */
export type AwaseRules = {
  challenge: AwaseChallenge | null;
  hints: number | null;
  shuffles: number | null;
  undo: boolean;
  /** The time a game starts with, in milliseconds; null for no clock. */
  timeMs: number | null;
  /** The most time a game may be holding: pairs add to a clock only up to this. Null for no limit. */
  reserveMs: number | null;
  /** Time added by every pair, by a pair of the spark face, and for each step of a combo. */
  pairBonusMs: number;
  sparkBonusMs: number;
  comboBonusMs: number;
  /** Pairs to make, or points to reach, to win without clearing the layout; null where the layout must be cleared (or the gold pair taken, or the group purged). */
  goalPairs: number | null;
  goalScore: number | null;
  /** Only the free tiles show their faces: a page draws the blocked ones blank (`hideBlocked`). */
  hideBlocked: boolean;
};

/** The numbers every challenge is made from. */
export const AWASE_CHALLENGE_NUMBERS = {
  sparkMsPerTile: 2500,
  sparkBonusMs: 20_000,
  rushMs: 180_000,
  rushPairs: 30,
  fortuneMsPerTile: 1700,
  fortunePointsPerPair: 150,
  sandStartMs: 45_000,
  sandPairMs: 5000,
  sandComboMs: 1000,
  sandReserveMs: 60_000,
  purgeMsPerTile: 2200,
  purgeMsPerTarget: 4000,
  pairPoints: 100,
  layerPoints: 15,
  comboWindowMs: 5000,
  combo: [1, 1.25, 1.5, 2, 3],
  sparkPoints: 250,
  goldPointsPerTile: 20,
} as const;

/** The groups a purge may name, each a set of tiles a layout is likely to hold plenty of. */
export const PURGE_GROUPS = [
  { key: "characters", suits: ["characters"] },
  { key: "circles", suits: ["circles"] },
  { key: "bamboo", suits: ["bamboo"] },
  { key: "honours", suits: ["winds", "dragons"] },
] as const;

/**
 * The rules a game is played by. A challenge sets its own; the options given are laid over what it allows, and where a
 * challenge takes something away (undo in the spark and blackout) it stays taken away. `tiles` is how many tiles the
 * layout holds, which the clocks and goals are scaled by.
 */
export function awaseRules(tiles: number, options: AwaseOptions = {}): AwaseRules {
  const challenge = options.challenge ?? null;
  const n = AWASE_CHALLENGE_NUMBERS;
  const rules: AwaseRules = {
    challenge,
    hints: options.hints === undefined ? null : options.hints,
    shuffles: options.shuffles === undefined ? null : options.shuffles,
    undo: options.undo ?? true,
    timeMs: null,
    reserveMs: null,
    pairBonusMs: 0,
    sparkBonusMs: 0,
    comboBonusMs: 0,
    goalPairs: null,
    goalScore: null,
    hideBlocked: false,
  };
  switch (challenge) {
    case "spark":
      return { ...rules, undo: false, timeMs: n.sparkMsPerTile * tiles, sparkBonusMs: n.sparkBonusMs };
    case "rush":
      return { ...rules, timeMs: n.rushMs, goalPairs: Math.min(n.rushPairs, Math.max(2, Math.round(tiles / 2 * 0.42))) };
    case "fortune":
      return { ...rules, timeMs: n.fortuneMsPerTile * tiles, goalScore: Math.round(((tiles / 2) * n.fortunePointsPerPair) / 100) * 100 };
    case "sand":
      return { ...rules, timeMs: n.sandStartMs, reserveMs: n.sandReserveMs, pairBonusMs: n.sandPairMs, comboBonusMs: n.sandComboMs };
    case "purge":
      // The clock is worked out from the group when the run starts: it depends on how many tiles the group has.
      return { ...rules, timeMs: 0 };
    case "blackout":
      return { ...rules, undo: false, hideBlocked: true };
    default:
      return rules;
  }
}

/** Where a game stood before a move, so it can be taken back. */
type Snapshot = { cells: MahjongCells; shuffles: number; pairs: number; score: number; combo: number; lastPairAt: number | null; bank: number | null; bankAt: number | null; spark: string | null; moves: number };

/** A game of Awase, and what the challenge it is played as asks of it. */
export type AwaseRun = {
  readonly size: number;
  readonly seed: number;
  readonly givens: string;
  readonly rules: AwaseRules;
  /** Every move so far, in order: pairs by their slots, and shuffles. */
  readonly moves: readonly MahjongMove[];
  readonly cells: MahjongCells;
  readonly shuffles: number;
  readonly hintsUsed: number;
  /** Pairs taken, points scored, and how many pairs in a row were quick enough to build a combo. */
  readonly pairs: number;
  readonly score: number;
  readonly combo: number;
  readonly lastPairAt: number | null;
  /** The time held and when it was last counted: null before the clock starts, and for a game with no clock. */
  readonly bank: number | null;
  readonly bankAt: number | null;
  /** The gold face; the group a purge names; the spark face now. */
  readonly gold: string | null;
  readonly purge: (typeof PURGE_GROUPS)[number]["key"] | null;
  readonly spark: string | null;
  readonly history: readonly Snapshot[];
  /** Won or lost, once it is; and why: `cleared`, `goal`, `gold`, `purged`, `time` or `stuck`. */
  readonly over: "won" | "lost" | null;
  readonly because: "cleared" | "goal" | "gold" | "purged" | "time" | "stuck" | null;
};

/** The faces on a layout that have a whole four of them, sorted in the set's order: what a gold tile or a spark may be. */
function fullFaces(cells: MahjongCells): string[] {
  const counts = new Map<string, number>();
  for (const code of cells) if (code !== EMPTY_SLOT) counts.set(code, (counts.get(code) ?? 0) + 1);
  return MAHJONG_FACES.map((face) => face.code).filter((code) => (counts.get(code) ?? 0) >= 2);
}

/** Whether a tile is in a purge's group. */
function inGroup(code: string, group: (typeof PURGE_GROUPS)[number]["key"]): boolean {
  const suit = faceOf(code)?.suit;
  const found = PURGE_GROUPS.find((one) => one.key === group);
  return suit !== undefined && found !== undefined && (found.suits as readonly string[]).includes(suit);
}

/** How many tiles of the group are on the layout. */
function inPurge(cells: MahjongCells, group: (typeof PURGE_GROUPS)[number]["key"]): number {
  return [...cells].filter((code) => code !== EMPTY_SLOT && inGroup(code, group)).length;
}

/** A pick among a list, the same for the same seed and the same words. */
function pickBy<T>(list: readonly T[], seed: number, words: string): T | null {
  return list.length === 0 ? null : list[hashText(`${words}:${seed}`) % list.length]!;
}

/**
 * Start a game of a deal. The gold face, the spark and the purge's group are chosen from the seed, so the same deal is
 * the same game; `at` starts the clock now, or leave it out and the clock starts with the first move (`startRun`'s
 * `runStart`).
 */
export function startRun(deal: { size: number; seed: number; givens: string }, options: AwaseOptions = {}, at: number | null = null): AwaseRun {
  const layout = layoutFor(deal.size);
  if (layout === null) throw new Error(`no Mahjong layout ${deal.size} across`);
  const rules = awaseRules(deal.givens.length, options);
  const faces = fullFaces(deal.givens);
  const group = rules.challenge === "purge" ? pickBy(PURGE_GROUPS.filter((one) => inPurge(deal.givens, one.key) >= 8), deal.seed, "purge")?.key ?? "characters" : null;
  const targets = group === null ? 0 : inPurge(deal.givens, group);
  const timed = rules.challenge === "purge" ? { ...rules, timeMs: AWASE_CHALLENGE_NUMBERS.purgeMsPerTile * deal.givens.length + AWASE_CHALLENGE_NUMBERS.purgeMsPerTarget * targets } : rules;
  const gold = rules.challenge === "gold" ? pickBy(faces.filter((code) => [...deal.givens].filter((one) => one === code).length >= 2), deal.seed, "gold") : null;
  const spark = rules.challenge === "spark" ? pickBy(faces, deal.seed, "spark") : null;
  const run: AwaseRun = {
    size: deal.size,
    seed: deal.seed,
    givens: deal.givens,
    rules: timed,
    moves: [],
    cells: deal.givens,
    shuffles: 0,
    hintsUsed: 0,
    pairs: 0,
    score: 0,
    combo: 0,
    lastPairAt: null,
    bank: timed.timeMs,
    bankAt: at,
    gold,
    purge: group,
    spark,
    history: [],
    over: null,
    because: null,
  };
  return at === null || timed.timeMs === null ? { ...run, bankAt: null } : run;
}

/** Start the clock, if the game has one and it has not started. */
export function runStart(run: AwaseRun, at: number): AwaseRun {
  return run.bankAt === null && run.rules.timeMs !== null && run.over === null ? { ...run, bankAt: at } : run;
}

/** How much time the game has left at `at`, in milliseconds; null for a game with no clock. */
export function runRemaining(run: AwaseRun, at: number): number | null {
  if (run.bank === null) return null;
  if (run.bankAt === null || run.over !== null) return Math.max(0, run.bank);
  return Math.max(0, run.bank - Math.max(0, at - run.bankAt));
}

/**
 * The game as it stands at `at`: lost, if its time has run out. Nothing else changes with the clock, so a page may call
 * this as often as it likes.
 */
export function runTick(run: AwaseRun, at: number): AwaseRun {
  if (run.over !== null || run.bank === null || run.bankAt === null) return run;
  return runRemaining(run, at) === 0 ? { ...run, bank: 0, over: "lost", because: "time" } : run;
}

function geometryOfRun(run: AwaseRun) {
  return geometryOf(layoutFor(run.size)!);
}

function ruleOfRun(run: AwaseRun): MahjongBonusRule {
  return bonusRuleOf(run.givens);
}

/** Every pair that may be taken now: none once the game is over. */
export function runPairs(run: AwaseRun): [number, number][] {
  return run.over === null ? freePairs(geometryOfRun(run), run.cells, ruleOfRun(run)) : [];
}

/** The tiles of the group the game is hunting for, as slots: the gold face, the purge's group, or nothing. */
export function runMarked(run: AwaseRun): number[] {
  const marked: number[] = [];
  [...run.cells].forEach((code, at) => {
    if (code === EMPTY_SLOT) return;
    if (run.gold !== null && code === run.gold) marked.push(at);
    else if (run.purge !== null && inGroup(code, run.purge)) marked.push(at);
    else if (run.spark !== null && code === run.spark) marked.push(at);
  });
  return marked;
}

function snapshot(run: AwaseRun): Snapshot {
  return { cells: run.cells, shuffles: run.shuffles, pairs: run.pairs, score: run.score, combo: run.combo, lastPairAt: run.lastPairAt, bank: run.bank, bankAt: run.bankAt, spark: run.spark, moves: run.moves.length };
}

/** The game's verdict on itself: won, lost because nothing can be done, or still going. */
function judge(run: AwaseRun): AwaseRun {
  if (run.over !== null) return run;
  const rules = run.rules;
  if (isCleared(run.cells)) return { ...run, over: "won", because: "cleared" };
  if (rules.goalPairs !== null && run.pairs >= rules.goalPairs) return { ...run, over: "won", because: "goal" };
  if (rules.goalScore !== null && run.score >= rules.goalScore) return { ...run, over: "won", because: "goal" };
  if (run.purge !== null && inPurge(run.cells, run.purge) === 0) return { ...run, over: "won", because: "purged" };
  const geometry = geometryOfRun(run);
  const rule = ruleOfRun(run);
  if (freePairs(geometry, run.cells, rule).length > 0) return run;
  // Nothing can be taken: a shuffle may help, if one is left and could.
  const left = rules.shuffles === null ? Infinity : rules.shuffles - run.shuffles;
  if (left > 0 && shuffleTiles(geometry, run.cells, rule, run.shuffles) !== null) return run;
  return { ...run, over: "lost", because: "stuck" };
}

/** The sparkstone's next face, after the pair of this one was taken: the next in the set's order that still has a pair. */
function nextSpark(cells: MahjongCells, after: string): string | null {
  const faces = fullFaces(cells);
  if (faces.length === 0) return null;
  const order = MAHJONG_FACES.map((face) => face.code);
  const from = order.indexOf(after);
  return faces.find((code) => order.indexOf(code) > from) ?? faces[0]!;
}

/**
 * Take a pair at `at`: the new game, or null where the rules do not allow it (the game is over, or the two are not a
 * pair that may be taken). A pair taken after the time ran out loses the game instead. Scores the pair with its combo,
 * adds the time the challenge gives, moves the spark on, and judges whether the game is won or lost.
 */
export function runTake(run: AwaseRun, a: number, b: number, at: number): AwaseRun | null {
  const started = runStart(run, at);
  const timed = runTick(started, at);
  if (timed.over !== null) return timed.over === "lost" && timed !== started ? timed : null;
  if (!canTake(geometryOfRun(timed), timed.cells, ruleOfRun(timed), a, b)) return null;
  const n = AWASE_CHALLENGE_NUMBERS;
  const layout = layoutFor(timed.size)!;
  const code = timed.cells[a]!;
  const quick = timed.lastPairAt !== null && at - timed.lastPairAt <= n.comboWindowMs;
  const combo = quick ? Math.min(timed.combo + 1, n.combo.length - 1) : 0;
  const high = Math.max(layout.slots[a]!.z, layout.slots[b]!.z);
  const sparked = timed.spark !== null && code === timed.spark;
  let score = timed.score + Math.round((n.pairPoints + n.layerPoints * high) * n.combo[combo]!) + (sparked ? n.sparkPoints : 0);
  const cells = [...timed.cells].map((one, slot) => (slot === a || slot === b ? EMPTY_SLOT : one)).join("");
  // Time: what is left, plus what this pair earns, up to the reserve.
  let bank = timed.bank === null ? null : (runRemaining(timed, at) as number);
  const earned = timed.rules.pairBonusMs + (sparked ? timed.rules.sparkBonusMs : 0) + timed.rules.comboBonusMs * combo;
  if (bank !== null) bank = Math.min(timed.rules.reserveMs ?? Infinity, bank + earned);
  if (timed.gold !== null && code === timed.gold) score += tilesLeft(cells) * n.goldPointsPerTile;
  const next: AwaseRun = {
    ...timed,
    cells,
    moves: [...timed.moves, { pair: [a, b] as const }],
    pairs: timed.pairs + 1,
    score,
    combo,
    lastPairAt: at,
    bank,
    bankAt: bank === null ? null : at,
    spark: sparked ? nextSpark(cells, code) : timed.spark,
    history: [...timed.history, snapshot(timed)],
  };
  const gold = next.gold !== null && code === next.gold ? { ...next, over: "won" as const, because: "gold" as const } : next;
  return judge(gold);
}

/** Shuffle what is left, which is for when no pair can be taken: the new game, or null where it may not be (a pair can still be taken, none is left to use, or no shuffle would help). */
export function runShuffle(run: AwaseRun, at: number): AwaseRun | null {
  const timed = runTick(runStart(run, at), at);
  if (timed.over !== null) return timed.over === "lost" && timed.because === "time" ? timed : null;
  const geometry = geometryOfRun(timed);
  const rule = ruleOfRun(timed);
  if (freePairs(geometry, timed.cells, rule).length > 0) return null;
  if (timed.rules.shuffles !== null && timed.shuffles >= timed.rules.shuffles) return null;
  const cells = shuffleTiles(geometry, timed.cells, rule, timed.shuffles);
  if (cells === null) return null;
  return judge({
    ...timed,
    cells,
    shuffles: timed.shuffles + 1,
    moves: [...timed.moves, { shuffle: true as const }],
    bank: timed.bank === null ? null : runRemaining(timed, at),
    bankAt: timed.bank === null ? null : at,
    history: [...timed.history, snapshot(timed)],
  });
}

/** Take the last move back, where the rules allow undo: the new game, or null. The clock is not given back, and score is. */
export function runUndo(run: AwaseRun, at: number): AwaseRun | null {
  if (!run.rules.undo || run.history.length === 0) return null;
  const before = run.history[run.history.length - 1]!;
  const timed = runTick(run, at);
  const bank = timed.bank === null ? null : runRemaining(timed, at);
  return {
    ...run,
    cells: before.cells,
    shuffles: before.shuffles,
    pairs: before.pairs,
    score: before.score,
    combo: before.combo,
    lastPairAt: before.lastPairAt,
    spark: before.spark,
    moves: run.moves.slice(0, before.moves),
    bank,
    bankAt: bank === null || timed.over !== null ? null : at,
    history: run.history.slice(0, -1),
    over: timed.over === "lost" && timed.because === "time" ? "lost" : null,
    because: timed.over === "lost" && timed.because === "time" ? "time" : null,
  };
}

/** Ask for a hint: the new game with it counted and the pair named, or null where none is left to use or no pair can be taken. */
export function runHint(run: AwaseRun): { run: AwaseRun; pair: [number, number] } | null {
  if (run.over !== null || (run.rules.hints !== null && run.hintsUsed >= run.rules.hints)) return null;
  const layout = layoutFor(run.size)!;
  let best: [number, number] | null = null;
  let height = -1;
  for (const pair of runPairs(run)) {
    const up = layout.slots[pair[0]]!.z + layout.slots[pair[1]]!.z;
    if (up > height) {
      best = pair;
      height = up;
    }
  }
  return best === null ? null : { run: { ...run, hintsUsed: run.hintsUsed + 1 }, pair: best };
}

/** The game as it stands, for a page to read: how the clock, the goal and the hunt are going, without working them out again. */
export type AwaseRunReading = {
  state: "run" | "won" | "lost";
  because: AwaseRun["because"];
  tilesLeft: number;
  pairsFree: number;
  remainingMs: number | null;
  /** Progress towards what the challenge asks: pairs of the goal, points of the goal, or tiles of the group left. */
  goal: { kind: "pairs" | "score" | "purge" | "gold" | "spark" | "clear"; done: number; of: number } | null;
  multiplier: number;
};

/** Read a game at `at`. */
export function readRun(run: AwaseRun, at: number): AwaseRunReading {
  const timed = runTick(run, at);
  const rules = timed.rules;
  const targets = timed.purge === null ? 0 : inPurge(timed.givens, timed.purge);
  const goal: AwaseRunReading["goal"] =
    rules.goalPairs !== null
      ? { kind: "pairs", done: timed.pairs, of: rules.goalPairs }
      : rules.goalScore !== null
        ? { kind: "score", done: timed.score, of: rules.goalScore }
        : timed.purge !== null
          ? { kind: "purge", done: targets - inPurge(timed.cells, timed.purge), of: targets }
          : timed.gold !== null
            ? { kind: "gold", done: timed.over === "won" ? 1 : 0, of: 1 }
            : null;
  return {
    state: timed.over ?? "run",
    because: timed.because,
    tilesLeft: tilesLeft(timed.cells),
    pairsFree: runPairs(timed).length,
    remainingMs: runRemaining(timed, at),
    goal,
    multiplier: AWASE_CHALLENGE_NUMBERS.combo[timed.combo]!,
  };
}

/** A game's moves written as `encodeMoves` writes them, with its seed, so it can be replayed on the deal. */
export function runMoves(run: AwaseRun): readonly MahjongMove[] {
  return run.moves;
}

/**
 * THE DAY'S GAME, the same for everybody on the same date: a layout, a level, a seed and a challenge worked out from the
 * date alone (`2026-10-01`, or a Date, in UTC), so no server need hold it. The seed is never in the block that makes a
 * deal play under the Identical rule, and the layout is never the Tiny one, which is for tests.
 */
export function dailyAwase(date: string | Date): { date: string; size: number; level: AwaseLevel; seed: number; challenge: AwaseChallenge } {
  const day = typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  const layouts = ALL_LAYOUTS.filter((layout) => layout.key !== "tiny");
  const levels: readonly AwaseLevel[] = ["easy", "medium", "hard"];
  const pick = (words: string, count: number) => hashText(`daily:${words}:${day}`) % count;
  return {
    date: day,
    size: layouts[pick("layout", layouts.length)]!.size,
    level: levels[pick("level", levels.length)]!,
    seed: 1 + (hashText(`daily:seed:${day}`) % (AWASE_SAME_BLOCK.from - 1)),
    challenge: AWASE_CHALLENGES[pick("challenge", AWASE_CHALLENGES.length)]!,
  };
}
