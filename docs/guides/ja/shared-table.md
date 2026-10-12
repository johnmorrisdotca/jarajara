---
title: 対戦卓で遊ぶ
section: how-to
order: 5
description: 対戦卓で遊ぶの使い方と注意点。
---

## 記録した組から状態を読む

startTableは初期配置、名前、取った組を保存します。readTableは再生し、不正な設定や組でnullになります。2〜4人で同じ配置を使い、今の候補を問い合わせます。

```ts
import {generateAwase} from "@johnmorrisdotca/jarajara/awase";
import {startTable,readTable,tablePairs,playAtTable} from "@johnmorrisdotca/jarajara/table";
const table = startTable(generateAwase(4,"easy",2026),[{name:"Seat 1"},{name:"Seat 2"}]);
const state = readTable(table)!;
const pair = tablePairs(table,state)[0];
console.log(playAtTable(table,pair[0],pair[1],state)?.state.scores);
```

## 得点と手番

普通の数牌は1点、1と9は2点、風は3点、龍は4点、花や季節は2点でさらに1手です。詰まると可能なら自動で混ぜます。最高点が勝ちで同点なら共有します。ひとり用の時計をこのルールに入れません。

## 相手と復元

コンピューターも本来の合法な組を選びます。再生した状態を渡すと、毎回全履歴を読み直す必要がありません。保存も同じ再生で確認します。名前はローカル表示用で、共有には公開用の席名を選びます。
