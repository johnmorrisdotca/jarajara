# How Jarajara's tiles look, and why

Checked 2026-10-01. John's note on the demo as it was at 1.3.0: the board was huge next to the rest of the family, the
tiles read as floating cards, they flipped like cards, the "every layout" gallery was cards of every height, and the
options did not look like the family's. This is what the established mahjong solitaires do, what was taken from that, and
what Jarajara does now.

**Licences.** Nothing here is copied. The code and art of Mah (MIT) were read for numbers and ideas and none is used. KMahjongg
and mahseum were looked at only: no code, no art, no numbers copied beyond what their own public documentation states.
Every tile face is still Jarajara's own drawing or FluffyStuff's CC0 riichi set (see [CREDITS.md](../CREDITS.md)).

## What the established games do

### Mah, ffalt/mah, MIT ([source](https://github.com/ffalt/mah), [play](https://ffalt.github.io/mah/))

Read in `src/app/components/board-tile/board-tile.component.html`, `src/app/model/draw-geometry.ts`, `src/app/model/consts.ts`
and the styles in `board/board.component.html`.

- **A solid block.** In its 3D mode a tile is three rectangles: a "side" plate, the ivory "stone" laid over it, and a thin
  white "bevel" ring just inside the stone's edge. The face is 75 by 100; the side plate is the same size moved 5 right and
  5 down, so the thickness shows on the **right and bottom**, about 6.7% of the face's width. The stone is a warm ivory
  (`#FFF9E5`) with a grey-brown outline, the side a darker grey-brown (`#a89488`): the tile has depth because the side is
  clearly a different tone, not a lighter copy of the face.
- **Layers.** Each layer up moves a tile **up and to the left** by 8 of those units (`levelOffset` 16, halved because slots are
  in half-tiles): about 10.7% of the face's width. Tiles are drawn in order of layer, then `x + y`, then `x`, so a tile's
  sides are covered by the tile in front of it.
- **Shadows.** One shadow rectangle per tile, drawn in a layer of its own under that level's tiles, so a higher tile's shadow
  falls on the tiles below it: dark green-black (`#05120c`), 38% opaque, blurred 4px, a little bigger than the tile and
  nudged left and up. Mah's changelog records that a blur on this layer did not repaint in Firefox, so the blur moved onto
  the tile.
- **Sized to the window.** The board is one SVG whose `viewBox` is the bounding box of all the tiles with a 20-unit border
  (`getDrawBoundsViewport`), scaled to the window; on a touch screen it can be pinched and panned, and in a portrait window it can
  be turned a quarter-turn (the `rotate` signal in `board.component.ts`). The board is the page: nothing sits beside it but a
  bar above and below.
- **Free and blocked.** A tile's state is `blocked` or `removable`; a blocked tile simply does not react. It is not tinted. The
  help is a hint, which rings a pair in orange (`#ff5900`, 3px) and scales a selected hinted tile 1.12. "Blackout" shows only
  free tiles' faces and draws a back on the covered ones.
- **Turning over.** Looking through its keyframes (wiggle, match flash, select pop, mark breathing) there is no turn: a tile
  that is covered is simply drawn with its back instead of its face.

### KMahjongg, KDE (GPL: looked at, nothing taken) ([tileset format](https://marc.info/?l=kde-games-devel&m=116370367024374), [libkmahjongg](https://github.com/KDE/libkmahjongg), [handbook](https://docs.kde.org/stable_kf6/en/kmahjongg/kmahjongg/kmahjongg.pdf))

- A tileset is an SVG plus a description with the **full tile size including its shadows**, the **face size**, and a
  `leveloffset`: "the amount (in pixels) of offset the engine should apply for each layer when tiles are stacked", roughly the
  whole tile minus its shadow minus its face. That is the same idea as Mah's: the layer lift is the tile's own thickness.
- The tile art comes in **four angles** (NW, SW, SE, NE) and a **selected** variant of each: a chosen tile is separate artwork,
  not a ring drawn over the unselected one.
- The handbook's View menu has **Rotate View Counterclockwise and Clockwise**: the four angles are the four quarter-turns of
  the board.

### mahseum, ffalt/mahseum (no licence I could confirm: looked at only) ([page](https://ffalt.github.io/mahseum/))

A museum of 931 layouts. Every layout is a **card of one size**: a small badge for the collection, a thumbnail box of one
fixed size with the layout scaled to fit it and centred, the name, the author and the tile count. Its thumbnails draw each
tile as a cream block with thickness showing on the right and below, on a dark box. Nothing about a layout's own shape
changes the card.

### Microsoft Mahjong (Mahjong Titans) and mahjong.com

