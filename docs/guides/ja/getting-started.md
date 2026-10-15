---
title: はじめに
section: tutorial
order: 1
description: Jarajaraを入れ、シードで「合わせ」の配置を配ります。
---

Jarajaraには麻雀牌、積み重ねた配置、SVGの図柄、牌を合わせるひとり遊びがあります。対戦卓は2〜4人の組を取る得点ゲームで、リーチ麻雀の1局全体や点数計算のエンジンではありません。

## インストール

```sh
npm install @johnmorrisdotca/jarajara
```

Node 22以降や新しいブラウザーで使える型付きのESモジュールです。基本ルールと文字列の描画にページは不要です。要素の登録は別のエントリーです。

## シードから「合わせ」を配る

```ts
import {generateAwase,checkAwase} from "@johnmorrisdotca/jarajara/awase";
const deal = generateAwase(4,"easy",2026);
console.log(deal.size,deal.givens.length);
console.log(checkAwase(deal.size,deal.givens,deal.solution));
```

sizeは牌の総数ではなく横幅で、4は収録された小さい配置です。配った牌と、操作の記録としての解答を持ちます。取れる順序があることを保証しますが、別の選び方で詰まる場合もあります。

## 次の使い方

[名前と手牌](names-and-racks.md)、[SVGと図柄](draw-and-designs.md)、[ひとりと挑戦](play-awase.md)、[対戦卓](shared-table.md)、[要素と音](embed-and-sounds.md)、[API](entry:main)へ進みます。
