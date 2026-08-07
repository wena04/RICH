import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet } from 'react-native';

import { ScreenHeader } from '@/components/rich';
import { Text, View } from '@/components/Themed';
import { EXPENSE_RED, PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import { listAccounts } from '@/src/db/repo/accounts';
import type { Account } from '@/src/domain/types';
import { exportCsvV1, importCsvV1 } from '@/src/features/importExport/csvV1';
import { exportCsvV2 } from '@/src/features/importExport/csvV2';
import { exportDatabaseToFile, importDatabaseFromFileUri } from '@/src/features/importExport/dbFile';

export default function ImportExportScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [busy, setBusy] = useState<string | null>(null);

  const targetAccountName = useMemo(
    () => accounts.find((a) => a.id === targetAccountId)?.name ?? '',
    [accounts, targetAccountId]
  );

  const refreshAccounts = useCallback(async () => {
    const db = await getDb();
    const list = await listAccounts(db);
    setAccounts(list);
    setTargetAccountId((prev) => (prev && list.some((a) => a.id === prev) ? prev : list[0]?.id ?? ''));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshAccounts();
    }, [refreshAccounts])
  );

  async function ensureSharingAvailable() {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('无法分享', '当前设备不支持系统分享面板。');
      return false;
    }
    return true;
  }

  async function onImportCsvV1() {
    if (!targetAccountId) {
      Alert.alert('请选择账户', '旧版 CSV 不包含账户信息，请先选择导入目标账户。');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const file = result.assets[0];
    setBusy('正在导入旧版 CSV…');
    try {
      const csv = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const db = await getDb();
      const { importedCount } = await importCsvV1(db, csv, { targetAccountId });
      Alert.alert('导入完成', `已向“${targetAccountName || targetAccountId}”导入 ${importedCount} 条记录。`);
    } catch (e) {
      Alert.alert('导入失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setBusy(null);
    }
  }

  async function writeAndShare(filename: string, contents: string) {
    if (!(await ensureSharingAvailable())) return;
    if (!FileSystem.cacheDirectory) throw new Error('FileSystem.cacheDirectory is not available.');

    const uri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(uri, contents, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(uri);
  }

  async function onExportCsvV1() {
    setBusy('正在导出旧版 CSV…');
    try {
      const db = await getDb();
      const csv = await exportCsvV1(db);
      const ts = new Date().toISOString().slice(0, 10);
      await writeAndShare(`rich-export-v1-${ts}.csv`, csv);
    } catch (e) {
      Alert.alert('导出失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setBusy(null);
    }
  }

  async function onExportCsvV2() {
    setBusy('正在导出完整 CSV…');
    try {
      const db = await getDb();
      const csv = await exportCsvV2(db);
      const ts = new Date().toISOString().slice(0, 10);
      await writeAndShare(`rich-export-v2-${ts}.csv`, csv);
    } catch (e) {
      Alert.alert('导出失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setBusy(null);
    }
  }

  async function onExportDb() {
    if (!(await ensureSharingAvailable())) return;
    setBusy('正在创建完整备份…');
    try {
      const path = await exportDatabaseToFile();
      await Sharing.shareAsync(path);
    } catch (e) {
      Alert.alert('备份失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setBusy(null);
    }
  }

  async function onImportDb() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/octet-stream', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets[0];

    Alert.alert(
      '恢复此数据库备份？',
      '这会覆盖当前设备上的全部本地数据，操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '覆盖并恢复',
          style: 'destructive',
          onPress: async () => {
            setBusy('正在恢复数据库…');
            try {
              await importDatabaseFromFileUri(file.uri);
              await refreshAccounts();
              Alert.alert('恢复完成', '数据库已恢复。若页面数据未立即刷新，请完全关闭后重新打开应用。');
            } catch (e) {
              Alert.alert('恢复失败', e instanceof Error ? e.message : '未知错误');
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  }

  function ActionRow({
    icon,
    title,
    detail,
    onPress,
    danger = false,
    divider = false,
  }: {
    icon: string;
    title: string;
    detail: string;
    onPress: () => void;
    danger?: boolean;
    divider?: boolean;
  }) {
    return (
      <Pressable
        disabled={Boolean(busy)}
        onPress={onPress}
        style={({ pressed }) => [styles.actionRow, divider && styles.divider, pressed && styles.pressed]}
      >
        <View style={styles.actionIcon}>
          <FontAwesome name={icon as any} size={18} color={danger ? EXPENSE_RED : TEXT_PRIMARY} />
        </View>
        <View style={styles.actionCopy}>
          <Text style={[styles.actionTitle, danger && styles.dangerText]}>{title}</Text>
          <Text style={styles.actionDetail}>{detail}</Text>
        </View>
        <FontAwesome name="chevron-right" size={12} color={TEXT_SECONDARY} />
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader title="数据管理" onBack={() => router.back()} backgroundColor={PRIMARY_GREEN} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {busy ? <Text style={styles.busy}>{busy}</Text> : null}

        <Text style={styles.sectionLabel}>备份与迁移</Text>
        <View style={styles.section}>
          <ActionRow
            icon="database"
            title="导出完整备份"
            detail="保留账户、分类、子分类、预算和全部记录"
            onPress={onExportDb}
          />
          <ActionRow
            icon="refresh"
            title="从备份恢复"
            detail="选择数据库文件并覆盖当前设备数据"
            onPress={onImportDb}
            danger
            divider
          />
        </View>

        <Text style={styles.sectionLabel}>表格导出</Text>
        <View style={styles.section}>
          <ActionRow
            icon="file-text-o"
            title="导出完整 CSV"
            detail="包含账户、分类、子分类和稳定 ID"
            onPress={onExportCsvV2}
          />
          <ActionRow
            icon="file-o"
            title="导出旧版 CSV"
            detail="用于兼容早期 RICH 数据格式"
            onPress={onExportCsvV1}
            divider
          />
        </View>

        <Text style={styles.sectionLabel}>导入旧版 CSV 到</Text>
        <View style={styles.section}>
          <View style={styles.accountArea}>
            <View style={styles.chips}>
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  onPress={() => setTargetAccountId(account.id)}
                  style={[styles.chip, account.id === targetAccountId && styles.chipActive]}
                >
                  <Text style={[styles.chipText, account.id === targetAccountId && styles.chipTextActive]}>
                    {account.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <ActionRow
            icon="upload"
            title="选择 CSV 并导入"
            detail="旧版格式没有账户列，所有记录会进入上方账户"
            onPress={onImportCsvV1}
            divider
          />
        </View>

        <Text style={styles.privacyNote}>导出文件可能包含敏感财务信息，请保存在可信位置。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4' },
  scroll: { flex: 1 },
  content: { paddingTop: 18, paddingBottom: 40 },
  sectionLabel: { marginHorizontal: 18, marginBottom: 8, fontSize: 12, color: TEXT_SECONDARY },
  section: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#FFFFFF', borderRadius: 3 },
  actionRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DDDDDD' },
  pressed: { backgroundColor: '#F7F7F7' },
  actionIcon: { width: 34, alignItems: 'flex-start' },
  actionCopy: { flex: 1, paddingRight: 12 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  actionDetail: { marginTop: 4, fontSize: 10.5, lineHeight: 15, color: TEXT_SECONDARY },
  dangerText: { color: EXPENSE_RED },
  accountArea: { paddingHorizontal: 16, paddingVertical: 14 },
  chips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D5D5D5',
  },
  chipActive: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: `${PRIMARY_GREEN}18`,
  },
  chipText: { fontSize: 12, color: TEXT_SECONDARY },
  chipTextActive: { color: TEXT_PRIMARY, fontWeight: '600' },
  privacyNote: { marginHorizontal: 20, fontSize: 11, lineHeight: 17, color: TEXT_SECONDARY },
  busy: { marginHorizontal: 18, marginBottom: 14, fontSize: 12, color: PRIMARY_GREEN },
});
