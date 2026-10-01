import { describe, expect, it } from "vitest";

import { AWASE_SAME_BLOCK, bonusRuleOfSeed, generateAwase } from "./awase.ts";
import { AWASE_CHALLENGE_NUMBERS, AWASE_CHALLENGES, awaseRules, dailyAwase, isAwaseChallenge, PURGE_GROUPS, readRun, runHint, runMarked, runPairs, runRemaining, runShuffle, runStart, runTake, runTick, runUndo, startRun, type AwaseRun } from "./challenge.ts";
import { layoutFor } from "./layouts.ts";
import { seededRandom } from "./random.ts";
import { EMPTY_SLOT, faceOf } from "./tiles.ts";

const deal = (size: number, seed: number) => generateAwase(size, "medium", seed);

/** Play a run to its end by taking the pair a hint names, `step` milliseconds apart, from `at`; answers the run. */
function playOut(start: AwaseRun, step: number, at = 0): AwaseRun {
  let run = start;
  let now = at;
  for (let guard = 0; guard < 400 && run.over === null; guard += 1) {
    const hint = runHint(run);
    if (hint === null) {
      const shuffled = runShuffle(run, now);
      if (shuffled === null) break;
      run = shuffled;
      continue;
    }
    const next = runTake(hint.run, hint.pair[0], hint.pair[1], now);
    if (next === null) break;
    run = next;
    now += step;
  }
  return run;
}

describe("the rules a game is played by", () => {
  it("are plain Awase without a challenge: no clock, no goal, everything allowed", () => {
    expect(awaseRules(100)).toEqual({ challenge: null, hints: null, shuffles: null, undo: true, timeMs: null, reserveMs: null, pairBonusMs: 0, sparkBonusMs: 0, comboBonusMs: 0, goalPairs: null, goalScore: null, hideBlocked: false });
  });

  it("lay the options over what a challenge allows, and a challenge's take-aways stay taken", () => {
    expect(awaseRules(100, { hints: 3, shuffles: 0, undo: false })).toMatchObject({ hints: 3, shuffles: 0, undo: false });
    expect(awaseRules(100, { challenge: "spark", undo: true }).undo).toBe(false);
    expect(awaseRules(100, { challenge: "blackout", undo: true })).toMatchObject({ undo: false, hideBlocked: true, timeMs: null });
    expect(awaseRules(100, { challenge: "gold" })).toMatchObject({ undo: true, timeMs: null });
  });

  it("scale a challenge's clock and goal to the layout", () => {
    const n = AWASE_CHALLENGE_NUMBERS;
    expect(awaseRules(144, { challenge: "spark" })).toMatchObject({ timeMs: 144 * n.sparkMsPerTile, sparkBonusMs: 20_000 });
    expect(awaseRules(144, { challenge: "rush" })).toMatchObject({ timeMs: 180_000, goalPairs: 30 });
    expect(awaseRules(8, { challenge: "rush" }).goalPairs).toBe(2);
    expect(awaseRules(144, { challenge: "fortune" })).toMatchObject({ goalScore: 10_800, timeMs: 144 * n.fortuneMsPerTile });
    expect(awaseRules(100, { challenge: "sand" })).toMatchObject({ timeMs: 45_000, reserveMs: 60_000, pairBonusMs: 5000, comboBonusMs: 1000 });
    expect(AWASE_CHALLENGES).toHaveLength(7);
    expect(isAwaseChallenge("sand")).toBe(true);
    expect(isAwaseChallenge("nonsense")).toBe(false);
  });
});

