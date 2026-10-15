---
title: Draw SVG and select designs
section: how-to
order: 3
description: Draw tiles and layouts as SVG strings or elements, load only the designs you need, and keep SVG identifiers apart.
---

## Draw strings or native elements

The faces entry returns SVG text for a tile, back or stacked layout. Invalid face/back/layout input can return null. The tile box is stable and CSS controls displayed size. A mirror changes the view without changing the game.

```ts
import {tileSvg,layoutSvg} from "@johnmorrisdotca/jarajara/faces";
import {generateAwase} from "@johnmorrisdotca/jarajara/awase";
const deal = generateAwase(4,"easy",2026);
console.log(tileSvg("a",{title:"One of characters"})?.startsWith("<svg"));
console.log(layoutSvg(4,deal.givens,{showFree:true})?.length);
```

## Load a design only when needed

The built-in Jarajara design is available immediately. Riichi and black riichi designs have separate imports and can be loaded by name. They supply plate, back and ordinary faces; missing flowers/seasons fall back to Jarajara's own drawings. Preserve the existing [CREDITS.md](../../CREDITS.md) with reused artwork/audio.

## Keep symbols local to a drawing

tileFaceSymbols lets a caller share faces within one SVG using its own identifier prefix. layoutSvg has native highlights for chosen, hinted, matching, found and free tiles. Use geometry and layoutFrame rather than guessing stacked offsets. [Layouts](stacked-layouts.md) explains half-tile coordinates.
