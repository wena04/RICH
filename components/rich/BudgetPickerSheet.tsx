import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  CATEGORY_FRAME_BACKGROUND,
  DESTRUCTIVE_CORAL,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/constants/Colors";
import type { BudgetEnvelopeSummary } from "@/src/domain/types";
import { centsToYuan } from "@/src/utils/money";

type BudgetPickerSheetProps = {
  visible: boolean;
  budgets: readonly BudgetEnvelopeSummary[];
  selectedId: string | null;
  saving?: boolean;
  title?: string;
  /** Show the 不归入预算 row (assignment) — off when a budget is required (plan source). */
  allowNone?: boolean;
  /** Right-hand figure: remaining this month (default) or the budget's monthly amount. */
  figure?: "remaining" | "amount";
  onSelect: (envelopeId: string | null) => void;
  onCreate: () => void;
  onClose: () => void;
};

/**
 * 所属预算 picker. Mirrors the original Rich account sheet (选择支出账户), which lists
 * a "不选择账户" row first and the remaining balance on the right of each row.
 */
export function BudgetPickerSheet({
  visible,
  budgets,
  selectedId,
  saving = false,
  title = "选择所属预算",
  allowNone = true,
  figure = "remaining",
  onSelect,
  onCreate,
  onClose,
}: BudgetPickerSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="关闭"
        />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {allowNone ? (
              <Pressable
                disabled={saving}
                onPress={() => onSelect(null)}
                style={[styles.row, selectedId === null && styles.rowActive]}
                accessibilityRole="button"
                accessibilityLabel="不归入预算"
                accessibilityState={{
                  selected: selectedId === null,
                  disabled: saving,
                }}
              >
                <View style={[styles.icon, styles.noneIcon]}>
                  <FontAwesome name="times" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.name}>不归入预算</Text>
              </Pressable>
            ) : null}

            {budgets.length === 0 && !allowNone ? (
              <Text style={styles.empty}>还没有月度预算，先新建一个</Text>
            ) : null}
            {budgets.map(({ envelope, remainingCents, amountCents }) => {
              const active = envelope.id === selectedId;
              const over = figure === "remaining" && remainingCents < 0;
              const figureText =
                figure === "amount"
                  ? `¥${centsToYuan(amountCents)}/月`
                  : `${over ? "超支" : "剩余"} ¥${centsToYuan(Math.abs(remainingCents))}`;
              return (
                <Pressable
                  key={envelope.id}
                  disabled={saving}
                  onPress={() => onSelect(envelope.id)}
                  style={[styles.row, active && styles.rowActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`${envelope.name}，${figureText}`}
                  accessibilityState={{ selected: active, disabled: saving }}
                >
                  <View style={styles.icon}>
                    <Text style={styles.emoji}>{envelope.icon}</Text>
                  </View>
                  <Text style={styles.name} numberOfLines={1}>
                    {envelope.name}
                  </Text>
                  <Text style={[styles.balance, over && styles.over]}>
                    {figureText}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              onPress={onCreate}
              style={styles.createRow}
              accessibilityRole="button"
              accessibilityLabel="新预算"
            >
              <FontAwesome name="plus" size={12} color={TEXT_SECONDARY} />
              <Text style={styles.createText}>新预算</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 14,
    paddingBottom: 22,
    paddingHorizontal: 16,
    maxHeight: "62%",
  },
  title: { fontSize: 14, color: TEXT_SECONDARY, marginBottom: 10 },
  empty: {
    paddingVertical: 18,
    textAlign: "center",
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  rowActive: {
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
  },
  noneIcon: { backgroundColor: TEXT_MUTED },
  emoji: { fontSize: 17 },
  name: { flex: 1, fontSize: 15, color: TEXT_PRIMARY },
  balance: {
    marginLeft: 8,
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontVariant: ["tabular-nums"],
  },
  over: { color: DESTRUCTIVE_CORAL },
  createRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  createText: { fontSize: 14, color: TEXT_SECONDARY },
});
