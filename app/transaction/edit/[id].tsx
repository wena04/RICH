import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getDb } from '@/src/db/db';
import { listAccounts } from '@/src/db/repo/accounts';
import { ensureCategory, ensureSubcategory, getCategoryById, getSubcategoryById } from '@/src/db/repo/categories';
import { deleteTransaction, getTransaction, updateTransaction } from '@/src/db/repo/transactions';
import type { Account, Transaction, TransactionType } from '@/src/domain/types';
import { isIsoDate } from '@/src/utils/date';
import { centsToCurrencyString, parseCurrencyToCents } from '@/src/utils/money';

export default function EditTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;

  const [loaded, setLoaded] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const noteRemaining = useMemo(() => 100 - note.length, [note.length]);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const list = await listAccounts(db);
      setAccounts(list);

      const tx = await getTransaction(db, id);
      if (!tx) {
        setError('未找到该记录。');
        setLoaded(true);
        return;
      }

      setType(tx.type);
      setDate(tx.date);
      setAccountId(tx.accountId);
      setNote(tx.note ?? '');

      const displayCents = tx.type === 'balance_adjustment' ? tx.amountCents : Math.abs(tx.amountCents);
      setAmount(centsToCurrencyString(displayCents));

      if (tx.categoryId) {
        const cat = await getCategoryById(db, tx.categoryId);
        setCategoryName(cat?.name ?? '');
      }
      if (tx.subcategoryId) {
        const sub = await getSubcategoryById(db, tx.subcategoryId);
        setSubcategoryName(sub?.name ?? '');
      }

      setLoaded(true);
    })();
  }, [id]);

  useEffect(() => {
    if (type === 'balance_adjustment') {
      setCategoryName('');
      setSubcategoryName('');
    }
  }, [type]);

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      const cents = parseCurrencyToCents(amount);
      if (cents === null) throw new Error('请输入有效的金额。');
      if (!isIsoDate(date)) throw new Error('日期格式需为 YYYY-MM-DD。');
      if (!accountId) throw new Error('请选择账户。');

      const db = await getDb();

      let categoryId: string | null = null;
      let subcategoryId: string | null = null;

      if (type !== 'balance_adjustment') {
        if (!categoryName.trim()) throw new Error('支出/收入需要分类。');
        const category = await ensureCategory(db, categoryName);
        categoryId = category.id;
        if (subcategoryName.trim()) {
          const sub = await ensureSubcategory(db, category.id, subcategoryName);
          subcategoryId = sub.id;
        }
      }

      const tx: Transaction = {
        id,
        type,
        amountCents: type === 'balance_adjustment' ? cents : Math.abs(cents),
        date,
        accountId,
        categoryId,
        subcategoryId,
        note: note.trim() ? note.trim().slice(0, 100) : null,
      };

      await updateTransaction(db, tx);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败。');
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    Alert.alert('删除该记录?', '此操作无法撤销。', [
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
    return (
      <View style={styles.container}>
        <Text>加载中…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.segment}>
        {(['expense', 'income', 'balance_adjustment'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={[styles.segmentItem, t === type && styles.segmentItemActive]}>
            <Text style={styles.segmentText}>
              {t === 'expense' ? '支出' : t === 'income' ? '收入' : '余额调整'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>金额</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>日期</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          style={styles.input}
          autoCapitalize="none"
        />
      </View>

      {type !== 'balance_adjustment' ? (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>分类</Text>
            <TextInput
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="如：餐饮"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>子分类 (可选)</Text>
            <TextInput
              value={subcategoryName}
              onChangeText={setSubcategoryName}
              placeholder="如：咖啡"
              style={styles.input}
            />
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>余额调整</Text>
          <Text>余额调整不适用分类/子分类。</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>账户</Text>
        <View style={styles.chips}>
          {accounts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setAccountId(a.id)}
              style={[styles.chip, a.id === accountId && styles.chipActive]}>
              <Text style={styles.chipText}>{a.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>备注 (可选, 最多 100 字)</Text>
        <TextInput
          value={note}
          onChangeText={(v) => setNote(v.slice(0, 100))}
          placeholder="备注"
          style={styles.input}
        />
        <Text style={styles.helper}>还可输入 {noteRemaining} 字</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable onPress={onSave} disabled={saving} style={[styles.save, saving && styles.saveDisabled]}>
          <Text style={styles.saveText}>{saving ? '保存中…' : '保存'}</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={styles.delete}>
          <Text style={styles.deleteText}>删除</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  segment: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segmentItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
  },
  segmentItemActive: { borderColor: 'rgba(127,127,127,0.8)' },
  segmentText: { fontSize: 12 },
  field: { gap: 6 },
  label: { fontWeight: '600' },
  input: { borderWidth: 1, borderColor: 'rgba(127,127,127,0.3)', borderRadius: 10, padding: 10 },
  helper: { opacity: 0.7, fontSize: 12 },
  card: { padding: 16, borderRadius: 12, gap: 8 },
  cardTitle: { fontWeight: '600' },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
  },
  chipActive: { borderColor: 'rgba(127,127,127,0.8)' },
  chipText: { fontSize: 12 },
  error: { color: '#c1121f', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10 },
  save: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
    alignItems: 'center',
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { fontWeight: '600' },
  delete: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(193, 18, 31, 0.4)',
    alignItems: 'center',
  },
  deleteText: { color: '#c1121f', fontWeight: '600' },
});
