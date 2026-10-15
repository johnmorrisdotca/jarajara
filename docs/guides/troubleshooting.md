---
title: Troubleshooting and FAQ
section: troubleshooting
order: 9
description: Find out why a pair cannot be taken, what null means, and why an element or sound does not work.
---

## A pair cannot be taken

Check both slots are present, uncovered, have an open side and match under the deal's bonus rule. blockedBy distinguishes coverage/sides and returns null for a free or empty slot. canTake checks the whole action. A matching hidden pair alone is not a legal move.

## What null means

faceOf/findFace/readNotation reject unknown codes/names or notation. Layout/drawing null can mean unsupported size or mismatched cell count; a tileBodySvg null means no custom plate is needed. runTake/runShuffle/runUndo/runHint and table actions reject an unavailable operation. runRemaining null means no clock. readTable/decodeTable/playSolve null means an invalid deal or record. computerPair/hintPair null means no legal pair.

## The tag or sound stays quiet

Register tags in browser code and use valid native attributes. A rack uses tiles; a single tile uses code; layout/table size is a layout identifier. Sound defaults to no activity until requested, and browsers may need a gesture. Verify mute/volume and call close on unmount. Artwork/audio loading failures should be shown rather than treated as a successful game action.

## A save differs

Keep original setup, face codes, move order, matching rule and shuffle count. Use native decoding/replay; never reinterpret slot indices after sorting the visual rack or layout. [Records](records-and-seeds.md) and [the embed guide](../ELEMENTS.md#embed-a-rack) contain the contracts.
