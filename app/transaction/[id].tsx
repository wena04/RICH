import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Text,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import {
  ACTION_FOREGROUND,
  BORDER_COLOR,
  CARD_BACKGROUND,
  CONTROL_BACKGROUND,
  DESTRUCTIVE_CORAL,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { RICH_RADIUS, RICH_SPACING, RICH_TYPE } from '@/constants/Design';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ScreenHeader } from '@/components/rich';
import { getDb } from '@/src/db/db';
import { getBudgetSummary } from '@/src/db/repo/budgets';
import { listAccounts } from '@/src/db/repo/accounts';
import { getCategoryById, getSubcategoryById } from '@/src/db/repo/categories';
import { deleteTransaction, getTransaction } from '@/src/db/repo/transactions';
import type { TransactionType } from '@/src/domain/types';
import { centsToCurrencyString } from '@/src/utils/money';
import { formatIsoDateCN } from '@/src/utils/date';

function titleFor(type: TransactionType): string {
  if (type === 'income') return '收入详情';
  if (type === 'balance_adjustment') return '余额调整';
  return '支出详情';
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
  const [subcategoryName, setSubcategoryName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [period, setPeriod] = useState('');
  const [budgetStatus, setBudgetStatus] = useState('未设置');
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoaded(false);
    setLoadError(null);
    try {
      const db = await getDb();
      const tx = await getTransaction(db, id);
      if (!tx) {
        setLoadError('找不到这笔记录，它可能已经被删除。');
        return;
      }
      setType(tx.type);
      setAmountCents(tx.amountCents);
      setNote(tx.note);
      setDate(tx.date);
      const accounts = await listAccounts(db);
      setAccountName(accounts.find((account) => account.id === tx.accountId)?.name ?? '未知账户');
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
      if (tx.subcategoryId) {
        const subcategory = await getSubcategoryById(db, tx.subcategoryId);
        setSubcategoryName(subcategory?.name ?? '');
      } else {
        setSubcategoryName('');
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '读取记录失败，请稍后重试。');
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function onDelete() {
    Alert.alert('删除该记录？', '此操作无法撤销。', [
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

      {!loaded ? (
        <View style={styles.stateCanvas}>
          <View style={styles.stateCard}>
            <ActivityIndicator color={PRIMARY_GREEN} />
            <Text style={styles.stateTitle}>正在读取记录</Text>
          </View>
        </View>
      ) : loadError ? (
        <View style={styles.stateCanvas}>
          <View style={styles.stateCard}>
            <FontAwesome name="exclamation-circle" size={22} color={TEXT_SECONDARY} />
            <Text style={styles.stateTitle}>无法显示这笔记录</Text>
            <Text style={styles.stateBody}>{loadError}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="重新读取记录"
              onPress={() => load()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.controlPressed]}
            >
              <Text style={styles.retryText}>重新读取</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`编辑这笔记录，金额 ¥${displayAmount}`}
              style={({ pressed }) => [styles.row, pressed && styles.controlPressed]}
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
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {subcategoryName ? `${categoryName} › ${subcategoryName}` : categoryName}
                  </Text>
                ) : null}
              </View>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                numberOfLines={1}
                style={styles.amount}
              >
                ¥ {displayAmount}
              </Text>
              <FontAwesome name="chevron-right" size={14} color={TEXT_SECONDARY} />
            </Pressable>

            <View style={styles.cardDivider} />

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>日期</Text>
                <Text style={styles.metaValue}>{date ? formatIsoDateCN(date) : '—'}</Text>
              </View>
              <View style={styles.metaRule} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>账户</Text>
                <Text style={styles.metaValue} numberOfLines={1}>{accountName}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`查看所属预算，${budgetStatus}`}
              accessibilityState={{
                disabled: type !== 'expense' || !categoryId || !period,
              }}
              style={({ pressed }) => [styles.planRow, pressed && styles.controlPressed]}
              disabled={type !== 'expense' || !categoryId || !period}
              onPress={() =>
                router.push({ pathname: '/budget/edit', params: { period } })
              }
            >
              <Text style={styles.planLabel}>所属预算/计划</Text>
              <Text numberOfLines={1} style={styles.planValue}>{budgetStatus}</Text>
              {type === 'expense' && categoryId ? (
                <FontAwesome name="chevron-right" size={14} color={TEXT_SECONDARY} />
              ) : null}
            </Pressable>
          </View>

          <View style={styles.contentSpacer} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={deleteLabelFor(type)}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
            onPress={onDelete}
          >
            <FontAwesome name="trash-o" size={15} color={ACTION_FOREGROUND} />
            <Text style={styles.deleteText}>{deleteLabelFor(type)}</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  scroll: { flex: 1, backgroundColor: PRIMARY_GREEN },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: RICH_SPACING.md,
    paddingTop: RICH_SPACING.sm,
    paddingBottom: RICH_SPACING.xl,
  },
  stateCanvas: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    padding: RICH_SPACING.md,
  },
  stateCard: {
    minHeight: 150,
    padding: RICH_SPACING.xl,
    gap: RICH_SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BACKGROUND,
    borderRadius: RICH_RADIUS.card,
  },
  stateTitle: { ...RICH_TYPE.sectionTitle, color: TEXT_PRIMARY, textAlign: 'center' },
  stateBody: {
    ...RICH_TYPE.body,
    color: TEXT_SECONDARY,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 112,
    minHeight: 44,
    marginTop: RICH_SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEXT_PRIMARY,
    borderRadius: RICH_RADIUS.control,
  },
  retryText: { ...RICH_TYPE.body, color: ACTION_FOREGROUND, fontWeight: '600' },
  card: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: RICH_RADIUS.card,
    overflow: 'hidden',
  },
  row: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RICH_SPACING.md,
    paddingVertical: RICH_SPACING.sm,
  },
  controlPressed: { backgroundColor: CONTROL_BACKGROUND },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CONTROL_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RICH_SPACING.sm,
  },
  rowInfo: { flex: 1, minWidth: 0, marginRight: RICH_SPACING.xs },
  rowTitle: { fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY },
  rowSub: { ...RICH_TYPE.label, color: TEXT_SECONDARY, marginTop: 3 },
  amount: {
    ...RICH_TYPE.amount,
    maxWidth: '43%',
    flexShrink: 1,
    marginRight: RICH_SPACING.xs,
    fontSize: 16,
    color: TEXT_PRIMARY,
    textAlign: 'right',
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER_COLOR,
    marginHorizontal: RICH_SPACING.md,
  },
  metaGrid: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RICH_SPACING.md,
  },
  metaItem: { flex: 1, minWidth: 0, gap: RICH_SPACING.xxs },
  metaRule: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: BORDER_COLOR,
    marginHorizontal: RICH_SPACING.md,
  },
  metaLabel: { ...RICH_TYPE.caption, color: TEXT_SECONDARY },
  metaValue: { ...RICH_TYPE.amount, fontSize: 13, color: TEXT_PRIMARY },
  planRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RICH_SPACING.xs,
    paddingHorizontal: RICH_SPACING.md,
    paddingVertical: RICH_SPACING.sm,
  },
  planLabel: { ...RICH_TYPE.body, color: TEXT_SECONDARY },
  planValue: {
    ...RICH_TYPE.amount,
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: TEXT_SECONDARY,
    textAlign: 'right',
  },
  contentSpacer: { flexGrow: 1, minHeight: RICH_SPACING.xl },
  deleteButton: {
    minHeight: 48,
    flexDirection: 'row',
    gap: RICH_SPACING.xs,
    backgroundColor: DESTRUCTIVE_CORAL,
    borderRadius: RICH_RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePressed: { opacity: 0.82 },
  deleteText: { color: ACTION_FOREGROUND, fontSize: 15, fontWeight: '600' },
});
