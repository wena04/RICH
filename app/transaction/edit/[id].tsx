import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { DatePickerModal } from '@/components/DatePickerModal';
import { ScreenHeader } from '@/components/rich';
import {
  ACTION_BACKGROUND,
  ACTION_FOREGROUND,
  BORDER_COLOR,
  CARD_BACKGROUND,
  CATEGORY_FRAME_BACKGROUND,
  CONTROL_BACKGROUND,
  DESTRUCTIVE_TEXT,
  LEDGER_PAPER,
  PRIMARY_GREEN,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { RICH_RADIUS, RICH_SIZE, RICH_SPACING, RICH_TYPE } from '@/constants/Design';
import { getDb } from '@/src/db/db';
import { listAccounts } from '@/src/db/repo/accounts';
import { listAllSubcategories, listCategories } from '@/src/db/repo/categories';
import { deleteTransaction, getTransaction, updateTransaction } from '@/src/db/repo/transactions';
import type { Account, Category, Subcategory, Transaction, TransactionType } from '@/src/domain/types';
import { formatIsoDateCN, isIsoDate } from '@/src/utils/date';
import { centsToCurrencyString, parseCurrencyToCents } from '@/src/utils/money';

function screenTitle(type: TransactionType): string {
  if (type === 'income') return '编辑收入';
  if (type === 'balance_adjustment') return '编辑余额调整';
  return '编辑支出';
}

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: viewportWidth } = useWindowDimensions();
  const compactLayout = viewportWidth <= 340;

  const [loaded, setLoaded] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        const [accountRows, categoryRows, subcategoryRows, transaction] = await Promise.all([
          listAccounts(db),
          listCategories(db),
          listAllSubcategories(db),
          getTransaction(db, id),
        ]);
        if (!transaction) {
          Alert.alert('找不到记录', '这笔记录可能已经被删除。', [
            { text: '返回', onPress: () => router.back() },
          ]);
          return;
        }
        setAccounts(accountRows);
        setCategories(categoryRows);
        setSubcategories(subcategoryRows);
        setType(transaction.type);
        setAmount(
          centsToCurrencyString(
            transaction.type === 'balance_adjustment'
              ? transaction.amountCents
              : Math.abs(transaction.amountCents),
          ),
        );
        setDate(transaction.date);
        setAccountId(transaction.accountId);
        setCategoryId(transaction.categoryId);
        setSubcategoryId(transaction.subcategoryId);
        setNote(transaction.note ?? '');
      } catch (error) {
        Alert.alert('无法载入', error instanceof Error ? error.message : '请稍后重试。');
      } finally {
        setLoaded(true);
      }
    })();
  }, [id, router]);

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.id === categoryId ||
          category.kind === 'both' ||
          category.kind === type,
      ),
    [categories, categoryId, type],
  );

  const visibleSubcategories = useMemo(
    () => subcategories.filter((subcategory) => subcategory.categoryId === categoryId),
    [categoryId, subcategories],
  );

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId],
  );
  const selectedSubcategory = useMemo(
    () => subcategories.find((subcategory) => subcategory.id === subcategoryId) ?? null,
    [subcategories, subcategoryId],
  );

  function selectType(nextType: TransactionType) {
    setType(nextType);
    if (nextType === 'balance_adjustment') {
      setCategoryId(null);
      setSubcategoryId(null);
      return;
    }
    const current = categories.find((category) => category.id === categoryId);
    if (current && current.kind !== 'both' && current.kind !== nextType) {
      setCategoryId(null);
      setSubcategoryId(null);
    }
  }

  async function onSave() {
    if (saving) return;
    const amountCents = parseCurrencyToCents(amount);
    if (amountCents == null || (type !== 'balance_adjustment' && amountCents <= 0)) {
      Alert.alert('检查金额', '请输入有效金额，最多保留两位小数。');
      return;
    }
    if (!isIsoDate(date)) {
      Alert.alert('检查日期', '请选择有效日期。');
      return;
    }
    if (!accountId) {
      Alert.alert('选择账户', '每笔记录都需要一个账户。');
      return;
    }
    if (type !== 'balance_adjustment' && !categoryId) {
      Alert.alert('选择分类', '支出和收入都需要一个主分类。');
      return;
    }

    setSaving(true);
    try {
      const db = await getDb();
      const transaction: Transaction = {
        id,
        type,
        amountCents: type === 'balance_adjustment' ? amountCents : Math.abs(amountCents),
        date,
        accountId,
        categoryId: type === 'balance_adjustment' ? null : categoryId,
        subcategoryId: type === 'balance_adjustment' ? null : subcategoryId,
        note: note.trim() ? note.trim().slice(0, 100) : null,
      };
      await updateTransaction(db, transaction);
      router.back();
    } catch (error) {
      Alert.alert('没有保存', error instanceof Error ? error.message : '请稍后再试。');
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    Alert.alert('删除这笔记录？', '此操作无法撤销。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const db = await getDb();
          await deleteTransaction(db, id);
          router.back();
        },
      },
    ]);
  }

  if (!loaded) {
    return <SafeAreaView style={styles.loading} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader
        title={screenTitle(type)}
        subtitle="分类层级与预算会同步更新"
        onBack={() => router.back()}
        backgroundColor={PRIMARY_GREEN}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="保存修改"
            disabled={saving}
            onPress={onSave}
            style={styles.headerAction}
          >
            <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
              {saving ? '保存中' : '保存'}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.typeToggle}>
          {([
            ['expense', '支出'],
            ['income', '收入'],
            ['balance_adjustment', '余额调整'],
          ] as const).map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: type === value }}
              onPress={() => selectType(value)}
              style={({ pressed }) => [
                styles.typeButton,
                type === value && styles.typeButtonActive,
                pressed && styles.controlPressed,
              ]}
            >
              <Text style={[styles.typeText, type === value && styles.typeTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.amountCard}>
          <View style={styles.amountHeader}>
            <Text style={styles.amountLabel}>
              {type === 'balance_adjustment' ? '余额变化金额' : '金额'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`日期，${formatIsoDateCN(date)}`}
              onPress={() => setShowDatePicker(true)}
              style={({ pressed }) => [styles.dateButton, pressed && styles.controlPressed]}
            >
              <Text style={styles.dateText}>{formatIsoDateCN(date)}</Text>
              <FontAwesome name="chevron-down" size={9} color={TEXT_SECONDARY} />
            </Pressable>
          </View>
          <View style={styles.amountLine}>
            <Text style={styles.currency}>¥</Text>
            <TextInput
              accessibilityLabel="金额"
              autoFocus={false}
              value={amount}
              onChangeText={setAmount}
              keyboardType={type === 'balance_adjustment' ? 'numbers-and-punctuation' : 'decimal-pad'}
              placeholder="0.00"
              placeholderTextColor="#B7BDBA"
              selectionColor={PRIMARY_GREEN}
              style={[styles.amountInput, compactLayout && styles.amountInputCompact]}
            />
          </View>
        </View>

        {type !== 'balance_adjustment' ? (
          <>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>主分类</Text>
              <Text numberOfLines={1} style={styles.sectionValue}>
                {selectedCategory?.name ?? '请选择'}
              </Text>
            </View>
            <ScrollView
              horizontal
              contentContainerStyle={styles.chipScroll}
              showsHorizontalScrollIndicator={false}
            >
              {visibleCategories.map((category) => {
                const active = category.id === categoryId;
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityLabel={`主分类${category.name}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setCategoryId(category.id);
                      setSubcategoryId(null);
                    }}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      active && styles.categoryChipActive,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
                      <CategoryIcon
                        id={category.icon ?? undefined}
                        name={category.name}
                        size={20}
                        color={active ? '#181A19' : '#858B88'}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[styles.categoryText, active && styles.categoryTextActive]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {categoryId ? (
              <View style={styles.subcategorySection}>
                <View style={styles.subcategoryRail} />
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>子分类</Text>
                  <Text numberOfLines={1} style={styles.sectionValue}>
                    {selectedSubcategory?.name ?? '不细分'}
                  </Text>
                </View>
                <View style={styles.subcategoryWrap}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="不使用子分类"
                    accessibilityState={{ selected: subcategoryId == null }}
                    onPress={() => setSubcategoryId(null)}
                    style={({ pressed }) => [
                      styles.subcategoryChip,
                      subcategoryId == null && styles.subcategoryChipActive,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.subcategoryText,
                        subcategoryId == null && styles.subcategoryTextActive,
                      ]}
                    >
                      不细分
                    </Text>
                  </Pressable>
                  {visibleSubcategories.map((subcategory) => {
                    const active = subcategory.id === subcategoryId;
                    return (
                      <Pressable
                        key={subcategory.id}
                        accessibilityRole="button"
                        accessibilityLabel={`子分类${subcategory.name}`}
                        accessibilityState={{ selected: active }}
                        onPress={() => setSubcategoryId(active ? null : subcategory.id)}
                        style={({ pressed }) => [
                          styles.subcategoryChip,
                          active && styles.subcategoryChipActive,
                          pressed && styles.controlPressed,
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[styles.subcategoryText, active && styles.subcategoryTextActive]}
                        >
                          {subcategory.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {!visibleSubcategories.length ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`给${selectedCategory?.name ?? '这个分类'}添加子分类`}
                    onPress={() => router.push('/categories')}
                    style={({ pressed }) => [styles.manageLink, pressed && styles.controlPressed]}
                  >
                    <Text style={styles.manageLinkText}>这个分类还没有子分类 · 去添加</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.adjustmentNote}>
            <FontAwesome name="info-circle" size={15} color={PRIMARY_GREEN} />
            <Text style={styles.adjustmentText}>余额调整不会计入支出、收入或预算。</Text>
          </View>
        )}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>账户</Text>
          <Text numberOfLines={1} style={styles.sectionValue}>
            {accounts.find((account) => account.id === accountId)?.name ?? '请选择'}
          </Text>
        </View>
        <View style={styles.accountWrap}>
          {accounts.map((account) => {
            const active = account.id === accountId;
            return (
              <Pressable
                key={account.id}
                accessibilityRole="button"
                accessibilityLabel={`账户${account.name}`}
                accessibilityState={{ selected: active }}
                onPress={() => setAccountId(account.id)}
                style={({ pressed }) => [
                  styles.accountChip,
                  active && styles.accountChipActive,
                  pressed && styles.controlPressed,
                ]}
              >
                <FontAwesome
                  name={account.type === 'cash' ? 'money' : 'bank'}
                  size={12}
                  color={active ? '#FFFFFF' : TEXT_SECONDARY}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.accountText, active && styles.accountTextActive]}
                >
                  {account.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Text style={styles.sectionTitle}>备注</Text>
            <Text style={styles.noteCount}>{note.length}/100</Text>
          </View>
          <TextInput
            accessibilityLabel="备注"
            value={note}
            onChangeText={(value) => setNote(value.slice(0, 100))}
            placeholder={
              type === 'income'
                ? '这笔收入来自哪里？'
                : type === 'balance_adjustment'
                  ? '补充这次调整的说明'
                  : '这笔钱花在了哪里？'
            }
            placeholderTextColor="#A8AFAC"
            multiline
            style={styles.noteInput}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="删除这笔记录"
          onPress={onDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.controlPressed]}
        >
          <FontAwesome name="trash-o" size={14} color={DESTRUCTIVE_TEXT} />
          <Text style={styles.deleteText}>删除这笔记录</Text>
        </Pressable>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onSelect={setDate}
        onClose={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: PRIMARY_GREEN },
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  scroll: { flex: 1, backgroundColor: LEDGER_PAPER },
  content: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    padding: RICH_SPACING.md,
    paddingBottom: 40,
  },
  headerAction: {
    width: RICH_SIZE.minimumTouchTarget,
    minHeight: RICH_SIZE.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { ...RICH_TYPE.body, fontWeight: '700', color: TEXT_PRIMARY },
  saveTextDisabled: { opacity: 0.45 },
  controlPressed: { opacity: 0.76 },
  typeToggle: {
    flexDirection: 'row',
    padding: 3,
    backgroundColor: CONTROL_BACKGROUND,
    borderRadius: RICH_RADIUS.pill,
  },
  typeButton: {
    flex: 1,
    minHeight: RICH_SIZE.minimumTouchTarget,
    paddingHorizontal: RICH_SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RICH_RADIUS.pill,
  },
  typeButtonActive: { backgroundColor: ACTION_BACKGROUND },
  typeText: { ...RICH_TYPE.label, color: TEXT_SECONDARY },
  typeTextActive: { color: ACTION_FOREGROUND, fontWeight: '700' },
  amountCard: {
    marginTop: 14,
    padding: 18,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: RICH_RADIUS.card,
  },
  amountHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountLabel: { ...RICH_TYPE.label, fontWeight: '700', color: TEXT_SECONDARY },
  dateButton: {
    minHeight: RICH_SIZE.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: RICH_SPACING.sm,
    backgroundColor: CONTROL_BACKGROUND,
    borderRadius: RICH_RADIUS.pill,
  },
  dateText: { ...RICH_TYPE.label, fontWeight: '600', color: TEXT_PRIMARY },
  amountLine: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12 },
  currency: { fontSize: 23, fontWeight: '600', color: PRIMARY_GREEN, marginRight: 4 },
  amountInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 40,
    fontWeight: '300',
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
  },
  amountInputCompact: { fontSize: 34 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: { ...RICH_TYPE.sectionTitle, fontWeight: '700', color: TEXT_PRIMARY },
  sectionValue: {
    ...RICH_TYPE.caption,
    flexShrink: 1,
    marginLeft: RICH_SPACING.sm,
    color: TEXT_SECONDARY,
    textAlign: 'right',
  },
  chipScroll: { gap: RICH_SPACING.xs, paddingRight: RICH_SPACING.md },
  categoryChip: {
    minWidth: 72,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: RICH_RADIUS.card,
  },
  categoryChipActive: { borderColor: PRIMARY_GREEN, backgroundColor: '#ECF9F3' },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
  },
  categoryIconActive: {
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1.5,
    borderColor: TEXT_PRIMARY,
  },
  categoryText: { ...RICH_TYPE.caption, marginTop: 5, color: TEXT_SECONDARY },
  categoryTextActive: { color: TEXT_PRIMARY, fontWeight: '700' },
  subcategorySection: { position: 'relative', marginTop: 14, paddingLeft: 18, paddingBottom: 2 },
  subcategoryRail: { position: 'absolute', left: 4, top: 0, bottom: 0, width: 2, backgroundColor: PRIMARY_GREEN },
  subcategoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: RICH_SPACING.xs },
  subcategoryChip: {
    maxWidth: '100%',
    minHeight: RICH_SIZE.minimumTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 13,
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: RICH_RADIUS.pill,
  },
  subcategoryChipActive: { backgroundColor: ACTION_BACKGROUND, borderColor: ACTION_BACKGROUND },
  subcategoryText: { ...RICH_TYPE.label, flexShrink: 1, color: TEXT_SECONDARY },
  subcategoryTextActive: { color: ACTION_FOREGROUND, fontWeight: '600' },
  manageLink: { minHeight: RICH_SIZE.minimumTouchTarget, justifyContent: 'center' },
  manageLinkText: { ...RICH_TYPE.caption, color: PRIMARY_GREEN },
  adjustmentNote: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    marginTop: RICH_SPACING.md,
    padding: 14,
    backgroundColor: '#EAF7F1',
    borderRadius: RICH_RADIUS.card,
  },
  adjustmentText: { ...RICH_TYPE.label, flex: 1, color: TEXT_SECONDARY },
  accountWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: RICH_SPACING.xs },
  accountChip: {
    maxWidth: '100%',
    minHeight: RICH_SIZE.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: RICH_RADIUS.pill,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  accountChipActive: { backgroundColor: ACTION_BACKGROUND, borderColor: ACTION_BACKGROUND },
  accountText: { ...RICH_TYPE.label, flexShrink: 1, color: TEXT_SECONDARY },
  accountTextActive: { color: ACTION_FOREGROUND, fontWeight: '600' },
  noteCard: {
    marginTop: 22,
    padding: 14,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: RICH_RADIUS.card,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  noteCount: { ...RICH_TYPE.caption, color: TEXT_MUTED },
  noteInput: {
    minHeight: 70,
    marginTop: RICH_SPACING.xs,
    padding: 0,
    ...RICH_TYPE.body,
    lineHeight: 19,
    color: TEXT_PRIMARY,
    textAlignVertical: 'top',
  },
  deleteButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RICH_SPACING.xs,
    marginTop: 22,
    backgroundColor: CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: '#F0C9C5',
    borderRadius: RICH_RADIUS.card,
  },
  deleteText: { fontSize: 12.5, fontWeight: '600', color: DESTRUCTIVE_TEXT },
});
