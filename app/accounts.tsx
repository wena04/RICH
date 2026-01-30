import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getDb } from '@/src/db/db';
import {
  canDeleteAccount,
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
} from '@/src/db/repo/accounts';
import type { Account, AccountType } from '@/src/domain/types';

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('cash');

  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<AccountType>('cash');

  const selected = useMemo(
    () => accounts.find((a) => a.id === selectedId) ?? null,
    [accounts, selectedId]
  );

  const refresh = useCallback(async () => {
    const db = await getDb();
    const rows = await listAccounts(db);
    setAccounts(rows);
    if (selectedId && !rows.some((a) => a.id === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  function select(a: Account) {
    setSelectedId(a.id);
    setEditName(a.name);
    setEditType(a.type);
  }

  async function onCreate() {
    const name = newName.trim();
    if (!name) return;
    const db = await getDb();
    await createAccount(db, { name, type: newType });
    setNewName('');
    await refresh();
  }

  async function onSaveEdit() {
    if (!selected) return;
    const name = editName.trim();
    if (!name) return;
    const db = await getDb();
    await updateAccount(db, { id: selected.id, name, type: editType });
    await refresh();
  }

  async function onDeleteSelected() {
    if (!selected) return;
    const db = await getDb();
    const ok = await canDeleteAccount(db, selected.id);
    if (!ok) {
      Alert.alert('Cannot delete account', 'This account is referenced by existing transactions.');
      return;
    }
    Alert.alert('Delete account?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const db2 = await getDb();
          await deleteAccount(db2, selected.id);
          setSelectedId(null);
          await refresh();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accounts</Text>
      <Text style={styles.subtitle}>
        Create accounts (cash/bank/credit/stored value/investment). Each transaction belongs to one
        account.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Existing</Text>
        {accounts.length === 0 ? (
          <Text>No accounts yet.</Text>
        ) : (
          <View style={styles.list}>
            {accounts.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => select(a)}
                style={[styles.row, a.id === selectedId && styles.rowActive]}>
                <Text style={styles.rowName}>{a.name}</Text>
                <Text style={styles.rowMeta}>{a.type}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {selected ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Edit</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput value={editName} onChangeText={setEditName} style={styles.input} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.chips}>
              {(['cash', 'bank', 'credit', 'stored_value', 'investment'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setEditType(t)}
                  style={[styles.chip, t === editType && styles.chipActive]}>
                  <Text style={styles.chipText}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onSaveEdit} style={styles.primary}>
              <Text style={styles.primaryText}>Save</Text>
            </Pressable>
            <Pressable onPress={onDeleteSelected} style={styles.danger}>
              <Text style={styles.dangerText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add new</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g. Cash"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.chips}>
            {(['cash', 'bank', 'credit', 'stored_value', 'investment'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setNewType(t)}
                style={[styles.chip, t === newType && styles.chipActive]}>
                <Text style={styles.chipText}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={onCreate} style={styles.primary} disabled={!newName.trim()}>
          <Text style={styles.primaryText}>Create</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  cardTitle: {
    fontWeight: '700',
  },
  list: {
    gap: 6,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowActive: {
    borderColor: 'rgba(127,127,127,0.8)',
  },
  rowName: {
    fontWeight: '600',
  },
  rowMeta: {
    opacity: 0.7,
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
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
    alignItems: 'center',
  },
  primaryText: {
    fontWeight: '600',
  },
  danger: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(193, 18, 31, 0.4)',
    alignItems: 'center',
  },
  dangerText: {
    color: '#c1121f',
    fontWeight: '600',
  },
});

