import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Text, View } from "@/components/Themed";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { DatePickerModal } from "@/components/DatePickerModal";
import { AccountIcon, DashedDivider, MoneyNumpad } from "@/components/rich";
import {
  ACCESSIBLE_GREEN,
  CATEGORY_FRAME_BACKGROUND,
  CONTROL_BACKGROUND,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  KEYPAD_BACKGROUND,
} from "@/constants/Colors";
import { getDb } from "@/src/db/db";
import {
  getLastUsedAccountId,
  listAccountsWithBalances,
  type AccountWithBalance,
} from "@/src/db/repo/accounts";
import {
  listCategories,
  listCategoriesWithSubcategoryCounts,
  listSubcategories,
} from "@/src/db/repo/categories";
import { createTransaction } from "@/src/db/repo/transactions";
import type {
  Category,
  Subcategory,
} from "@/src/domain/types";
import { sortCategoriesForDisplay } from "@/src/domain/categories";
import { formatIsoDateCN, isIsoDate, isoDateToday } from "@/src/utils/date";
import { RICH_NUMERAL_FONT, composerHeaderTuck } from "@/constants/Design";
import { centsToYuan } from "@/src/utils/money";
import { newId } from "@/src/utils/id";
import { RichChevron } from '@/components/rich/RichChevron';

