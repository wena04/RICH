import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  View,
  Text,
  ScrollView,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import {
  BORDER_COLOR,
  CARD_BACKGROUND,
  CONTROL_BACKGROUND,
  CONTROL_PRESSED_BACKGROUND,
  DASHED_RULE_COLOR,
  KEYPAD_BACKGROUND,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/constants/Colors";
import { RICH_RADIUS, RICH_SIZE, RICH_SPACING, RICH_TYPE } from "@/constants/Design";
import { DatePickerModal } from "@/components/DatePickerModal";
import { DashedDivider, MoneyNumpad, ScreenHeader } from "@/components/rich";
import { getDb } from "@/src/db/db";
import { listAccounts } from "@/src/db/repo/accounts";
import { createTransaction } from "@/src/db/repo/transactions";
import type { Account } from "@/src/domain/types";
import { formatIsoDateCN, isoDateToday } from "@/src/utils/date";
import { newId } from "@/src/utils/id";
import { centsToYuan } from "@/src/utils/money";

export default function TransferScreen() {
  const router = useRouter();
  const [amountStr, setAmountStr] = useState("0");
  const [date, setDate] = useState(isoDateToday());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [picking, setPicking] = useState<null | "from" | "to">(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingValue, setPendingValue] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<"+" | "-" | null>(null);
  const [noteFocused, setNoteFocused] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      setAccounts(await listAccounts(db));
    })();
  }, []);

  const nameOf = (id: string | null) =>
    accounts.find((a) => a.id === id)?.name ?? null;

  const press = (n: string) => {
    if (n !== "." && amountStr.replace(".", "").length >= 9) return;
    if (amountStr === "0" && n !== ".") setAmountStr(n);
    else if (n === "." && amountStr.includes(".")) return;
    else if (amountStr.includes(".") && amountStr.split(".")[1]?.length >= 2)
      return;
    else setAmountStr(amountStr + n);
  };
  const backspace = () =>
    setAmountStr(amountStr.length <= 1 ? "0" : amountStr.slice(0, -1));

  function evaluate(current: number): number {
    if (pendingValue == null || !pendingOp) return current;
    return pendingOp === "+" ? pendingValue + current : pendingValue - current;
  }

  function handleOperator(operator: "+" | "-") {
    setPendingValue(evaluate(parseFloat(amountStr) || 0));
    setPendingOp(operator);
    setAmountStr("0");
  }

  async function onConfirm() {
    if (saving) return;
    const total = evaluate(parseFloat(amountStr) || 0);
    const cents = Math.round(total * 100);
    if (!Number.isFinite(cents) || !Number.isSafeInteger(cents)) {
      Alert.alert('检查金额', '转账金额过大，请输入较小的数值。');
      return;
    }
    if (cents <= 0 || !fromId || !toId || fromId === toId) return;
    setSaving(true);
    try {
      const db = await getDb();
      const fromName = nameOf(fromId);
      const toName = nameOf(toId);
      const memo = note.trim()
        ? note.trim().slice(0, 100)
        : `转账 ${fromName} → ${toName}`;
      // Both sides commit together, so an interrupted transfer can never leave one account wrong.
      await db.withTransactionAsync(async () => {
        await createTransaction(db, {
          id: newId("txn"),
          type: "balance_adjustment",
          amountCents: -cents,
          date,
          accountId: fromId,
          categoryId: null,
          subcategoryId: null,
          note: memo,
        });
        await createTransaction(db, {
          id: newId("txn"),
          type: "balance_adjustment",
          amountCents: cents,
          date,
          accountId: toId,
          categoryId: null,
          subcategoryId: null,
          note: memo,
        });
      });
      router.back();
    } catch (e) {
      console.error("Transfer failed:", e);
      Alert.alert('转账没有保存', e instanceof Error ? e.message : '请稍后再试。');
    } finally {
      setSaving(false);
    }
  }

  const evaluatedAmount = evaluate(parseFloat(amountStr) || 0);
  const canConfirm = Boolean(
    Number.isFinite(evaluatedAmount) &&
    Number.isSafeInteger(Math.round(evaluatedAmount * 100)) &&
    evaluatedAmount > 0 &&
    fromId &&
    toId &&
    fromId !== toId,
  );

  function Selector({ which }: { which: "from" | "to" }) {
    const id = which === "from" ? fromId : toId;
    const label = which === "from" ? "选择转出账户" : "选择转入账户";
    const eyebrow = which === "from" ? "转出账户" : "转入账户";
    const name = nameOf(id);
    return (
      <View style={styles.selectorGroup}>
        <Text style={styles.selectorEyebrow}>{eyebrow}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}，当前${name ?? '未选择'}`}
          accessibilityState={{ expanded: picking === which }}
          style={({ pressed }) => [styles.sel, pressed && styles.controlPressed]}
          onPress={() => setPicking(picking === which ? null : which)}
        >
          <View style={styles.selIcon}>
            <FontAwesome name="bank" size={13} color={TEXT_SECONDARY} />
          </View>
          <Text numberOfLines={1} style={[styles.selLabel, name && styles.selLabelActive]}>
            {name ?? label}
          </Text>
          <FontAwesome
            name={picking === which ? "caret-up" : "caret-down"}
            size={14}
            color={TEXT_SECONDARY}
          />
        </Pressable>
        {picking === which && (
          <View style={styles.dropdown}>
            {accounts.map((a) => (
              <Pressable
                key={a.id}
                accessibilityRole="button"
                accessibilityLabel={`${which === 'from' ? '选择转出账户' : '选择转入账户'}${a.name}`}
                accessibilityState={{ selected: a.id === id }}
                style={({ pressed }) => [
                  styles.option,
                  a.id === id && styles.optionSelected,
                  pressed && styles.controlPressed,
                ]}
                onPress={() => {
                  if (which === "from") setFromId(a.id);
                  else setToId(a.id);
                  setPicking(null);
                }}
              >
                <FontAwesome
                  name={a.type === "cash" ? "money" : "bank"}
                  size={13}
                  color={TEXT_SECONDARY}
                />
                <Text numberOfLines={1} style={styles.optionText}>{a.name}</Text>
                {a.id === id ? (
                  <FontAwesome name="check" size={12} color={PRIMARY_GREEN} />
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  const dateLabel =
    date === isoDateToday()
      ? "今天"
      : formatIsoDateCN(date);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />

      <ScreenHeader
        title="账户转账"
        onBack={() => router.back()}
        backgroundColor={PRIMARY_GREEN}
        actionWidth={96}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`选择转账日期，当前${dateLabel}`}
            style={({ pressed }) => [styles.dateButton, pressed && styles.controlPressed]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text numberOfLines={1} style={styles.dateText}>{dateLabel}</Text>
            <FontAwesome name="chevron-down" size={9} color={TEXT_SECONDARY} />
          </Pressable>
        }
      />

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onSelect={setDate}
        onClose={() => setShowDatePicker(false)}
      />

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>转账金额</Text>
          <Text
            accessibilityLabel={`转账金额 ${amountStr} 元`}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            numberOfLines={1}
            style={styles.amount}
          >
            ¥{amountStr}
            <Text style={styles.cursor}>|</Text>
          </Text>
          {pendingOp && pendingValue != null ? (
            <Text style={styles.pendingText}>
              ¥{centsToYuan(Math.round(pendingValue * 100))} {pendingOp} 当前输入
            </Text>
          ) : null}
        </View>
        <DashedDivider color={DASHED_RULE_COLOR} style={styles.amountDivider} />

        <ScrollView
          style={styles.midScroll}
          contentContainerStyle={styles.mid}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <Selector which="from" />
          <View style={styles.arrow}>
            <FontAwesome name="angle-double-down" size={18} color={TEXT_SECONDARY} />
          </View>
          <Selector which="to" />
        </ScrollView>

        <View style={styles.pad}>
          <View style={styles.noteRow}>
            <FontAwesome name="pencil" size={14} color={TEXT_SECONDARY} />
            <TextInput
              accessibilityLabel="转账备注"
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              onFocus={() => setNoteFocused(true)}
              onBlur={() => setNoteFocused(false)}
              onSubmitEditing={() => setNoteFocused(false)}
              placeholder="添加备注（可选）"
              placeholderTextColor={TEXT_SECONDARY}
              maxLength={100}
              returnKeyType="done"
            />
            <Text style={styles.noteCount}>{note.length}/100</Text>
          </View>
          {!noteFocused ? (
            <View style={styles.numpadWrap}>
              <MoneyNumpad
                onDigit={press}
                onBackspace={backspace}
                operators={[
                  { label: "+", accessibilityLabel: "加", onPress: () => handleOperator("+") },
                  { label: "−", accessibilityLabel: "减", onPress: () => handleOperator("-") },
                ]}
                onConfirm={onConfirm}
                confirmDisabled={!canConfirm || saving}
                confirmLabel={saving ? "保存中" : "确定"}
                keyHeight={52}
              />
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CARD_BACKGROUND },
  keyboardArea: { flex: 1, backgroundColor: CARD_BACKGROUND },
  controlPressed: { opacity: 0.76 },
  dateButton: {
    maxWidth: 96,
    minHeight: RICH_SIZE.minimumTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RICH_SPACING.xxs,
    paddingHorizontal: RICH_SPACING.xs,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: RICH_RADIUS.pill,
  },
  dateText: { ...RICH_TYPE.label, flexShrink: 1, fontWeight: "600", color: TEXT_PRIMARY },
  amountBox: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: RICH_SPACING.xl,
    paddingTop: RICH_SPACING.md,
    paddingBottom: RICH_SPACING.xs,
  },
  amountLabel: { ...RICH_TYPE.label, fontWeight: "600", color: TEXT_SECONDARY },
  amount: {
    ...RICH_TYPE.amount,
    marginTop: RICH_SPACING.xxs,
    fontSize: 42,
    fontWeight: "300",
    color: TEXT_PRIMARY,
    letterSpacing: -1,
  },
  cursor: { color: PRIMARY_GREEN },
  pendingText: {
    ...RICH_TYPE.caption,
    marginTop: RICH_SPACING.xxs,
    color: TEXT_SECONDARY,
    fontVariant: ["tabular-nums"],
  },
  amountDivider: {
    marginHorizontal: 18,
    marginBottom: RICH_SPACING.xxs,
  },
  midScroll: { flex: 1 },
  mid: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: RICH_SPACING.md,
    paddingVertical: RICH_SPACING.sm,
  },
  selectorGroup: { gap: RICH_SPACING.xxs },
  selectorEyebrow: {
    ...RICH_TYPE.caption,
    marginLeft: RICH_SPACING.sm,
    color: TEXT_SECONDARY,
  },
  sel: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CONTROL_BACKGROUND,
    borderRadius: RICH_RADIUS.pill,
    paddingHorizontal: RICH_SPACING.md,
  },
  selIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CARD_BACKGROUND,
    marginRight: RICH_SPACING.sm,
  },
  selLabel: { flex: 1, minWidth: 0, fontSize: 15, color: TEXT_SECONDARY },
  selLabelActive: { color: TEXT_PRIMARY, fontWeight: "600" },
  arrow: { alignItems: "center", paddingVertical: RICH_SPACING.xs },
  dropdown: {
    marginTop: RICH_SPACING.xxs,
    marginHorizontal: RICH_SPACING.xs,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: RICH_RADIUS.control,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: "hidden",
  },
  option: {
    minHeight: RICH_SIZE.minimumTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: RICH_SPACING.sm,
    paddingHorizontal: RICH_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER_COLOR,
  },
  optionSelected: {
    backgroundColor: CONTROL_PRESSED_BACKGROUND,
  },
  optionText: {
    ...RICH_TYPE.body,
    flex: 1,
    minWidth: 0,
    color: TEXT_PRIMARY,
  },
  pad: {
    backgroundColor: KEYPAD_BACKGROUND,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER_COLOR,
  },
  noteRow: {
    width: "100%",
    maxWidth: 430,
    minHeight: 52,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: RICH_SPACING.xs,
    paddingHorizontal: RICH_SPACING.md,
  },
  noteInput: {
    ...RICH_TYPE.body,
    flex: 1,
    minWidth: 0,
    color: TEXT_PRIMARY,
    paddingVertical: 0,
  },
  noteCount: { ...RICH_TYPE.caption, color: TEXT_SECONDARY, fontVariant: ["tabular-nums"] },
  numpadWrap: { width: "100%", maxWidth: 430, alignSelf: "center" },
});
