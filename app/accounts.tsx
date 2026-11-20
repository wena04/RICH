import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  ScrollView,
  StatusBar,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountIcon, AssetGoalIllustration, ScreenHeader } from '@/components/rich';
import { RICH_NUMERAL_FONT } from '@/constants/Design';
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
import { useScaledStyles } from '@/components/rich/useScaledStyles';
import { fitFontSize } from '@/src/utils/fitText';
import { layoutScale } from '@/src/utils/layoutScale';

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
  const styles = useScaledStyles(baseStyles);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const insets = useSafeAreaInsets();
  // Original hero art is about 150 × 186pt on a 393pt-wide screen, scaled with the width.
  const illustrationWidth = Math.round(150 * layoutScale(width));
  const illustrationHeight = Math.round(illustrationWidth * (186 / 150));
  // Width of the info column, so a large total shrinks instead of being cut off.
  const [infoWidth, setInfoWidth] = useState(0);
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
  const totalText = formatCurrency(totalAssets).replace(/\s/g, '');
  const totalFont = fitFontSize(totalText, 31, infoWidth);

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
        <View style={styles.assetInfo} onLayout={(event) => setInfoWidth(event.nativeEvent.layout.width)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`编辑目标资产，当前${centsToYuan(goalCents)}元`}
            style={({ pressed }) => [styles.goalRow, pressed && styles.controlPressed]}
            onPress={onEditGoal}
          >
            <View style={styles.goalLeader} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.goalLabel}>
              目标资产 ¥{centsToYuan(goalCents)}
            </Text>
            <Image
              source={require('../assets/images/ui/icon_edit_black.png')}
              style={styles.goalEdit}
              accessible={false}
            />
          </Pressable>
          <Text style={styles.totalLabel}>已有总资产</Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            style={[styles.totalValue, { fontSize: totalFont, lineHeight: Math.max(totalFont + 5, 24) }]}
          >
            {totalText}
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
            <Image source={require('../assets/images/ui/icon_warning.png')} style={styles.stateMark} accessible={false} />
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
                      ¥ {centsToYuan(groupTotals[groupName] ?? 0)}
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
                    <Image
                      source={require('../assets/images/ui/create_item.png')}
                      style={styles.addGroupImage}
                      accessible={false}
                    />
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
                      <View style={styles.accountIcon}>
                        <AccountIcon type={account.type} size={20} />
                      </View>
                      <View style={styles.accountCopy}>
                        <Text numberOfLines={1} style={styles.accountName}>{account.name}</Text>
                      </View>
                      {/* Original rows show the bare balance (no ¥). */}
                      <Text numberOfLines={1} style={styles.accountBalance}>
                        {centsToYuan(account.balanceCents)}
                      </Text>
                      <Image
                        source={require('../assets/images/ui/icon_right_unfold.png')}
                        style={styles.accountChevron}
                        accessible={false}
                      />
                      <View style={styles.accountRule} />
                    </Pressable>
                  ))
                ) : null}
              </View>
            ))}

          </>
        )}
      </ScrollView>
      {loadState !== 'loading' ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.xferButton,
            { bottom: insets.bottom + 16 },
            pressed && styles.primaryPressed,
          ]}
          onPress={onTransfer}
        >
          <Text style={styles.xferButtonText}>账户转账</Text>
        </Pressable>
      ) : null}

      {/* Add Account Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior="padding"
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
                          
                          t === newType && styles.typeIconActive,
                        ]}
                      >
                        <AccountIcon type={t} size={28} />
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
          behavior="padding"
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
                          
                          t === editType && styles.typeIconActive,
                        ]}
                      >
                        <AccountIcon type={t} size={28} />
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
          behavior="padding"
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

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
  },
  // Measured from the original at 3x: art 2.3pt under the nav bar, info column 30pt to its
  // right, goal line centred 16.9pt down, cards 20.4pt below the art.
  assetSummary: {
    flexDirection: 'row',
    marginHorizontal: RICH_SPACING.lg,
    marginTop: 2.3,
    marginBottom: 20.4,
    gap: 30,
    backgroundColor: 'transparent',
  },
  assetSummaryCompact: { marginHorizontal: RICH_SPACING.md, gap: RICH_SPACING.sm },
  assetInfo: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
  },
  goalRow: {
    height: 24,
    marginTop: 4.9,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  goalLeader: {
    width: 29.3,
    height: StyleSheet.hairlineWidth,
    marginLeft: -33.3,
    marginRight: 4,
    backgroundColor: '#000000',
  },
  goalEdit: { width: 24, height: 24, marginLeft: 6 },
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
  goalLabel: { flexShrink: 1, fontSize: 13, color: '#000000' },
  goalAmount: {
    ...RICH_TYPE.amount,
    marginTop: -2,
    fontSize: 12.5,
    color: TEXT_PRIMARY,
  },
  totalLabel: {
    marginTop: 64.65,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#000000',
  },
  totalValue: {
    marginTop: 14.6,
    fontFamily: RICH_NUMERAL_FONT,
    fontSize: 31,
    lineHeight: 36,
    color: '#000000',
  },
  scrollContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollBody: { flexGrow: 1, paddingTop: 0, paddingBottom: 96 },
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
  // Original icon_warning art.
  stateMark: { width: 32, height: 32 },
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
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: CARD_BACKGROUND,
    overflow: 'hidden',
  },
  groupHeader: {
    minHeight: 60.7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 13,
    paddingRight: 13,
    backgroundColor: 'transparent',
  },
  groupCopy: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'baseline', backgroundColor: 'transparent' },
  groupName: { fontSize: 13, color: '#777777' },
  groupTotal: {
    minWidth: 0,
    flexShrink: 1,
    marginLeft: 6.5,
    fontSize: 13,
    color: '#777777',
    fontVariant: ['tabular-nums'],
  },
  addGroupButton: { width: 62, height: 40 },
  addGroupImage: { width: 62, height: 40 },
  emptyGroup: {
    paddingHorizontal: RICH_SPACING.md,
    paddingVertical: RICH_SPACING.md,
    color: TEXT_SECONDARY,
    fontSize: 12,
  },
  accountRow: {
    minHeight: 60.3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12.3,
    paddingRight: 1.5,
  },
  accountChevron: { width: 30, height: 30 },
  accountRule: {
    position: 'absolute',
    left: 42.3,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EAEAEA',
  },
  rowPressed: { backgroundColor: CONTROL_BACKGROUND },
  accountIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10.7,
  },
  accountCopy: { flex: 1, minWidth: 0, backgroundColor: 'transparent' },
  accountName: { fontSize: 15, color: TEXT_PRIMARY },
  accountType: { marginTop: 2, ...RICH_TYPE.caption, color: TEXT_MUTED },
  accountBalance: {
    maxWidth: 140,
    fontSize: 15,
    color: '#333333',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  xferButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 272.4,
    height: 42.3,
    backgroundColor: ACTION_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xferButtonText: { color: ACTION_FOREGROUND, fontSize: 16 },
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
