import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

import { TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';
import { RICH_SIZE } from '@/constants/Design';

type MonthStepperProps = {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  variant?: 'plain' | 'pill';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  buttonSize?: number;
  labelMinWidth?: number;
};

export function MonthStepper({
  label,
  onPrevious,
  onNext,
  variant = 'plain',
  style,
  labelStyle,
  accessibilityLabel = '月份',
  buttonSize = RICH_SIZE.minimumTouchTarget,
  labelMinWidth = 84,
}: MonthStepperProps) {
  return (
    <View style={[styles.row, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="上一个月"
        hitSlop={6}
        onPress={onPrevious}
        style={[styles.button, { width: buttonSize, height: buttonSize }]}
      >
        <FontAwesome name="chevron-left" size={12} color={TEXT_SECONDARY} />
      </Pressable>
      <View
        accessibilityLabel={`${accessibilityLabel} ${label}`}
        style={[styles.labelBox, { minWidth: labelMinWidth }, variant === 'pill' && styles.pill]}
      >
        <Text numberOfLines={1} style={[styles.label, labelStyle]}>
          {label}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="下一个月"
        hitSlop={6}
        onPress={onNext}
        style={[styles.button, { width: buttonSize, height: buttonSize }]}
      >
        <FontAwesome name="chevron-right" size={12} color={TEXT_SECONDARY} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBox: {
    minWidth: 84,
    height: 32,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
});
