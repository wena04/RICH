import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  useWindowDimensions,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { AssetGoalIllustration, ScreenHeader } from '@/components/rich';
import { Text, View } from '@/components/Themed';
import {
  ACCESSIBLE_GREEN,
  ACTION_BACKGROUND,
  ACTION_FOREGROUND,
  BORDER_COLOR,
  CARD_BACKGROUND,
  CONTROL_BACKGROUND,
  CONTROL_PRESSED_BACKGROUND,
  DESTRUCTIVE_CORAL,
  DESTRUCTIVE_TEXT,
  PRIMARY_GREEN,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
import { RICH_RADIUS, RICH_SIZE, RICH_SPACING, RICH_TYPE } from '@/constants/Design';
import { getDb } from '@/src/db/db';
import {
  canDeleteAccount,
  createAccount,
  deleteAccount,
  listAccountsWithBalances,
  updateAccount,
  type AccountWithBalance,
} from '@/src/db/repo/accounts';
import type { AccountType } from '@/src/domain/types';
import { getMeta, setMeta } from '@/src/db/repo/meta';
import { centsToYuan, parseCurrencyToCents } from '@/src/utils/money';

type LoadState = 'loading' | 'refreshing' | 'ready' | 'error';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: '资金账户',
  bank: '资金账户',
  credit: '信用账户',
  stored_value: '储值账户',
  investment: '储值账户',
};

const ACCOUNT_TYPE_CN: Record<AccountType, string> = {
  cash: '现金',
  bank: '银行卡',
  credit: '信用卡',
  stored_value: '储值卡',
  investment: '投资',
};

const ACCOUNT_ICONS: Record<AccountType, string> = {
  cash: 'money',
  bank: 'bank',
  credit: 'credit-card',
  stored_value: 'ticket',
  investment: 'line-chart',
};

const ICON_COLORS: Record<AccountType, string> = {
  cash: ACCESSIBLE_GREEN,
  bank: '#5277C7',
  credit: '#B86B12',
  stored_value: '#7159C7',
  investment: '#147D78',
};

const ACCOUNT_TYPES: AccountType[] = [
  'cash',
  'bank',
  'credit',
  'stored_value',
  'investment',
];

function formatCurrency(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  return `${sign}¥${centsToYuan(Math.abs(cents))}`;
}

