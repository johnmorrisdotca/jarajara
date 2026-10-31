/**
 * Jarajara's custom elements, as classes, with nothing defined: import this to extend them or to define them under
 * other names. `@johnmorrisdotca/jarajara/element/define` defines the lot as `<jarajara-tile>`, `<jarajara-rack>`,
 * `<jarajara-layout>`, `<jarajara-table>`, `<jarajara-group>`, `<jarajara-set>` and `<jarajara-viewer>`. Safe to import
 * on a server, where there is no page: the classes then extend nothing.
 */

export type { SpinOptions } from "./ui/elementKit.ts";
export { ELEMENT_SIZES, followLanguage, languageOf, MOST_SOUNDING, setPageSounds } from "./ui/elementKit.ts";
export type { Allowance } from "./ui/layoutElement.ts";
export { allowanceOf, hintPair, JarajaraLayout } from "./ui/layoutElement.ts";
export type { RackDetail, RackTurnOptions, TileRef } from "./ui/rackElement.ts";
export { JarajaraRack } from "./ui/rackElement.ts";
export type { RackLayoutOptions, RackPlace } from "./ui/rackLayout.ts";
export { rackPlaces, rackWidth } from "./ui/rackLayout.ts";
export { STRINGS } from "./ui/strings.ts";
export { JarajaraTable } from "./ui/tableElement.ts";
export { JarajaraTile } from "./ui/tileElement.ts";
export { JarajaraGroup, JarajaraSet, JarajaraViewer } from "./ui/viewerElements.ts";

import { JarajaraRack as Rack } from "./ui/rackElement.ts";
/** Register a rack under its standard tag or a host's own tag. Safe to call without a browser.
 * @param tag - The custom tag name; omitted to use the package default.
 * @returns Nothing; existing definitions and server imports remain safe.
 * @example
 * ```ts
 * import { defineRack } from "@johnmorrisdotca/jarajara/element";
 * defineRack();
 * console.log(typeof defineRack); // function
 * ```
 */
export function defineRack(tag = "jarajara-rack"): void {
  if (typeof customElements === "undefined" || customElements.get(tag) !== undefined) return;
  customElements.define(tag, tag === "jarajara-rack" ? Rack : class extends Rack {});
}
