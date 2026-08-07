import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

type Props = {
  width: number;
  height: number;
  series: Array<{ values: number[]; color: string }>;
  padding?: number;
};

export function LineChart({ width, height, series, padding = 8 }: Props) {
  const max = useMemo(() => {
    let m = 0;
    for (const s of series) {
      for (const v of s.values) m = Math.max(m, v);
    }
    return m;
  }, [series]);

  const count = useMemo(() => Math.max(0, ...series.map((s) => s.values.length)), [series]);

  function points(values: number[]): string {
    if (count <= 1) return '';
    return values
      .map((v, i) => {
        const x = padding + (i / (count - 1)) * (width - padding * 2);
        const y =
          height - padding - (max > 0 ? (v / max) * (height - padding * 2) : 0);
        return `${x},${y}`;
      })
      .join(' ');
  }

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {series.map((s, idx) => (
          <Polyline
            key={idx}
            points={points(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
          />
        ))}
      </Svg>
    </View>
  );
}