export default function AccountsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const illustrationWidth = Math.min(146, Math.max(108, Math.round(width * 0.34)));
  const illustrationHeight = Math.round(illustrationWidth * (182 / 146));
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState('');
  const loadRequestRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountWithBalance | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('cash');

  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<AccountType>('cash');

  // Savings goal (目标资产), persisted in app_meta.
  const [goalCents, setGoalCents] = useState(1000000);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goalError, setGoalError] = useState('');

  // Group accounts by category
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, AccountWithBalance[]> = {
      '资金账户': [],
      '信用账户': [],
      '储值账户': [],
    };

    accounts.forEach(acc => {
      const groupName = ACCOUNT_TYPE_LABELS[acc.type];
      if (groups[groupName]) {
        groups[groupName].push(acc);
      }
    });

    return groups;
  }, [accounts]);

  const groupTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(groupedAccounts).forEach(([group, accs]) => {
      totals[group] = accs.reduce((sum, a) => sum + a.balanceCents, 0);
    });
    return totals;
  }, [groupedAccounts]);

  const totalAssets = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.balanceCents, 0);
  }, [accounts]);

  const goalPct =
    goalCents > 0 ? Math.min(100, Math.round((totalAssets / goalCents) * 100)) : 0;

  function onEditGoal() {
    setGoalInput(String(Math.round(goalCents / 100)));
    setGoalError('');
    setShowGoalModal(true);
  }

  async function onSaveGoal() {
    if (isSaving) return;
    const cents = parseCurrencyToCents(goalInput);
    if (cents == null || cents < 0 || !Number.isSafeInteger(cents)) {
      setGoalError('请输入不小于 0、最多两位小数的有效金额');
      return;
    }

    setIsSaving(true);
    try {
      setGoalCents(cents);
      const db = await getDb();
      await setMeta(db, 'asset_goal_cents', String(cents));
      setShowGoalModal(false);
    } catch {
      Alert.alert('目标没有保存', '请稍后重试。');
    } finally {
      setIsSaving(false);
    }
  }

  function onTransfer() {
    router.push('/transaction/transfer');
  }

  const refresh = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setLoadState(hasLoadedRef.current ? 'refreshing' : 'loading');
    setLoadError('');

    try {
      const db = await getDb();
      const rows = await listAccountsWithBalances(db);
      const g = await getMeta(db, 'asset_goal_cents');
      if (requestId !== loadRequestRef.current) return;

      setAccounts(rows);
      if (g != null) setGoalCents(parseInt(g, 10) || 0);
      hasLoadedRef.current = true;
      setLoadState('ready');
    } catch {
      if (requestId !== loadRequestRef.current) return;
      setLoadError('账户数据暂时无法读取，请重新加载。');
      setLoadState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        loadRequestRef.current += 1;
      };
    }, [refresh])
  );

  function openEdit(account: AccountWithBalance) {
    setSelectedAccount(account);
    setEditName(account.name);
    setEditType(account.type);
    setShowEditModal(true);
  }

  async function onCreate() {
    const name = newName.trim();
    if (!name || isSaving) return;
    setIsSaving(true);
    try {
      const db = await getDb();
      await createAccount(db, { name, type: newType });
      setNewName('');
      setNewType('cash');
      setShowAddModal(false);
      await refresh();
    } catch {
      Alert.alert('账户没有添加', '请检查名称后重试。');
    } finally {
      setIsSaving(false);
    }
  }

  async function onSaveEdit() {
    if (!selectedAccount) return;
    const name = editName.trim();
    if (!name || isSaving) return;
    setIsSaving(true);
    try {
      const db = await getDb();
      await updateAccount(db, { id: selectedAccount.id, name, type: editType });
      setShowEditModal(false);
      setSelectedAccount(null);
      await refresh();
    } catch {
      Alert.alert('账户没有保存', '请检查名称后重试。');
    } finally {
      setIsSaving(false);
    }
  }

  async function onDeleteSelected() {
    if (!selectedAccount) return;
    try {
      const db = await getDb();
      const ok = await canDeleteAccount(db, selectedAccount.id);
      if (!ok) {
        Alert.alert('无法删除', '该账户已关联交易记录');
        return;
      }
      Alert.alert('删除账户？', '此操作无法撤销', [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const db2 = await getDb();
              await deleteAccount(db2, selectedAccount.id);
              setShowEditModal(false);
              setSelectedAccount(null);
              await refresh();
            } catch {
              Alert.alert('账户没有删除', '请稍后重试。');
            }
          },
        },
      ]);
    } catch {
      Alert.alert('暂时无法检查账户', '请稍后重试。');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      
      <ScreenHeader title="资产管理" onBack={() => router.back()} backgroundColor={PRIMARY_GREEN} />

      <View style={[styles.assetSummary, compact && styles.assetSummaryCompact]}>
        <AssetGoalIllustration
          progress={goalPct}
          width={illustrationWidth}
          height={illustrationHeight}
        />
        <View style={styles.assetInfo}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`编辑目标资产，当前${centsToYuan(goalCents)}元`}
            style={({ pressed }) => [styles.goalRow, pressed && styles.controlPressed]}
            onPress={onEditGoal}
          >
            <View style={styles.goalCopy}>
              <View style={styles.goalFlag} />
              <Text numberOfLines={1} style={styles.goalLabel}>目标资产</Text>
            </View>
            <FontAwesome name="pencil" size={12} color={TEXT_PRIMARY} />
          </Pressable>
          <Text numberOfLines={1} style={styles.goalAmount}>¥{centsToYuan(goalCents)}</Text>
          <Text style={styles.totalLabel}>已有总资产</Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            style={styles.totalValue}
          >
            {formatCurrency(totalAssets)}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadState === 'refreshing'}
            onRefresh={() => void refresh()}
            tintColor={TEXT_PRIMARY}
          />
        }
      >
        {loadState === 'loading' ? (
          <View style={styles.statePanel}>
            <ActivityIndicator color={ACCESSIBLE_GREEN} />
            <Text style={styles.stateTitle}>正在读取账户</Text>
            <Text style={styles.stateBody}>正在核对余额与目标资产</Text>
          </View>
        ) : loadState === 'error' && !accounts.length ? (
          <View style={styles.statePanel}>
            <View style={styles.stateMark}>
              <FontAwesome name="exclamation" size={14} color={TEXT_PRIMARY} />
            </View>
            <Text style={styles.stateTitle}>账户暂时没有载入</Text>
            <Text style={styles.stateBody}>{loadError}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void refresh()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.controlPressed]}
            >
              <Text style={styles.retryText}>重新载入</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {loadState === 'error' ? (
              <View accessibilityRole="alert" style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{loadError}</Text>
                <Pressable accessibilityRole="button" onPress={() => void refresh()} style={styles.errorRetry}>
                  <Text style={styles.errorRetryText}>重试</Text>
                </Pressable>
              </View>
            ) : null}

            {Object.entries(groupedAccounts).map(([groupName, groupAccounts]) => (
              <View key={groupName} style={styles.accountGroup}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupCopy}>
                    <Text style={styles.groupName}>{groupName}</Text>
                    <Text numberOfLines={1} style={styles.groupTotal}>
                      {formatCurrency(groupTotals[groupName] ?? 0)}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`向${groupName}添加账户`}
                    style={({ pressed }) => [styles.addGroupButton, pressed && styles.controlPressed]}
                    onPress={() => {
                      if (groupName === '资金账户') setNewType('cash');
                      else if (groupName === '信用账户') setNewType('credit');
                      else setNewType('stored_value');
                      setShowAddModal(true);
                    }}
                  >
                    <Text style={styles.addGroupText}>+ 添加</Text>
                  </Pressable>
                </View>

                {groupAccounts.length ? (
                  groupAccounts.map((account) => (
                    <Pressable
                      key={account.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${account.name}，余额${formatCurrency(account.balanceCents)}`}
                      style={({ pressed }) => [styles.accountRow, pressed && styles.rowPressed]}
                      onPress={() => openEdit(account)}
                    >
                      <View
                        style={[
                          styles.accountIcon,
                          { backgroundColor: `${ICON_COLORS[account.type]}20` },
                        ]}
                      >
                        <FontAwesome
                          name={ACCOUNT_ICONS[account.type] as any}
                          size={16}
                          color={ICON_COLORS[account.type]}
                        />
                      </View>
                      <View style={styles.accountCopy}>
                        <Text numberOfLines={1} style={styles.accountName}>{account.name}</Text>
                        <Text style={styles.accountType}>{ACCOUNT_TYPE_CN[account.type]}</Text>
                      </View>
                      <Text numberOfLines={1} style={styles.accountBalance}>
                        {formatCurrency(account.balanceCents)}
                      </Text>
                      <FontAwesome name="chevron-right" size={11} color={TEXT_SECONDARY} />
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.emptyGroup}>尚未添加，点右上角开始</Text>
                )}
              </View>
            ))}

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.xferButton, pressed && styles.primaryPressed]}
              onPress={onTransfer}
            >
              <Text style={styles.xferButtonText}>账户转账</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* Add Account Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="取消添加账户"
                style={styles.modalAction}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.modalTitle}>添加账户</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="保存新账户"
                accessibilityState={{ disabled: !newName.trim() || isSaving }}
                disabled={!newName.trim() || isSaving}
                style={styles.modalAction}
                onPress={onCreate}
              >
                <Text style={[styles.modalSave, (!newName.trim() || isSaving) && styles.modalSaveOff]}>
                  {isSaving ? '保存中' : '保存'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>账户名称</Text>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="输入账户名称"
                  style={styles.input}
                  placeholderTextColor={TEXT_SECONDARY}
                  maxLength={30}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>账户类型</Text>
                <View style={styles.typeGrid}>
                  {ACCOUNT_TYPES.map((t) => (
                    <Pressable
                      key={t}
                      accessibilityRole="button"
                      accessibilityLabel={`账户类型${ACCOUNT_TYPE_CN[t]}`}
                      accessibilityState={{ selected: t === newType }}
                      onPress={() => setNewType(t)}
                      style={({ pressed }) => [
                        styles.typeItem,
                        { width: compact ? '33.333%' : '20%' },
                        pressed && styles.controlPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.typeIcon,
                          { backgroundColor: `${ICON_COLORS[t]}20` },
                          t === newType && styles.typeIconActive,
                        ]}
                      >
                        <FontAwesome name={ACCOUNT_ICONS[t] as any} size={20} color={ICON_COLORS[t]} />
                      </View>
                      <Text style={[styles.typeName, t === newType && styles.typeNameActive]}>
                        {ACCOUNT_TYPE_CN[t]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEditModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="取消编辑账户"
                style={styles.modalAction}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.modalTitle}>编辑账户</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="保存账户"
                accessibilityState={{ disabled: !editName.trim() || isSaving }}
                disabled={!editName.trim() || isSaving}
                style={styles.modalAction}
                onPress={onSaveEdit}
              >
                <Text style={[styles.modalSave, (!editName.trim() || isSaving) && styles.modalSaveOff]}>
                  {isSaving ? '保存中' : '保存'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>账户名称</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="输入账户名称"
                  style={styles.input}
                  placeholderTextColor={TEXT_SECONDARY}
                  maxLength={30}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>账户类型</Text>
                <View style={styles.typeGrid}>
                  {ACCOUNT_TYPES.map((t) => (
                    <Pressable
                      key={t}
                      accessibilityRole="button"
                      accessibilityLabel={`账户类型${ACCOUNT_TYPE_CN[t]}`}
                      accessibilityState={{ selected: t === editType }}
                      onPress={() => setEditType(t)}
                      style={({ pressed }) => [
                        styles.typeItem,
                        { width: compact ? '33.333%' : '20%' },
                        pressed && styles.controlPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.typeIcon,
                          { backgroundColor: `${ICON_COLORS[t]}20` },
                          t === editType && styles.typeIconActive,
                        ]}
                      >
                        <FontAwesome name={ACCOUNT_ICONS[t] as any} size={20} color={ICON_COLORS[t]} />
                      </View>
                      <Text style={[styles.typeName, t === editType && styles.typeNameActive]}>
                        {ACCOUNT_TYPE_CN[t]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.adjustButton, pressed && styles.primaryPressed]}
                onPress={() => {
                  if (!selectedAccount) return;
                  const id = selectedAccount.id;
                  const name = selectedAccount.name;
                  setShowEditModal(false);
                  setSelectedAccount(null);
                  router.push({
                    pathname: '/transaction/adjust',
                    params: { accountId: id, accountName: name },
                  });
                }}
              >
                <Text style={styles.adjustButtonText}>调整余额</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.deleteButton, pressed && styles.primaryPressed]}
                onPress={onDeleteSelected}
              >
                <Text style={styles.deleteButtonText}>删除该账户</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        visible={showGoalModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGoalModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowGoalModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="取消编辑目标资产"
                style={styles.modalAction}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.modalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.modalTitle}>目标资产</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="保存目标资产"
                accessibilityState={{ disabled: !goalInput.trim() || isSaving }}
                disabled={!goalInput.trim() || isSaving}
                style={styles.modalAction}
                onPress={onSaveGoal}
              >
                <Text style={[styles.modalSave, (!goalInput.trim() || isSaving) && styles.modalSaveOff]}>
                  {isSaving ? '保存中' : '保存'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>目标金额 (元)</Text>
                <TextInput
                  value={goalInput}
                  onChangeText={(value) => {
                    setGoalInput(value);
                    if (goalError) setGoalError('');
                  }}
                  keyboardType="decimal-pad"
                  placeholder="如：10000"
                  style={styles.input}
                  placeholderTextColor={TEXT_SECONDARY}
                />
                {goalError ? <Text accessibilityRole="alert" style={styles.fieldError}>{goalError}</Text> : null}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
  },
  assetSummary: {
    flexDirection: 'row',
    marginHorizontal: RICH_SPACING.lg,
    marginBottom: RICH_SPACING.md,
    gap: RICH_SPACING.sm,
    backgroundColor: 'transparent',
  },
  assetSummaryCompact: { marginHorizontal: RICH_SPACING.md, gap: RICH_SPACING.sm },
  assetInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  goalRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  goalCopy: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'transparent' },
  goalFlag: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 9,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: DESTRUCTIVE_CORAL,
  },
  goalLabel: {
    ...RICH_TYPE.label,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  goalAmount: {
    ...RICH_TYPE.amount,
    marginTop: -2,
    fontSize: 12.5,
    color: TEXT_PRIMARY,
  },
  totalLabel: {
    marginTop: RICH_SPACING.lg,
    ...RICH_TYPE.sectionTitle,
    color: TEXT_PRIMARY,
  },
  totalValue: {
    ...RICH_TYPE.amount,
    marginTop: RICH_SPACING.xxs,
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollBody: { flexGrow: 1, paddingTop: RICH_SPACING.xs, paddingBottom: 40 },
  controlPressed: { backgroundColor: CONTROL_PRESSED_BACKGROUND },
  primaryPressed: { opacity: 0.82 },
  statePanel: {
    alignItems: 'center',
    marginHorizontal: RICH_SPACING.md,
    paddingHorizontal: RICH_SPACING.xl,
    paddingVertical: RICH_SPACING.xxl,
    backgroundColor: CARD_BACKGROUND,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_GREEN,
  },
  stateMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DFF2EA',
  },
  stateTitle: { marginTop: 12, fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  stateBody: { marginTop: 5, fontSize: 11.5, lineHeight: 18, color: TEXT_SECONDARY, textAlign: 'center' },
  retryButton: {
    minWidth: 112,
    minHeight: RICH_SIZE.minimumTouchTarget,
    marginTop: RICH_SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACTION_BACKGROUND,
  },
  retryText: { ...RICH_TYPE.body, fontWeight: '700', color: ACTION_FOREGROUND },
  errorBanner: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: RICH_SPACING.md,
    marginBottom: RICH_SPACING.sm,
    paddingLeft: RICH_SPACING.md,
    backgroundColor: CARD_BACKGROUND,
    borderLeftWidth: 3,
    borderLeftColor: DESTRUCTIVE_CORAL,
  },
  errorBannerText: { flex: 1, ...RICH_TYPE.label, color: DESTRUCTIVE_TEXT },
  errorRetry: { minWidth: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  errorRetryText: { ...RICH_TYPE.label, fontWeight: '700', color: DESTRUCTIVE_TEXT },
  accountGroup: {
    marginHorizontal: RICH_SPACING.md,
    marginBottom: RICH_SPACING.sm,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: RICH_RADIUS.card,
    overflow: 'hidden',
  },
  groupHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: RICH_SPACING.md,
    paddingRight: RICH_SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: 'transparent',
  },
  groupCopy: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'baseline', backgroundColor: 'transparent' },
  groupName: {
    ...RICH_TYPE.label,
    color: TEXT_SECONDARY,
  },
  groupTotal: {
    ...RICH_TYPE.amount,
    minWidth: 0,
    flexShrink: 1,
    marginLeft: RICH_SPACING.xs,
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  addGroupButton: {
    minWidth: 64,
    minHeight: RICH_SIZE.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RICH_RADIUS.pill,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  addGroupText: {
    ...RICH_TYPE.label,
    color: TEXT_SECONDARY,
  },
  emptyGroup: {
    paddingHorizontal: RICH_SPACING.md,
    paddingVertical: RICH_SPACING.md,
    color: TEXT_SECONDARY,
    fontSize: 12,
  },
  accountRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RICH_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER_COLOR,
  },
  rowPressed: { backgroundColor: CONTROL_BACKGROUND },
  accountIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RICH_SPACING.sm,
  },
  accountCopy: { flex: 1, minWidth: 0, backgroundColor: 'transparent' },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  accountType: { marginTop: 2, ...RICH_TYPE.caption, color: TEXT_MUTED },
  accountBalance: {
    ...RICH_TYPE.amount,
    maxWidth: 118,
    marginRight: RICH_SPACING.xs,
    fontSize: 13.5,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'right',
  },
  xferButton: {
    minHeight: 48,
    marginHorizontal: 40,
    marginTop: RICH_SPACING.xs,
    backgroundColor: ACTION_BACKGROUND,
    borderRadius: RICH_RADIUS.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xferButtonText: {
    color: ACTION_FOREGROUND,
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: { flex: 1 },
  modalContent: {
    maxHeight: '88%',
    backgroundColor: CARD_BACKGROUND,
    borderTopLeftRadius: RICH_RADIUS.sheet,
    borderTopRightRadius: RICH_RADIUS.sheet,
    paddingBottom: 28,
  },
  modalHeader: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RICH_SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: 'transparent',
  },
  modalAction: {
    minWidth: 64,
    height: RICH_SIZE.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: {
    ...RICH_TYPE.body,
    color: TEXT_SECONDARY,
  },
  modalTitle: {
    ...RICH_TYPE.screenTitle,
    color: TEXT_PRIMARY,
  },
  modalSave: {
    ...RICH_TYPE.body,
    color: ACCESSIBLE_GREEN,
    fontWeight: '700',
  },
  modalSaveOff: { color: TEXT_MUTED },
  modalBody: {
    padding: RICH_SPACING.lg,
    backgroundColor: 'transparent',
  },
  field: {
    marginBottom: RICH_SPACING.lg,
    backgroundColor: 'transparent',
  },
  fieldLabel: {
    ...RICH_TYPE.sectionTitle,
    color: TEXT_PRIMARY,
    marginBottom: RICH_SPACING.sm,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: RICH_RADIUS.control,
    paddingHorizontal: RICH_SPACING.md,
    fontSize: 16,
    color: TEXT_PRIMARY,
  },
  fieldError: { marginTop: RICH_SPACING.xs, ...RICH_TYPE.label, color: DESTRUCTIVE_TEXT },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    backgroundColor: 'transparent',
  },
  typeItem: {
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: RICH_RADIUS.control,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RICH_SPACING.xs,
  },
  typeIconActive: { borderWidth: 2, borderColor: TEXT_PRIMARY },
  typeName: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  typeNameActive: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  adjustButton: {
    minHeight: 48,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: RICH_RADIUS.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RICH_SPACING.lg,
  },
  adjustButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    minHeight: 48,
    backgroundColor: DESTRUCTIVE_CORAL,
    borderRadius: RICH_RADIUS.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RICH_SPACING.sm,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
