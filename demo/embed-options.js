import { findFace, readNotation, isFaceCode } from "./dist/index.js";
import { TILE_DESIGNS, TILE_BACKS, CLOTHS } from "./dist/faces-entry.js";

// Embeds accept complete valid words; the library's forgiving reader remains unchanged.
export function validTiles(value) {
  const text = String(value ?? "");
  if (text.length > 1000) return null;
  const tiles = [];
  for (const word of text.split(/[\s,;]+/).filter(Boolean)) {
    const notation = readNotation(word);
    if (notation !== null) tiles.push(...notation);
    else if (findFace(word) !== null) tiles.push(findFace(word).code);
    else if ([...word].every(isFaceCode)) tiles.push(...word);
    else return null;
  }
  return tiles.length <= 144 ? tiles : null;
}

export const choices = { order: ["dealt", "suit", "rank", "kind", "code"], group: ["suit", "kind"], pick: ["", "one", "on", "true", "1", "off", "false", "no", "0"], design: TILE_DESIGNS, back: [...TILE_BACKS, ...TILE_DESIGNS], cloth: CLOTHS, size: ["small", "medium", "large"], theme: ["auto", "light", "dark"], lang: ["en", "ja"] };

export function validatedAttributes(query) {
  const attrs = [];
  const tiles = validTiles(query.get("tiles") ?? "123m456p789s1112z");
  if (tiles === null) return null;
  attrs.push(["tiles", tiles.join("")]);
  for (const [name, values] of Object.entries(choices)) if (values.includes(query.get(name))) attrs.push([name, query.get(name)]);
  for (const name of ["face-down", "red-fives", "sound"]) if (query.has(name)) {
    const value = query.get(name).trim().toLowerCase();
    if (["", "on", "true", "1", "off", "false", "no", "0"].includes(value)) attrs.push([name, ["off", "false", "no", "0"].includes(value) ? "false" : ""]);
  }
  for (const [name, min, max] of [["width", 20, 600], ["capacity", 0, 144]]) {
    const value = Number(query.get(name));
    if (query.has(name) && Number.isFinite(value) && value >= min && value <= max && (name !== "capacity" || Number.isInteger(value))) attrs.push([name, String(value)]);
  }
  for (const name of ["turned", "lifted", "marked"]) if (query.has(name)) {
    const value = query.get(name).trim();
    if (/^(?:\d+(?:[\s,]+\d+)*)?$/.test(value)) {
      const indexes = value === "" ? [] : value.split(/[\s,]+/).map(Number);
      if (indexes.every((index) => index < tiles.length)) attrs.push([name, [...new Set(indexes)].join(" ")]);
    }
  }
  const colour = query.get("back-colour");
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(colour ?? "")) attrs.push(["back-colour", colour]);
  for (const name of ["label", "mark"]) if (query.has(name) && query.get(name).length <= 200) attrs.push([name, query.get(name)]);
  return attrs;
}
