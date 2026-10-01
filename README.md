<h1 align="center">Jarajara <sub>ジャラジャラ</sub></h1>

<p align="center"><strong>Mahjong tiles for JavaScript and TypeScript.</strong><br>
The 144-tile set in 42 faces, drawn as SVG, with backs and cloths; custom elements for one tile, a rack, a layout to play, a table and viewers of the set; the stacked layouts tile games are played on; which tiles are free, which match, dealing and shuffling; a game written as text; Awase, the matching solitaire, alone or at a table of two to four with a computer player; and a command line. Seeded, and every deal can be cleared. No dependencies.</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/jarajara/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/jarajara/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/jarajara"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/jarajara?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/jarajara/"><strong>Play Awase →</strong></a> · <a href="https://johnmorrisdotca.github.io/jarajara/api.html">API reference</a></p>

<p align="center">
  <img src="docs/desktop.jpg" alt="Awase on the Turtle, a layout of 144 solid mahjong tiles stacked five layers high, centred in a frame on a green cloth with six pairs already taken: 132 tiles left, 12 pairs to take, the New deal, Undo, Hint, Shuffle and Flip buttons, and under it the layout, challenge, level, design, view, hints, shuffles, undo and aids options" width="620">
  <img src="docs/phone.jpg" alt="Awase on Fuji on a phone in dark mode, in Japanese: the free tiles lit and the blocked ones washed grey, 84 tiles left and 11 pairs to take" width="200">
</p>

