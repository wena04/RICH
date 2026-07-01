import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { getDb } from '@/src/db/db';
import { getCategoryBudgetStatus } from '@/src/db/repo/budgets';
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
  const [categoryName, setCategoryName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [txDate, setTxDate] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [budgetLabel, setBudgetLabel] = useState('未设置');

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const tx = await getTransaction(db, id);
      if (!tx) {
        setLoaded(true);
        return;
      }
      setType(tx.type);
      setAmountCents(tx.amountCents);
      setNote(tx.note);
      setTxDate(tx.date);
      setCategoryId(tx.categoryId);
      if (tx.categoryId) {
        const cat = await getCategoryById(db, tx.categoryId);
        setCategoryName(cat?.name ?? '');
        const period = tx.date.slice(0, 7);
        const status = await getCategoryBudgetStatus(db, period, tx.categoryId);
        if (status) {
          setBudgetLabel(`¥${centsToCurrencyString(status.spentCents)} / ¥${centsToCurrencyString(status.limitCents)}`);
        } else {
          setBudgetLabel('未设置');
        }
      } else {
        setBudgetLabel('—');
      }
      setLoaded(true);
    })();
  }, [id]);

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

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={18} color={TEXT_PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle}>{titleFor(type)}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loaded && (
        <>
          {/* Detail card */}
          <View style={styles.card}>
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/transaction/edit/${id}`)}
            >
              <View style={styles.iconCircle}>
                <CategoryIcon name={categoryName} size={22} />
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
              onPress={() => {
                if (categoryId && txDate) {
                  router.push(`/budget/edit?period=${txDate.slice(0, 7)}` as Href);
                }
              }}
            >
              <Text style={styles.planLabel}>所属预算/计划</Text>
              <Text style={styles.planValue}>{budgetLabel}</Text>
              <FontAwesome name="chevron-right" size={14} color={TEXT_SECONDARY} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: TEXT_PRIMARY },

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
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
  planValue: { fontSize: 14, color: TEXT_PRIMARY, marginRight: 8 },

  deleteButton: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: EXPENSE_RED,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
