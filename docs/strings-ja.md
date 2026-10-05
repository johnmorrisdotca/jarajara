# Jarajara's words, in English and Japanese

Made from `src/ui/strings.ts` and `src/cliWords.ts` by `pnpm docs:make`; a test fails if the two differ, so this list is never out of date.

**The Japanese has not yet been reviewed by a native reader.** If a line reads wrongly or unnaturally, please
open a *Fix a translation* issue with the string's name. `{name}` and the other braces are filled in when shown. The tiles' own
names are `faceWords` and `faceWordsJa` in `src/names.ts`, and the demo page's words are `WORDS` in `demo/words.js`.

## The tags

| Name | English | Japanese |
| --- | --- | --- |
| `tileFaceDown` | tile, face down | 伏せた牌 |
| `tileMarked` | {tile}, marked | {tile}、印あり |
| `tileLifted` | {tile}, raised | {tile}、持ち上げ |
| `tileBlank` | tile, blank | 空白の牌 |
| `rackLabel` | {n} tiles: {tiles} | {n}枚の牌：{tiles} |
| `rackEmpty` | no tiles | 牌なし |
| `rackFaceDown` | {n} tiles, face down | {n}枚の伏せた牌 |
| `groupLabel` | {group}: {tiles} | {group}：{tiles} |
| `setLabel` | The set: {n} tiles in {faces} faces | 牌のセット：{faces}種類、{n}枚 |
| `setHolds` | {have} of {total} tiles | {total}枚のうち{have}枚 |
| `copies` | ×{n} | ×{n} |
| `viewerLabel` | Tile viewer | 牌ビューア |
| `viewerNone` | No tile is called that. | その名前の牌はありません。 |
| `viewerType` | Type a code, a name or a hand | コード、名前、手牌を入力 |
| `viewerCode` | Code | コード |
| `viewerSuit` | Suit | 種類 |
| `viewerRank` | Rank | 数 |
| `viewerCopies` | Copies in the set | セットの枚数 |
| `viewerPoints` | Points at the table | 卓での点 |
| `viewerNotation` | Hand notation | 手牌表記 |
| `viewerJapanese` | In Japanese | 日本語 |
| `layoutLabel` | Mahjong layout, {n} tiles left | 麻雀の配置、残り{n}枚 |
| `layoutLined` | {n} tiles lined up, sorted by {keys} | {n}枚を{keys}の順に並べました |
| `left` | {tiles} tiles left · {pairs} {pairsWord} you can take | 残り{tiles}枚・取れる組{pairs} |
| `pair` | pair | 組 |
| `pairs` | pairs | 組 |
| `stuck` | No pair can be taken. Shuffle the tiles that are left, or undo. | 取れる組がありません。残りの牌を混ぜるか、戻してください。 |
| `lost` | No shuffle can free what is left. | 混ぜても取れる牌が出ません。 |
| `blocked` | That tile is not free: something lies on it, or both its sides are closed. | その牌はまだ取れません。上に牌が載っているか、両側がふさがっています。 |
| `noMatch` | Those two do not match. | その二枚は同じ牌ではありません。 |
| `cleared` | Cleared, in {seconds} seconds. | 完成！{seconds}秒でした。 |
| `timeUp` | Time is up. | 時間切れです。 |
| `newDeal` | New deal | 新しく配る |
| `undo` | Undo | 戻す |
| `hint` | Hint | ヒント |
| `shuffle` | Shuffle | 混ぜる |
| `hintsLeft` | {n} hints left | ヒントあと{n}回 |
| `shufflesLeft` | {n} shuffles left | 混ぜるあと{n}回 |
| `noHints` | No hints are left. | ヒントはもうありません。 |
| `noFreeMatch` | No free tile matches that one. Here is another pair. | その牌と組める空き牌はありません。別の組を示します。 |
| `flip` | Flip | 反転 |
| `noShuffles` | No shuffles are left. | 混ぜる回数がもうありません。 |
| `sortedBy` | Sorted by {keys} | {keys}の順 |
| `won` | Won, with {score} points. | 勝ち！{score}点でした。 |
| `gold` | Take a pair of the gold tile. | 金の牌の組を取ってください。 |
| `spark` | The spark is on {tile}. | 火花は{tile}にあります。 |
| `sand` | Every pair adds time. | 取るたびに時間が増えます。 |
| `blackout` | Only free tiles show their faces. | 空いている牌だけ絵柄が見えます。 |
| `purge` | Take every {suit} tile ({done} of {goal}). | {suit}の牌をすべて取ってください（{done}／{goal}）。 |
| `tableTurn` | {name}, take a pair. | {name}さんの番です。一組取ってください。 |
| `tableThinking` | {name} is thinking. | {name}が考えています。 |
| `tableOver` | Done. Most points: {names}. | 終了。最高得点：{names}。 |
| `tableLabel` | Awase at a table of {n} | {n}人の合わせ |
| `rush` | {done} of {goal} pairs | {done}／{goal}組 |
| `fortune` | {score} of {goal} points | {score}／{goal}点 |

## The command line

The usage text (`--help`) is a block of prose of its own, in `usage`, and is left out here.

