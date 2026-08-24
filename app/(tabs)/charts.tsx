import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Svg, { Path } from 'react-native-svg';

import { CategoryIcon } from '@/components/CategoryIcon';
import { MonthStepper, ProgressBar } from '@/components/rich';
import { Text, View } from '@/components/Themed';
import { EXPENSE_RED, PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';
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

function monthLabel(period: string): string {
  const [year, month] = period.split('-');
  const now = new Date();
  return Number(year) === now.getFullYear() ? `${Number(month)}月` : `${year}年${Number(month)}月`;
}

function progressColor(percent: number): string {
  if (percent > 100) return EXPENSE_RED;
  if (percent >= 80) return '#E2A33A';
  return PRIMARY_GREEN;
}

function BudgetExampleDonut() {
  return (
    <View style={styles.exampleChart}>
      <View style={styles.exampleDonut}>
        <PieChart size={124} innerRadius={38} data={BUDGET_DONUT} />
      </View>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject} viewBox="0 0 280 150">
        <Path d="M89 77 H76 L66 87" fill="none" stroke="#1A1A1A" strokeWidth="1" />
        <Path d="M177 43 H191 L201 33" fill="none" stroke="#1A1A1A" strokeWidth="1" />
        <Path d="M188 99 H201 L211 109" fill="none" stroke="#1A1A1A" strokeWidth="1" />
      </Svg>
      <View style={[styles.exampleLabel, styles.exampleLabelLeft]}>
        <Text style={styles.exampleName}>🍑日常开销</Text>
        <Text style={styles.examplePercent}>55%</Text>
      </View>
      <View style={[styles.exampleLabel, styles.exampleLabelTopRight]}>
        <Text style={styles.exampleName}>📖学习基金</Text>
        <Text style={styles.examplePercent}>15%</Text>
      </View>
      <View style={[styles.exampleLabel, styles.exampleLabelBottomRight]}>
        <Text style={styles.exampleName}>💰消费升级</Text>
        <Text style={styles.examplePercent}>30%</Text>
      </View>
    </View>
  );
}

