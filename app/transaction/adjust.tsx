import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { MoneyNumpad, ScreenHeader } from "@/components/rich";
import { Text, View } from "@/components/Themed";
import {
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/constants/Colors";
import { getDb } from "@/src/db/db";
import { getAccountBalance } from "@/src/db/repo/accounts";
import { createTransaction } from "@/src/db/repo/transactions";
import { isoDateToday } from "@/src/utils/date";
import { newId } from "@/src/utils/id";
import { centsToYuan, parseCurrencyToCents } from "@/src/utils/money";

export default function AdjustBalanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId: string; accountName?: string }>();
  const accountId = params.accountId;
  const accountName = params.accountName ?? "";

  const [currentCents, setCurrentCents] = useState<number | null>(null);
  const [targetStr, setTargetStr] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!accountId) return;
      const db = await getDb();
      const bal = await getAccountBalance(db, accountId);
      setCurrentCents(bal);
      setTargetStr(centsToYuan(bal));
    })();
  }, [accountId]);

  const handleNumPress = (num: string) => {
    if (targetStr === "0" && num !== ".") {
      setTargetStr(num);
    } else if (num === "." && targetStr.includes(".")) {
      return;
    } else if (targetStr.includes(".") && targetStr.split(".")[1]?.length >= 2) {
      return;
    } else {
      setTargetStr(targetStr + num);
    }
  };

  const handleBackspace = () => {
    if (targetStr.length <= 1) {
      setTargetStr("0");
    } else {
      setTargetStr(targetStr.slice(0, -1));
    }
  };

  const handleToggleSign = () => {
    if (targetStr === "0") return;
    setTargetStr(targetStr.startsWith("-") ? targetStr.slice(1) : `-${targetStr}`);
  };

  const targetCents = parseCurrencyToCents(targetStr);
  const deltaCents = targetCents != null && currentCents != null ? targetCents - currentCents : null;
  const canSave =
    !!accountId &&
    targetCents != null &&
    currentCents != null &&
    deltaCents !== 0 &&
    !saving;

  async function onSave() {
    if (!canSave || deltaCents == null) return;
    setSaving(true);
    try {
      const db = await getDb();
      await createTransaction(db, {
        id: newId("txn"),
        type: "balance_adjustment",
        amountCents: deltaCents,
        date: isoDateToday(),
        accountId,
        categoryId: null,
        subcategoryId: null,
        note: null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="调整余额" onBack={() => router.back()} borderBottom />

      <View style={styles.body}>
        <Text style={styles.accountLabel}>{accountName || "账户"}</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>当前余额</Text>
          <Text style={styles.rowValue}>
            ¥{currentCents == null ? "..." : centsToYuan(currentCents)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>调整后余额</Text>
          <Text style={[styles.rowValue, styles.targetValue]}>
            ¥{targetStr}
            <Text style={styles.cursor}>|</Text>
          </Text>
        </View>

        {deltaCents != null && deltaCents !== 0 && (
          <Text style={styles.delta}>
            {deltaCents > 0 ? "+" : ""}
            {centsToYuan(deltaCents)} 调整
          </Text>
        )}
      </View>

      <View style={styles.numpad}>
        <MoneyNumpad
          onDigit={handleNumPress}
          onBackspace={handleBackspace}
          operators={[{ label: "±", accessibilityLabel: "切换正负", onPress: handleToggleSign }]}
          onConfirm={onSave}
          confirmDisabled={!canSave}
          confirmLabel={saving ? "..." : "确定"}
          keyHeight={56}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  accountLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  rowLabel: {
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  rowValue: {
    fontSize: 18,
    fontWeight: "500",
    color: TEXT_PRIMARY,
  },
  targetValue: {
    color: PRIMARY_GREEN,
    fontWeight: "600",
  },
  cursor: {
    color: PRIMARY_GREEN,
    fontWeight: "300",
  },
  delta: {
    marginTop: 16,
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: "right",
  },
  numpad: {
    backgroundColor: "#F8F8F8",
  },
});
