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
        setError('Transaction not found.');
        setLoaded(true);
        return;
      }

      setType(tx.type);
      setDate(tx.date);
      setAccountId(tx.accountId);
      setNote(tx.note ?? '');

      // Display amount as positive for expense/income; signed for balance_adjustment.
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
      if (cents === null) throw new Error('Amount is required and must be a valid number.');
      if (!isIsoDate(date)) throw new Error('Date must be in YYYY-MM-DD format.');
      if (!accountId) throw new Error('Account is required.');

      const db = await getDb();

      let categoryId: string | null = null;
      let subcategoryId: string | null = null;

      if (type !== 'balance_adjustment') {
        if (!categoryName.trim()) throw new Error('Category is required for expense/income.');
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
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit transaction</Text>

      <View style={styles.segment}>
        {(['expense', 'income', 'balance_adjustment'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={[styles.segmentItem, t === type && styles.segmentItemActive]}>
            <Text style={styles.segmentText}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Amount (required)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Date (required)</Text>
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
            <Text style={styles.label}>Category (required)</Text>
            <TextInput
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="e.g. Food"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Subcategory (optional)</Text>
            <TextInput
              value={subcategoryName}
              onChangeText={setSubcategoryName}
              placeholder="e.g. Coffee"
              style={styles.input}
            />
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Balance adjustment</Text>
          <Text>Category/subcategory are not applicable for balance adjustments.</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Account (required)</Text>
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
        <Text style={styles.label}>Note (optional, max 100)</Text>
        <TextInput
          value={note}
          onChangeText={(v) => setNote(v.slice(0, 100))}
          placeholder="Optional note"
          style={styles.input}
        />
        <Text style={styles.helper}>{noteRemaining} characters remaining</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable onPress={onSave} disabled={saving} style={[styles.save, saving && styles.saveDisabled]}>
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={styles.delete}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  segmentItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
  },
  segmentItemActive: {
    borderColor: 'rgba(127,127,127,0.8)',
  },
  segmentText: {
    fontSize: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
    borderRadius: 10,
    padding: 10,
  },
  helper: {
    opacity: 0.7,
    fontSize: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cardTitle: {
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
  },
  chipActive: {
    borderColor: 'rgba(127,127,127,0.8)',
  },
  chipText: {
    fontSize: 12,
  },
  error: {
    color: '#c1121f',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  save: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
    alignItems: 'center',
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontWeight: '600',
  },
  delete: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(193, 18, 31, 0.4)',
    alignItems: 'center',
  },
  deleteText: {
    color: '#c1121f',
    fontWeight: '600',
  },
});

