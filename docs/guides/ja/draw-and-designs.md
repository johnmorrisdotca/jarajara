---
title: SVGと図柄を選ぶ
section: how-to
order: 3
description: 牌と配置をSVGの文字列または要素で描き、必要な図柄だけを読み込み、SVGの識別子を分けます。
---

## 文字列か要素で描く

描画用エントリーは牌、裏、積み重ねた配置のSVG文字列を返します。不正な入力ではnullの場合があります。表示の大きさはCSSで選び、向きを変えてもゲームは変わりません。

```ts
import {tileSvg,layoutSvg} from "@johnmorrisdotca/jarajara/faces";
import {generateAwase} from "@johnmorrisdotca/jarajara/awase";
const deal = generateAwase(4,"easy",2026);
console.log(tileSvg("a",{title:"One of characters"})?.startsWith("<svg"));
console.log(layoutSvg(4,deal.givens,{showFree:true})?.length);
```

## 必要な図柄だけを読む

標準の図柄はすぐ使えます。リーチと黒いリーチは別の読み込み先です。牌の板、裏、普通の図柄を持ち、ない花や季節には標準の図柄を使います。再利用する図柄と音には既存の[CREDITS.md](../../../CREDITS.md)を保ちます。

## SVGの識別子を分ける

共有する図柄には自分の接頭辞を使います。配置の描画には選択、ヒント、一致、検索、自由な牌の印があります。積み重ねの位置を推測せず、パッケージの座標と枠を使います。[配置](stacked-layouts.md)を参照してください。
