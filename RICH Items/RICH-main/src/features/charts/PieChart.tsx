import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

export type PieDatum = {
  value: number;
  color: string;
};

type Props = {
  size: number;
  innerRadius?: number; // donut
  data: PieDatum[];
};

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const startPt = polarToCartesian(cx, cy, r, start);
  const endPt = polarToCartesian(cx, cy, r, end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  // Sweep flag 1 draws clockwise in SVG coordinate space (y down).
  return [
    `M ${cx} ${cy}`,
    `L ${startPt.x} ${startPt.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`,
    'Z',
  ].join(' ');
}

export function PieChart({ size, innerRadius = 0, data }: Props) {
  const total = useMemo(() => data.reduce((acc, d) => acc + Math.max(0, d.value), 0), [data]);
  const r = size / 2;

  const slices = useMemo(() => {
    let a = -Math.PI / 2; // start at top
    return data
      .filter((d) => d.value > 0)
      .map((d) => {
        const angle = total > 0 ? (d.value / total) * Math.PI * 2 : 0;
        const start = a;
        const end = a + angle;
        a = end;
        return { ...d, start, end };
      });
  }, [data, total]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G>
          {slices.map((s, idx) => (
            <Path key={idx} d={arcPath(r, r, r, s.start, s.end)} fill={s.color} />
          ))}
          {innerRadius > 0 ? (
            <Circle cx={r} cy={r} r={innerRadius} fill="white" />
          ) : null}
        </G>
      </Svg>
    </View>
  );
}

