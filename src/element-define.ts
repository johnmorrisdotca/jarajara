/**
 * Defines Jarajara's custom elements on the page: `<jarajara-tile>`, `<jarajara-rack>`, `<jarajara-layout>`,
 * `<jarajara-table>`, `<jarajara-group>`, `<jarajara-set>` and `<jarajara-viewer>`. Import it for its effect:
 *
 * ```html
 * <script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/jarajara@1/dist/element-define.js"></script>
 * <jarajara-tile code="east" flip></jarajara-tile>
 * ```
 *
 * A tag already defined is left as it is, and on a server, where there is no page, nothing happens.
 */
import { JarajaraGroup, JarajaraLayout, JarajaraRack, JarajaraSet, JarajaraTable, JarajaraTile, JarajaraViewer } from "./element.ts";
import { defineElement } from "./ui/elementKit.ts";

defineElement("jarajara-tile", JarajaraTile);
defineElement("jarajara-rack", JarajaraRack);
defineElement("jarajara-layout", JarajaraLayout);
defineElement("jarajara-table", JarajaraTable);
defineElement("jarajara-group", JarajaraGroup);
defineElement("jarajara-set", JarajaraSet);
defineElement("jarajara-viewer", JarajaraViewer);
