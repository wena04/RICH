import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  View,
  Text,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import {
  CONTROL_PRESSED_BACKGROUND,
  ENTRY_GREEN,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/constants/Colors";
import { getDb } from "@/src/db/db";
import {
  listRecordMonths,
  listTransactions,
  TransactionListItem,
} from "@/src/db/repo/transactions";
import { centsToYuan } from "@/src/utils/money";
import { RichBrandName } from "@/components/rich";
import { MonthPickerSheet } from "@/components/rich/MonthPickerSheet";
import { LedgerDayHeader, LedgerDays, LedgerRow, groupLedgerByDay } from "@/components/rich/LedgerList";

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

export default function HomeScreen() {
  const router = useRouter();
  const today = new Date();
  // The month Home shows; the month pill opens a picker to change it.
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [recordMonths, setRecordMonths] = useState<ReadonlySet<string>>(new Set());
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    fmt(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [showDaySheet, setShowDaySheet] = useState(false);
  const insets = useSafeAreaInsets();
  // The original day sheet slides up over the summary card, below the brand header.
  const [headerHeight, setHeaderHeight] = useState(96);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  // A failed read must not look like an empty month.
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  const loadTransactions = useCallback(async () => {
    try {
      const db = await getDb();
      const [monthRecords, months] = await Promise.all([
        listTransactions(db, {
          start: fmt(year, month, 1),
          endExclusive: fmt(month === 11 ? year + 1 : year, (month + 1) % 12, 1),
        }),
        listRecordMonths(db),
      ]);
      setTransactions(monthRecords);
      setRecordMonths(new Set(months));
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
  const groups = useMemo(() => groupLedgerByDay(transactions), [transactions]);

  const visibleGroups = useMemo(
    () => (filterDate ? groups.filter((group) => group.date === filterDate) : groups),
    [filterDate, groups],
  );

  function showMonth(nextYear: number, nextMonth: number) {
    setShowMonthPicker(false);
    if (nextYear === year && nextMonth === month) return;
    setLoadState("loading");
    setTransactions([]);
    setYear(nextYear);
    setMonth(nextMonth);
    setFilterDate(null);
    const isThisMonth = nextYear === today.getFullYear() && nextMonth === today.getMonth();
    setSelectedDate(isThisMonth ? fmt(nextYear, nextMonth, today.getDate()) : null);
  }

  // Swipe up on the card folds the calendar away (as in the original's list view); swipe down
  // brings it back. Taps on days still go through: the pan needs 12pt of vertical travel.
  const calendarSwipe = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetY([-12, 12])
        .failOffsetX([-24, 24])
        .onEnd((event) => {
          if (event.translationY < -24) setShowCalendar(false);
          else if (event.translationY > 24) setShowCalendar(true);
        }),
    [],
  );

  const firstRecordYear = useMemo(() => {
    let first = today.getFullYear();
    for (const ym of recordMonths) first = Math.min(first, Number(ym.slice(0, 4)));
    return first;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordMonths]);

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
    // The original greys out days that haven't happened yet.
    const isFuture = new Date(year, month, day) > today;

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
            borderTopLeftRadius: leftJoin || (wd === 0 && hasPrevious) ? 0 : 14,
            borderBottomLeftRadius: leftJoin || (wd === 0 && hasPrevious) ? 0 : 14,
            borderTopRightRadius: rightJoin || (wd === 6 && hasNext) ? 0 : 14,
            borderBottomRightRadius: rightJoin || (wd === 6 && hasNext) ? 0 : 14,
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
          setSelectedDate(dateStr);
          setSheetDate(dateStr);
          setShowDaySheet(true);
        }}
      >
        <View style={inner}>
          <Text style={[styles.dayText, isFuture && styles.dayTextFuture]}>{day}</Text>
          {dot && <View style={styles.todayDot} />}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />

      {/* Green header */}
      <View
        style={styles.header}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
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
        <GestureDetector gesture={calendarSwipe}>
        <View
          style={[styles.calCard, !showCalendar && styles.calCardCollapsed]}
          accessibilityActions={[
            { name: showCalendar ? "collapse" : "expand", label: showCalendar ? "收起日历" : "展开日历" },
          ]}
          onAccessibilityAction={() => setShowCalendar((current) => !current)}
        >
          <View style={[styles.calTop, !showCalendar && styles.calTopCollapsed]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`选择月份，当前${year}年${month + 1}月`}
              accessibilityHint="打开月份和年份选择"
              onPress={() => setShowMonthPicker(true)}
              hitSlop={9}
              style={({ pressed }) => [
                styles.monthTrigger,
                pressed && styles.monthTriggerPressed,
              ]}
            >
              <Text style={styles.monthPillText}>
                {year === today.getFullYear() ? "" : `${year}年`}{MONTH_NAMES_CN[month]}
              </Text>
              <View style={styles.monthCaret} />
            </Pressable>
            <View style={styles.totals}>
              <View style={styles.totItem}>
                <Text style={styles.totLabel}>总支出</Text>
                <Text style={styles.totValue}>¥ {centsToYuan(monthExpense)}</Text>
              </View>
              <View style={styles.totDivider} />
              <View style={styles.totItem}>
                <Text style={styles.totLabel}>总收入</Text>
                <Text style={styles.totValue}>¥ {centsToYuan(monthIncome)}</Text>
              </View>
            </View>
          </View>

          {showCalendar ? (
            <>
              <View style={styles.calDivider} />
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
        </GestureDetector>

        {/* Grouped transaction list */}
        <View style={styles.listArea}>
          {loadState === "error" ? (
            <View style={styles.empty}>
              <Image source={require("../../assets/images/ui/icon_warning.png")} style={{ width: 32, height: 32 }} accessible={false} />
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
                {filterDate
                  ? '这一天还没有记录'
                  : `${year === today.getFullYear() && month === today.getMonth() ? '本月' : `${month + 1}月`}还没有收支记录`}
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
            <LedgerDays
              days={visibleGroups}
              onOpen={(t) => router.push(`/transaction/${t.id}`)}
            />
          )}
        </View>
      </ScrollView>

      <MonthPickerSheet
        visible={showMonthPicker}
        year={year}
        month={month}
        currentYear={today.getFullYear()}
        firstRecordYear={firstRecordYear}
        onSelect={showMonth}
        onClose={() => setShowMonthPicker(false)}
      />

      <Modal
        visible={showDaySheet}
        animationType="slide"
        transparent
        // Android: draw under the status bar so the sheet lines up with the header measured outside the modal.
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setShowDaySheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setShowDaySheet(false)}
          />
          <View
            style={[
              styles.sheet,
              { top: insets.top + headerHeight + 5.3, paddingBottom: insets.bottom + 21.3 },
            ]}
          >
            <Pressable
              style={styles.sheetClose}
              onPress={() => setShowDaySheet(false)}
              accessibilityRole="button"
              accessibilityLabel="关闭"
            >
              <Image
                source={require("../../assets/images/ui/close_clear.png")}
                style={styles.sheetCloseIcon}
                accessible={false}
              />
            </Pressable>

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
                    <LedgerDayHeader day={g} />
                    {g.txs.map((t) => (
                      <LedgerRow
                        key={t.id}
                        t={t}
                        onPress={() => {
                          setShowDaySheet(false);
                          router.push((`/transaction/${t.id}` as unknown) as Href);
                        }}
                      />
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
  // Measured from the original at 3x: title art at (23.7, 11.3) below the safe area, the 40pt
  // account menu and profile buttons level with its lettering, and the card 22.4pt below it.
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingLeft: 23.7,
    paddingRight: 18.3,
    paddingTop: 11.3,
    paddingBottom: 22.4,
    backgroundColor: PRIMARY_GREEN,
  },
  brandRow: { flexDirection: "row", alignItems: "flex-start" },
  brandDd: {
    width: 40,
    height: 40,
    marginTop: 16.9,
    marginBottom: -2.9, // keep the header as tall as the title art
    marginLeft: 2,
  },
  brandMenuImage: { width: 40, height: 40 },
  avatar: {
    width: 40,
    height: 40,
    marginTop: 15.4,
    marginBottom: -1.4,
  },
  avatarImage: { width: 40, height: 40 },

  scroll: { flex: 1, backgroundColor: PRIMARY_GREEN },
  scrollContent: { flexGrow: 1 },

  // Calendar card
  // Calendar card geometry measured from the original at 3x (offsets from the card top):
  // month pill +11.3, divider +45.6, weekdays +59.6, first day circle +87.3, 38pt rows,
  // 4pt under the last row, then 20.3pt of green before the list.
  calCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 0,
    paddingBottom: 4,
  },
  calTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    height: 45.6,
    paddingLeft: 10.3,
    paddingRight: 17,
  },
  calTopCollapsed: { height: 46 },
  calCardCollapsed: { paddingBottom: 0 },
  monthTrigger: {
    minWidth: 52.2,
    height: 23.3,
    marginTop: 11.3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8.4,
    paddingRight: 7.5,
    borderRadius: 11.65,
    backgroundColor: '#F6F7F8',
  },
  monthTriggerPressed: { backgroundColor: CONTROL_PRESSED_BACKGROUND },
  monthPillText: { fontSize: 14, fontWeight: "600", color: "#000000" },
  monthCaret: {
    width: 0,
    height: 0,
    borderLeftWidth: 4.5,
    borderRightWidth: 4.5,
    borderTopWidth: 5.7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#000000",
  },
  totals: { flexDirection: "row", marginLeft: "auto", alignItems: "flex-start", marginTop: 11 },
  totItem: { alignItems: "flex-end" },
  totDivider: {
    width: 1,
    height: 26,
    marginTop: -1,
    marginLeft: 16.6,
    marginRight: 14,
    backgroundColor: "#EAEAEA",
  },
  totLabel: { fontSize: 10, lineHeight: 12, color: "#777777" },
  totValue: {
    fontSize: 13.5,
    lineHeight: 16,
    color: "#000000",
    fontVariant: ["tabular-nums"],
  },

  weekRow: { flexDirection: "row", marginTop: 11.9, marginBottom: 10.1 },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 14,
    color: "#C7C7D3",
  },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 14, color: "#000000" },
  dayTextFuture: { color: "#777777" },
  adjacentMonthText: { fontSize: 14, color: "#C7C7D2" },
  dayPlain: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ENTRY_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBand: {
    width: "100%",
    height: 28,
    backgroundColor: ENTRY_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  dayToday: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  todayDot: {
    position: "absolute",
    bottom: 2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#000000",
  },

  // List
  listArea: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    marginTop: 20.3,
    paddingBottom: 24,
  },
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


  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetBackdrop: { flex: 1 },
  sheetCloseIcon: { width: 40, height: 40 },
  calDivider: { height: 2 / 3, backgroundColor: "#F2F2F2", marginHorizontal: 15.3 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
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
  // Original close_clear art (translucent disc with a white X), 6.3pt from the edge.
  sheetClose: {
    position: "absolute",
    top: -42.3,
    right: 6.3,
    width: 40,
    height: 40,
    zIndex: 2,
  },
  sheetTitle: { fontSize: 15, fontWeight: "600", color: TEXT_PRIMARY },
  sheetEmpty: { paddingVertical: 40, alignItems: "center" },
  sheetAddBtn: {
    alignSelf: "center",
    width: 207,
    height: 44,
    marginTop: 12,
    backgroundColor: "#F6F7F8",
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetAddText: { fontSize: 15, color: "#000000" },
});
