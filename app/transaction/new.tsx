import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Dimensions,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Text, View } from "@/components/Themed";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DatePickerModal } from "@/components/DatePickerModal";
import { DashedDivider, MoneyNumpad } from "@/components/rich";
import {
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  EXPENSE_RED,
  INCOME_GREEN,
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
  TransactionType,
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

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const list = await listAccountsWithBalances(db);
      setAccounts(list);
      const last = await getLastUsedAccountId(db);
      const chosen =
        last && list.some((a) => a.id === last) ? last : (list[0]?.id ?? "");
      setAccountId(chosen);
      const chosenAccount = list.find((a) => a.id === chosen);
      setSelectedAccountName(chosenAccount?.name ?? "Account");

      // Load existing categories + which ones have subcategories (for the "…" badge)
      const cats = await listCategories(db);
      setCategories(cats);
      const withCounts = await listCategoriesWithSubcategoryCounts(db);
      setCatsWithSubs(
        new Set(
          withCounts.filter((c) => c.subcategoryCount > 0).map((c) => c.name),
        ),
      );
    })();
  }, []);

  useEffect(() => {
    if (typeof initialDateParam === "string" && isIsoDate(initialDateParam)) {
      setDate(initialDateParam);
    }
  }, [initialDateParam]);

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
    return (
      [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].find(
        (category) => category.name === name,
      )?.icon ??
      categories.find((category) => category.name === name)?.icon ??
      null
    );
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
      const cat = await ensureCategory(db, selectedCategory, iconForCategory(selectedCategory));
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
  const defaultCategories = type === "income" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_CATEGORIES;
  const builtInNames = new Set(
    [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].map((category) => category.name),
  );
  const displayCategories: CatCell[] = [
    ...defaultCategories.map((c) => ({ name: c.name, iconId: c.icon })),
    ...categories
      .filter((category) => !builtInNames.has(category.name))
      .map((c) => ({ name: c.name, iconId: c.icon })),
    { name: "管理分类", manage: true },
  ];
  const canSaveTransaction =
    Boolean(selectedCategory && accountId) &&
    evalPending(parseFloat(amountStr) || 0) > 0 &&
    !saving;

  // Chunk into rows so the subcategory zone can expand under the selected row.
  const COLUMNS = 5;
  const categoryRows: CatCell[][] = [];
  for (let i = 0; i < displayCategories.length; i += COLUMNS) {
    categoryRows.push(displayCategories.slice(i, i + COLUMNS));
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
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
        <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
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
      </View>
      <DashedDivider style={styles.amountDivider} />

      {/* Category grid */}
      <ScrollView
        style={styles.categoryScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoryGrid}>
          {categoryRows.map((row, rowIdx) => {
            const selIdx = row.findIndex((c) => c.name === selectedCategory);
            const showZone = selIdx !== -1 && subcategories.length > 0;
            return (
              <View key={rowIdx}>
                <View style={styles.catRow}>
                  {row.map((cat) =>
                    cat.manage ? (
                      <Pressable
                        key="__manage"
                        style={styles.categoryItem}
                        onPress={() => router.push("/categories")}
                      >
                        <View style={[styles.categoryIcon, styles.manageIcon]}>
                          <FontAwesome name="cog" size={22} color="#FFFFFF" />
                        </View>
                        <Text style={styles.categoryName}>管理分类</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        key={cat.name}
                        style={styles.categoryItem}
                        onPress={() => onSelectCategory(cat.name)}
                      >
                        <View
                          style={[
                            styles.categoryIcon,
                            selectedCategory === cat.name &&
                              styles.categoryIconSelected,
                          ]}
                        >
                          <CategoryIcon id={cat.iconId ?? undefined} name={cat.name} size={26} />
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
                            selIdx * CATEGORY_ITEM_WIDTH +
                            CATEGORY_ITEM_WIDTH / 2 -
                            8,
                        },
                      ]}
                    />
                    <View style={styles.subGrid}>
                      {subcategories.map((s) => {
                        const active = selectedSubId === s.id;
                        return (
                          <Pressable
                            key={s.id}
                            style={styles.subItem}
                            onPress={() => setSelectedSubId(active ? null : s.id)}
                          >
                            <View
                              style={[
                                styles.subItemIcon,
                                active && styles.subItemIconSelected,
                              ]}
                            >
                              <FontAwesome
                                name="tag"
                                size={16}
                                color={active ? PRIMARY_GREEN : TEXT_SECONDARY}
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
                      <Pressable style={styles.subItem} onPress={onAddSubcategory}>
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
              style={styles.noteTextInput}
              value={note}
              onChangeText={(v) => setNote(v.slice(0, 100))}
              placeholder="备注..."
              placeholderTextColor={TEXT_SECONDARY}
              maxLength={100}
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
                <Pressable
                  style={[
                    styles.accountSheetRow,
                    !accountId && styles.accountSheetRowActive,
                  ]}
                  onPress={() => {
                    setAccountId("");
                    setSelectedAccountName("不选择账户");
                    setShowAccountPicker(false);
                  }}
                >
                  <View style={[styles.accountSheetIcon, { backgroundColor: "#EDEDED" }]}>
                    <FontAwesome name="close" size={14} color={TEXT_SECONDARY} />
                  </View>
                  <Text style={styles.accountSheetName}>不选择账户</Text>
                  <View style={{ width: 84 }} />
                </Pressable>

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
      </View>

      <Modal visible={showSubModal} transparent animationType="fade" onRequestClose={() => setShowSubModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowSubModal(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.modalTitle}>添加子类</Text>
              <Pressable onPress={onSaveSubcategory} disabled={!subInput.trim() || savingSubcategory}>
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

const { width } = Dimensions.get("window");
const CATEGORY_ITEM_WIDTH = (width - 32) / 5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 8,
  },
  typeToggle: {
    flexDirection: "row",
    marginLeft: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    padding: 2,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
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
    padding: 8,
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
  cursor: {
    color: PRIMARY_GREEN,
    fontWeight: "300",
  },
  categoryScroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  categoryGrid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  catRow: {
    flexDirection: "row",
  },
  categoryItem: {
    width: CATEGORY_ITEM_WIDTH,
    alignItems: "center",
    paddingVertical: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryIconSelected: {
    backgroundColor: `${PRIMARY_GREEN}20`,
    borderWidth: 2,
    borderColor: PRIMARY_GREEN,
  },
  manageIcon: {
    backgroundColor: PRIMARY_GREEN,
  },
  catBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#D8D8D8",
    justifyContent: "center",
    alignItems: "center",
  },
  catBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: -4,
  },
  categoryName: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
  categoryNameSelected: {
    color: PRIMARY_GREEN,
    fontWeight: "500",
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
    backgroundColor: "#F8F8F8",
  },
  subZone: {
    position: "relative",
    backgroundColor: "#F0F0F0",
    borderRadius: 0,
    marginTop: 2,
    marginBottom: 8,
    paddingTop: 14,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
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
    borderBottomColor: "#F0F0F0",
  },
  subGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  subItem: {
    width: CATEGORY_ITEM_WIDTH,
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
    backgroundColor: `${PRIMARY_GREEN}20`,
    borderWidth: 2,
    borderColor: PRIMARY_GREEN,
  },
  subItemName: {
    fontSize: 10,
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
  subItemNameSelected: {
    color: PRIMARY_GREEN,
    fontWeight: "500",
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
  modalCancel: { fontSize: 13, color: TEXT_SECONDARY },
  modalTitle: { fontSize: 15, fontWeight: "600", color: TEXT_PRIMARY },
  modalSave: { fontSize: 13, fontWeight: "600", color: PRIMARY_GREEN },
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
