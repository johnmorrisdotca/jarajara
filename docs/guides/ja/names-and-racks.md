---
title: 名前・表記・手牌
section: how-to
order: 2
description: 牌のコードと表記を区別し、牌を変えずに手牌を並べ、手牌の要素を使います。
---

## コードと表記を分ける

42種類の図柄には1文字の内部コードがあります。readNotationは手牌の表記を、名前の関数は人が読む名前を扱います。不正な表記ではnullです。readTilesは表示用に柔軟に読みます。

```ts
import {readNotation,writeNotation,tileName,arrangeTiles} from "@johnmorrisdotca/jarajara";
const tiles = readNotation("123m456p789s1112z");
if (tiles) console.log(writeNotation(arrangeTiles(tiles,"suit")),tileName(tiles[0],"ja"));
```

## 物理的な種類を変えず並べる

配られた順、種類、数字、分類、コード順を選べます。グループ分けもあります。シードで混ぜる表示順は、新しい合法な配り方ではありません。普通の牌は4枚、花と季節は1枚で、全体は144枚です。

## 手牌の要素を使う

要素は牌、並び、グループ、裏返し、持ち上げ、印を扱います。構造化した情報も同じコードです。[埋め込み仕様](../../ELEMENTS.md#embed-a-rack)に反映する設定、形式、公開イベントがあります。
