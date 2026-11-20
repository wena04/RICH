import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ACTION_FOREGROUND,
  CARD_BACKGROUND,
  CONTROL_BACKGROUND,
  DESTRUCTIVE_CORAL,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { RICH_RADIUS, RICH_SPACING, RICH_TYPE } from '@/constants/Design';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { BudgetPickerSheet, ScreenHeader } from '@/components/rich';
import { getDb } from '@/src/db/db';
import {
  assignTransactionToEnvelope,
  getEnvelope,
  getEnvelopeSummaries,
} from '@/src/db/repo/envelopes';
import { getCategoryById, getSubcategoryById } from '@/src/db/repo/categories';
import { listAccounts } from '@/src/db/repo/accounts';
import { deleteTransaction, deleteTransfer, getTransaction, getTransfer } from '@/src/db/repo/transactions';
import type { BudgetEnvelopeSummary, TransactionType } from '@/src/domain/types';
import { centsToCurrencyString } from '@/src/utils/money';

type TransferView = { groupId: string; fromName: string; toName: string };

function titleFor(type: TransactionType, transfer: TransferView | null): string {
  // Original titles: the detail screen is the edit entry point.
  if (transfer) return '账户转账';
  if (type === 'income') return '收入编辑';
  if (type === 'balance_adjustment') return '余额调整';
  return '支出编辑';
}
function deleteLabelFor(type: TransactionType, transfer: TransferView | null): string {
  if (transfer) return '删除该笔转账';
  if (type === 'income') return '删除该笔收入';
  if (type === 'balance_adjustment') return '删除该笔调整';
  return '删除该笔支出';
}

