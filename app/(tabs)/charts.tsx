import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, ScrollView, SafeAreaView, StatusBar, View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { CategoryIcon } from '@/components/CategoryIcon';
import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import { getBudgetSummary } from '@/src/db/repo/budgets';
import { getMonthlyTotals } from '@/src/features/charts/aggregations';
import { PieChart } from '@/src/features/charts/PieChart';
import type { BudgetSummary } from '@/src/domain/types';
import { centsToYuan } from '@/src/utils/money';
import { addMonths, currentMonth } from '@/src/utils/month';

const BUDGET_DONUT = [
  { value: 55, color: '#7ED9BE' },
  { value: 30, color: '#B7E9D8' },
  { value: 15, color: '#DFF2EA' },
];
const TREND_DONUT = [
  { value: 35, color: '#9B8CFF' },
  { value: 27, color: '#6FA8FF' },
  { value: 38, color: '#7FE0B0' },
];

const MONTH_NAMES_CN = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

function formatMonthCN(period: string): string {
  const [, m] = period.split('-');
  return MONTH_NAMES_CN[parseInt(m, 10) - 1] ?? period;
}

function barColor(spent: number, limit: number): string {
  if (limit <= 0) return '#3ECDA5';
  const pct = spent / limit;
  if (pct > 1) return '#FF6B6B';
  if (pct >= 0.8) return '#FFB347';
  return '#3ECDA5';
}

