import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KIND_BADGE, KIND_LABEL, budgetProgressColor } from '@/components/budget/budgetVisuals';
import { CategoryBreakdownList, type RecordsTarget } from '@/components/charts/CategoryBreakdownList';
import { monthTitle } from '@/src/features/charts/labels';
import { ProgressBar } from '@/components/rich';
import { LedgerDays, groupLedgerByDay } from '@/components/rich/LedgerList';
import { MonthStepper } from '@/components/rich/MonthStepper';
import { ScreenHeader } from '@/components/rich/ScreenHeader';
import {
  CARD_BACKGROUND,
  CATEGORY_FRAME_BACKGROUND,
  EXPENSE_RED,
  PAGE_BACKGROUND,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { RICH_NUMERAL_FONT } from '@/constants/Design';
import { getDb } from '@/src/db/db';
import { getEnvelopeSummary } from '@/src/db/repo/envelopes';
import { listTransactions, type TransactionListItem } from '@/src/db/repo/transactions';
import type { BudgetEnvelopeSummary } from '@/src/domain/types';
import { envelopeUsedPercent } from '@/src/features/budgets/envelopeForm';
import { getCategoryBreakdown, type Breakdown } from '@/src/features/charts/breakdown';
import { centsToYuan } from '@/src/utils/money';
import { addMonths, currentMonth, monthStartIso, nextMonth } from '@/src/utils/month';

type Loaded = {
  summary: BudgetEnvelopeSummary;
  breakdown: Breakdown;
  records: TransactionListItem[];
};

/**
 * A budget's month (monthly budgets) or lifetime (special budgets): how much is left, which
 * categories and subcategories the assigned expenses went to, and the records themselves.
 */
export default function BudgetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const thisMonth = currentMonth();
  const [period, setPeriod] = useState(thisMonth);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!id) return;
    const request = ++requestRef.current;
    try {
      const db = await getDb();
      const summary = await getEnvelopeSummary(db, id, period);
      if (request !== requestRef.current) return;
      if (!summary) {
        setState('missing');
        return;
      }
      // Monthly budgets count the month; special budgets count every record ever assigned.
      const range =
        summary.envelope.kind === 'monthly'
          ? { start: monthStartIso(period), endExclusive: monthStartIso(nextMonth(period)) }
          : {};
      const [breakdown, records] = await Promise.all([
        getCategoryBreakdown(db, { type: 'expense', envelopeId: id, ...range }),
        listTransactions(db, { type: 'expense', envelopeId: id, ...range }),
      ]);
      if (request !== requestRef.current) return;
      setLoaded({ summary, breakdown, records });
      setState('ready');
    } catch (error) {
      console.error('Failed to load budget detail:', error);
      if (request === requestRef.current) setState('error');
    }
  }, [id, period]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        requestRef.current += 1;
      };
    }, [refresh]),
  );

  const days = useMemo(() => groupLedgerByDay(loaded?.records ?? []), [loaded]);

  const summary = loaded?.summary;
  const envelope = summary?.envelope;
  const monthly = envelope?.kind === 'monthly';
  const scopeLabel = monthly ? monthTitle(period) : '累计';

  const openRecords = (target: RecordsTarget) => {
    if (!envelope) return;
    router.push({
      pathname: '/records',
      params: {
        title: target.title,
        subtitle: `${envelope.name} · ${scopeLabel}`,
        type: 'expense',
        envelopeId: envelope.id,
        categoryId: target.categoryId,
        ...(monthly ? { start: monthStartIso(period), end: monthStartIso(nextMonth(period)) } : {}),
        ...(target.subcategoryId === undefined ? {} : { subcategoryId: target.subcategoryId ?? 'none' }),
      },
    });
  };

  const edit = envelope ? (
    <Pressable
      onPress={() => router.push({ pathname: '/budget/envelope', params: { id: envelope.id } })}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`编辑${envelope.name}`}
    >
      <Text style={styles.editText}>编辑</Text>
    </Pressable>
  ) : null;

  if (state === 'missing') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScreenHeader title="预算" onBack={() => router.back()} backgroundColor={PRIMARY_GREEN} />
        <View style={[styles.scroll, styles.centered]}>
          <Text style={styles.muted}>这个预算已删除</Text>
        </View>
      </SafeAreaView>
    );
  }

  const percent = summary ? envelopeUsedPercent(summary.spentCents, summary.availableCents) : 0;
  const over = (summary?.remainingCents ?? 0) < 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader
        title={envelope?.name ?? '预算'}
        onBack={() => router.back()}
        backgroundColor={PRIMARY_GREEN}
        right={edit}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {state === 'error' ? (
          <View style={styles.centered}>
            <Text style={styles.muted}>预算明细读取失败</Text>
            <Pressable onPress={() => void refresh()} style={styles.retry} accessibilityRole="button">
              <Text style={styles.retryText}>重新加载</Text>
            </Pressable>
          </View>
        ) : !summary || !envelope ? (
          <View style={styles.centered}>
            <ActivityIndicator color={PRIMARY_GREEN} />
          </View>
        ) : (
          <>
            {monthly ? (
              <MonthStepper
                label={monthTitle(period)}
                accessibilityLabel="预算月份"
                onPrevious={() => {
                  const previous = addMonths(period, -1);
                  if (previous >= envelope.startPeriod) setPeriod(previous);
                }}
                onNext={() => {
                  const next = addMonths(period, 1);
                  if (next <= thisMonth) setPeriod(next);
                }}
                variant="pill"
                labelMinWidth={96}
                style={styles.stepper}
              />
            ) : null}

            <View style={styles.card}>
              <View style={styles.titleLine}>
                <View style={styles.emojiDisc}>
                  <Text style={styles.emoji}>{envelope.icon}</Text>
                </View>
                <View style={styles.titleCopy}>
                  <View style={styles.nameLine}>
                    <Text style={styles.name} numberOfLines={1}>
                      {envelope.name}
                    </Text>
                    <Image source={KIND_BADGE[envelope.kind]} style={styles.badge} accessible={false} />
                  </View>
                  <Text style={styles.muted} numberOfLines={1}>
                    {envelope.description || KIND_LABEL[envelope.kind]}
                    {envelope.isArchived ? ' · 已归档' : ''}
                  </Text>
                </View>
              </View>

              <Text style={styles.remainingLabel}>{over ? '超支' : monthly ? '本月剩余' : '剩余'}</Text>
              <Text style={[styles.remaining, over && styles.overText]} accessibilityRole="text">
                ¥{centsToYuan(Math.abs(summary.remainingCents))}
              </Text>
              <ProgressBar percent={percent} color={budgetProgressColor(percent)} height={6} />
              <View style={styles.facts}>
                <Fact label={monthly ? '本月预算' : '预算'} value={summary.amountCents} />
                <Fact label="已用" value={summary.spentCents} />
                {summary.frozenCents > 0 ? <Fact label="计划冻结" value={summary.frozenCents} /> : null}
                <Fact label="已用比例" text={`${Math.min(percent, 999)}%`} />
              </View>
            </View>

            <View style={[styles.card, styles.flushCard]}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>支出构成</Text>
                {loaded.breakdown.count > 0 ? (
                  <Text style={styles.muted}>{loaded.breakdown.count} 笔</Text>
                ) : null}
              </View>
              {loaded.breakdown.categories.length > 0 ? (
                <CategoryBreakdownList
                  key={period}
                  breakdown={loaded.breakdown}
                  onOpenRecords={openRecords}
                />
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>
                    {monthly ? `${monthTitle(period)}还没有归入这个预算的支出` : '还没有归入这个预算的支出'}
                  </Text>
                  <Text style={styles.muted}>在支出详情的「所属预算/计划」里选择这个预算</Text>
                </View>
              )}
            </View>

            {days.length > 0 ? (
              <View style={[styles.card, styles.flushCard]}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{monthly ? '本月记录' : '全部记录'}</Text>
                </View>
                <LedgerDays days={days} onOpen={(t) => router.push(`/transaction/${t.id}`)} />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Fact({ label, value, text }: { label: string; value?: number; text?: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{text ?? `¥${centsToYuan(value ?? 0)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  scroll: { flex: 1, backgroundColor: PAGE_BACKGROUND },
  scrollContent: { paddingTop: 12, paddingBottom: 40 },
  centered: { paddingVertical: 80, alignItems: 'center', gap: 12 },
  stepper: { marginBottom: 12 },
  editText: { fontSize: 15, color: TEXT_PRIMARY },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: CARD_BACKGROUND,
  },
  flushCard: { paddingHorizontal: 0, paddingBottom: 8, overflow: 'hidden' },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  titleCopy: { flex: 1, minWidth: 0, gap: 3 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontSize: 16, fontWeight: '500', color: TEXT_PRIMARY },
  badge: { width: 16, height: 16 },
  remainingLabel: { marginTop: 18, fontSize: 12, color: TEXT_SECONDARY },
  remaining: {
    marginBottom: 10,
    fontFamily: RICH_NUMERAL_FONT,
    fontSize: 30,
    lineHeight: 36,
    color: TEXT_PRIMARY,
  },
  overText: { color: EXPENSE_RED },
  facts: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  fact: { width: '50%', gap: 2 },
  factLabel: { fontSize: 11, color: TEXT_SECONDARY },
  factValue: { fontSize: 14, color: TEXT_PRIMARY, fontVariant: ['tabular-nums'] },
  sectionHead: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 15, fontWeight: '500', color: TEXT_PRIMARY },
  muted: { fontSize: 12, color: TEXT_SECONDARY },
  empty: { paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 13, color: TEXT_PRIMARY, textAlign: 'center' },
  retry: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 4, backgroundColor: TEXT_PRIMARY },
  retryText: { color: CARD_BACKGROUND, fontSize: 13 },
});
