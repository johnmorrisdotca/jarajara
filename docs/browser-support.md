# Browser support

The tags need custom elements, shadow DOM, container queries, `:has()` and `color-mix()`: Chrome and Edge 111, Safari 16.2 and Firefox 121, all of which are from 2023 on. The tiles' thickness is drawn with CSS 3D transforms, and sounds use the Web Audio API, which a browser without it replaces with silence. These are read off the features the code uses, not a tested list: the demo is played in a real Chromium at a phone's width (with touch) and a desk's, and in WebKit, Safari's engine, at a phone's width. Firefox is not in that run.

The package itself, the drawing (which is SVG text) and the command line need no DOM: they run in Node 22 or later, which CI tests on Linux, macOS and Windows, on 22 and 24. On a server the main entry, `/awase`, `/table`, `/faces` and `/element` are safe to import.
