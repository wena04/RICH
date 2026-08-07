import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Text,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY, EXPENSE_RED } from '@/constants/Colors';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ScreenHeader } from '@/components/rich';
import { getDb } from '@/src/db/db';
import { getBudgetSummary } from '@/src/db/repo/budgets';
import { getCategoryById } from '@/src/db/repo/categories';
import { deleteTransaction, getTransaction } from '@/src/db/repo/transactions';
import type { TransactionType } from '@/src/domain/types';
import { centsToCurrencyString } from '@/src/utils/money';

function titleFor(type: TransactionType): string {
  if (type === 'income') return '收入编辑';
  if (type === 'balance_adjustment') return '余额调整';
  return '支出编辑';
}
function deleteLabelFor(type: TransactionType): string {
  if (type === 'income') return '删除该笔收入';
  if (type === 'balance_adjustment') return '删除该笔调整';
  return '删除该笔支出';
}

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loaded, setLoaded] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amountCents, setAmountCents] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [period, setPeriod] = useState('');
  const [budgetStatus, setBudgetStatus] = useState('未设置');

  const load = useCallback(async () => {
    setLoaded(false);
      const db = await getDb();
      const tx = await getTransaction(db, id);
      if (!tx) {
        setLoaded(true);
        return;
      }
      setType(tx.type);
      setAmountCents(tx.amountCents);
      setNote(tx.note);
      setCategoryId(tx.categoryId);
      const transactionPeriod = tx.date.slice(0, 7);
      setPeriod(transactionPeriod);
      if (tx.categoryId) {
        const cat = await getCategoryById(db, tx.categoryId);
        setCategoryName(cat?.name ?? '');
        setCategoryIcon(cat?.icon ?? null);
        if (tx.type === 'expense') {
          const summary = await getBudgetSummary(db, transactionPeriod);
          const status = summary?.categories.find((item) => item.categoryId === tx.categoryId);
          setBudgetStatus(
            status
              ? `¥${centsToCurrencyString(status.spentCents)} / ¥${centsToCurrencyString(status.limitCents)}`
              : '未设置',
          );
        } else {
          setBudgetStatus('不适用');
        }
      } else {
        setCategoryName('');
        setCategoryIcon(null);
        setBudgetStatus('不适用');
      }
      setLoaded(true);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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

  const displayAmount = centsToCurrencyString(Math.abs(amountCents));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />

      <ScreenHeader
        title={titleFor(type)}
        onBack={() => router.back()}
        backgroundColor={PRIMARY_GREEN}
      />

      {loaded && (
        <>
          {/* Detail card */}
          <View style={styles.card}>
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/transaction/edit/${id}`)}
            >
              <View style={styles.iconCircle}>
                <CategoryIcon id={categoryIcon ?? undefined} name={categoryName} size={22} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {note || categoryName || '记录'}
                </Text>
                {categoryName ? (
                  <Text style={styles.rowSub}>{categoryName}</Text>
                ) : null}
              </View>
              <Text style={styles.amount}>¥ {displayAmount}</Text>
              <FontAwesome name="chevron-right" size={14} color={TEXT_SECONDARY} />
            </Pressable>

            <View style={styles.cardDivider} />

            <Pressable
              style={styles.row}
              disabled={type !== 'expense' || !categoryId || !period}
              onPress={() =>
                router.push({ pathname: '/budget/edit', params: { period } })
              }
            >
              <Text style={styles.planLabel}>所属预算/计划</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.planValue}>{budgetStatus}</Text>
              {type === 'expense' && categoryId ? (
                <FontAwesome name="chevron-right" size={14} color={TEXT_SECONDARY} />
              ) : null}
            </Pressable>
          </View>

          {/* Spacer + delete */}
          <View style={{ flex: 1 }} />
          <Pressable style={styles.deleteButton} onPress={onDelete}>
            <FontAwesome name="trash-o" size={15} color="#FFFFFF" />
            <Text style={styles.deleteText}>{deleteLabelFor(type)}</Text>
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY },
  rowSub: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 3 },
  amount: { fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginRight: 8 },
  cardDivider: { height: 1, backgroundColor: '#EFEFEF', marginHorizontal: 16 },
  planLabel: { fontSize: 14, color: TEXT_SECONDARY },
  planValue: { fontSize: 12, color: TEXT_SECONDARY, marginRight: 8 },

  deleteButton: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: EXPENSE_RED,
    borderRadius: 0,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
