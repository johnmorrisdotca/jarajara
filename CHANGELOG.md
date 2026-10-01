# Changelog

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