Jarajara is the tiles; the games are played on them. The first is **Awase**
(合わせ), the matching solitaire many know as Mahjong Solitaire or Shanghai:
take the tiles away two at a time, two that match and that are both free,
until the layout is clear. It is played at
[itsutsu.com](https://itsutsu.com/games/mahjong), which this package was taken
out of, and in [the demo](https://johnmorrisdotca.github.io/jarajara/), with
nothing to install.

## In 30 seconds

```sh
npm install @johnmorrisdotca/jarajara
```

```ts
import { canTake, freePairs, geometryOf, isCleared, layoutFor, takePair } from "@johnmorrisdotca/jarajara";
import { checkAwase, generateAwase } from "@johnmorrisdotca/jarajara/awase";
import { layoutSvg } from "@johnmorrisdotca/jarajara/faces";

const deal = generateAwase(15, "medium", 12345);   // the Turtle, 144 tiles, from seed 12345
const geometry = geometryOf(layoutFor(15)!);       // what stands on and beside every slot, worked out once

let cells = deal.givens;                           // a face letter a slot, "." for one taken
const [a, b] = freePairs(geometry, cells, "group")[0]!;
if (canTake(geometry, cells, "group", a, b)) cells = takePair(cells, a, b);

document.querySelector("#board")!.innerHTML = layoutSvg(15, cells, { showFree: true })!;
isCleared(cells);                                  // not yet
checkAwase(15, deal.givens, deal.solution);        // { ok: true }: the deal's own answer clears it
```

And in a page, a game to play, with nothing else to set up:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/jarajara@1/dist/element-define.js"></script>
<jarajara-layout size="15" level="medium" seed="12345" controls timer cloth="green"></jarajara-layout>
```

Or from a terminal, with no code at all:

```sh
npx @johnmorrisdotca/jarajara deal --layout turtle --seed 12345
```

## Who it is for

- **Game sites and apps** that want tiles with the rules already right: a
  deal everybody plays alike from a seed, a finished game a server can check
  by playing it, and the faces drawn as text that goes into any page.
- **Anyone making a tile game of their own**, who wants the set, the free
  rule, the layouts and the drawing, and to write only the game.
- **Pages that just want the tiles**: a tile, a rack to sort and mix, a table
  of the whole set or a tile looked up by name, as one tag each, in English or
  Japanese.
- **People at a terminal**, who want to deal, check or look something up without
  writing code: [the command line](#the-command-line).

## Features

- **The whole set.** 144 tiles in 42 faces, each written as one letter, so a layout is a string; names in English and Japanese; hands written in the notation riichi players use (`123m456p`).
- **Eleven stacked layouts**, from the Turtle to a Dragon, each with the geometry of what lies on and beside every slot worked out once.
- **Awase, always clearable.** A deal is laid in reverse from a seed, so every deal can be cleared, at three levels. A finished game is written as text and checked by playing it, with no search, so a server can trust it.
- **Options, seven challenges and the day's game.** Hints, shuffles and undo given, limited or taken away; a clock and a goal laid over a deal; and `dailyAwase(date)`, the same game for everybody from the date alone.
- **Awase at a table** of two to four, with a computer in any seat.
- **Solid tiles drawn as SVG text**, in two designs (Jarajara's own, and FluffyStuff's riichi tiles), with five backs and the family's five cloths; a layout seen from the other side, and Find, which lights every tile that matches the one you point at.
- **Seven custom elements**: `<jarajara-tile>`, `<jarajara-rack>`, `<jarajara-layout>`, `<jarajara-table>`, `<jarajara-viewer>`, `<jarajara-group>` and `<jarajara-set>`, with no framework needed and recipes for React, Vue, Svelte and Angular.
- **Sounds, off until asked**: tile clacks, fetched the first time one plays.
- **A command line** that deals, checks a solve, gives the day's game, looks tiles up and plays computers at a table.
- **English and Japanese**, in the tags, the command line and the demo.
- **No dependencies**, and every function is pure: it returns new values and never changes what it was given.

## Use it in your project

Jarajara is four things, each usable without the others: **the rules** (the set, the layouts, free tiles, matching, dealing, Awase and the table, as plain functions over strings), **the drawing** (SVG text), **the tags** (custom elements that draw and play them in a page) and **the command line**. The table under [API](#api) says which entry holds which.

### 1. The API alone, on a server

```ts
import { generateAwase, checkAwase } from "@johnmorrisdotca/jarajara/awase";

const { givens } = generateAwase(15, "medium", 12345);   // send `givens` to the browser; keep the seed and the answer
checkAwase(15, givens, answerFromThePlayer);              // { ok: true } or { ok: false, reason }, with no search
```

Importing the main entry, `/awase` or `/table` on a server is safe: they touch no page. So are `/faces` (it makes strings) and `/element` (the classes extend nothing where there is no page).

### 2. One tag, no bundler

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/jarajara@1/dist/element-define.js"></script>
<jarajara-tile code="east" size="large" flip></jarajara-tile>
<jarajara-layout id="game" size="15" controls></jarajara-layout>
<script>
  document.getElementById("game").addEventListener("jarajara-clear", (event) => console.log(event.detail.moves));
</script>
```

### 3. A bundler, and a framework

`import "@johnmorrisdotca/jarajara/element/define"` once, in code that runs in the browser, and the seven tags are tags like any other. They draw inside a shadow root, speak through bubbling DOM events (`jarajara-take`, `jarajara-clear` and the rest, each with a `detail`), and are set by attributes, each read again when it changes.

```jsx
// React 19
import { useEffect, useRef } from "react";
import "@johnmorrisdotca/jarajara/element/define";

export function Game({ seed, onCleared }) {
  const game = useRef(null);
  useEffect(() => {
    const listen = (event) => onCleared(event.detail.moves);
    game.current?.addEventListener("jarajara-clear", listen);
    return () => game.current?.removeEventListener("jarajara-clear", listen);
  }, [onCleared]);
  return <jarajara-layout ref={game} size="15" level="medium" seed={seed} controls />;
}
```

```vue
<!-- Vue 3: tell the compiler the tags are not Vue components -->
<script setup>
import "@johnmorrisdotca/jarajara/element/define";
defineProps({ seed: Number });
</script>
<template>
  <jarajara-layout size="15" level="medium" :seed="seed" controls @jarajara-clear="(event) => console.log(event.detail.moves)" />
</template>
<!-- in vite.config: vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("jarajara-") } } }) -->
```

```svelte
<!-- Svelte 5 -->
<script>
  import "@johnmorrisdotca/jarajara/element/define";
  let { seed } = $props();
  let game;
  $effect(() => {
    const listen = (event) => console.log(event.detail.moves);
    game.addEventListener("jarajara-clear", listen);
    return () => game.removeEventListener("jarajara-clear", listen);
  });
</script>
<jarajara-layout bind:this={game} size="15" level="medium" seed={seed} controls></jarajara-layout>
```

```ts
// Angular: a standalone component with CUSTOM_ELEMENTS_SCHEMA
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import "@johnmorrisdotca/jarajara/element/define";

@Component({
  selector: "app-game",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<jarajara-layout size="15" level="medium" seed="12345" controls (jarajara-clear)="cleared($event)"></jarajara-layout>`,
})
export class Game {
  cleared(event: Event) { console.log((event as CustomEvent).detail.moves); }
}
```

In Next.js or any server-rendering framework, import the define entry from a client component, so the tags are defined in the browser.

React, Vue and Svelte set a **property** on a custom element that has one of the attribute's name, so `<jarajara-tile flip>` would be `tile.flip = true`. Four names are methods too (`flip` on a tile, `group` and `mark` on a rack, `undo` on a layout) and three are read-only values (`seed`, `cells` and `mirror` on a layout): assigning one sets the attribute, and the method still works, so these all do what they say in every framework. `pnpm test:frameworks` builds a page in each of the four and a plain one from the packed tarball, with a layout, a flippable tile and a listener, opens each in Chromium and WebKit, plays the layout to its end and taps the tile, and `e2e/properties.demo.mjs` holds the assignments.

### What a developer gets

- **Typed results**, with a doc comment on every export. Every function is pure and returns new values.
- **No dependencies.** ES modules, an entry per concern, and `sideEffects` set so that only the define entry has an effect.
- **Where it runs.** See [Browser support](#browser-support); on a server, Node 22 or later.

## The tiles

Three suits of nine, characters 萬子, circles 筒子 and bamboo 索子, four of
each; the four winds and the three dragons, four of each; and one each of the
four flowers and the four seasons. 144 tiles in 42 faces, each written as one
letter so a whole layout is a string:

| Letters | Faces |
| --- | --- |
| `a`–`i` | characters 1–9 |
| `j`–`r` | circles 1–9 |
| `s`–`A` | bamboo 1–9 |
| `B`–`E` | east, south, west, north winds |
| `F`–`H` | red, green, white dragons |
| `I`–`L` | plum, orchid, chrysanthemum, bamboo (flowers) |
| `M`–`P` | spring, summer, autumn, winter (seasons) |

Two tiles match when they are the same face. The flowers and seasons match in
one of two ways, the bonus rule: `group`, the usual, where any flower takes any
flower and any season any season, or `same`, where only an identical tile
does and the deal holds them in identical pairs.

A tile is **free** when nothing lies on it and it has an open side, left or
right. Only free tiles may be taken.

## The layouts

| Size | Name | Tiles | Layers |
| --- | --- | --- | --- |
| 4 | Tiny | 8 | 3 |
| 8 | Torii | 64 | 3 |
| 9 | Fuji | 100 | 5 |
| 10 | Castle | 120 | 5 |
| 11 | Pagoda | 94 | 4 |
| 12 | Fortress | 116 | 3 |
| 13 | Pyramid | 142 | 4 |
| 14 | Bridge | 84 | 4 |
| 15 | Turtle | 144 | 5 |
| 16 | Butterfly | 112 | 4 |
| 17 | Dragon | 142 | 4 |

The Turtle is the layout the solitaire has been played on since it was first
published. A layout's size is its width in tiles, and names it. Tiny is for
tests, cleared in four pairs. `MAHJONG_LAYOUTS` holds the first five, which
never change (itsutsu.com's kept games are made on them); the other six are
Jarajara's own drawings of shapes anyone may draw, in `MORE_LAYOUTS`, and
`ALL_LAYOUTS` holds them all. Every one is dealt and cleared by the same
reverse dealing, and a test deals each at every level from several seeds and
plays its own answer out.

## Awase

```ts
import { checkAwase, freshAwaseSeed, generateAwase } from "@johnmorrisdotca/jarajara/awase";
```

A deal is laid in reverse, pair by pair onto slots that would be free, so
**every deal can be cleared**. Its level is how forgiving it is: five deals are
laid from the seed and each played out by a player taking any free pair at
random; `easy` is the one that player clears most often, `hard` the one it
clears least. When no pair is left, the tiles still on the layout may be
shuffled where they lie, drawn from the deal so a replay draws the same.

A solve is written as text: each pair its two slots in base 36 (`"0a1c"`), a
shuffle `*`. `checkAwase` plays it on the deal and asks that the layout ends
empty: a few thousand steps, no search, safe to run on a server.

### Options and challenges

The same deal can be played for something else. Hints, shuffles and undo can be given, limited or taken away, and seven
challenges lay a goal and a clock over a deal. None of it changes a deal, so every one can still be cleared.

```ts
import { dailyAwase, generateAwase, readRun, runHint, runTake, startRun } from "@johnmorrisdotca/jarajara/awase";

