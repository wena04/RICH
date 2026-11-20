import { useMemo } from 'react';
import { SvgXml } from 'react-native-svg';

import {
  CATEGORY_ART_ACCENT,
  CATEGORY_ART_INK,
  CATEGORY_ART_XML,
} from '@/components/icons/categoryArt.generated';
import { resolveCategoryIconName } from '@/src/domain/categoryIcons';

export type CategoryIconProps = {
  /** Stored icon id (an original `icon_*` name, or a legacy id from an earlier build). */
  id?: string | null;
  /** Category name, used when no icon was chosen. */
  name?: string | null;
  /**
   * Side of the artwork canvas in points. The original art is drawn for a 48pt disc, so pass the
   * disc size (48 in the entry grid, 34 in ledger rows, 40 in the subcategory tray).
   */
  size?: number;
  /** Recolour the black ink (defaults to the original #000000). */
  color?: string;
  /** Recolour the mint accent (defaults to the original #02B17B). */
  accentColor?: string;
};

/**
 * Draws a category's original glyph. It has no background: callers draw the #F7F7F7 disc (and any
 * selection ring) themselves, so the disc and the glyph can change independently.
 */
export function CategoryIcon({ id, name, size = 48, color, accentColor }: CategoryIconProps) {
  const iconName = resolveCategoryIconName(id, name);
  const xml = useMemo(() => {
    let source = CATEGORY_ART_XML[iconName];
    // Traced glyphs paint with fills, redrawn ones with strokes: recolour both.
    if (color) source = source.replace(new RegExp(`(fill|stroke)="${CATEGORY_ART_INK}"`, 'g'), `$1="${color}"`);
    if (accentColor) source = source.replace(new RegExp(`(fill|stroke)="${CATEGORY_ART_ACCENT}"`, 'g'), `$1="${accentColor}"`);
    return source;
  }, [iconName, color, accentColor]);
  return <SvgXml xml={xml} width={size} height={size} />;
}
