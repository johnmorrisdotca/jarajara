# Drawing the tiles

The tiles, backs, designs and layouts as SVG text: the full description. Back to the [README](../README.md#drawing).


```ts
import { layoutSvg, tileSvg, tileFaceSymbols, TILE_INK } from "@johnmorrisdotca/jarajara/faces";

tileSvg("F");                                      // one tile, the red dragon, as a whole <svg>
layoutSvg(15, cells, { chosen: 12, showFree: true }); // a layout, stacked, far to near, the chosen tile ringed
```

The faces are a Japanese-style set in plain strokes that read at thirty
pixels: numerals over a red 萬, dots and sticks counted out, the winds and
dragons as their characters, and every suit tile and wind with its number or
letter small in the corner for a reader who does not count dots at a glance or
read 東 as east. Strings, not components, so they go into any page or
framework. Every tile in a layout is a `<g>` with `data-slot`, `data-face`
and `data-free` for a page to listen on. The colours are fixed, since tiles are
light objects on any table; the table under them is the page's.

**A tile is a solid block**, not a card (the reasoning, and what the established mahjong solitaires do, is in
[docs/LOOK.md](LOOK.md)). An ivory face lies over a back plate with thickness showing on two sides: the near layer of
the thickness is the ivory, the rest the back plate's own colour (a real tile's green unless the design or the back says
another); the layers of a stack are lifted by exactly that thickness, in the direction it shows from, so a stack reads as a
stack; and every tile casts a soft shadow that reaches further the higher it is. Round every face runs a seam that stands out from
it and a raised-edge line inside it, so a row of tiles can be counted in every design, black ones included.
`tileSvg("F", { flat: true })` is the old look (a sliver of side, 32 by 42) and `{ bare: true }` the face alone (30 by 40);
`blockColours(design)` gives the colours, `TILE_DEPTH` the thickness.

`layoutSvg` frames a layout on its **drawn extent** when given a `margin`: `layoutFrame(size, { mirror, margin })` is the box that
holds every solid tile with its thickness and lift, so a page that centres the picture centres what the eye sees. Without
a margin the viewBox is the old `layoutBox`. The soft shadow is left out of the box (it falls one way, and counting it would push
the tiles off centre) and spills into the margin. The `box` attribute of the elements keeps one steady box whatever the layout.

Backs, designs and cloths are drawn the same way:

```ts
import { tileBackSvg, layoutSvg, clothVars, JARAJARA_CLOTHS } from "@johnmorrisdotca/jarajara/faces";

tileBackSvg("bamboo");                                    // jade, bamboo, blue, red and ink
tileBackSvg("ink", { colour: "#336699", mark: "SITE" });  // recoloured, with a few letters across it
layoutSvg(15, cells, { cloth: "wood", hideBlocked: true }); // a felt behind it; blocked tiles drawn blank
clothVars("blue");                                        // the felt as CSS custom properties
```

`layoutSvg` also takes `matching` (slots ringed), `marked` (slots given a gold mark), `found` (what Find lights: a free match in a
solid ring, a held one in a dashed ring, from `matchesOf`), `mirror` (`none`, `horizontal`, `vertical` or `both`: the board seen from the
other side, thickness, lift and shadows following; a view only, so `data-slot`, what is free, hints and saved games are the layout's own),
`margin`, `design`, `redFives`, and `symbols: false` for a page that draws a board again and again and keeps the faces' symbols once.

## Hints and Find

```ts
import { geometryOf, hintFor, layoutFor, matchesOf } from "@johnmorrisdotca/jarajara";

const geometry = geometryOf(layoutFor(15)!);
hintFor(geometry, cells, "group");        // { pair, found: "any" }: any free pair, the one lifting the layers highest
hintFor(geometry, cells, "group", chosen); // looks first for the chosen tile's match: found "match" (pair[0] is the chosen tile),
                                          // "other" (it has no free match: another pair), "any", or "none" (no pair at all)
matchesOf(geometry, cells, "group", slot); // { free, blocked }: every tile that matches it, told apart by whether it could be taken now
```

`runHint(run, chosen?)` is the same for a game with its limits. The existing `hintPair(layout, cells, rule)` of the element entry still gives
the old answer.

