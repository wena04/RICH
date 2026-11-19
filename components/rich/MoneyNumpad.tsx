import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  ACTION_BACKGROUND,
  ACTION_FOREGROUND,
  CONTROL_PRESSED_BACKGROUND,
  KEYPAD_BACKGROUND,
  TEXT_PRIMARY,
} from '@/constants/Colors';

type NumpadOperator = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

type MoneyNumpadProps = {
  onDigit: (value: string) => void;
  onBackspace: () => void;
  operators: NumpadOperator[];
  onConfirm: () => void;
  confirmDisabled?: boolean;
  confirmLabel?: string;
  keyHeight?: number;
  style?: StyleProp<ViewStyle>;
};

import { RICH_NUMERAL_FONT } from '@/constants/Design';

// Original keypad artwork for the operator and delete keys.
const OPERATOR_ICONS: Record<string, number> = {
  '+': require('../../assets/images/ui/icon_keyboard_add.png'),
  '−': require('../../assets/images/ui/icon_keyboard_reduce.png'),
};
const DELETE_ICON = require('../../assets/images/ui/icon_keyboard_delete.png');

const DIGIT_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

export function MoneyNumpad({
  onDigit,
  onBackspace,
  operators,
  onConfirm,
  confirmDisabled = false,
  confirmLabel = '确定',
  keyHeight = 54,
  style,
}: MoneyNumpadProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.grid}>
        {DIGIT_ROWS.map((row) => (
          <View key={row[0]} style={styles.row}>
            {row.map((digit) => (
              <Pressable
                key={digit}
                accessibilityRole="button"
                accessibilityLabel={digit}
                onPress={() => onDigit(digit)}
                style={({ pressed }) => [styles.key, { height: keyHeight }, pressed && styles.pressed]}
              >
                <Text style={styles.keyText}>{digit}</Text>
              </Pressable>
            ))}
          </View>
        ))}
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="退格"
            onPress={onBackspace}
            style={({ pressed }) => [styles.key, { height: keyHeight }, pressed && styles.pressed]}
          >
            <Image source={DELETE_ICON} style={styles.deleteIcon} resizeMode="contain" accessible={false} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="0"
            onPress={() => onDigit('0')}
            style={({ pressed }) => [styles.key, { height: keyHeight }, pressed && styles.pressed]}
          >
            <Text style={styles.keyText}>0</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="小数点"
            onPress={() => onDigit('.')}
            style={({ pressed }) => [styles.key, { height: keyHeight }, pressed && styles.pressed]}
          >
            <Text style={styles.keyText}>.</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.operations}>
        {operators.map((operator) => (
          <Pressable
            key={operator.label}
            accessibilityRole="button"
            accessibilityLabel={operator.accessibilityLabel ?? operator.label}
            onPress={operator.onPress}
            style={({ pressed }) => [
              styles.operator,
              { height: keyHeight },
              pressed && styles.pressed,
            ]}
          >
            {OPERATOR_ICONS[operator.label] ? (
              <Image
                source={OPERATOR_ICONS[operator.label]}
                style={styles.operatorIcon}
                resizeMode="contain"
                accessible={false}
              />
            ) : (
              <Text style={styles.operatorText}>{operator.label}</Text>
            )}
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={confirmLabel}
          disabled={confirmDisabled}
          onPress={onConfirm}
          accessibilityState={{ disabled: confirmDisabled }}
          // The original keeps 确定 black even before an amount is entered.
          style={({ pressed }) => [styles.confirm, pressed && !confirmDisabled && styles.confirmPressed]}
        >
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: KEYPAD_BACKGROUND },
  grid: { flex: 3 },
  row: { flexDirection: 'row' },
  key: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: CONTROL_PRESSED_BACKGROUND },
  keyText: { fontFamily: RICH_NUMERAL_FONT, fontSize: 24, color: TEXT_PRIMARY },
  deleteIcon: { width: 40, height: 40 },
  operatorIcon: { width: 44, height: 44 },
  operations: { flex: 1 },
  operator: { alignItems: 'center', justifyContent: 'center' },
  operatorText: { fontSize: 28, fontWeight: '500', color: TEXT_PRIMARY },
  confirm: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACTION_BACKGROUND,
  },
  confirmPressed: { opacity: 0.82 },
  confirmText: { fontSize: 16, color: ACTION_FOREGROUND },
});
