import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  StatusBar,
  TextInput,
  View,
  Text,
  ScrollView,
} from "react-native";

import {
  BORDER_COLOR,
  CARD_BACKGROUND,
  CONTROL_PRESSED_BACKGROUND,
  KEYPAD_BACKGROUND,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/constants/Colors";
import { RICH_NUMERAL_FONT, RICH_RADIUS, RICH_SIZE, RICH_SPACING, RICH_TYPE, composerHeaderTuck } from "@/constants/Design";
import { DatePickerModal } from "@/components/DatePickerModal";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountIcon, DashedDivider, MoneyNumpad } from "@/components/rich";
import { getDb } from "@/src/db/db";
import { listAccounts } from "@/src/db/repo/accounts";
import { createTransfer, getTransfer, updateTransfer } from "@/src/db/repo/transactions";
import type { Account } from "@/src/domain/types";
import { formatIsoDateCN, isoDateToday } from "@/src/utils/date";
import { centsToCurrencyString, centsToYuan } from "@/src/utils/money";

/** The note written when the person leaves 添加备注 empty. */
function autoMemo(fromName: string | null, toName: string | null) {
  return `转账 ${fromName} → ${toName}`;
}

/** New transfer, or `?groupId=` to edit both sides of an existing one. */
export default function TransferScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
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
      const list = await listAccounts(db);
      setAccounts(list);
      if (!groupId) return;
      const transfer = await getTransfer(db, groupId);
      if (!transfer) {
        Alert.alert("找不到这笔转账", "它可能已经被删除。");
        router.back();
        return;
      }
      const name = (id: string) => list.find((a) => a.id === id)?.name ?? null;
      const cents = transfer.amountCents;
      setAmountStr(cents % 100 === 0 ? String(cents / 100) : centsToCurrencyString(cents));
      setFromId(transfer.fromAccountId);
      setToId(transfer.toAccountId);
      setDate(transfer.date);
      // An automatic note is rebuilt from the accounts, so it stays right if they change.
      const generated = autoMemo(name(transfer.fromAccountId), name(transfer.toAccountId));
      setNote(transfer.note && transfer.note !== generated ? transfer.note : "");
    })();
  }, [groupId, router]);

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
      const memo = note.trim() ? note.trim().slice(0, 100) : autoMemo(fromName, toName);
      // Both sides commit together (one SQLite transaction) and share a transfer group, so an
      // interrupted transfer never leaves one account wrong and edits/deletes move both sides.
      const input = { fromAccountId: fromId, toAccountId: toId, amountCents: cents, date, note: memo };
      if (groupId) await updateTransfer(db, groupId, input);
      else await createTransfer(db, input);
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
    const name = nameOf(id);
    const chosen = accounts.find((a) => a.id === id) ?? null;
    return (
      <View style={styles.selectorGroup}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}，当前${name ?? '未选择'}`}
          accessibilityState={{ expanded: picking === which }}
          style={({ pressed }) => [styles.sel, pressed && styles.controlPressed]}
          onPress={() => setPicking(picking === which ? null : which)}
        >
          {chosen ? (
            <View style={styles.selIconChosen}>
              <AccountIcon type={chosen.type} size={20} />
            </View>
          ) : (
            <View style={styles.selIcon} />
          )}
          <Text numberOfLines={1} style={styles.selLabel}>
            {name ?? label}
          </Text>
          <View style={[styles.caret, picking === which && styles.caretUp]} />
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
                <AccountIcon type={a.type} size={20} />
                <Text numberOfLines={1} style={styles.optionText}>{a.name}</Text>
                {a.id === id ? (
                  <Image
                    source={require("../../assets/images/ui/btn_select.png")}
                    style={styles.optionCheck}
                    accessible={false}
                  />
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

      {/* Header: like the add screen, the original sits this row 8.3pt below the safe area. */}
      <View style={[styles.header, { marginTop: -composerHeaderTuck(insets.top) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="返回"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Image
            source={require("../../assets/images/ui/nav_icon_back_black.png")}
            style={styles.backIcon}
            accessible={false}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`选择转账日期，当前${dateLabel}`}
          style={({ pressed }) => [styles.dateButton, pressed && styles.controlPressed]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text numberOfLines={1} style={styles.dateText}>{dateLabel}</Text>
          <View style={styles.caret} />
        </Pressable>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onSelect={setDate}
        onClose={() => setShowDatePicker(false)}
      />

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior="padding"
      >
        <View style={styles.amountBox}>
          <View style={styles.amountLine}>
          <Text
            accessibilityLabel={`转账金额 ${amountStr} 元`}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            numberOfLines={1}
            style={styles.amount}
          >
            ¥{amountStr === "0" && !pendingOp ? "" : amountStr}
          </Text>
          <View style={styles.cursor} />
          </View>
          {pendingOp && pendingValue != null ? (
            <Text style={styles.pendingText}>
              ¥{centsToYuan(Math.round(pendingValue * 100))} {pendingOp} 当前输入
            </Text>
          ) : null}
        </View>
        <DashedDivider style={styles.amountDivider} dashWidth={7} gap={6.7} thickness={2 / 3} color="#E3E3E3" />

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
            <Image
              source={require("../../assets/images/ui/icon_doule_arrow_bottom.png")}
              style={styles.arrowIcon}
              accessible={false}
            />
          </View>
          <Selector which="to" />
        </ScrollView>

        <View style={styles.pad}>
          <View style={styles.noteRow}>
            <Image
              source={require("../../assets/images/ui/icon_describe.png")}
              style={styles.noteIcon}
              accessible={false}
            />
            <TextInput
              accessibilityLabel="转账备注"
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              onFocus={() => setNoteFocused(true)}
              onBlur={() => setNoteFocused(false)}
              onSubmitEditing={() => setNoteFocused(false)}
              placeholder="添加备注"
              placeholderTextColor="#B8B8B8"
              maxLength={100}
              returnKeyType="done"
            />
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
                keyHeight={56}
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
  // Geometry measured from the original at 3x; the amount block matches the add screen.
  dateButton: {
    height: 24.7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7.4,
    paddingLeft: 8.6,
    paddingRight: 8,
    borderRadius: 12.35,
    backgroundColor: "#F6F7F8",
  },
  dateText: { fontSize: 13, color: "#000000" },
  amountBox: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 14.8,
    paddingBottom: 12,
  },
  amountLabel: { ...RICH_TYPE.label, fontWeight: "600", color: TEXT_SECONDARY },
  amount: {
    fontFamily: RICH_NUMERAL_FONT,
    fontSize: 35,
    color: TEXT_PRIMARY,
  },
  cursor: { width: 1, height: 40, marginLeft: 7, backgroundColor: TEXT_PRIMARY },
  header: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 20.3,
    paddingRight: 24.3,
  },
  backButton: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  backIcon: { width: 16, height: 16 },
  amountLine: { flexDirection: "row", alignItems: "center" },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: TEXT_PRIMARY,
  },
  caretUp: { transform: [{ rotate: "180deg" }] },
  selIconChosen: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  arrowIcon: { width: 11, height: 12.7 },
  noteIcon: { width: 24, height: 24 }, // icon_describe: the original 18pt note glyph
  pendingText: {
    ...RICH_TYPE.caption,
    marginTop: RICH_SPACING.xxs,
    color: TEXT_SECONDARY,
    fontVariant: ["tabular-nums"],
  },
  amountDivider: {
    marginHorizontal: 20,
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
    alignSelf: "center",
    width: 272.4,
    maxWidth: "100%",
    minHeight: 44.3,
    flexDirection: "row",
    alignItems: "center",
    gap: 8.6,
    backgroundColor: "#F6F7F8",
    borderRadius: 22.15,
    paddingLeft: 12.4,
    paddingRight: 18,
  },
  selIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E6E6E6",
  },
  selLabel: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: "500", color: "#000000" },
  selLabelActive: { color: TEXT_PRIMARY, fontWeight: "600" },
  arrow: { alignItems: "center", paddingVertical: 15.15 },
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
  optionCheck: { width: 24, height: 24 },
  optionText: {
    ...RICH_TYPE.body,
    flex: 1,
    minWidth: 0,
    color: TEXT_PRIMARY,
  },
  pad: {
    backgroundColor: KEYPAD_BACKGROUND,
  },
  noteRow: {
    width: "100%",
    maxWidth: 430,
    minHeight: 54,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: RICH_SPACING.md,
  },
  noteInput: {
    minWidth: 76,
    maxWidth: "75%",
    fontSize: 15,
    color: TEXT_PRIMARY,
    paddingVertical: 0,
  },
  noteCount: { ...RICH_TYPE.caption, color: TEXT_SECONDARY, fontVariant: ["tabular-nums"] },
  numpadWrap: { width: "100%", maxWidth: 430, alignSelf: "center" },
});
