import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import { MonthStepper } from '@/components/rich/MonthStepper';
import { ScreenHeader } from '@/components/rich/ScreenHeader';
import {
  ACCESSIBLE_GREEN,
  BORDER_COLOR,
  CARD_BACKGROUND,
  CHART_BLUE,
  CHART_TEAL,
  CHART_VIOLET,
  CONTROL_BACKGROUND,
  INCOME_TEXT_GREEN,
  PAGE_BACKGROUND,
  PRIMARY_GREEN,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  WARNING_AMBER,
} from '@/constants/Colors';
import { RICH_RADIUS, RICH_SIZE, RICH_SPACING, RICH_TYPE } from '@/constants/Design';
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

type LoadState = 'loading' | 'ready' | 'error';

const CHART_PALETTE = [
  CHART_TEAL,
  CHART_BLUE,
  CHART_VIOLET,
  WARNING_AMBER,
  PRIMARY_GREEN,
  INCOME_TEXT_GREEN,
];

function formatMonthCN(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  return Number.isFinite(year) && Number.isFinite(month)
    ? `${year}年${month}月`
    : monthStr;
}

function formatMonthTickCN(monthStr: string): string {
  const month = Number(monthStr.split('-')[1]);
  return Number.isFinite(month) ? `${month}月` : monthStr;
}

