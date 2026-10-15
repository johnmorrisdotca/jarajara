---
title: 手牌・要素・音の埋め込み
section: how-to
order: 6
description: 牌の要素をブラウザーに登録し、手牌を埋め込み、任意の音を加えます。
---

## ブラウザーで要素を登録する

```ts no-run
import "@johnmorrisdotca/jarajara/element/define";
import {JarajaraRack} from "@johnmorrisdotca/jarajara/element";
const rack = document.createElement("jarajara-rack") as JarajaraRack;
rack.setAttribute("tiles","123m456p789s");
rack.setAttribute("lang","en");
document.body.append(rack);
console.log(rack.tagName);
```

7種類のタグで牌、手牌、ひとりの配置、対戦卓、グループ、全体、表示を扱います。クラスだけのエントリーもあります。[埋め込み仕様](../../ELEMENTS.md#embed-a-rack)に属性、形式、取得値、フレームのイベントがあります。フレームは保存領域を読みません。

## 音を任意にする

```ts no-run
import {createTileSounds} from "@johnmorrisdotca/jarajara/tile-sounds";
const sounds = createTileSounds({muted:false});
document.addEventListener("click",()=>sounds.play("pair"),{once:true});
console.log(sounds.volume);
```

音を求めるまで取得も再生もしません。必要なら利用者の操作から始め、ミュートできるようにし、取り外すときcloseを呼びます。回数、間隔、待ち時間の設定があります。録音は別のエントリーで、既存の出典を保ちます。
