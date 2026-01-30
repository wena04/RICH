import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getDb } from '@/src/db/db';
import { getLastUsedAccountId, listAccounts } from '@/src/db/repo/accounts';
import { ensureCategory, ensureSubcategory } from '@/src/db/repo/categories';
import { createTransaction } from '@/src/db/repo/transactions';
import type { Account, TransactionType } from '@/src/domain/types';
import { isIsoDate, isoDateToday } from '@/src/utils/date';
import { newId } from '@/src/utils/id';
import { parseCurrencyToCents } from '@/src/utils/money';

export default function NewTransactionScreen() {
  const router = useRouter();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(isoDateToday());
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
      const last = await getLastUsedAccountId(db);
      const chosen = last && list.some((a) => a.id === last) ? last : list[0]?.id ?? '';
      setAccountId(chosen);
    })();
  }, []);

  useEffect(() => {
    // Clear category fields when switching to balance adjustment.
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

      await createTransaction(db, {
        id: newId('txn'),
        type,
        amountCents: type === 'balance_adjustment' ? cents : Math.abs(cents),
        date,
        accountId,
        categoryId,
        subcategoryId,
        note: note.trim() ? note.trim().slice(0, 100) : null,
      });

      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add transaction</Text>

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
          autoFocus
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

      <Pressable onPress={onSave} disabled={saving} style={[styles.save, saving && styles.saveDisabled]}>
        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
      </Pressable>
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
  save: {
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
});

