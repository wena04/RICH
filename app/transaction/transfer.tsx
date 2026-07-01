import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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

import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from "@/constants/Colors";
import { DatePickerModal } from "@/components/DatePickerModal";
import { getDb } from "@/src/db/db";
import { listAccounts } from "@/src/db/repo/accounts";
import { createTransaction } from "@/src/db/repo/transactions";
import type { Account } from "@/src/domain/types";
import { isoDateToday } from "@/src/utils/date";
import { newId } from "@/src/utils/id";

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

  useEffect(() => {
    (async () => {
      const db = await getDb();
      setAccounts(await listAccounts(db));
    })();
  }, []);

  const nameOf = (id: string | null) =>
    accounts.find((a) => a.id === id)?.name ?? null;

  const press = (n: string) => {
    if (amountStr === "0" && n !== ".") setAmountStr(n);
    else if (n === "." && amountStr.includes(".")) return;
    else if (amountStr.includes(".") && amountStr.split(".")[1]?.length >= 2)
      return;
    else setAmountStr(amountStr + n);
  };
  const backspace = () =>
    setAmountStr(amountStr.length <= 1 ? "0" : amountStr.slice(0, -1));

  async function onConfirm() {
    if (saving) return;
    const cents = Math.round((parseFloat(amountStr) || 0) * 100);
    if (cents <= 0 || !fromId || !toId || fromId === toId) return;
    setSaving(true);
    try {
      const db = await getDb();
      const fromName = nameOf(fromId);
      const toName = nameOf(toId);
      const memo = note.trim()
        ? note.trim().slice(0, 100)
        : `转账 ${fromName} → ${toName}`;
      // A transfer is two balance adjustments: -X on source, +X on destination.
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
      router.back();
    } catch (e) {
      console.error("Transfer failed:", e);
    } finally {
      setSaving(false);
    }
  }

  const canConfirm =
    (parseFloat(amountStr) || 0) > 0 && fromId && toId && fromId !== toId;

  function Selector({ which }: { which: "from" | "to" }) {
    const id = which === "from" ? fromId : toId;
    const label = which === "from" ? "选择转出账户" : "选择转入账户";
    const name = nameOf(id);
    return (
      <View>
        <Pressable
          style={styles.sel}
          onPress={() => setPicking(picking === which ? null : which)}
        >
          <View style={styles.selDot} />
          <Text style={[styles.selLabel, name && styles.selLabelActive]}>
            {name ?? label}
          </Text>
          <FontAwesome name="caret-down" size={14} color={TEXT_SECONDARY} />
        </Pressable>
        {picking === which && (
          <View style={styles.dropdown}>
            {accounts.map((a) => (
              <Pressable
                key={a.id}
                style={styles.option}
                onPress={() => {
                  if (which === "from") setFromId(a.id);
                  else setToId(a.id);
                  setPicking(null);
                }}
              >
                <Text style={styles.optionText}>{a.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const dateLabel =
    date === isoDateToday()
      ? "今天"
      : `${parseInt(date.split("-")[1])}月${parseInt(date.split("-")[2])}日`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <FontAwesome name="chevron-left" size={18} color={TEXT_PRIMARY} />
        </Pressable>
        <Pressable style={styles.datePill} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{dateLabel} ▼</Text>
        </Pressable>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onSelect={setDate}
        onClose={() => setShowDatePicker(false)}
      />

      <View style={styles.amountBox}>
        <Text style={styles.amount}>
          ¥{amountStr}
          <Text style={styles.cursor}>|</Text>
        </Text>
      </View>
      <View style={styles.dashRow}>
        {Array.from({ length: 60 }).map((_, i) => (
          <View key={i} style={styles.dash} />
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.mid}
        keyboardShouldPersistTaps="handled"
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
            style={styles.noteInput}
            value={note}
            onChangeText={(v) => setNote(v.slice(0, 100))}
            placeholder="添加备注"
            placeholderTextColor={TEXT_SECONDARY}
          />
        </View>
        <View style={styles.padGridWrap}>
          <View style={styles.padGrid}>
            {KEYS.map((k) => (
              <Pressable key={k} style={styles.key} onPress={() => press(k)}>
                <Text style={styles.keyText}>{k}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.key} onPress={backspace}>
              <FontAwesome name="long-arrow-left" size={20} color={TEXT_PRIMARY} />
            </Pressable>
            <Pressable style={styles.key} onPress={() => press("0")}>
              <Text style={styles.keyText}>0</Text>
            </Pressable>
            <Pressable style={styles.key} onPress={() => press(".")}>
              <Text style={styles.keyText}>.</Text>
            </Pressable>
          </View>
          <View style={styles.ops}>
            <View style={styles.opKey}>
              <Text style={styles.opText}>+</Text>
            </View>
            <View style={styles.opKey}>
              <Text style={styles.opText}>−</Text>
            </View>
            <Pressable
              style={[styles.confirm, !canConfirm && styles.confirmOff]}
              onPress={onConfirm}
              disabled={!canConfirm || saving}
            >
              <Text style={styles.confirmText}>{saving ? "..." : "确定"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { padding: 6 },
  datePill: {
    backgroundColor: "#F0F0F0",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dateText: { fontSize: 14, color: TEXT_PRIMARY },
  amountBox: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  amount: { fontSize: 42, fontWeight: "300", color: TEXT_PRIMARY, letterSpacing: -1 },
  cursor: { color: PRIMARY_GREEN },
  dashRow: { flexDirection: "row", overflow: "hidden", height: 1, marginHorizontal: 18, marginBottom: 6 },
  dash: { width: 5, height: 1, backgroundColor: "#D8D8D8", marginRight: 4 },
  mid: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 16, gap: 4 },
  sel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F4",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  selDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#D8D8D8",
    marginRight: 12,
  },
  selLabel: { flex: 1, fontSize: 15, color: TEXT_SECONDARY },
  selLabelActive: { color: TEXT_PRIMARY, fontWeight: "600" },
  arrow: { alignItems: "center", paddingVertical: 8 },
  dropdown: {
    marginTop: 4,
    marginHorizontal: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  option: { paddingVertical: 12, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  optionText: { fontSize: 14, color: TEXT_PRIMARY },
  pad: { backgroundColor: "#F8F8F8", paddingBottom: 20 },
  noteRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  noteInput: { minWidth: 120, fontSize: 13, color: TEXT_PRIMARY, padding: 0, textAlign: "center" },
  padGridWrap: { flexDirection: "row" },
  padGrid: { flex: 3, flexDirection: "row", flexWrap: "wrap" },
  key: {
    width: "33.333%",
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
  },
  keyText: { fontSize: 22, color: TEXT_PRIMARY },
  ops: { flex: 1 },
  opKey: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
  },
  opText: { fontSize: 24, color: TEXT_PRIMARY },
  confirm: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A1A1A" },
  confirmOff: { backgroundColor: "#999999" },
  confirmText: { fontSize: 18, color: "#FFFFFF", fontWeight: "600" },
});
