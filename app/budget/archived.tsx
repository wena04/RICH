import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import {
  ACCESSIBLE_GREEN,
  CATEGORY_FRAME_BACKGROUND,
  CONTROL_BACKGROUND,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import {
  listEnvelopes,
  listSavingsPlans,
  setEnvelopeArchived,
  setSavingsPlanArchived,
} from '@/src/db/repo/envelopes';
import type { BudgetEnvelope, SavingsPlan } from '@/src/domain/types';
import { centsToYuan } from '@/src/utils/money';
import { useScaledStyles } from '@/components/rich/useScaledStyles';

type Row = {
  key: string;
  icon: string;
  name: string;
  meta: string;
  open: () => void;
  restore: () => Promise<void>;
};

export default function ArchivedScreen() {
  const styles = useScaledStyles(baseStyles);
  const router = useRouter();
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [envelopes, setEnvelopes] = useState<BudgetEnvelope[]>([]);
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const db = await getDb();
      const [allEnvelopes, allPlans] = await Promise.all([
        listEnvelopes(db, { includeArchived: true }),
        listSavingsPlans(db, { includeArchived: true }),
      ]);
      setEnvelopes(allEnvelopes.filter((item) => item.isArchived));
      setPlans(allPlans.filter((item) => item.isArchived));
      setLoadState('ready');
    } catch (error) {
      console.error('Failed to load archive:', error);
      setLoadState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function restore(key: string, action: () => Promise<void>) {
    setBusyKey(key);
    try {
      await action();
      await load();
    } catch (error) {
      console.error('Failed to restore:', error);
      Alert.alert('没有恢复', '请稍后再试。');
    } finally {
      setBusyKey(null);
    }
  }

  const budgetRows: Row[] = envelopes.map((envelope) => ({
    key: envelope.id,
    icon: envelope.icon,
    name: envelope.name,
    meta: envelope.kind === 'monthly' ? '月度预算' : '专项预算',
    open: () => router.push({ pathname: '/budget/envelope', params: { id: envelope.id } }),
    restore: async () => setEnvelopeArchived(await getDb(), envelope.id, false),
  }));
  const planRows: Row[] = plans.map((plan) => ({
    key: plan.id,
    icon: plan.icon,
    name: plan.name,
    meta: `${plan.status === 'completed' ? '已完成' : '已结束'} · 目标 ¥${centsToYuan(plan.targetCents)}`,
    open: () => router.push({ pathname: '/budget/plan', params: { id: plan.id } }),
    restore: async () => setSavingsPlanArchived(await getDb(), plan.id, false),
  }));

  function section(title: string, rows: Row[]) {
    if (!rows.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rows.map((row, index) => (
          <View key={row.key} style={[styles.row, index > 0 && styles.rowDivider]}>
            <Pressable
              onPress={row.open}
              style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${row.name}，${row.meta}`}
            >
              <View style={styles.icon}>
                <Text style={styles.emoji}>{row.icon}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.name} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.meta}>{row.meta}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => void restore(row.key, row.restore)}
              disabled={busyKey === row.key}
              style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`恢复${row.name}`}
            >
              <Text style={styles.restoreText}>{busyKey === row.key ? '恢复中' : '恢复'}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.head}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerAction, styles.backAction, pressed && styles.headerActionPressed]}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Image source={require('../../assets/images/ui/nav_icon_back_black.png')} style={styles.backIcon} accessible={false} />
        </Pressable>
        <Text style={styles.title}>已归档</Text>
        <View style={styles.headerAction} />
      </View>
      {loadState === 'loading' ? (
        <View style={styles.statePanel}>
          <ActivityIndicator size="small" color={ACCESSIBLE_GREEN} />
        </View>
      ) : loadState === 'error' ? (
        <View style={styles.statePanel}>
          <Text style={styles.stateText}>没有载入归档</Text>
          <Pressable style={styles.retryButton} onPress={() => void load()} accessibilityRole="button">
            <Text style={styles.retryText}>重新载入</Text>
          </Pressable>
        </View>
      ) : !budgetRows.length && !planRows.length ? (
        <View style={styles.statePanel}>
          <Text style={styles.stateText}>没有归档的预算或计划</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.intro}>归档的预算不再出现在预算列表和所属预算选择中，已归入的支出记录保留不变。</Text>
          {section('预算', budgetRows)}
          {section('计划', planRows)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
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
  headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerActionPressed: { backgroundColor: CONTROL_BACKGROUND },
  // Original back chevron: nav_icon_back_black, 16pt from the screen edge.
  backAction: { alignItems: 'flex-start' },
  backIcon: { width: 16, height: 16 },
  title: { fontSize: 17, fontWeight: '600', color: TEXT_PRIMARY },
  statePanel: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateText: { fontSize: 13, color: TEXT_SECONDARY },
  retryButton: { minHeight: 40, paddingHorizontal: 22, justifyContent: 'center', backgroundColor: '#101A17' },
  retryText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  intro: { fontSize: 12, lineHeight: 18, color: TEXT_SECONDARY, marginBottom: 8 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5E5' },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  pressed: { opacity: 0.7 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
    marginRight: 12,
  },
  emoji: { fontSize: 21 },
  copy: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY },
  meta: { marginTop: 2, fontSize: 11.5, color: TEXT_SECONDARY },
  restoreButton: {
    minWidth: 64,
    minHeight: 36,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: TEXT_PRIMARY,
  },
  restoreText: { fontSize: 13, fontWeight: '600', color: TEXT_PRIMARY },
});