describe("starting a game", () => {
  it("chooses the gold face, the spark and the purge's group from the seed, the same every time", () => {
    const d = deal(9, 31);
    expect(startRun(d, { challenge: "gold" }).gold).toBe(startRun(d, { challenge: "gold" }).gold);
    expect(startRun(d, { challenge: "gold" }).gold).not.toBeNull();
    expect(startRun(d, { challenge: "spark" }).spark).not.toBeNull();
    expect(startRun(d, { challenge: "purge" }).purge).not.toBeNull();
    const plain = startRun(d);
    expect([plain.gold, plain.spark, plain.purge]).toEqual([null, null, null]);
    const chosen = new Set<string | null>();
    for (let seed = 1; seed < 40; seed += 1) chosen.add(startRun(deal(9, seed), { challenge: "gold" }).gold);
    expect(chosen.size).toBeGreaterThan(5);
  });

  it("marks the gold face's tiles, the spark's, or the purge's group, and nothing in a plain game", () => {
    const d = deal(9, 31);
    const gold = startRun(d, { challenge: "gold" });
    expect(runMarked(gold).every((slot) => d.givens[slot] === gold.gold)).toBe(true);
    expect(runMarked(gold).length).toBeGreaterThanOrEqual(2);
    const purge = startRun(d, { challenge: "purge" });
    const group = PURGE_GROUPS.find((one) => one.key === purge.purge)!;
    expect(runMarked(purge).every((slot) => (group.suits as readonly string[]).includes(faceOf(d.givens[slot]!)!.suit))).toBe(true);
    expect(runMarked(purge).length).toBeGreaterThanOrEqual(8);
    expect(runMarked(startRun(d))).toEqual([]);
  });

  it("gives a purge the time its tiles ask for, and starts a clock only when told", () => {
    const d = deal(9, 31);
    const purge = startRun(d, { challenge: "purge" });
    const targets = runMarked(purge).length;
    expect(purge.bank).toBe(d.givens.length * 2200 + targets * 4000);
    expect(purge.bankAt).toBeNull();
    expect(runRemaining(purge, 999_999)).toBe(purge.bank);
    expect(runStart(purge, 5).bankAt).toBe(5);
    expect(startRun(d, { challenge: "purge" }, 7).bankAt).toBe(7);
    expect(startRun(d).bank).toBeNull();
    expect(() => startRun({ size: 99, seed: 1, givens: "a" })).toThrow();
  });
});

