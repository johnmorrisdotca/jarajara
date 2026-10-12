---
title: Play at a shared table
section: how-to
order: 5
description: Learn play at a shared table.
---

## Read state from recorded takes

startTable stores the original deal, local seats and pair takes. readTable replays it, returning null for invalid setup or a refused pair. Two to four players share one layout; tablePairs provides the current free matching pairs.

```ts
import {generateAwase} from "@johnmorrisdotca/jarajara/awase";
import {startTable,readTable,tablePairs,playAtTable} from "@johnmorrisdotca/jarajara/table";
const table = startTable(generateAwase(4,"easy",2026),[{name:"Seat 1"},{name:"Seat 2"}]);
const state = readTable(table)!;
const pair = tablePairs(table,state)[0];
console.log(playAtTable(table,pair[0],pair[1],state)?.state.scores);
```

## Native scoring and turns

Plain suit pairs score one, terminals two, winds three, dragons four, and bonus pairs two plus another turn. The table automatically shuffles a stuck position when possible. Most points wins; tied leaders share the result. Do not copy solitaire challenge clocks into these rules.

## Computers and restoration

computerPair chooses a native legal pair for the seat to move. Preserve the current replayed state when using playAtTable to avoid replaying the whole history on every turn. encodeTable/decodeTable validate stored tables through the same native replay. Seat names are local display data; choose public labels before sharing a record.
