import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  SectionList,
  StatusBar,
  StyleSheet,
} from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { ScreenHeader } from '@/components/rich';
import { Text, View } from '@/components/Themed';
import {
  ACCESSIBLE_GREEN,
  CARD_BACKGROUND,
  CONTROL_BACKGROUND,
  EXPENSE_RED,
  INCOME_TEXT_GREEN,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import { listTransactions, type TransactionListItem } from '@/src/db/repo/transactions';
import { formatIsoDateCN } from '@/src/utils/date';
import { centsToYuan } from '@/src/utils/money';

type Section = {
  title: string;
  data: TransactionListItem[];
  totals: { expenseCents: number; incomeCents: number };
};

function transactionLabel(item: TransactionListItem): string {
  if (item.type === 'balance_adjustment') return '余额调整';
  if (item.subcategory?.name) {
    return `${item.category?.name ?? '分类'} › ${item.subcategory.name}`;
  }
  return item.category?.name ?? '未分类';
}

function signedAmount(item: TransactionListItem): { sign: string; color: string; cents: number } {
  if (item.type === 'expense') {
    return { sign: '−', color: TEXT_PRIMARY, cents: Math.abs(item.amountCents) };
  }
  if (item.type === 'income') {
    return { sign: '+', color: INCOME_TEXT_GREEN, cents: Math.abs(item.amountCents) };
  }
  return item.amountCents < 0
    ? { sign: '−', color: EXPENSE_RED, cents: Math.abs(item.amountCents) }
    : { sign: '+', color: ACCESSIBLE_GREEN, cents: Math.abs(item.amountCents) };
}

export default function TransactionsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<TransactionListItem[] | null>(null);
  const [error, setError] = useState('');
  const loadRequestRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setError('');
    setItems(null);
    try {
      const db = await getDb();
      const rows = await listTransactions(db);
      if (requestId === loadRequestRef.current) setItems(rows);
    } catch (loadError) {
      console.error('Failed to load transactions:', loadError);
      if (requestId !== loadRequestRef.current) return;
      setItems([]);
      setError('没有载入账单，请重新试一次。');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        loadRequestRef.current += 1;
      };
    }, [refresh]),
  );

  const sections: Section[] = useMemo(() => {
    const byDate = new Map<string, TransactionListItem[]>();
    for (const transaction of items ?? []) {
      const rows = byDate.get(transaction.date) ?? [];
      rows.push(transaction);
      byDate.set(transaction.date, rows);
    }

    return Array.from(byDate.entries()).map(([date, data]) => {
      let expenseCents = 0;
      let incomeCents = 0;
      for (const transaction of data) {
        if (transaction.type === 'expense') expenseCents += transaction.amountCents;
        if (transaction.type === 'income') incomeCents += transaction.amountCents;
      }
      return { title: date, data, totals: { expenseCents, incomeCents } };
    });
  }, [items]);

  const addButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="记一笔"
      onPress={() => router.push('/transaction/new')}
      style={({ pressed }) => [styles.headerAction, pressed && styles.controlPressed]}
    >
      <FontAwesome name="plus" size={17} color={TEXT_PRIMARY} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={CARD_BACKGROUND} />
      <ScreenHeader
        title="全部账单"
        subtitle={items ? `${items.length} 笔记录` : '正在读取'}
        onBack={() => router.back()}
        right={addButton}
        borderBottom
      />

      {items == null ? (
        <View style={styles.stateCanvas}>
          <ActivityIndicator color={PRIMARY_GREEN} />
          <Text style={styles.stateTitle}>正在载入账单</Text>
        </View>
      ) : error ? (
        <View style={styles.stateCanvas}>
          <View style={styles.stateMark}>
            <FontAwesome name="exclamation" size={14} color={TEXT_PRIMARY} />
          </View>
          <Text style={styles.stateTitle}>账单暂时没有载入</Text>
          <Text style={styles.stateBody}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void refresh()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.controlPressed]}
          >
            <Text style={styles.retryText}>重新载入</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.stateCanvas}>
          <View style={styles.emptyIcon}>
            <FontAwesome name="file-text-o" size={22} color={TEXT_PRIMARY} />
          </View>
          <Text style={styles.stateTitle}>还没有账单</Text>
          <Text style={styles.stateBody}>记下第一笔之后，每天的收支会整理在这里。</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/transaction/new')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
          >
            <Text style={styles.primaryText}>+ 记第一笔</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{formatIsoDateCN(section.title)}</Text>
              <View style={styles.sectionTotals}>
                <Text style={styles.expenseTotal}>支 ¥{centsToYuan(section.totals.expenseCents)}</Text>
                <Text style={styles.incomeTotal}>收 ¥{centsToYuan(section.totals.incomeCents)}</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => {
            const label = transactionLabel(item);
            const amount = signedAmount(item);
            const title = item.note?.trim() || label;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${title}，${amount.sign}${centsToYuan(amount.cents)}元`}
                onPress={() =>
                  router.push({ pathname: '/transaction/[id]', params: { id: item.id } })
                }
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.iconCircle}>
                  <CategoryIcon
                    id={item.category?.icon ?? (item.type === 'balance_adjustment' ? 'wallet' : undefined)}
                    name={item.category?.name ?? label}
                    size={21}
                  />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {label} · {item.account.name}
                  </Text>
                </View>
                <Text style={[styles.rowAmount, { color: amount.color }]}>
                  {amount.sign}¥{centsToYuan(amount.cents)}
                </Text>
                <FontAwesome name="chevron-right" size={10} color={TEXT_SECONDARY} />
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CARD_BACKGROUND },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPressed: { backgroundColor: CONTROL_BACKGROUND },
  stateCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F6F8F7',
  },
  stateMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DFF2EA',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_GREEN,
  },
  stateTitle: { marginTop: 14, fontSize: 17, fontWeight: '700', color: TEXT_PRIMARY },
  stateBody: {
    maxWidth: 280,
    marginTop: 7,
    fontSize: 12,
    lineHeight: 19,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 112,
    minHeight: 44,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEXT_PRIMARY,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  primaryButton: {
    minWidth: 180,
    minHeight: 48,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEXT_PRIMARY,
  },
  primaryPressed: { opacity: 0.82 },
  primaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  listContent: { paddingBottom: 36, backgroundColor: '#F6F8F7' },
  sectionHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#F2F5F3',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E1E7E3',
  },
  sectionTitle: { fontSize: 12.5, fontWeight: '700', color: TEXT_PRIMARY },
  sectionTotals: { flexDirection: 'row', gap: 10, backgroundColor: 'transparent' },
  expenseTotal: { fontSize: 9.5, color: TEXT_SECONDARY, fontVariant: ['tabular-nums'] },
  incomeTotal: { fontSize: 9.5, color: INCOME_TEXT_GREEN, fontVariant: ['tabular-nums'] },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 11,
    backgroundColor: CARD_BACKGROUND,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEFEC',
  },
  rowPressed: { backgroundColor: CONTROL_BACKGROUND },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F5',
  },
  rowCopy: { flex: 1, minWidth: 0, backgroundColor: 'transparent' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  rowMeta: { marginTop: 4, fontSize: 10.5, color: TEXT_SECONDARY },
  rowAmount: {
    maxWidth: 112,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
