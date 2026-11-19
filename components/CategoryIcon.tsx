import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  CATEGORY_ICON_XML,
  hasCategoryIcon,
  type CategoryIconId,
} from '@/components/categoryIconRegistry.generated';
import {
  hasOriginalCategoryIcon,
  ORIGINAL_CATEGORY_ICON_IMAGES,
  originalIconNameForCategory,
} from '@/components/originalCategoryIconRegistry.generated';
import { PRIMARY_GREEN } from '@/constants/Colors';
import { iconIdForCategory } from '@/src/domain/categoryIcons';

const ORIGINAL_INK = '#1A1A1A';
const ORIGINAL_ACCENT = '#3FDEAE';

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
  color = '#777777',
  accentColor = PRIMARY_GREEN,
}: CategoryIconProps) {
  const originalIconName = originalIconNameForCategory(name) ??
    (hasOriginalCategoryIcon(id) ? id : null);
  const [originalLoaded, setOriginalLoaded] = useState(false);
  const fallbackSource = CATEGORY_ICON_XML[resolveCategoryIconId(id, name)];
  const fallbackXml = withPalette(fallbackSource, color, accentColor);

  useEffect(() => {
    setOriginalLoaded(false);
  }, [originalIconName]);

  if (originalIconName) {
    // The supplied iOS assets are 48pt canvases while the old SVG `size`
    // represented only the inner glyph. Keep the existing call-site contract
    // and scale the original canvas to the surrounding category frame.
    const canvasSize = Math.round(size * 1.8);
    return (
      <View style={{ width: canvasSize, height: canvasSize, alignItems: 'center', justifyContent: 'center' }}>
        {!originalLoaded ? (
          <SvgXml xml={fallbackXml} width={size} height={size} />
        ) : null}
        <Image
          source={ORIGINAL_CATEGORY_ICON_IMAGES[originalIconName]}
          resizeMode="contain"
          onLoad={() => setOriginalLoaded(true)}
          style={{
            position: 'absolute',
            width: canvasSize,
            height: canvasSize,
            tintColor:
              originalIconName === 'icon_setting' && color === '#FFFFFF'
                ? '#FFFFFF'
                : undefined,
          }}
        />
      </View>
    );
  }

  return <SvgXml xml={fallbackXml} width={size} height={size} />;
}
