# Changelog

## 1.3.0 — 2026-10-01

More layouts, and challenges and options for Awase. No existing deal changes: sizes 4, 8, 9, 10 and 15 and every deal
made on them are exactly as they were (a test plays every deal itsutsu.com made again).

- **Six new layouts**, Jarajara's own drawings of shapes anyone may draw: Pagoda (11 across), Fortress (12), Pyramid (13),
  Bridge (14), Butterfly (16) and Dragon (17). `MORE_LAYOUTS` holds them, `ALL_LAYOUTS` every layout, and `layoutFor`
  finds any by size. Each is dealt and cleared at every level from several seeds, with its own answer played out, by the
  tests.
- **Options and challenges** for Awase (`@johnmorrisdotca/jarajara/awase`): a game as plain data (`startRun`, `runTake`,
  `runShuffle`, `runUndo`, `runHint`, `readRun`), with hints, shuffles and undo given, limited or taken away, and seven
  challenges: gold, spark, rush, fortune, sand, purge and blackout, with a clock and a goal laid over the deal. The ideas
  are from Mah's challenge modes (MIT, credited); the code and numbers are Jarajara's own.
- **`dailyAwase(date)`**: the day's layout, level, seed and challenge, the same for everybody, from the date alone.
- `<jarajara-layout>` plays them: `challenge`, a clock that counts down, a goal line, gold rings on the tiles hunted, blank
  tiles in the blackout, `jarajara-lost`, and `score` and `run`. Its limits (`hints`, `shuffles`, `undo`) now belong to the
  game's rules.
- The demo has a challenge chooser, a button for today's game, a Challenges panel, and every layout in the chooser, the
  gallery and the looked-over layout.
- The code of conduct names Jarajara, and the family's footer lists Suido.

## 1.2.0 — 2026-10-01

A second design, and sounds.

- **The riichi designs**: FluffyStuff's riichi mahjong tiles (public domain, CC0, confirmed at the source and recorded
  in `docs/credits.md`), regular and black, with their own backs and red fives. `design="riichi"` and `"riichi-black"` on
  every element, `loadTileDesign(name)` and the `design` option of `tileSvg` and `layoutSvg`. They have no flowers or
  seasons, so those are Jarajara's own within them. Each design is its own entry (`/designs/riichi`,
  `/designs/riichi-black`, about 118 kB of drawings, made smaller with svgo) and is fetched the first time it is asked
  for: the default design costs nothing extra.
- **Red fives**: `red-fives` on the layout, the rack, the group and the set draws the first five of each suit red in a
  design that has them (the same tile all game); `red` on a tile; `redFiveIndexes` and the `redFives` option.
- **Backs follow designs**: a design's own back is named like the design, and an element given a design and no `back`
  shows it.
- **Sounds**: tile clacks from Kenney's Casino Audio (CC0) for picking, placing, turning, a pair taken, a shuffle and a
  win, as `createTileSounds` in `@johnmorrisdotca/jarajara/tile-sounds`, with the recordings as `/sounds`. Off until asked:
  nothing is fetched until the first sound plays, and every element takes `sound`.
- The demo has a Designs panel, a Sounds panel, a Sound switch and a design chooser for the game.

## 1.1.0 — 2026-10-01

Elements, viewers and backs: the tiles on any page, with the things done with tiles in front of you.

- **Seven custom elements**, defined by `@johnmorrisdotca/jarajara/element/define` (classes alone in `/element`):
  `<jarajara-tile>` (one tile, face up or down, turned by a tap, any size), `<jarajara-rack>` (tiles lined up: turn
  all or some over, sort, group by suit or kind, mix, take one out, put one in, mark, raise with a tap, spin),
  `<jarajara-layout>` (a game of Awase: free tiles, pairs, hint, shuffle, undo, a timer, limits on hints and shuffles,
  matching tiles ringed, and the layout lined up sorted by x, y and z), `<jarajara-table>` (Awase for two to four with
  computers), and the viewers `<jarajara-viewer>`, `<jarajara-group>` and `<jarajara-set>`.
- **Looking tiles up**: `findFace` finds a tile by its code, a name in English or Japanese or hand notation (`3p`,
  `7z`); `readTiles` and `writeNotation` read and write whole hands; `tileName`, `TILE_GROUPS`, `groupFaces` and
  `setInventory` name and count the set.
- **Arranging**: `arrangeTiles` (suit, rank, kind, code), `groupTiles`, `mixTiles`, and `sortSlots` to put a layout's
  slots in order by x, y and z.
- **Backs**: `tileBackSvg` draws five backs (jade, bamboo, blue, red, ink), recoloured or marked with a few letters.
- **Cloths**: the family's five (green, blue, red, black, wood) as a `cloth` setting on every element and on `layoutSvg`,
  and `clothVars`.
- `layoutSvg` also takes `matching`, `marked`, `hideBlocked`, `design`, `redFives` and `symbols: false`.
- The demo is a page of panels with browser tests in three browsers (`pnpm test:demo`).
- No existing deal changes: the deals and games itsutsu.com made are made again, exactly, on every build.


## 1.0.1 — 2026-10-01

Nothing that was exported has changed.

- An API reference page, `api.html` on the demo site: every export of every
  entry point with its signature and its doc comment, made from the source
  when the site is built, so it cannot fall behind the code. The README and
  the demo's header link to it, and a test holds it to the source.
## 1.0.0 — 2026-10-01

The first release: the tiles and Awase as played at itsutsu.com, taken out of
the site into their own package.

- The 144-tile set in 42 faces, each a letter; the two ways the flowers and
  seasons match; the free rule; the five layouts, Tiny to the Turtle.
- Dealing in reverse, so every deal can be cleared; shuffling what is left; a
  game written as text and played back.
- Awase, the matching solitaire, at three levels from a seed, with a check a
  server can trust; and Awase at a table of two to four, pairs that score, and
  a computer player.
- The faces drawn as SVG text, a tile on its own, and a whole layout stacked.
- Every deal and table game itsutsu.com made before the move is made again,
  exactly, on every build.
