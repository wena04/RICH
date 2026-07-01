import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Dimensions,
  Modal,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Text, View } from "@/components/Themed";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DatePickerModal } from "@/components/DatePickerModal";
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
import { isoDateToday, isIsoDate } from "@/src/utils/date";
import { centsToYuan } from "@/src/utils/money";
import { newId } from "@/src/utils/id";

import { DEFAULT_CATEGORIES } from "@/src/domain/categories";
const MONTH_NAMES_CN = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

function formatDateCN(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${parseInt(month)}月${parseInt(day)}日`;
}

// RN can't reliably render a dashed bottom-border, so draw the dashes manually.
function DashedLine() {
  return (
    <View style={styles.dashRow}>
      {Array.from({ length: 60 }).map((_, i) => (
        <View key={i} style={styles.dash} />
      ))}
    </View>
  );
}

export default function NewTransactionScreen() {
  const router = useRouter();
  const { date: initialDateParam } = useLocalSearchParams<{ date?: string }>();
  const today = new Date();

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

  // Inline "add subcategory" from the entry tray.
  function onAddSubcategory() {
    if (!selectedCategory) return;
    setSubInput("");
    setShowSubModal(true);
  }

  async function onSaveSubcategory() {
    if (!selectedCategory) return;
    const name = subInput.trim().slice(0, 20);
    if (!name) return;
    const db = await getDb();
    const cat = await ensureCategory(db, selectedCategory);
    const sub = await ensureSubcategory(db, cat.id, name);
    setSubcategories(await listSubcategories(db, cat.id));
    setSelectedSubId(sub.id);
    setShowSubModal(false);
    setSubInput("");
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
      const category = await ensureCategory(db, selectedCategory);

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

  // All categories to display (default + user created), plus the 管理分类 tile.
  type CatCell = { name: string; iconId?: string | null; manage?: boolean };
  const displayCategories: CatCell[] = [
    ...DEFAULT_CATEGORIES.map((c) => ({ name: c.name, iconId: c.icon })),
    ...categories
      .filter((c) => !DEFAULT_CATEGORIES.some((dc) => dc.name === c.name))
      .map((c) => ({ name: c.name, iconId: c.icon })),
    { name: "管理分类", manage: true },
  ];

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
            onPress={() => setType("expense")}
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
            onPress={() => setType("income")}
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
          <Text style={styles.dateText}>{formatDateCN(date)} ▼</Text>
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
      <DashedLine />

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
                      <Pressable
                        style={styles.subItem}
                        onPress={onAddSubcategory}
                      >
                        <View style={[styles.subItemIcon, styles.subAddIcon]}>
                          <FontAwesome
                            name="plus"
                            size={14}
                            color={TEXT_SECONDARY}
                          />
                        </View>
                        <Text style={styles.subItemName}>添加</Text>
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
          <View style={styles.numpadContainer}>
            {/* Left side: digit grid */}
            <View style={styles.numpadGrid}>
              <View style={styles.numpadRow}>
                <Pressable
                  style={styles.numKey}
                  onPress={() => handleNumPress("1")}
                >
                  <Text style={styles.numKeyText}>1</Text>
                </Pressable>
                <Pressable
                  style={styles.numKey}
                  onPress={() => handleNumPress("2")}
                >
                  <Text style={styles.numKeyText}>2</Text>
                </Pressable>
                <Pressable
                  style={styles.numKey}
                  onPress={() => handleNumPress("3")}
                >
                  <Text style={styles.numKeyText}>3</Text>
                </Pressable>
              </View>
              <View style={styles.numpadRow}>
                <Pressable
                  style={styles.numKey}
                  onPress={() => handleNumPress("4")}
                >
                  <Text style={styles.numKeyText}>4</Text>
                </Pressable>
                <Pressable
                  style={styles.numKey}
                  onPress={() => handleNumPress("5")}
                >
                  <Text style={styles.numKeyText}>5</Text>
                </Pressable>
                <Pressable
                  style={styles.numKey}
                  onPress={() => handleNumPress("6")}
                >
                  <Text style={styles.numKeyText}>6</Text>
                </Pressable>
              </View>
              <View style={styles.numpadRow}>
                <Pressable
                  style={styles.numKey}
                  onPress={() => handleNumPress("7")}
                >
                  <Text style={styles.numKeyText}>7</Text>
                </Pressable>
                <Pressable
                  style={styles.numKey}
                  onPress={() => handleNumPress("8")}
                >
                  <Text style={styles.numKeyText}>8</Text>
                </Pressable>
                <Pressable
                  style={styles.numKey}
                  onPress={() => handleNumPress("9")}
                >
                  <Text style={styles.numKeyText}>9</Text>
                </Pressable>
              </View>
              <View style={styles.numpadRow}>
                <Pressable style={styles.numKey} onPress={handleBackspace}>
                  <FontAwesome
                    name="long-arrow-left"
                    size={20}
                    color={TEXT_PRIMARY}
                  />
                </Pressable>
                <Pressable
                  style={styles.numKey}
                  onPress={() => handleNumPress("0")}
                >
                  <Text style={styles.numKeyText}>0</Text>
                </Pressable>
                <Pressable
                  style={styles.numKey}
                  onPress={() => handleNumPress(".")}
                >
                  <Text style={styles.numKeyText}>.</Text>
                </Pressable>
              </View>
            </View>

            {/* Right side: operators + confirm */}
            <View style={styles.numpadOps}>
              <Pressable style={styles.numKeyOp} onPress={() => handleOperator("+")}>
                <Text style={styles.numKeyOpText}>+</Text>
              </Pressable>
              <Pressable style={styles.numKeyOp} onPress={() => handleOperator("-")}>
                <Text style={styles.numKeyOpText}>−</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.confirmKey,
                  (!selectedCategory || amountStr === "0") &&
                    styles.confirmKeyDisabled,
                ]}
                onPress={onSave}
                disabled={!selectedCategory || amountStr === "0" || saving}
              >
                <Text style={styles.confirmKeyText}>
                  {saving ? "..." : "确定"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <Modal visible={showSubModal} animationType="slide" transparent>
        <View style={styles.subModalOverlay}>
          <View style={styles.subModalContent}>
            <View style={styles.subModalHeader}>
              <Pressable onPress={() => setShowSubModal(false)}>
                <Text style={styles.subModalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.subModalTitle}>添加子类</Text>
              <Pressable onPress={onSaveSubcategory}>
                <Text style={styles.subModalSave}>保存</Text>
              </Pressable>
            </View>
            <View style={styles.subModalBody}>
              <Text style={styles.subModalHint}>
                为「{selectedCategory}」添加子分类
              </Text>
              <TextInput
                value={subInput}
                onChangeText={setSubInput}
                placeholder="子分类名称"
                style={styles.subModalInput}
                placeholderTextColor={TEXT_SECONDARY}
                maxLength={20}
                autoFocus
              />
            </View>
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
  dashRow: {
    flexDirection: "row",
    overflow: "hidden",
    height: 1,
    marginHorizontal: 18,
    marginBottom: 6,
  },
  dash: { width: 5, height: 1, backgroundColor: "#D8D8D8", marginRight: 4 },
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
    paddingBottom: 20,
  },
  numpadContainer: {
    flexDirection: "row",
  },
  numpadGrid: {
    flex: 3,
  },
  numpadOps: {
    flex: 1,
  },
  numpadRow: {
    flexDirection: "row",
  },
  numKey: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
  },
  numKeyText: {
    fontSize: 22,
    color: TEXT_PRIMARY,
  },
  numKeyOp: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
  },
  numKeyOpText: {
    fontSize: 24,
    color: TEXT_PRIMARY,
  },
  confirmKey: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
  },
  confirmKeyDisabled: {
    backgroundColor: "#666666",
  },
  confirmKeyText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  subZone: {
    position: "relative",
    backgroundColor: "#F0F0F0",
    borderRadius: 14,
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
  subModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  subModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  subModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  subModalCancel: { fontSize: 16, color: TEXT_SECONDARY },
  subModalTitle: { fontSize: 17, fontWeight: "600", color: TEXT_PRIMARY },
  subModalSave: { fontSize: 16, fontWeight: "600", color: PRIMARY_GREEN },
  subModalBody: { padding: 16 },
  subModalHint: { fontSize: 14, color: TEXT_SECONDARY, marginBottom: 12 },
  subModalInput: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 10,
  },
});
