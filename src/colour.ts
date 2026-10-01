/**
 * COLOUR ARITHMETIC for the drawings: reading `#rgb` and `#rrggbb`, mixing two colours, and how light one is. Kept
 * apart from the drawings so the backs, the tile bodies and the seams between tiles all work colours out the same way.
 */

/** A colour as its three channels, 0 to 255; null for text that is neither `#rgb` nor `#rrggbb`. */
export function rgbOf(text: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text.trim());
  if (hex === null) return null;
  const full = hex[1]!.length === 3 ? [...hex[1]!].map((digit) => digit + digit).join("") : hex[1]!;
  return [0, 2, 4].map((at) => parseInt(full.slice(at, at + 2), 16)) as [number, number, number];
}

/** `share` of the way from one colour to another, as `#rrggbb`. */
export function mixColours(from: [number, number, number], to: [number, number, number], share: number): string {
  return `#${from.map((value, at) => Math.round(value + (to[at]! - value) * share).toString(16).padStart(2, "0")).join("")}`;
}

/** How light a colour is, 0 (black) to 1 (white). A text that is no colour counts as middling. */
export function lightness(text: string): number {
  const rgb = rgbOf(text);
  return rgb === null ? 0.5 : (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
}

/** A colour moved towards white (`share` above 0) or towards black (below 0), as `#rrggbb`; the text itself if it is no colour. */
export function shade(text: string, share: number): string {
  const rgb = rgbOf(text);
  if (rgb === null) return text;
  return share >= 0 ? mixColours(rgb, [255, 255, 255], share) : mixColours(rgb, [0, 0, 0], -share);
}
