# Credits: where the sounds and pictures come from

Everything in Jarajara was written for it, under its MIT licence, except what this page names. Each item says where it
came from, its licence as read at its source, and the day that was checked. Nothing here is GPL or LGPL, and nothing is
used whose licence has not been read.

## The riichi designs

The faces, plate and back of `@johnmorrisdotca/jarajara/designs/riichi` and `/designs/riichi-black`, and so the `riichi`
and `riichi-black` designs and their backs and red fives: **riichi-mahjong-tiles** by FluffyStuff,
[https://github.com/FluffyStuff/riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles).

- **Licence:** public domain, CC0. The repository's README says "All assets are in the public domain" and links
  [creativecommons.org/publicdomain/zero/1.0](https://creativecommons.org/publicdomain/zero/1.0/); its `LICENSE.md` says
  "This work is in the public domain."
- **Checked:** 2026-10-01, at the source, commit `26e127ba2117f45cdce5ea0225748cc0cfad3169` ("Update license to public
  domain", 2024-06-15).

Used: the 34 faces of a riichi set (the three suits, the four winds, the three dragons), each tile's plate (`Front.svg`),
its back (`Back.svg`) and the red fives (`Man5-Dora.svg`, `Pin5-Dora.svg`, `Sou5-Dora.svg`), from both `Regular/` and
`Black/`. Not used: `Blank.svg` and the PNG exports. The set has no flowers or seasons; those are Jarajara's own within the
designs. **What was done to them**, by `scripts/designs-riichi.mjs`: each 300 by 400 drawing was made smaller with svgo
(multipass, one decimal place, its size and Inkscape's own markings taken off, its ids given a prefix of its own so any
number may share a page) and written into `src/designs/riichi.ts` and `riichi-black.ts` as text. Over a hundred kilobytes of drawings
each, fetched by an element only when a page asks for the design.

## The tile sounds

**Casino Audio (1.1)** by Kenney Vleugels,
[https://kenney.nl/assets/casino-audio](https://kenney.nl/assets/casino-audio): the pack Toranpu's card sounds come from
too.

- **Licence:** Creative Commons Zero, CC0 1.0
  ([creativecommons.org/publicdomain/zero/1.0](http://creativecommons.org/publicdomain/zero/1.0/)), as the pack's page says
  and as its own `License.txt` states: "You may use these assets in personal and commercial projects. Credit (Kenney or
  www.kenney.nl) would be nice but is not mandatory."
- **Checked:** 2026-10-01, on the pack's page and in `License.txt` inside `kenney_casino-audio.zip` (SHA-256
  `f36250766ac5bc378c13708ddf12a23a8e54a3251f8d482c7536e51b5dbafa18`).

The pack has no mahjong tiles; its chips are hard flat discs that click like them. Sixteen of its recordings are used, each
cut short and re-encoded:

| File here | From the pack | What it is | Size |
| --- | --- | --- | --- |
| `sounds/pick-1.m4a` | `Audio/chip-lay-1.ogg` | a hard chip laid down: a tile picked up | 1,681 bytes |
| `sounds/pick-2.m4a` | `Audio/chip-lay-2.ogg` | a hard chip laid down: a tile picked up | 1,901 bytes |
| `sounds/place-1.m4a` | `Audio/chip-lay-3.ogg` | a hard chip laid down: a tile set down | 1,947 bytes |
| `sounds/place-2.m4a` | `Audio/chips-stack-2.ogg` | a chip set on a stack: a tile set down | 1,680 bytes |
| `sounds/place-3.m4a` | `Audio/chips-stack-5.ogg` | a chip set on a stack: a tile set down | 1,552 bytes |
| `sounds/flip-1.m4a` | `Audio/chips-stack-6.ogg` | a short click: a tile turned over | 1,668 bytes |
| `sounds/flip-2.m4a` | `Audio/chips-stack-4.ogg` | a short click: a tile turned over | 1,732 bytes |
| `sounds/pair-1.m4a` | `Audio/chips-collide-1.ogg` | two chips knocked together: a pair taken | 1,557 bytes |
| `sounds/pair-2.m4a` | `Audio/chips-collide-2.ogg` | two chips knocked together: a pair taken | 1,653 bytes |
| `sounds/pair-3.m4a` | `Audio/chips-collide-3.ogg` | two chips knocked together: a pair taken | 1,498 bytes |
| `sounds/pair-4.m4a` | `Audio/chips-collide-4.ogg` | two chips knocked together: a pair taken | 1,520 bytes |
| `sounds/shuffle-1.m4a` | `Audio/chips-handle-5.ogg` | chips washed about: the tiles shuffled (the opening) | 6,058 bytes |
| `sounds/shuffle-2.m4a` | `Audio/chips-handle-1.ogg` | chips handled: one click of a shuffle | 3,512 bytes |
| `sounds/shuffle-3.m4a` | `Audio/chips-handle-6.ogg` | chips handled: one click of a shuffle | 3,644 bytes |
| `sounds/win-1.m4a` | `Audio/chips-stack-3.ogg` | a stack of chips falling: the first of a win's clatter | 3,216 bytes |
| `sounds/win-2.m4a` | `Audio/chips-stack-1.ogg` | a chip on a stack: the rest of a win's clatter, climbing | 1,721 bytes |

36,540 bytes in all.

**What was done to them**, by `scripts/sounds-cut.mjs` on a Mac: each recording was decoded from Ogg Vorbis, mixed to one
channel, cut from where it first reaches a tenth of its peak to where it falls quiet (or to a length kept short), faded at
both ends, brought to the same peak level, and encoded as AAC at 48 kbit/s in an `.m4a`, which every current browser decodes,
Safari on an iPhone included. The empty padding the encoder leaves in the file was taken out. Then `pnpm sounds` writes
them into `src/sounds.ts` as base64, and a test fails if that module and the files fall out of step, or if a file is not
named on this page.

## Ideas

The challenges of Awase (the gold tile, the spark, the rush, fortune, the sand, the purge, blackout) and its options (hints,
shuffles and undo given or taken away, matching tiles shown) are written for this package from the ideas of **Mah**
by ffalt, [https://github.com/ffalt/mah](https://github.com/ffalt/mah), a mahjong solitaire under the MIT licence
(read 2026-10-01). No code and no layout of Mah's is used. The layouts here are Jarajara's own drawings of shapes anyone
may draw.

How a tile is drawn as a solid block (its thickness, the lift of each layer equal to it, a shadow that grows with height), why
a layout is scaled into a box of one size, and the gallery of cards of one size are written from reading how **Mah**
(MIT), **KMahjongg**'s tileset format, and **mahseum** draw and size theirs, and a reader's issue on danhquach/mahjongsolitaire
(read 2026-10-01). What each does, and what was and was not taken, is in [LOOK.md](LOOK.md). KMahjongg is GPL and mahseum states no
licence I could find, so both were looked at only; no code, art or number of theirs is used.