Not verified. The pages that came up describe the play ("a tile is open if it can be moved left or right and nothing lies on
it") and a "tile blocked" warning when a covered tile is chosen, and nothing about how the tiles are drawn or turned. What
I know of Titans from memory (ivory faces over a green back plate, thickness on the left and below, the free tiles bright and
the covered ones dim) is not relied on anywhere in this change.

### Other things read

- [A user's issue on danhquach/mahjongsolitaire](https://github.com/danhquach/mahjongsolitaire/issues/220): "Shadow length
  means height. A tile resting on the felt casts a tight contact shadow; each layer up casts a longer one", because one
  shadow for every tile made tiles on the felt look raised, and the blocked ones at the edge look free.
- [Wikipedia's article](https://en.wikipedia.org/wiki/Mahjong_solitaire) shows free ("exposed") tiles highlighted in blue.

## Answers

- **How are tiles drawn so they read as solid blocks?** Thickness on two sides (right and bottom in Mah, left and below in
  Jarajara), in a **different tone from the face**; an ivory face laid over a darker back plate; a thin light line just inside the
  face's edge; each layer lifted by **exactly the tile's thickness**, in the same direction the thickness shows, so a stack
  looks stacked; and a **shadow that grows with height**.
- **How is the layout sized to the window?** Mah scales one SVG, `viewBox` = the tiles' bounding box plus a border, to the whole
  window. mahseum scales each layout into a thumbnail box of one size. Neither lets the layout's own shape set the size of the
  thing it sits in.
- **How are free and blocked tiles shown?** Mostly not at all: a blocked tile does not react. Mah's help is a hint, Wikipedia's
  picture a blue highlight on the free tiles.
- **What does turning a tile over look like?** None of them turns a tile. A covered tile is drawn with its back.

## What Jarajara does now

- **A tile is a block** (`src/block.ts`). The face is ivory over a back plate, 5 units thick (`TILE_DEPTH`, on a 30 by 40 face),
  seen on its left and bottom; the ivory layer is the 3 nearest steps of the 5 and the back plate's own colour the rest (a real
  tile's green, or the colour of the back chosen). The thickness is drawn in steps so the corners stay round, with the side the
  light falls on a little lighter and the other darker. Each layer is lifted by the same 5 units, up and right, which is
  the direction the thickness shows from, so the stacks read as stacks. A soft shadow of three widening layers falls the way the
  thickness shows and **reaches further the higher the tile** (`shadowSvg`).
- **Every design shows where each tile ends** (John, on riichi black: "almost just a sheet of black"). Round every face is a seam
  that stands out from it, the design's own `rim` if that does (at least 0.28 of lightness apart), otherwise darker on a light face and
  lighter on a dark one, and a raised-edge line just inside it. The back plate is the design's `colours.body`.
- **Turning is a block tipping over.** The elements build the tile as a real 3D block: a face and a back a thickness apart and
  four edges between them (ivory layer and back plate, as in the layouts), seen by an oblique shear so that at rest it is the
  picture the layouts draw. A turn lifts it, tips it over on its edge (the thickness showing as it passes upright) and sets it down
  on the back, which is the colour of the back chosen (jade, bamboo, blue, red, ink). Under `prefers-reduced-motion` there is no turn.
- **The board is one steady box.** `layoutFrame(size, { margin })` gives the box that holds a layout's solid tiles and their
  thickness and layer lift, in whichever view, plus an even margin; `layoutSvg` draws on it when given a `margin`. The elements
  put it in a frame with one padding all round, scaled to fit and centred in a box that does not change with the layout
  (`box="landscape"`). The shadow is left out of the box (it falls one way, so counting it would push the solid tiles off
  centre by its reach) and spills into the frame's padding.
- **A gallery of one card size**, each layout scaled into the same thumbnail box, as mahseum does.
- **Find and the board's other side** are covered in the section below.

## Turning the board round

Which mahjong solitaires let you see the board from another side:

- **KMahjongg**: Rotate View Counterclockwise and Clockwise, in quarter-turns (the four angles of its tilesets).
- **3D mahjong**: [Mahjongg Dimensions](https://www.arkadium.com/games/mahjongg-dimensions/) (rotate the cube by touch or swipe),
  [Mahjong Mojo 3D](https://apps.apple.com/us/app/mahjong-mojo-3d/id710368479) (flip and rotate the board with two fingers or
  buttons), [3D Mahjong Tower](https://freegames.org/3d-mahjong/) (drag to rotate the tower). In these the point is that tiles
  hidden behind others come into view.
- **Mah**: a quarter-turn of the board, for portrait windows, not a second view of the same stacks.

What Jarajara did first (1.4.0): **mirror** the picture, left to right, top to bottom or both (`mirror="horizontal"`, `"vertical"`, `"both"`;
the `Flip` button and the demo's View row). It is a view only: a tile's `data-slot` is its slot in the layout, so what is free,
hints, saved games and replays are unchanged (a test holds the free tiles of every layout in every view to the same slots). The
thickness, the layer lift and the shadows follow the view.

What real rotation would take, not built: **quarter-turns** (as KMahjongg) turn the grid a quarter, but a tile is 3 wide by
4 tall and the grid is 15 by 20 to the half tile, so a turned grid either leaves gaps and overlaps or needs the tiles drawn
lying on their sides (the faces turned with them) and the block drawn from the new side; the rules stay as they are, since
freeness belongs to the layout. **Free turning**, like Kyuubu's cube, needs a real projection: each tile a 3D block in the DOM (about 6
planes by 144 tiles, which CSS 3D handles) sorted by depth as the view changes, with a pick that finds the nearest tile under the
pointer. Neither is blocked by the package's design; both are a large step beyond a mirror.

## Find

When Find is on, pointing at a tile (a mouse) or choosing one lights **every tile that matches it** under the bonus rule in play
(`matchesOf`): a match that could be taken with it now in a **solid ring and tint**, one that is held in a **dashed ring**, in a
colour (`#1c6e8c`) that is neither the chosen ring's, the hint's, nor the gold's; the shape differs as well as the line, so colour
is never the only difference. A touch has no pointing, so choosing is the trigger there.
