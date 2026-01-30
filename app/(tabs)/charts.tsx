import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { 
  PRIMARY_GREEN, 
  TEXT_PRIMARY, 
  TEXT_SECONDARY,
  EXPENSE_RED,
  INCOME_GREEN,
} from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import {
  getExpenseCategoryTotalsForMonth,
  getExpenseSubcategoryTotalsForMonth,
  getMonthlyTotals,
  type CategoryTotal,
  type SubcategoryTotal,
} from '@/src/features/charts/aggregations';
import { LineChart } from '@/src/features/charts/LineChart';
import { PieChart } from '@/src/features/charts/PieChart';
import { centsToYuan } from '@/src/utils/money';
import { addMonths, currentMonth } from '@/src/utils/month';

const MONTH_NAMES_CN = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function formatMonthCN(monthStr: string): string {
  const month = parseInt(monthStr.split('-')[1]);
  return MONTH_NAMES_CN[month - 1] ?? monthStr;
}

export default function ChartsScreen() {
  const [month, setMonth] = useState(currentMonth());
  const [categories, setCategories] = useState<CategoryTotal[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<SubcategoryTotal[]>([]);
  const [monthly, setMonthly] = useState<Array<{ month: string; expenseCents: number; incomeCents: number }>>([]);

  const refresh = useCallback(async () => {
    const db = await getDb();
    const cats = await getExpenseCategoryTotalsForMonth(db, month);
    setCategories(cats);

    const m = await getMonthlyTotals(db, { monthsBack: 6, endMonthInclusive: month });
    setMonthly(m);

    if (selectedCategoryId) {
      const subs = await getExpenseSubcategoryTotalsForMonth(db, month, selectedCategoryId);
      setSubcategories(subs);
    } else {
      setSubcategories([]);
    }
  }, [month, selectedCategoryId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const totalExpense = useMemo(
    () => categories.reduce((acc, c) => acc + c.totalCents, 0),
    [categories]
  );

  const totalIncome = useMemo(
    () => monthly.find(m => m.month === month)?.incomeCents ?? 0,
    [monthly, month]
  );

  const balance = totalIncome - totalExpense;

  const palette = [
    '#FF6B6B', // red
    '#4ECDC4', // teal
    '#FFE66D', // yellow
    '#95E1D3', // mint
    '#F38181', // coral
    '#AA96DA', // purple
    '#FCBAD3', // pink
    '#A8D8EA', // light blue
    '#FFB347', // orange
    '#98D8C8', // green
  ];

  const pieData = useMemo(
    () =>
      categories.map((c, idx) => ({
        value: c.totalCents,
        color: palette[idx % palette.length],
      })),
    [categories]
  );

  const selectedCategoryName = useMemo(
    () => categories.find((c) => c.categoryId === selectedCategoryId)?.categoryName ?? null,
    [categories, selectedCategoryId]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      
      {/* Green Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>预算/计划</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryCards}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>计划清单</Text>
          <Text style={styles.summaryValue}>¥ 0.00</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>结余</Text>
          <Text style={[styles.summaryValue, balance >= 0 ? styles.positiveValue : styles.negativeValue]}>
            ¥ {centsToYuan(Math.abs(balance))}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>趋势图</Text>
          <FontAwesome name="line-chart" size={20} color={PRIMARY_GREEN} />
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Month Selector */}
        <View style={styles.monthRow}>
          <Pressable onPress={() => setMonth((m) => addMonths(m, -1))} style={styles.monthBtn}>
            <FontAwesome name="chevron-left" size={14} color={TEXT_SECONDARY} />
          </Pressable>
          <Text style={styles.monthLabel}>{formatMonthCN(month)}</Text>
          <Pressable onPress={() => setMonth((m) => addMonths(m, 1))} style={styles.monthBtn}>
            <FontAwesome name="chevron-right" size={14} color={TEXT_SECONDARY} />
          </Pressable>
        </View>

        {/* Category Pie Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>支出分类</Text>
          <Text style={styles.cardSubtitle}>
            本月支出: ¥{centsToYuan(totalExpense)}
          </Text>
          
          {categories.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="pie-chart" size={48} color={TEXT_SECONDARY} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyText}>本月暂无支出记录</Text>
            </View>
          ) : (
            <View style={styles.pieRow}>
              <PieChart size={160} innerRadius={50} data={pieData} />
              <View style={styles.pieLegend}>
                {categories.slice(0, 5).map((c, idx) => {
                  const pct = totalExpense > 0 ? Math.round((c.totalCents / totalExpense) * 100) : 0;
                  const selected = c.categoryId === selectedCategoryId;
                  return (
                    <Pressable
                      key={c.categoryId}
                      onPress={() => setSelectedCategoryId(c.categoryId)}
                      style={[styles.legendRow, selected && styles.legendRowActive]}>
                      <View style={[styles.swatch, { backgroundColor: palette[idx % palette.length] }]} />
                      <View style={styles.legendText}>
                        <Text style={styles.legendName}>{c.categoryName}</Text>
                        <Text style={styles.legendMeta}>{pct}%</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Monthly Trends */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>月度趋势</Text>
          <Text style={styles.cardSubtitle}>支出 vs 收入 (近6个月)</Text>
          
          {monthly.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>暂无数据</Text>
            </View>
          ) : (
            <>
              <LineChart
                width={320}
                height={120}
                series={[
                  { values: monthly.map((m) => m.expenseCents), color: EXPENSE_RED },
                  { values: monthly.map((m) => m.incomeCents), color: INCOME_GREEN },
                ]}
              />
              <View style={styles.monthLabels}>
                {monthly.map((m) => (
                  <Text key={m.month} style={styles.monthTick}>
                    {formatMonthCN(m.month)}
                  </Text>
                ))}
              </View>
              <View style={styles.legendIndicators}>
                <View style={styles.legendIndicator}>
                  <View style={[styles.legendDot, { backgroundColor: EXPENSE_RED }]} />
                  <Text style={styles.legendIndicatorText}>支出</Text>
                </View>
                <View style={styles.legendIndicator}>
                  <View style={[styles.legendDot, { backgroundColor: INCOME_GREEN }]} />
                  <Text style={styles.legendIndicatorText}>收入</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Subcategory Drill-down */}
        {selectedCategoryId && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>分类明细</Text>
            <Text style={styles.cardSubtitle}>
              {selectedCategoryName}
            </Text>
            {subcategories.length === 0 ? (
              <Text style={styles.emptyText}>该分类无子分类数据</Text>
            ) : (
              <View style={styles.subList}>
                {subcategories.map((s) => (
                  <View key={s.subcategoryId ?? 'none'} style={styles.subRow}>
                    <Text style={styles.subName}>{s.subcategoryName ?? '(无子分类)'}</Text>
                    <Text style={styles.subAmount}>¥{centsToYuan(s.totalCents)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  summaryCards: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  summaryLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  positiveValue: {
    color: INCOME_GREEN,
  },
  negativeValue: {
    color: EXPENSE_RED,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 16,
  },
  monthBtn: {
    padding: 8,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  cardSubtitle: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
    backgroundColor: 'transparent',
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  pieRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  pieLegend: {
    flex: 1,
    gap: 8,
    backgroundColor: 'transparent',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  legendRowActive: {
    backgroundColor: `${PRIMARY_GREEN}20`,
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  legendName: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_PRIMARY,
  },
  legendMeta: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  monthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  monthTick: {
    fontSize: 10,
    color: TEXT_SECONDARY,
  },
  legendIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  legendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendIndicatorText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  subList: {
    gap: 8,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'transparent',
  },
  subName: {
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  subAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
  },
});
