# Challenges

From [the README's section on options and challenges](../README.md#options-and-challenges): what each of the seven challenges asks.

### Options and challenges

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