const deal = generateAwase(15, "medium", 12345);
let run = startRun(deal, { challenge: "rush", hints: 3, shuffles: 1 });   // a game: plain data
const hint = runHint(run);                                                // { run, pair } or null once the hints are spent
run = runTake(hint!.run, ...hint!.pair, Date.now()) ?? run;               // the new game, or null where the rules say no
readRun(run, Date.now());                                                 // { state, because, remainingMs, goal, multiplier, ... }
dailyAwase("2026-10-01");                                                 // today's layout, level, seed and challenge, from the date alone
```

| Challenge | What it asks |
| --- | --- |
| `gold` | Take a pair of the gold face, four tiles ringed in gold. Hints and undo are allowed |
| `spark` | Clear the layout before time runs out, 2.5 s a tile. A pair of the spark face adds 20 s and sends the spark on. No undo |
| `rush` | Make the goal number of pairs (30, fewer on a small layout) in three minutes; the layout need not be cleared |
| `fortune` | Reach the goal score before time runs out; pairs within five seconds of each other build a multiplier up to three |
| `sand` | Start with 45 s, every pair adds 5 s (a quick one 1 s more), to a limit of a minute; clear the layout in time |
| `purge` | Take every tile of the marked group before time runs out |
| `blackout` | Only the free tiles show their faces; the covered ones are drawn blank (`hideBlocked`). Hints are allowed, undo is not |

A run has no clock of its own: every move is given `at`, milliseconds on any clock you keep, so a run is testable and a server
may replay one. The challenges come from the ideas of Mah's challenge modes (see [docs/credits.md](docs/credits.md)); the
code, the numbers and the layouts are Jarajara's own. `<jarajara-layout challenge="spark" timer controls>` plays them, its
clock counting down.

## Awase at a table

```ts
import { computerPair, playAtTable, readTable, startTable } from "@johnmorrisdotca/jarajara/table";

let table = startTable(generateAwase(15, "medium", 7), [{ name: "Ann" }, { name: "Computer", computer: true }]);
const pair = computerPair(table)!;                 // the computer's choice for whoever is to move
table = playAtTable(table, pair[0], pair[1])!.table;
readTable(table);                                  // whose turn, the scores, the pairs taken, whether it is over
```

Two to four players share one layout and take turns, each taking one free
pair. Every pair scores: the plain suit tiles one, the ones and nines two, a
wind three, a dragon four, and a flower or season pair two and another turn.
When the player to move has no pair, the tiles are shuffled and they go on.
Most points when the layout is cleared wins. Everything is face up, so one
device can be passed round with no cover screen.

## Drawing

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
[docs/LOOK.md](docs/LOOK.md)). An ivory face lies over a back plate with thickness showing on two sides: the near layer of
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

### Hints and Find

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

## Elements

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

#### `<jarajara-tile>`

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

#### `<jarajara-rack>`

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

#### `<jarajara-layout>`

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

#### `<jarajara-table>`

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

#### `<jarajara-viewer>`, `<jarajara-group>` and `<jarajara-set>`

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

## Designs

Jarajara's own tiles are the default and cost nothing extra. A second design is FluffyStuff's riichi tiles (public
domain, CC0), regular and black, with their own backs and the red fives; they draw no flowers or seasons, so those stay
Jarajara's own within them. Each is fetched the first time it is asked for, so a page that stays with the default never
loads them.

```html
<jarajara-tile code="F" design="riichi"></jarajara-tile>
<jarajara-layout size="9" design="riichi-black" red-fives></jarajara-layout>
<jarajara-rack tiles="123m055p" design="riichi" red-fives></jarajara-rack>
```

```ts
import { loadTileDesign, tileSvg, layoutSvg } from "@johnmorrisdotca/jarajara/faces";

const design = await loadTileDesign("riichi");     // or "riichi-black"; "jarajara" is always at hand
tileSvg("e", { design, red: true });                // the red five of characters
layoutSvg(9, cells, { design, redFives: true });   // the first five of each suit, in slot order, is red
```

`TILE_DESIGNS` lists them. A design's own back is named like the design (`back="riichi"`), and an element given a
design and no `back` shows that design's own. Where the drawings come from and under what licence is in
[docs/credits.md](docs/credits.md).

## Sounds

```ts
import { createTileSounds } from "@johnmorrisdotca/jarajara/tile-sounds";

