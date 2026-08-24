import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View, Text, useWindowDimensions } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from "@/constants/Colors";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

function daysIn(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function leadMon(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function DatePickerModal({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onSelect: (isoDate: string) => void;
  onClose: () => void;
}) {
  const [vy, vm, vd] = value.split("-").map((n) => parseInt(n, 10));
  const [year, setYear] = useState(vy || new Date().getFullYear());
  const [month, setMonth] = useState((vm || 1) - 1);
  const { width: viewportWidth } = useWindowDimensions();

  useEffect(() => {
    if (!visible) return;
    const [nextYear, nextMonth] = value.split("-").map((part) => parseInt(part, 10));
    setYear(nextYear || new Date().getFullYear());
    setMonth((nextMonth || 1) - 1);
  }, [value, visible]);

  function moveMonth(offset: number) {
    const next = new Date(year, month + offset, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < leadMon(year, month); i++) cells.push(null);
  for (let d = 1; d <= daysIn(year, month); d++) cells.push(d);

  const t = new Date();
  const isSel = (d: number) => vy === year && vm - 1 === month && vd === d;
  const isToday = (d: number) =>
    t.getFullYear() === year && t.getMonth() === month && t.getDate() === d;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          accessibilityRole="none"
          style={[styles.card, { width: Math.min(viewportWidth - 16, 360) }]}
          onPress={() => {}}
        >
          <View style={styles.head}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="上一个月"
              onPress={() => moveMonth(-1)}
              style={styles.nav}
            >
              <FontAwesome name="chevron-left" size={14} color={TEXT_SECONDARY} />
            </Pressable>
            <Text style={styles.title}>{year}年 {MONTHS[month]}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="下一个月"
              onPress={() => moveMonth(1)}
              style={styles.nav}
            >
              <FontAwesome name="chevron-right" size={14} color={TEXT_SECONDARY} />
            </Pressable>
          </View>
          <View style={styles.wkRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.wk}>{w}</Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((d, i) =>
              d === null ? (
                <View key={`b${i}`} style={styles.cell} />
              ) : (
                <Pressable
                  key={d}
                  style={styles.cell}
                  accessibilityRole="button"
                  accessibilityLabel={`${year}年${month + 1}月${d}日`}
                  accessibilityState={{ selected: isSel(d) }}
                  onPress={() => { onSelect(iso(year, month, d)); onClose(); }}
                >
                  <View
                    style={[
                      styles.dayInner,
                      isSel(d) && styles.daySel,
                      !isSel(d) && isToday(d) && styles.dayToday,
                    ]}
                  >
                    <Text style={[styles.dayText, isSel(d) && styles.daySelText]}>{d}</Text>
                  </View>
                </Pressable>
              )
            )}
          </View>
          <Pressable
            style={styles.todayBtn}
            accessibilityRole="button"
            accessibilityLabel="选择今天"
            onPress={() => { onSelect(iso(t.getFullYear(), t.getMonth(), t.getDate())); onClose(); }}
          >
            <Text style={styles.todayBtnText}>今天</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  card: { maxWidth: 360, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 12 },
  head: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  nav: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "600", color: TEXT_PRIMARY },
  wkRow: { flexDirection: "row", marginBottom: 6 },
  wk: { flex: 1, textAlign: "center", fontSize: 11, color: TEXT_SECONDARY },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, minHeight: 44, alignItems: "center", justifyContent: "center" },
  dayInner: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  daySel: { backgroundColor: PRIMARY_GREEN },
  dayToday: { borderWidth: 1.5, borderColor: "#333" },
  dayText: { fontSize: 13, color: TEXT_PRIMARY },
  daySelText: { color: TEXT_PRIMARY, fontWeight: "600" },
  todayBtn: { minHeight: 44, marginTop: 8, alignSelf: "center", paddingHorizontal: 24, backgroundColor: "#F0F0F0", borderRadius: 22, alignItems: "center", justifyContent: "center" },
  todayBtnText: { fontSize: 13, color: TEXT_PRIMARY, fontWeight: "600" },
});
