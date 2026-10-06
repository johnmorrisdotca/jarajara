# Architecture

Every source file of the package and what it does. Back to the [README](../README.md#architecture).


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
├── layouts-mega.ts   two layouts for more than one set of tiles: the Wall (288) and the Palace (576)
├── playout.ts        a deal played out at random, the fast way: how forgiving a deal is
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

