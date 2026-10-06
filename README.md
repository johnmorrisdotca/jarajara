<h1 align="center">Jarajara <sub>ジャラジャラ</sub></h1>

<p align="center"><strong>Mahjong tiles for JavaScript and TypeScript.</strong><br>
The 144-tile set in 42 faces, drawn as SVG, with backs and cloths; custom elements for one tile, a rack, a layout to play, a table and viewers of the set; the stacked layouts tile games are played on; which tiles are free, which match, dealing and shuffling; a game written as text; Awase, the matching solitaire, alone or at a table of two to four with a computer player; and a command line. Seeded, and every deal can be cleared. No dependencies.</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/jarajara/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/jarajara/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/jarajara"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/jarajara?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
  <img alt="TypeScript" src="https://img.shields.io/badge/types-TypeScript-3178c6">
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/jarajara/"><strong>Play Awase →</strong></a> · <a href="https://johnmorrisdotca.github.io/jarajara/api.html">API reference</a></p>

<table align="center">
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/hero-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/hero-desk-light.webp" alt="The demo on a desk, in English: the page header with the language chooser, the API reference link, five cloth patches and the Help switch, Awase on the Turtle, a layout of 144 solid mahjong tiles stacked five layers high, centred in a frame on a green cloth with six pairs already taken, the line 132 tiles left and 12 pairs you can take, the New deal, Undo, Hint, Shuffle and Flip buttons, and the layout, challenge and level options under it" width="600">
</picture>
<br><em>The demo on a desk: Awase on the Turtle, six pairs taken.</em>
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/hero-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/hero-phone-light.webp" alt="The demo on a phone, in Japanese: Awase on Fuji with the free tiles lit and the blocked ones washed, the line 残り84枚・取れる組11, the buttons 新しく配る, 戻す, ヒント, 混ぜる and 反転, and under them the layout and challenge choices in Japanese" width="190">
</picture>
<br><em>On a phone, in Japanese, in the device's light or dark.</em>
</td>
</tr>
</table>

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

