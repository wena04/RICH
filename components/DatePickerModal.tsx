import { useState } from "react";
import { Modal, Pressable, StyleSheet, View, Text } from "react-native";
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

  const prev = () => (month === 0 ? (setYear(year - 1), setMonth(11)) : setMonth(month - 1));
  const next = () => (month === 11 ? (setYear(year + 1), setMonth(0)) : setMonth(month + 1));

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
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.head}>
            <Pressable onPress={prev} style={styles.nav} hitSlop={10}>
              <FontAwesome name="chevron-left" size={14} color={TEXT_SECONDARY} />
            </Pressable>
            <Text style={styles.title}>{year}年 {MONTHS[month]}</Text>
            <Pressable onPress={next} style={styles.nav} hitSlop={10}>
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
  card: { width: 300, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  nav: { padding: 6 },
  title: { fontSize: 15, fontWeight: "600", color: TEXT_PRIMARY },
  wkRow: { flexDirection: "row", marginBottom: 6 },
  wk: { flex: 1, textAlign: "center", fontSize: 11, color: TEXT_SECONDARY },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  dayInner: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  daySel: { backgroundColor: PRIMARY_GREEN },
  dayToday: { borderWidth: 1.5, borderColor: "#333" },
  dayText: { fontSize: 13, color: TEXT_PRIMARY },
  daySelText: { color: "#FFFFFF", fontWeight: "600" },
  todayBtn: { marginTop: 12, alignSelf: "center", paddingVertical: 8, paddingHorizontal: 20, backgroundColor: "#F0F0F0", borderRadius: 16 },
  todayBtnText: { fontSize: 13, color: TEXT_PRIMARY, fontWeight: "600" },
});
