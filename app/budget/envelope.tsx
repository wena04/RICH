import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { DashedDivider } from '@/components/rich';
import { Text, View } from '@/components/Themed';
import {
  ACCESSIBLE_GREEN,
  CATEGORY_FRAME_BACKGROUND,
  CONTROL_BACKGROUND,
  DESTRUCTIVE_CORAL,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import {
  createEnvelope,
  deleteEnvelope,
  getEnvelope,
  getEnvelopeAmountHistory,
  setEnvelopeArchived,
  updateEnvelope,
} from '@/src/db/repo/envelopes';
import type { BudgetEnvelope, BudgetEnvelopeKind } from '@/src/domain/types';
import {
  amountLabel,
  BUDGET_EMOJI,
  characterCount,
  DEFAULT_BUDGET_EMOJI,
  ENVELOPE_DESCRIPTION_MAX,
  ENVELOPE_NAME_MAX,
  validateEnvelopeForm,
} from '@/src/features/budgets/envelopeForm';
import { envelopeAmountForPeriod } from '@/src/features/budgets/envelopes';
import { centsToYuan } from '@/src/utils/money';
import { currentMonth } from '@/src/utils/month';
import { useLayoutScale, useScaledStyles } from '@/components/rich/useScaledStyles';

const KIND_OPTIONS: {
  kind: BudgetEnvelopeKind;
  label: string;
  hint: string;
  icon: number;
}[] = [
  {
    kind: 'monthly',
    label: '月度预算',
    hint: '每月固定额度，每月 1 日重新开始',
    icon: require('../../assets/images/budget/icon_month_budget.png'),
  },
  {
    kind: 'special',
    label: '专项预算',
    hint: '一次性总额，适合旅行、大促等专项开支',
    icon: require('../../assets/images/budget/icon_special_budget.png'),
  },
];

const EMOJI_COLUMNS = 6;

function trimToCharacters(value: string, max: number): string {
  return characterCount(value) > max ? Array.from(value).slice(0, max).join('') : value;
}

/** Edits an existing budget (`?id=`). New budgets go through the original three-step wizard. */
export default function BudgetEnvelopeRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (!id) return <Redirect href="/budget/create" />;
  return <BudgetEnvelopeScreen />;
}

