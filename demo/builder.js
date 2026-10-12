import { VERSION } from "./dist/index.js";
import { JarajaraRack } from "./dist/element.js";
import "./dist/element-define.js";
import { choices, validTiles } from "./embed-options.js";
import { familyEmbedBuilder, FAMILY_EMBED_BUILDER_WORDS } from "./family-embed-builder.js";

const words = {
  en: {
    ...FAMILY_EMBED_BUILDER_WORDS.en, pageDocs: "Docs", pageApi: "API reference",
    pitch: "Arrange a rack of mahjong tiles, preview it, and copy the code for your page.",
    name: "Jarajara is the Japanese sound of mahjong tiles rattling together.",
    nameLink: "About the name",
    foot: "The setup is in the link. No game or personal data is stored.",
    toGallery: "The tile table",
    makerRack: "A rack",
    makerRackSays: "A rack for a strategy article or a tile display.",
    copyLink: "Copy a link to this rack",
    badTiles: "Use valid tiles, such as 123m456p789s1112z."
  },
  ja: {
    ...FAMILY_EMBED_BUILDER_WORDS.ja, pageDocs: "ドキュメント", pageApi: "API（英語）",
    pitch: "麻雀牌の手牌を並べ、表示を確認して、ページに埋め込むコードをコピーできます。",
    name: "「ジャラジャラ」は、麻雀牌がぶつかり合う音です。",
    nameLink: "名前について",
    foot: "設定はリンクに入ります。ゲームや個人情報は保存しません。",
    toGallery: "牌のテーブル",
    makerRack: "手牌",
    makerRackSays: "攻略記事などで、手牌を見せるために使います。",
    copyLink: "この手牌へのリンクをコピー",
    badTiles: "123m456p789s1112z のような、有効な牌のコードを使ってください。"
  },
};
const row = (id, kind, en, ja, extra = {}) => ({ id, kind, group: "rack", names: { rack: id }, say: { en: { label: en[0], help: en[1] }, ja: { label: ja[0], help: ja[1] } }, ...extra });
const options = [
  row("tiles", "text", ["Tiles", "Tile codes, names or hand notation."], ["牌", "牌のコード・名前、または手牌の表記です。"], { default: "123m456p789s1112z" }),
  row("size", "choice", ["Display size", "Small, medium or large tiles."], ["表示の大きさ", "小・中・大の牌を選びます。"], { choices: choices.size, default: "medium" }),
  row("width", "number", ["Tile width", "Each tile's width in pixels. The rack scales to fit."], ["牌の幅", "牌1枚の幅をピクセルで指定します。手牌は表示枠に収まります。"], { range: { min: 20, max: 600, step: 2 } }),
  row("order", "choice", ["Order", "Keep the deal, or sort the rack."], ["並べ方", "配られた順番のまま、または並べ替えます。"], { choices: choices.order, default: "dealt" }),
  row("group", "choice", ["Group", "Leave gaps between suits or kinds."], ["区切り", "種類ごとに隙間を空けます。"], { choices: choices.group }),
  row("pick", "choice", ["Pick on tap", "Lift tiles with a tap or keyboard. One allows one lifted tile."], ["選ぶ操作", "タップやキー操作で牌を持ち上げます。「one」を選ぶと1枚だけ選べます。"], { choices: ["on", "one", "off"] }),
  row("capacity", "number", ["Capacity", "Keep room for this many tiles."], ["置ける枚数", "この枚数の牌を置く場所を確保します。"], { range: { min: 0, max: 144, step: 1 } }),
  row("design", "choice", ["Design", "The artwork used for the faces."], ["デザイン", "牌の表に使う絵柄です。"], { choices: choices.design, default: "jarajara" }),
  row("back", "choice", ["Back", "A built-in back or a design's own back."], ["裏面", "標準の裏面、またはデザインの裏面です。"], { choices: choices.back }),
  row("back-colour", "colour", ["Back colour", "An optional colour for the back."], ["裏面の色", "裏面の色を指定します。指定は任意です。"]),
  row("cloth", "choice", ["Cloth", "A cloth beneath the rack."], ["テーブルの色", "手牌の下に敷く布です。"], { choices: choices.cloth }),
  row("lang", "choice", ["Language", "The language of the spoken tile names."], ["言語", "読み上げる牌の名前の言語です。"], { choices: choices.lang }),
  row("theme", "choice", ["Theme", "Light, dark or the device's preference."], ["配色", "明るい配色・暗い配色、または端末の設定に合わせます。"], { choices: choices.theme, default: "auto" }),
  row("label", "text", ["Spoken label", "An optional label for a screen reader."], ["読み上げる名前", "スクリーンリーダー用の名前です。指定は任意です。"]),
  ...["face-down", "red-fives", "sound"].map((id, at) => row(id, "boolean", [["Face down", "Show every tile's back."], ["Red fives", "Use red fives where the design supports them."], ["Sound", "Play tile sounds during actions."]][at], [["裏向き", "すべての牌の裏を表示します。"], ["赤五", "対応するデザインで赤五を使います。"], ["音", "操作に合わせて牌の音を出します。"]][at], { default: false })),
  ...["turned", "lifted", "marked"].map((id, at) => row(id, "text", [["Turned tiles", "Indexes of tiles showing the opposite side, starting at zero."], ["Lifted tiles", "Indexes of raised tiles, starting at zero."], ["Marked tiles", "Indexes of tiles carrying a mark, starting at zero."]][at], [["反対向きの牌", "反対の面を表示する牌の位置です。0から数えます。"], ["持ち上げる牌", "持ち上げる牌の位置です。0から数えます。"], ["印を付ける牌", "印を付ける牌の位置です。0から数えます。"]][at])),
  row("mark", "text", ["Mark", "The mark drawn on marked tiles."], ["印の種類", "印を付けた牌に表示する印です。"]),
];
let mounted;
const page = globalThis.familyLanguage({ id: "jarajara", words, onChange: () => { docsLink(); mounted?.draw(); } });
const builder = familyEmbedBuilder({ id: "jarajara", packageName: "@johnmorrisdotca/jarajara", major: VERSION.split(".")[0], site: "https://johnmorrisdotca.github.io/jarajara/", title: "Jarajara · rack", titleJa: "手牌の埋め込み", options, leftOut: {}, groups: { rack: { en: "The rack", ja: "手牌の設定" } }, makers: { rack: { names: "rack", element: "rack", tag: "jarajara-rack", embed: "embed/", required: ["tiles"], description: "makerRackSays", formats: ["element", "iframe", "module", "react", "vue", "svelte", "angular", "html", "url"], width: 720, height: (settings) => Math.ceil((Number(settings.width) || ({ small: 32, medium: 48, large: 72 }[settings.size] ?? 48)) * 2.2) + 28 } }, code: ({ maker, format, settings }) => {
  if (validTiles(settings.tiles ?? "123m456p789s1112z") === null) return null;
  if ((format === "iframe" || format === "url") && settings.lang === undefined) return builder.codeFor(maker, format, options, { ...settings, lang: page.lang });
  return undefined;
} });
builder.validateCoverage({ rack: JarajaraRack.observedAttributes });
mounted = builder.mount({ words, language: () => page, colourDefault: () => "#2f5d4a", initial: { rack: { tiles: "123m456p789s1112z", lang: page.lang } }, renderPreview: ({ stage, settings, attrs, note, say }) => {
  if (validTiles(settings.tiles ?? "123m456p789s1112z") === null) { note.textContent = say("badTiles"); return { destroy() {} }; }
  const rack = globalThis.document.createElement("jarajara-rack");
  for (const [name, value] of attrs) rack.setAttribute(name, value);
  stage.append(rack);
  return { destroy() { rack.remove(); } };
} });

function docsLink() { document.querySelector('[data-say="pageDocs"]')?.setAttribute("href", page.lang === "ja" ? "docs/ja/index.html" : "docs/index.html"); }
docsLink();
