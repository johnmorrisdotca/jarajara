---
title: Seeded deals and replayed records
section: explanation
order: 8
description: Learn seeded deals and replayed records.
---

## Make a clearing order in reverse

layPairs removes free matching slot pairs from an initially filled layout and assigns matching tiles in that order. That order can then clear the deal. generateAwase ranks five seeded candidates by bounded random playouts for easy/medium/hard; difficulty changes forgiveness, not whether a clearing order exists.

## A save is a deal and moves

encodeMoves writes slot pairs in compact base-36 plus shuffle markers. playSolve replays legal free matching pairs and allowed deterministic shuffles; invalid moves return null. checkAwase requires a complete clearing record. A host should retain size, difficulty, seed, original givens and moves instead of trusting a claimed final empty board.

## Keep the rule encoded in the seed

The reserved same-rule seed block selects identical bonus matching; other normal seeds select group matching. Preserve that seed and matching rule when restoring. Shuffle draws from the remaining tiles and shuffle count, so replay reproduces it without Math.random. dailyAwase uses UTC date input for a shared setup.

## Source layout

The rules are plain functions over strings, with no DOM; the drawing is a separate entry, so a server that only checks a game never loads it; the tags are classes in another entry, defined only by the `/element/define` entry. Tests sit beside the code they test, and `site.fixture.json` holds every deal and table game itsutsu.com made before the move, played again on every build. `demo/` is the playable page, `e2e/` its browser tests, `bin/` the command line's few lines, and `scripts/` builds the demo and its API reference page, checks the package as npm packs it and the command line as a child process, and builds a page in each framework. [the architecture tree](../ARCHITECTURE.md) lists every source file and what it does.
