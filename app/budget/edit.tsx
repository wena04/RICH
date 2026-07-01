import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
  Text,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { CategoryIcon } from '@/components/CategoryIcon';
import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import { ensureCategory, listCategories } from '@/src/db/repo/categories';
import {
  ensureBudgetForPeriod,
  listBudgetCategories,
  setBudgetTotal,
  upsertBudgetCategory,
  deleteBudgetCategory,
} from '@/src/db/repo/budgets';
import { DEFAULT_CATEGORIES } from '@/src/domain/categories';
import type { Category } from '@/src/domain/types';
import { currentMonth } from '@/src/utils/month';

const MONTH_NAMES_CN = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

function formatPeriodCN(period: string): string {
  const [, m] = period.split('-');
  return MONTH_NAMES_CN[parseInt(m, 10) - 1] ?? period;
}

function parseYuanToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export default function BudgetEditScreen() {
  const router = useRouter();
  const { period: periodParam } = useLocalSearchParams<{ period?: string }>();
  const period = periodParam ?? currentMonth();

  const [totalInput, setTotalInput] = useState('');
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  const categoryList = useMemo(() => {
    const names = new Set<string>();
    const result: Array<{ name: string; icon?: string | null }> = [];
    for (const c of DEFAULT_CATEGORIES) {
      if (!names.has(c.name)) {
        names.add(c.name);
        result.push({ name: c.name, icon: c.icon });
      }
    }
    for (const c of allCategories) {
      if (!names.has(c.name)) {
        names.add(c.name);
        result.push({ name: c.name, icon: c.icon });
      }
    }
    return result;
  }, [allCategories]);

  const load = useCallback(async () => {
    const db = await getDb();
    setAllCategories(await listCategories(db));
    const budget = await ensureBudgetForPeriod(db, period);
    if (budget.totalCents != null) {
      setTotalInput((budget.totalCents / 100).toFixed(2).replace(/\.?0+$/, ''));
    } else {
      setTotalInput('');
    }
    const rows = await listBudgetCategories(db, budget.id);
    const map: Record<string, string> = {};
    for (const row of rows) {
      const cat = await db.getFirstAsync<{ name: string }>(
        'SELECT name FROM categories WHERE id = ?',
        [row.categoryId],
      );
      if (cat) {
        map[cat.name] = (row.limitCents / 100).toFixed(2).replace(/\.?0+$/, '');
      }
    }
    setLimits(map);
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSave() {
    if (saving) return;
    setSaving(true);
    try {
      const db = await getDb();
      const budget = await ensureBudgetForPeriod(db, period);
      const totalCents = parseYuanToCents(totalInput);
      await setBudgetTotal(db, budget.id, totalCents);

      for (const cat of categoryList) {
        const cents = parseYuanToCents(limits[cat.name] ?? '');
        const ensured = await ensureCategory(db, cat.name, cat.icon ?? null);
        if (cents != null && cents > 0) {
          await upsertBudgetCategory(db, budget.id, ensured.id, cents);
        } else {
          await deleteBudgetCategory(db, budget.id, ensured.id);
        }
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={18} color={TEXT_PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle}>{formatPeriodCN(period)} 预算</Text>
        <Pressable onPress={onSave} disabled={saving}>
          <Text style={[styles.saveBtn, saving && { opacity: 0.5 }]}>保存</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>本月总预算 (元，可选)</Text>
          <TextInput
            value={totalInput}
            onChangeText={setTotalInput}
            keyboardType="decimal-pad"
            placeholder="留空则按分类合计"
            style={styles.input}
            placeholderTextColor={TEXT_SECONDARY}
          />
        </View>

        <Text style={styles.sectionTitle}>分类预算</Text>
        {categoryList.map((cat) => (
          <View key={cat.name} style={styles.row}>
            <View style={styles.rowIcon}>
              <CategoryIcon id={cat.icon ?? undefined} name={cat.name} size={22} />
            </View>
            <Text style={styles.rowName}>{cat.name}</Text>
            <TextInput
              value={limits[cat.name] ?? ''}
              onChangeText={(v) => setLimits((prev) => ({ ...prev, [cat.name]: v }))}
              keyboardType="decimal-pad"
              placeholder="0"
              style={styles.limitInput}
              placeholderTextColor={TEXT_SECONDARY}
            />
            <Text style={styles.yuan}>元</Text>
          </View>
        ))}
      </ScrollView>
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
  saveBtn: { fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, paddingHorizontal: 8 },
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  fieldLabel: { fontSize: 14, color: TEXT_SECONDARY, marginBottom: 8 },
  input: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowName: { flex: 1, fontSize: 15, color: TEXT_PRIMARY },
  limitInput: {
    width: 72,
    fontSize: 15,
    textAlign: 'right',
    color: TEXT_PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 4,
  },
  yuan: { fontSize: 14, color: TEXT_SECONDARY, marginLeft: 6 },
});