export default function BudgetScreen() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const [balance, setBalance] = useState(0);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);

  const refresh = useCallback(async () => {
    const db = await getDb();
    const m = await getMonthlyTotals(db, { monthsBack: 1, endMonthInclusive: month });
    const cur = m[m.length - 1];
    setBalance((cur?.incomeCents ?? 0) - (cur?.expenseCents ?? 0));
    setSummary(await getBudgetSummary(db, month));
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const hasBudget = summary != null && summary.categories.length > 0;
  const usedPct =
    summary && summary.totalLimitCents > 0
      ? Math.round((summary.totalSpentCents / summary.totalLimitCents) * 100)
      : 0;
  const remaining = summary ? summary.totalLimitCents - summary.totalSpentCents : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>预算/计划</Text>
      </View>

      <View style={styles.monthRow}>
        <Pressable onPress={() => setMonth((m) => addMonths(m, -1))} hitSlop={8}>
          <FontAwesome name="chevron-left" size={12} color={TEXT_SECONDARY} />
        </Pressable>
        <Text style={styles.monthLabel}>{formatMonthCN(month)}</Text>
        <Pressable onPress={() => setMonth((m) => addMonths(m, 1))} hitSlop={8}>
          <FontAwesome name="chevron-right" size={12} color={TEXT_SECONDARY} />
        </Pressable>
      </View>

      <View style={styles.bsum}>
        <View style={styles.bsumLeft}>
          <Text style={styles.planLabel}>计划清单</Text>
          <Text style={styles.planAmt}>
            ¥ {hasBudget ? centsToYuan(summary!.totalLimitCents) : '0.00'}
          </Text>
        </View>
        <View style={styles.bsumRight}>
          <View style={styles.brRow}>
            <Text style={styles.brKey}>结余</Text>
            <Text style={styles.brVal}>¥ {centsToYuan(balance)}</Text>
          </View>
          <Pressable
            style={[styles.brRow, styles.brRowDivider]}
            onPress={() => router.push('/trends' as Href)}
          >
            <Text style={styles.brKey}>趋势图</Text>
            <PieChart size={30} innerRadius={9} data={TREND_DONUT} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {hasBudget ? (
          <>
            <View style={styles.totalCard}>
              <Text style={styles.totalTitle}>本月总预算</Text>
              <Text style={styles.totalAmount}>
                ¥{centsToYuan(summary!.totalSpentCents)} / ¥{centsToYuan(summary!.totalLimitCents)}
              </Text>
              <View style={styles.totalBarBg}>
                <View
                  style={[
                    styles.totalBarFill,
                    {
                      width: `${Math.min(usedPct, 100)}%`,
                      backgroundColor: barColor(summary!.totalSpentCents, summary!.totalLimitCents),
                    },
                  ]}
                />
              </View>
              <View style={styles.totalMeta}>
                <Text style={styles.metaText}>已用 {usedPct}%</Text>
                <Text style={styles.metaText}>剩余 ¥{centsToYuan(Math.max(remaining, 0))}</Text>
              </View>
            </View>

            {summary!.categories.map((cat) => {
              const pct =
                cat.limitCents > 0 ? Math.min((cat.spentCents / cat.limitCents) * 100, 100) : 0;
              return (
                <View key={cat.categoryId} style={styles.catRow}>
                  <View style={styles.catIcon}>
                    <CategoryIcon id={cat.categoryIcon ?? undefined} name={cat.categoryName} size={20} />
                  </View>
                  <View style={styles.catInfo}>
                    <View style={styles.catTop}>
                      <Text style={styles.catName}>{cat.categoryName}</Text>
                      <Text style={styles.catAmt}>
                        ¥{centsToYuan(cat.spentCents)} / ¥{centsToYuan(cat.limitCents)}
                      </Text>
                    </View>
                    <View style={styles.catBarBg}>
                      <View
                        style={[
                          styles.catBarFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: barColor(cat.spentCents, cat.limitCents),
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}

            <Pressable
              style={styles.editBtn}
              onPress={() => router.push(`/budget/edit?period=${month}` as Href)}
            >
              <Text style={styles.editBtnText}>设置分类预算</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.emptyHeadline}>您还未创建预算</Text>
            <View style={styles.emptyPanel}>
              <PieChart size={128} innerRadius={40} data={BUDGET_DONUT} />
              <View style={styles.legend}>
                <Text style={styles.legendItem}>🍑 日常开销 55%</Text>
                <Text style={styles.legendItem}>💰 消费升级 30%</Text>
                <Text style={styles.legendItem}>📖 学习基金 15%</Text>
              </View>
              <Text style={styles.tagline}>有预算才能无负担的花钱</Text>
              <Pressable
                style={styles.createButton}
                onPress={() => router.push(`/budget/edit?period=${month}` as Href)}
              >
                <Text style={styles.createButtonText}>+ 创建预算</Text>
              </Pressable>
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  header: { backgroundColor: PRIMARY_GREEN, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: TEXT_PRIMARY },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 10,
    backgroundColor: PRIMARY_GREEN,
  },
  monthLabel: { fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY },
  bsum: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bsumLeft: {
    width: '46%',
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },
  planLabel: { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  planAmt: { fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY, textAlign: 'right', marginTop: 'auto' },
  bsumRight: { flex: 1 },
  brRow: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  brRowDivider: { borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  brKey: { fontSize: 12.5, color: '#555555' },
  brVal: { fontSize: 12.5, fontWeight: '600', color: TEXT_PRIMARY },
  scrollContent: { flex: 1, backgroundColor: '#FFFFFF' },
  emptyHeadline: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    paddingTop: 24,
    paddingBottom: 4,
  },
  emptyPanel: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#F5F6F7',
    borderRadius: 4,
    padding: 22,
    alignItems: 'center',
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 14 },
  legendItem: { fontSize: 12, color: TEXT_SECONDARY },
  tagline: { fontSize: 13, color: TEXT_SECONDARY, marginVertical: 16 },
  createButton: {
    alignSelf: 'stretch',
    backgroundColor: '#111111',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  totalCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  totalTitle: { fontSize: 14, color: TEXT_SECONDARY, marginBottom: 6 },
  totalAmount: { fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 12 },
  totalBarBg: { height: 8, backgroundColor: '#E8E8E8', borderRadius: 4, overflow: 'hidden' },
  totalBarFill: { height: '100%', borderRadius: 4 },
  totalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: { fontSize: 12, color: TEXT_SECONDARY },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catInfo: { flex: 1 },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, fontWeight: '500', color: TEXT_PRIMARY },
  catAmt: { fontSize: 13, color: TEXT_SECONDARY },
  catBarBg: { height: 6, backgroundColor: '#E8E8E8', borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  editBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 6,
  },
  editBtnText: { fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY },
});
