import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { ScreenHeader } from '@/components/rich';
import { PRIMARY_GREEN, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';
import { DEFAULT_CATEGORIES } from '@/src/domain/categories';
import type { Category, Subcategory } from '@/src/domain/types';
import { getDb } from '@/src/db/db';
import {
  deleteBudgetCategory,
  deleteBudgetSubcategoriesForCategory,
  deleteBudgetSubcategory,
  ensureBudgetForPeriod,
  getBudgetForPeriod,
  listBudgetCategories,
  listBudgetSubcategories,
  setBudgetTotal,
  upsertBudgetCategory,
  upsertBudgetSubcategory,
} from '@/src/db/repo/budgets';
import { listAllSubcategories, listCategories } from '@/src/db/repo/categories';
import {
  effectiveCategoryLimitCents,
  sumChildLimitsCents,
  unallocatedCategoryLimitCents,
} from '@/src/features/budgets/allocation';
import { centsToYuan } from '@/src/utils/money';
import { currentMonth } from '@/src/utils/month';

const MONTH_NAMES_CN = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

function formatPeriodCN(period: string): string {
  const [year, month] = period.split('-');
  const currentYear = String(new Date().getFullYear());
  const monthName = MONTH_NAMES_CN[Number(month) - 1] ?? period;
  return year === currentYear ? monthName : `${year}年${monthName}`;
}

function parseYuanToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^\d+(?:\.\d{0,2})?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
}

function inputFromCents(cents: number): string {
  return (cents / 100).toFixed(2).replace(/\.?0+$/, '');
}

