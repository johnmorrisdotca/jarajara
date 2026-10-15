---
title: Read names, notation and racks
section: how-to
order: 2
description: Tell tile codes from notation, arrange a rack without changing its tiles, and use the rack element.
---

## Keep face codes separate from notation

The 42 faces have one-character internal codes. readNotation reads familiar hand notation such as 123m456p789s1112z, while tileName and findFace handle human names. readNotation null means invalid notation; readTiles is the more forgiving display parser.

```ts
import {readNotation,writeNotation,tileName,arrangeTiles} from "@johnmorrisdotca/jarajara";
const tiles = readNotation("123m456p789s1112z");
if (tiles) console.log(writeNotation(arrangeTiles(tiles,"suit")),tileName(tiles[0],"ja"));
```

## Sort without changing physical identity

arrangeTiles/arrangeIndexes support dealt, suit, rank, kind and code order. groupTiles/groupStarts divide a sorted rack by suit or kind. mixTiles is seeded; it is presentation order, not a new legal deal. Bonus faces have one physical copy while ordinary faces have four; setInventory describes the complete 144-tile set.

## Use the native rack

The rack element accepts tiles, ordering, groups, turning, lifting and marks. Its structured detail keeps the same tile codes as the rule APIs. The [embed contract](../ELEMENTS.md#embed-a-rack) covers reflected settings, formats and public JSON-safe rack detail.
