# The command line

Every command and option of `jarajara`, with the output it prints. Back to the [README](../README.md#the-command-line).


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
20  wall       288 tiles, 5 layers
26  palace     576 tiles, 6 layers
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

A deal is drawn one layer at a time, bottom first. A tile is a face letter (see [The tiles](../README.md#the-tiles)) where its top left corner is, two characters across and two lines down, so a tile set half a tile over sits half a tile over. `Tiles:` is the deal as `generateAwase` makes it and `One way to clear it:` its answer, which is what `check` takes.

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

