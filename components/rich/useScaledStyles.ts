import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { DESIGN_WIDTH, type ScaleKeep, layoutScale, scaleGeometry } from '@/src/utils/layoutScale';

/** The original's width scale for this screen (width / 393, see `src/utils/layoutScale.ts`). */
export function useLayoutScale(): number {
  const { width } = useWindowDimensions();
  return layoutScale(width);
}

/**
 * `styles` with their lengths scaled to the screen width, as the original lays out. `measuredAt`
 * is the width the numbers were measured on (most screens 393pt; the budget wizard 402pt).
 */
export function useScaledStyles<T extends Record<string, object>>(
  styles: T,
  options: { measuredAt?: number; keep?: ScaleKeep<T> } = {},
): T {
  // Rounded so a 402pt phone showing 402pt measurements gets exactly 1.
  const k = Math.round(useLayoutScale() * (DESIGN_WIDTH / (options.measuredAt ?? DESIGN_WIDTH)) * 10000) / 10000;
  const { keep } = options;
  // `keep` is a module constant at every call site, so k alone decides when to rebuild.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (k === 1 ? styles : StyleSheet.create(scaleGeometry(styles, k, keep))), [styles, k]);
}