```ts no-run
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
- **Thirteen stacked layouts**, from a Dragon to a Palace of 576 tiles, each with the geometry of what lies on and beside every slot worked out once. The last two, the Wall (288 tiles) and the Palace (576), are dealt from two and four sets of tiles.
- **Awase, always clearable.** A deal is laid in reverse from a seed, so every deal can be cleared, at three levels. A finished game is written as text and checked by playing it, with no search, so a server can trust it.
- **Options, seven challenges and the day's game.** Hints, shuffles and undo given, limited or taken away; a clock and a goal laid over a deal; and `dailyAwase(date)`, the same game for everybody from the date alone.
- **Awase at a table** of two to four, with a computer in any seat.
- **Solid tiles drawn as SVG text**, in two designs (Jarajara's own, and FluffyStuff's riichi tiles), with five backs and the family's five cloths; a layout seen from the other side, and Find, which lights every tile that matches the one you point at.
- **Seven custom elements**: `<jarajara-tile>`, `<jarajara-rack>`, `<jarajara-layout>`, `<jarajara-table>`, `<jarajara-viewer>`, `<jarajara-group>` and `<jarajara-set>`, with no framework needed and recipes for React, Vue, Svelte and Angular.
- **Sounds, off until asked**: tile clacks, fetched the first time one plays.
- **A command line** that deals, checks a solve, gives the day's game, looks tiles up and plays computers at a table.
- **English and Japanese**, in the tags, the command line and the demo.
- **No dependencies**, and every function is pure: it returns new values and never changes what it was given.

### What's in it

Each picture is the real thing, drawn by the package's own tags and taken from [the demo](https://johnmorrisdotca.github.io/jarajara/) with `pnpm screenshots:readme`, in light and dark. The deal is the same seed every time.

<table>
<tr>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/awase-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/awase-desk-light.webp" alt="Awase on the Turtle on a desk, with the free tiles lit: a layout of solid ivory mahjong tiles with numerals, dots, bamboo, winds, dragons, flowers and seasons stacked five layers high on a green felt, the line 132 tiles left and 12 pairs you can take, the clock at 0:00, and the New deal, Undo, Hint, Shuffle and Flip buttons" width="400">
</picture>
<br><em><strong>Awase.</strong> Take two matching free tiles at a time until the layout is clear; every deal can be cleared.</em>
</td>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/challenge-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/challenge-desk-light.webp" alt="The Spark challenge on the Torii on a desk: the gate-shaped layout of tiles with one tile ringed in gold, the line 58 tiles left and 9 pairs you can take, the line The spark is on south wind, the clock counting down from 3:00, and the New deal, Undo, Hint, Shuffle and Flip buttons" width="400">
</picture>
<br><em><strong>The challenges.</strong> Seven goals and clocks laid over a deal: here the spark must be passed on before time runs out.</em>
</td>
</tr>
<tr>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/tiles-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/tiles-desk-light.webp" alt="The One tile panel of the demo on a desk: a box to pick a tile (east wind), a design (jarajara) and a back, the size buttons Small, Medium and Large with Large chosen, one large east wind tile on green felt, the code that makes it, and beside it The backs panel with jade, bamboo, blue, red, ink and riichi backs to choose from" width="400">
</picture>
<br><em><strong>One tile.</strong> Any tile, face up or down, in any design and back, turned by a tap.</em>
</td>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/rack-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/rack-desk-light.webp" alt="The rack panel of the demo on a desk: a row of fourteen tiles in front of you on green felt, sorted and grouped by suit with gaps between the characters, circles, bamboo and honours, above rows of buttons to hide and show, turn, sort, group, take and add tiles, mark and spin them" width="400">
</picture>
<br><em><strong>A rack.</strong> A hand in front of you, to sort, group, mix, raise and mark.</em>
</td>
</tr>
<tr>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/set-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/set-desk-light.webp" alt="The set panel of the demo on a desk: a tile looked up by name, east wind with its code, suit, rank, copies in the set and points, a group of the four winds, and the whole set as an inventory of the 42 faces with how many of each, on green felt" width="400">
</picture>
<br><em><strong>The whole set.</strong> Look a tile up, show a group, or count the 42 faces and their copies.</em>
</td>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/layouts-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/layouts-desk-light.webp" alt="The layouts panel of the demo on a desk: small pictures of all thirteen layouts (Tiny, Torii, Fuji, Castle, Turtle, Pagoda, Fortress, Pyramid, Bridge, Butterfly, Dragon, Wall and Palace) with their tile counts, and under them one layout lined up as a grid of tiles sorted by layer" width="400">
</picture>
<br><em><strong>Thirteen layouts.</strong> From eight tiles to the Palace of 576, each with the geometry of what lies on and beside every slot.</em>
</td>
</tr>
<tr>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/table-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/table-desk-light.webp" alt="The table panel of the demo on a desk: a choice of two, three or four players, and a table on green felt with the Torii layout, a header showing East and Computer 1 with their scores, and the line East, take a pair" width="400">
</picture>
<br><em><strong>A table.</strong> Awase for two to four, with a computer in any seat that is not a person's.</em>
</td>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/designs-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/jarajara/main/docs/images/designs-desk-light.webp" alt="The designs panel of the demo on a desk: the choice of jarajara, riichi and riichi-black designs, the Torii layout and a rack of tiles on green felt beside the whole set of faces, and under them the code for the design and the sounds panel" width="400">
</picture>
<br><em><strong>Designs.</strong> Jarajara's own tiles, and FluffyStuff's riichi tiles in regular and black.</em>
</td>
</tr>
</table>

## Use it in your project

Jarajara is four things, each usable without the others: **the rules** (the set, the layouts, free tiles, matching, dealing, Awase and the table, as plain functions over strings), **the drawing** (SVG text), **the tags** (custom elements that draw and play them in a page) and **the command line**. The table under [API](#api) says which entry holds which.

### Install

```sh
npm install @johnmorrisdotca/jarajara
pnpm add @johnmorrisdotca/jarajara
yarn add @johnmorrisdotca/jarajara
```

It is ES modules only, with its types included, and needs Node 22 or later outside a browser. A page with no bundler loads the tags from a CDN (`@1` is the major version).

### 1. The API alone, on a server

```ts no-check
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

