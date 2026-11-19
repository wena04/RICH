import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  View,
  Text,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import {
  CONTROL_PRESSED_BACKGROUND,
  ENTRY_GREEN,
  INCOME_TEXT_GREEN,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/constants/Colors";
import { getDb } from "@/src/db/db";
import {
  listTransactions,
  TransactionListItem,
} from "@/src/db/repo/transactions";
import { centsToYuan } from "@/src/utils/money";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DashedDivider, RichBrandName } from "@/components/rich";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTH_NAMES_CN = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];


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

export default function HomeScreen() {
  const router = useRouter();
  const today = new Date();
  const [year] = useState(today.getFullYear());
  const [month] = useState(today.getMonth());
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    fmt(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [showDaySheet, setShowDaySheet] = useState(false);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  // A failed read must not look like an empty month.
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  const loadTransactions = useCallback(async () => {
    try {
      const db = await getDb();
      const all = await listTransactions(db);
      const start = fmt(year, month, 1);
      const end = fmt(year, month, getDaysInMonth(year, month));
      setTransactions(all.filter((t) => t.date >= start && t.date <= end));
      setLoadState("ready");
    } catch (e) {
      console.error("Failed to load transactions:", e);
      setLoadState("error");
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

  const visibleGroups = useMemo(
    () => (filterDate ? groups.filter((group) => group.date === filterDate) : groups),
    [filterDate, groups],
  );

  const daysInMonth = getDaysInMonth(year, month);
  const leadOffset = firstWeekdayMonFirst(year, month);

  // The original calendar always shows adjacent-month dates instead of blanks.
  const cells: ({ day: number } | { lead: number } | { trail: number })[] = [];
  const previousMonthDays = getDaysInMonth(year, month - 1);
  for (let i = 0; i < leadOffset; i++) {
    cells.push({ lead: previousMonthDays - leadOffset + i + 1 });
  }
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
      const hasPrevious = day > 1 && has(day - 1);
      const hasNext = day < daysInMonth && has(day + 1);
      const leftJoin = wd !== 0 && hasPrevious;
      const rightJoin = wd !== 6 && hasNext;
      if (hasPrevious || hasNext) {
        inner = [
          styles.dayBand,
          {
            borderTopLeftRadius: leftJoin || (wd === 0 && hasPrevious) ? 0 : 20,
            borderBottomLeftRadius: leftJoin || (wd === 0 && hasPrevious) ? 0 : 20,
            borderTopRightRadius: rightJoin || (wd === 6 && hasNext) ? 0 : 20,
            borderBottomRightRadius: rightJoin || (wd === 6 && hasNext) ? 0 : 20,
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
        accessibilityRole="button"
        accessibilityLabel={`${month + 1}月${day}日${entry ? '，有记录' : '，无记录'}`}
        accessibilityState={{ selected: isSelected }}
        onPress={() => {
          const clearing = filterDate === dateStr;
          setSelectedDate(clearing ? null : dateStr);
          setFilterDate(clearing ? null : dateStr);
        }}
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
          <RichBrandName size={40} />
          <Pressable
            style={styles.brandDd}
            onPress={() => router.push("/accounts")}
            accessibilityRole="button"
            accessibilityLabel="查看账户"
          >
            <Image
              source={require('../../assets/images/ui/header-account-menu.png')}
              resizeMode="contain"
              style={styles.brandMenuImage}
            />
          </Pressable>
        </View>
        <Pressable
          style={styles.avatar}
          onPress={() => router.push("/more")}
          accessibilityRole="button"
          accessibilityLabel="更多设置"
        >
          <Image
            source={require('../../assets/images/ui/header-profile.png')}
            resizeMode="contain"
            style={styles.avatarImage}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar card */}
        <View style={styles.calCard}>
          <View style={[styles.calTop, !showCalendar && styles.calTopCollapsed]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${showCalendar ? '收起' : '展开'}${MONTH_NAMES_CN[month]}日历`}
              accessibilityState={{ expanded: showCalendar }}
              onPress={() => setShowCalendar((current) => !current)}
              style={({ pressed }) => [
                styles.monthTrigger,
                pressed && styles.monthTriggerPressed,
              ]}
            >
              <Text style={styles.monthPillText}>
                {year === today.getFullYear() ? "" : `${year}年`}{MONTH_NAMES_CN[month]}
              </Text>
              <FontAwesome name="caret-down" size={13} color={TEXT_PRIMARY} />
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

          {showCalendar ? (
            <>
              <View style={styles.weekRow}>
                {WEEKDAYS.map((w) => (
                  <Text key={w} style={styles.weekLabel}>
                    {w}
                  </Text>
                ))}
              </View>

              <View style={styles.grid}>
                {cells.map((c, i) => {
                  if ("lead" in c)
                    return (
                      <View key={`l${i}`} style={styles.dayCell}>
                        <View style={styles.dayPlain}>
                          <Text style={styles.adjacentMonthText}>{c.lead}</Text>
                        </View>
                      </View>
                    );
                  if ("trail" in c)
                    return (
                      <View key={`t${i}`} style={styles.dayCell}>
                        <View style={styles.dayPlain}>
                          <Text style={styles.adjacentMonthText}>{c.trail}</Text>
                        </View>
                      </View>
                    );
                  return renderDay(c.day);
                })}
              </View>
            </>
          ) : null}
        </View>

        {/* Grouped transaction list */}
        <View style={styles.listArea}>
          {filterDate ? (
            <View style={styles.filterBar}>
              <Text style={styles.filterLabel}>{dateHeaderCN(filterDate)}</Text>
              <Pressable
                style={styles.clearFilter}
                onPress={() => {
                  setFilterDate(null);
                  setSelectedDate(null);
                }}
              >
                <Text style={styles.clearFilterText}>查看全部</Text>
              </Pressable>
            </View>
          ) : null}
          {loadState === "error" ? (
            <View style={styles.empty}>
              <FontAwesome name="exclamation-circle" size={22} color={TEXT_SECONDARY} />
              <Text style={[styles.emptyText, styles.errorTitle]}>没有读取到本月记录</Text>
              <Text style={styles.errorBody}>记录没有丢失，请重新读取。</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.emptyAction}
                onPress={() => {
                  setLoadState("loading");
                  void loadTransactions();
                }}
              >
                <Text style={styles.emptyActionText}>重新读取</Text>
              </Pressable>
            </View>
          ) : loadState === "loading" && transactions.length === 0 ? (
            <View style={styles.empty} accessibilityLabel="正在读取本月记录">
              <ActivityIndicator size="small" color={PRIMARY_GREEN} />
            </View>
          ) : visibleGroups.length === 0 ? (
            <View style={styles.empty}>
              {!filterDate ? (
                <Image
                  source={require('../../assets/images/ui/icon-emptybox.png')}
                  resizeMode="contain"
                  style={styles.emptyIllustration}
                  accessible={false}
                />
              ) : null}
              <Text style={styles.emptyText}>
                {filterDate ? '这一天还没有记录' : '本月还没有收支记录'}
              </Text>
              {filterDate ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.emptyAction}
                  onPress={() =>
                    router.push({
                      pathname: '/transaction/new',
                      params: { date: filterDate },
                    })
                  }
                >
                  <Text style={styles.emptyActionText}>记这一天</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            visibleGroups.map((g, gi) => (
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
                <DashedDivider style={styles.dateDivider} />
                {g.txs.map((t) => (
                  <Pressable
                    key={t.id}
                    style={styles.txRow}
                    onPress={() => router.push(`/transaction/${t.id}`)}
                  >
                    <View style={styles.txIcon}>
                      <CategoryIcon
                        id={t.category?.icon ?? undefined}
                        name={t.category?.name}
                        size={20}
                      />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {t.note || t.category?.name || "记录"}
                      </Text>
                      <Text style={styles.txSub}>
                        {t.subcategory?.name
                          ? `${t.category?.name ?? '分类'} › ${t.subcategory.name}`
                          : (t.category?.name ?? '')}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmt,
                        t.type === "income" && { color: INCOME_TEXT_GREEN },
                      ]}
                    >
                      {t.type === "expense" || t.amountCents < 0 ? "-" : "+"}
                      {centsToYuan(Math.abs(t.amountCents))}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showDaySheet} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setShowDaySheet(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetTop}>
              <Pressable
                style={styles.sheetClose}
                onPress={() => setShowDaySheet(false)}
              >
                <FontAwesome name="close" size={16} color={TEXT_PRIMARY} />
              </Pressable>
              <Text style={styles.sheetTitle}>
                {sheetDate ? dateHeaderCN(sheetDate) : ""}
              </Text>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(() => {
                const g = sheetDate ? groups.find((x) => x.date === sheetDate) : undefined;
                if (!g) {
                  return (
                    <View style={styles.sheetEmpty}>
                      <Text style={styles.emptyText}>该日还没有记录</Text>
                    </View>
                  );
                }
                return (
                  <View style={{ paddingBottom: 20 }}>
                    <View style={styles.dateHeader}>
                      <Text style={styles.dateLabel}>{dateHeaderCN(g.date)}</Text>
                      <View style={styles.dayTotals}>
                        <Text style={styles.dayExpense}>-¥{centsToYuan(g.exp)}</Text>
                        <Text style={styles.dayIncome}>+¥{centsToYuan(g.inc)}</Text>
                      </View>
                    </View>
                    <DashedDivider style={styles.dateDivider} />
                    {g.txs.map((t) => (
                      <Pressable
                        key={t.id}
                        style={styles.txRow}
                        onPress={() => {
                          setShowDaySheet(false);
                          router.push((`/transaction/${t.id}` as unknown) as Href);
                        }}
                      >
                        <View style={styles.txIcon}>
                          <CategoryIcon
                            id={t.category?.icon ?? undefined}
                            name={t.category?.name}
                            size={20}
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
                            t.type === "income" && { color: INCOME_TEXT_GREEN },
                          ]}
                        >
                          {t.type === "expense" || t.amountCents < 0 ? "-" : "+"}
                          {centsToYuan(Math.abs(t.amountCents))}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                );
              })()}
            </ScrollView>

            <Pressable
              style={styles.sheetAddBtn}
              onPress={() => {
                const d = sheetDate ?? fmt(year, month, today.getDate());
                setShowDaySheet(false);
                router.push((`/transaction/new?date=${d}` as unknown) as Href);
              }}
            >
              <Text style={styles.sheetAddText}>添加一笔支出/收入</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  brandDd: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  brandMenuImage: { width: 44, height: 44 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 44, height: 44 },

  scroll: { flex: 1, backgroundColor: PRIMARY_GREEN },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },

  // Calendar card
  calCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 0,
    paddingVertical: 16,
  },
  calTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  calTopCollapsed: { marginBottom: 0 },
  monthTrigger: {
    minWidth: 66,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: '#F7F7F7',
  },
  monthTriggerPressed: { backgroundColor: CONTROL_PRESSED_BACKGROUND },
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
  totValue: { fontSize: 14, fontWeight: "700", color: TEXT_PRIMARY, fontVariant: ["tabular-nums"] },

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
  adjacentMonthText: { fontSize: 16, color: "#CBCBD3" },
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
  filterBar: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  filterLabel: { fontSize: 12, color: TEXT_SECONDARY },
  clearFilter: {
    borderRadius: 12,
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearFilterText: { fontSize: 10.5, color: TEXT_PRIMARY },
  empty: { paddingVertical: 60, alignItems: "center" },
  emptyIllustration: { width: 80, height: 80, marginBottom: 20 },
  emptyText: { fontSize: 15, color: TEXT_SECONDARY },
  errorTitle: { marginTop: 12, color: TEXT_PRIMARY, fontWeight: "600" },
  errorBody: { marginTop: 6, fontSize: 12, color: TEXT_SECONDARY },
  emptyAction: {
    marginTop: 16,
    minWidth: 120,
    minHeight: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101A17',
    borderRadius: 3,
  },
  emptyActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  gapBand: { height: 14, backgroundColor: CONTROL_PRESSED_BACKGROUND },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  dateDivider: {
    marginHorizontal: 20,
    marginBottom: 6,
  },
  dateLabel: { fontSize: 15, color: TEXT_SECONDARY },
  dayTotals: { alignItems: "flex-end" },
  dayExpense: { fontSize: 13, color: TEXT_SECONDARY, fontVariant: ["tabular-nums"] },
  dayIncome: { fontSize: 13, color: INCOME_TEXT_GREEN, marginTop: 2, fontVariant: ["tabular-nums"] },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F8F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 16, fontWeight: "500", color: TEXT_PRIMARY },
  txSub: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 3 },
  txAmt: { fontSize: 17, fontWeight: "600", color: TEXT_PRIMARY, fontVariant: ["tabular-nums"] },

  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetBackdrop: { flex: 1 },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 12,
    maxHeight: "85%",
  },
  sheetTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontSize: 15, fontWeight: "600", color: TEXT_PRIMARY },
  sheetEmpty: { paddingVertical: 40, alignItems: "center" },
  sheetAddBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  sheetAddText: { fontSize: 15, fontWeight: "600", color: TEXT_PRIMARY },
});
