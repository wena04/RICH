import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WHEEL_HEIGHT, WheelPicker } from '@/components/rich/WheelPicker';
import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';

type Props = {
  visible: boolean;
  /** The month Home shows now (month is 0–11). */
  year: number;
  month: number;
  /** This year; the year wheel runs from 20 years before it (or the first record) to 10 after. */
  currentYear: number;
  firstRecordYear: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
};

function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale ?? 'zh-CN';
  } catch {
    return 'zh-CN';
  }
}

/**
 * Labels the way the system picker in the original did: 11月 / 2026年 on a Chinese phone,
 * November / 2026 (and Cancel / OK) on an English one.
 */
export function pickerLabels(locale: string) {
  const chinese = locale.toLowerCase().startsWith('zh');
  let months: string[];
  if (chinese) {
    months = Array.from({ length: 12 }, (_, m) => `${m + 1}月`);
  } else {
    try {
      const format = new Intl.DateTimeFormat(locale, { month: 'long' });
      months = Array.from({ length: 12 }, (_, m) => format.format(new Date(2026, m, 15)));
    } catch {
      months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    }
  }
  return {
    months,
    year: (y: number) => (chinese ? `${y}年` : String(y)),
    cancel: chinese ? '取消' : 'Cancel',
    ok: chinese ? '确定' : 'OK',
  };
}

/** The original 选择时间 sheet opened from Home's month pill: month and year wheels, Cancel / OK. */
export function MonthPickerSheet({ visible, year, month, currentYear, firstRecordYear, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const labels = useMemo(() => pickerLabels(deviceLocale()), []);
  const years = useMemo(() => {
    const first = Math.min(firstRecordYear, year, currentYear - 20);
    const last = Math.max(year, currentYear + 10);
    return Array.from({ length: last - first + 1 }, (_, i) => first + i);
  }, [firstRecordYear, year, currentYear]);

  const [pickedMonth, setPickedMonth] = useState(month);
  const [pickedYear, setPickedYear] = useState(year);
  useEffect(() => {
    if (!visible) return;
    setPickedMonth(month);
    setPickedYear(year);
  }, [visible, year, month]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={labels.cancel} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 6 }]}>
          <View style={styles.bar}>
            <Pressable onPress={onClose} hitSlop={10} style={[styles.barButton, styles.barButtonLeft]} accessibilityRole="button">
              <Text style={styles.cancel}>{labels.cancel}</Text>
            </Pressable>
            <Text style={styles.title} accessibilityRole="header">
              选择时间
            </Text>
            <Pressable
              onPress={() => onSelect(pickedYear, pickedMonth)}
              hitSlop={10}
              style={[styles.barButton, styles.barButtonRight]}
              accessibilityRole="button"
            >
              <Text style={styles.ok}>{labels.ok}</Text>
            </Pressable>
          </View>

          {visible ? (
            <View style={styles.wheels}>
              {/* The light band behind the selected row. */}
              <View pointerEvents="none" style={styles.band} />
              <WheelPicker
                items={labels.months}
                selectedIndex={pickedMonth}
                onChange={setPickedMonth}
                accessibilityLabel="月份"
                side="left"
              />
              <WheelPicker
                items={years.map(labels.year)}
                selectedIndex={Math.max(0, years.indexOf(pickedYear))}
                onChange={(index) => setPickedYear(years[index])}
                accessibilityLabel="年份"
                side="right"
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// Measured from the original capture (402pt iPhone, 3x): a 0.33pt #C6C6C8 hairline on top, a 45pt
// bar (Cancel 11pt from the left, OK 28.7pt from the right in #3FDEAE), the 216pt wheels 3.5pt
// below it, and a 37.7pt #F4F4F5 band (radius 5.5) inset 10.7pt.
const styles = StyleSheet.create({
  // The header green dims to #32B18B: 20% black.
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)' },
  backdrop: { flex: 1 },
  sheet: { backgroundColor: '#FFFFFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#C6C6C8' },
  bar: { height: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  barButton: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  barButtonLeft: { left: 0, paddingLeft: 10, paddingRight: 12 },
  barButtonRight: { right: 0, paddingLeft: 12, paddingRight: 24.7 },
  cancel: { fontSize: 16.5, color: TEXT_PRIMARY },
  title: { fontSize: 15.5, color: TEXT_SECONDARY },
  ok: { fontSize: 16.5, color: PRIMARY_GREEN },
  wheels: { marginTop: 3.5, marginHorizontal: 10.7, height: WHEEL_HEIGHT, flexDirection: 'row' },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (WHEEL_HEIGHT - 37.7) / 2,
    height: 37.7,
    borderRadius: 5.5,
    backgroundColor: '#F4F4F5',
  },
});
