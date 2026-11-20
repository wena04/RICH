import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetPickerSheet, DashedDivider, ProgressBar } from '@/components/rich';
import { Text, View } from '@/components/Themed';
import {
  ACCESSIBLE_GREEN,
  CATEGORY_FRAME_BACKGROUND,
  CONTROL_BACKGROUND,
  DESTRUCTIVE_CORAL,
  PRIMARY_GREEN,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import {
  createSavingsPlan,
  endSavingsPlan,
  getEnvelopeSummaries,
  getSavingsPlanSummaries,
  setSavingsPlanArchived,
  updateSavingsPlanDetails,
} from '@/src/db/repo/envelopes';
import type { BudgetEnvelopeSummary, SavingsPlanSummary } from '@/src/domain/types';
import { characterCount } from '@/src/features/budgets/envelopeForm';
import { planDepositCount } from '@/src/features/budgets/envelopes';
import {
  DEFAULT_PLAN_EMOJI,
  formatPeriodCN,
  PLAN_DESCRIPTION_MAX,
  PLAN_EMOJI,
  PLAN_NAME_MAX,
  planFinalDepositPeriod,
  validatePlanForm,
} from '@/src/features/budgets/planForm';
import { centsToYuan, parseCurrencyToCents } from '@/src/utils/money';
import { currentMonth } from '@/src/utils/month';
import { RichChevron } from '@/components/rich/RichChevron';

const EMOJI_COLUMNS = 6;

function trimToCharacters(value: string, max: number): string {
  return characterCount(value) > max ? Array.from(value).slice(0, max).join('') : value;
}

export default function PlanScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isDetail = Boolean(id);
  const { width } = useWindowDimensions();
  const period = useMemo(() => currentMonth(), []);

  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [summary, setSummary] = useState<SavingsPlanSummary | null>(null);
  const [budgets, setBudgets] = useState<BudgetEnvelopeSummary[]>([]);
  const [icon, setIcon] = useState<string>(DEFAULT_PLAN_EMOJI);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetText, setTargetText] = useState('');
  const [monthlyText, setMonthlyText] = useState('');
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const db = await getDb();
      if (id) {
        const all = await getSavingsPlanSummaries(db, period, { includeArchived: true });
        const found = all.find((item) => item.plan.id === id) ?? null;
        if (!found) {
          setLoadState('error');
          return;
        }
        setSummary(found);
        setIcon(found.plan.icon);
        setName(found.plan.name);
        setDescription(found.plan.description ?? '');
      } else {
        const envelopes = await getEnvelopeSummaries(db, period);
        const monthly = envelopes.filter((item) => item.envelope.kind === 'monthly');
        setBudgets(monthly);
        // Keep the chosen source if it still exists (e.g. after creating a budget from the sheet).
        setSourceId((current) =>
          current && monthly.some((item) => item.envelope.id === current) ? current : null,
        );
      }
      setLoadState('ready');
    } catch (error) {
      console.error('Failed to load plan:', error);
      setLoadState('error');
    }
  }, [id, period]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const source = budgets.find((item) => item.envelope.id === sourceId) ?? null;
  const validation = validatePlanForm({
    name,
    icon,
    targetText,
    monthlyText,
    description,
    sourceEnvelopeId: sourceId,
    sourceAmountCents: source?.amountCents ?? null,
  });

  const previewTarget = parseCurrencyToCents(targetText);
  const previewMonthly = parseCurrencyToCents(monthlyText);
  const preview =
    previewTarget && previewMonthly && previewTarget > 0 && previewMonthly > 0 && previewMonthly <= previewTarget
      ? {
          count: planDepositCount({ targetCents: previewTarget, monthlyCents: previewMonthly }),
          finish: planFinalDepositPeriod(period, {
            targetCents: previewTarget,
            monthlyCents: previewMonthly,
          }),
        }
      : null;

  async function onCreate() {
    if (!validation.ok) {
      Alert.alert('检查计划', validation.message);
      return;
    }
    setSaving(true);
    try {
      const db = await getDb();
      await createSavingsPlan(db, { ...validation.value, startPeriod: period });
      router.back();
    } catch (error) {
      console.error('Failed to create plan:', error);
      Alert.alert('保存失败', '计划没有保存，请稍后再试。');
      setSaving(false);
    }
  }

  const detailsDirty =
    summary != null &&
    (name.trim() !== summary.plan.name ||
      icon !== summary.plan.icon ||
      (description.trim() || null) !== summary.plan.description);

  async function onSaveDetails() {
    if (!summary) return;
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('检查计划', '请填写计划名称');
      return;
    }
    setSaving(true);
    try {
      const db = await getDb();
      await updateSavingsPlanDetails(db, summary.plan.id, {
        name: trimmed,
        icon,
        description: description.trim() || null,
      });
      await load();
    } catch (error) {
      console.error('Failed to update plan:', error);
      Alert.alert('保存失败', '计划没有保存，请稍后再试。');
    } finally {
      setSaving(false);
    }
  }

  async function endPlan(status: 'completed' | 'cancelled') {
    if (!summary) return;
    setSaving(true);
    try {
      const db = await getDb();
      await endSavingsPlan(db, summary.plan.id, status, period);
      await load();
    } catch (error) {
      console.error('Failed to end plan:', error);
      Alert.alert('没有保存', '计划状态没有更新，请稍后再试。');
    } finally {
      setSaving(false);
    }
  }

  async function onToggleArchive() {
    if (!summary) return;
    setSaving(true);
    try {
      const db = await getDb();
      await setSavingsPlanArchived(db, summary.plan.id, !summary.plan.isArchived);
      router.back();
    } catch (error) {
      console.error('Failed to archive plan:', error);
      Alert.alert('没有保存', '计划没有更新，请稍后再试。');
      setSaving(false);
    }
  }

  function onCancelPlan() {
    if (!summary) return;
    Alert.alert(
      `结束「${summary.plan.name}」？`,
      `从本月起不再冻结预算「${summary.sourceEnvelopeName}」。已攒的 ¥${centsToYuan(
        summary.progress.savedCents,
      )} 会保留在计划记录里。`,
      [
        { text: '取消', style: 'cancel' },
        { text: '结束计划', style: 'destructive', onPress: () => void endPlan('cancelled') },
      ],
    );
  }

  const emojiSize = Math.floor((Math.min(width, 430) - 32) / EMOJI_COLUMNS);

  const emojiGrid = (
    <>
      <Text style={styles.sectionTitle}>选择图标</Text>
      <View style={styles.dash} />
      <View style={styles.emojiGrid}>
        {PLAN_EMOJI.map((emoji) => {
          const active = emoji === icon;
          return (
            <Pressable
              key={emoji}
              onPress={() => setIcon(emoji)}
              style={({ pressed }) => [
                styles.emojiCell,
                { width: emojiSize, height: emojiSize },
                pressed && styles.emojiCellPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`选择图标 ${emoji}`}
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.emojiWrap, active && styles.emojiWrapActive]}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  const identity = (
    <View style={styles.identityRow}>
      <View style={styles.selectedEmoji}>
        <Text style={styles.selectedEmojiText}>{icon}</Text>
      </View>
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={(value) => setName(trimToCharacters(value, PLAN_NAME_MAX))}
        placeholder={`计划名称，如 夏日旅行计划`}
        placeholderTextColor={TEXT_MUTED}
        accessibilityLabel="计划名称"
      />
    </View>
  );

  const descriptionInput = (
    <TextInput
      style={styles.descriptionInput}
      value={description}
      onChangeText={(value) => setDescription(trimToCharacters(value, PLAN_DESCRIPTION_MAX))}
      placeholder="计划说明（选填）"
      placeholderTextColor={TEXT_MUTED}
      accessibilityLabel="计划说明"
    />
  );

  function renderDetail(current: SavingsPlanSummary) {
    const { plan, progress, sourceEnvelopeName, currentFreezeCents } = current;
    const percent = progress.totalDeposits
      ? Math.round((progress.completedDeposits / progress.totalDeposits) * 100)
      : 0;
    const finish = planFinalDepositPeriod(plan.startPeriod, plan);
    const active = plan.status === 'active';
    return (
      <>
        <View style={styles.progressCard}>
          {active && progress.isFullyFunded ? (
            <Image
              source={require('../../assets/images/budget/icon_plan_finish.png')}
              style={styles.finishArt}
              resizeMode="contain"
              accessible={false}
            />
          ) : null}
          <Text style={styles.progressSaved}>
            ¥{centsToYuan(progress.savedCents)}
            <Text style={styles.progressTarget}> / ¥{centsToYuan(plan.targetCents)}</Text>
          </Text>
          <ProgressBar percent={percent} color={PRIMARY_GREEN} style={styles.progressTrack} />
          <View style={styles.progressMeta}>
            <View style={styles.progressMetaLeft}>
              <Image
                source={
                  plan.status === 'completed' || progress.isFullyFunded
                    ? require('../../assets/images/budget/plan_clock_finish.png')
                    : require('../../assets/images/budget/plan_clock.png')
                }
                style={styles.clockIcon}
                accessible={false}
              />
              <Text style={styles.metaText}>
                已冻结 {progress.completedDeposits}/{progress.totalDeposits} 期
              </Text>
            </View>
            <Text style={styles.metaText}>
              {plan.status === 'completed'
                ? '计划已完成'
                : plan.status === 'cancelled'
                  ? '计划已结束'
                  : progress.isFullyFunded
                    ? '已经攒够啦'
                    : finish
                      ? `预计 ${formatPeriodCN(finish)} 攒够`
                      : ''}
            </Text>
          </View>
          <DashedDivider style={styles.progressDivider} />
          <Text style={styles.freezeText}>
            冻结预算「{sourceEnvelopeName || '已删除'}」¥{centsToYuan(plan.monthlyCents)}/月
            {active && currentFreezeCents > 0 ? `，本月冻结 ¥${centsToYuan(currentFreezeCents)}` : ''}
          </Text>
        </View>

        {active && progress.isFullyFunded ? (
          <Pressable
            onPress={() => void endPlan('completed')}
            disabled={saving}
            style={({ pressed }) => [styles.primaryButton, styles.completeGap, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>完成计划</Text>
          </Pressable>
        ) : null}

        {identity}
        {descriptionInput}
        {detailsDirty ? (
          <Pressable
            onPress={() => void onSaveDetails()}
            disabled={saving}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>{saving ? '保存中' : '保存修改'}</Text>
          </Pressable>
        ) : null}
        {emojiGrid}

        {!active ? (
          <Pressable
            onPress={() => void onToggleArchive()}
            disabled={saving}
            style={({ pressed }) => [styles.secondaryButton, styles.actionGap, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>{plan.isArchived ? '取消归档' : '归档计划'}</Text>
          </Pressable>
        ) : null}
        {active && !progress.isFullyFunded ? (
          <Pressable
            onPress={onCancelPlan}
            disabled={saving}
            style={({ pressed }) => [styles.deleteButton, styles.actionGap, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.deleteText}>结束计划</Text>
          </Pressable>
        ) : null}
      </>
    );
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
        <Text style={styles.title}>{isDetail ? '计划详情' : '新建计划'}</Text>
        <Pressable
          onPress={() => router.push({ pathname: '/budget/help', params: { topic: 'plan' } })}
          style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          accessibilityRole="button"
          accessibilityLabel="查看计划示例"
        >
          <Text style={styles.exampleLink}>示例</Text>
        </Pressable>
      </View>

      {loadState === 'loading' && !summary && !budgets.length ? (
        <View style={styles.statePanel}>
          <ActivityIndicator size="small" color={ACCESSIBLE_GREEN} />
          <Text style={styles.stateText}>正在载入</Text>
        </View>
      ) : loadState === 'error' ? (
        <View style={styles.statePanel}>
          <Text style={styles.stateText}>{isDetail ? '没有找到这个计划' : '没有载入预算'}</Text>
          <Pressable style={styles.retryButton} onPress={() => void load()} accessibilityRole="button">
            <Text style={styles.retryText}>重新载入</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {isDetail && summary ? (
              renderDetail(summary)
            ) : (
              <>
                {identity}

                <View style={styles.amountBlock}>
                  <Text style={styles.fieldLabel}>目标金额</Text>
                  <View style={styles.amountLine}>
                    <Text style={styles.amountCurrency}>¥</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={targetText}
                      onChangeText={(value) => setTargetText(value.replace(/[^\d.]/g, ''))}
                      placeholder="0.00"
                      placeholderTextColor="#C8C8C8"
                      keyboardType="decimal-pad"
                      accessibilityLabel="目标金额"
                    />
                  </View>
                  <DashedDivider />
                </View>

                <Pressable
                  onPress={() => setShowSourcePicker(true)}
                  style={({ pressed }) => [styles.fieldRow, pressed && styles.headerActionPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`冻结预算，${source ? source.envelope.name : '未选择'}`}
                >
                  <Text style={styles.fieldRowLabel}>冻结预算</Text>
                  <Text style={[styles.fieldRowValue, !source && styles.fieldRowPlaceholder]} numberOfLines={1}>
                    {source ? `${source.envelope.icon} ${source.envelope.name}` : '选择月度预算'}
                  </Text>
                  <RichChevron tone="muted" />
                </Pressable>

                <View style={styles.fieldRow}>
                  <Text style={styles.fieldRowLabel}>每月冻结</Text>
                  <Text style={styles.monthlyCurrency}>¥</Text>
                  <TextInput
                    style={styles.monthlyInput}
                    value={monthlyText}
                    onChangeText={(value) => setMonthlyText(value.replace(/[^\d.]/g, ''))}
                    placeholder="0.00"
                    placeholderTextColor="#C8C8C8"
                    keyboardType="decimal-pad"
                    accessibilityLabel="每月冻结金额"
                  />
                </View>

                <Text style={styles.previewText}>
                  {preview && preview.finish
                    ? `共 ${preview.count} 期，从本月开始，预计 ${formatPeriodCN(preview.finish)} 攒够`
                    : '每月从所选预算中冻结固定金额，直到攒够目标'}
                </Text>

                {descriptionInput}
                {emojiGrid}
              </>
            )}
          </ScrollView>

          {!isDetail ? (
            <View style={styles.footer}>
              <Pressable
                onPress={() => void onCreate()}
                disabled={saving}
                style={({ pressed }) => [
                  styles.primaryButton,
                  !validation.ok && styles.primaryButtonDisabled,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityHint={validation.ok ? undefined : validation.message}
              >
                <Text style={styles.primaryButtonText}>{saving ? '保存中' : '开始计划'}</Text>
              </Pressable>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      )}

      <BudgetPickerSheet
        visible={showSourcePicker}
        title="选择冻结的月度预算"
        allowNone={false}
        figure="amount"
        budgets={budgets}
        selectedId={sourceId}
        onSelect={(envelopeId) => {
          setSourceId(envelopeId);
          setShowSourcePicker(false);
        }}
        onCreate={() => {
          setShowSourcePicker(false);
          router.push('/budget/create');
        }}
        onClose={() => setShowSourcePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
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
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 32 },
  identityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  selectedEmoji: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
    marginRight: 12,
  },
  selectedEmojiText: { fontSize: 28 },
  nameInput: {
    flex: 1,
    minHeight: 52,
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  amountBlock: { marginTop: 22 },
  fieldLabel: { fontSize: 12, color: TEXT_SECONDARY },
  amountLine: { flexDirection: 'row', alignItems: 'center', minHeight: 64 },
  amountCurrency: { fontSize: 34, fontWeight: '700', color: TEXT_PRIMARY, marginRight: 4 },
  amountInput: {
    flex: 1,
    fontSize: 34,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
  },
  fieldRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fieldRowLabel: { width: 72, fontSize: 14, color: TEXT_SECONDARY },
  fieldRowValue: { flex: 1, fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY, textAlign: 'right' },
  fieldRowPlaceholder: { color: TEXT_MUTED, fontWeight: '400' },
  monthlyCurrency: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  monthlyInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
  },
  previewText: { marginTop: 10, fontSize: 11.5, lineHeight: 17, color: TEXT_SECONDARY },
  descriptionInput: {
    marginTop: 14,
    minHeight: 48,
    fontSize: 14,
    color: TEXT_PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: { marginTop: 24, fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  dash: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    borderStyle: 'dashed',
    marginTop: 8,
    marginBottom: 4,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center' },
  emojiCell: { alignItems: 'center', justifyContent: 'center' },
  emojiCellPressed: { backgroundColor: CONTROL_BACKGROUND },
  emojiWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
  },
  emojiWrapActive: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#1A1A1A' },
  emojiText: { fontSize: 24 },
  progressCard: { padding: 16, marginBottom: 18, backgroundColor: '#F5F6F8', alignItems: 'stretch' },
  finishArt: { alignSelf: 'center', width: 110, height: 98, marginBottom: 8 },
  progressSaved: { fontSize: 26, fontWeight: '700', color: TEXT_PRIMARY, fontVariant: ['tabular-nums'] },
  progressTarget: { fontSize: 13, fontWeight: '400', color: TEXT_SECONDARY },
  progressTrack: { marginTop: 12 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  progressMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clockIcon: { width: 14, height: 14 },
  metaText: { fontSize: 11.5, color: TEXT_SECONDARY, fontVariant: ['tabular-nums'] },
  progressDivider: { marginTop: 14, marginBottom: 10 },
  freezeText: { fontSize: 12, color: TEXT_SECONDARY },
  footer: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111111' },
  primaryButtonDisabled: { backgroundColor: '#B8B8B8' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  secondaryButton: {
    marginTop: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: TEXT_PRIMARY,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  actionGap: { marginTop: 32 },
  completeGap: { marginBottom: 18 },
  deleteButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: DESTRUCTIVE_CORAL },
  deleteText: { color: '#FFFFFF', fontSize: 15 },
  pressed: { opacity: 0.85 },
});