```ts no-check
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

## Examples

Each example is a whole recipe: copy it and it works. The ones in TypeScript are run in CI against the built package (`pnpm test:readme`), so none of them is a guess, and the output shown is what they print. The tags have a complete reference of their own in [docs/ELEMENTS.md](docs/ELEMENTS.md).

### A game on a page with no script of your own

Save this as a file and open it: the Turtle, dealt from a seed, with the buttons, the clock and the line that says how the game stands. The tags are defined when the module is imported, and `@1` is the major version.

```html
<!doctype html>
<meta charset="utf-8">
<title>Awase</title>
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/jarajara@1/dist/element-define.js"></script>
<jarajara-layout size="15" level="medium" seed="12345" controls timer show-free cloth="green"></jarajara-layout>
<p id="log"></p>
<script>
  document.querySelector("jarajara-layout").addEventListener("jarajara-clear", (event) => {
    document.getElementById("log").textContent = `Cleared in ${event.detail.moves.length / 4} pairs and ${event.detail.seconds} seconds`;
  });
</script>
```

### Deal on a server, and check what comes back

The server makes a deal, sends the tiles to the browser and keeps the answer. When the player sends a finished game, `checkAwase` plays it on the deal in a few thousand steps, with no search, and says whether it clears the layout and, if not, why.

```ts
import { checkAwase, generateAwase } from "@johnmorrisdotca/jarajara/awase";

const deal = generateAwase(4, "easy", 7);                       // the Tiny layout: 8 tiles, 4 pairs
console.log(deal.givens, deal.solution);                       // the tiles, a letter a slot; the answer, two slots a pair
console.log(checkAwase(4, deal.givens, deal.solution));        // the deal's own answer clears it
console.log(checkAwase(4, deal.givens, "0001"));               // a pair the rules do not allow
console.log(checkAwase(4, deal.givens, ""));                   // no moves at all
```

```text
LssIdCCd 0704060500030102
{ ok: true }
{ ok: false, reason: 'a move the rules do not allow' }
{ ok: false, reason: 'tiles are left on the layout' }
```

### Play a deal to the end

Everything the tags do is a function of strings. A deal is cells, one letter a slot; the geometry of what lies on and beside every slot is worked out once; `hintFor` is the pair that lifts the layers highest; `takePair` is the next cells.

```ts
import { geometryOf, hintFor, isCleared, layoutFor, takePair, tilesLeft } from "@johnmorrisdotca/jarajara";
import { generateAwase } from "@johnmorrisdotca/jarajara/awase";

const geometry = geometryOf(layoutFor(15)!);                    // the Turtle
let cells = generateAwase(15, "medium", 12345).givens;          // 144 tiles
let pairs = 0;
for (let hint = hintFor(geometry, cells, "group"); hint.pair !== null; hint = hintFor(geometry, cells, "group")) {
  cells = takePair(cells, hint.pair[0], hint.pair[1]);
  pairs += 1;
}
console.log(pairs, "pairs taken;", tilesLeft(cells), "tiles left; cleared:", isCleared(cells));
```

```text
72 pairs taken; 0 tiles left; cleared: true
```

### Keep a game as text, and play it back

A solve is each pair as its two slots in base 36, and a shuffle as `*`. `decodeMoves` reads it, `playSolve` plays it on a deal, and `encodeMoves` writes it again.

```ts
import { decodeMoves, encodeMoves, playSolve } from "@johnmorrisdotca/jarajara";
import { generateAwase } from "@johnmorrisdotca/jarajara/awase";

const deal = generateAwase(4, "easy", 7);
const moves = decodeMoves(deal.solution, 8)!;                   // [{ pair: [7, 4] }, { pair: [6, 5] }, …]
console.log(moves.length, "moves;", encodeMoves(moves) === deal.solution);
console.log(playSolve(4, deal.givens, moves)!);                  // what is left, and how many shuffles it took
console.log(decodeMoves("0g", 8));                              // not a pair of slots: null
```

```text
4 moves; true
{ cells: '........', shuffles: 0 }
null
```

### The game of the day

`dailyAwase` makes the same game for everybody from the date alone: the layout, the level, the seed and the challenge.

```ts
import { dailyAwase } from "@johnmorrisdotca/jarajara/awase";

