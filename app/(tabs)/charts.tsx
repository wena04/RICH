import { useFocusEffect, useRouter } from 'expo-router';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/rich';
import { Text, View } from '@/components/Themed';
import {
  CATEGORY_FRAME_BACKGROUND,
  EXPENSE_RED,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import { getBudgetTabSummary, reorderEnvelopes } from '@/src/db/repo/envelopes';
import type { BudgetEnvelopeSummary, BudgetTabSummary } from '@/src/domain/types';
import { envelopeUsedPercent } from '@/src/features/budgets/envelopeForm';
import { centsToYuan } from '@/src/utils/money';
import { currentMonth } from '@/src/utils/month';
import { RichChevron } from '@/components/rich/RichChevron';
import { SortableList } from '@/components/rich/SortableList';
import { KIND_BADGE, budgetProgressColor } from '@/components/budget/budgetVisuals';

function monthLabel(period: string): string {
  const [year, month] = period.split('-');
  const now = new Date();
  return Number(year) === now.getFullYear() ? `${Number(month)}月` : `${year}年${Number(month)}月`;
}

function BudgetExampleDonut() {
  return (
    <View style={styles.exampleChart}>
      <Image
        source={require('../../assets/images/budget/icon_budget_progress.png')}
        resizeMode="contain"
        style={styles.exampleArtwork}
        accessible={false}
      />
    </View>
  );
}

function EnvelopeRow({
  summary,
  first,
  onPress,
}: {
  summary: BudgetEnvelopeSummary;
  first: boolean;
  onPress: () => void;
}) {
  const { envelope, amountCents, availableCents, frozenCents, spentCents, remainingCents } = summary;
  const percent = envelopeUsedPercent(spentCents, availableCents);
  const kindLabel = envelope.kind === 'monthly' ? '月度预算' : '专项预算';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.envelopeRow, !first && styles.envelopeDivider, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${envelope.name}，${kindLabel}，${
        remainingCents >= 0
          ? `剩余 ${centsToYuan(remainingCents)} 元`
          : `超支 ${centsToYuan(-remainingCents)} 元`
      }`}
      accessibilityHint="查看预算明细"
    >
      <View style={styles.envelopeIcon}>
        <Text style={styles.envelopeEmoji}>{envelope.icon}</Text>
      </View>
      <View style={styles.envelopeBody}>
        <View style={styles.envelopeTitleLine}>
          <Text style={styles.envelopeName} numberOfLines={1}>
            {envelope.name}
          </Text>
          <Image source={KIND_BADGE[envelope.kind]} style={styles.kindBadge} accessible={false} />
          <Text style={styles.envelopeAmount}>¥{centsToYuan(amountCents)}</Text>
        </View>
        <Text style={styles.envelopeDescription} numberOfLines={1}>
          {envelope.description || (envelope.kind === 'monthly' ? '每月重新开始' : '一次性专项额度')}
        </Text>
        <ProgressBar
          percent={percent}
          color={budgetProgressColor(percent)}
          height={5}
          style={styles.envelopeTrack}
        />
        <View style={styles.envelopeMeta}>
          <Text style={styles.metaText}>
            {envelope.kind === 'monthly' ? '本月已用' : '累计已用'} ¥{centsToYuan(spentCents)}
            {frozenCents > 0 ? `  ·  冻结 ¥${centsToYuan(frozenCents)}` : ''}
          </Text>
          <Text style={[styles.metaText, remainingCents < 0 && styles.overText]}>
            {remainingCents >= 0
              ? `剩余 ¥${centsToYuan(remainingCents)}`
              : `超支 ¥${centsToYuan(-remainingCents)}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const summaryKey = (summary: BudgetEnvelopeSummary) => summary.envelope.id;

function SortRow({
  summary,
  first,
  last,
  onMove,
  handle,
}: {
  summary: BudgetEnvelopeSummary;
  first: boolean;
  last: boolean;
  onMove: (delta: number) => void;
  /** Drag handle from `SortableList`. */
  handle: ReactNode;
}) {
  const { envelope } = summary;
  return (
    <View style={[styles.sortRow, !first && styles.envelopeDivider]}>
      <View style={styles.envelopeIcon}>
        <Text style={styles.envelopeEmoji}>{envelope.icon}</Text>
      </View>
      <Text style={[styles.envelopeName, styles.sortName]} numberOfLines={1}>
        {envelope.name}
      </Text>
      <Pressable
        onPress={() => onMove(-1)}
        disabled={first}
        style={({ pressed }) => [styles.sortButton, first && styles.sortButtonOff, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`上移${envelope.name}`}
        accessibilityState={{ disabled: first }}
      >
        <RichChevron direction="up" />
      </Pressable>
      <Pressable
        onPress={() => onMove(1)}
        disabled={last}
        style={({ pressed }) => [styles.sortButton, last && styles.sortButtonOff, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`下移${envelope.name}`}
        accessibilityState={{ disabled: last }}
      >
        <RichChevron direction="down" />
      </Pressable>
      {handle}
    </View>
  );
}

export default function BudgetScreen() {
  const router = useRouter();
  const [month] = useState(currentMonth());
  const [summary, setSummary] = useState<BudgetTabSummary | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadRequestRef = useRef(0);
  const [sortOrder, setSortOrder] = useState<BudgetEnvelopeSummary[] | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  // Scrolling pauses while a budget is being dragged.
  const [dragging, setDragging] = useState(false);

  const refresh = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setLoadState('loading');
    try {
      const db = await getDb();
      const next = await getBudgetTabSummary(db, month);
      if (requestId !== loadRequestRef.current) return;
      setSummary(next);
      setSortOrder(null);
      setLoadState('ready');
    } catch (error) {
      console.error('Failed to load budget summary:', error);
      if (requestId !== loadRequestRef.current) return;
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

  const envelopes = summary?.envelopes ?? [];
  const ready = loadState === 'ready' && summary;

  function openCreate() {
    router.push('/budget/create');
  }

  function openEnvelope(id: string) {
    router.push({ pathname: '/budget/detail', params: { id } });
  }

  async function finishSorting() {
    if (!sortOrder) return;
    setSavingOrder(true);
    try {
      const db = await getDb();
      await reorderEnvelopes(
        db,
        sortOrder.map((item) => item.envelope.id),
      );
      await refresh();
    } catch (error) {
      console.error('Failed to save budget order:', error);
      setSortOrder(null);
    } finally {
      setSavingOrder(false);
    }
  }

  const archivedLink =
    summary && summary.archivedCount > 0 ? (
      <Pressable
        onPress={() => router.push('/budget/archived')}
        style={styles.helpLink}
        accessibilityRole="link"
      >
        <Text style={styles.helpLinkText}>已归档 {summary.archivedCount} 项</Text>
        <RichChevron tone="muted" />
      </Pressable>
    ) : null;

  function openHelp() {
    router.push({ pathname: '/budget/help', params: { topic: 'budget' } });
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>预算/计划</Text>
      </View>

      <View style={styles.summaryCard}>
        <Pressable
          style={({ pressed }) => [styles.summaryLeft, pressed && styles.pressed]}
          onPress={() => router.push('/budget/plans')}
          accessibilityRole="button"
          accessibilityLabel={`计划清单，已攒 ${ready ? centsToYuan(summary.plansSavedCents) : '—'} 元`}
        >
          <Text style={styles.planLabel}>计划清单</Text>
          {ready && summary.plans.length ? (
            <Text style={styles.planCount}>
              {summary.plans.filter((item) => item.plan.status === 'active').length} 个进行中
            </Text>
          ) : null}
          <Text style={styles.planAmount}>
            ¥ {ready ? centsToYuan(summary.plansSavedCents) : '—'}
          </Text>
        </Pressable>
        <View style={styles.summaryRight}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>结余</Text>
            <Text style={styles.summaryValue}>
              ¥ {ready ? centsToYuan(summary.balanceCents).replace('-', '−') : '—'}
            </Text>
          </View>
          <Pressable
            style={[styles.summaryRow, styles.summaryDivider]}
            onPress={() => router.push('/trends')}
            accessibilityRole="button"
            accessibilityLabel="趋势图"
          >
            <Text style={styles.summaryKey}>趋势图</Text>
            <Image
              source={require('../../assets/images/budget/icon_trend_chart_small.png')}
              style={styles.trendIcon}
              accessible={false}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} scrollEnabled={!dragging}>
        {loadState === 'loading' ? (
          <View style={styles.statePanel}>
            <ActivityIndicator size="small" color={PRIMARY_GREEN} />
            <Text style={styles.stateTitle}>正在载入{monthLabel(month)}预算</Text>
            <Text style={styles.stateBody}>正在核对预算与本月支出</Text>
          </View>
        ) : loadState === 'error' || !summary ? (
          <View style={styles.statePanel}>
            <Image source={require('../../assets/images/ui/icon_warning.png')} style={styles.stateMark} accessible={false} />
            <Text style={styles.stateTitle}>没有载入{monthLabel(month)}预算</Text>
            <Text style={styles.stateBody}>请重试</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`重新载入${monthLabel(month)}预算`}
              onPress={() => void refresh()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>重新载入</Text>
            </Pressable>
          </View>
        ) : envelopes.length ? (
          <>
            <View style={styles.listHeader}>
              <View>
                <Text style={styles.listTitle}>我的预算</Text>
                <Text style={styles.listMeta}>
                  {sortOrder ? '拖动右侧把手，或长按后拖动' : `${monthLabel(month)} · ${envelopes.length} 个预算`}
                </Text>
              </View>
              {sortOrder ? (
                <Pressable
                  onPress={() => void finishSorting()}
                  disabled={savingOrder}
                  style={styles.doneButton}
                  accessibilityRole="button"
                  accessibilityLabel="完成排序"
                >
                  <Text style={styles.doneText}>{savingOrder ? '保存中' : '完成'}</Text>
                </Pressable>
              ) : (
                <View style={styles.listActions}>
                  {envelopes.length > 1 ? (
                    <Pressable
                      onPress={() => setSortOrder(envelopes)}
                      style={({ pressed }) => [styles.sortToggle, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="排序预算"
                      hitSlop={6}
                    >
                      <Image
                        source={require('../../assets/images/budget/icon_list_sort.png')}
                        style={styles.sortIcon}
                        accessible={false}
                      />
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={openCreate}
                    accessibilityRole="button"
                    accessibilityLabel="新预算"
                    hitSlop={6}
                  >
                    <Image
                      source={require('../../assets/images/budget/icon_budget_create.png')}
                      style={styles.createPill}
                      resizeMode="contain"
                    />
                  </Pressable>
                </View>
              )}
            </View>
            <View style={styles.envelopeList}>
              {sortOrder ? (
                <SortableList
                  items={sortOrder}
                  keyOf={summaryKey}
                  onReorder={setSortOrder}
                  onDragActiveChange={setDragging}
                  renderRow={(item, row) => (
                    <SortRow
                      summary={item}
                      first={row.first}
                      last={row.last}
                      onMove={row.move}
                      handle={row.handle}
                    />
                  )}
                />
              ) : (
                envelopes.map((item, index) => (
                    <EnvelopeRow
                      key={item.envelope.id}
                      summary={item}
                      first={index === 0}
                      onPress={() => openEnvelope(item.envelope.id)}
                    />
                  ))
              )}
            </View>
            {!sortOrder ? (
              <>
                <Pressable onPress={openHelp} style={styles.helpLink} accessibilityRole="link">
                  <Text style={styles.helpLinkText}>看看别人怎么分预算</Text>
                  <RichChevron tone="muted" />
                </Pressable>
                {archivedLink}
              </>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.emptyHeadline}>您还未创建预算</Text>
            <View style={styles.emptyPanel}>
              <BudgetExampleDonut />
              <Text style={styles.tagline}>有预算才能无负担的花钱</Text>
              <Pressable style={styles.createButton} onPress={openCreate} accessibilityRole="button">
                <Text style={styles.createButtonText}>+ 创建预算</Text>
              </Pressable>
            </View>
            {archivedLink}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  header: { height: 46, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: TEXT_PRIMARY },
  summaryCard: {
    minHeight: 146,
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
  },
  summaryLeft: {
    width: '50%',
    paddingTop: 18,
    paddingBottom: 14,
    paddingLeft: 16.5,
    paddingRight: 14,
    justifyContent: 'space-between',
    borderRightWidth: 4 / 3,
    borderRightColor: PRIMARY_GREEN,
  },
  planLabel: { fontSize: 19, fontWeight: '500', color: '#000000' },
  planAmount: { fontSize: 16, color: '#000000', textAlign: 'right' },
  planCount: { marginTop: 4, fontSize: 11, color: TEXT_SECONDARY },
  summaryRight: { flex: 1 },
  summaryRow: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 13.5,
    paddingRight: 13.5,
  },
  // The original rule starts 12pt in from the column edge; the text keeps its 13.5pt inset.
  summaryDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E2E2',
    marginLeft: 12,
    paddingLeft: 1.5,
  },
  summaryKey: { fontSize: 15, fontWeight: '500', color: '#000000' },
  summaryValue: { fontSize: 13, color: '#000000' },
  trendIcon: { width: 36, height: 36 },
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
  // Original icon_warning art.
  stateMark: { width: 32, height: 32 },
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
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 6,
  },
  listTitle: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  listMeta: { marginTop: 2, fontSize: 11, color: TEXT_SECONDARY },
  createPill: { width: 74, height: 40 },
  listActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sortToggle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sortIcon: { width: 22, height: 22 },
  doneButton: { minWidth: 56, height: 40, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  sortName: { flex: 1 },
  sortButton: {
    width: 40,
    height: 40,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
    borderRadius: 20,
  },
  sortButtonOff: { opacity: 0.3 },
  envelopeList: { marginHorizontal: 24 },
  envelopeRow: { flexDirection: 'row', paddingVertical: 16 },
  envelopeDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    marginLeft: 0,
  },
  pressed: { opacity: 0.7 },
  envelopeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
    marginRight: 12,
  },
  envelopeEmoji: { fontSize: 24 },
  envelopeBody: { flex: 1 },
  envelopeTitleLine: { flexDirection: 'row', alignItems: 'center' },
  envelopeName: { flexShrink: 1, fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  kindBadge: { width: 14, height: 14, marginLeft: 6 },
  envelopeAmount: {
    marginLeft: 'auto',
    paddingLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
  },
  envelopeDescription: { marginTop: 3, fontSize: 12, color: TEXT_SECONDARY },
  envelopeTrack: { marginTop: 10 },
  envelopeMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  metaText: { fontSize: 10.5, color: TEXT_SECONDARY, fontVariant: ['tabular-nums'] },
  overText: { color: EXPENSE_RED },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    marginTop: 8,
  },
  helpLinkText: { fontSize: 12, color: TEXT_SECONDARY },
  emptyHeadline: {
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500',
    color: '#000000',
    marginTop: 26,
  },
  emptyPanel: {
    marginHorizontal: 25,
    marginTop: 40,
    backgroundColor: '#F6F7F8',
    borderRadius: 0,
    paddingTop: 37,
    paddingBottom: 40,
    alignItems: 'center',
  },
  exampleChart: { width: 210, height: 98, backgroundColor: 'transparent' },
  exampleArtwork: { width: 210, height: 98 },
  tagline: { fontSize: 14, lineHeight: 20, color: '#333333', marginTop: 36 },
  createButton: {
    width: 284,
    maxWidth: '88%',
    height: 44,
    marginTop: 20,
    backgroundColor: '#000000',
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '400' },
});
