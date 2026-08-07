import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getDb } from '@/src/db/db';
import { listAccounts } from '@/src/db/repo/accounts';
import type { Account } from '@/src/domain/types';
import { exportCsvV1, importCsvV1 } from '@/src/features/importExport/csvV1';
import { exportCsvV2 } from '@/src/features/importExport/csvV2';
import { exportDatabaseToFile, importDatabaseFromFileUri } from '@/src/features/importExport/dbFile';

export default function ImportExportScreen() {
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
      Alert.alert('Sharing not available', 'This device does not support the system share sheet.');
      return false;
    }
    return true;
  }

  async function onImportCsvV1() {
    if (!targetAccountId) {
      Alert.alert('Select an account', 'CSV v1 has no account column; choose a target account first.');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const file = result.assets[0];
    setBusy('Importing CSV v1…');
    try {
      const csv = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const db = await getDb();
      const { importedCount } = await importCsvV1(db, csv, { targetAccountId });
      Alert.alert('Import complete', `Imported ${importedCount} rows into account: ${targetAccountName || targetAccountId}`);
    } catch (e) {
      Alert.alert('Import failed', e instanceof Error ? e.message : 'Unknown error');
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
    setBusy('Exporting CSV v1…');
    try {
      const db = await getDb();
      const csv = await exportCsvV1(db);
      const ts = new Date().toISOString().slice(0, 10);
      await writeAndShare(`rich-export-v1-${ts}.csv`, csv);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
  }

  async function onExportCsvV2() {
    setBusy('Exporting CSV v2…');
    try {
      const db = await getDb();
      const csv = await exportCsvV2(db);
      const ts = new Date().toISOString().slice(0, 10);
      await writeAndShare(`rich-export-v2-${ts}.csv`, csv);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
  }

  async function onExportDb() {
    if (!(await ensureSharingAvailable())) return;
    setBusy('Exporting database…');
    try {
      const path = await exportDatabaseToFile();
      await Sharing.shareAsync(path);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
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
      'Import database file?',
      'This will overwrite your current local database on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            setBusy('Importing database…');
            try {
              await importDatabaseFromFileUri(file.uri);
              await refreshAccounts();
              Alert.alert('Import complete', 'Database imported. If anything looks off, fully restart the app.');
            } catch (e) {
              Alert.alert('Import failed', e instanceof Error ? e.message : 'Unknown error');
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import / Export</Text>
      <Text style={styles.subtitle}>
        CSV v1 (legacy) + optional CSV v2 + database file export/import (local-only).
      </Text>

      <View style={styles.warning}>
        <Text style={styles.warningTitle}>Privacy warning</Text>
        <Text>
          Exported files may contain sensitive information. Store them securely. Never commit real exports to git.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>CSV v1 (legacy)</Text>
        <Text style={styles.hint}>Import requires selecting a target account (v1 has no account column).</Text>
        <View style={styles.chips}>
          {accounts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setTargetAccountId(a.id)}
              style={[styles.chip, a.id === targetAccountId && styles.chipActive]}>
              <Text style={styles.chipText}>{a.name}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onImportCsvV1} style={styles.primary}>
            <Text style={styles.primaryText}>Import CSV v1</Text>
          </Pressable>
          <Pressable onPress={onExportCsvV1} style={styles.secondary}>
            <Text style={styles.secondaryText}>Export CSV v1</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>CSV v2 (optional extended export)</Text>
        <Text style={styles.hint}>Includes IDs + account + optional subcategory fields.</Text>
        <Pressable onPress={onExportCsvV2} style={styles.secondary}>
          <Text style={styles.secondaryText}>Export CSV v2</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Database file</Text>
        <Text style={styles.hint}>Full-fidelity backup and migration.</Text>
        <View style={styles.actions}>
          <Pressable onPress={onExportDb} style={styles.secondary}>
            <Text style={styles.secondaryText}>Export DB file</Text>
          </Pressable>
          <Pressable onPress={onImportDb} style={styles.danger}>
            <Text style={styles.dangerText}>Import DB file</Text>
          </Pressable>
        </View>
      </View>

      {busy ? <Text style={styles.busy}>{busy}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.8,
  },
  warning: {
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(193, 18, 31, 0.25)',
  },
  warningTitle: {
    fontWeight: '700',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  cardTitle: {
    fontWeight: '700',
  },
  hint: {
    opacity: 0.75,
    fontSize: 12,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
  },
  chipActive: {
    borderColor: 'rgba(127,127,127,0.8)',
  },
  chipText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
    alignItems: 'center',
  },
  primaryText: {
    fontWeight: '600',
  },
  secondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
    alignItems: 'center',
  },
  secondaryText: {
    fontWeight: '600',
  },
  danger: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(193, 18, 31, 0.4)',
    alignItems: 'center',
  },
  dangerText: {
    color: '#c1121f',
    fontWeight: '600',
  },
  busy: {
    opacity: 0.8,
    fontSize: 12,
  },
});