console.log(dailyAwase("2026-10-01"));
console.log(dailyAwase("2026-10-01").seed === dailyAwase("2026-10-01").seed);
```

```text
{
  date: '2026-10-01',
  size: 13,
  level: 'hard',
  seed: 473803850,
  challenge: 'gold'
}
true
```

### Awase at a table, played by computers

Two to four players share one layout and take turns; a computer is a seat with `computer: true`. Here two seats play a whole game of the Torii, one pair each turn, until the layout is clear.

```ts
import { generateAwase } from "@johnmorrisdotca/jarajara/awase";
import { computerPair, playAtTable, readTable, startTable } from "@johnmorrisdotca/jarajara/table";

let table = startTable(generateAwase(8, "medium", 5), [{ name: "Ann", computer: true }, { name: "Ben", computer: true }])!;
let turns = 0;
while (!readTable(table)!.over) {
  const pair = computerPair(table)!;
  table = playAtTable(table, pair[0], pair[1])!.table;
  turns += 1;
}
const result = readTable(table)!;
console.log(turns, "turns; scores", result.scores, "pairs", result.pairs, "winners", result.winners);
```

```text
32 turns; scores [ 25, 30 ] pairs [ 16, 16 ] winners [ 1 ]
```

### The tiles as SVG text, on a server

The faces are strings, so a server, a build step or an email can draw them. A tile is one `<svg>`, and a layout is one `<svg>` with every tile in it, stacked far to near.

```ts
import { layoutSvg, tileSvg } from "@johnmorrisdotca/jarajara/faces";
import { generateAwase } from "@johnmorrisdotca/jarajara/awase";

const dragon = tileSvg("F");                                    // the red dragon, as a whole <svg>
console.log(dragon!.startsWith("<svg"), dragon!.length > 500);
const board = layoutSvg(15, generateAwase(15, "medium", 12345).givens, { showFree: true, cloth: "green" })!;
console.log(board.startsWith("<svg"), (board.match(/data-slot=/g) ?? []).length, "tiles drawn");
```

```text
true true
true 144 tiles drawn
```

### Look a tile up, and write a hand

Tiles are found by a code, a name in English or Japanese, or the notation riichi players write hands in, and a hand is written back the same way.

```ts
import { findFace, readTiles, setInventory, tileName, writeNotation } from "@johnmorrisdotca/jarajara";

console.log(findFace("three circles")?.code, findFace("三筒")?.code, findFace("7z")?.code);
console.log(readTiles("123m456p east plum"));
console.log(writeNotation(["a", "b", "c", "B"]), tileName("B", "ja"), setInventory().length, "faces");
```

```text
l l F
[ 'a', 'b', 'c', 'm', 'n', 'o', 'B', 'I' ]
123m1z 東 42 faces
```

### Sort, group and mix a hand

`arrangeTiles` puts a hand in an order, `groupTiles` splits it, and `mixTiles` shuffles it from a seed, the same for the same seed.

```ts
import { arrangeTiles, groupTiles, mixTiles, readTiles } from "@johnmorrisdotca/jarajara";

const hand = readTiles("5p1m9s7z2m");
console.log(arrangeTiles(hand, "suit").join(""), "|", groupTiles(hand, "kind").map((group) => group.join("")).join(" / "));
console.log(mixTiles(hand, 42).join(""), mixTiles(hand, 42).join("") === mixTiles(hand, 42).join(""));
```

```text
abnAF | abnA / F
nbAaF true
```

### A rack in a page

A rack lines tiles up in front of you. Give it a hand in notation, let a tap pick tiles up, and call its methods; each answers a promise that settles when the tiles have stopped moving.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/jarajara@1/dist/element-define.js"></script>
<jarajara-rack id="hand" tiles="234m567p3456s11z77z" pick capacity="14" cloth="green"></jarajara-rack>
<button onclick="hand.sort().then(() => hand.group('suit'))">Sort and group</button>
<button onclick="hand.mixUp(7)">Mix up</button>
<script>
  hand.addEventListener("jarajara-pick", (event) => console.log(event.detail));   // { index, code, lifted }
</script>
```

### A table of three, in a page

