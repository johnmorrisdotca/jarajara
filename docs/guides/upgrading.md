---
title: Upgrading and moving from other libraries
section: upgrading
order: 10
description: Keep the 1.x baseline and choose the right feature when coming from another mahjong library.
---

## Preserve the 1.x baseline

The original five layouts and seeded deals remain stable; new layouts, challenges, visual designs and rack methods extend that baseline. Keep recorded layout identifiers and face-code order.

## Choose the matching contract

A generic mahjong tile renderer need not have Awase rules, and a riichi round engine is a different game. Use Jarajara's faces for SVG, root for layout/matching records, awase for solo challenges and table for its native scoring table. Adapt notation through native readers instead of assuming another library's face indices match.

## Verify an upgrade

Replay known completed and partial records, test group/same bonus rules, validate shadows/geometry and language changes, and keep browser element cleanup. Preserve existing credits for optional assets. [CHANGELOG.md](../../CHANGELOG.md), [CREDITS.md](../../CREDITS.md) and [native embeds](../ELEMENTS.md#embed-a-rack) retain detailed compatibility and provenance.
