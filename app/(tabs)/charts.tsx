import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
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
import { centsToCurrencyString } from '@/src/utils/money';
import { addMonths, currentMonth } from '@/src/utils/month';

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

  const palette = [
    '#264653',
    '#2a9d8f',
    '#e9c46a',
    '#f4a261',
    '#e76f51',
    '#457b9d',
    '#1d3557',
    '#8d99ae',
    '#6d597a',
    '#ffb703',
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
    <View style={styles.container}>
      <Text style={styles.title}>Charts</Text>
      <Text style={styles.subtitle}>Charts are computed locally from SQLite (no backend).</Text>

      <View style={styles.monthRow}>
        <Pressable onPress={() => setMonth((m) => addMonths(m, -1))} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>Prev</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{month}</Text>
        <Pressable onPress={() => setMonth((m) => addMonths(m, 1))} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>Next</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Category pie (expenses)</Text>
        <Text style={styles.hint}>
          Total expense: ¥{centsToCurrencyString(totalExpense)} (selected month)
        </Text>
        <View style={styles.pieRow}>
          <PieChart size={140} innerRadius={44} data={pieData} />
          <View style={styles.pieLegend}>
            {categories.length === 0 ? (
              <Text style={styles.hint}>No expense data for this month.</Text>
            ) : (
              categories.map((c, idx) => {
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
                      <Text style={styles.legendMeta}>
                        ¥{centsToCurrencyString(c.totalCents)} · {pct}%
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly trends</Text>
        <Text style={styles.hint}>Expense vs income (last 6 months). `balance_adjustment` excluded.</Text>
        <LineChart
          width={320}
          height={120}
          series={[
            { values: monthly.map((m) => m.expenseCents), color: '#e76f51' },
            { values: monthly.map((m) => m.incomeCents), color: '#2a9d8f' },
          ]}
        />
        <View style={styles.monthLabels}>
          {monthly.map((m) => (
            <Text key={m.month} style={styles.monthTick}>
              {m.month.slice(5)}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Subcategory drill-down</Text>
        <Text style={styles.hint}>
          {selectedCategoryName ? `Category: ${selectedCategoryName}` : 'Select a category above to drill down.'}
        </Text>
        {selectedCategoryId ? (
          subcategories.length === 0 ? (
            <Text style={styles.hint}>No subcategory data (or no expenses) for this category.</Text>
          ) : (
            <View style={styles.subList}>
              {subcategories.map((s) => (
                <View key={s.subcategoryId ?? 'none'} style={styles.subRow}>
                  <Text style={styles.subName}>{s.subcategoryName ?? '(no subcategory)'}</Text>
                  <Text style={styles.subAmount}>¥{centsToCurrencyString(s.totalCents)}</Text>
                </View>
              ))}
            </View>
          )
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.8,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
  },
  monthBtnText: {
    fontWeight: '600',
    fontSize: 12,
  },
  monthLabel: {
    fontWeight: '700',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cardTitle: {
    fontWeight: '600',
  },
  hint: {
    opacity: 0.75,
    fontSize: 12,
  },
  pieRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  pieLegend: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.15)',
  },
  legendRowActive: {
    borderColor: 'rgba(127,127,127,0.6)',
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    flex: 1,
    gap: 2,
  },
  legendName: {
    fontWeight: '600',
  },
  legendMeta: {
    opacity: 0.7,
    fontSize: 12,
  },
  monthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthTick: {
    opacity: 0.7,
    fontSize: 11,
  },
  subList: {
    gap: 8,
    marginTop: 6,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  subName: {
    fontWeight: '600',
  },
  subAmount: {
    fontVariant: ['tabular-nums'],
  },
});