`players` is how many sit down, `people` how many of the seats are people's, and the rest are computers; every pair taken is an event.

```html
<jarajara-table players="3" people="1" names="Ann" size="10" cloth="blue" delay="500"></jarajara-table>
<script>
  document.querySelector("jarajara-table").addEventListener("jarajara-table", (event) => console.log(event.detail.scores, event.detail.over));
</script>
```

### A look of your own

The tags are themed by custom properties, which pass into their shadow roots, and the felt is one of the family's five cloths.

```css
jarajara-layout { --jarajara-pad: 8px; --jarajara-note: #7a1f12; }
jarajara-tile { --jarajara-tile-width: 64px; --jarajara-flip-ms: 300ms; }
```

### Deal, check and play from a terminal

`jarajara` deals, checks a solve, gives the day's game, looks tiles up and plays computers at a table, in English or Japanese, from the same seeds as the functions. The whole reference is in [docs/COMMAND-LINE.md](docs/COMMAND-LINE.md).

```sh
npx @johnmorrisdotca/jarajara deal --layout 4 --seed 7
npx @johnmorrisdotca/jarajara check 0704000506010302 --layout 4 --seed 7
npx @johnmorrisdotca/jarajara tile three circles
npx @johnmorrisdotca/jarajara play --players 3 --layout 8 --seed 5
```

```text
Tiny, 8 tiles, medium, seed 7, usual rule
…
Cleared: 4 pairs and 0 shuffles take every tile.
l  3 of circles  三筒  Circles 3, 4 in the set, written 3p
Awase at a table of 3: Torii, medium, seed 5. 32 pairs taken, 0 shuffles.
…
```

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
| 20 | Wall | 288 | 5 |
| 26 | Palace | 576 | 6 |