const sounds = createTileSounds();            // nothing fetched, no audio context, until the first sound
sounds.play("shuffle");                       // pick, place, flip, pair, shuffle, win
sounds.play("place", { count: 13, delay: 900 });
```

Tile clacks cut from Kenney's Casino Audio (CC0), loaded the first time one is played; where they cannot be loaded or
decoded, a short click made in the browser stands in, and a platform with no audio is silent without an error. Every
element takes `sound` and is silent without it: every action of a tile and a rack (turned, spun, sorted, grouped, mixed, raised,
lowered, marked, taken out, put in, dealt), and of a board a tile chosen, a hint, a pair taken, an undo, a shuffle and a cleared layout, a
pair at a table. The recordings are `@johnmorrisdotca/jarajara/sounds`,
tens of kilobytes as text.

## Looking tiles up

```ts
import { findFace, findFaces, readTiles, writeNotation, setInventory, groupFaces, tileName } from "@johnmorrisdotca/jarajara";

findFace("three circles")?.code;     // "l"
findFace("三筒")?.code;              // "l"
findFace("7z")?.code;                // "F", the red dragon, in the notation riichi hands are written in
readTiles("123m456p east plum");     // ["a","b","c","m","n","o","B","I"]
writeNotation(["a", "b", "c", "B"]); // "123m1z"
tileName("B", "ja");                 // "東"
setInventory();                      // 42 faces, each with how many of it the 144 tiles hold
```

The notation is `123m` characters, `123p` circles, `123s` bamboo, `1z`–`4z` the winds and `5z`–`7z` white, green and red dragons, and Jarajara's own `1f` flowers and `1t` seasons. `0m`, `0p` and `0s` read as fives.

## Sorting and grouping tiles

```ts
import { arrangeTiles, groupTiles, mixTiles, sortSlots, readSlotKeys } from "@johnmorrisdotca/jarajara";

arrangeTiles(hand, "suit");          // "suit", "rank", "kind", "code" or "dealt"
groupTiles(hand, "kind");            // [numbers, honours, bonus tiles]
mixTiles(hand, 42);                  // another order, the same one for the same seed
sortSlots(layout, ["-z", "x", "y"]); // a layout's slots from the top of the stacks, then across
```

## The command line

```sh
npx @johnmorrisdotca/jarajara --help       # or: npm install -g @johnmorrisdotca/jarajara, then `jarajara`
```

For a terminal, a script or a teacher's handout: the same deals, checks and tiles as the functions, with nothing to write. Every deal comes from its seed, so the same command prints the same tiles on every machine.

```text
$ jarajara layouts
 4  tiny         8 tiles, 3 layers
 8  torii       64 tiles, 3 layers
 9  fuji       100 tiles, 5 layers
10  castle     120 tiles, 5 layers
11  pagoda      94 tiles, 4 layers
12  fortress   116 tiles, 3 layers
13  pyramid    142 tiles, 4 layers
14  bridge      84 tiles, 4 layers
15  turtle     144 tiles, 5 layers
16  butterfly  112 tiles, 4 layers
17  dragon     142 tiles, 4 layers
$ jarajara deal --layout 4 --seed 7
Tiny, 8 tiles, medium, seed 7, usual rule

Layer 1
s u F F

Layer 2
 m s u

Layer 3
   m

