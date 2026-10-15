---
title: Embed racks, elements and sounds
section: how-to
order: 6
description: Register the tile elements in a browser, embed a rack, and add optional sounds.
---

## Register browser elements

```ts no-run
import "@johnmorrisdotca/jarajara/element/define";
import {JarajaraRack} from "@johnmorrisdotca/jarajara/element";
const rack = document.createElement("jarajara-rack") as JarajaraRack;
rack.setAttribute("tiles","123m456p789s");
rack.setAttribute("lang","en");
document.body.append(rack);
console.log(rack.tagName);
```

The seven tags cover one tile, rack, solitaire layout, shared table, group, set and viewer. The element entry exports classes without registration. defineRack can register a rack under a custom host tag. The [embed contract](../ELEMENTS.md#embed-a-rack) lists rack attributes, host formats, structured detail and JSON-safe frame events. Frames read no storage.

## Keep audio optional

```ts no-run
import {createTileSounds} from "@johnmorrisdotca/jarajara/tile-sounds";
const sounds = createTileSounds({muted:false});
document.addEventListener("click",()=>sounds.play("pair"),{once:true});
console.log(sounds.volume);
```

Nothing fetches or plays until a sound is requested. Start sound from a user gesture where browser policy requires it, mute when desired and close the handle on unmount. Local count/gap/delay options sequence recordings; soundTimes exposes the schedule. Recorded audio is a separate entry with existing credits.
