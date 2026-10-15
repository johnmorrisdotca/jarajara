---
title: ひとり遊びと挑戦
section: how-to
order: 4
description: 自由で一致する組を取り、挑戦では時刻を自分で渡し、ヒントと拒否の扱いを保ちます。
---

## 自由な一致する組を取る

上に牌がなく、横のどちらかが開くと取れます。canTakeは自由かと一致するかを合わせます。通常は花同士、季節同士が一致し、同一のルールでは同じ図柄が必要です。シードからルールを読みます。

```ts
import {generateAwase,startRun,runPairs,runTake,readRun} from "@johnmorrisdotca/jarajara/awase";
let run = startRun(generateAwase(4,"easy",2026),{},0);
const pair = runPairs(run)[0];
const next = runTake(run,pair[0],pair[1],1000);
if (next) run = next;
console.log(readRun(run,1000).tilesLeft,run.pairs);
```

## 時刻を明示して渡す

挑戦の関数にはミリ秒の時刻を渡します。基本機能は時計を読まず、残り時間や目標を計算します。普通の遊びでは残り時間がnullです。時間切れ後の組で負けになる場合があるため、表示側で別の計算をしません。

## 補助と拒否を保つ

取る、混ぜる、戻す、ヒントは拒否するとnullです。戻しても時間は返りません。混ぜるのは詰まったときです。ヒントは回数を使い、選んだ牌の相手かどうかも返します。日替わりはUTCから同じ設定を選びます。[記録](records-and-seeds.md)を参照してください。
