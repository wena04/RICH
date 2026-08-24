import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  useWindowDimensions,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect } from "@react-navigation/native";

import { Text, View } from "@/components/Themed";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DatePickerModal } from "@/components/DatePickerModal";
import { DashedDivider, MoneyNumpad } from "@/components/rich";
import {
  ACCESSIBLE_GREEN,
  CATEGORY_FRAME_BACKGROUND,
  CONTROL_BACKGROUND,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/constants/Colors";
import { getDb } from "@/src/db/db";
import {
  getLastUsedAccountId,
  listAccountsWithBalances,
  type AccountWithBalance,
} from "@/src/db/repo/accounts";
import {
  ensureCategory,
  getCategoryByName,
  listCategories,
  listCategoriesWithSubcategoryCounts,
  listSubcategories,
  ensureSubcategory,
} from "@/src/db/repo/categories";
import { createTransaction } from "@/src/db/repo/transactions";
import type {
  Category,
  Subcategory,
} from "@/src/domain/types";
import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/src/domain/categories";
import { formatIsoDateCN, isIsoDate, isoDateToday } from "@/src/utils/date";
import { centsToYuan } from "@/src/utils/money";
import { newId } from "@/src/utils/id";

export default function NewTransactionScreen() {
  const router = useRouter();
  const { date: initialDateParam } = useLocalSearchParams<{ date?: string }>();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amountStr, setAmountStr] = useState("0");
  const [date, setDate] = useState(isoDateToday());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [selectedAccountName, setSelectedAccountName] = useState<string>("");
  const [note, setNote] = useState("");
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  // Category names that have subcategories (for the "…" badge).
  const [catsWithSubs, setCatsWithSubs] = useState<Set<string>>(new Set());
  const [pendingValue, setPendingValue] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<"+" | "-" | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subInput, setSubInput] = useState("");
  const [savingSubcategory, setSavingSubcategory] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);
  const noteInputRef = useRef<TextInput>(null);
  const { width: viewportWidth } = useWindowDimensions();

  useEffect(() => {
    if (typeof initialDateParam === "string" && isIsoDate(initialDateParam)) {
      setDate(initialDateParam);
    }
  }, [initialDateParam]);

  const loadChoices = useCallback(async () => {
    try {
      const db = await getDb();
      const list = await listAccountsWithBalances(db);
      setAccounts(list);
      const last = await getLastUsedAccountId(db);
      setAccountId((current) => {
        const chosen =
          current && list.some((account) => account.id === current)
            ? current
            : last && list.some((account) => account.id === last)
              ? last
              : (list[0]?.id ?? "");
        setSelectedAccountName(list.find((account) => account.id === chosen)?.name ?? "选择账户");
        return chosen;
      });

      // Load existing categories + which ones have subcategories (for the "…" badge)
      const cats = await listCategories(db);
      setCategories(cats);
      const withCounts = await listCategoriesWithSubcategoryCounts(db);
      setCatsWithSubs(
        new Set(
          withCounts.filter((c) => c.subcategoryCount > 0).map((c) => c.name),
        ),
      );
    } catch (error) {
      console.error('Failed to load transaction choices:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChoices();
    }, [loadChoices]),
  );

  // When a category is tapped, load its subcategories (if it exists in the DB yet).
  async function onSelectCategory(name: string) {
    setSelectedCategory(name);
    setSelectedSubId(null);
    try {
      const db = await getDb();
      const existing = await getCategoryByName(db, name);
      setSubcategories(existing ? await listSubcategories(db, existing.id) : []);
    } catch {
      setSubcategories([]);
    }
  }

  function iconForCategory(name: string): string | null {
    return categories.find((category) => category.name === name)?.icon ?? null;
  }

  function onAddSubcategory() {
    if (!selectedCategory) return;
    setSubInput("");
    setShowSubModal(true);
  }

  async function onSaveSubcategory() {
    const name = subInput.trim().slice(0, 20);
    if (!selectedCategory || !name || savingSubcategory) return;
    setSavingSubcategory(true);
    try {
      const db = await getDb();
      const cat = await ensureCategory(
        db,
        selectedCategory,
        iconForCategory(selectedCategory),
        type,
      );
      const sub = await ensureSubcategory(db, cat.id, name);
      setSubcategories(await listSubcategories(db, cat.id));
      setSelectedSubId(sub.id);
      setCatsWithSubs((current) => new Set(current).add(selectedCategory));
      setShowSubModal(false);
      setSubInput("");
    } finally {
      setSavingSubcategory(false);
    }
  }

  // Numpad handlers
  const handleNumPress = (num: string) => {
    if (num !== "." && amountStr.replace(".", "").length >= 9) return;
    if (amountStr === "0" && num !== ".") {
      setAmountStr(num);
    } else if (num === "." && amountStr.includes(".")) {
      // Don't add second decimal
      return;
    } else if (
      amountStr.includes(".") &&
      amountStr.split(".")[1]?.length >= 2
    ) {
      // Max 2 decimal places
      return;
    } else {
      setAmountStr(amountStr + num);
    }
  };

  const handleBackspace = () => {
    if (amountStr.length <= 1) {
      setAmountStr("0");
    } else {
      setAmountStr(amountStr.slice(0, -1));
    }
  };

  // Inline calculator: fold any pending "+/-" operation into the current amount.
  function evalPending(cur: number): number {
    if (pendingOp && pendingValue != null) {
      return pendingOp === "+" ? pendingValue + cur : pendingValue - cur;
    }
    return cur;
  }
  function handleOperator(op: "+" | "-") {
    const cur = parseFloat(amountStr) || 0;
    setPendingValue(evalPending(cur));
    setPendingOp(op);
    setAmountStr("0");
  }

  async function onSave() {
    if (saving) return;

    const total = evalPending(parseFloat(amountStr) || 0);
    const cents = Math.round(total * 100);
    if (isNaN(cents) || cents <= 0) return;
    if (!selectedCategory) return;
    if (!accountId) return;

    setSaving(true);
    try {
      const db = await getDb();
      const category = await ensureCategory(
        db,
        selectedCategory,
        iconForCategory(selectedCategory),
        type,
      );

      const subcategoryId =
        selectedSubId && subcategories.some((s) => s.id === selectedSubId)
          ? selectedSubId
          : null;

      await createTransaction(db, {
        id: newId("txn"),
        type,
        amountCents: cents,
        date,
        accountId,
        categoryId: category.id,
        subcategoryId,
        note: note.trim() ? note.trim().slice(0, 100) : null,
      });

      router.back();
    } catch (e) {
      console.error("Failed to save transaction:", e);
      Alert.alert('没有保存', e instanceof Error ? e.message : '请检查金额、分类和账户。');
    } finally {
      setSaving(false);
    }
  }

  function onSelectType(nextType: "expense" | "income") {
    if (nextType === type) return;
    setType(nextType);
    setSelectedCategory(null);
    setSubcategories([]);
    setSelectedSubId(null);
  }

  // All categories to display (default + user created), plus the 管理分类 tile.
  type CatCell = { name: string; iconId?: string | null; manage?: boolean };
  const defaultOrder = useMemo(
    () =>
      new Map(
        (type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_CATEGORIES).map(
          (category, index) => [category.name, index],
        ),
      ),
    [type],
  );
  const displayCategories: CatCell[] = useMemo(
    () => [
      ...categories
        .filter((category) => category.kind === type || category.kind === 'both')
        .sort((left, right) => {
          const leftOrder = defaultOrder.get(left.name) ?? Number.MAX_SAFE_INTEGER;
          const rightOrder = defaultOrder.get(right.name) ?? Number.MAX_SAFE_INTEGER;
          return leftOrder === rightOrder
            ? left.name.localeCompare(right.name, 'zh-CN')
            : leftOrder - rightOrder;
        })
        .map((category) => ({ name: category.name, iconId: category.icon })),
      { name: '管理分类', manage: true },
    ],
    [categories, defaultOrder, type],
  );
  const canSaveTransaction =
    Boolean(selectedCategory && accountId) &&
    evalPending(parseFloat(amountStr) || 0) > 0 &&
    !saving;

  // Chunk into rows so the subcategory zone can expand under the selected row.
  const categoryColumns = viewportWidth < 360 ? 4 : 5;
  const categoryGridWidth = Math.min(viewportWidth, 430);
  const categoryItemWidth = (categoryGridWidth - 32) / categoryColumns;
  const categoryRows: CatCell[][] = [];
  for (let i = 0; i < displayCategories.length; i += categoryColumns) {
    categoryRows.push(displayCategories.slice(i, i + categoryColumns));
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <FontAwesome name="chevron-left" size={18} color={TEXT_PRIMARY} />
        </Pressable>

        {/* Type toggle */}
        <View style={styles.typeToggle}>
          <Pressable
            style={[
              styles.typeButton,
              type === "expense" && styles.typeButtonActive,
            ]}
            onPress={() => onSelectType("expense")}
            accessibilityRole="tab"
            accessibilityState={{ selected: type === 'expense' }}
          >
            <Text
              style={[
                styles.typeText,
                type === "expense" && styles.typeTextActive,
              ]}
            >
              支出
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.typeButton,
              type === "income" && styles.typeButtonActive,
            ]}
            onPress={() => onSelectType("income")}
            accessibilityRole="tab"
            accessibilityState={{ selected: type === 'income' }}
          >
            <Text
              style={[
                styles.typeText,
                type === "income" && styles.typeTextActive,
              ]}
            >
              收入
            </Text>
          </Pressable>
        </View>

        {/* Date selector */}
        <Pressable
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
          accessibilityLabel={`选择日期，当前${formatIsoDateCN(date)}`}
        >
          <Text style={styles.dateText}>{formatIsoDateCN(date)} ▼</Text>
        </Pressable>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onSelect={setDate}
        onClose={() => setShowDatePicker(false)}
      />

      {/* Amount display */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountText}>
          ¥{amountStr}
          <Text style={styles.cursor}>|</Text>
        </Text>
        {pendingOp && pendingValue != null ? (
          <Text style={styles.pendingText}>
            ¥{centsToYuan(Math.round(pendingValue * 100))} {pendingOp} 当前输入
          </Text>
        ) : null}
      </View>
      <DashedDivider style={styles.amountDivider} />

      {selectedCategory ? (
        <View style={styles.selectionPath}>
          <Text style={styles.selectionEyebrow}>{type === 'expense' ? '支出分类' : '收入分类'}</Text>
          <Text style={styles.selectionValue} numberOfLines={1}>
            {selectedCategory}
            {selectedSubId
              ? `  ›  ${subcategories.find((subcategory) => subcategory.id === selectedSubId)?.name ?? ''}`
              : '  ›  不细分'}
          </Text>
        </View>
      ) : null}

      {/* Category grid */}
      <ScrollView
        style={styles.categoryScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.categoryGrid, { width: categoryGridWidth }]}>
          {categoryRows.map((row, rowIdx) => {
            const selIdx = row.findIndex((c) => c.name === selectedCategory);
            const showZone = selIdx !== -1;
            return (
              <View key={rowIdx}>
                <View style={styles.catRow}>
                  {row.map((cat) =>
                    cat.manage ? (
                      <Pressable
                        key="__manage"
                        style={[styles.categoryItem, { width: categoryItemWidth }]}
                        onPress={() => router.push("/categories")}
                        accessibilityRole="button"
                        accessibilityLabel="管理分类"
                      >
                        <View style={[styles.categoryIcon, styles.manageIcon]}>
                          <CategoryIcon
                            id="gear"
                            size={25}
                            color="#FFFFFF"
                            accentColor="#FFFFFF"
                          />
                        </View>
                        <Text style={styles.categoryName}>管理分类</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        key={cat.name}
                        style={[styles.categoryItem, { width: categoryItemWidth }]}
                        onPress={() => onSelectCategory(cat.name)}
                        accessibilityRole="button"
                        accessibilityLabel={`${cat.name}${catsWithSubs.has(cat.name) ? '，有子分类' : ''}`}
                        accessibilityState={{ selected: selectedCategory === cat.name }}
                      >
                        <View
                          style={[
                            styles.categoryIcon,
                            selectedCategory === cat.name &&
                              styles.categoryIconSelected,
                          ]}
                        >
                          <CategoryIcon
                            id={cat.iconId ?? undefined}
                            name={cat.name}
                            size={27}
                            color={selectedCategory === cat.name ? '#181A19' : '#858B88'}
                          />
                          {catsWithSubs.has(cat.name) && (
                            <View style={styles.catBadge}>
                              <Text style={styles.catBadgeText}>⋯</Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.categoryName,
                            selectedCategory === cat.name &&
                              styles.categoryNameSelected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    ),
                  )}
                </View>

                {/* Inline subcategory zone — expands under the selected category */}
                {showZone && (
                  <View style={styles.subZone}>
                    <View
                      style={[
                        styles.subZoneCaret,
                        {
                          left:
                            selIdx * categoryItemWidth +
                            categoryItemWidth / 2 -
                            8,
                        },
                      ]}
                    />
                    <View style={styles.subZoneHeader}>
                      <Text style={styles.subZoneTitle}>{selectedCategory} · 子分类</Text>
                      <Text style={styles.subZoneHint}>可选，下一次仍可修改</Text>
                    </View>
                    <View style={styles.subGrid}>
                      <Pressable
                        style={[styles.subItem, { width: categoryItemWidth }]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: selectedSubId == null }}
                        onPress={() => setSelectedSubId(null)}
                      >
                        <View
                          style={[
                            styles.subItemIcon,
                            selectedSubId == null && styles.subItemIconSelected,
                          ]}
                        >
                          <FontAwesome
                            name="circle-o"
                            size={16}
                            color={selectedSubId == null ? '#181A19' : TEXT_SECONDARY}
                          />
                        </View>
                        <Text
                          style={[
                            styles.subItemName,
                            selectedSubId == null && styles.subItemNameSelected,
                          ]}
                        >
                          不细分
                        </Text>
                      </Pressable>
                      {subcategories.map((s) => {
                        const active = selectedSubId === s.id;
                        return (
                          <Pressable
                            key={s.id}
                            style={[styles.subItem, { width: categoryItemWidth }]}
                            onPress={() => setSelectedSubId(active ? null : s.id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                          >
                            <View
                              style={[
                                styles.subItemIcon,
                                active && styles.subItemIconSelected,
                              ]}
                            >
                              <CategoryIcon
                                name={s.name}
                                size={22}
                                color={active ? '#181A19' : '#858B88'}
                              />
                            </View>
                            <Text
                              style={[
                                styles.subItemName,
                                active && styles.subItemNameSelected,
                              ]}
                            >
                              {s.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                      <Pressable
                        style={[styles.subItem, { width: categoryItemWidth }]}
                        onPress={onAddSubcategory}
                        accessibilityRole="button"
                        accessibilityLabel={`给${selectedCategory}添加子分类`}
                      >
                        <View style={[styles.subItemIcon, styles.subAddIcon]}>
                          <FontAwesome name="plus" size={14} color={TEXT_SECONDARY} />
                        </View>
                        <Text style={styles.subItemName}>添加子类</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom section: Account + Note + Numpad */}
      <View style={styles.bottomSection}>
        {/* Account and Note bar */}
        <View style={styles.bottomBar}>
          <Pressable
            style={styles.accountSelector}
            onPress={() => setShowAccountPicker(true)}
          >
            <View style={styles.accountIcon}>
              <FontAwesome name="bank" size={14} color="#FFA500" />
            </View>
            <Text style={styles.accountName}>{selectedAccountName}</Text>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={TEXT_SECONDARY}
            />
          </Pressable>

          <View style={styles.noteInput}>
            <FontAwesome name="pencil" size={14} color={TEXT_SECONDARY} />
            <TextInput
              ref={noteInputRef}
              style={styles.noteTextInput}
              value={note}
              onChangeText={(v) => setNote(v.slice(0, 100))}
              onFocus={() => setNoteFocused(true)}
              onBlur={() => setNoteFocused(false)}
              placeholder="备注..."
              placeholderTextColor={TEXT_SECONDARY}
              maxLength={100}
              returnKeyType="done"
              blurOnSubmit
            />
          </View>
        </View>

        <Modal visible={showAccountPicker} animationType="slide" transparent>
          <View style={styles.accountSheetOverlay}>
            <Pressable
              style={styles.accountSheetBackdrop}
              onPress={() => setShowAccountPicker(false)}
            />
            <View style={styles.accountSheet}>
              <Text style={styles.accountSheetTitle}>
                {type === "expense" ? "选择支出账户" : "选择收入账户"}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {accounts.map((acc) => (
                  <Pressable
                    key={acc.id}
                    style={[
                      styles.accountSheetRow,
                      acc.id === accountId && styles.accountSheetRowActive,
                    ]}
                    onPress={() => {
                      setAccountId(acc.id);
                      setSelectedAccountName(acc.name);
                      setShowAccountPicker(false);
                    }}
                  >
                    <View style={[styles.accountSheetIcon, { backgroundColor: "#FFF3E0" }]}>
                      <FontAwesome name="money" size={14} color="#FF9D2E" />
                    </View>
                    <Text style={styles.accountSheetName}>{acc.name}</Text>
                    <Text style={styles.accountSheetBal}>
                      ¥ {centsToYuan(acc.balanceCents)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Custom numpad */}
        {noteFocused ? (
          <View style={styles.noteEditingBar}>
            <Text style={styles.noteEditingHint}>正在编辑备注</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="完成备注"
              onPress={() => noteInputRef.current?.blur()}
              style={styles.noteDoneButton}
            >
              <Text style={styles.noteDoneText}>完成</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.numpad}>
            <MoneyNumpad
              onDigit={handleNumPress}
              onBackspace={handleBackspace}
              operators={[
                { label: "+", accessibilityLabel: "加", onPress: () => handleOperator("+") },
                { label: "−", accessibilityLabel: "减", onPress: () => handleOperator("-") },
              ]}
              onConfirm={onSave}
              confirmDisabled={!canSaveTransaction}
              confirmLabel={saving ? "..." : "确定"}
            />
          </View>
        )}
      </View>

      <Modal visible={showSubModal} transparent animationType="fade" onRequestClose={() => setShowSubModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Pressable style={styles.modalAction} onPress={() => setShowSubModal(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.modalTitle}>添加子类</Text>
              <Pressable
                style={styles.modalAction}
                onPress={onSaveSubcategory}
                disabled={!subInput.trim() || savingSubcategory}
              >
                <Text style={[styles.modalSave, (!subInput.trim() || savingSubcategory) && styles.modalSaveDisabled]}>
                  保存
                </Text>
              </Pressable>
            </View>
            <Text style={styles.modalHint}>为「{selectedCategory}」添加一个子分类</Text>
            <TextInput
              autoFocus
              value={subInput}
              onChangeText={(value) => setSubInput(value.slice(0, 20))}
              style={styles.modalInput}
              placeholder="子分类名称"
              placeholderTextColor="#A0A0A0"
              returnKeyType="done"
              onSubmitEditing={onSaveSubcategory}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  typeToggle: {
    flexDirection: "row",
    marginLeft: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    padding: 2,
  },
  typeButton: {
    minHeight: 36,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  typeButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  typeText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  typeTextActive: {
    color: TEXT_PRIMARY,
    fontWeight: "600",
  },
  dateButton: {
    marginLeft: "auto",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  amountContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  amountDivider: {
    marginHorizontal: 18,
    marginBottom: 6,
  },
  amountText: {
    fontSize: 42,
    fontWeight: "300",
    color: TEXT_PRIMARY,
    letterSpacing: -1,
  },
  pendingText: {
    marginTop: 3,
    fontSize: 10.5,
    color: TEXT_SECONDARY,
    fontVariant: ['tabular-nums'],
  },
  cursor: {
    color: PRIMARY_GREEN,
    fontWeight: "300",
  },
  selectionPath: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#F2F8F5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D7E6DE',
  },
  selectionEyebrow: {
    fontSize: 10.5,
    fontWeight: '600',
    color: ACCESSIBLE_GREEN,
    marginRight: 12,
  },
  selectionValue: { flex: 1, fontSize: 11.5, fontWeight: '600', color: TEXT_PRIMARY },
  categoryScroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  categoryGrid: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  catRow: {
    flexDirection: "row",
  },
  categoryItem: {
    alignItems: "center",
    paddingVertical: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryIconSelected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  manageIcon: {
    backgroundColor: PRIMARY_GREEN,
  },
  catBadge: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#C9CCCA",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  catBadgeText: {
    fontSize: 9,
    lineHeight: 10,
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: -2,
  },
  categoryName: {
    fontSize: 11.5,
    color: "#4E5350",
    textAlign: "center",
  },
  categoryNameSelected: {
    color: "#181A19",
    fontWeight: "600",
  },
  bottomSection: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
  },
  accountSelector: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
  },
  accountIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  accountName: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    marginRight: 8,
  },
  noteInput: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    gap: 8,
  },
  noteTextInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_PRIMARY,
    padding: 0,
  },
  accountSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  accountSheetBackdrop: { flex: 1 },
  accountSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 14,
    paddingBottom: 22,
    paddingHorizontal: 16,
    maxHeight: "62%",
  },
  accountSheetTitle: { fontSize: 14, color: TEXT_SECONDARY, marginBottom: 10 },
  accountSheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  accountSheetRowActive: {
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  accountSheetIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  accountSheetName: { flex: 1, fontSize: 15, color: TEXT_PRIMARY },
  accountSheetBal: { width: 84, textAlign: "right", fontSize: 14, color: TEXT_PRIMARY },
  numpad: {
    backgroundColor: CONTROL_BACKGROUND,
  },
  noteEditingBar: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#F8F8F8",
  },
  noteEditingHint: { fontSize: 12, color: TEXT_SECONDARY },
  noteDoneButton: {
    minWidth: 72,
    minHeight: 44,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEXT_PRIMARY,
  },
  noteDoneText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  subZone: {
    position: "relative",
    backgroundColor: "#F4F6F5",
    borderRadius: 0,
    marginTop: 2,
    marginBottom: 8,
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  subZoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  subZoneTitle: { fontSize: 11.5, fontWeight: '600', color: TEXT_PRIMARY },
  subZoneHint: { fontSize: 10.5, color: TEXT_SECONDARY },
  subZoneCaret: {
    position: "absolute",
    top: -7,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#F4F6F5",
  },
  subGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  subItem: {
    alignItems: "center",
    paddingVertical: 8,
  },
  subItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  subItemIconSelected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  subItemName: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
  subItemNameSelected: {
    color: "#181A19",
    fontWeight: "600",
  },
  subAddIcon: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C8C8C8",
    borderStyle: "dashed",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 30,
  },
  modalHeader: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  modalAction: { minWidth: 52, minHeight: 44, alignItems: "center", justifyContent: "center" },
  modalCancel: { fontSize: 13, color: TEXT_SECONDARY },
  modalTitle: { fontSize: 15, fontWeight: "600", color: TEXT_PRIMARY },
  modalSave: { fontSize: 13, fontWeight: "600", color: ACCESSIBLE_GREEN },
  modalSaveDisabled: { color: "#B0B0B0" },
  modalHint: { fontSize: 11, color: TEXT_SECONDARY, paddingHorizontal: 18, paddingTop: 16 },
  modalInput: {
    marginHorizontal: 18,
    marginTop: 10,
    minHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: "#D8D8D8",
    color: TEXT_PRIMARY,
    fontSize: 15,
    paddingHorizontal: 2,
  },
});