export default function BudgetScreen() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const [balance, setBalance] = useState(0);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const loadRequestRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setLoadState('loading');
    setLoadError('');
    setSummary(null);
    setBalance(0);
    setExpandedCategoryId(null);
    try {
      const db = await getDb();
      const [totals, budget] = await Promise.all([
        getMonthlyTotals(db, { monthsBack: 1, endMonthInclusive: month }),
        getBudgetSummary(db, month),
      ]);
      if (requestId !== loadRequestRef.current) return;
      const current = totals[totals.length - 1];
      setBalance((current?.incomeCents ?? 0) - (current?.expenseCents ?? 0));
      setSummary(budget);
      setLoadState('ready');
    } catch (error) {
      console.error('Failed to load budget summary:', error);
      if (requestId !== loadRequestRef.current) return;
      setLoadError('请重试；也可以切换月份继续查看。');
      setLoadState('error');
    }
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        loadRequestRef.current += 1;
      };
    }, [refresh]),
  );

  const hasBudget = Boolean(summary && (summary.totalLimitCents > 0 || summary.categories.length));
  const totalLimit = summary?.totalLimitCents ?? 0;
  const totalSpent = summary?.totalSpentCents ?? 0;
  const totalPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const remaining = totalLimit - totalSpent;

  function changeMonth(delta: number) {
    loadRequestRef.current += 1;
    setLoadState('loading');
    setLoadError('');
    setSummary(null);
    setBalance(0);
    setExpandedCategoryId(null);
    setMonth((value) => addMonths(value, delta));
  }

  function openEditor() {
    router.push({ pathname: '/budget/edit', params: { period: month } });
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>预算/计划</Text>
      </View>

      <View style={styles.summaryCard}>
        <Pressable style={styles.summaryLeft} onPress={openEditor}>
          <Text style={styles.planLabel}>计划清单</Text>
          <Text style={styles.planAmount}>
            ¥ {loadState === 'ready' ? centsToYuan(totalLimit) : '—'}
          </Text>
        </Pressable>
        <View style={styles.summaryRight}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>结余</Text>
            <Text style={styles.summaryValue}>
              ¥ {loadState === 'ready' ? centsToYuan(balance) : '—'}
            </Text>
          </View>
          <Pressable
            style={[styles.summaryRow, styles.summaryDivider]}
            onPress={() => router.push('/trends')}
          >
            <Text style={styles.summaryKey}>趋势图</Text>
            <PieChart size={30} innerRadius={9} data={TREND_DONUT} />
          </Pressable>
        </View>
      </View>

      <MonthStepper
        label={monthLabel(month)}
        onPrevious={() => changeMonth(-1)}
        onNext={() => changeMonth(1)}
        style={styles.monthRow}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loadState === 'loading' ? (
          <View style={styles.statePanel}>
            <ActivityIndicator size="small" color={PRIMARY_GREEN} />
            <Text style={styles.stateTitle}>正在载入{monthLabel(month)}预算</Text>
            <Text style={styles.stateBody}>正在核对预算与本月支出</Text>
          </View>
        ) : loadState === 'error' ? (
          <View style={styles.statePanel}>
            <View style={styles.stateMark}>
              <FontAwesome name="exclamation" size={14} color={TEXT_PRIMARY} />
            </View>
            <Text style={styles.stateTitle}>没有载入{monthLabel(month)}预算</Text>
            <Text style={styles.stateBody}>{loadError}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`重新载入${monthLabel(month)}预算`}
              onPress={() => void refresh()}
              style={styles.retryButton}
            >
              <FontAwesome name="refresh" size={12} color="#FFFFFF" />
              <Text style={styles.retryText}>重新载入</Text>
            </Pressable>
          </View>
        ) : hasBudget && summary ? (
          <>
            <View style={styles.overallCard}>
              <Text style={styles.cardLabel}>本月总预算</Text>
              <View style={styles.totalLine}>
                <Text style={styles.totalSpent}>¥{centsToYuan(totalSpent)}</Text>
                <Text style={styles.totalLimit}> / ¥{centsToYuan(totalLimit)}</Text>
              </View>
              <ProgressBar
                percent={totalPercent}
                color={progressColor(totalPercent)}
                style={styles.progressTrack}
              />
              <View style={styles.progressMeta}>
                <Text style={styles.metaText}>已用 {totalPercent}%</Text>
                <Text style={[styles.metaText, remaining < 0 && styles.overText]}>
                  {remaining >= 0
                    ? `剩余 ¥${centsToYuan(remaining)}`
                    : `超支 ¥${centsToYuan(Math.abs(remaining))}`}
                </Text>
              </View>
            </View>

            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.cardLabel}>分类预算</Text>
                <Pressable onPress={openEditor} hitSlop={8}>
                  <Text style={styles.editText}>编辑</Text>
                </Pressable>
              </View>
              {summary.categories.map((category, index) => {
                const percent =
                  category.limitCents > 0
                    ? Math.round((category.spentCents / category.limitCents) * 100)
                    : 0;
                return (
                  <View
                    key={category.categoryId}
                    style={[styles.categoryRow, index > 0 && styles.categoryRowDivider]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${category.categoryName}，已用 ${percent}%`}
                      accessibilityState={{ expanded: expandedCategoryId === category.categoryId }}
                      onPress={() =>
                        setExpandedCategoryId((current) =>
                          current === category.categoryId ? null : category.categoryId,
                        )
                      }
                      style={styles.categoryTopLine}
                    >
                      <View style={styles.categoryIcon}>
                        <CategoryIcon
                          id={category.categoryIcon ?? undefined}
                          name={category.categoryName}
                          size={22}
                        />
                      </View>
                      <View style={styles.categoryCopy}>
                        <Text style={styles.categoryName}>{category.categoryName}</Text>
                        <Text style={styles.categoryMeta}>
                          {category.subcategories.length
                            ? `${category.subcategories.length} 项子分类额度`
                            : '查看分类进度'}
                        </Text>
                      </View>
                      <Text style={[styles.categoryAmount, percent > 100 && styles.overText]}>
                        ¥{centsToYuan(category.spentCents)} / ¥{centsToYuan(category.limitCents)}
                      </Text>
                      <FontAwesome
                        name={
                          expandedCategoryId === category.categoryId
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={10}
                        color={TEXT_SECONDARY}
                        style={styles.categoryChevron}
                      />
                    </Pressable>
                    <ProgressBar
                      percent={percent}
                      color={progressColor(percent)}
                      height={5}
                      style={styles.categoryTrack}
                    />

                    {expandedCategoryId === category.categoryId ? (
                      <View style={styles.subcategoryPanel}>
                        <View style={styles.subcategoryRail} />
                        {category.subcategories.map((subcategory) => {
                          const childPercent =
                            subcategory.limitCents > 0
                              ? Math.round(
                                  (subcategory.spentCents / subcategory.limitCents) * 100,
                                )
                              : 0;
                          return (
                            <View key={subcategory.subcategoryId} style={styles.subcategoryRow}>
                              <View style={styles.subcategoryNode} />
                              <View style={styles.subcategoryCopy}>
                                <Text style={styles.subcategoryName}>
                                  {subcategory.subcategoryName}
                                </Text>
                                <ProgressBar
                                  percent={childPercent}
                                  color={progressColor(childPercent)}
                                  height={3}
                                  style={styles.subcategoryTrack}
                                />
                              </View>
                              <Text
                                style={[
                                  styles.subcategoryAmount,
                                  childPercent > 100 && styles.overText,
                                ]}
                              >
                                ¥{centsToYuan(subcategory.spentCents)} / ¥
                                {centsToYuan(subcategory.limitCents)}
                              </Text>
                            </View>
                          );
                        })}
                        <View style={styles.unallocatedRow}>
                          <Text style={styles.unallocatedLabel}>主分类内未分配额度</Text>
                          <Text style={styles.unallocatedValue}>
                            ¥{centsToYuan(category.unallocatedLimitCents)}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
              {!summary.categories.length && (
                <Text style={styles.noCategories}>尚未设置分类预算</Text>
              )}
            </View>

            <Pressable style={styles.setBudgetButton} onPress={openEditor}>
              <Text style={styles.setBudgetText}>设置分类预算</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.emptyHeadline}>您还未创建预算</Text>
            <View style={styles.emptyPanel}>
              <BudgetExampleDonut />
              <Text style={styles.tagline}>有预算才能无负担的花钱</Text>
              <Pressable style={styles.createButton} onPress={openEditor}>
                <Text style={styles.createButtonText}>+ 创建预算</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  header: { minHeight: 60, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: TEXT_PRIMARY },
  summaryCard: {
    minHeight: 146,
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
  },
  summaryLeft: {
    width: '46%',
    padding: 16,
    justifyContent: 'space-between',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: PRIMARY_GREEN,
  },
  planLabel: { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  planAmount: { fontSize: 13, fontWeight: '600', color: TEXT_PRIMARY, textAlign: 'right' },
  summaryRight: { flex: 1 },
  summaryRow: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  summaryDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D8D8D8' },
  summaryKey: { fontSize: 12.5, color: '#555555' },
  summaryValue: { fontSize: 12.5, fontWeight: '500', color: TEXT_PRIMARY },
  monthRow: {
    height: 40,
    backgroundColor: PRIMARY_GREEN,
  },
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, paddingVertical: 14, paddingBottom: 40 },
  statePanel: {
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 26,
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: '#F5F7F5',
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_GREEN,
  },
  stateMark: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#DFF2EA',
  },
  stateTitle: { marginTop: 13, fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  stateBody: {
    marginTop: 5,
    fontSize: 11.5,
    lineHeight: 18,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 22,
    backgroundColor: '#101A17',
  },
  retryText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  overallCard: { marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 3, padding: 16 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  totalLine: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  totalSpent: { fontSize: 22, fontWeight: '600', color: TEXT_PRIMARY },
  totalLimit: { fontSize: 12, color: TEXT_SECONDARY },
  progressTrack: { marginTop: 14 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  metaText: { fontSize: 10.5, color: TEXT_SECONDARY },
  overText: { color: EXPENSE_RED },
  categoryCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 3 },
  categoryHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D8D8D8',
  },
  editText: { color: PRIMARY_GREEN, fontSize: 12, fontWeight: '600' },
  categoryRow: { paddingHorizontal: 16, paddingVertical: 12 },
  categoryRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5E5' },
  categoryTopLine: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F4',
    marginRight: 10,
  },
  categoryCopy: { flex: 1 },
  categoryName: { fontSize: 13, fontWeight: '600', color: TEXT_PRIMARY },
  categoryMeta: { marginTop: 2, fontSize: 9.5, color: TEXT_SECONDARY },
  categoryAmount: { fontSize: 11, color: TEXT_SECONDARY },
  categoryChevron: { marginLeft: 8 },
  categoryTrack: { marginTop: 9, marginLeft: 42 },
  subcategoryPanel: {
    position: 'relative',
    marginTop: 12,
    marginLeft: 42,
    paddingLeft: 18,
    paddingVertical: 7,
    paddingRight: 2,
    backgroundColor: '#F3F8F5',
  },
  subcategoryRail: {
    position: 'absolute',
    left: 7,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: PRIMARY_GREEN,
  },
  subcategoryRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center' },
  subcategoryNode: {
    position: 'absolute',
    left: -15,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: PRIMARY_GREEN,
    backgroundColor: '#FFFFFF',
  },
  subcategoryCopy: { flex: 1, marginRight: 12 },
  subcategoryName: { fontSize: 11, color: TEXT_PRIMARY },
  subcategoryTrack: { marginTop: 5 },
  subcategoryAmount: { fontSize: 9.5, color: TEXT_SECONDARY, fontVariant: ['tabular-nums'] },
  unallocatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C9D7D0',
  },
  unallocatedLabel: { fontSize: 10, color: TEXT_SECONDARY },
  unallocatedValue: { fontSize: 10, fontWeight: '600', color: TEXT_PRIMARY },
  noCategories: { padding: 20, textAlign: 'center', fontSize: 12, color: TEXT_SECONDARY },
  setBudgetButton: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#111111',
    borderRadius: 6,
    paddingVertical: 13,
    alignItems: 'center',
  },
  setBudgetText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  emptyHeadline: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    paddingTop: 40,
    paddingBottom: 4,
  },
  emptyPanel: {
    marginHorizontal: 24,
    marginTop: 14,
    backgroundColor: '#F5F6F7',
    borderRadius: 0,
    padding: 22,
    alignItems: 'center',
  },
  exampleChart: { width: 280, height: 150, backgroundColor: 'transparent' },
  exampleDonut: { position: 'absolute', left: 78, top: 13, backgroundColor: 'transparent' },
  exampleLabel: { position: 'absolute', backgroundColor: 'transparent' },
  exampleLabelLeft: { left: 0, top: 70, alignItems: 'flex-start' },
  exampleLabelTopRight: { right: 0, top: 12, alignItems: 'flex-start' },
  exampleLabelBottomRight: { right: 0, top: 98, alignItems: 'flex-start' },
  exampleName: { fontSize: 11, color: TEXT_PRIMARY },
  examplePercent: { marginTop: 2, fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY },
  tagline: { fontSize: 13, color: TEXT_SECONDARY, marginVertical: 16 },
  createButton: {
    alignSelf: 'stretch',
    backgroundColor: '#111111',
    borderRadius: 0,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
