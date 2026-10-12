---
title: Getting started
section: tutorial
order: 1
description: Learn getting started.
---

Jarajara supplies mahjong tiles and stacked layouts, SVG artwork and Awase matching solitaire. The shared table is a scoring matching game for two to four; these APIs are not a complete riichi round/scoring engine.

## Install

```sh
npm install @johnmorrisdotca/jarajara
```

The typed ES modules run in Node 22 or later or modern browsers. Pure rules and string drawing work without a page; custom elements have their own registration entry.

## Make a seeded Awase deal

```ts
import {generateAwase,checkAwase} from "@johnmorrisdotca/jarajara/awase";
const deal = generateAwase(4,"easy",2026);
console.log(deal.size,deal.givens.length);
console.log(checkAwase(deal.size,deal.givens,deal.solution));
```

The layout size is tiles across, not the tile count: size 4 names the native Tiny layout. A deal records face codes and a solution as a move record. Each generated deal has a clearing order; players can still make choices that block it.

## Next steps

[Names/racks](names-and-racks.md), [SVG/designs](draw-and-designs.md), [solo/challenges](play-awase.md), [shared tables](shared-table.md), [elements/sounds](embed-and-sounds.md) and the [reference](entry:main) cover the APIs.