describe("playing a game", () => {
  it("clears a plain deal, scores it, and is won because it is cleared", () => {
    const run = playOut(startRun(deal(8, 5)), 4000);
    expect(run.over).toBe("won");
    expect(run.because).toBe("cleared");
    expect(run.cells).toBe(EMPTY_SLOT.repeat(64));
    expect(run.pairs).toBe(32);
    expect(run.score).toBeGreaterThan(32 * 100);
    expect(run.history).toHaveLength(run.moves.length);
    expect(runPairs(run)).toEqual([]);
    expect(readRun(run, 0)).toMatchObject({ state: "won", because: "cleared", tilesLeft: 0, remainingMs: null, goal: null });
  });

  it("refuses what the rules refuse, and a move after the end", () => {
    const run = startRun(deal(8, 5));
    expect(runTake(run, 0, 0, 0)).toBeNull();
    expect(runTake(run, 0, 99999, 0)).toBeNull();
    const done = playOut(run, 100);
    expect(runTake(done, 0, 1, 0)).toBeNull();
    expect(runShuffle(done, 0)).toBeNull();
    expect(runHint(done)).toBeNull();
  });

  it("builds a combo from pairs taken within five seconds, and loses it after a pause", () => {
    let run = startRun(deal(9, 3));
    const take = (at: number) => {
      const hint = runHint(run)!;
      run = runTake(hint.run, hint.pair[0], hint.pair[1], at)!;
    };
    take(0);
    expect(run.combo).toBe(0);
    take(2000);
    expect(run.combo).toBe(1);
    take(4000);
    expect(run.combo).toBe(2);
    expect(readRun(run, 4000).multiplier).toBe(1.5);
    take(20_000);
    expect(run.combo).toBe(0);
    // A pair is worth more the higher it was, and the combo multiplies it.
    const before = run.score;
    take(21_000);
    expect(run.score - before).toBeGreaterThanOrEqual(Math.round(100 * 1.25));
  });

  it("counts the hints and refuses one past the limit", () => {
    const run = startRun(deal(9, 3), { hints: 2 });
    const first = runHint(run)!;
    const second = runHint(first.run)!;
    expect(second.run.hintsUsed).toBe(2);
    expect(runHint(second.run)).toBeNull();
    expect(runHint(startRun(deal(9, 3), { hints: 0 }))).toBeNull();
    expect(runHint(startRun(deal(9, 3)))!.run.hintsUsed).toBe(1);
  });

  it("takes a move back, score and all, where undo is allowed, and not where it is not", () => {
    const run = startRun(deal(9, 3));
    const hint = runHint(run)!;
    const taken = runTake(hint.run, hint.pair[0], hint.pair[1], 100)!;
    const back = runUndo(taken, 200)!;
    expect(back.cells).toBe(run.cells);
    expect(back.score).toBe(0);
    expect(back.pairs).toBe(0);
    expect(back.moves).toEqual([]);
    expect(runUndo(back, 300)).toBeNull();
    const strict = startRun(deal(9, 3), { undo: false });
    const done = runTake(strict, ...runPairs(strict)[0]!, 0)!;
    expect(runUndo(done, 1)).toBeNull();
    for (const challenge of ["spark", "blackout"] as const) {
      const one = startRun(deal(9, 3), { challenge });
      expect(runUndo(runTake(one, ...runPairs(one)[0]!, 0)!, 1), challenge).toBeNull();
    }
  });

  it("shuffles only when no pair can be taken, and only as often as allowed", () => {
    const run = startRun(deal(9, 3));
    expect(runShuffle(run, 0)).toBeNull();
    // Find a game that gets stuck, with shuffles allowed, and shuffle it.
    let stuck: AwaseRun | null = null;
    for (let seed = 1; seed < 80 && stuck === null; seed += 1) {
      const random = seededRandom(seed);
      let one = startRun(deal(8, seed), { shuffles: 1 });
      while (one.over === null && runPairs(one).length > 0) {
        const pairs = runPairs(one);
        const pair = pairs[Math.floor(random() * pairs.length)]!;
        one = runTake(one, pair[0], pair[1], 0)!;
      }
      if (one.over === null) stuck = one;
    }
    expect(stuck).not.toBeNull();
    const after = runShuffle(stuck!, 0)!;
    expect(after.shuffles).toBe(1);
    expect(after.moves.at(-1)).toEqual({ shuffle: true });
    expect(runPairs(after).length).toBeGreaterThan(0);
    expect(runUndo(after, 0)!.shuffles).toBe(0);
  });

  it("is lost, because it is stuck, when no pair is left and no shuffle is", () => {
    let found = 0;
    for (let seed = 1; seed < 60; seed += 1) {
      const random = seededRandom(seed);
      let one = startRun(deal(8, seed), { shuffles: 0 });
      while (one.over === null) {
        const pairs = runPairs(one);
        const pair = pairs[Math.floor(random() * pairs.length)]!;
        one = runTake(one, pair[0], pair[1], 0)!;
      }
      if (one.because === "stuck") {
        found += 1;
        expect(one.over).toBe("lost");
        expect(one.cells.replace(/\./g, "").length).toBeGreaterThan(0);
        expect(readRun(one, 0).state).toBe("lost");
      }
    }
    expect(found).toBeGreaterThan(0);
  }, 30_000);
});