Tiles: suFFmsum
One way to clear it: 0704000506010302
$ jarajara check 0704000506010302 --layout 4 --seed 7
Cleared: 4 pairs and 0 shuffles take every tile.
$ jarajara daily --date 2026-10-01
2026-10-01: Pyramid, hard, seed 473803850, challenge gold
jarajara deal --layout 13 --level hard --seed 473803850
$ jarajara tile three circles
l  3 of circles  三筒  Circles 3, 4 in the set, written 3p
$ jarajara play --players 3 --layout 8 --seed 5
Awase at a table of 3: Torii, medium, seed 5. 32 pairs taken, 0 shuffles.
Computer 1: 20 points, 11 pairs
Computer 2: 17 points, 11 pairs
Computer 3: 18 points, 10 pairs
Winner: Computer 1.
```

A deal is drawn one layer at a time, bottom first. A tile is a face letter (see [The tiles](#the-tiles)) where its top left corner is, two characters across and two lines down, so a tile set half a tile over sits half a tile over. `Tiles:` is the deal as `generateAwase` makes it and `One way to clear it:` its answer, which is what `check` takes.

| Command | What it does |
| --- | --- |
| `layouts` | the layouts: width, name, tiles and layers |
| `deal` | makes a deal of Awase and prints it layer by layer, with its tiles and one way to clear it |
| `daily` | the day's game, `dailyAwase(date)`, with the `deal` command that makes it |
| `check <moves>` | plays a solve on a deal (`--seed` and `--level`, or `--givens`) and says whether it clears it; `--stdin` reads the moves from standard input |
| `play` | computers play Awase at a table to the end, with their points, and the game as `encodeTable` keeps it under `--json` |
| `tile <name>` | looks a tile up by a name in English or Japanese, a code, hand notation, or the name of a group of tiles |

| Option | What it does |
| --- | --- |
| `-l`, `--layout` | a layout by its width (`15`) or its name (`turtle`, `亀`); the Turtle if left out |
| `--level` | `easy`, `medium` or `hard`; `medium` if left out |
| `-s`, `--seed` | a whole number from 1 to 2,147,483,647; drawn, and said on standard error, if left out |
| `--rule` | `group` or `same`: how flowers and seasons match, for a seed the command draws |
| `-p`, `--players` | at the table, 2 to 4; 2 if left out |
| `--date` | the day, as `2026-10-01`; today, in UTC, if left out |
| `--givens` | `check`: a deal written as text, instead of a seed |
| `--stdin` | `check`: read the moves from standard input |
| `-j`, `--json` | print JSON, for a script |
| `--lang` | `en` or `ja`; left out, the environment's (`LC_ALL`, `LC_MESSAGES`, `LANG`), then the system's |
| `-h`, `--help`, `-v`, `--version` | the usage, and the version |

The exit code is 0 when all went well, 1 when what was asked for could not be done (a solve that does not clear its deal, a tile with no such name) and 2 when the command itself was wrong. It speaks English and Japanese. The command line is `runCli(args, surroundings)` in `src/cli.ts`, a pure function from arguments to what to print and the code to exit with, which is how its tests run it; `bin/jarajara.mjs` hands it the real process, and `pnpm test:cli` runs the built command as a child process on whatever system it is on.

## API

The [API reference](https://johnmorrisdotca.github.io/jarajara/api.html) lists every export of every entry point with its signature and its doc comment. It is made from the source by `pnpm site`, so it cannot fall behind the code.

| Import | What it holds |
| --- | --- |
| `@johnmorrisdotca/jarajara` | the set (`MAHJONG_FACES`, `faceOf`, `tilesMatch`, `matchClass`, `bonusRuleOf`, `setPairs`, `pairPoints`), names and lookup (`faceWords`, `tileName`, `findFace`, `findFaces`, `readTiles`, `writeTiles`, `readNotation`, `writeNotation`, `TILE_GROUPS`, `groupFaces`, `setInventory`, `copiesOf`, `countTiles`), arranging (`arrangeTiles`, `arrangeIndexes`, `groupTiles`, `mixTiles`, `sortSlots`, `readSlotKeys`, `describeSlot`), the layouts (`MAHJONG_LAYOUTS`, `MORE_LAYOUTS`, `ALL_LAYOUTS`, `layoutFor`, `layoutExtent`), the board (`geometryOf`, `isFree`, `freeSlots`, `freePairs`, `blockedBy`, `canTake`, `takePair`, `tilesLeft`, `isCleared`, `hintFor`, `matchesOf`), dealing (`layPairs`, `pairsLeft`, `shuffleTiles`), games as text (`encodeMoves`, `decodeMoves`, `playSolve`, `dealFits`), `seededRandom` and `shuffled` |
| `@johnmorrisdotca/jarajara/awase` | `generateAwase(size, level, seed)`, `checkAwase(size, givens, answer)`, `freshAwaseSeed(rule)`, `bonusRuleOfSeed`, `clearRate`; options and challenges: `AWASE_CHALLENGES`, `awaseRules`, `startRun`, `runTake`, `runShuffle`, `runUndo`, `runHint(run, chosen?)`, `runStart`, `runTick`, `runRemaining`, `runPairs`, `runMarked`, `readRun`, `dailyAwase` |
| `@johnmorrisdotca/jarajara/table` | `startTable`, `readTable`, `tablePairs`, `playAtTable`, `takeAtTable`, `undoAtTable`, `computerPair`, `encodeTable`, `decodeTable`, `seatName`, `SEAT_WINDS` |
| `@johnmorrisdotca/jarajara/faces` | `tileSvg`, `tileFaceSvg`, `tileFaceSymbols`, `faceWords`, `layoutSvg`, `layoutBox`, `layoutFrame`, `tileAt`, `TILE_BOX`, the block (`blockColours`, `blockSvg`, `shadowSvg`, `faceEdgeSvg`, `TILE_DEPTH`, `TILE_MIRRORS`), the backs (`tileBackSvg`, `tileBackFace`, `backBase`, `TILE_BACKS`), designs (`jarajaraDesign`, `loadTileDesign`, `TILE_DESIGNS`, `redFiveIndexes`), cloths (`JARAJARA_CLOTHS`, `CLOTHS`, `isCloth`, `clothVars`), and the colours `TILE_INK`, `TILE_BODY`, `TILE_MARKS` |
| `@johnmorrisdotca/jarajara/tile-sounds` | `createTileSounds`, `TILE_SOUND_KINDS`, `MOST_SOUNDS_AT_ONCE`, `soundTimes` |
| `@johnmorrisdotca/jarajara/sounds` | `TILE_SOUND_DATA`, the recordings as base64 AAC |
| `@johnmorrisdotca/jarajara/designs/riichi` | `RIICHI`: the regular riichi tiles as drawings, over a hundred kilobytes |
| `@johnmorrisdotca/jarajara/designs/riichi-black` | `RIICHI_BLACK`: the black riichi tiles as drawings, over a hundred kilobytes |
| `@johnmorrisdotca/jarajara/element` | the element classes (`JarajaraTile`, `JarajaraRack`, `JarajaraLayout`, `JarajaraTable`, `JarajaraGroup`, `JarajaraSet`, `JarajaraViewer`), `hintPair`, `setPageSounds`, `MOST_SOUNDING`, `rackPlaces`, `rackWidth`, `ELEMENT_SIZES`, `STRINGS`, `followLanguage`, `languageOf`, `allowanceOf` |
| `@johnmorrisdotca/jarajara/element/define` | defines the seven tags on the page, for its effect |

Every function is pure: it returns new values and never changes what it was
given.

## Theming

Nothing here is branded. The tiles are light objects and their colours are fixed, since a tile looks the same on any table (`TILE_INK`, `TILE_BODY` and `TILE_MARKS` hold them, to read); the table under them is the page's. The tags are themed by custom properties, which pass into their shadow roots, so a page sets only the ones it wants different, on the tag or above it:

| Property | What it styles | Default |
| --- | --- | --- |
| `--jarajara-tile-width` | the width of a tile in `<jarajara-tile>` and in the viewers, when no `size` or `width` says | `48px` |
| `--jarajara-pad` | the padding between a cloth's rim and the board | `14px` |
| `--jarajara-box` | the board's box, as a ratio, under `box` | the ratio `box` names |
| `--jarajara-felt` | a cloth's felt | set by `cloth` |
| `--jarajara-felt-deep` | a cloth's deep edge | set by `cloth` |
| `--jarajara-felt-ink` | the ink written on a cloth, and its rim | `#f3efe4` |
| `--jarajara-focus` | the ring round a tile, a rack's tile or a viewer's choice that has the keyboard | `#b5452c` |
| `--jarajara-marker` | the dot of a marked tile | `#f2b134` |
| `--jarajara-note` | the board's line of notes, such as "That tile is not free" | `#b5452c` |
| `--jarajara-flip-ms` | how long a tile takes to turn over | `520ms` |