function BudgetEnvelopeScreen() {
  const styles = useScaledStyles(baseStyles, { keep: FIXED });
  const k = useLayoutScale();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { width } = useWindowDimensions();
  const period = useMemo(() => currentMonth(), []);

  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(
    isEdit ? 'loading' : 'ready',
  );
  const [existing, setExisting] = useState<BudgetEnvelope | null>(null);
  const [originalAmountCents, setOriginalAmountCents] = useState<number | null>(null);
  const [kind, setKind] = useState<BudgetEnvelopeKind>('monthly');
  const [icon, setIcon] = useState<string>(DEFAULT_BUDGET_EMOJI);
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoadState('loading');
    try {
      const db = await getDb();
      const [envelope, history] = await Promise.all([
        getEnvelope(db, id),
        getEnvelopeAmountHistory(db, id),
      ]);
      if (!envelope) {
        setLoadState('error');
        return;
      }
      const amount = envelopeAmountForPeriod(envelope, history, period);
      setExisting(envelope);
      setKind(envelope.kind);
      setIcon(envelope.icon);
      setName(envelope.name);
      setDescription(envelope.description ?? '');
      setOriginalAmountCents(amount);
      setAmountText(centsToYuan(amount));
      setLoadState('ready');
    } catch (error) {
      console.error('Failed to load budget:', error);
      setLoadState('error');
    }
  }, [id, period]);

  useEffect(() => {
    void load();
  }, [load]);

  const validation = validateEnvelopeForm(kind, { name, icon, amountText, description });
  // Saving stays pressable while invalid so the alert can explain what to fix.
  const saveBlocked = saving || loadState !== 'ready';

  function openHelp() {
    router.push({ pathname: '/budget/help', params: { topic: 'budget' } });
  }

  async function onSave() {
    if (!validation.ok) {
      Alert.alert('检查预算', validation.message);
      return;
    }
    setSaving(true);
    try {
      const db = await getDb();
      const value = validation.value;
      if (existing) {
        await updateEnvelope(db, existing.id, {
          name: value.name,
          icon: value.icon,
          description: value.description,
          amountCents: value.amountCents === originalAmountCents ? undefined : value.amountCents,
          effectivePeriod: period,
        });
      } else {
        await createEnvelope(db, {
          kind,
          name: value.name,
          icon: value.icon,
          description: value.description,
          amountCents: value.amountCents,
          startPeriod: period,
        });
      }
      router.back();
    } catch (error) {
      console.error('Failed to save budget:', error);
      Alert.alert('保存失败', '预算没有保存，请稍后再试。');
      setSaving(false);
    }
  }

  async function onToggleArchive() {
    if (!existing) return;
    setSaving(true);
    try {
      const db = await getDb();
      await setEnvelopeArchived(db, existing.id, !existing.isArchived);
      router.back();
    } catch (error) {
      Alert.alert(
        existing.isArchived ? '无法恢复' : '无法归档',
        String(error).includes('budget_has_active_plans')
          ? '有计划正在冻结这个预算，请先结束相关计划。'
          : '预算没有更新，请稍后再试。',
      );
      setSaving(false);
    }
  }

  function onDelete() {
    if (!existing) return;
    Alert.alert(
      `删除「${existing.name}」？`,
      '已归入该预算的支出会保留，但不再属于任何预算。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const db = await getDb();
              await deleteEnvelope(db, existing.id);
              router.back();
            } catch (error) {
              const message = String(error);
              Alert.alert(
                '无法删除',
                message.includes('FOREIGN KEY')
                  ? '有计划正在冻结这个预算，请先结束相关计划。'
                  : '预算没有删除，请稍后再试。',
              );
              setSaving(false);
            }
          },
        },
      ],
    );
  }

  const emojiSize = Math.floor((Math.min(width, 430) - 32 * k) / EMOJI_COLUMNS); // less the scaled 16pt insets
  const kindOption = KIND_OPTIONS.find((option) => option.kind === kind) ?? KIND_OPTIONS[0];

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
        <Text style={styles.title}>{isEdit ? '编辑预算' : '新建预算'}</Text>
        <Pressable
          onPress={openHelp}
          style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          accessibilityRole="button"
          accessibilityLabel="查看预算示例"
        >
          <Text style={styles.exampleLink}>示例</Text>
        </Pressable>
      </View>

      {loadState === 'loading' ? (
        <View style={styles.statePanel}>
          <ActivityIndicator size="small" color={ACCESSIBLE_GREEN} />
          <Text style={styles.stateText}>正在载入预算</Text>
        </View>
      ) : loadState === 'error' ? (
        <View style={styles.statePanel}>
          <Text style={styles.stateText}>没有找到这个预算</Text>
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
            {isEdit ? (
              <View style={styles.kindReadOnly}>
                <Image source={kindOption.icon} style={styles.kindIcon} accessible={false} />
                <Text style={styles.kindReadOnlyText}>{kindOption.label}</Text>
              </View>
            ) : (
              <View style={styles.kindToggle} accessibilityRole="tablist">
                {KIND_OPTIONS.map((option) => {
                  const active = option.kind === kind;
                  return (
                    <Pressable
                      key={option.kind}
                      onPress={() => setKind(option.kind)}
                      style={[styles.kindButton, active && styles.kindButtonActive]}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                    >
                      <Image source={option.icon} style={styles.kindIcon} accessible={false} />
                      <Text style={[styles.kindText, active && styles.kindTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <Text style={styles.kindHint}>{kindOption.hint}</Text>

            <View style={styles.identityRow}>
              <View style={styles.selectedEmoji} accessibilityLabel={`已选图标 ${icon}`}>
                <Text style={styles.selectedEmojiText}>{icon}</Text>
              </View>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={(value) => setName(trimToCharacters(value, ENVELOPE_NAME_MAX))}
                placeholder={`预算名称，如 基本开支（不超过${ENVELOPE_NAME_MAX}个字）`}
                placeholderTextColor={TEXT_MUTED}
                accessibilityLabel="预算名称"
                returnKeyType="next"
              />
            </View>

            <View style={styles.amountBlock}>
              <Text style={styles.fieldLabel}>{amountLabel(kind)}</Text>
              <View style={styles.amountLine}>
                <Text style={styles.amountCurrency}>¥</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amountText}
                  onChangeText={(value) => setAmountText(value.replace(/[^\d.]/g, ''))}
                  placeholder="0.00"
                  placeholderTextColor="#C8C8C8"
                  keyboardType="decimal-pad"
                  accessibilityLabel={amountLabel(kind)}
                />
              </View>
              <DashedDivider />
              {isEdit && kind === 'monthly' ? (
                <Text style={styles.amountNote}>修改金额从本月起生效，之前月份保持原金额</Text>
              ) : null}
            </View>

            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={(value) =>
                setDescription(trimToCharacters(value, ENVELOPE_DESCRIPTION_MAX))
              }
              placeholder="用途说明（选填），如 日常三餐和常规花销"
              placeholderTextColor={TEXT_MUTED}
              accessibilityLabel="用途说明"
            />

            <Text style={styles.sectionTitle}>选择图标</Text>
            <View style={styles.dash} />
            <View style={styles.emojiGrid}>
              {BUDGET_EMOJI.map((emoji) => {
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

            {isEdit && existing ? (
              <Pressable
                onPress={() => void onToggleArchive()}
                disabled={saving}
                style={({ pressed }) => [styles.archiveButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityHint={
                  existing.isArchived ? '恢复到预算列表' : '从预算列表和所属预算选择中隐藏，保留支出记录'
                }
              >
                <Text style={styles.archiveText}>{existing.isArchived ? '取消归档' : '归档预算'}</Text>
              </Pressable>
            ) : null}
            {isEdit ? (
              <Pressable
                onPress={onDelete}
                disabled={saving}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.deleteText}>删除该预算</Text>
              </Pressable>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => void onSave()}
              disabled={saveBlocked}
              style={({ pressed }) => [
                styles.saveButton,
                (!validation.ok || saveBlocked) && styles.saveButtonDisabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: saveBlocked }}
              accessibilityHint={validation.ok ? undefined : validation.message}
            >
              <Text style={styles.saveText}>{saving ? '保存中' : '保存'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

/** Nav-bar controls keep the system size. */
const FIXED = { headerAction: true, headerActionPressed: true } as const;

const baseStyles = StyleSheet.create({
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
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 32 },
  statePanel: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateText: { fontSize: 13, color: TEXT_SECONDARY },
  retryButton: { minHeight: 40, paddingHorizontal: 22, justifyContent: 'center', backgroundColor: '#101A17' },
  retryText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  kindToggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    padding: 2,
  },
  kindButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  kindButtonActive: { backgroundColor: '#FFFFFF' },
  kindIcon: { width: 18, height: 18 },
  kindText: { fontSize: 14, color: TEXT_SECONDARY },
  kindTextActive: { color: TEXT_PRIMARY, fontWeight: '600' },
  kindReadOnly: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
  kindReadOnlyText: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  kindHint: { marginTop: 8, fontSize: 11.5, color: TEXT_SECONDARY },
  identityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
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
  amountNote: { marginTop: 8, fontSize: 11, color: TEXT_SECONDARY },
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
  archiveButton: {
    marginTop: 32,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: TEXT_PRIMARY,
  },
  archiveText: { fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY },
  deleteButton: {
    marginTop: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DESTRUCTIVE_CORAL,
  },
  deleteText: { color: '#FFFFFF', fontSize: 15 },
  footer: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111111' },
  saveButtonDisabled: { backgroundColor: '#B8B8B8' },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.85 },
});
