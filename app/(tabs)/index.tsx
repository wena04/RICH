import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  View,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from "@/constants/Colors";
import { getDb } from "@/src/db/db";
import {
  listTransactions,
  TransactionListItem,
} from "@/src/db/repo/transactions";
import { centsToYuan } from "@/src/utils/money";

// ---- Design tokens (matched to mockup) ----
const ENTRY_GREEN = "#B5EAD7"; // light highlight for days with entries
const INCOME_GREEN = "#34C77B";
const GAP_GRAY = "#ECECEC";
const DASH = "#D8D8D8";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTH_NAMES_CN = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

// Category -> FontAwesome icon (matches add-transaction grid)
const CATEGORY_ICONS: Record<string, string> = {
  餐饮: "cutlery", 衣服: "shopping-bag", 交通: "bus", 网费话费: "mobile",
  学习: "book", 日用: "home", 住房: "building", 医疗: "medkit",
  娱乐: "gamepad", "汽车/加油": "car", 请客送礼: "gift", 运动: "futbol-o",
  发红包: "envelope", 电器数码: "camera", 理发: "scissors", 付费会员: "diamond",
  还钱: "money", 工作: "briefcase", 购物: "shopping-bag", 旅行: "suitcase",
  买菜: "shopping-basket", 咖啡: "coffee", 工资: "money", 兼职: "money",
};
function getCategoryIcon(name?: string | null): any {
  return (name && CATEGORY_ICONS[name]) || "tag";
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
// Monday-first weekday index (0=Mon ... 6=Sun)
function firstWeekdayMonFirst(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function fmt(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function dateHeaderCN(date: string): string {
  const [, m, d] = date.split("-");
  return `${parseInt(m)}月${parseInt(d)}日`;
}

// RN can't reliably render a dashed bottom-border, so draw the dashes manually.
function DashedLine() {
  return (
    <View style={styles.dashRow}>
      {Array.from({ length: 60 }).map((_, i) => (
        <View key={i} style={styles.dash} />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const [selectedDate, setSelectedDate] = useState(
    fmt(year, month, today.getDate()),
  );
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);

  const loadTransactions = useCallback(async () => {
    try {
      const db = await getDb();
      const all = await listTransactions(db);
      const start = fmt(year, month, 1);
      const end = fmt(year, month, getDaysInMonth(year, month));
      setTransactions(all.filter((t) => t.date >= start && t.date <= end));
    } catch (e) {
      console.error("Failed to load transactions:", e);
    }
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  const { monthExpense, monthIncome } = useMemo(() => {
    let e = 0, i = 0;
    transactions.forEach((t) => {
      if (t.type === "expense") e += t.amountCents;
      else if (t.type === "income") i += t.amountCents;
    });
    return { monthExpense: e, monthIncome: i };
  }, [transactions]);

  const daysWithEntries = useMemo(() => {
    const s = new Set<number>();
    transactions.forEach((t) => s.add(parseInt(t.date.split("-")[2])));
    return s;
  }, [transactions]);

  // Group transactions by date (descending) for the list below the calendar
  const groups = useMemo(() => {
    const map = new Map<string, TransactionListItem[]>();
    transactions.forEach((t) => {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    });
    return [...map.keys()]
      .sort((a, b) => (a < b ? 1 : -1))
      .map((date) => {
        const txs = map.get(date)!;
        let exp = 0, inc = 0;
        txs.forEach((t) => {
          if (t.type === "expense") exp += t.amountCents;
          else if (t.type === "income") inc += t.amountCents;
        });
        return { date, txs, exp, inc };
      });
  }, [transactions]);

  const daysInMonth = getDaysInMonth(year, month);
  const leadOffset = firstWeekdayMonFirst(year, month);

  // Build calendar cells incl. leading blanks + trailing next-month fillers
  const cells: ({ day: number } | { trail: number } | null)[] = [];
  for (let i = 0; i < leadOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  let trail = 1;
  while (cells.length % 7 !== 0) cells.push({ trail: trail++ });

  const has = (d: number) => daysWithEntries.has(d);
  const weekdayOf = (d: number) => (leadOffset + d - 1) % 7;

  function renderDay(day: number) {
    const dateStr = fmt(year, month, day);
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    const isSelected = selectedDate === dateStr;
    const entry = has(day);

    let inner: any = styles.dayPlain;
    let dot = false;

    if (isToday) {
      inner = styles.dayToday;
      dot = true;
    } else if (isSelected) {
      inner = styles.daySelected;
    } else if (entry) {
      const wd = weekdayOf(day);
      const leftJoin = wd !== 0 && day > 1 && has(day - 1);
      const rightJoin = wd !== 6 && day < daysInMonth && has(day + 1);
      if (leftJoin || rightJoin) {
        inner = [
          styles.dayBand,
          {
            borderTopLeftRadius: leftJoin ? 0 : 20,
            borderBottomLeftRadius: leftJoin ? 0 : 20,
            borderTopRightRadius: rightJoin ? 0 : 20,
            borderBottomRightRadius: rightJoin ? 0 : 20,
          },
        ];
      } else {
        inner = styles.dayCircle;
      }
    }

    return (
      <Pressable
        key={day}
        style={styles.dayCell}
        onPress={() => setSelectedDate(dateStr)}
      >
        <View style={inner}>
          <Text style={styles.dayText}>{day}</Text>
          {dot && <View style={styles.todayDot} />}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />

      {/* Green header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Rich记账</Text>
          <Pressable
            style={styles.brandDd}
            onPress={() => router.push("/accounts")}
          >
            <FontAwesome name="chevron-down" size={11} color={TEXT_PRIMARY} />
          </Pressable>
        </View>
        <Pressable style={styles.avatar} onPress={() => router.push("/more")}>
          <FontAwesome name="user-o" size={16} color={TEXT_PRIMARY} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar card */}
        <View style={styles.calCard}>
          <View style={styles.calTop}>
            <Pressable style={styles.monthPill}>
              <Text style={styles.monthPillText}>
                {MONTH_NAMES_CN[month]} ▼
              </Text>
            </Pressable>
            <View style={styles.totals}>
              <View style={styles.totItem}>
                <Text style={styles.totLabel}>总支出</Text>
                <Text style={styles.totValue}>¥{centsToYuan(monthExpense)}</Text>
              </View>
              <View style={[styles.totItem, styles.totDivider]}>
                <Text style={styles.totLabel}>总收入</Text>
                <Text style={styles.totValue}>¥{centsToYuan(monthIncome)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekLabel}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((c, i) => {
              if (c === null) return <View key={`b${i}`} style={styles.dayCell} />;
              if ("trail" in c)
                return (
                  <View key={`t${i}`} style={styles.dayCell}>
                    <View style={styles.dayPlain}>
                      <Text style={styles.trailText}>{c.trail}</Text>
                    </View>
                  </View>
                );
              return renderDay(c.day);
            })}
          </View>
        </View>

        {/* Grouped transaction list */}
        <View style={styles.listArea}>
          {groups.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>本月还没有记录</Text>
            </View>
          ) : (
            groups.map((g, gi) => (
              <View key={g.date}>
                {gi > 0 && <View style={styles.gapBand} />}
                <View style={styles.dateHeader}>
                  <Text style={styles.dateLabel}>{dateHeaderCN(g.date)}</Text>
                  <View style={styles.dayTotals}>
                    <Text style={styles.dayExpense}>
                      -¥{centsToYuan(g.exp)}
                    </Text>
                    <Text style={styles.dayIncome}>+¥{centsToYuan(g.inc)}</Text>
                  </View>
                </View>
                <DashedLine />
                {g.txs.map((t) => (
                  <Pressable
                    key={t.id}
                    style={styles.txRow}
                    onPress={() => router.push(`/transaction/${t.id}`)}
                  >
                    <View style={styles.txIcon}>
                      <FontAwesome
                        name={getCategoryIcon(t.category?.name)}
                        size={13}
                        color={TEXT_SECONDARY}
                      />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {t.note || t.category?.name || "记录"}
                      </Text>
                      <Text style={styles.txSub}>{t.category?.name ?? ""}</Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmt,
                        t.type === "income" && { color: INCOME_GREEN },
                      ]}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {centsToYuan(t.amountCents)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: PRIMARY_GREEN,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brand: { fontSize: 28, fontWeight: "800", color: TEXT_PRIMARY },
  brandDd: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: TEXT_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: { flex: 1, backgroundColor: PRIMARY_GREEN },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },

  // Calendar card
  calCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  calTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  monthPill: {
    backgroundColor: "#F0F0F0",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  monthPillText: { fontSize: 14, fontWeight: "600", color: TEXT_PRIMARY },
  totals: { flexDirection: "row", marginLeft: "auto", alignItems: "center" },
  totItem: { alignItems: "flex-end" },
  totDivider: {
    borderLeftWidth: 1,
    borderLeftColor: "#E5E5E5",
    marginLeft: 14,
    paddingLeft: 14,
  },
  totLabel: { fontSize: 11, color: TEXT_SECONDARY, marginBottom: 3 },
  totValue: { fontSize: 14, fontWeight: "700", color: TEXT_PRIMARY },

  weekRow: { flexDirection: "row", marginBottom: 8 },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: TEXT_SECONDARY,
  },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 16, color: TEXT_PRIMARY, fontWeight: "500" },
  trailText: { fontSize: 16, color: "#CCCCCC" },
  dayPlain: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ENTRY_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBand: {
    width: "100%",
    height: 40,
    backgroundColor: ENTRY_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  dayToday: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E2E2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  todayDot: {
    position: "absolute",
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333333",
  },

  // List
  listArea: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    paddingTop: 16,
  },
  empty: { paddingVertical: 60, alignItems: "center" },
  emptyText: { fontSize: 15, color: TEXT_SECONDARY },

  gapBand: { height: 14, backgroundColor: GAP_GRAY },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  dashRow: {
    flexDirection: "row",
    overflow: "hidden",
    height: 1,
    marginHorizontal: 20,
    marginBottom: 6,
  },
  dash: { width: 5, height: 1, backgroundColor: DASH, marginRight: 4 },
  dateLabel: { fontSize: 15, color: TEXT_SECONDARY },
  dayTotals: { alignItems: "flex-end" },
  dayExpense: { fontSize: 13, color: TEXT_SECONDARY },
  dayIncome: { fontSize: 13, color: INCOME_GREEN, marginTop: 2 },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 16, fontWeight: "500", color: TEXT_PRIMARY },
  txSub: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 3 },
  txAmt: { fontSize: 17, fontWeight: "600", color: TEXT_PRIMARY },
});
