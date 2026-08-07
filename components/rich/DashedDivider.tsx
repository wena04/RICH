import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';

type DashedDividerProps = {
  color?: string;
  dashWidth?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

export function DashedDivider({
  color = '#D8D8D8',
  dashWidth = 4,
  gap = 4,
  style,
}: DashedDividerProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.clip, style]}>
      <View style={styles.row}>
        {Array.from({ length: 80 }, (_, index) => (
          <View
            key={index}
            style={{ width: dashWidth, height: 1, marginRight: gap, backgroundColor: color }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    width: '100%',
    height: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
});
