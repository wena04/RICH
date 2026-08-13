import React from 'react';
import { SvgXml } from 'react-native-svg';

import {
  CATEGORY_ICON_XML,
  hasCategoryIcon,
  type CategoryIconId,
} from '@/components/categoryIconRegistry.generated';
import { iconIdForCategory } from '@/src/domain/categoryIcons';

const ORIGINAL_INK = '#1A1A1A';
const ORIGINAL_ACCENT = '#3ECDA5';

export type CategoryIconProps = {
  id?: string | null;
  name?: string | null;
  size?: number;
  color?: string;
  accentColor?: string;
};

function withPalette(xml: string, color: string, accentColor: string) {
  return xml
    .replaceAll(ORIGINAL_INK, color)
    .replaceAll(ORIGINAL_ACCENT, accentColor);
}

export function resolveCategoryIconId(id?: string | null, name?: string | null): CategoryIconId {
  if (hasCategoryIcon(id)) return id;

  const semanticId = iconIdForCategory(name);
  return hasCategoryIcon(semanticId) ? semanticId : 'grid';
}

export function CategoryIcon({
  id,
  name,
  size = 24,
  color = '#777D7A',
  accentColor = ORIGINAL_ACCENT,
}: CategoryIconProps) {
  const source = CATEGORY_ICON_XML[resolveCategoryIconId(id, name)];
  const xml = withPalette(source, color, accentColor);

  return <SvgXml xml={xml} width={size} height={size} />;
}
