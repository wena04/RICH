import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/rich';
import { Text, View } from '@/components/Themed';
import {
  ACCESSIBLE_GREEN,
  CONTROL_BACKGROUND,
  PRIMARY_GREEN,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import { getSavingsPlanSummaries } from '@/src/db/repo/envelopes';
import type { SavingsPlanSummary } from '@/src/domain/types';
import { totalPlanSavingsCents } from '@/src/features/budgets/envelopes';
import { planStatusText } from '@/src/features/budgets/planForm';
import { centsToYuan } from '@/src/utils/money';
import { currentMonth } from '@/src/utils/month';
import { RichChevron } from '@/components/rich/RichChevron';

const PLAN_CLOCK = require('../../assets/images/budget/plan_clock.png');
const PLAN_CLOCK_FINISH = require('../../assets/images/budget/plan_clock_finish.png');

function PlanCard({ summary, onPress }: { summary: SavingsPlanSummary; onPress: () => void }) {
  const { plan, progress, sourceEnvelopeName } = summary;
  const done = plan.status === 'completed' || progress.isFullyFunded;
  const ended = plan.status === 'cancelled';
  const percent = progress.totalDeposits
    ? Math.round((progress.completedDeposits / progress.totalDeposits) * 100)
    : 0;
  const status = planStatusText(plan, progress);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, ended && styles.cardEnded, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${plan.name}，目标 ${centsToYuan(plan.targetCents)} 元，${status}`}
    >
      <Text style={styles.cardEmoji}>{plan.icon}</Text>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardName} numberOfLines={1}>
            {plan.name}
          </Text>
          <Text style={styles.cardTarget}>¥{centsToYuan(plan.targetCents)}</Text>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.cardMeta} numberOfLines={1}>
            冻结预算「{sourceEnvelopeName || '已删除'}」¥{centsToYuan(plan.monthlyCents)}/月
          </Text>
          <View style={styles.statusLine}>
            {!ended ? (
              <Image
                source={done ? PLAN_CLOCK_FINISH : PLAN_CLOCK}
                style={styles.statusIcon}
                accessible={false}
              />
            ) : null}
            <Text style={[styles.statusText, done && styles.statusDone]}>{status}</Text>
          </View>
        </View>
        {!ended ? (
          <ProgressBar
            percent={percent}
            color={PRIMARY_GREEN}
            height={3}
            style={styles.cardTrack}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function PlanListScreen() {
  const router = useRouter();
  const [period] = useState(currentMonth());
  const [plans, setPlans] = useState<SavingsPlanSummary[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoadState('loading');
    try {
      const db = await getDb();
      const next = await getSavingsPlanSummaries(db, period);
      if (requestId !== requestRef.current) return;
      setPlans(next);
      setLoadState('ready');
    } catch (error) {
      console.error('Failed to load plans:', error);
      if (requestId === requestRef.current) setLoadState('error');
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        requestRef.current += 1;
      };
    }, [refresh]),
  );

  const savedCents = totalPlanSavingsCents(
    plans.map((p) => p.plan),
    period,
  );

  function openCreate() {
    router.push('/budget/plan');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.head}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerAction,
            styles.backAction, pressed && styles.headerActionPressed]}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Image source={require('../../assets/images/ui/nav_icon_back_black.png')} style={styles.backIcon} accessible={false} />
        </Pressable>
        <Text style={styles.title}>计划清单</Text>
        <Pressable
          onPress={() => router.push({ pathname: '/budget/help', params: { topic: 'plan' } })}
          style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          accessibilityRole="button"
          accessibilityLabel="查看计划示例"
        >
          <Text style={styles.exampleLink}>示例</Text>
        </Pressable>
      </View>

      {loadState === 'loading' ? (
        <View style={styles.statePanel}>
          <ActivityIndicator size="small" color={ACCESSIBLE_GREEN} />
          <Text style={styles.stateText}>正在载入计划</Text>
        </View>
      ) : loadState === 'error' ? (
        <View style={styles.statePanel}>
          <Text style={styles.stateText}>没有载入计划</Text>
          <Pressable style={styles.retryButton} onPress={() => void refresh()} accessibilityRole="button">
            <Text style={styles.retryText}>重新载入</Text>
          </Pressable>
        </View>
      ) : plans.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContent}>
          <Image
            source={require('../../assets/images/budget/icon_no_plan.png')}
            style={styles.emptyArt}
            resizeMode="contain"
            accessible={false}
          />
          <Text style={styles.emptyTitle}>还没有计划</Text>
          <Text style={styles.emptyBody}>每月从一个预算里冻结一点钱，攒够就去买想要的东西。</Text>
          <Pressable style={styles.primaryButton} onPress={openCreate} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>+ 创建计划</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/budget/help', params: { topic: 'plan' } })}
            style={styles.helpLink}
            accessibilityRole="link"
          >
            <Text style={styles.helpLinkText}>看看别人怎么做计划</Text>
            <RichChevron tone="muted" />
          </Pressable>
        </ScrollView>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>已攒</Text>
              <Text style={styles.summaryValue}>¥{centsToYuan(savedCents)}</Text>
            </View>
            <Text style={styles.sectionLabel}>我创建了这些计划：</Text>
            {plans.map((summary) => (
              <PlanCard
                key={summary.plan.id}
                summary={summary}
                onPress={() =>
                  router.push({ pathname: '/budget/plan', params: { id: summary.plan.id } })
                }
              />
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <Pressable style={styles.primaryButton} onPress={openCreate} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>+ 创建计划</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerAction: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerActionPressed: { backgroundColor: CONTROL_BACKGROUND },
  // Original back chevron: nav_icon_back_black, 16pt from the screen edge.
  backAction: { alignItems: 'flex-start' },
  backIcon: { width: 16, height: 16 },
  title: { fontSize: 17, fontWeight: '600', color: TEXT_PRIMARY },
  exampleLink: { fontSize: 14, fontWeight: '600', color: ACCESSIBLE_GREEN },
  statePanel: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateText: { fontSize: 13, color: TEXT_SECONDARY },
  retryButton: { minHeight: 40, paddingHorizontal: 22, justifyContent: 'center', backgroundColor: '#101A17' },
  retryText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24 },
  summary: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 18 },
  summaryLabel: { fontSize: 13, color: TEXT_SECONDARY },
  summaryValue: { fontSize: 26, fontWeight: '700', color: TEXT_PRIMARY, fontVariant: ['tabular-nums'] },
  sectionLabel: { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
    backgroundColor: '#F5F6F8',
  },
  cardEnded: { opacity: 0.6 },
  pressed: { opacity: 0.75 },
  cardEmoji: { fontSize: 26, width: 40 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardName: { flex: 1, fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  cardTarget: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
  },
  cardBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  cardMeta: { flex: 1, fontSize: 11.5, color: TEXT_SECONDARY },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  statusIcon: { width: 14, height: 14 },
  statusText: { fontSize: 11.5, color: TEXT_MUTED, fontVariant: ['tabular-nums'] },
  statusDone: { color: ACCESSIBLE_GREEN, fontWeight: '600' },
  cardTrack: { marginTop: 10 },
  footer: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  // Same treatment as the original 预算 empty state: black 44pt bar, regular 16pt label.
  primaryButton: {
    alignSelf: 'stretch',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '400' },
  emptyContent: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 40, paddingBottom: 24 },
  emptyArt: { width: 220, height: 182 },
  emptyTitle: { marginTop: 20, fontSize: 20, fontWeight: '500', color: '#000000' },
  emptyBody: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    marginTop: 8,
  },
  helpLinkText: { fontSize: 12, color: TEXT_SECONDARY },
});
