import { Image, type ImageStyle, type StyleProp } from 'react-native';

type Direction = 'right' | 'left' | 'up' | 'down';
type Tone = 'dark' | 'muted';

/**
 * Original chevron artwork from the Rich 1.1.0 asset catalog. Each PNG pads its glyph inside a
 * 24–28pt canvas; the negative margins below collapse that padding so the chevron takes up only
 * its glyph's footprint in layout (the full canvas still renders, so nothing is clipped).
 * Metrics are the canvas size and the glyph box inside it, in points.
 */
const ART: Record<`${Tone}-${Direction}`, { source: number; canvas: number; x: number; y: number; w: number; h: number }> = {
  // icon_right_unfold: black, glyph 6.3×10.7 (detail rows, account rows).
  'dark-right': { source: require('../../assets/images/ui/icon_right_unfold.png'), canvas: 28, x: 11.7, y: 8.7, w: 6.3, h: 10.7 },
  // icon_unfold_left: black, glyph 8×13.3.
  'dark-left': { source: require('../../assets/images/ui/icon_unfold_left.png'), canvas: 24, x: 7.7, y: 5.3, w: 8, h: 13.3 },
  // icon_fold / icon_unfold: black up/down, glyph 10.7×6.
  'dark-up': { source: require('../../assets/images/ui/icon_fold.png'), canvas: 24, x: 6.7, y: 8.7, w: 10.7, h: 6 },
  'dark-down': { source: require('../../assets/images/ui/icon_unfold.png'), canvas: 24, x: 6.7, y: 9.7, w: 10.7, h: 6.3 },
  // icon_arrow_unfold / icon_small_gray_back: #777777, glyph about 6×11 (secondary links, steppers).
  'muted-right': { source: require('../../assets/images/ui/icon_arrow_unfold.png'), canvas: 24, x: 9.7, y: 6.7, w: 6.3, h: 10.7 },
  'muted-left': { source: require('../../assets/images/ui/icon_small_gray_back.png'), canvas: 24, x: 8, y: 6.3, w: 6, h: 11.3 },
  'muted-up': { source: require('../../assets/images/ui/icon_fold.png'), canvas: 24, x: 6.7, y: 8.7, w: 10.7, h: 6 },
  'muted-down': { source: require('../../assets/images/ui/icon_unfold.png'), canvas: 24, x: 6.7, y: 9.7, w: 10.7, h: 6.3 },
};

type RichChevronProps = {
  direction?: Direction;
  tone?: Tone;
  /** Multiplies the original size (1 = as drawn in the original app). */
  scale?: number;
  style?: StyleProp<ImageStyle>;
};

export function RichChevron({ direction = 'right', tone = 'dark', scale = 1, style }: RichChevronProps) {
  const art = ART[`${tone}-${direction}`];
  const size = art.canvas * scale;
  return (
    <Image
      source={art.source}
      accessible={false}
      style={[
        {
          width: size,
          height: size,
          marginLeft: -art.x * scale,
          marginRight: -(art.canvas - art.x - art.w) * scale,
          marginTop: -art.y * scale,
          marginBottom: -(art.canvas - art.y - art.h) * scale,
          // icon_fold/icon_unfold are black; the muted variants are tinted to the original grey.
          ...(tone === 'muted' && (direction === 'up' || direction === 'down') ? { tintColor: '#777777' } : null),
        },
        style,
      ]}
    />
  );
}
