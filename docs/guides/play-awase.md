---
title: Play solitaire and challenges
section: how-to
order: 4
description: Take free matching pairs, pass the time in yourself for challenges, and keep hints and refusals.
---

## Take free matching pairs

A tile is free when nothing covers it and one horizontal side is open. canTake combines freedom and matching. Grouped bonuses allow any flower with another flower and any season with another season; the identical rule requires the same bonus face. The seed selects the matching rule through bonusRuleOfSeed.

```ts
import {generateAwase,startRun,runPairs,runTake,readRun} from "@johnmorrisdotca/jarajara/awase";
let run = startRun(generateAwase(4,"easy",2026),{},0);
const pair = runPairs(run)[0];
const next = runTake(run,pair[0],pair[1],1000);
if (next) run = next;
console.log(readRun(run,1000).tilesLeft,run.pairs);
```

## Supply time explicitly

Challenge functions take a caller-supplied millisecond time. runStart/runTick/runRemaining and readRun handle native clocks and goals without reading a clock in the core. Normal runs have remainingMs null. A late pair can lose a timed game; do not subtract time independently in a host.

## Keep assistance and refusals

runTake/runShuffle/runUndo/runHint return null when refused. Undo does not refund elapsed clock time. Shuffle is offered when stuck, not simply to replace a playable board. Hint counts its allowance and reports whether it matched the chosen tile. dailyAwase selects a reproducible UTC daily size, difficulty, seed and challenge. [Records](records-and-seeds.md) covers replay.