export default function BudgetEditScreen() {
  const router = useRouter();
  const { period: periodParam } = useLocalSearchParams<{ period?: string }>();
  const period = periodParam ?? currentMonth();

  const [totalInput, setTotalInput] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});
  const [subcategoryLimits, setSubcategoryLimits] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const orderedCategories = useMemo(() => {
    const order = new Map(DEFAULT_CATEGORIES.map((category, index) => [category.name, index]));
    return categories
      .filter((category) => category.kind === 'expense' || category.kind === 'both')
      .sort((left, right) => {
        const leftOrder = order.get(left.name) ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = order.get(right.name) ?? Number.MAX_SAFE_INTEGER;
        return leftOrder === rightOrder
          ? left.name.localeCompare(right.name, 'zh-CN')
          : leftOrder - rightOrder;
      });
  }, [categories]);

  const subcategoriesByParent = useMemo(() => {
    const grouped = new Map<string, Subcategory[]>();
    for (const subcategory of subcategories) {
      const children = grouped.get(subcategory.categoryId) ?? [];
      children.push(subcategory);
      grouped.set(subcategory.categoryId, children);
    }
    return grouped;
  }, [subcategories]);

  const categoryAllocationCents = useMemo(
    () =>
      orderedCategories.reduce((total, category) => {
        const children = subcategoriesByParent.get(category.id) ?? [];
        const childLimits = children.map(
          (child) => parseYuanToCents(subcategoryLimits[child.id] ?? '') ?? 0,
        );
        const parent = parseYuanToCents(categoryLimits[category.id] ?? '') ?? 0;
        return total + effectiveCategoryLimitCents(parent, childLimits);
      }, 0),
    [categoryLimits, orderedCategories, subcategoriesByParent, subcategoryLimits],
  );

  const load = useCallback(async () => {
    const db = await getDb();
    const [allCategories, allSubcategories, budget] = await Promise.all([
      listCategories(db),
      listAllSubcategories(db),
      getBudgetForPeriod(db, period),
    ]);
    setCategories(allCategories);
    setSubcategories(allSubcategories);

    if (!budget) {
      setTotalInput('');
      setCategoryLimits({});
      setSubcategoryLimits({});
      return;
    }

    setTotalInput(budget.totalCents == null ? '' : inputFromCents(budget.totalCents));
    const [parentRows, childRows] = await Promise.all([
      listBudgetCategories(db, budget.id),
      listBudgetSubcategories(db, budget.id),
    ]);
    setCategoryLimits(
      Object.fromEntries(parentRows.map((row) => [row.categoryId, inputFromCents(row.limitCents)])),
    );
    setSubcategoryLimits(
      Object.fromEntries(childRows.map((row) => [row.subcategoryId, inputFromCents(row.limitCents)])),
    );
    setExpanded(
      new Set(
        allSubcategories
          .filter((subcategory) => childRows.some((row) => row.subcategoryId === subcategory.id))
          .map((subcategory) => subcategory.categoryId),
      ),
    );
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleExpanded(categoryId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  async function onSave() {
    if (saving) return;
    const totalCents = parseYuanToCents(totalInput);
    if (totalInput.trim() && (totalCents == null || totalCents <= 0)) {
      Alert.alert('检查总预算', '总预算需大于 0，最多保留两位小数；不设置时请留空。');
      return;
    }
    for (const category of orderedCategories) {
      const parentInput = categoryLimits[category.id] ?? '';
      if (parentInput.trim() && parseYuanToCents(parentInput) == null) {
        Alert.alert('检查分类额度', `“${category.name}”的额度格式不正确。`);
        return;
      }
      for (const child of subcategoriesByParent.get(category.id) ?? []) {
        const childInput = subcategoryLimits[child.id] ?? '';
        if (childInput.trim() && parseYuanToCents(childInput) == null) {
          Alert.alert('检查子分类额度', `“${category.name} › ${child.name}”的额度格式不正确。`);
          return;
        }
      }
    }
    if (totalCents != null && totalCents > 0 && totalCents < categoryAllocationCents) {
      Alert.alert(
        '分类额度超过总预算',
        `分类合计为 ¥${centsToYuan(categoryAllocationCents)}，请提高总预算或调整分类额度。`,
      );
      return;
    }

    setSaving(true);
    try {
      const db = await getDb();
      const budget = await ensureBudgetForPeriod(db, period);
      const [existingParentRows, existingChildRows] = await Promise.all([
        listBudgetCategories(db, budget.id),
        listBudgetSubcategories(db, budget.id),
      ]);
      const activeCategoryIds = new Set(orderedCategories.map((category) => category.id));
      const staleCategoryIds = new Set(
        [...existingParentRows.map((row) => row.categoryId), ...existingChildRows.map((row) => row.categoryId)]
          .filter((categoryId) => !activeCategoryIds.has(categoryId)),
      );
      await db.withTransactionAsync(async () => {
        await setBudgetTotal(db, budget.id, totalCents);
        // A category changed to income must not leave a hidden expense-budget envelope behind.
        for (const categoryId of staleCategoryIds) {
          await deleteBudgetSubcategoriesForCategory(db, budget.id, categoryId);
          await deleteBudgetCategory(db, budget.id, categoryId);
        }
        for (const category of orderedCategories) {
          const children = subcategoriesByParent.get(category.id) ?? [];
          const childEntries = children.map((child) => ({
            child,
            cents: parseYuanToCents(subcategoryLimits[child.id] ?? '') ?? 0,
          }));
          const enteredParent = parseYuanToCents(categoryLimits[category.id] ?? '') ?? 0;
          const effectiveParent = effectiveCategoryLimitCents(
            enteredParent,
            childEntries.map((entry) => entry.cents),
          );

          if (effectiveParent > 0) {
            await upsertBudgetCategory(db, budget.id, category.id, effectiveParent);
            for (const { child, cents } of childEntries) {
              if (cents > 0) {
                await upsertBudgetSubcategory(db, budget.id, child.id, cents);
              } else {
                await deleteBudgetSubcategory(db, budget.id, child.id);
              }
            }
          } else {
            await deleteBudgetSubcategoriesForCategory(db, budget.id, category.id);
            await deleteBudgetCategory(db, budget.id, category.id);
          }
        }
      });
      router.back();
    } catch (error) {
      Alert.alert('保存失败', error instanceof Error ? error.message : '请稍后再试。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader
        title={`${formatPeriodCN(period)}预算`}
        subtitle="先定边界，再给重要的事留位置"
        onBack={() => router.back()}
        backgroundColor={PRIMARY_GREEN}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="保存预算"
            disabled={saving}
            hitSlop={8}
            onPress={onSave}
          >
            <Text style={[styles.saveText, saving && styles.disabledText]}>
              {saving ? '保存中' : '保存'}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.totalCard}>
          <View style={styles.totalCopy}>
            <Text style={styles.eyebrow}>本月总预算</Text>
            <Text style={styles.totalHint}>留空时，自动使用分类合计</Text>
          </View>
          <View style={styles.moneyInputWrap}>
            <Text style={styles.currency}>¥</Text>
            <TextInput
              accessibilityLabel="本月总预算金额"
              value={totalInput}
              onChangeText={setTotalInput}
              keyboardType="decimal-pad"
              placeholder={centsToYuan(categoryAllocationCents)}
              placeholderTextColor="#B4BBB8"
              style={styles.totalInput}
            />
          </View>
          <View style={styles.allocationLine}>
            <Text style={styles.allocationLabel}>分类合计</Text>
            <Text style={styles.allocationValue}>¥{centsToYuan(categoryAllocationCents)}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>分类额度</Text>
            <Text style={styles.sectionHint}>展开分类，可把额度分给子分类</Text>
          </View>
          <View style={styles.hierarchyKey}>
            <View style={styles.keyDot} />
            <Text style={styles.keyText}>子分类不重复计入总额</Text>
          </View>
        </View>

        <View style={styles.ledger}>
          {orderedCategories.map((category, index) => {
            const children = subcategoriesByParent.get(category.id) ?? [];
            const childLimits = children.map(
              (child) => parseYuanToCents(subcategoryLimits[child.id] ?? '') ?? 0,
            );
            const childTotal = sumChildLimitsCents(childLimits);
            const parent = parseYuanToCents(categoryLimits[category.id] ?? '') ?? 0;
            const effective = effectiveCategoryLimitCents(parent, childLimits);
            const isExpanded = expanded.has(category.id);
            return (
              <View key={category.id} style={[styles.categoryBlock, index > 0 && styles.blockDivider]}>
                <View style={styles.categoryRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${category.name}，${children.length} 个子分类`}
                    accessibilityState={{ expanded: isExpanded }}
                    disabled={!children.length}
                    onPress={() => toggleExpanded(category.id)}
                    style={styles.categoryIdentity}
                  >
                    <View style={styles.categoryIcon}>
                      <CategoryIcon id={category.icon ?? undefined} name={category.name} size={21} />
                    </View>
                    <View style={styles.categoryCopy}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryMeta}>
                        {children.length ? `${children.length} 个子分类` : '仅主分类'}
                      </Text>
                    </View>
                    {children.length ? (
                      <FontAwesome
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={11}
                        color={TEXT_MUTED}
                      />
                    ) : null}
                  </Pressable>
                  <View style={styles.limitWrap}>
                    <Text style={styles.limitCurrency}>¥</Text>
                    <TextInput
                      accessibilityLabel={`${category.name}预算`}
                      value={categoryLimits[category.id] ?? ''}
                      onChangeText={(value) =>
                        setCategoryLimits((current) => ({ ...current, [category.id]: value }))
                      }
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#B5B5B5"
                      style={styles.limitInput}
                    />
                  </View>
                </View>

                {isExpanded && children.length ? (
                  <View style={styles.childPanel}>
                    <View style={styles.childRail} />
                    {children.map((child) => (
                      <View key={child.id} style={styles.childRow}>
                        <View style={styles.childNode} />
                        <Text style={styles.childName}>{child.name}</Text>
                        <View style={styles.childInputWrap}>
                          <Text style={styles.childCurrency}>¥</Text>
                          <TextInput
                            accessibilityLabel={`${category.name}，${child.name}预算`}
                            value={subcategoryLimits[child.id] ?? ''}
                            onChangeText={(value) =>
                              setSubcategoryLimits((current) => ({ ...current, [child.id]: value }))
                            }
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor="#B5B5B5"
                            style={styles.childInput}
                          />
                        </View>
                      </View>
                    ))}
                    <View style={styles.unallocatedRow}>
                      <Text style={styles.unallocatedLabel}>未分配</Text>
                      <Text style={styles.unallocatedValue}>
                        ¥{centsToYuan(unallocatedCategoryLimitCents(effective, childLimits))}
                      </Text>
                    </View>
                    {parent > 0 && childTotal > parent ? (
                      <Text style={styles.autoHint}>
                        主分类额度将自动提高到 ¥{centsToYuan(childTotal)}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  scroll: { flex: 1, backgroundColor: '#F5F7F5' },
  content: { padding: 16, paddingBottom: 44 },
  saveText: { color: TEXT_PRIMARY, fontSize: 14, fontWeight: '700' },
  disabledText: { opacity: 0.45 },
  totalCard: { backgroundColor: '#101A17', padding: 18, borderRadius: 3 },
  totalCopy: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  eyebrow: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  totalHint: { color: '#A7B4AF', fontSize: 10.5 },
  moneyInputWrap: { flexDirection: 'row', alignItems: 'baseline', marginTop: 18 },
  currency: { color: PRIMARY_GREEN, fontSize: 24, fontWeight: '600', marginRight: 5 },
  totalInput: { flex: 1, color: '#FFFFFF', fontSize: 36, fontWeight: '300', paddingVertical: 0 },
  allocationLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3A4642',
  },
  allocationLabel: { color: '#A7B4AF', fontSize: 11 },
  allocationValue: { color: '#FFFFFF', fontSize: 11, fontVariant: ['tabular-nums'] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  sectionHint: { marginTop: 3, fontSize: 11, color: TEXT_SECONDARY },
  hierarchyKey: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  keyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PRIMARY_GREEN },
  keyText: { fontSize: 9.5, color: TEXT_MUTED },
  ledger: { backgroundColor: '#FFFFFF', borderRadius: 3, overflow: 'hidden' },
  categoryBlock: { backgroundColor: '#FFFFFF' },
  blockDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E7EAE8' },
  categoryRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  categoryIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2F5F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryCopy: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  categoryMeta: { marginTop: 2, fontSize: 10, color: TEXT_MUTED },
  limitWrap: {
    width: 92,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C9D0CD',
  },
  limitCurrency: { fontSize: 12, color: TEXT_SECONDARY },
  limitInput: { flex: 1, textAlign: 'right', fontSize: 15, color: TEXT_PRIMARY, paddingVertical: 8 },
  childPanel: {
    position: 'relative',
    backgroundColor: '#F2F7F4',
    paddingVertical: 9,
    paddingLeft: 34,
    paddingRight: 14,
  },
  childRail: {
    position: 'absolute',
    left: 21,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: PRIMARY_GREEN,
  },
  childRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center' },
  childNode: {
    position: 'absolute',
    left: -17,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: PRIMARY_GREEN,
  },
  childName: { flex: 1, fontSize: 12.5, color: TEXT_PRIMARY },
  childInputWrap: {
    width: 84,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#BFC9C4',
  },
  childCurrency: { fontSize: 10.5, color: TEXT_MUTED },
  childInput: { flex: 1, textAlign: 'right', paddingVertical: 6, fontSize: 13, color: TEXT_PRIMARY },
  unallocatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C9D7D0',
  },
  unallocatedLabel: { fontSize: 10.5, color: TEXT_SECONDARY },
  unallocatedValue: { fontSize: 10.5, color: TEXT_PRIMARY, fontVariant: ['tabular-nums'] },
  autoHint: { marginTop: 7, fontSize: 10, color: '#B56D15', textAlign: 'right' },
});