export default function TrendsScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const requestIdRef = useRef(0);
  const [month, setMonth] = useState(currentMonth());
  const [categories, setCategories] = useState<CategoryTotal[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<SubcategoryTotal[]>([]);
  const [monthly, setMonthly] = useState<
    Array<{ month: string; expenseCents: number; incomeCents: number }>
  >([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoadState('loading');
    setLoadError(null);

    try {
      const db = await getDb();
      const [nextCategories, nextMonthly, nextSubcategories] = await Promise.all([
        getExpenseCategoryTotalsForMonth(db, month),
        getMonthlyTotals(db, { monthsBack: 6, endMonthInclusive: month }),
        selectedCategoryId
          ? getExpenseSubcategoryTotalsForMonth(db, month, selectedCategoryId)
          : Promise.resolve([] as SubcategoryTotal[]),
      ]);

      if (requestId !== requestIdRef.current) return;

      const selectedCategoryStillExists = selectedCategoryId
        ? nextCategories.some((category) => category.categoryId === selectedCategoryId)
        : false;

      setCategories(nextCategories);
      setMonthly(nextMonthly);
      if (selectedCategoryId && !selectedCategoryStillExists) {
        setSelectedCategoryId(null);
        setSubcategories([]);
      } else {
        setSubcategories(nextSubcategories);
      }
      setLoadState('ready');
    } catch {
      if (requestId !== requestIdRef.current) return;
      setLoadError('趋势数据读取失败，请重新加载。');
      setLoadState('error');
    }
  }, [month, selectedCategoryId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        requestIdRef.current += 1;
      };
    }, [refresh]),
  );

  const appWidth = Math.min(windowWidth, 430);
  const isCompact = appWidth < 370;
  const chartWidth = Math.min(326, Math.max(0, appWidth - 64));
  const pieSize = isCompact ? 156 : 144;

  const totalExpense = useMemo(
    () => categories.reduce((acc, category) => acc + category.totalCents, 0),
    [categories],
  );
  const subTotal = useMemo(
    () => subcategories.reduce((acc, subcategory) => acc + subcategory.totalCents, 0),
    [subcategories],
  );
  const hasMonthlyData = useMemo(
    () => monthly.some((item) => item.expenseCents > 0 || item.incomeCents > 0),
    [monthly],
  );

  const pieData = useMemo(() => {
    const data = categories.map((category, index) => ({
      value: category.totalCents,
      color: CHART_PALETTE[index % CHART_PALETTE.length],
    }));

    // A single 360-degree SVG arc has identical start/end points and collapses.
    // Two same-color halves preserve the visual while keeping the total unchanged.
    if (data.length === 1 && data[0].value > 0) {
      return [
        { ...data[0], value: data[0].value / 2 },
        { ...data[0], value: data[0].value / 2 },
      ];
    }

    return data;
  }, [categories]);

  const selectedCategoryName = useMemo(
    () =>
      categories.find((category) => category.categoryId === selectedCategoryId)?.categoryName ??
      null,
    [categories, selectedCategoryId],
  );

  const changeMonth = useCallback((offset: number) => {
    requestIdRef.current += 1;
    setLoadState('loading');
    setLoadError(null);
    setCategories([]);
    setSubcategories([]);
    setMonthly([]);
    setMonth((current) => addMonths(current, offset));
  }, []);

  const toggleCategory = useCallback(
    (categoryId: string) => {
      requestIdRef.current += 1;
      setLoadState('loading');
      setLoadError(null);
      setSubcategories([]);
      setSelectedCategoryId(selectedCategoryId === categoryId ? null : categoryId);
    },
    [selectedCategoryId],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader title="趋势图" onBack={() => router.back()} backgroundColor={PRIMARY_GREEN} />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <MonthStepper
          label={formatMonthCN(month)}
          accessibilityLabel="趋势月份"
          onPrevious={() => changeMonth(-1)}
          onNext={() => changeMonth(1)}
          variant="pill"
          style={styles.monthStepper}
        />

        {loadError ? (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <View style={styles.errorCopy}>
              <FontAwesome name="exclamation-circle" size={15} color={TEXT_PRIMARY} />
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="重新加载趋势数据"
              onPress={() => void refresh()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.controlPressed]}
            >
              <Text style={styles.retryText}>重新加载</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeadingRow}>
            <View style={styles.cardHeadingCopy}>
              <Text style={styles.cardTitle}>支出构成</Text>
              <Text style={styles.cardSubtitle}>按分类查看本月的钱花在了哪里</Text>
            </View>
            {loadState === 'loading' && categories.length > 0 ? (
              <ActivityIndicator
                accessibilityLabel="正在更新支出构成"
                size="small"
                color={ACCESSIBLE_GREEN}
              />
            ) : null}
          </View>

          {loadState === 'loading' && categories.length === 0 ? (
            <View style={styles.stateBlock}>
              <ActivityIndicator size="small" color={ACCESSIBLE_GREEN} />
              <Text style={styles.stateTitle}>正在读取支出构成…</Text>
            </View>
          ) : loadState === 'error' && categories.length === 0 ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateTitle}>暂时无法显示支出构成</Text>
              <Text style={styles.stateDetail}>使用上方按钮重新加载。</Text>
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.stateBlock}>
              <View style={styles.emptyIcon}>
                <FontAwesome name="pie-chart" size={22} color={TEXT_MUTED} />
              </View>
              <Text style={styles.stateTitle}>本月还没有支出</Text>
              <Text style={styles.stateDetail}>记下一笔支出后，这里会显示分类占比。</Text>
            </View>
          ) : (
            <>
              <View style={[styles.pieRow, isCompact && styles.pieRowCompact]}>
                <View
                  accessible
                  accessibilityLabel={`本月总支出 ¥${centsToYuan(totalExpense)}`}
                  style={[styles.pieWrap, { width: pieSize, height: pieSize }]}
                >
                  <PieChart size={pieSize} innerRadius={pieSize * 0.34} data={pieData} />
                  <View pointerEvents="none" style={styles.pieCenter}>
                    <Text style={styles.pieCenterLabel}>本月支出</Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={styles.pieCenterAmount}>
                      ¥{centsToYuan(totalExpense)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.pieLegend, isCompact && styles.pieLegendCompact]}>
                  {categories.map((category, index) => {
                    const percentage =
                      totalExpense > 0
                        ? Math.round((category.totalCents / totalExpense) * 100)
                        : 0;
                    const selected = category.categoryId === selectedCategoryId;
                    return (
                      <Pressable
                        key={category.categoryId}
                        onPress={() => toggleCategory(category.categoryId)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${category.categoryName}，¥${centsToYuan(
                          category.totalCents,
                        )}，占支出 ${percentage}%`}
                        style={({ pressed }) => [
                          styles.legendRow,
                          selected && styles.legendRowActive,
                          pressed && styles.controlPressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.swatch,
                            { backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] },
                          ]}
                        />
                        <View style={styles.legendCopy}>
                          <View style={styles.legendTopLine}>
                            <Text numberOfLines={1} style={styles.legendName}>
                              {category.categoryName}
                            </Text>
                            <Text style={styles.legendPercent}>{percentage}%</Text>
                          </View>
                          <Text style={styles.legendAmount}>
                            ¥{centsToYuan(category.totalCents)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <Text style={styles.tapHint}>选择一个分类，可继续查看子分类明细</Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeadingRow}>
            <View style={styles.cardHeadingCopy}>
              <Text style={styles.cardTitle}>月度趋势</Text>
              <Text style={styles.cardSubtitle}>近 6 个月的收入与支出变化</Text>
            </View>
            {loadState === 'loading' && monthly.length > 0 ? (
              <ActivityIndicator
                accessibilityLabel="正在更新月度趋势"
                size="small"
                color={ACCESSIBLE_GREEN}
              />
            ) : null}
          </View>

          {loadState === 'loading' && monthly.length === 0 ? (
            <View style={styles.stateBlock}>
              <ActivityIndicator size="small" color={ACCESSIBLE_GREEN} />
              <Text style={styles.stateTitle}>正在读取月度趋势…</Text>
            </View>
          ) : loadState === 'error' && monthly.length === 0 ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateTitle}>暂时无法显示月度趋势</Text>
              <Text style={styles.stateDetail}>使用上方按钮重新加载。</Text>
            </View>
          ) : !hasMonthlyData ? (
            <View style={styles.stateBlock}>
              <View style={styles.emptyIcon}>
                <FontAwesome name="line-chart" size={21} color={TEXT_MUTED} />
              </View>
              <Text style={styles.stateTitle}>还没有可比较的收支</Text>
              <Text style={styles.stateDetail}>持续记账后，就能看到每个月的变化。</Text>
            </View>
          ) : (
            <>
              <View style={[styles.chartFrame, { width: chartWidth }]}>
                <View pointerEvents="none" style={styles.chartRules}>
                  {[0, 1, 2, 3].map((rule) => (
                    <View key={rule} style={styles.chartRule} />
                  ))}
                </View>
                <LineChart
                  width={chartWidth}
                  height={132}
                  series={[
                    {
                      values: monthly.map((item) => item.expenseCents),
                      color: CHART_VIOLET,
                    },
                    {
                      values: monthly.map((item) => item.incomeCents),
                      color: INCOME_TEXT_GREEN,
                    },
                  ]}
                />
              </View>
              <View style={[styles.monthLabels, { width: chartWidth }]}>
                {monthly.map((item) => (
                  <Text key={item.month} style={styles.monthTick}>
                    {formatMonthTickCN(item.month)}
                  </Text>
                ))}
              </View>
              <View style={styles.legendIndicators}>
                <View style={styles.legendIndicator}>
                  <View style={[styles.legendDot, { backgroundColor: CHART_VIOLET }]} />
                  <Text style={styles.legendIndicatorText}>支出</Text>
                </View>
                <View style={styles.legendIndicator}>
                  <View style={[styles.legendDot, { backgroundColor: INCOME_TEXT_GREEN }]} />
                  <Text style={styles.legendIndicatorText}>收入</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {selectedCategoryId ? (
          <View style={styles.card}>
            <View style={styles.cardHeadingRow}>
              <View style={styles.cardHeadingCopy}>
                <Text style={styles.cardTitle}>子分类明细</Text>
                <Text style={styles.cardSubtitle}>
                  {selectedCategoryName ?? '已选分类'}
                  {loadState === 'ready' ? ` · ¥${centsToYuan(subTotal)}` : ''}
                </Text>
              </View>
            </View>

            {loadState === 'loading' ? (
              <View style={styles.stateBlockCompact}>
                <ActivityIndicator size="small" color={ACCESSIBLE_GREEN} />
                <Text style={styles.stateTitle}>正在读取分类明细…</Text>
              </View>
            ) : loadState === 'error' && subcategories.length === 0 ? (
              <View style={styles.stateBlockCompact}>
                <Text style={styles.stateTitle}>分类明细读取失败</Text>
                <Text style={styles.stateDetail}>使用上方按钮重新加载。</Text>
              </View>
            ) : subcategories.length === 0 ? (
              <View style={styles.stateBlockCompact}>
                <Text style={styles.stateTitle}>这个分类还没有子分类记录</Text>
              </View>
            ) : (
              <View style={styles.subList}>
                {subcategories.map((subcategory, index) => {
                  const percentage =
                    subTotal > 0
                      ? Math.round((subcategory.totalCents / subTotal) * 100)
                      : 0;
                  return (
                    <View
                      key={subcategory.subcategoryId ?? 'none'}
                      accessible
                      accessibilityLabel={`${subcategory.subcategoryName ?? '未细分'}，¥${centsToYuan(
                        subcategory.totalCents,
                      )}，${percentage}%`}
                      style={styles.subBarRow}
                    >
                      <View style={styles.subBarHeader}>
                        <Text numberOfLines={1} style={styles.subName}>
                          {subcategory.subcategoryName ?? '未细分'}
                        </Text>
                        <Text style={styles.subAmount}>
                          ¥{centsToYuan(subcategory.totalCents)} · {percentage}%
                        </Text>
                      </View>
                      <View style={styles.subBarTrack}>
                        <View
                          style={[
                            styles.subBarFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length],
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: PAGE_BACKGROUND,
  },
  scrollContentContainer: {
    paddingTop: RICH_SPACING.sm,
    paddingBottom: RICH_SPACING.xl,
  },
  monthStepper: {
    marginBottom: RICH_SPACING.sm,
  },
  errorBanner: {
    minHeight: 56,
    marginHorizontal: RICH_SPACING.md,
    marginBottom: RICH_SPACING.sm,
    paddingLeft: RICH_SPACING.sm,
    paddingRight: RICH_SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RICH_SPACING.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: WARNING_AMBER,
    borderRadius: RICH_RADIUS.control,
    backgroundColor: `${WARNING_AMBER}20`,
  },
  errorCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RICH_SPACING.xs,
    backgroundColor: 'transparent',
  },
  errorText: {
    flex: 1,
    ...RICH_TYPE.label,
    color: TEXT_PRIMARY,
  },
  retryButton: {
    minWidth: 76,
    minHeight: RICH_SIZE.minimumTouchTarget,
    paddingHorizontal: RICH_SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RICH_RADIUS.control,
    backgroundColor: TEXT_PRIMARY,
  },
  retryText: {
    ...RICH_TYPE.label,
    fontWeight: '600',
    color: CARD_BACKGROUND,
  },
  card: {
    marginHorizontal: RICH_SPACING.md,
    marginBottom: RICH_SPACING.sm,
    padding: RICH_SPACING.md,
    gap: RICH_SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER_COLOR,
    borderRadius: RICH_RADIUS.card,
    backgroundColor: CARD_BACKGROUND,
  },
  cardHeadingRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: RICH_SPACING.sm,
    backgroundColor: 'transparent',
  },
  cardHeadingCopy: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    ...RICH_TYPE.sectionTitle,
    color: TEXT_PRIMARY,
  },
  cardSubtitle: {
    marginTop: 3,
    ...RICH_TYPE.label,
    color: TEXT_SECONDARY,
  },
  stateBlock: {
    minHeight: 152,
    paddingVertical: RICH_SPACING.xl,
    paddingHorizontal: RICH_SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: RICH_SPACING.xs,
    backgroundColor: 'transparent',
  },
  stateBlockCompact: {
    minHeight: 96,
    paddingVertical: RICH_SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: RICH_SPACING.xs,
    backgroundColor: 'transparent',
  },
  emptyIcon: {
    width: 44,
    height: 44,
    marginBottom: RICH_SPACING.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RICH_RADIUS.pill,
    backgroundColor: CONTROL_BACKGROUND,
  },
  stateTitle: {
    ...RICH_TYPE.body,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  stateDetail: {
    ...RICH_TYPE.label,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  pieRow: {
    marginTop: RICH_SPACING.xs,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: RICH_SPACING.md,
    backgroundColor: 'transparent',
  },
  pieRowCompact: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  pieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pieCenter: {
    position: 'absolute',
    left: '21%',
    right: '21%',
    top: '34%',
    bottom: '34%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pieCenterLabel: {
    ...RICH_TYPE.caption,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  pieCenterAmount: {
    width: '100%',
    marginTop: 2,
    fontSize: 15,
    lineHeight: 18,
    ...RICH_TYPE.amount,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  pieLegend: {
    flex: 1,
    gap: RICH_SPACING.xs,
    backgroundColor: 'transparent',
  },
  pieLegendCompact: {
    width: '100%',
  },
  legendRow: {
    minHeight: RICH_SIZE.minimumTouchTarget,
    paddingVertical: 5,
    paddingHorizontal: RICH_SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RICH_SPACING.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    borderRadius: RICH_RADIUS.control,
    backgroundColor: PAGE_BACKGROUND,
  },
  legendRowActive: {
    borderColor: ACCESSIBLE_GREEN,
    backgroundColor: `${PRIMARY_GREEN}20`,
  },
  controlPressed: {
    opacity: 0.72,
  },
  swatch: {
    width: 10,
    height: 28,
    borderRadius: RICH_RADIUS.pill,
  },
  legendCopy: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
  },
  legendTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: RICH_SPACING.xs,
    backgroundColor: 'transparent',
  },
  legendName: {
    flex: 1,
    ...RICH_TYPE.body,
    fontWeight: '500',
    color: TEXT_PRIMARY,
  },
  legendPercent: {
    ...RICH_TYPE.label,
    fontVariant: ['tabular-nums'],
    color: TEXT_SECONDARY,
  },
  legendAmount: {
    ...RICH_TYPE.caption,
    fontVariant: ['tabular-nums'],
    color: TEXT_SECONDARY,
  },
  tapHint: {
    marginTop: RICH_SPACING.xxs,
    ...RICH_TYPE.label,
    color: ACCESSIBLE_GREEN,
    textAlign: 'center',
  },
  chartFrame: {
    height: 132,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  chartRules: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingVertical: RICH_SPACING.xs,
    backgroundColor: 'transparent',
  },
  chartRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER_COLOR,
  },
  monthLabels: {
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  monthTick: {
    ...RICH_TYPE.caption,
    color: TEXT_SECONDARY,
  },
  legendIndicators: {
    minHeight: RICH_SIZE.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RICH_SPACING.xl,
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
    borderRadius: RICH_RADIUS.pill,
  },
  legendIndicatorText: {
    ...RICH_TYPE.label,
    color: TEXT_SECONDARY,
  },
  subList: {
    marginTop: RICH_SPACING.xxs,
    backgroundColor: 'transparent',
  },
  subBarRow: {
    minHeight: RICH_SIZE.minimumTouchTarget,
    marginBottom: RICH_SPACING.sm,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  subBarHeader: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: RICH_SPACING.sm,
    backgroundColor: 'transparent',
  },
  subName: {
    flex: 1,
    ...RICH_TYPE.body,
    color: TEXT_PRIMARY,
  },
  subAmount: {
    ...RICH_TYPE.body,
    ...RICH_TYPE.amount,
    color: TEXT_PRIMARY,
  },
  subBarTrack: {
    height: 7,
    overflow: 'hidden',
    borderRadius: RICH_RADIUS.pill,
    backgroundColor: CONTROL_BACKGROUND,
  },
  subBarFill: {
    height: 7,
    borderRadius: RICH_RADIUS.pill,
  },
});