```css
jarajara-layout { --jarajara-pad: 8px; --jarajara-note: #7a1f12; }
jarajara-tile { --jarajara-tile-width: 64px; --jarajara-flip-ms: 300ms; }
```

A `cloth` is one choice of the three felt properties, which `clothVars(name)` gives as an object for a page that wants the felt without a tag:

| Cloth | Felt | Deep edge | Ink |
| --- | --- | --- | --- |
| `green` | `#2f5d4a` | `#1f4135` | `#f3efe4` |
| `blue` | `#2865a6` | `#1a4677` | `#f3efe4` |
| `red` | `#a3342e` | `#7a231f` | `#f3efe4` |
| `black` | `#2f3236` | `#1b1d20` | `#ece8dc` |
| `wood` | `#e2ba7a` | `#c4954f` | `#2b1d0e` |

The buttons and the viewer's box are drawn light too, with dark text, whatever the page's theme; on a dark page the tags look best on a `cloth`. The demo's own page is the worked example: its green felt and its cloth patches are the family's stylesheet, [`demo/family.css`](./demo/family.css), the same file byte for byte in every sibling's demo. The parts of the tags carry `part` names (`back`, `board`, `button`, `clock`, `controls`, `face`, `frame`, `marker`, `rack`, `seats`, `status` and `tile`) for anything a property cannot reach.

## Limits

All of these are held by tests, and the ones with a name are exported.

| Limit | Value | Where |
| --- | --- | --- |
| The set | 144 tiles in 42 faces | `MAHJONG_FACES`, `setInventory` |
| Layouts | eleven, 8 to 144 tiles, widths 4 and 8 to 17 | `ALL_LAYOUTS`, `layoutFor` |
| Levels | `easy`, `medium`, `hard` | `generateAwase` |
| A seed | a whole number from 1 to 2,147,483,647 | `SEED_MOST`, `freshAwaseSeed` |
| Seeds for the identical rule | 1,500,000,000 to 1,599,999,999 | `AWASE_SAME_BLOCK`, `bonusRuleOfSeed` |
| A table | 2 to 4 players, a name up to 20 characters | `AWASE_TABLE` |
| Challenges | seven | `AWASE_CHALLENGES` |
| A solve | each pair is its two slots in four base-36 characters, a shuffle is `*` | `encodeMoves`, `decodeMoves` |
| What a check does | plays the moves once: a few thousand steps at most, no search | `checkAwase` |
| Clicks at once | 12 from one element, and 8 from one call of the sound player | `MOST_SOUNDING`, `MOST_SOUNDS_AT_ONCE` |
| A tile's width | at most 600 pixels, from `width` | `<jarajara-tile>`, the viewers |
| The riichi designs | over a hundred kilobytes of drawings each, fetched when first asked for | `/designs/riichi`, `/designs/riichi-black` |
| The recordings | tens of kilobytes as text, fetched when the first sound plays | `/sounds` |

A level is chosen by laying five deals from the seed and playing each out at random, so making a deal is real work, and a server that only checks should never make one: `checkAwase` plays the moves it is given and nothing more.

## Browser support

The tags need custom elements, shadow DOM, container queries, `:has()` and `color-mix()`: Chrome and Edge 111, Safari 16.2 and Firefox 121, all of which are from 2023 on. The tiles' thickness is drawn with CSS 3D transforms, and sounds use the Web Audio API, which a browser without it replaces with silence. These are read off the features the code uses, not a tested list: the demo is played in a real Chromium at a phone's width (with touch) and a desk's, and in WebKit, Safari's engine, at a phone's width. Firefox is not in that run.

The package itself, the drawing (which is SVG text) and the command line need no DOM: they run in Node 22 or later, which CI tests on Linux, macOS and Windows, on 22 and 24. On a server the main entry, `/awase`, `/table`, `/faces` and `/element` are safe to import.

## Accessibility

Every tile has a name a screen reader says, in English or Japanese (`aria-label`, and "blocked" in a layout for a tile that cannot be taken now), and the board's line of how it stands is a polite live region. A flippable tile and a rack's tiles are keyboard controls: Tab to one, Enter or Space to turn it or pick it up, and the arrow keys to move along a rack. A tile turning, a rack rearranging, a spin and a pair lifting off are all skipped under `prefers-reduced-motion: reduce`. A layout's tiles are played by pointer: they are not yet reachable by keyboard (see [Roadmap](#roadmap)).

## Languages

