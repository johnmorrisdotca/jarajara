# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.6.0] - 2026-10-05

Two mega layouts, for more than one set of tiles. No deal, layout, rule or saved game that existed changes (a test plays every deal
itsutsu.com made again, and the day's game is chosen among the same layouts it was), and nothing that was exported changes.

### Added

- **The Wall 長城** (20 across, 288 tiles, 5 layers) and **the Palace 宮殿** (26 across, 576 tiles, 6 layers), in `MEGA_LAYOUTS` and so in
  `ALL_LAYOUTS`. The Wall is a stretch of the Great Wall: a walkway along the top of a wall four tiles thick, a watchtower at each end
  and a gate tower that rises in the middle. The Palace is a wall round a courtyard with a gate in it, a tower at each corner and one
  either side of the gate, and the great hall in the middle climbing in six steps. Each is drawn from scratch, is the same seen from
  the left as from the right, and is dealt from as many sets of 144 tiles as it needs: two and four.
- **`setPairs(rule, random, sets)`**: the pairs of that many sets (one unless said, which is exactly what it was). Under the usual
  rule a flower or a season is dealt once however many sets there are, so a deal still says which rule it was made under
  (`bonusRuleOf`); the bonus tiles the further sets would have held are four more pairs of ordinary tiles each.
- **`clearShare`** (in `@johnmorrisdotca/jarajara/awase`): how far a player taking any free pair at random gets, as a share of the
  tiles. A deal of more than one set is ranked by it instead of by `clearRate`, since a random player almost never clears one (the
  Wall about one game in fifty), and the share tells a forgiving deal from an unforgiving one in sixteen games.

### Changed

- **A deal's random play-outs are quick.** `clearRate` keeps the free tiles as they change and finds the pair taken by counting,
  instead of listing every free pair afresh after each one: it makes exactly the choices it made, and a test holds it to the plain way
  on every layout. A deal of the Turtle takes 5 ms (it took 60), the Wall 10 ms and the Palace 35 ms (it would have been over two
  seconds), on a laptop; four times slower again on a phone's processor.
- A table of computers works on the mega layouts: a turn of the Palace takes a few hundredths of a second.
- The README, `docs/strings-ja.md`, the layout template, the demo's gallery and its tests know the two new layouts.

### Not changed

- `dailyAwase` never picks a mega layout, so the day's game is what it was.
- The element draws every tile as a solid block, which is the cost of a 576-tile layout: a pair taken redraws in about 80 ms on a laptop
  (about 340 ms with the processor slowed fourfold), and its tiles are about 13 pixels across on a 390-pixel page. A page showing the
  Palace to a phone should give the board room to zoom and pan, as itsutsu.com does.

## [1.5.0] - 2026-10-01

A command line, and a framework check. No deal, layout, rule or saved game changes (a test plays every deal itsutsu.com made
again), and nothing that was exported changes. The only behaviour that changes is what assigning to a tag's property of an attribute's name did (see Fixed).

### Added

- **A command line**, `jarajara`: `layouts`, `deal` (a deal drawn layer by layer, with its answer), `daily` (the day's game),
  `check <moves>` (plays a solve on a deal and says whether it clears it, from a seed or from the tiles written out, with
  `--stdin`), `play` (computers at a table to the end) and `tile <name>` (a tile by name, code, hand notation or group). It
  speaks English and Japanese (`--lang`, or the environment's), prints JSON with `--json`, and exits 0, 1 or 2. It is `runCli` in
  `src/cli.ts`, a pure function tested as data, run as a child process by `pnpm test:cli` on Linux, macOS and Windows, on Node 22
  and 24, and installed from the packed tarball by `pnpm test:package`.
- **`pnpm test:frameworks`**: builds a React, a Vue, a Svelte, an Angular and a plain page from the packed tarball, each with a
  layout, a flippable tile and a listener, opens each in Chromium and WebKit, plays the layout to its end and taps the tile. It
  runs in CI.
- **`docs/strings-ja.md`**: every word of the tags and of the command line beside its Japanese, and the layouts' Japanese names,
  made by `pnpm docs:make` and held by a test. `src/docs.test.js` holds the README to the code: the layouts, the challenges, the
  tags' attributes, the properties, the limits, the command line's output, the family list, the links and the community files.
- The README gains Features, Use it in your project (with React, Vue, Svelte and Angular recipes), the command line, Theming,
  Limits, Browser support, Accessibility, Languages, Roadmap, where it comes from and the sixteen-package family. An issue template
  to suggest a layout, one to add a project, and a pull request template; `SECURITY.md` and `CODE_OF_CONDUCT.md` are the family's
  master text, kept in `scripts/community` and held equal by a test.

### Changed

- **Node 22 or later**: `engines` says `>=22`, as CI has always run it (on 22 and 24). The package job now runs on both.
- The changelog follows Keep a Changelog.

### Fixed

- **A framework can set an attribute that is also a method or a read-only value.** React 19, Vue 3 and Svelte 5 set a property on
  a custom element that has one of the attribute's name. `<jarajara-tile flip>` therefore replaced `flip()` with `true` and left
  the tile unflippable; `group` and `mark` on a rack and `undo` on a layout did the same; and `seed`, `cells` and `mirror` on a layout
  and `lifted` on a rack threw, as did a string for a rack's `tiles`. Now each is an accessor that sets the attribute, the methods
  still work, and a rack's `tiles` takes a string or a list (`e2e/properties.demo.mjs`).
- The README and `docs/credits.md` said the riichi designs were about 118 kB each; they are over a hundred kilobytes.

## [1.4.0] - 2026-10-01

How the tiles look, how the board sits, and what the board does for the player. No deal, layout, rule or saved game
changes (a test plays every deal itsutsu.com made again); the drawing's calls keep working, with options added.

### Added

- **Find.** `matchesOf(geometry, cells, rule, slot)` gives every tile that matches one, told apart by whether it could be taken
  with it now. `find` on `<jarajara-layout>` lights them when a mouse points at a tile or one is chosen: a solid ring for a free
  match, a dashed ring for a held one, in a colour that is neither the chosen ring's nor the hint's. `layoutSvg`'s `found` draws them.
- **The board seen from the other side.** `mirror` (`none`, `horizontal`, `vertical`, `both`) on `layoutSvg` and the elements, and a Flip
  button (`flippable`). A view only: slots, what is free, hints and replays are the layout's own, and the thickness, the lift and
  the shadows follow the view. Quarter-turns and free rotation are not built; `docs/LOOK.md` says what they would take.
- `docs/LOOK.md` records what the established mahjong solitaires do (Mah, KMahjongg, mahseum and others) and what was taken from it.

### Changed

- **Tiles are solid blocks.** An ivory face over a back plate, its thickness showing on two sides (the ivory layer nearest the
  face, the back plate's own colour beyond), each layer of a stack lifted by exactly that thickness, a soft shadow that reaches
  further the higher the tile, and a seam and a raised-edge line round every face. `tileSvg` and `tileBackSvg` draw the block
  (`flat: true` is the old sliver, `bare: true` the face alone); the new `blockColours`, `blockSvg`, `shadowSvg`,
  `faceEdgeSvg`, `TILE_DEPTH`, `TILE_BOX` and `backBase` are in `/faces`. A tile's picture is now 37 by 47 (`TILE_BOX`,
  `viewBox="-6 -1 37 47"`), not 32 by 42. Every design shows where each tile ends, riichi black and regular included: a design may
  say its back plate's colour (`colours.body`).
- **Turning a tile is a block tipping over on its edge.** `<jarajara-tile>` and `<jarajara-rack>` are real 3D blocks: a face and a
  back a thickness apart with four edges between, lifted as they pass upright and set down on the back, which is the colour of the
  back chosen. Reduced motion skips the turn.
- **One steady frame, centred on what is drawn.** `layoutFrame(size, { mirror, margin })` is the box that holds a layout's solid
  tiles, their thickness and their layer lift, and `layoutSvg(..., { margin })` draws on it. A board on a cloth sits in an inner
  frame with one padding all round, scaled into a box that does not change with the layout (`box="landscape"`, `--jarajara-box`).
- **A hint looks first for the chosen tile's match.** `hintFor(geometry, cells, rule, chosen?)` answers `match`, `other` (the chosen
  tile has none free: another pair), `any` or `none`; `runHint(run, chosen?)` and the element's `hint()` use it, and
  `jarajara-hint` says which it found. `hintPair` is as it was.
- **The demo is one screen, not nine.** The board is one fixed box that fits the window with its controls, the options are the family's
  label-and-chips rows, the panels under it are tabs (Tiles, Rack, Viewers, Layouts, Table, Designs, Rules), and the gallery's
  cards are one size with each layout scaled into the same thumbnail. The page is a fifth as tall.

### Fixed

- **Every action has its sound.** A rack's Face down and Face up were silent (an attribute with no value looked unchanged to the
  rack, so it also told a caller its change was over at once); they and the rest of the rack's actions, the tile's spin and the board's
  hint, undo and new deal now sound from the element's own method, with `sound` on, never more than `MOST_SOUNDING` clicks at once.
  `rack.deal(tiles)` deals a new hand; `setPageSounds(player)` gives the page's own player.

## [1.3.0] - 2026-10-01

More layouts, and challenges and options for Awase. No existing deal changes: sizes 4, 8, 9, 10 and 15 and every deal
made on them are exactly as they were (a test plays every deal itsutsu.com made again).

### Added

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

## [1.2.0] - 2026-10-01

A second design, and sounds.

### Added

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

## [1.1.0] - 2026-10-01

Elements, viewers and backs: the tiles on any page, with the things done with tiles in front of you.

### Added

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

## [1.0.1] - 2026-10-01

Nothing that was exported has changed.

### Added

- An API reference page, `api.html` on the demo site: every export of every
  entry point with its signature and its doc comment, made from the source
  when the site is built, so it cannot fall behind the code. The README and
  the demo's header link to it, and a test holds it to the source.

## [1.0.0] - 2026-10-01

The first release: the tiles and Awase as played at itsutsu.com, taken out of
the site into their own package.

### Added

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
