import type { TileLanguage } from "./names.ts";

/**
 * THE WORDS THE COMMAND LINE SAYS, in the two languages the family speaks, and what each layout is called in Japanese
 * (the English name is the layout's key, capitalised). `{name}` marks where a value goes (`fillIn` in `ui/strings.ts`).
 * The Japanese has not yet been reviewed by a native reader.
 */
export const LAYOUT_NAMES_JA: Readonly<Record<string, string>> = {
  tiny: "小",
  torii: "鳥居",
  fuji: "富士",
  castle: "城",
  turtle: "亀",
  pagoda: "塔",
  fortress: "砦",
  pyramid: "角錐",
  bridge: "橋",
  butterfly: "蝶",
  dragon: "龍",
  wall: "長城",
  palace: "宮殿",
};

/** The command line's words. */
export const CLI_STRINGS: Readonly<Record<TileLanguage, Record<string, string>>> = {
  en: {
    usage: `jarajara: mahjong tiles and Awase, the matching solitaire, on the command line

Usage: jarajara <command> [options]

Commands:
  layouts            the layouts: width, name, tiles and layers
  deal               make a deal of Awase and print it, layer by layer
  daily              the day's game: layout, level, seed and challenge
  check <moves>      play a solve on a deal, and say whether it clears it
  play               computers play Awase at a table to the end
  tile <name>        look a tile up by name, code or hand notation

Options:
  -l, --layout <width|name>   a layout by its width (15) or its name (turtle); the Turtle if left out
      --level <level>         easy, medium or hard; medium if left out
  -s, --seed <number>         a whole number from 1 to 2147483647; drawn, and said, if left out
      --rule <rule>           group or same: how flowers and seasons match, for a seed drawn here
  -p, --players <number>      at the table, 2 to 4; 2 if left out
      --date <date>           the day, as 2026-10-01; today if left out
      --givens <tiles>        check: a deal written as text, instead of a seed
      --stdin                 check: read the moves from standard input
  -j, --json                  print JSON
      --lang <en|ja>          English or Japanese; the environment's language if left out
  -h, --help                  this text
  -v, --version               the version
`,
    tryHelp: "Try jarajara --help.",
    unknownOption: "no option called {part}.",
    needsValue: "{part} needs a value after it.",
    noCommand: "no command called {part}.",
    langBad: "--lang is en or ja.",
    seedBad: "a seed is a whole number from 1 to 2147483647.",
    seedRuleClash: "seed {seed} is a deal under the {seedRule} rule, not the {rule} rule.",
    layoutBad: "no layout is called {part}. jarajara layouts lists them.",
    levelBad: "a level is easy, medium or hard.",
    ruleBad: "a rule is group or same.",
    playersBad: "a table is {least} to {most} players.",
    dateBad: "a date is written 2026-10-01, and has to be a real day.",
    freshSeed: "no seed given; drew {seed}.",
    layoutRow: "{size}  {key}  {tiles} tiles, {layers} layers",
    dealHead: "{name}, {tiles} tiles, {level}, seed {seed}, {rule} rule",
    layerHead: "Layer {n}",
    rule_group: "usual",
    rule_same: "identical",
    dealTiles: "Tiles: {givens}",
    dealAnswer: "One way to clear it: {answer}",
    dailyLine: "{date}: {name}, {level}, seed {seed}, challenge {challenge}",
    dailyDeal: "jarajara deal --layout {size} --level {level} --seed {seed}",
    checkNeeds: "check needs the moves, as a word or from --stdin, and a deal: --seed (with --level) or --givens.",
    checkCleared: "Cleared: {pairs} pairs and {shuffles} shuffles take every tile.",
    checkNot: "Not cleared: {reason}.",
    checkNotDeal: "the tiles are not a deal of that layout",
    checkNotMoves: "the moves are not a list of moves",
    checkNotAllowed: "a move the rules do not allow",
    checkLeft: "tiles are left on the layout",
    played: "Awase at a table of {n}: {name}, {level}, seed {seed}. {pairs} pairs taken, {shuffles} shuffles.",
    seatLine: "{name}: {points} points, {pairs} pairs",
    seatName: "Computer {n}",
    winner: "Winner: {names}.",
    winners: "Tied: {names}.",
    tileNone: "no tile is called that.",
    tileNeeds: "tile needs a name, a code or a hand: jarajara tile east, jarajara tile 3p, jarajara tile 123m456p.",
    tileLine: "{code}  {en}  {ja}  {suit} {rank}, {copies} in the set, written {notation}",
    and: " and ",
  },
  ja: {
    usage: `jarajara：麻雀牌と合わせ（マッチングソリティア）のコマンドライン

使い方：jarajara <コマンド> [オプション]

コマンド：
  layouts            配置の一覧：幅、名前、牌の数、段の数
  deal               合わせの配牌を段ごとに表示
  daily              今日のゲーム：配置、難しさ、シード、チャレンジ
  check <手順>       手順を配牌に当てはめ、すべて取れるか確かめる
  play               コンピュータ同士が卓で最後まで合わせる
  tile <名前>        名前、コード、手牌表記で牌を調べる

オプション：
  -l, --layout <幅|名前>      配置を幅（15）か名前（turtle）で指定。省略は亀
      --level <難しさ>        easy、medium、hard。省略はmedium
  -s, --seed <数>             1から2147483647までの整数。省略すると引いて表示
      --rule <規則>           group か same：花牌と季節牌の合い方（ここで引くシード用）
  -p, --players <数>          卓の人数、2〜4。省略は2
      --date <日付>           2026-10-01の形。省略は今日
      --givens <牌>           check：シードの代わりに文字で書いた配牌
      --stdin                 check：手順を標準入力から読む
  -j, --json                  JSONで表示
      --lang <en|ja>          英語か日本語。省略は環境の言語
  -h, --help                  このテキスト
  -v, --version               バージョン
`,
    tryHelp: "jarajara --help を見てください。",
    unknownOption: "{part}というオプションはありません。",
    needsValue: "{part}の後に値が必要です。",
    noCommand: "{part}というコマンドはありません。",
    langBad: "--lang は en か ja です。",
    seedBad: "シードは1から2147483647までの整数です。",
    seedRuleClash: "シード{seed}は{seedRule}の規則の配牌で、{rule}の規則ではありません。",
    layoutBad: "{part}という配置はありません。jarajara layouts で一覧が出ます。",
    levelBad: "難しさは easy、medium、hard のどれかです。",
    ruleBad: "規則は group か same です。",
    playersBad: "卓は{least}人から{most}人までです。",
    dateBad: "日付は2026-10-01の形で、実在する日にしてください。",
    freshSeed: "シードの指定がないので{seed}を引きました。",
    layoutRow: "{size}  {key}  {name}  {tiles}枚、{layers}段",
    dealHead: "{name}、{tiles}枚、{level}、シード{seed}、{rule}の規則",
    layerHead: "{n}段目",
    rule_group: "ふつう",
    rule_same: "同じ牌のみ",
    dealTiles: "牌：{givens}",
    dealAnswer: "取り切る一つの方法：{answer}",
    dailyLine: "{date}：{name}、{level}、シード{seed}、チャレンジ{challenge}",
    dailyDeal: "jarajara deal --layout {size} --level {level} --seed {seed}",
    checkNeeds: "check には手順（語として、または --stdin）と配牌（--seed と --level、または --givens）が必要です。",
    checkCleared: "完成：{pairs}組と{shuffles}回の混ぜで全部取れます。",
    checkNot: "取り切れません：{reason}。",
    checkNotDeal: "その牌はこの配置の配牌ではありません",
    checkNotMoves: "手順として読めません",
    checkNotAllowed: "規則で許されない手があります",
    checkLeft: "牌が残っています",
    played: "{n}人の合わせ：{name}、{level}、シード{seed}。{pairs}組を取り、{shuffles}回混ぜました。",
    seatLine: "{name}：{points}点、{pairs}組",
    seatName: "コンピュータ{n}",
    winner: "勝ち：{names}。",
    winners: "同点：{names}。",
    tileNone: "その名前の牌はありません。",
    tileNeeds: "tile には名前、コード、手牌が必要です：jarajara tile east、jarajara tile 3p、jarajara tile 123m456p。",
    tileLine: "{code}  {en}  {ja}  {suit} {rank}、セットに{copies}枚、表記 {notation}",
    and: "と",
  },
};
