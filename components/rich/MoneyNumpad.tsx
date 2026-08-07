import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { TEXT_PRIMARY } from '@/constants/Colors';

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
            <View style={styles.backspaceIcon}>
              <FontAwesome name="tag" size={24} color={TEXT_PRIMARY} style={styles.backspaceShape} />
              <Text style={styles.backspaceX}>×</Text>
            </View>
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
            <Text style={styles.operatorText}>{operator.label}</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={confirmLabel}
          disabled={confirmDisabled}
          onPress={onConfirm}
          style={({ pressed }) => [
            styles.confirm,
            confirmDisabled && styles.confirmDisabled,
            pressed && !confirmDisabled && styles.confirmPressed,
          ]}
        >
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: '#F8F8F8' },
  grid: { flex: 3 },
  row: { flexDirection: 'row' },
  key: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: '#ECECEC' },
  keyText: { fontSize: 22, fontWeight: '500', color: TEXT_PRIMARY },
  backspaceIcon: { width: 30, height: 26, alignItems: 'center', justifyContent: 'center' },
  backspaceShape: { transform: [{ rotate: '180deg' }] },
  backspaceX: {
    position: 'absolute',
    top: 4,
    left: 10,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  operations: { flex: 1 },
  operator: { alignItems: 'center', justifyContent: 'center' },
  operatorText: { fontSize: 28, fontWeight: '500', color: '#000000' },
  confirm: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' },
  confirmDisabled: { backgroundColor: '#777777' },
  confirmPressed: { opacity: 0.82 },
  confirmText: { fontSize: 17, fontWeight: '500', color: '#FFFFFF' },
});
