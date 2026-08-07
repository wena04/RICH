import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Text, View } from "@/components/Themed";
import {
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  EXPENSE_RED,
  INCOME_GREEN,
} from "@/constants/Colors";
import { getDb } from "@/src/db/db";
import {
  listTransactions,
  TransactionListItem,
} from "@/src/db/repo/transactions";
import { centsToYuan } from "@/src/utils/money";

// Calendar helpers
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0 = Sunday, convert to Monday = 0
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTH_NAMES_CN = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

export default function HomeScreen() {
  const router = useRouter();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    formatDate(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load transactions for the current month
  const loadTransactions = useCallback(async () => {
    try {
      const db = await getDb();
      const allTxs = await listTransactions(db);
      // Filter to current month
      const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
      const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${getDaysInMonth(currentYear, currentMonth)}`;
      const txs = allTxs.filter(
        (tx) => tx.date >= startDate && tx.date <= endDate,
      );
      setTransactions(txs);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  // Calculate month totals
  const { monthExpense, monthIncome } = useMemo(() => {
    let expense = 0;
    let income = 0;
    transactions.forEach((tx) => {
      if (tx.type === "expense") expense += tx.amountCents;
      else if (tx.type === "income") income += tx.amountCents;
    });
    return { monthExpense: expense, monthIncome: income };
  }, [transactions]);

  // Get transactions for selected date
  const selectedDateTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date === selectedDate);
  }, [transactions, selectedDate]);

  // Calculate daily totals for selected date
  const { dayExpense, dayIncome } = useMemo(() => {
    let expense = 0;
    let income = 0;
    selectedDateTransactions.forEach((tx) => {
      if (tx.type === "expense") expense += tx.amountCents;
      else if (tx.type === "income") income += tx.amountCents;
    });
    return { dayExpense: expense, dayIncome: income };
  }, [selectedDateTransactions]);

  // Get dates that have transactions
  const datesWithTransactions = useMemo(() => {
    const dates = new Set<string>();
    transactions.forEach((tx) => dates.add(tx.date));
    return dates;
  }, [transactions]);

  // Navigate months
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentYear, currentMonth]);

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return selectedDate === formatDate(currentYear, currentMonth, day);
  };

  const hasTransactions = (day: number) => {
    return datesWithTransactions.has(
      formatDate(currentYear, currentMonth, day),
    );
  };

  // Format selected date for display
  const selectedDateDisplay = useMemo(() => {
    const [year, month, day] = selectedDate.split("-");
    return `${parseInt(month)}月${parseInt(day)}日`;
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />

      {/* Green Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.brandName}>Rich记账</Text>
          <Pressable
            onPress={() => router.push("/more")}
            style={styles.profileButton}
          >
            <FontAwesome name="user-o" size={20} color={TEXT_PRIMARY} />
          </Pressable>
        </View>
      </View>

      {/* Calendar Card */}
      <View style={styles.calendarCard}>
        {/* Month selector and totals */}
        <View style={styles.calendarHeader}>
          <Pressable onPress={goToPrevMonth} style={styles.monthNav}>
            <FontAwesome name="chevron-left" size={12} color={TEXT_SECONDARY} />
          </Pressable>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES_CN[currentMonth]} ▼
          </Text>
          <Pressable onPress={goToNextMonth} style={styles.monthNav}>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={TEXT_SECONDARY}
            />
          </Pressable>

          <View style={styles.monthTotals}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>总支出</Text>
              <Text style={styles.totalValue}>
                ¥ {centsToYuan(monthExpense)}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>总收入</Text>
              <Text style={styles.totalValue}>
                ¥ {centsToYuan(monthIncome)}
              </Text>
            </View>
          </View>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day, i) => (
            <Text
              key={day}
              style={[styles.weekdayLabel, i >= 5 && styles.weekendLabel]}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => (
            <Pressable
              key={index}
              style={styles.dayCell}
              onPress={() =>
                day &&
                setSelectedDate(formatDate(currentYear, currentMonth, day))
              }
              disabled={!day}
            >
              {day && (
                <View
                  style={[
                    styles.dayContent,
                    isToday(day) && styles.todayCircle,
                    isSelected(day) && styles.selectedCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday(day) && styles.todayText,
                      isSelected(day) && styles.selectedText,
                      hasTransactions(day) && styles.hasDataText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Daily transactions section */}
      <View style={styles.dailySection}>
        {/* Date header with daily totals */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateLabel}>{selectedDateDisplay}</Text>
          <View style={styles.dailyTotals}>
            <Text style={styles.dailyExpense}>
              -¥ {centsToYuan(dayExpense)}
            </Text>
            <Text style={styles.dailyIncome}>+¥ {centsToYuan(dayIncome)}</Text>
          </View>
        </View>

        {/* Transaction list */}
        {selectedDateTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>这一天没有记录</Text>
          </View>
        ) : (
          <FlatList
            data={selectedDateTransactions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.transactionRow}
                onPress={() => router.push(`/transaction/${item.id}`)}
              >
                <View style={styles.transactionIcon}>
                  <FontAwesome
                    name={item.type === "income" ? "arrow-down" : "arrow-up"}
                    size={16}
                    color={
                      item.type === "income" ? INCOME_GREEN : TEXT_SECONDARY
                    }
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>
                    {item.note || item.category?.name || "Transaction"}
                  </Text>
                  <Text style={styles.transactionSubtitle}>
                    {item.category?.name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    item.type === "income" && styles.incomeAmount,
                    item.type === "expense" && styles.expenseAmount,
                  ]}
                >
                  {item.type === "income" ? "+" : "-"}
                  {centsToYuan(item.amountCents)}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
  },
  header: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  brandName: {
    fontSize: 28,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: TEXT_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  monthNav: {
    padding: 8,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
  monthTotals: {
    flexDirection: "row",
    marginLeft: "auto",
    gap: 16,
    backgroundColor: "transparent",
  },
  totalItem: {
    alignItems: "flex-end",
    backgroundColor: "transparent",
  },
  totalLabel: {
    fontSize: 10,
    color: TEXT_SECONDARY,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    color: TEXT_SECONDARY,
    fontWeight: "500",
  },
  weekendLabel: {
    color: TEXT_SECONDARY,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "transparent",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dayContent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  dayText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  todayCircle: {
    backgroundColor: PRIMARY_GREEN,
  },
  todayText: {
    color: TEXT_PRIMARY,
    fontWeight: "600",
  },
  selectedCircle: {
    borderWidth: 2,
    borderColor: TEXT_PRIMARY,
  },
  selectedText: {
    fontWeight: "600",
  },
  hasDataText: {
    fontWeight: "600",
  },
  dailySection: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "transparent",
  },
  dateLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  dailyTotals: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "transparent",
  },
  dailyExpense: {
    fontSize: 12,
    color: EXPENSE_RED,
  },
  dailyIncome: {
    fontSize: 12,
    color: INCOME_GREEN,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "transparent",
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    backgroundColor: "transparent",
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: TEXT_PRIMARY,
  },
  transactionSubtitle: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
  incomeAmount: {
    color: INCOME_GREEN,
  },
  expenseAmount: {
    color: TEXT_PRIMARY,
  },
});
