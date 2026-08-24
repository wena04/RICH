import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';

import { DASHED_RULE_COLOR } from '@/constants/Colors';
import { RICH_SPACING } from '@/constants/Design';

type DashedDividerProps = {
  color?: string;
  dashWidth?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

export function DashedDivider({
  color = DASHED_RULE_COLOR,
  dashWidth = RICH_SPACING.xxs,
  gap = RICH_SPACING.xxs,
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
    alignSelf: 'stretch',
    height: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
});