describe("the challenges", () => {
  it("gold: won the moment a pair of the gold face is taken, with a bonus for the tiles left", () => {
    const start = startRun(deal(9, 31), { challenge: "gold" });
    const marked = runMarked(start);
    const pair = runPairs(start).find(([a, b]) => start.cells[a] === start.gold && start.cells[b] === start.gold);
    // The gold may be buried: take what stands in its way, by hints that prefer the gold when it is free.
    let run = start;
    for (let guard = 0; guard < 80 && run.over === null; guard += 1) {
      const pairs = runPairs(run);
      const gold = pairs.find(([a]) => run.cells[a] === run.gold);
      const [a, b] = gold ?? pairs[0]!;
      run = runTake(run, a, b, guard * 1000)!;
    }
    expect(marked.length).toBeGreaterThanOrEqual(2);
    expect(pair === undefined || pair.length === 2).toBe(true);
    expect(run.over).toBe("won");
    expect(run.because).toBe("gold");
    expect(readRun(run, 0).goal).toEqual({ kind: "gold", done: 1, of: 1 });
  });

  it("rush: won on the goal number of pairs, with the layout not cleared, and lost on the clock", () => {
    const start = startRun(deal(9, 31), { challenge: "rush" });
    expect(start.rules.goalPairs).toBe(21);
    const won = playOut(start, 3000);
    expect(won.over).toBe("won");
    expect(won.because).toBe("goal");
    expect(won.pairs).toBe(21);
    expect(won.cells.replace(/\./g, "").length).toBe(100 - 42);
    const slow = playOut(start, 20_000);
    expect(slow.over).toBe("lost");
    expect(slow.because).toBe("time");
    expect(readRun(slow, 10 ** 9).remainingMs).toBe(0);
  });

  it("fortune: won on the goal score, which fast pairs in a row reach sooner", () => {
    const start = startRun(deal(9, 31), { challenge: "fortune" });
    expect(start.rules.goalScore).toBe(7500);
    const quick = playOut(start, 1000);
    const slow = playOut(start, 5100);
    expect(quick.over).toBe("won");
    expect(quick.because).toBe("goal");
    expect(quick.score).toBeGreaterThanOrEqual(7500);
    expect(slow.pairs).toBeGreaterThan(quick.pairs);
  });

  it("sand: every pair adds time to a limit, and the layout must be cleared", () => {
    let run = startRun(deal(8, 5), { challenge: "sand" }, 0);
    expect(runRemaining(run, 0)).toBe(45_000);
    const first = runHint(run)!;
    run = runTake(first.run, first.pair[0], first.pair[1], 1000)!;
    expect(runRemaining(run, 1000)).toBe(44_000 + 5000);
    const second = runHint(run)!;
    run = runTake(second.run, second.pair[0], second.pair[1], 2000)!;
    // The second pair came within five seconds: a combo step, one more second.
    expect(runRemaining(run, 2000)).toBe(49_000 - 1000 + 5000 + 1000);
    // The bank holds no more than the reserve, however fast the pairs.
    const fast = playOut(startRun(deal(8, 5), { challenge: "sand" }, 0), 100);
    expect(fast.over).toBe("won");
    expect(fast.bank!).toBeLessThanOrEqual(60_000);
    const slow = playOut(startRun(deal(8, 5), { challenge: "sand" }, 0), 49_000);
    expect(slow.over).toBe("lost");
  });

  it("spark: a pair of the spark face adds time and sends the spark on to another face", () => {
    let run = startRun(deal(8, 5), { challenge: "spark" }, 0);
    const first = run.spark!;
    expect(runRemaining(run, 0)).toBe(64 * 2500);
    for (let guard = 0; guard < 64 && run.spark === first && run.over === null; guard += 1) {
      const pairs = runPairs(run);
      const spark = pairs.find(([a]) => run.cells[a] === run.spark) ?? pairs[0]!;
      run = runTake(run, spark[0], spark[1], 0)!;
    }
    expect(run.over === null ? run.spark : "done").not.toBe(first);
    // The 20 seconds were added to what was left, at the instant of the sparked pair.
    expect(run.bank! + 0).toBeGreaterThan(64 * 2500);
  });

  it("purge: won when every tile of the marked group is gone, with the layout not cleared", () => {
    const start = startRun(deal(9, 31), { challenge: "purge" }, 0);
    let run = start;
    for (let guard = 0; guard < 80 && run.over === null; guard += 1) {
      const pairs = runPairs(run);
      const marked = new Set(runMarked(run));
      const [a, b] = pairs.find(([x, y]) => marked.has(x) && marked.has(y)) ?? pairs.find(([x]) => marked.has(x)) ?? pairs[0]!;
      run = runTake(run, a, b, guard * 100)!;
    }
    expect(run.over).toBe("won");
    expect(run.because).toBe("purged");
    expect(runMarked(run)).toEqual([]);
    expect(readRun(run, 0).goal).toEqual({ kind: "purge", done: runMarked(start).length, of: runMarked(start).length });
    expect(run.cells.replace(/\./g, "").length).toBeGreaterThan(0);
  });

  it("blackout: untimed, cleared as plain Awase is, with the blocked tiles shown blank and no undo", () => {
    const run = startRun(deal(8, 5), { challenge: "blackout" });
    expect(run.rules.hideBlocked).toBe(true);
    expect(run.bank).toBeNull();
    expect(playOut(run, 10).over).toBe("won");
  });
});

