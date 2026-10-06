# The elements

Seven custom elements put the tiles on any page: every attribute, method and event. Back to the [README](../README.md#elements).


Seven custom elements put the tiles on any page, with no framework. Load them once and write the tags:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/jarajara@1/dist/element-define.js"></script>

<jarajara-tile code="east" size="large" flip></jarajara-tile>
<jarajara-rack tiles="234m567p3456s11z77z" pick capacity="14"></jarajara-rack>
<jarajara-layout size="15" controls timer show-free cloth="green"></jarajara-layout>
```

Or `import "@johnmorrisdotca/jarajara/element/define"` in a bundle; `@johnmorrisdotca/jarajara/element` holds the classes alone, to extend or to define under other names. Importing either on a server is safe. Tiles and boards are never text-selectable, every element keeps one steady box, and each speaks English or Japanese (its own `lang`, or the page's, and it follows a language chooser).

| Element | What it is |
| --- | --- |
| `<jarajara-tile code="F">` | One tile, face up or down, any design and back, turned by a tap with `flip` (and `sound`); `marked`; `spin()` |
| `<jarajara-rack tiles="…">` | Tiles lined up in front of you: `hide()`, `show()`, `toggle(tiles?)`, `sort(order?)`, `group("suit" \| "kind")`, `ungroup()`, `unsort()`, `mixUp(seed?)`, `take(tile)`, `add(tile, at?)`, `replace()`, `lift()`, `lower()`, `mark()`, `unmark()`, `spin()`; a tap raises a tile with `pick` |
| `<jarajara-layout size="15">` | A game of Awase to play on a stacked layout: free tiles, pick two to take, hint, shuffle, undo, a timer, limits on hints and shuffles, the seven challenges, matching tiles ringed, and the same layout lined up sorted by x, y and z |
| `<jarajara-table players="3">` | Awase at a table of two to four, with computers in the seats that are not people's |
| `<jarajara-viewer query="east">` | A tile looked up by its code, a name in English or Japanese, or hand notation, with what it is |
| `<jarajara-group group="winds">` | A group of the set shown: a suit, `honours`, `bonus`, `terminals`, `simples`, … |
| `<jarajara-set>` | The whole set as an inventory: 42 faces and their counts, or all 144 tiles; given `tiles`, it counts what a hand holds |

Every attribute below is read again when it changes. Where a table says "as on `<jarajara-tile>`", it means that row's meaning.

## `<jarajara-tile>`

| Attribute | What it does |
| --- | --- |
| `code` | the tile: its letter (`F`), or any name it goes by (`east`, `red dragon`, `3p`, `三筒`) |
| `design` | `jarajara` unless said; the riichi sets are named in `TILE_DESIGNS` and fetched the first time they are asked for |
| `back` | `jade` unless said, `bamboo`, `blue`, `red` or `ink`, or a design's own back |
| `back-colour`, `mark` | recolour the back, or put a few letters across it, as `tileBackSvg` takes them |
| `face-down` | shows the back; the face is not in the page while it is down |
| `flip` | a tap, Enter or Space turns it over; a device that asks for less motion skips the turn |
| `marked` | a dot on its corner, seen face up and face down, to follow it as it moves |
| `red` | draws the red five of a design that has one, for a five |
| `size`, `width` | `small`, `medium` unless said, or `large`; or `width` in pixels; or the page's `--jarajara-tile-width` |
| `sound` | the turn makes a sound |
| `lang` | `ja` for Japanese names; the page's language unless said |

Each turn is a `jarajara-flip` event that bubbles, with `{ code, faceDown }`. `flip()` turns it, `spin(options?)` spins it where it lies, slowing to a stop as it was; `faceDown` and `tile` are read as properties.

## `<jarajara-rack>`

| Attribute | What it does |
| --- | --- |
| `tiles` | the tiles, as codes run together (`abcF`), as names (`east red-dragon`) or as hand notation (`123m456p789s11z`), in the order they were dealt |
| `face-down` | every tile shows its back |
| `turned` | the places (from 0, as dealt) of tiles that show the other side from the rest |
| `lifted` | the places of tiles picked up, raised above the row |
| `marked` | the places of tiles that carry a mark |
| `order` | `suit`, `rank`, `kind` or `code` puts the tiles in that order; left out they lie as dealt |
| `group` | `suit` or `kind` leaves a gap between groups of the sorted tiles |
| `pick` | a tap, Enter or Space picks a tile up or puts it down, and the arrow keys move between tiles; `pick="one"` lets only one be up at a time |
| `capacity` | how many tiles' room the rack keeps whatever it holds, so taking tiles out leaves it the size it was |
| `red-fives` | draws the first five of each suit red, in a design that has them |
| `sound` | the changes make their sounds: tiles turned, set down and picked up, shuffled |
| `design`, `back`, `back-colour`, `mark`, `size`, `width`, `lang` | as on `<jarajara-tile>` |
| `cloth` | lays the rack on a cloth: `green`, `blue`, `red`, `black` or `wood` |

A rack keeps the room of its widest arrangement, so grouping, sorting and closing the groups never change its size. The methods answer a promise that settles when the tiles have stopped moving: `hide(options?)`, `show(options?)` and `toggle(tiles?, options?)`, `sort(order?)`, `group(by?)`, `ungroup()`, `unsort()` and `mixUp(seed?)`, `take(tile)`, `add(tile, at?)` and `replace(tile, next)`, `lift(tiles?)`, `lower(tiles?)` and `liftToggle(tiles)`, `mark(tiles)`, `unmark(tiles?)` and `spin(tiles?, options?)`, and `deal(tiles)` for a new hand. A tile is named by its place as written (`0`, `3`) when a method wants one tile, or by a letter or name (`"F"`, `"east"`) for every tile of that face. Every change is a `jarajara-rack` event that bubbles, a tap that picks is `jarajara-pick` (`{ index, code, lifted }`), and a tile taken out is `jarajara-take`.

## `<jarajara-layout>`

| Attribute | What it does |
| --- | --- |
| `size` | the layout's width in tiles, which names it: 15, the Turtle, unless said |
| `level` | `easy`, `medium` unless said, or `hard`: how forgiving the deal is |
| `seed` | the deal's seed: the same seed deals the same tiles (a fresh one unless said) |
| `cells` | a position of your own to play from, one letter a slot and `.` for a slot left empty, instead of a deal |
| `show-free` | washes the blocked tiles darker so the free ones stand out |
| `show-matching` | rings the tiles that match the one chosen |
| `find` | pointing at a tile (a mouse) or choosing one lights every tile that matches it: a solid ring for one that could be taken with it now, a dashed ring for one that is held |
| `hints`, `shuffles` | how many a game may use: a number, `off` or `unlimited` |
| `undo` | `off` takes undo away |
| `challenge` | one of the seven: `gold`, `spark`, `rush`, `fortune`, `sand`, `purge` or `blackout`; the clock and the goal are worked out from the layout |
| `timer` | shows the clock: the time left in a challenge that has one, otherwise the time taken |
| `controls` | draws New deal, Undo, Hint and Shuffle buttons and the line that says how the game stands |
| `flippable` | with `controls`, a Flip button that turns the board's view through the four |
| `mirror` | `none` unless said, `horizontal`, `vertical` or `both`: the board seen from the other side, a view only (`flipView()` goes to the next) |
| `view`, `sort` | `view="lined"` draws the tiles lined up in a row, in the order `sort` gives: any of `x`, `y` and `z`, a `-` before one for the other way round (`"z y x"` unless said) |
| `box` | keeps the board in one steady box whatever the layout, scaled to fit: `landscape`, `portrait`, `square` or a ratio such as `3/2` |
| `static` | the tiles may be looked at but not played |
| `sound` | a tile chosen, a hint, a pair, an undo, a shuffle and a cleared layout make their sounds |
| `design`, `red-fives`, `lang`, `cloth` | as on the other elements |

Methods: `newDeal(seed?)`, `take(a, b)`, `hint()`, `shuffle()`, `undo()`, `restore(moves)` (plays a kept game back on the deal), `sortBy(keys)` and `flipView()`. Properties: `seed`, `cells`, `moves` (as `encodeMoves` writes them), `tilesLeft`, `score` and `run`, the game as an `AwaseRun`. Events, all bubbling: `jarajara-take` (`{ pair, codes, points, score, tilesLeft }`), `jarajara-shuffle`, `jarajara-stuck`, `jarajara-clear` (`{ moves, seconds, score, because }`, a game won), `jarajara-lost` (`{ because }`), `jarajara-hint` (`{ pair, found }`: `found` says whether the pair is the chosen tile's match, another pair, or any pair), `jarajara-undo` and `jarajara-deal` (`{ size, level, seed }`, which a page that keeps the game listens for). A board on a `cloth` sits in a frame inside the felt with one padding all round (`--jarajara-pad`); a hint with a tile chosen lights that tile's match first.

## `<jarajara-table>`

| Attribute | What it does |
| --- | --- |
| `players` | how many sit at the table, two to four (2 unless said) |
| `people` | how many of the seats are people's, the first ones; the rest are computers (1 unless said) |
| `names` | the people's names, separated by commas; a seat with none is called by its wind |
| `size`, `level`, `seed` | as on `<jarajara-layout>`; the Castle (10) unless said |
| `delay` | how long a computer thinks before it takes its pair, in milliseconds (700 unless said) |
| `show-free` | washes the blocked tiles darker |
| `mirror`, `box` | as on `<jarajara-layout>` |
| `sound` | each pair taken, and a game won, make their sounds |
| `design`, `lang`, `cloth` | as on the other elements |

`deal(seed?)` deals again, and the `table` property holds the game as `encodeTable` keeps it. Each pair taken is a `jarajara-table` event that bubbles, with `{ seat, pair, codes, points, scores, over, winners }`.

## `<jarajara-viewer>`, `<jarajara-group>` and `<jarajara-set>`

| Attribute | On | What it does |
| --- | --- | --- |
| `query` | viewer | what to look up: a code, any name `findFace` knows, a group, or a list of tiles |
| `editable` | viewer | adds a box to type a query into; `lookup(text)` looks one up |
| `group` | group | a group `TILE_GROUPS` names: `winds` unless said |
| `tiles` | group, set | tiles of your own, as codes, names or hand notation, in place of `group`; on a set, what to count |
| `mode` | set | `faces` unless said draws each face once with its count; `tiles` draws every tile of the set |
| `captions`, `copies`, `heading` | group (`captions` on a set too) | `off` takes the names, the counts or the group's name away |
| `face-down`, `flip` | group | draws the tiles face down, to be turned over by a tap, to learn them |
| `red-fives` | group, set | draws the first five of each suit red, in a design that has them |
| `design`, `back`, `back-colour`, `mark`, `size`, `width`, `lang`, `cloth` | all three | as on `<jarajara-tile>`; a viewer's `width` is the big tile's, large unless said |

A tap on a tile is a `jarajara-view` event, `{ code }` (and `query` on a viewer).

Tiles in a rack, a group and a set are `<jarajara-tile>` elements, so a page can style or find them. A tile turns as a block tipping over on its edge, its thickness showing, and sets down on its back. Every action of a tile, a rack and a board makes its sound from the element's own method when the element has `sound` (turning, sorting, grouping, mixing, raising, lowering, marking, spinning, a hint, a pair, an undo, a shuffle, a win), never more than `MOST_SOUNDING` clicks at once; `setPageSounds` gives the page's own player, or a test's.

A table, a rack, a layout, a group, a set and a viewer all take `cloth`: `green`, `blue`, `red`, `black` or `wood`, the family's five, which a page can follow from the demo header's `family-cloth` event.