export default function NewTransactionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { date: initialDateParam } = useLocalSearchParams<{ date?: string }>();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amountStr, setAmountStr] = useState("0");
  const [date, setDate] = useState(isoDateToday());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [selectedAccountName, setSelectedAccountName] = useState<string>("");
  const [note, setNote] = useState("");
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  // Stable category ids that have subcategories (for the "…" badge).
  const [catsWithSubs, setCatsWithSubs] = useState<Set<string>>(new Set());
  const [pendingValue, setPendingValue] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<"+" | "-" | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);
  const noteInputRef = useRef<TextInput>(null);
  const categoryLoadRequestRef = useRef(0);
  // Distinguish "choices failed to load" from "no categories/accounts".
  const [choicesError, setChoicesError] = useState(false);
  const { width: viewportWidth } = useWindowDimensions();

  useEffect(() => {
    if (typeof initialDateParam === "string" && isIsoDate(initialDateParam)) {
      setDate(initialDateParam);
    }
  }, [initialDateParam]);

  const loadChoices = useCallback(async () => {
    try {
      setChoicesError(false);
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
      setSelectedCategoryId((current) => {
        if (!current || cats.some((category) => category.id === current)) return current;
        categoryLoadRequestRef.current += 1;
        setSubcategories([]);
        setSelectedSubId(null);
        setExpandedCategoryId(null);
        return null;
      });
      const withCounts = await listCategoriesWithSubcategoryCounts(db);
      setCatsWithSubs(
        new Set(
          withCounts.filter((c) => c.subcategoryCount > 0).map((c) => c.id),
        ),
      );
    } catch (error) {
      console.error('Failed to load transaction choices:', error);
      setChoicesError(true);
    }
  }, []);

  const selectedCategoryIdRef = useRef<string | null>(null);
  selectedCategoryIdRef.current = selectedCategoryId;

  useFocusEffect(
    useCallback(() => {
      loadChoices();
      const current = selectedCategoryIdRef.current;
      if (current) {
        // Picks up a subcategory just added from the 添加子类 page.
        void getDb()
          .then((db) => listSubcategories(db, current))
          .then((rows) => {
            if (selectedCategoryIdRef.current === current) setSubcategories(rows);
          })
          .catch(() => undefined);
      }
    }, [loadChoices]),
  );

  // Category ids remain stable across renames and prevent stale names from
  // recreating categories after returning from the management screen.
  async function onSelectCategory(category: Category) {
    const requestId = ++categoryLoadRequestRef.current;
    if (category.id === selectedCategoryId) {
      setExpandedCategoryId((current) => (current === category.id ? null : category.id));
      return;
    }
    setSelectedCategoryId(category.id);
    setSelectedSubId(null);
    setExpandedCategoryId(category.id);
    try {
      const db = await getDb();
      const rows = await listSubcategories(db, category.id);
      if (requestId === categoryLoadRequestRef.current) setSubcategories(rows);
    } catch {
      if (requestId === categoryLoadRequestRef.current) setSubcategories([]);
    }
  }

  const selectedAccount = accounts.find((account) => account.id === accountId) ?? null;

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  // 添加子类 opens the original-style page: name + icon from the full icon library.
  function onAddSubcategory() {
    if (!selectedCategory) return;
    router.push({
      pathname: "/categories/add",
      params: { parentId: selectedCategory.id, parentName: selectedCategory.name, type },
    });
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
    if (!selectedCategoryId) return;
    if (!accountId) return;

    setSaving(true);
    try {
      const db = await getDb();

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
        categoryId: selectedCategoryId,
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
    categoryLoadRequestRef.current += 1;
    setType(nextType);
    setSelectedCategoryId(null);
    setExpandedCategoryId(null);
    setSubcategories([]);
    setSelectedSubId(null);
  }

  // All categories to display (default + user created), plus the 管理分类 tile.
  type CatCell = { id: string; name: string; iconId?: string | null; manage?: boolean };
  const displayCategories: CatCell[] = useMemo(
    () => [
      ...sortCategoriesForDisplay(
        categories.filter((category) => category.kind === type || category.kind === 'both'),
        type,
      ).map((category) => ({ id: category.id, name: category.name, iconId: category.icon })),
      { id: '__manage', name: '管理分类', manage: true },
    ],
    [categories, type],
  );
  const canSaveTransaction =
    !choicesError &&
    Boolean(selectedCategoryId && accountId) &&
    evalPending(parseFloat(amountStr) || 0) > 0 &&
    !saving;

  // Chunk into rows so the subcategory zone can expand under the selected row.
  const categoryColumns = viewportWidth < 360 ? 4 : 5;
  const categoryGridWidth = Math.min(viewportWidth, 430);
  const categoryItemWidth = (categoryGridWidth - 28.5) / categoryColumns;
  // The original sizes the composer (amount line, category grid, subcategory tray) with the screen
  // width, measured on 393pt and 402pt iPhones; the header and keypad stay fixed. Values below are
  // the 393pt measurements.
  const g = useMemo(() => composerGrid(Math.max(0.9, categoryGridWidth / 393)), [categoryGridWidth]);
  const categoryRows: CatCell[][] = [];
  for (let i = 0; i < displayCategories.length; i += categoryColumns) {
    categoryRows.push(displayCategories.slice(i, i + categoryColumns));
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: the original sits this row just under the status bar, 8.2pt below the safe area. */}
      <View style={[styles.header, { marginTop: -composerHeaderTuck(insets.top) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Image
            source={require("../../assets/images/ui/nav_icon_back_black.png")}
            style={styles.backIcon}
            accessible={false}
          />
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
          <Text style={styles.dateText}>{date === isoDateToday() ? "今天" : formatIsoDateCN(date)}</Text>
          <View style={styles.dateCaret} />
        </Pressable>
      </View>

      {/* Keeps the note field above the software keyboard on iOS and on Android (edge-to-edge). */}
      <KeyboardAvoidingView style={styles.keyboardArea} behavior="padding">
      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onSelect={setDate}
        onClose={() => setShowDatePicker(false)}
      />

      {/* Amount display */}
      <View style={[styles.amountContainer, g.amountContainer]}>
        <View style={styles.amountLine}>
          <Text style={[styles.amountText, g.amountText]}>¥{amountStr === "0" && !pendingOp ? "" : amountStr}</Text>
          <View style={[styles.cursor, g.cursor]} />
        </View>
        {pendingOp && pendingValue != null ? (
          <Text style={styles.pendingText}>
            ¥{centsToYuan(Math.round(pendingValue * 100))} {pendingOp} 当前输入
          </Text>
        ) : null}
      </View>
      <DashedDivider style={[styles.amountDivider, g.amountDivider]} dashWidth={7} gap={6.7} thickness={2 / 3} color="#E3E3E3" />

      {choicesError ? (
        <View style={styles.choicesError}>
          <Image source={require("../../assets/images/ui/icon_warning.png")} style={{ width: 28, height: 28 }} accessible={false} />
          <Text style={styles.choicesErrorTitle}>分类和账户没有载入</Text>
          <Text style={styles.choicesErrorBody}>现在无法保存这笔记录，请重新载入。</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadChoices()}
            style={({ pressed }) => [styles.choicesRetry, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.choicesRetryText}>重新载入</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Category grid */}
      <ScrollView
        style={styles.categoryScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.categoryGrid, { width: categoryGridWidth }]}>
          {categoryRows.map((row, rowIdx) => {
            const selIdx = row.findIndex((c) => c.id === expandedCategoryId);
            const showZone = selIdx !== -1;
            return (
              <View key={rowIdx}>
                <View style={styles.catRow}>
                  {row.map((cat) =>
                    cat.manage ? (
                      <Pressable
                        key="__manage"
                        style={[styles.categoryItem, g.categoryItem, { width: categoryItemWidth }]}
                        onPress={() =>
                          router.push({ pathname: "/categories", params: { type } })
                        }
                        accessibilityRole="button"
                        accessibilityLabel="管理分类"
                      >
                        <View style={[styles.categoryIcon, g.categoryIcon, styles.manageIcon]}>
                          <Image
                            source={require("../../assets/images/ui/icon_setting.png")}
                            style={[styles.manageArt, g.manageArt]}
                            accessible={false}
                          />
                        </View>
                        <Text style={[styles.categoryName, g.categoryName]}>管理分类</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        key={cat.id}
                        style={[styles.categoryItem, g.categoryItem, { width: categoryItemWidth }]}
                        onPress={() => {
                          const category = categories.find((item) => item.id === cat.id);
                          if (category) onSelectCategory(category);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${cat.name}${catsWithSubs.has(cat.id) ? '，有子分类' : ''}`}
                        accessibilityState={{ selected: selectedCategoryId === cat.id }}
                      >
                        <View
                          style={[
                            styles.categoryIcon,
                            g.categoryIcon,
                            selectedCategoryId && selectedCategoryId !== cat.id && styles.categoryDimmed,
                          ]}
                        >
                          <CategoryIcon
                            id={cat.iconId ?? undefined}
                            name={cat.name}
                            size={g.art}
                          />
                          {selectedCategoryId === cat.id ? (
                            <View pointerEvents="none" style={[styles.categoryRing, g.categoryRing]} />
                          ) : null}
                          {catsWithSubs.has(cat.id) && (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`展开${cat.name}子分类`}
                              accessibilityHint="在当前分类行下方显示可选的子分类"
                              accessibilityState={{ expanded: expandedCategoryId === cat.id }}
                              hitSlop={10}
                              onPress={(event) => {
                                event.stopPropagation();
                                const category = categories.find((item) => item.id === cat.id);
                                if (!category) return;
                                void onSelectCategory(category);
                                setExpandedCategoryId((current) =>
                                  current === cat.id ? null : cat.id,
                                );
                              }}
                              style={styles.catBadge}
                            >
                              <Image
                                source={require('../../assets/images/ui/icon_three_dot.png')}
                                resizeMode="contain"
                                style={styles.catBadgeImage}
                                accessible={false}
                              />
                            </Pressable>
                          )}
                        </View>
                        <Text style={[styles.categoryName, g.categoryName]}>{cat.name}</Text>
                      </Pressable>
                    ),
                  )}
                </View>

                {/* Inline subcategory zone — expands under the selected category */}
                {showZone && (
                  <View style={[styles.subZone, g.subZone]}>
                    <Image
                      source={require("../../assets/images/ui/icon_tally_arrow.png")}
                      accessible={false}
                      style={[
                        styles.subZoneCaret,
                        g.subZoneCaret,
                        { left: 16 + selIdx * categoryItemWidth + categoryItemWidth / 2 - g.caretHalf },
                      ]}
                    />
                    <View style={styles.subGrid}>
                      {subcategories.map((s) => {
                        const active = selectedSubId === s.id;
                        return (
                          <Pressable
                            key={s.id}
                            style={[styles.subItem, g.subItem, { width: categoryItemWidth }]}
                            onPress={() => setSelectedSubId(active ? null : s.id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                          >
                            <View style={[styles.subItemIcon, g.subItemIcon]}>
                              <CategoryIcon
                                id={s.icon ?? undefined}
                                name={s.name}
                                size={g.subArt}
                              />
                              {active ? <View pointerEvents="none" style={[styles.subItemRing, g.subItemRing]} /> : null}
                            </View>
                            <Text
                              style={[
                                styles.subItemName,
                                g.subItemName,
                                active && styles.subItemNameSelected,
                              ]}
                            >
                              {s.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                      {subcategories.length === 0 ? (
                        // Original: a category without subcategories shows only the add entry.
                        <Pressable
                          style={[styles.subItem, g.subItem, { width: categoryItemWidth }]}
                          onPress={onAddSubcategory}
                          accessibilityRole="button"
                          accessibilityLabel={`给${selectedCategory?.name ?? row[selIdx]?.name ?? ''}添加子类`}
                        >
                          <Image
                            source={require("../../assets/images/ui/icon_add_custom.png")}
                            style={[styles.subItemIcon, g.subItemIcon]}
                            accessible={false}
                          />
                          <Text style={[styles.subItemName, g.subItemName]}>添加子类</Text>
                        </Pressable>
                      ) : null}
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
            {selectedAccount ? (
              <AccountIcon type={selectedAccount.type} size={24} />
            ) : (
              <Image source={require("../../assets/images/ui/icon_edit_black.png")} style={styles.barIcon} accessible={false} />
            )}
            <Text
              style={[styles.accountName, !selectedAccount && styles.barPlaceholder]}
              numberOfLines={1}
            >
              {selectedAccount ? selectedAccount.name : "选择账户"}
            </Text>
            <RichChevron tone="muted" />
          </Pressable>
          <View style={styles.barDivider} />

          <View style={styles.noteInput}>
            <Image source={require("../../assets/images/ui/icon_describe.png")} style={styles.noteIcon} accessible={false} />
            <TextInput
              ref={noteInputRef}
              style={styles.noteTextInput}
              value={note}
              onChangeText={(v) => setNote(v.slice(0, 100))}
              onFocus={() => setNoteFocused(true)}
              onBlur={() => setNoteFocused(false)}
              placeholder="添加备注"
              placeholderTextColor="#B8B8B8"
              maxLength={100}
              returnKeyType="done"
              blurOnSubmit
            />
          </View>
        </View>

        <Modal
          visible={showAccountPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAccountPicker(false)}
        >
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
                    <View style={styles.accountSheetIcon}>
                      <AccountIcon type={acc.type} size={22} />
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
              keyHeight={56}
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

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardArea: { flex: 1 },
  // Header geometry measured from the original at 3x: back art at 20pt, 54×24.7 type pills
  // from 57.7pt with a 16.6pt gap, date pill 24.3pt from the right edge.
  header: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 24.3,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 37.7,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  choicesError: {
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: "#F5F7F5",
  },
  choicesErrorTitle: { fontSize: 14, fontWeight: "600", color: TEXT_PRIMARY },
  choicesErrorBody: { fontSize: 12, color: TEXT_SECONDARY },
  choicesRetry: {
    marginTop: 6,
    minHeight: 40,
    paddingHorizontal: 22,
    justifyContent: "center",
    backgroundColor: "#111111",
  },
  choicesRetryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  typeToggle: {
    flexDirection: "row",
    gap: 16.6,
  },
  typeButton: {
    width: 54,
    height: 24.7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12.35,
    borderWidth: 2 / 3,
    borderColor: "#F6F7F8",
  },
  typeButtonActive: {
    backgroundColor: "#F6F7F8",
  },
  typeText: {
    fontSize: 13,
    color: "#AAAAAA",
  },
  typeTextActive: {
    color: "#000000",
  },
  dateButton: {
    marginLeft: "auto",
    height: 24.7,
    flexDirection: "row",
    alignItems: "center",
    gap: 8.3,
    paddingLeft: 8.4,
    paddingRight: 7.4,
    borderRadius: 12.35,
    backgroundColor: "#F6F7F8",
  },
  dateText: {
    fontSize: 13,
    color: "#000000",
  },
  // Amount: RichRounded 35 with digits 49.8pt below the header centre; a 40pt cursor 7pt after
  // the digits; then the original's 7pt/6.7pt #E3E3E3 dashes and the grid 21.6pt below them.
  amountContainer: {
    paddingHorizontal: 24,
    paddingTop: 14.8,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  amountDivider: {
    marginHorizontal: 20,
    marginBottom: 14.25,
  },
  amountText: {
    fontFamily: RICH_NUMERAL_FONT,
    fontSize: 35,
    color: TEXT_PRIMARY,
  },
  pendingText: {
    marginTop: 3,
    fontSize: 10.5,
    color: TEXT_SECONDARY,
    fontVariant: ['tabular-nums'],
  },
  cursor: {
    width: 1,
    height: 40,
    marginLeft: 7,
    backgroundColor: TEXT_PRIMARY,
  },
  categoryScroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  categoryGrid: {
    alignSelf: "center",
    paddingHorizontal: 14.25,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  catRow: {
    flexDirection: "row",
  },
  categoryItem: {
    alignItems: "center",
    paddingVertical: 7.35,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  backIcon: { width: 16, height: 16 },
  dateCaret: {
    width: 0,
    height: 0,
    borderLeftWidth: 4.5,
    borderRightWidth: 4.5,
    borderTopWidth: 5.7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: TEXT_PRIMARY,
  },
  amountLine: { flexDirection: "row", alignItems: "center" },
  // Drawn above the original artwork, whose opaque circle covered a plain border.
  // Original selection: a 1.7pt black ring inside the 48pt disc; the disc stays #F7F7F7.
  categoryRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1.7,
    borderColor: "#000000",
  },
  subItemRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1.7,
    borderColor: "#000000",
  },
  barIcon: { width: 30, height: 30 },
  noteIcon: { width: 24, height: 24 }, // icon_describe: the original 18pt note glyph
  barPlaceholder: { color: "#B8B8B8" },
  categoryIconSelected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  manageIcon: {
    backgroundColor: PRIMARY_GREEN,
  },
  // icon_setting is a 30pt gear drawn in ink; the tile shows it white at 1.5x on the mint disc.
  manageArt: { width: 45, height: 45, tintColor: "#FFFFFF" },
  catBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#D5D5D5",
    alignItems: "center",
    justifyContent: "center",
  },
  catBadgeImage: { width: 15, height: 15, tintColor: "#FFFFFF" },
  // The original draws every other category's art at half opacity once one is selected
  // (black strokes read #7F7F7F, the #F7F7F7 disc #FBFBFB); labels stay black.
  categoryDimmed: { opacity: 0.5 },
  categoryName: {
    fontSize: 11.5,
    lineHeight: 18.7,
    color: TEXT_PRIMARY,
    textAlign: "center",
  },
  categoryNameSelected: {
    color: "#181A19",
    fontWeight: "600",
  },
  bottomSection: {
    backgroundColor: KEYPAD_BACKGROUND,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    paddingHorizontal: 16,
    backgroundColor: KEYPAD_BACKGROUND,
  },
  accountSelector: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 14,
  },
  // The original divider: a 36pt light line, centred on the bar.
  barDivider: { width: StyleSheet.hairlineWidth * 2, height: 36, backgroundColor: "#D9D9D9" },
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
    flex: 1,
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  noteInput: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    gap: 10,
  },
  noteTextInput: {
    flex: 1,
    fontSize: 15,
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
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  subZoneCaret: {
    position: "absolute",
    top: -4.5,
    width: 9,
    height: 4.5,
  },
  subGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  subItem: {
    alignItems: "center",
    paddingVertical: 6,
  },
  subItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 3,
  },
  subItemName: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    textAlign: "center",
  },
  subItemNameSelected: {
    color: "#181A19",
    fontWeight: "600",
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

/**
 * The composer's width-scaled sizes. Base values are the 393pt measurements; the tray band
 * (74.6pt) and its spacing were measured on the 402pt capture and converted to that base.
 */
function composerGrid(k: number) {
  const z = (value: number) => Math.round(value * k * 100) / 100;
  return {
    art: z(48),
    subArt: z(40),
    caretHalf: z(4.5),
    amountContainer: { paddingTop: z(15.55), paddingBottom: z(12) },
    amountText: { fontSize: z(35), lineHeight: z(52) },
    cursor: { height: z(40), marginLeft: z(7) },
    amountDivider: { marginBottom: z(12.85) },
    categoryItem: { paddingVertical: z(7.35) },
    categoryIcon: { width: z(48), height: z(48), borderRadius: z(24), marginBottom: z(5) },
    categoryRing: { borderRadius: z(24) },
    manageArt: { width: z(45), height: z(45) },
    categoryName: { fontSize: z(11.5), lineHeight: z(18.7) },
    subZone: { paddingTop: z(2.6), paddingBottom: z(4.5), marginTop: z(-2.6), marginBottom: z(2.6) },
    subZoneCaret: { top: z(-4.5), width: z(9), height: z(4.5) },
    subItem: { paddingTop: z(6), paddingBottom: z(6) },
    subItemIcon: { width: z(40), height: z(40), borderRadius: z(20), marginBottom: z(1.2) },
    subItemRing: { borderRadius: z(20) },
    subItemName: { fontSize: z(12), lineHeight: z(14.3) },
  };
}
