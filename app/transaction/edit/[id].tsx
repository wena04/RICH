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
  View,
} from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { DatePickerModal } from '@/components/DatePickerModal';
import { ScreenHeader } from '@/components/rich';
import {
  EXPENSE_RED,
  PRIMARY_GREEN,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
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
            hitSlop={8}
            onPress={onSave}
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
              accessibilityState={{ selected: type === value }}
              onPress={() => selectType(value)}
              style={[styles.typeButton, type === value && styles.typeButtonActive]}
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
              style={styles.dateButton}
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
              style={styles.amountInput}
            />
          </View>
        </View>

        {type !== 'balance_adjustment' ? (
          <>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>主分类</Text>
              <Text style={styles.sectionValue}>{selectedCategory?.name ?? '请选择'}</Text>
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
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setCategoryId(category.id);
                      setSubcategoryId(null);
                    }}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                  >
                    <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
                      <CategoryIcon
                        id={category.icon ?? undefined}
                        name={category.name}
                        size={20}
                        color={active ? '#181A19' : '#858B88'}
                      />
                    </View>
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
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
                  <Text style={styles.sectionValue}>
                    {selectedSubcategory?.name ?? '不细分'}
                  </Text>
                </View>
                <View style={styles.subcategoryWrap}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: subcategoryId == null }}
                    onPress={() => setSubcategoryId(null)}
                    style={[styles.subcategoryChip, subcategoryId == null && styles.subcategoryChipActive]}
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
                        accessibilityState={{ selected: active }}
                        onPress={() => setSubcategoryId(active ? null : subcategory.id)}
                        style={[styles.subcategoryChip, active && styles.subcategoryChipActive]}
                      >
                        <Text style={[styles.subcategoryText, active && styles.subcategoryTextActive]}>
                          {subcategory.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {!visibleSubcategories.length ? (
                  <Pressable onPress={() => router.push('/categories')} style={styles.manageLink}>
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
          <Text style={styles.sectionValue}>
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
                accessibilityState={{ selected: active }}
                onPress={() => setAccountId(account.id)}
                style={[styles.accountChip, active && styles.accountChipActive]}
              >
                <FontAwesome
                  name={account.type === 'cash' ? 'money' : 'bank'}
                  size={12}
                  color={active ? '#FFFFFF' : TEXT_SECONDARY}
                />
                <Text style={[styles.accountText, active && styles.accountTextActive]}>
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
            placeholder="这笔钱花在了哪里？"
            placeholderTextColor="#A8AFAC"
            multiline
            style={styles.noteInput}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="删除这笔记录"
          onPress={onDelete}
          style={styles.deleteButton}
        >
          <FontAwesome name="trash-o" size={14} color={EXPENSE_RED} />
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
  scroll: { flex: 1, backgroundColor: '#F5F7F5' },
  content: { padding: 16, paddingBottom: 40 },
  saveText: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  saveTextDisabled: { opacity: 0.45 },
  typeToggle: { flexDirection: 'row', padding: 3, backgroundColor: '#E9EEEB', borderRadius: 999 },
  typeButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  typeButtonActive: { backgroundColor: '#101A17' },
  typeText: { fontSize: 11.5, color: TEXT_SECONDARY },
  typeTextActive: { color: '#FFFFFF', fontWeight: '700' },
  amountCard: { marginTop: 14, padding: 18, backgroundColor: '#FFFFFF', borderRadius: 3 },
  amountHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountLabel: { fontSize: 11, fontWeight: '700', color: TEXT_SECONDARY },
  dateButton: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, backgroundColor: '#F1F4F2', borderRadius: 999 },
  dateText: { fontSize: 11, fontWeight: '600', color: TEXT_PRIMARY },
  amountLine: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12 },
  currency: { fontSize: 23, fontWeight: '600', color: PRIMARY_GREEN, marginRight: 4 },
  amountInput: { flex: 1, paddingVertical: 0, fontSize: 40, fontWeight: '300', color: TEXT_PRIMARY, fontVariant: ['tabular-nums'] },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  sectionValue: { fontSize: 10.5, color: TEXT_SECONDARY },
  chipScroll: { gap: 8, paddingRight: 16 },
  categoryChip: { minWidth: 72, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E9E6', borderRadius: 3 },
  categoryChipActive: { borderColor: PRIMARY_GREEN, backgroundColor: '#ECF9F3' },
  categoryIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8F7' },
  categoryIconActive: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#1A1A1A' },
  categoryText: { marginTop: 5, fontSize: 10.5, color: TEXT_SECONDARY },
  categoryTextActive: { color: TEXT_PRIMARY, fontWeight: '700' },
  subcategorySection: { position: 'relative', marginTop: 14, paddingLeft: 18, paddingBottom: 2 },
  subcategoryRail: { position: 'absolute', left: 4, top: 0, bottom: 0, width: 2, backgroundColor: PRIMARY_GREEN },
  subcategoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subcategoryChip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DFE5E1', borderRadius: 999 },
  subcategoryChipActive: { backgroundColor: '#101A17', borderColor: '#101A17' },
  subcategoryText: { fontSize: 11, color: TEXT_SECONDARY },
  subcategoryTextActive: { color: '#FFFFFF', fontWeight: '600' },
  manageLink: { minHeight: 40, justifyContent: 'center' },
  manageLinkText: { fontSize: 10.5, color: PRIMARY_GREEN },
  adjustmentNote: { flexDirection: 'row', gap: 9, alignItems: 'center', marginTop: 16, padding: 14, backgroundColor: '#EAF7F1', borderRadius: 3 },
  adjustmentText: { flex: 1, fontSize: 11.5, color: TEXT_SECONDARY },
  accountWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  accountChip: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, backgroundColor: '#FFFFFF', borderRadius: 999, borderWidth: 1, borderColor: '#DFE5E1' },
  accountChipActive: { backgroundColor: '#101A17', borderColor: '#101A17' },
  accountText: { fontSize: 11.5, color: TEXT_SECONDARY },
  accountTextActive: { color: '#FFFFFF', fontWeight: '600' },
  noteCard: { marginTop: 22, padding: 14, backgroundColor: '#FFFFFF', borderRadius: 3 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  noteCount: { fontSize: 9.5, color: TEXT_MUTED },
  noteInput: { minHeight: 70, marginTop: 8, padding: 0, fontSize: 13, lineHeight: 19, color: TEXT_PRIMARY, textAlignVertical: 'top' },
  deleteButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0C9C5', borderRadius: 3 },
  deleteText: { fontSize: 12.5, fontWeight: '600', color: EXPENSE_RED },
});
