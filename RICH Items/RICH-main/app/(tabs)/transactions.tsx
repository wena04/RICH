import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getDb } from '@/src/db/db';
import { listTransactions, type TransactionListItem } from '@/src/db/repo/transactions';
import { centsToCurrencyString } from '@/src/utils/money';

type Section = {
  title: string; // date
  data: TransactionListItem[];
  totals: { expenseCents: number; incomeCents: number };
};

export default function TransactionsScreen() {
  const [items, setItems] = useState<TransactionListItem[] | null>(null);

  const refresh = useCallback(async () => {
    const db = await getDb();
    const rows = await listTransactions(db);
    setItems(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const sections: Section[] = useMemo(() => {
    const rows = items ?? [];
    const byDate = new Map<string, TransactionListItem[]>();
    for (const r of rows) {
      const arr = byDate.get(r.date) ?? [];
      arr.push(r);
      byDate.set(r.date, arr);
    }
    return Array.from(byDate.entries()).map(([date, data]) => {
      let expenseCents = 0;
      let incomeCents = 0;
      for (const t of data) {
        if (t.type === 'expense') expenseCents += t.amountCents;
        if (t.type === 'income') incomeCents += t.amountCents;
      }
      return { title: date, data, totals: { expenseCents, incomeCents } };
    });
  }, [items]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Transactions</Text>
        <Link href="/transaction/new">Add</Link>
      </View>
      <Text style={styles.subtitle}>Local-only. No cloud sync. No analytics.</Text>

      {items && items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Link href="/transaction/new">Add your first transaction</Link>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionTotals}>
                -¥{centsToCurrencyString(section.totals.expenseCents)}  +¥
                {centsToCurrencyString(section.totals.incomeCents)}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const label =
              item.type === 'balance_adjustment'
                ? 'Balance adjustment'
                : item.subcategory?.name
                  ? `${item.category?.name} · ${item.subcategory.name}`
                  : item.category?.name ?? '(no category)';

            const signedCents =
              item.type === 'expense' ? -item.amountCents : item.type === 'income' ? item.amountCents : item.amountCents;

            return (
              <Link href={{ pathname: '/transaction/[id]', params: { id: item.id } }} asChild>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowTitle}>{item.note?.trim() ? item.note : label}</Text>
                    <Text style={styles.rowMeta}>
                      {label} · {item.account.name}
                    </Text>
                  </View>
                  <Text style={styles.rowAmount}>
                    {signedCents < 0 ? '-' : '+'}¥{centsToCurrencyString(Math.abs(signedCents))}
                  </Text>
                </View>
              </Link>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.8,
  },
  empty: {
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  emptyTitle: {
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionTotals: {
    opacity: 0.75,
    fontSize: 12,
  },
  row: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontWeight: '600',
  },
  rowMeta: {
    opacity: 0.7,
    fontSize: 12,
  },
  rowAmount: {
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
});