The Turtle is the layout the solitaire has been played on since it was first
published. A layout's size is its width in tiles, and names it. Tiny is for
tests, cleared in four pairs. `MAHJONG_LAYOUTS` holds the first five, which
never change (itsutsu.com's kept games are made on them); the next six are
Jarajara's own drawings of shapes anyone may draw, in `MORE_LAYOUTS`; and the
last two are the mega layouts in `MEGA_LAYOUTS`, and `ALL_LAYOUTS` holds them all.

The two mega layouts are laid with more than one set of tiles. The **Wall** 長城
is a stretch of the Great Wall: four tiles thick with a walkway along the top, a
watchtower at each end and a gate tower in the middle that rises in five layers,
288 tiles, a double set. The **Palace** 宮殿 is a wall round a courtyard with a
gate, towers at its corners and either side of the gate, and the great hall in
the middle climbing in six steps, 576 tiles, a quadruple set. A deal of either is
laid in reverse like any other, so every deal can be cleared, and is made in
under a tenth of a second (the Palace) on a laptop. Under the usual rule a flower
or a season is dealt once however many sets there are, so the eight bonus tiles
of the further sets are four more pairs of ordinary tiles. A table of computers
works on them, a turn taking a few hundredths of a second on the Palace. Every one is dealt and cleared by the same
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
may replay one. The challenges come from the ideas of Mah's challenge modes (see [CREDITS.md](CREDITS.md)); the
code, the numbers and the layouts are Jarajara's own. `<jarajara-layout challenge="spark" timer controls>` plays them, its
clock counting down.

## Awase at a table

```ts no-check
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

```ts no-check
import { layoutSvg, tileSvg, tileFaceSymbols, TILE_INK } from "@johnmorrisdotca/jarajara/faces";

tileSvg("F");                                      // one tile, the red dragon, as a whole <svg>
layoutSvg(15, cells, { chosen: 12, showFree: true }); // a layout, stacked, far to near, the chosen tile ringed
```

The faces are a Japanese-style set in plain strokes that read at thirty pixels, drawn as strings, so they go into any page or framework. A tile is a solid block, with thickness and a shadow, in Jarajara's own design or FluffyStuff's riichi tiles; backs, cloths, mirrored views, Find and hints are options of the same calls. [docs/DRAWING.md](docs/DRAWING.md) describes the block, the frame, the backs and cloths, every option of `layoutSvg`, and how hints and Find work.

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

Every attribute of every tag, its methods and its events are in [docs/ELEMENTS.md](docs/ELEMENTS.md), in a table for each tag, held to the code by a test.

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

```ts no-check
import { loadTileDesign, tileSvg, layoutSvg } from "@johnmorrisdotca/jarajara/faces";

const design = await loadTileDesign("riichi");     // or "riichi-black"; "jarajara" is always at hand
tileSvg("e", { design, red: true });                // the red five of characters
layoutSvg(9, cells, { design, redFives: true });   // the first five of each suit, in slot order, is red
```

`TILE_DESIGNS` lists them. A design's own back is named like the design (`back="riichi"`), and an element given a
design and no `back` shows that design's own. Where the drawings come from and under what licence is in
[CREDITS.md](CREDITS.md).

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

```ts no-check
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

For a terminal, a script or a teacher's handout: the same deals, checks and tiles as the functions, with nothing to write. Every deal comes from its seed, so the same command prints the same tiles on every machine. It has six commands: `layouts`, `deal`, `daily`, `check`, `play` and `tile`; it speaks English and Japanese; and its exit code is 0 when all went well, 1 when what was asked for could not be done and 2 when the command itself was wrong. [docs/COMMAND-LINE.md](docs/COMMAND-LINE.md) shows each command's output and lists every command and option.

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
| Layouts | thirteen, 8 to 576 tiles, widths 4, 8 to 17, 20 and 26 | `ALL_LAYOUTS`, `layoutFor` |
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

## Accessibility

- **Tiles and boards are named in English or Japanese.** A single tile, a rack's tiles and the viewers' tiles have a name a screen reader says ("east wind", 東), and a layout is labelled with how many tiles are left. The board's line of how the game stands ("132 tiles left · 12 pairs you can take") and its notes ("That tile is not free") are a polite live region, so a change is spoken without moving focus.
- **A tile is not told by its picture alone.** Every suit tile and wind carries its number or letter small in the corner, for a reader who does not count dots at a glance or read 東 as east, and with `show-free` a blocked tile is washed darker, which is a second sign beside the free tile's full colour.
- **The keyboard.** A flippable tile and a rack's tiles are keyboard controls: Tab to one, Enter or Space to turn it or pick it up, and the arrow keys to move along a rack. The buttons of a game (New deal, Undo, Hint, Shuffle, Flip) are native buttons at least 44 pixels high, and so are the demo's options.
- **Reduced motion.** A tile turning, a rack rearranging, a spin and a pair lifting off are all skipped under `prefers-reduced-motion: reduce`.
- **Colour and contrast.** The tiles are light objects with fixed colours, and every tile is drawn with a seam and a raised edge so that a row of tiles can be counted in every design, black ones included; the colour pairs of the felts have not been measured against WCAG contrast ratios.
- **Sound is optional** and never the only sign of anything: off unless a page turns it on, and every move also changes the picture and the live line.
- **Not yet: playing a layout by keyboard.** A layout's tiles are played by pointer; moving between the free tiles and choosing one is on the [Roadmap](#roadmap). A page that needs it today can call `take(a, b)` and `hint()` from its own controls, as the demo's buttons do. Touch targets inside a layout are the tiles' own size, which depends on the board's box.
- **Not yet: Japanese read by a native reader** (see [Languages](#languages)).

## Browser support

The tags need custom elements, shadow DOM, container queries, `:has()` and `color-mix()`: Chrome and Edge 111, Safari 16.2 and Firefox 121, all of which are from 2023 on. The tiles' thickness is drawn with CSS 3D transforms, and sounds use the Web Audio API, which a browser without it replaces with silence. These are read off the features the code uses, not a tested list: the demo is played in a real Chromium at a phone's width (with touch) and a desk's, and in WebKit, Safari's engine, at a phone's width. Firefox is not in that run.

The package itself, the drawing (which is SVG text) and the command line need no DOM: they run in Node 22 or later, which CI tests on Linux, macOS and Windows, on 22 and 24. On a server the main entry, `/awase`, `/table`, `/faces` and `/element` are safe to import.

## Languages

English and Japanese. A tag speaks its own `lang`, or the nearest one above it, or the page's, and follows the page's language when it changes. The words of the tags are `STRINGS` (in `@johnmorrisdotca/jarajara/element`), the tiles' names are `faceWords` and `faceWordsJa` (`tileName(code, language)`), and the command line has its own words in `src/cliWords.ts`. The demo has a chooser of its own and takes the browser's language on a first visit. **Japanese: included; not yet reviewed by a native reader. Corrections welcome.** Every string of the tags and the command line is listed beside its English in [docs/strings-ja.md](./docs/strings-ja.md), made from the source by `pnpm docs:make` and held by a test, and a wrong one is a *Fix a translation* issue away: [open one](https://github.com/johnmorrisdotca/jarajara/issues/new?template=fix-a-translation.md).

## Roadmap

Not here yet, and each welcome as an [issue](https://github.com/johnmorrisdotca/jarajara/issues):

- Playing a layout by keyboard: moving between the free tiles and choosing one.
- A board turned a quarter, and free rotation. `docs/LOOK.md` says what they would take.
- More layouts: [suggest one](https://github.com/johnmorrisdotca/jarajara/issues/new?template=suggest-a-layout.md).

Left out on purpose: any account, ranking or storage. A page keeps its own games: `jarajara-take` and `jarajara-deal` hand over what is needed, `moves` is the game as text and `restore(moves)` plays it back. The first five layouts, and every deal made on them, never change.

## Architecture

The rules are plain functions over strings, with no DOM; the drawing is a separate entry, so a server that only checks a game never loads it; the tags are classes in another entry, defined only by the `/element/define` entry. Tests sit beside the code they test, and `site.fixture.json` holds every deal and table game itsutsu.com made before the move, played again on every build. `demo/` is the playable page, `e2e/` its browser tests, `bin/` the command line's few lines, and `scripts/` builds the demo and its API reference page, checks the package as npm packs it and the command line as a child process, and builds a page in each framework. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) lists every source file and what it does.

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
Jarajara is one of twenty-four packages, each made for the same site, each at
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
- [Tobiishi](https://github.com/johnmorrisdotca/tobiishi) (飛び石): peg solitaire with nine boards and seeded solvable challenges. [Demo](https://johnmorrisdotca.github.io/tobiishi/).
- [Jirai](https://github.com/johnmorrisdotca/jirai) (地雷): minesweeper on shaped grids with verified no-guess boards. [Demo](https://johnmorrisdotca.github.io/jirai/).
- [Gunjin](https://github.com/johnmorrisdotca/gunjin) (軍人): five hidden-rank strategy games with pass-the-device play. [Demo](https://johnmorrisdotca.github.io/gunjin/).
- [Karakuri](https://github.com/johnmorrisdotca/karakuri) (からくり): eight hyper-casual puzzle games, some of them physics: draw a shield, pull pins, cut ropes, slide blocks, pour tubes. [Demo](https://johnmorrisdotca.github.io/karakuri/).
- [Houseki](https://github.com/johnmorrisdotca/houseki) (宝石): gem and stone matching puzzles: falling triplets, stone collapse, colour chains and gem swap. [Demo](https://johnmorrisdotca.github.io/houseki/).

**This package is Jarajara.** The demos of all twenty-four share one header and footer, so each links the rest.
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
pnpm test:readme      # run every example in this README against the built package
pnpm screenshots:readme # take the README's pictures from the built demo, in light and dark
pnpm docs:make        # rewrite docs/strings-ja.md after changing a word of the tags or the command line
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The commands are under [Development](#development).

Please follow the [code of conduct](./CODE_OF_CONDUCT.md). A way to make the check or a deal run for a very long time, or text that gets out of a drawing into the page, is for the [security policy](./SECURITY.md), not a public issue.

## Changes

See [CHANGELOG.md](./CHANGELOG.md). The latest release, 1.6.2, adds no code: it is this README in full, with pictures of every part, examples that are run on every change, and an Accessibility section; the reference for the tags, the drawing, the command line and the source tree moved to pages under `docs/`.

## Licence

MIT, © John Morris. The tile faces are drawn for this package and are under
the same licence. The riichi designs are FluffyStuff's (public domain) and the sounds Kenney's
(CC0): see [CREDITS.md](CREDITS.md).
