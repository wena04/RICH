import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { MoneyNumpad, ScreenHeader } from "@/components/rich";
import { Text, View } from "@/components/Themed";
import {
  ACCESSIBLE_GREEN,
  BORDER_COLOR,
  CARD_BACKGROUND,
  KEYPAD_BACKGROUND,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/constants/Colors";
import { RICH_SPACING, RICH_TYPE } from "@/constants/Design";
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
      try {
        const db = await getDb();
        const bal = await getAccountBalance(db, accountId);
        setCurrentCents(bal);
        setTargetStr(centsToYuan(bal));
      } catch (error) {
        Alert.alert("无法读取余额", error instanceof Error ? error.message : "请稍后重试。");
      }
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
    } catch (error) {
      Alert.alert("余额没有保存", error instanceof Error ? error.message : "请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader
        title="调整余额"
        subtitle="只修正账户余额，不计入收支"
        onBack={() => router.back()}
        backgroundColor={PRIMARY_GREEN}
      />

      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.accountLabel}>{accountName || "账户"}</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>当前余额</Text>
          <Text
            accessibilityLabel={`当前余额 ${currentCents == null ? "正在读取" : `${centsToYuan(currentCents)} 元`}`}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            numberOfLines={1}
            style={styles.rowValue}
          >
            ¥{currentCents == null ? "..." : centsToYuan(currentCents)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>调整后余额</Text>
          <Text
            accessibilityLabel={`调整后余额 ${targetStr} 元`}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            numberOfLines={1}
            style={[styles.rowValue, styles.targetValue]}
          >
            ¥{targetStr}
            <Text style={styles.cursor}>|</Text>
          </Text>
        </View>

        {deltaCents != null && deltaCents !== 0 && (
          <Text style={styles.delta}>
            {deltaCents > 0 ? "余额将增加" : "余额将减少"} ¥
            {centsToYuan(Math.abs(deltaCents))}
          </Text>
        )}
      </View>

      <View style={styles.numpad}>
        <View style={styles.numpadInner}>
          <MoneyNumpad
            onDigit={handleNumPress}
            onBackspace={handleBackspace}
            operators={[{ label: "±", accessibilityLabel: "切换正负", onPress: handleToggleSign }]}
            onConfirm={onSave}
            confirmDisabled={!canSave}
            confirmLabel={saving ? "保存中" : "确定"}
            keyHeight={56}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CARD_BACKGROUND,
  },
  body: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: RICH_SPACING.md,
    paddingTop: RICH_SPACING.xl,
  },
  accountLabel: {
    ...RICH_TYPE.sectionTitle,
    color: TEXT_SECONDARY,
    marginBottom: RICH_SPACING.md,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: RICH_SPACING.sm,
    paddingVertical: RICH_SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER_COLOR,
  },
  rowLabel: {
    flexShrink: 0,
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  rowValue: {
    ...RICH_TYPE.amount,
    maxWidth: "64%",
    flexShrink: 1,
    fontSize: 18,
    color: TEXT_PRIMARY,
    textAlign: "right",
  },
  targetValue: {
    color: ACCESSIBLE_GREEN,
    fontWeight: "600",
  },
  cursor: {
    color: PRIMARY_GREEN,
    fontWeight: "300",
  },
  delta: {
    ...RICH_TYPE.body,
    marginTop: RICH_SPACING.md,
    color: TEXT_SECONDARY,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  numpad: {
    backgroundColor: KEYPAD_BACKGROUND,
  },
  numpadInner: { width: "100%", maxWidth: 430, alignSelf: "center" },
});
