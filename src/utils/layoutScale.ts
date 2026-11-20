/**
 * The original lays out every screen against a 393pt-wide design and scales geometry with the
 * screen width (measured on 393pt and 402pt iPhones: Home, the add screen and the day list all
 * grow by 402/393). Text sizes stay fixed. Pure, so it can be tested in Node.
 */
export const DESIGN_WIDTH = 393;

/** width / 393, kept between 0.9 (iPhone SE leaves room) and 430pt (Pro Max). */
export function layoutScale(width: number): number {
  return Math.max(0.9, Math.min(width, 430) / DESIGN_WIDTH);
}

/**
 * Style keys that are lengths on the screen. Fonts, borders, flex, colours and max sizes (caps
 * such as a 430pt column, not measurements) are left alone.
 */
const GEOMETRY = new Set([
  'width',
  'height',
  'minWidth',
  'minHeight',
  'top',
  'right',
  'bottom',
  'left',
  'gap',
  'rowGap',
  'columnGap',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingHorizontal',
  'paddingVertical',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
]);

/** Per style: the keys to leave unscaled, or `true` to leave the whole style. */
export type ScaleKeep<T> = Partial<Record<keyof T, readonly string[] | true>>;

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * A copy of a style sheet with every length multiplied by `k`. Hairlines and other sub-point
 * values, percentages and what `keep` names (a style's keys, or `true` for the whole style, e.g. a
 * header measured as fixed) are left as they are.
 */
export function scaleGeometry<T extends Record<string, object>>(
  styles: T,
  k: number,
  keep: ScaleKeep<T> = {},
): T {
  if (k === 1) return styles;
  const out: Record<string, object> = {};
  for (const [name, style] of Object.entries(styles)) {
    const fixed = (keep as Record<string, readonly string[] | true | undefined>)[name];
    if (fixed === true) {
      out[name] = style;
      continue;
    }
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(style)) {
      next[key] =
        typeof value === 'number' && GEOMETRY.has(key) && Math.abs(value) >= 1 && !fixed?.includes(key)
          ? round(value * k)
          : value;
    }
    out[name] = next;
  }
  return out as T;
}
