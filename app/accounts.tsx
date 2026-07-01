import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { 
  PRIMARY_GREEN, 
  TEXT_PRIMARY, 
  TEXT_SECONDARY,
  EXPENSE_RED,
} from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import {
  canDeleteAccount,
  createAccount,
  deleteAccount,
  listAccountsWithBalances,
  updateAccount,
  type AccountWithBalance,
} from '@/src/db/repo/accounts';
import type { Account, AccountType } from '@/src/domain/types';
import { getMeta, setMeta } from '@/src/db/repo/meta';
import { centsToYuan } from '@/src/utils/money';

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
  cash: '#4CAF50',
  bank: '#2196F3',
  credit: '#FF9800',
  stored_value: '#9C27B0',
  investment: '#00BCD4',
};

export default function AccountsScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountWithBalance | null>(null);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('cash');

  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<AccountType>('cash');

  // Savings goal (目标资产), persisted in app_meta.
  const [goalCents, setGoalCents] = useState(1000000);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

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
    setShowGoalModal(true);
  }

  async function onSaveGoal() {
    const yuan = parseFloat(goalInput.trim());
    if (!isNaN(yuan) && yuan >= 0) {
      const cents = Math.round(yuan * 100);
      setGoalCents(cents);
      const db = await getDb();
      await setMeta(db, 'asset_goal_cents', String(cents));
    }
    setShowGoalModal(false);
  }

  function onTransfer() {
    router.push('/transaction/transfer' as Href);
  }

  const refresh = useCallback(async () => {
    const db = await getDb();
    const rows = await listAccountsWithBalances(db);
    setAccounts(rows);
    const g = await getMeta(db, 'asset_goal_cents');
    if (g != null) setGoalCents(parseInt(g, 10) || 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
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
    if (!name) return;
    const db = await getDb();
    await createAccount(db, { name, type: newType });
    setNewName('');
    setNewType('cash');
    setShowAddModal(false);
    await refresh();
  }

  async function onSaveEdit() {
    if (!selectedAccount) return;
    const name = editName.trim();
    if (!name) return;
    const db = await getDb();
    await updateAccount(db, { id: selectedAccount.id, name, type: editType });
    setShowEditModal(false);
    setSelectedAccount(null);
    await refresh();
  }

  async function onDeleteSelected() {
    if (!selectedAccount) return;
    const db = await getDb();
    const ok = await canDeleteAccount(db, selectedAccount.id);
    if (!ok) {
      Alert.alert('无法删除', '该账户已关联交易记录');
      return;
    }
    Alert.alert('删除账户?', '此操作无法撤销', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const db2 = await getDb();
          await deleteAccount(db2, selectedAccount.id);
          setShowEditModal(false);
          setSelectedAccount(null);
          await refresh();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      
      {/* Green Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={18} color={TEXT_PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle}>资产管理</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Asset Summary + savings goal */}
      <View style={styles.assetSummary}>
        <View style={styles.assetIllustration}>
          <FontAwesome name="university" size={34} color="#E8D9A0" />
          <View style={styles.pctBadge}>
            <Text style={styles.pctBadgeText}>{goalPct}%</Text>
          </View>
        </View>
        <View style={styles.assetInfo}>
          <Pressable style={styles.goalRow} onPress={onEditGoal}>
            <Text style={styles.goalLabel}>🚩 目标资产 ¥{centsToYuan(goalCents)}</Text>
            <FontAwesome name="pencil" size={11} color={TEXT_PRIMARY} />
          </Pressable>
          <Text style={styles.totalLabel}>已有总资产</Text>
          <Text style={styles.totalValue}>¥{centsToYuan(totalAssets)}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Account Groups */}
        {Object.entries(groupedAccounts).map(([groupName, groupAccounts]) => (
          <View key={groupName} style={styles.accountGroup}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupName}>{groupName}</Text>
              <Text style={styles.groupTotal}>¥ {centsToYuan(groupTotals[groupName] ?? 0)}</Text>
              <Pressable 
                style={styles.addGroupButton}
                onPress={() => {
                  // Set default type based on group
                  if (groupName === '资金账户') setNewType('cash');
                  else if (groupName === '信用账户') setNewType('credit');
                  else setNewType('stored_value');
                  setShowAddModal(true);
                }}
              >
                <Text style={styles.addGroupText}>+ 添加</Text>
              </Pressable>
            </View>
            
            {groupAccounts.map(account => (
              <Pressable
                key={account.id}
                style={styles.accountRow}
                onPress={() => openEdit(account)}
              >
                <View style={[styles.accountIcon, { backgroundColor: `${ICON_COLORS[account.type]}20` }]}>
                  <FontAwesome
                    name={ACCOUNT_ICONS[account.type] as any}
                    size={16}
                    color={ICON_COLORS[account.type]}
                  />
                </View>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountBalance}>{centsToYuan(account.balanceCents)}</Text>
                <FontAwesome name="chevron-right" size={12} color={TEXT_SECONDARY} />
              </Pressable>
            ))}
          </View>
        ))}

        <Pressable style={styles.xferButton} onPress={onTransfer}>
          <Text style={styles.xferButtonText}>账户转账</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Account Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.modalTitle}>添加账户</Text>
              <Pressable onPress={onCreate}>
                <Text style={styles.modalSave}>保存</Text>
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
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>账户类型</Text>
                <View style={styles.typeGrid}>
                  {(['cash', 'bank', 'credit', 'stored_value', 'investment'] as const).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setNewType(t)}
                      style={[styles.typeItem, t === newType && styles.typeItemActive]}
                    >
                      <View style={[styles.typeIcon, { backgroundColor: `${ICON_COLORS[t]}20` }]}>
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
        </View>
      </Modal>

      {/* Edit Account Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.modalTitle}>编辑账户</Text>
              <Pressable onPress={onSaveEdit}>
                <Text style={styles.modalSave}>保存</Text>
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
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>账户类型</Text>
                <View style={styles.typeGrid}>
                  {(['cash', 'bank', 'credit', 'stored_value', 'investment'] as const).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setEditType(t)}
                      style={[styles.typeItem, t === editType && styles.typeItemActive]}
                    >
                      <View style={[styles.typeIcon, { backgroundColor: `${ICON_COLORS[t]}20` }]}>
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
                style={styles.adjustButton}
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

              <Pressable style={styles.deleteButton} onPress={onDeleteSelected}>
                <Text style={styles.deleteButtonText}>删除该账户</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal visible={showGoalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowGoalModal(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.modalTitle}>目标资产</Text>
              <Pressable onPress={onSaveGoal}>
                <Text style={styles.modalSave}>保存</Text>
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>目标金额 (元)</Text>
                <TextInput
                  value={goalInput}
                  onChangeText={setGoalInput}
                  keyboardType="decimal-pad"
                  placeholder="如：10000"
                  style={styles.input}
                  placeholderTextColor={TEXT_SECONDARY}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PRIMARY_GREEN,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  assetSummary: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: PRIMARY_GREEN,
  },
  assetIllustration: {
    width: 76,
    height: 76,
    backgroundColor: '#1b242f',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  pctBadge: {
    position: 'absolute',
    right: 5,
    bottom: 6,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  pctBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  assetInfo: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  goalLabel: {
    fontSize: 12,
    color: TEXT_PRIMARY,
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_PRIMARY,
  },
  totalLabel: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 6,
  },
  accountGroup: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'transparent',
  },
  groupName: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  groupTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginLeft: 8,
    flex: 1,
  },
  addGroupButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  addGroupText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  emptyGroup: {
    paddingHorizontal: 20,
    color: TEXT_SECONDARY,
    fontSize: 14,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  accountIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  accountName: {
    flex: 1,
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginRight: 8,
  },
  xferButton: {
    marginHorizontal: 16,
    marginTop: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  xferButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'transparent',
  },
  modalCancel: {
    fontSize: 16,
    color: TEXT_SECONDARY,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  modalSave: {
    fontSize: 16,
    color: PRIMARY_GREEN,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  field: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_PRIMARY,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: TEXT_PRIMARY,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: 'transparent',
  },
  typeItem: {
    alignItems: 'center',
    width: 70,
  },
  typeItemActive: {},
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeName: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  typeNameActive: {
    color: PRIMARY_GREEN,
    fontWeight: '600',
  },
  adjustButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  adjustButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: EXPENSE_RED,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