| Name | English | Japanese |
| --- | --- | --- |
| `tryHelp` | Try jarajara --help. | jarajara --help を見てください。 |
| `unknownOption` | no option called {part}. | {part}というオプションはありません。 |
| `needsValue` | {part} needs a value after it. | {part}の後に値が必要です。 |
| `noCommand` | no command called {part}. | {part}というコマンドはありません。 |
| `langBad` | --lang is en or ja. | --lang は en か ja です。 |
| `seedBad` | a seed is a whole number from 1 to 2147483647. | シードは1から2147483647までの整数です。 |
| `seedRuleClash` | seed {seed} is a deal under the {seedRule} rule, not the {rule} rule. | シード{seed}は{seedRule}の規則の配牌で、{rule}の規則ではありません。 |
| `layoutBad` | no layout is called {part}. jarajara layouts lists them. | {part}という配置はありません。jarajara layouts で一覧が出ます。 |
| `levelBad` | a level is easy, medium or hard. | 難しさは easy、medium、hard のどれかです。 |
| `ruleBad` | a rule is group or same. | 規則は group か same です。 |
| `playersBad` | a table is {least} to {most} players. | 卓は{least}人から{most}人までです。 |
| `dateBad` | a date is written 2026-10-01, and has to be a real day. | 日付は2026-10-01の形で、実在する日にしてください。 |
| `freshSeed` | no seed given; drew {seed}. | シードの指定がないので{seed}を引きました。 |
| `layoutRow` | {size}  {key}  {tiles} tiles, {layers} layers | {size}  {key}  {name}  {tiles}枚、{layers}段 |
| `dealHead` | {name}, {tiles} tiles, {level}, seed {seed}, {rule} rule | {name}、{tiles}枚、{level}、シード{seed}、{rule}の規則 |
| `layerHead` | Layer {n} | {n}段目 |
| `rule_group` | usual | ふつう |
| `rule_same` | identical | 同じ牌のみ |
| `dealTiles` | Tiles: {givens} | 牌：{givens} |
| `dealAnswer` | One way to clear it: {answer} | 取り切る一つの方法：{answer} |
| `dailyLine` | {date}: {name}, {level}, seed {seed}, challenge {challenge} | {date}：{name}、{level}、シード{seed}、チャレンジ{challenge} |
| `dailyDeal` | jarajara deal --layout {size} --level {level} --seed {seed} | jarajara deal --layout {size} --level {level} --seed {seed} |
| `checkNeeds` | check needs the moves, as a word or from --stdin, and a deal: --seed (with --level) or --givens. | check には手順（語として、または --stdin）と配牌（--seed と --level、または --givens）が必要です。 |
| `checkCleared` | Cleared: {pairs} pairs and {shuffles} shuffles take every tile. | 完成：{pairs}組と{shuffles}回の混ぜで全部取れます。 |
| `checkNot` | Not cleared: {reason}. | 取り切れません：{reason}。 |
| `checkNotDeal` | the tiles are not a deal of that layout | その牌はこの配置の配牌ではありません |
| `checkNotMoves` | the moves are not a list of moves | 手順として読めません |
| `checkNotAllowed` | a move the rules do not allow | 規則で許されない手があります |
| `checkLeft` | tiles are left on the layout | 牌が残っています |
| `played` | Awase at a table of {n}: {name}, {level}, seed {seed}. {pairs} pairs taken, {shuffles} shuffles. | {n}人の合わせ：{name}、{level}、シード{seed}。{pairs}組を取り、{shuffles}回混ぜました。 |
| `seatLine` | {name}: {points} points, {pairs} pairs | {name}：{points}点、{pairs}組 |
| `seatName` | Computer {n} | コンピュータ{n} |
| `winner` | Winner: {names}. | 勝ち：{names}。 |
| `winners` | Tied: {names}. | 同点：{names}。 |
| `tileNone` | no tile is called that. | その名前の牌はありません。 |
| `tileNeeds` | tile needs a name, a code or a hand: jarajara tile east, jarajara tile 3p, jarajara tile 123m456p. | tile には名前、コード、手牌が必要です：jarajara tile east、jarajara tile 3p、jarajara tile 123m456p。 |
| `tileLine` | {code}  {en}  {ja}  {suit} {rank}, {copies} in the set, written {notation} | {code}  {en}  {ja}  {suit} {rank}、セットに{copies}枚、表記 {notation} |
| `and` |  and  | と |

## The layouts' names

| Key | English | Japanese |
| --- | --- | --- |
| `tiny` | Tiny | 小 |
| `torii` | Torii | 鳥居 |
| `fuji` | Fuji | 富士 |
| `castle` | Castle | 城 |
| `turtle` | Turtle | 亀 |
| `pagoda` | Pagoda | 塔 |
| `fortress` | Fortress | 砦 |
| `pyramid` | Pyramid | 角錐 |
| `bridge` | Bridge | 橋 |
| `butterfly` | Butterfly | 蝶 |
| `dragon` | Dragon | 龍 |
| `wall` | Wall | 長城 |
| `palace` | Palace | 宮殿 |