English and Japanese. A tag speaks its own `lang`, or the nearest one above it, or the page's, and follows the page's language when it changes. The words of the tags are `STRINGS` (in `@johnmorrisdotca/jarajara/element`), the tiles' names are `faceWords` and `faceWordsJa` (`tileName(code, language)`), and the command line has its own words in `src/cliWords.ts`. The demo has a chooser of its own and takes the browser's language on a first visit. **Japanese: included; not yet reviewed by a native reader. Corrections welcome.** Every string of the tags and the command line is listed beside its English in [docs/strings-ja.md](./docs/strings-ja.md), made from the source by `pnpm docs:make` and held by a test, and a wrong one is a *Fix a translation* issue away: [open one](https://github.com/johnmorrisdotca/jarajara/issues/new?template=fix-a-translation.md).

## Roadmap

Not here yet, and each welcome as an [issue](https://github.com/johnmorrisdotca/jarajara/issues):

- Playing a layout by keyboard: moving between the free tiles and choosing one.
- A board turned a quarter, and free rotation. `docs/LOOK.md` says what they would take.
- More layouts: [suggest one](https://github.com/johnmorrisdotca/jarajara/issues/new?template=suggest-a-layout.md).

Left out on purpose: any account, ranking or storage. A page keeps its own games: `jarajara-take` and `jarajara-deal` hand over what is needed, `moves` is the game as text and `restore(moves)` plays it back. The first five layouts, and every deal made on them, never change.

## Architecture

The rules are plain functions over strings, with no DOM; the drawing is a
separate entry, so a server that only checks a game never loads it.

```text
src/
├── index.ts          the main entry: the set, layouts, board, dealing, moves, names and arranging
├── awase-entry.ts    the "/awase" entry: the solitaire's deal and check
├── table-entry.ts    the "/table" entry: Awase for two to four, and the computer
├── faces-entry.ts    the "/faces" entry: the tiles, backs, designs and layouts drawn as SVG
├── element.ts        the "/element" entry: the custom element classes
├── element-define.ts the "/element/define" entry: defines the tags on the page
├── tiles.ts          the 144 tiles in 42 faces, matching, and what a pair scores
├── names.ts          what each tile is called in English and Japanese, finding one by name, hand notation
├── arrange.ts        sorting, grouping and mixing tiles; putting a layout's slots in order by x, y, z
├── layouts.ts        the five stacked layouts, Tiny to the Turtle, and every layout by size
├── layouts-more.ts   six more layouts, Jarajara's own: a pagoda, fortress, pyramid, bridge, butterfly and dragon
├── board.ts          which tiles are free, the pairs that can be taken, taking one
├── deal.ts           laying pairs in reverse so a deal can always be cleared; shuffling
├── moves.ts          a game written as text, and played back on a deal
├── awase.ts          a deal of Awase from a seed, at three levels
├── check.ts          whether a finished game clears its deal
├── challenge.ts      options and challenges: a game as plain data, its clock, goals and the day's game
├── cli.ts            the command line as a pure function: arguments in, what to print and the exit code out
├── cliWords.ts       what the command line says in English and Japanese, and the layouts' names in Japanese
├── table.ts          the rules at a table: turns, scores, shuffles and the end
├── computer.ts       the computer's choice of pair at the table
├── faces.ts          each face as SVG text, one tile on its own, and their colours
├── backs.ts          the backs of the tiles as SVG
├── designs.ts        the designs a tile may be drawn in, and the red fives
├── designs/
│   ├── riichi.ts         the regular riichi tiles as drawings (FluffyStuff, CC0)
│   └── riichi-black.ts   the black riichi tiles as drawings (FluffyStuff, CC0)
├── sounds.ts         the tile sounds as base64 AAC, made from sounds/
├── tile-sounds.ts    the "/tile-sounds" entry: playing them
├── design.types.ts   the type of a set of drawn tiles
├── cloth.ts          the family's five cloths
├── block.ts          a tile as a solid block: its thickness, shadow, edge and the views that mirror a board
├── colour.ts         reading, mixing and lightening colours for the drawings
├── draw.ts           a whole layout drawn as one SVG, stacked far to near
├── random.ts         the seeded random numbers every deal is made from
├── types.ts          the types of the set, layouts, moves and Awase
├── table.types.ts    the types of a table
├── version.ts        the package's version
└── ui/
    ├── elementKit.ts     what the elements share: designs, backs, language, cloth, marks, spin
    ├── strings.ts        the words the elements say, in English and Japanese
    ├── tileElement.ts    <jarajara-tile>
    ├── rackElement.ts    <jarajara-rack>
    ├── rackLayout.ts     where tiles lie in a rack
    ├── layoutElement.ts  <jarajara-layout>
    ├── tableElement.ts   <jarajara-table>
    ├── tileSounds.ts     the sounds: played from the recordings, or made in the browser
    └── viewerElements.ts <jarajara-viewer>, <jarajara-group> and <jarajara-set>
```

Tests sit beside the code they test (`*.test.ts`). `site.fixture.json` holds
every deal and table game itsutsu.com made before the move, played again on
every build. `demo/` is the playable page, `e2e/` its browser tests (`pnpm test:demo`), `bin/` is the command line's few lines, and `scripts/` builds the demo
and its API reference page, checks the package as npm packs it and the command line as a child process, and builds a page in each framework.

## The name

*Jarajara* (ジャラジャラ) is the sound of mahjong tiles being shuffled, the
rattle of a hundred and forty-four of them washed together face down on the
table before a game. It is said in four beats, *ja-ra-ja-ra*. *Awase* (合わせ)
is "matching", "putting together", from *awaseru* (合わせる), to join two
things into a pair.

## Where it comes from, and where it is used

Jarajara was built for [Itsutsu](https://itsutsu.com), a site for board games, puzzles, card games and dice games
played at your own pace. *Itsutsu* (五つ) is Japanese for "five", after five in a row, the game the site began
with. Its [Mahjong](https://itsutsu.com/games/mahjong) was made there, with its layouts, its deals and its table for
two to four, and once the tiles and the solitaire stood alone it seemed worth sharing them. The deals and table games
the site made before the move are made again, exactly, on every build.

### Used by

- [Itsutsu](https://itsutsu.com), for its Mahjong: the tiles, the layouts, the deals, the check and the table.

Using Jarajara in something? Open an *Add my project* issue and we will add you.

### The family

<!-- family:start (made by scripts/family-readme.mjs from scripts/family-template.mjs; change those, not this) -->
Jarajara is one of nineteen packages, each made for the same site, each at
[github.com/johnmorrisdotca](https://github.com/johnmorrisdotca). The code of every one is MIT.

- [Korokoro](https://github.com/johnmorrisdotca/korokoro) (コロコロ): dice, with notation, exact odds, real sounds and the dice of many games. [Demo](https://johnmorrisdotca.github.io/korokoro/).
- [Kyuubu](https://github.com/johnmorrisdotca/kyuubu) (キューブ): a turning cube for the browser, 2×2 to 7×7, with record solves to replay. [Demo](https://johnmorrisdotca.github.io/kyuubu/).
- [Hitotsu](https://github.com/johnmorrisdotca/hitotsu) (一つ): a colour-card shedding game for two to eight, with the house rules people play. [Demo](https://johnmorrisdotca.github.io/hitotsu/).
- [Toranpu](https://github.com/johnmorrisdotca/toranpu) (トランプ): a deck of playing cards, card games with computer players, and solitaires. [Demo](https://johnmorrisdotca.github.io/toranpu/).
- [Tane](https://github.com/johnmorrisdotca/tane) (種): seeded random numbers and daily seeds, the same in every browser and on every server. [Demo](https://johnmorrisdotca.github.io/tane/).
- [Narabe](https://github.com/johnmorrisdotca/narabe) (並べ): one rules engine for abstract board games, from gomoku and Reversi to Go and checkers. [Demo](https://johnmorrisdotca.github.io/narabe/).
- [Tenka](https://github.com/johnmorrisdotca/tenka) (天下): world conquest for two to six, on a map of the real world. [Demo](https://johnmorrisdotca.github.io/tenka/).
- [Kumimoji](https://github.com/johnmorrisdotca/kumimoji) (組み文字): a crossword tile race, in English and Japanese kana. [Demo](https://johnmorrisdotca.github.io/kumimoji/).
- [Tsunagi](https://github.com/johnmorrisdotca/tsunagi) (繋ぎ): a line-joining logic puzzle whose every level has exactly one answer. [Demo](https://johnmorrisdotca.github.io/tsunagi/).
- [Jarajara](https://github.com/johnmorrisdotca/jarajara) (ジャラジャラ): mahjong tiles drawn as SVG, stacked layouts, and the matching solitaire Awase. [Demo](https://johnmorrisdotca.github.io/jarajara/).
- [Suido](https://github.com/johnmorrisdotca/suido) (水道): a pipe puzzle: turn the pieces until the water reaches every drain. [Demo](https://johnmorrisdotca.github.io/suido/).
- [Domino](https://github.com/johnmorrisdotca/domino) (ドミノ): dominoes and Mexican Train. [Demo](https://johnmorrisdotca.github.io/domino/).
- [Kotoba](https://github.com/johnmorrisdotca/kotoba) (言葉): word lists and word-game rules in English, French, German and Japanese. [Demo](https://johnmorrisdotca.github.io/kotoba/).
- [Sugoroku](https://github.com/johnmorrisdotca/sugoroku) (双六): backgammon and its variants, with the doubling cube and match play. [Demo](https://johnmorrisdotca.github.io/sugoroku/).
- [Kazu](https://github.com/johnmorrisdotca/kazu) (数): grid number puzzles: Sudoku and its variants, Futoshiki and Skyscrapers. [Demo](https://johnmorrisdotca.github.io/kazu/).
- [Meikyuu](https://github.com/johnmorrisdotca/meikyuu) (迷宮): mazes on squares, hexagons, triangles and circles, made from a seed and drawn through with a finger or the mouse. [Demo](https://johnmorrisdotca.github.io/meikyuu/).
- [Hikidashi](https://github.com/johnmorrisdotca/hikidashi) (引き出し): a drawer of small Japanese text tools: era dates, kanji numerals, readings and sentence difficulty. [Demo](https://johnmorrisdotca.github.io/hikidashi/).
- [Chizu](https://github.com/johnmorrisdotca/chizu) (地図): maps of the world and of countries' regions, in English and Japanese, with a quiz and callouts. [Demo](https://johnmorrisdotca.github.io/chizu/).
- [Bushu](https://github.com/johnmorrisdotca/bushu) (部首): find a kanji by the parts it is made of. [Demo](https://johnmorrisdotca.github.io/bushu/).

**This package is Jarajara.** The demos of all nineteen share one header and footer, so each links the rest.
<!-- family:end -->

## Development

```sh
pnpm install
pnpm check            # lint, types and every test, every recorded deal made again
pnpm test:package     # pack, install and import it as somebody who installed it would, and run its command line
pnpm test:cli         # build it and run the command line as a child process
pnpm test:demo        # build the demo and play it in a real browser, at a phone's width and a desk's
pnpm test:frameworks  # build React, Vue, Svelte, Angular and plain pages from the packed tarball and play them in a browser
pnpm site             # build the demo into site/, as the Pages workflow publishes it
pnpm pictures         # take the README's two pictures from the built demo
pnpm docs:make        # rewrite docs/strings-ja.md after changing a word of the tags or the command line
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The commands are under [Development](#development).

Please follow the [code of conduct](./CODE_OF_CONDUCT.md). A way to make the check or a deal run for a very long time, or text that gets out of a drawing into the page, is for the [security policy](./SECURITY.md), not a public issue.

## Changes

See [CHANGELOG.md](./CHANGELOG.md).

## Licence

MIT, © John Morris. The tile faces are drawn for this package and are under
the same licence. The riichi designs are FluffyStuff's (public domain) and the sounds Kenney's
(CC0): see [docs/credits.md](docs/credits.md).
