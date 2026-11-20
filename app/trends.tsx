import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryBreakdownList, type RecordsTarget } from '@/components/charts/CategoryBreakdownList';
import { MonthlyColumns } from '@/components/charts/MonthlyColumns';
import { monthTitle } from '@/src/features/charts/labels';
import { MonthStepper } from '@/components/rich/MonthStepper';
import { ScreenHeader } from '@/components/rich/ScreenHeader';
import {
  CARD_BACKGROUND,
  PAGE_BACKGROUND,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import { getMonthlyTotals, type MonthlyTotalsRow } from '@/src/features/charts/aggregations';
import { getCategoryBreakdown, type Breakdown } from '@/src/features/charts/breakdown';
import { centsToYuan } from '@/src/utils/money';
import { addMonths, currentMonth, monthStartIso, nextMonth } from '@/src/utils/month';
import { useLayoutScale, useScaledStyles } from '@/components/rich/useScaledStyles';

type Kind = 'expense' | 'income';

const WINDOW = 6;
const KIND_LABEL: Record<Kind, string> = { expense: '支出', income: '收入' };

type Loaded = { kind: Kind; month: string; monthly: MonthlyTotalsRow[]; breakdown: Breakdown };

/** Keeps the selected month inside the six-month window, moving the window only when it must. */
function windowEndFor(month: string, end: string): string {
  if (month > end) return month;
  if (month < addMonths(end, -(WINDOW - 1))) return addMonths(month, WINDOW - 1);
  return end;
}

export default function TrendsScreen() {
  const styles = useScaledStyles(baseStyles);
  const k = useLayoutScale();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [kind, setKind] = useState<Kind>('expense');
  const [month, setMonth] = useState(currentMonth());
  const [windowEnd, setWindowEnd] = useState(currentMonth());
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setFailed(false);
    try {
      const db = await getDb();
      const [monthly, breakdown] = await Promise.all([
        getMonthlyTotals(db, { monthsBack: WINDOW, endMonthInclusive: windowEnd }),
        getCategoryBreakdown(db, {
          type: kind,
          start: monthStartIso(month),
          endExclusive: monthStartIso(nextMonth(month)),
        }),
      ]);
      if (request !== requestRef.current) return;
      setLoaded({ kind, month, monthly, breakdown });
    } catch (error) {
      console.error('Failed to load trends:', error);
      if (request === requestRef.current) setFailed(true);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [kind, month, windowEnd]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        requestRef.current += 1;
      };
    }, [refresh]),
  );

  const selectMonth = useCallback((next: string) => {
    setMonth(next);
    setWindowEnd((end) => windowEndFor(next, end));
  }, []);

  const openRecords = (target: RecordsTarget) => {
    router.push({
      pathname: '/records',
      params: {
        title: target.title,
        subtitle: monthTitle(month),
        type: kind,
        start: monthStartIso(month),
        end: monthStartIso(nextMonth(month)),
        categoryId: target.categoryId,
        ...(target.subcategoryId === undefined
          ? {}
          : { subcategoryId: target.subcategoryId ?? 'none' }),
      },
    });
  };

  // The card's margins and padding (2 × 16 + 2 × 16pt) scale with the width.
  const chartWidth = Math.min(windowWidth, 430) - 64 * k;
  const breakdown = loaded?.breakdown;
  // While a new month or type loads, keep the previous render at reduced opacity.
  const stale = loading && loaded !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader title="趋势图" onBack={() => router.back()} backgroundColor={PRIMARY_GREEN} />

      <View style={styles.filters}>
        <View style={styles.kindToggle} accessibilityRole="tablist">
          {(['expense', 'income'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setKind(option)}
              style={[styles.kindButton, kind === option && styles.kindButtonActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: kind === option }}
            >
              <Text style={[styles.kindText, kind === option && styles.kindTextActive]}>
                {KIND_LABEL[option]}
              </Text>
            </Pressable>
          ))}
        </View>
        <MonthStepper
          label={monthTitle(month)}
          accessibilityLabel="趋势月份"
          onPrevious={() => selectMonth(addMonths(month, -1))}
          onNext={() => selectMonth(addMonths(month, 1))}
          variant="pill"
          labelMinWidth={96}
        />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {failed ? (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <Image source={require('../assets/images/ui/icon_warning.png')} style={styles.errorMark} accessible={false} />
            <Text style={styles.errorText}>趋势数据读取失败</Text>
            <Pressable onPress={() => void refresh()} style={styles.retryButton} accessibilityRole="button">
              <Text style={styles.retryText}>重新加载</Text>
            </Pressable>
          </View>
        ) : null}

        {loaded === null ? (
          <View style={styles.firstLoad}>
            {failed ? null : <ActivityIndicator color={PRIMARY_GREEN} />}
          </View>
        ) : (
          <View style={stale && styles.stale}>
            <View style={styles.card}>
              <MonthlyColumns
                data={loaded.monthly}
                kind={loaded.kind}
                selectedMonth={loaded.month}
                onSelect={selectMonth}
                width={chartWidth}
              />
              <Text style={styles.hint}>按住柱状图左右滑动查看各月，点按切换月份</Text>
            </View>

            <View style={[styles.card, styles.listCard]}>
              <View style={styles.listHead}>
                <Text style={styles.listTitle}>{KIND_LABEL[loaded.kind]}排行</Text>
                {breakdown && breakdown.count > 0 ? (
                  <Text style={styles.listMeta}>
                    {breakdown.count} 笔 · ¥{centsToYuan(breakdown.totalCents)}
                  </Text>
                ) : null}
              </View>
              {breakdown && breakdown.categories.length > 0 ? (
                // Remount per month and type so unfolded categories don't carry over.
                <CategoryBreakdownList
                  key={`${loaded.kind}-${loaded.month}`}
                  breakdown={breakdown}
                  onOpenRecords={openRecords}
                />
              ) : (
                <View style={styles.empty}>
                  <Image
                    source={require('../assets/images/budget/icon_trend_chart.png')}
                    style={styles.emptyArt}
                    accessible={false}
                  />
                  <Text style={styles.emptyText}>
                    {monthTitle(loaded.month)}还没有{KIND_LABEL[loaded.kind]}记录
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  // One filter row above everything it scopes.
  filters: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BACKGROUND,
  },
  kindToggle: { flexDirection: 'row', gap: 12 },
  // The add-entry type pills.
  kindButton: {
    width: 54,
    height: 24.7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12.35,
    borderWidth: 2 / 3,
    borderColor: '#F6F7F8',
  },
  kindButtonActive: { backgroundColor: '#F6F7F8' },
  kindText: { fontSize: 13, color: '#AAAAAA' },
  kindTextActive: { color: TEXT_PRIMARY },
  scroll: { flex: 1, backgroundColor: PAGE_BACKGROUND },
  scrollContent: { paddingTop: 12, paddingBottom: 40 },
  stale: { opacity: 0.5 },
  firstLoad: { paddingVertical: 80, alignItems: 'center' },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: CARD_BACKGROUND,
  },
  hint: { marginTop: 8, fontSize: 11, lineHeight: 15, color: TEXT_SECONDARY, textAlign: 'center' },
  listCard: { paddingHorizontal: 0, paddingBottom: 8 },
  listHead: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  listTitle: { fontSize: 15, fontWeight: '500', color: TEXT_PRIMARY },
  listMeta: { fontSize: 12, color: TEXT_SECONDARY, fontVariant: ['tabular-nums'] },
  empty: { paddingTop: 12, paddingBottom: 28, alignItems: 'center', gap: 14 },
  emptyArt: { width: 218, height: 98 },
  emptyText: { fontSize: 13, color: TEXT_SECONDARY },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#FFF6E5',
  },
  errorMark: { width: 16, height: 16 },
  errorText: { flex: 1, fontSize: 13, color: TEXT_PRIMARY },
  retryButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, backgroundColor: TEXT_PRIMARY },
  retryText: { fontSize: 12, color: CARD_BACKGROUND },
});
