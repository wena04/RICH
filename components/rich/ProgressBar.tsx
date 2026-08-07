import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';

type ProgressBarProps = {
  percent: number;
  color: string;
  height?: number;
  trackColor?: string;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({
  percent,
  color,
  height = 7,
  trackColor = '#ECECEC',
  rounded = false,
  style,
}: ProgressBarProps) {
  const bounded = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  const radius = rounded ? height / 2 : 0;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(bounded) }}
      style={[
        styles.track,
        { height, borderRadius: radius, backgroundColor: trackColor },
        style,
      ]}
    >
      <View
        style={{
          width: `${bounded}%`,
          height,
          borderRadius: radius,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
