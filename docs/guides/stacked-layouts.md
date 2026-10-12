---
title: Stacked geometry and SVG views
section: explanation
order: 7
description: Learn stacked geometry and svg views.
---

## Half-tile units preserve overlap

MahjongSlot is the top-left corner in half-tile units across/down plus layer. A tile covers two units each way, so it can sit halfway across two below. geometryOf computes covering and left/right blocking relationships once; isFree/freePairs use that geometry and current occupancy.

## Drawing is another view of the same slots

layoutExtent describes native width, height and layers. tileAt, layoutBox and layoutFrame place solid tiles, layer offsets and shadows, including mirrored views. View rotation does not make a covered tile free. Slot sorting changes display order, not the recorded slot indices of a deal.

## Keep rules and presentation separate

The root checks tiles/layouts/moves, faces supplies SVG strings, and elements supply DOM lifecycle. A host drawing its own board should feed the native geometry and code order into rules. Existing [LOOK.md](../LOOK.md) explains visual choices; the [architecture tree](../ARCHITECTURE.md) preserves file-by-file detail.
