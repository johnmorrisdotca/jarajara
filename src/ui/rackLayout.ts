/**
 * WHERE TILES LIE IN A RACK: the arithmetic behind the rack element, kept apart from the DOM so that it is the same in
 * every browser and is tested without one. Tiles stand side by side in one row; a group starts after a gap; a tile
 * that is picked up is raised.
 */

/** One tile's place: across and down in tile widths from where the rack starts. A lifted tile is above the row, so its `y` is negative. */
export type RackPlace = { x: number; y: number };

/** How a rack is laid out. Every field may be left out. */
export type RackLayoutOptions = {
  /** The places, counted from 0 in the order the tiles lie, where a new group starts, after a gap. Unless said, none. */
  breaks?: readonly number[];
  /** The places of the tiles that are raised. Unless said, none. */
  lifted?: ReadonlySet<number> | readonly number[];
  /** How far apart neighbours lie, in tile widths: a little over one, so tiles that touch have a hair of table between. Unless said, 1.02. */
  step?: number;
  /** The gap a group is set apart by, in tile widths. Unless said, 0.45. */
  gap?: number;
  /** How far a raised tile stands above the row, in tile widths. Unless said, 0.22. */
  lift?: number;
};

/** What a tile's box is taller than wide, from the picture's 37 by 47 (the face and its thickness). */
export const TILE_TALL = 47 / 37;

/** The most a raised tile stands above the row, which a rack always leaves room for. */
export const RACK_LIFT = 0.22;

/** Where each of `count` tiles lies, in order: the first at x 0, each a step on, groups set apart, raised tiles lifted. */
export function rackPlaces(count: number, options: RackLayoutOptions = {}): RackPlace[] {
  const whole = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  const step = options.step ?? 1.02;
  const gap = options.gap ?? 0.45;
  const lift = options.lift ?? RACK_LIFT;
  const breaks = new Set(options.breaks ?? []);
  const lifted = new Set(options.lifted ?? []);
  const places: RackPlace[] = [];
  let x = 0;
  for (let at = 0; at < whole; at += 1) {
    if (at > 0) x += step + (breaks.has(at) ? gap : 0);
    places.push({ x: Math.round(x * 1000) / 1000, y: lifted.has(at) ? -lift : 0 });
  }
  return places;
}

/** How wide a rack is, in tile widths: the last tile's place and the tile itself. */
export function rackWidth(places: readonly RackPlace[]): number {
  return places.length === 0 ? 0 : Math.round((Math.max(...places.map((place) => place.x)) + 1) * 1000) / 1000;
}