describe("the clock", () => {
  it("loses a game once its time has run out, and only then, whatever else is asked", () => {
    const run = startRun(deal(8, 5), { challenge: "spark" }, 0);
    expect(runTick(run, 1000)).toBe(run);
    const late = runTick(run, 64 * 2500 + 1);
    expect(late.over).toBe("lost");
    expect(late.because).toBe("time");
    // A pair taken after the time was up is the move that finds it out.
    const pair = runPairs(run)[0]!;
    const found = runTake(run, pair[0], pair[1], 64 * 2500 + 5)!;
    expect(found.because).toBe("time");
    expect(found.pairs).toBe(0);
    expect(runTake(found, pair[0], pair[1], 10 ** 9)).toBeNull();
    expect(runTick(startRun(deal(8, 5)), 10 ** 9).over).toBeNull();
    expect(runTick(runStart(startRun(deal(8, 5), { challenge: "rush" }), 100), 100 + 180_001).because).toBe("time");
  });

  it("starts with the first pair, not before", () => {
    const run = startRun(deal(8, 5), { challenge: "rush" });
    expect(runRemaining(run, 10 ** 7)).toBe(180_000);
    const hint = runHint(run)!;
    const taken = runTake(hint.run, hint.pair[0], hint.pair[1], 10 ** 7)!;
    expect(taken.bankAt).toBe(10 ** 7);
    expect(runRemaining(taken, 10 ** 7 + 1000)).toBe(179_000);
  });
});

describe("the day's game", () => {
  it("is the same for the same date, a layout that exists, a seed that plays the usual rule, and a challenge", () => {
    const today = dailyAwase("2026-10-01");
    expect(dailyAwase("2026-10-01")).toEqual(today);
    expect(dailyAwase(new Date("2026-10-01T23:59:00Z"))).toEqual(today);
    expect(today.date).toBe("2026-10-01");
    expect(layoutFor(today.size)).not.toBeNull();
    expect(today.size).not.toBe(4);
    expect(bonusRuleOfSeed(today.seed)).toBe("group");
    expect(isAwaseChallenge(today.challenge)).toBe(true);
    const days = Array.from({ length: 60 }, (_, at) => dailyAwase(new Date(Date.UTC(2026, 9, 1 + at))));
    expect(new Set(days.map((day) => day.size)).size).toBeGreaterThan(5);
    expect(new Set(days.map((day) => day.challenge)).size).toBeGreaterThan(5);
    expect(new Set(days.map((day) => day.level)).size).toBe(3);
    expect(days.every((day) => day.seed >= 1 && day.seed < AWASE_SAME_BLOCK.from)).toBe(true);
    expect(new Set(days.map((day) => day.seed)).size).toBe(60);
  });

  it("deals a game that can be played in its challenge", () => {
    const today = dailyAwase("2026-10-01");
    const run = startRun(generateAwase(today.size, today.level, today.seed), { challenge: today.challenge }, 0);
    expect(run.over).toBeNull();
    expect(runPairs(run).length).toBeGreaterThan(0);
  });
});
