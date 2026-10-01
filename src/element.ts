/**
 * Jarajara's custom elements, as classes, with nothing defined: import this to extend them or to define them under
 * other names. `@johnmorrisdotca/jarajara/element/define` defines the lot as `<jarajara-tile>`, `<jarajara-rack>`,
 * `<jarajara-layout>`, `<jarajara-table>`, `<jarajara-group>`, `<jarajara-set>` and `<jarajara-viewer>`. Safe to import
 * on a server, where there is no page: the classes then extend nothing.
 */
export { JarajaraTile } from "./ui/tileElement.ts";
export { JarajaraRack } from "./ui/rackElement.ts";
export type { RackDetail, RackTurnOptions, TileRef } from "./ui/rackElement.ts";
export { allowanceOf, hintPair, JarajaraLayout } from "./ui/layoutElement.ts";
export type { Allowance } from "./ui/layoutElement.ts";
export { JarajaraTable } from "./ui/tableElement.ts";
export { JarajaraGroup, JarajaraSet, JarajaraViewer } from "./ui/viewerElements.ts";
export { ELEMENT_SIZES, followLanguage, languageOf } from "./ui/elementKit.ts";
export type { SpinOptions } from "./ui/elementKit.ts";
export { rackPlaces, rackWidth } from "./ui/rackLayout.ts";
export type { RackLayoutOptions, RackPlace } from "./ui/rackLayout.ts";
export { STRINGS } from "./ui/strings.ts";
