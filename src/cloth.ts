/**
 * THE CLOTHS A TABLE MAY BE LAID IN: the same five the whole family offers, and itsutsu.com's boards: green (the
 * family's own), blue, red, black, and wood. Each is the felt's colour, its deep edge and the ink written on it. An
 * element's `cloth` attribute and a drawing's `cloth` option take the name, and a page that draws its own takes
 * `clothVars` for the custom properties.
 *
 * @example
 * ```ts
 * import { JARAJARA_CLOTHS } from "@johnmorrisdotca/jarajara/faces";
 * console.log(JARAJARA_CLOTHS);
 * ```
 */
export const JARAJARA_CLOTHS = {
  green: { felt: "#2f5d4a", deep: "#1f4135", ink: "#f3efe4" },
  blue: { felt: "#2865a6", deep: "#1a4677", ink: "#f3efe4" },
  red: { felt: "#a3342e", deep: "#7a231f", ink: "#f3efe4" },
  black: { felt: "#2f3236", deep: "#1b1d20", ink: "#ece8dc" },
  wood: { felt: "#e2ba7a", deep: "#c4954f", ink: "#2b1d0e" },
} as const;

/** A cloth's name.
 *
 * @example
 * ```ts
 * import type { Cloth } from "@johnmorrisdotca/jarajara/faces";
 *
 * const value: Cloth = "green";
 * console.log(value);
 * ```
 */
export type Cloth = keyof typeof JARAJARA_CLOTHS;

/** The cloths, in the order the family lists them.
 *
 * @example
 * ```ts
 * import { CLOTHS } from "@johnmorrisdotca/jarajara/faces";
 * console.log(CLOTHS);
 * ```
 */
export const CLOTHS = Object.keys(JARAJARA_CLOTHS) as Cloth[];

/** Whether a text names a cloth.
 *
 * @param text - The unknown text or encoded record to interpret.
 * @returns Whether a text names a cloth.
 * @example
 * ```ts
 * import { isCloth } from "@johnmorrisdotca/jarajara/faces";
 *
 * console.log(isCloth("green"));
 * ```
 */
export function isCloth(text: unknown): text is Cloth {
  return typeof text === "string" && Object.hasOwn(JARAJARA_CLOTHS, text);
}

/** A cloth as CSS custom properties (`--jarajara-felt`, `--jarajara-felt-deep`, `--jarajara-felt-ink`); nothing for a name that is not a cloth.
 *
 * @param cloth - The named native cloth theme.
 * @returns A cloth as CSS custom properties (`--jarajara-felt`, `--jarajara-felt-deep`, `--jarajara-felt-ink`); nothing for a name that is not a cloth.
 * @example
 * ```ts
 * import { clothVars } from "@johnmorrisdotca/jarajara/faces";
 *
 * console.log(clothVars("green"));
 * ```
 */
export function clothVars(cloth: string | undefined | null): Record<`--jarajara-${string}`, string> {
  if (!isCloth(cloth)) return {};
  const { felt, deep, ink } = JARAJARA_CLOTHS[cloth];
  return { "--jarajara-felt": felt, "--jarajara-felt-deep": deep, "--jarajara-felt-ink": ink };
}