const CHEVRON = require('../../assets/images/ui/icon_right_unfold.png');

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loaded, setLoaded] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amountCents, setAmountCents] = useState(0);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState<string | null>(null);
  const [subcategoryName, setSubcategoryName] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [budgetLabel, setBudgetLabel] = useState('');
  const [budgetEnvelopeId, setBudgetEnvelopeId] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<BudgetEnvelopeSummary[]>([]);
  const [showBudgetPicker, setShowBudgetPicker] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<TransferView | null>(null);

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
      const linked = tx.transferGroupId ? await getTransfer(db, tx.transferGroupId) : null;
      if (linked) {
        const accounts = await listAccounts(db);
        const name = (accountId: string) => accounts.find((a) => a.id === accountId)?.name ?? '账户';
        setTransfer({ groupId: linked.groupId, fromName: name(linked.fromAccountId), toName: name(linked.toAccountId) });
      } else {
        setTransfer(null);
      }
      if (tx.categoryId) {
        const cat = await getCategoryById(db, tx.categoryId);
        setCategoryName(cat?.name ?? '');
        setCategoryIcon(cat?.icon ?? null);
      } else {
        setCategoryName('');
        setCategoryIcon(null);
      }
      setBudgetEnvelopeId(tx.budgetEnvelopeId ?? null);
      if (tx.type === 'expense') {
        // Remaining amounts are shown for the month the expense belongs to.
        const [summaries, assigned] = await Promise.all([
          getEnvelopeSummaries(db, tx.date.slice(0, 7)),
          tx.budgetEnvelopeId ? getEnvelope(db, tx.budgetEnvelopeId) : Promise.resolve(null),
        ]);
        setBudgets(summaries);
        setBudgetLabel(assigned ? `${assigned.icon} ${assigned.name}` : '未归入');
      } else {
        setBudgets([]);
        setBudgetLabel('不适用');
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
    Alert.alert(
      transfer ? '删除这笔转账？' : '删除该记录？',
      transfer ? `${transfer.fromName}和${transfer.toName}的这笔记录都会删除，此操作无法撤销。` : '此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const db = await getDb();
            if (transfer) await deleteTransfer(db, transfer.groupId);
            else await deleteTransaction(db, id);
            router.back();
          },
        },
      ],
    );
  }

  function onEdit() {
    if (transfer) router.push({ pathname: '/transaction/transfer', params: { groupId: transfer.groupId } });
    else router.push(`/transaction/edit/${id}`);
  }

  async function onSelectBudget(envelopeId: string | null) {
    if (envelopeId === budgetEnvelopeId) {
      setShowBudgetPicker(false);
      return;
    }
    setAssigning(true);
    try {
      const db = await getDb();
      await assignTransactionToEnvelope(db, id, envelopeId);
      setShowBudgetPicker(false);
      await load();
    } catch (error) {
      console.error('Failed to assign budget:', error);
      Alert.alert('没有保存', '所属预算没有更新，请稍后再试。');
    } finally {
      setAssigning(false);
    }
  }

  function onCreateBudget() {
    setShowBudgetPicker(false);
    router.push('/budget/create');
  }

  const canAssignBudget = type === 'expense';
  const displayAmount = centsToCurrencyString(Math.abs(amountCents));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />

      <ScreenHeader
        title={titleFor(type, transfer)}
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
            <Image source={require('../../assets/images/ui/icon_warning.png')} style={{ width: 32, height: 32 }} accessible={false} />
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
              onPress={onEdit}
            >
              <View style={styles.iconCircle}>
                <CategoryIcon id={categoryIcon ?? undefined} name={categoryName} size={34} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {note || categoryName || '记录'}
                </Text>
                {transfer ? (
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {transfer.fromName} → {transfer.toName}
                  </Text>
                ) : categoryName ? (
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
              <Image source={CHEVRON} style={styles.chevron} accessible={false} />
            </Pressable>

            <View style={styles.cardDivider} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`所属预算，${budgetLabel}`}
              accessibilityHint={canAssignBudget ? '选择这笔支出归入的预算' : undefined}
              accessibilityState={{ disabled: !canAssignBudget }}
              style={({ pressed }) => [styles.planRow, pressed && styles.controlPressed]}
              disabled={!canAssignBudget}
              onPress={() => setShowBudgetPicker(true)}
            >
              <Text style={styles.planLabel}>所属预算/计划</Text>
              <Text
                numberOfLines={1}
                style={[styles.planValue, budgetEnvelopeId && styles.planValueAssigned]}
              >
                {/* The original leaves the value blank until an expense is assigned. */}
                {budgetEnvelopeId || !canAssignBudget ? budgetLabel : ''}
              </Text>
              {canAssignBudget ? (
                <Image source={CHEVRON} style={styles.chevron} accessible={false} />
              ) : null}
            </Pressable>
          </View>

          <View style={styles.contentSpacer} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={deleteLabelFor(type, transfer)}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
            onPress={onDelete}
          >
            <Text style={styles.deleteText}>{deleteLabelFor(type, transfer)}</Text>
          </Pressable>
        </ScrollView>
      )}

      <BudgetPickerSheet
        visible={showBudgetPicker}
        budgets={budgets}
        selectedId={budgetEnvelopeId}
        saving={assigning}
        onSelect={(envelopeId) => void onSelectBudget(envelopeId)}
        onCreate={onCreateBudget}
        onClose={() => setShowBudgetPicker(false)}
      />
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
    // Original geometry at 3x: 24.3pt side margins, card 16.7pt under the nav bar,
    // delete button 19pt above the home indicator.
    paddingHorizontal: 24.3,
    paddingTop: 16.7,
    paddingBottom: 19,
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
    overflow: 'hidden',
    borderBottomWidth: 2 / 3,
    borderBottomColor: '#EAEAEA',
  },
  row: {
    minHeight: 74.7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 21,
    paddingRight: 5,
    paddingVertical: RICH_SPACING.sm,
  },
  chevron: { width: 28, height: 28 },
  controlPressed: { backgroundColor: CONTROL_BACKGROUND },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  rowInfo: { flex: 1, minWidth: 0, marginRight: RICH_SPACING.xs },
  rowTitle: { fontSize: 15, color: TEXT_PRIMARY },
  rowSub: { fontSize: 12, color: '#777777', marginTop: 7 },
  amount: {
    maxWidth: '43%',
    flexShrink: 1,
    marginRight: 4,
    fontSize: 15,
    color: TEXT_PRIMARY,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  cardDivider: {
    height: 2 / 3,
    backgroundColor: '#EAEAEA',
    marginHorizontal: 16,
  },
  planRow: {
    minHeight: 55.7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 16.7,
    paddingRight: 5,
    paddingVertical: RICH_SPACING.sm,
  },
  planLabel: { fontSize: 13, color: '#777777' },
  planValue: {
    ...RICH_TYPE.amount,
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: TEXT_SECONDARY,
    textAlign: 'right',
  },
  planValueAssigned: { color: TEXT_PRIMARY, fontWeight: '600' },
  contentSpacer: { flexGrow: 1, minHeight: RICH_SPACING.xl },
  deleteButton: {
    minHeight: 56,
    backgroundColor: DESTRUCTIVE_CORAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePressed: { opacity: 0.82 },
  deleteText: { color: ACTION_FOREGROUND, fontSize: 16 },
});
