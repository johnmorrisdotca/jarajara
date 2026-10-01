<h1 align="center">Jarajara <sub>ジャラジャラ</sub></h1>

<p align="center"><strong>Mahjong tiles for JavaScript and TypeScript.</strong><br>
The 144-tile set in 42 faces, drawn as SVG; the stacked layouts tile games are played on; which tiles are free, which match, dealing and shuffling; a game written as text; and Awase, the matching solitaire, alone or at a table of two to four with a computer player. Seeded, and every deal can be cleared. No dependencies.</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/jarajara/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/jarajara/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/jarajara"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/jarajara?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/jarajara/"><strong>Play Awase →</strong></a></p>

<p align="center">
  <img src="docs/desktop.jpg" alt="The Turtle, a layout of 144 mahjong tiles stacked five layers high on a green cloth, a few pairs already taken" width="620">
  <img src="docs/phone.jpg" alt="Awase on Fuji on a phone in dark mode, the free tiles lit and the blocked ones washed darker, 88 tiles left" width="200">
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

## Who it is for

- **Game sites and apps** that want tiles with the rules already right: a
  deal everybody plays alike from a seed, a finished game a server can check
  by playing it, and the faces drawn as text that goes into any page.
- **Anyone making a tile game of their own**, who wants the set, the free
  rule, the layouts and the drawing, and to write only the game.

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
| 15 | Turtle | 144 | 5 |

The Turtle is the layout the solitaire has been played on since it was first
published. A layout's size is its width in tiles, and names it. Tiny is for
tests, cleared in four pairs.

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

## API

| Import | What it holds |
| --- | --- |
| `@johnmorrisdotca/jarajara` | the set (`MAHJONG_FACES`, `faceOf`, `tilesMatch`, `matchClass`, `bonusRuleOf`, `setPairs`, `pairPoints`), the layouts (`MAHJONG_LAYOUTS`, `layoutFor`, `layoutExtent`), the board (`geometryOf`, `isFree`, `freeSlots`, `freePairs`, `blockedBy`, `canTake`, `takePair`, `tilesLeft`, `isCleared`), dealing (`layPairs`, `pairsLeft`, `shuffleTiles`), games as text (`encodeMoves`, `decodeMoves`, `playSolve`, `dealFits`), `seededRandom` and `shuffled` |
| `@johnmorrisdotca/jarajara/awase` | `generateAwase(size, level, seed)`, `checkAwase(size, givens, answer)`, `freshAwaseSeed(rule)`, `bonusRuleOfSeed`, `clearRate` |
| `@johnmorrisdotca/jarajara/table` | `startTable`, `readTable`, `tablePairs`, `playAtTable`, `takeAtTable`, `undoAtTable`, `computerPair`, `encodeTable`, `decodeTable`, `seatName`, `SEAT_WINDS` |
| `@johnmorrisdotca/jarajara/faces` | `tileSvg`, `tileFaceSvg`, `tileFaceSymbols`, `faceWords`, `layoutSvg`, `layoutBox`, `tileAt`, and the colours `TILE_INK`, `TILE_BODY`, `TILE_MARKS` |

Every function is pure: it returns new values and never changes what it was
given.

## The name

*Jarajara* (ジャラジャラ) is the sound of mahjong tiles being shuffled, the
rattle of a hundred and forty-four of them washed together face down on the
table before a game. It is said in four beats, *ja-ra-ja-ra*. *Awase* (合わせ)
is "matching", "putting together", from *awaseru* (合わせる), to join two
things into a pair.

## Development

```sh
pnpm install
pnpm check          # lint, types and every test, every recorded deal made again
pnpm test:package   # pack, install and import it as somebody who installed it would
pnpm site           # build the demo into site/, as the Pages workflow publishes it
```

## Licence

MIT, © John Morris. The tile faces are drawn for this package and are under
the same licence.
