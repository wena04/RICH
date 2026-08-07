import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

type AssetGoalIllustrationProps = {
  progress: number;
  width?: number;
  height?: number;
};

export function AssetGoalIllustration({
  progress,
  width = 146,
  height = 182,
}: AssetGoalIllustrationProps) {
  const bounded = Math.max(0, Math.min(100, progress));
  const meterHeight = 96;
  const fillHeight = (meterHeight * bounded) / 100;

  return (
    <Svg
      accessibilityLabel={`目标资产完成 ${Math.round(bounded)}%`}
      accessibilityRole="image"
      width={width}
      height={height}
      viewBox="0 0 146 182"
    >
      <Rect width="146" height="182" rx="18" fill="#1C2524" />

      <Path d="M73 176 L3 95 L3 64 Z" fill="#33403D" />
      <Path d="M73 176 L19 18 L39 8 Z" fill="#2B3634" />
      <Path d="M73 176 L60 0 L79 0 Z" fill="#34413E" />
      <Path d="M73 176 L98 0 L116 10 Z" fill="#2E3937" />
      <Path d="M73 176 L143 48 L143 83 Z" fill="#34413E" />
      <Path d="M73 176 L146 126 L146 156 Z" fill="#2B3634" />

      <Circle cx="22" cy="26" r="1.2" fill="#FFFFFF" />
      <Circle cx="105" cy="18" r="1" fill="#FFFFFF" />
      <Circle cx="119" cy="72" r="1.2" fill="#FFFFFF" />
      <Circle cx="37" cy="86" r="1" fill="#FFFFFF" />

      <Rect x="42" y="154" width="62" height="20" fill="#DDE4E0" />
      <Rect x="49" y="139" width="48" height="15" fill="#EDF1EF" />
      <Rect x="56" y="92" width="34" height="47" fill="#D7DFDB" />
      <Path d="M52 92 H94 L88 82 H58 Z" fill="#EFF3F1" />
      <Path d="M58 82 C58 69 65 61 73 54 C81 61 88 69 88 82 Z" fill="#F4F6F5" />
      <Path d="M73 54 L73 37" stroke="#E7ECE9" strokeWidth="3" />
      <Path d="M73 39 C87 29 94 36 108 28 C98 45 86 46 73 42 Z" fill="#F15B5B" />
      <Rect x="64" y="105" width="18" height="34" fill="#E7ECE9" stroke="#B8C3BE" />
      <Rect x="55" y="159" width="36" height="11" fill="#E6ECE9" stroke="#B8C3BE" />

      <Rect x="124" y="24" width="10" height={meterHeight + 4} rx="5" fill="#6A7773" />
      <Rect
        x="126"
        y={26 + meterHeight - fillHeight}
        width="6"
        height={fillHeight}
        rx="3"
        fill="#3ECDA5"
      />
      <Circle cx="129" cy="15" r="5" fill="none" stroke="#AEB9B5" strokeWidth="1.5" />
      <Line x1="122" y1="133" x2="136" y2="133" stroke="#AEB9B5" strokeWidth="1" />
      <SvgText x="129" y="145" fill="#FFFFFF" fontSize="9" textAnchor="middle">
        {Math.round(bounded)}%
      </SvgText>
    </Svg>
  );
}
