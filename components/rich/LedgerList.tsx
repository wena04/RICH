import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { DashedDivider } from '@/components/rich/DashedDivider';
import { useLayoutScale, useScaledStyles } from '@/components/rich/useScaledStyles';
import { INCOME_TEXT_GREEN, PRIMARY_GREEN, TEXT_PRIMARY } from '@/constants/Colors';
import type { TransactionListItem } from '@/src/db/repo/transactions';
import { centsToYuan } from '@/src/utils/money';

export type LedgerDay = {
  date: string;
  txs: TransactionListItem[];
  /** Expense total for the day, in cents. */
  exp: number;
  /** Income total for the day, in cents. */
  inc: number;
};

/** Groups records by day, newest day first, keeping each day's record order. */
export function groupLedgerByDay(transactions: readonly TransactionListItem[]): LedgerDay[] {
  const map = new Map<string, TransactionListItem[]>();
  for (const t of transactions) {
    const day = map.get(t.date) ?? [];
    day.push(t);
    map.set(t.date, day);
  }
  return [...map.keys()]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((date) => {
      const txs = map.get(date)!;
      let exp = 0;
      let inc = 0;
      for (const t of txs) {
        if (t.type === 'expense') exp += t.amountCents;
        else if (t.type === 'income') inc += t.amountCents;
      }
      return { date, txs, exp, inc };
    });
}

export function ledgerDateLabel(date: string): string {
  const [, m, d] = date.split('-');
  return `${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}

const DATE_RULE = { dashWidth: 5.5, gap: 4.5, thickness: 2 / 3, color: '#D8D8D8' } as const;

/** The original day header: date on the left, the day's − / + totals stacked on the right. */
export function LedgerDayHeader({ day }: { day: LedgerDay }) {
  const styles = useScaledStyles(baseStyles);
  const k = useLayoutScale();
  return (
    <>
      <View style={styles.dateHeader}>
        <Text style={styles.dateLabel}>{ledgerDateLabel(day.date)}</Text>
        <View style={styles.dayTotals}>
          <Text style={styles.dayExpense}>– ¥ {centsToYuan(day.exp)}</Text>
          <Text style={styles.dayIncome}>+ ¥ {centsToYuan(day.inc)}</Text>
        </View>
      </View>
      <DashedDivider style={styles.dateDivider} {...DATE_RULE} dashWidth={DATE_RULE.dashWidth * k} gap={DATE_RULE.gap * k} />
    </>
  );
}

/** One record row as Home draws it: category art, note (or category), path, signed amount. */
export function LedgerRow({ t, onPress }: { t: TransactionListItem; onPress: () => void }) {
  const path = t.subcategory?.name
    ? `${t.category?.name ?? '分类'} › ${t.subcategory.name}`
    : (t.category?.name ?? '');
  const sign = t.type === 'expense' || t.amountCents < 0 ? '−' : '+';
  const amount = centsToYuan(Math.abs(t.amountCents));
  const styles = useScaledStyles(baseStyles);
  const k = useLayoutScale();
  return (
    <Pressable
      style={styles.txRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t.note || t.category?.name || '记录'}，${path}，${sign === '−' ? '支出' : '收入'} ${amount} 元`}
    >
      <View style={styles.txIcon}>
        <CategoryIcon id={t.category?.icon ?? undefined} name={t.category?.name} size={Math.round(34 * k * 100) / 100} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txTitle} numberOfLines={1}>
          {t.note || t.category?.name || '记录'}
        </Text>
        <Text style={styles.txSub}>{path}</Text>
      </View>
      <Text style={[styles.txAmt, t.type === 'income' && { color: INCOME_TEXT_GREEN }]}>
        {sign}
        {amount}
      </Text>
    </Pressable>
  );
}

/** Day groups separated by the original 10pt #F7F7F7 band. */
export function LedgerDays({
  days,
  onOpen,
}: {
  days: readonly LedgerDay[];
  onOpen: (t: TransactionListItem) => void;
}) {
  const styles = useScaledStyles(baseStyles);
  return (
    <>
      {days.map((day, index) => (
        <View key={day.date}>
          {index > 0 && <View style={styles.gapBand} />}
          <LedgerDayHeader day={day} />
          {day.txs.map((t) => (
            <LedgerRow key={t.id} t={t} onPress={() => onOpen(t)} />
          ))}
        </View>
      ))}
    </>
  );
}

const baseStyles = StyleSheet.create({
  gapBand: { height: 10, backgroundColor: '#F7F7F7' },
  // List geometry measured from the original at 3x (393pt; scaled with the width, as the 402pt
  // capture's rule and dashes show): totals 18pt under the band, 72.6pt rows, icon circle at 21pt,
  // amounts 22pt from the edge.
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 24.7,
    paddingRight: 24.3,
    paddingTop: 14,
    paddingBottom: 7,
  },
  dateDivider: {
    marginLeft: 20,
    marginRight: 24.7, // the original rule ends under the day totals
    marginBottom: 1,
  },
  dateLabel: { fontSize: 13.5, color: '#777777' },
  dayTotals: { alignItems: 'flex-end' },
  dayExpense: { fontSize: 10.3, lineHeight: 16, color: '#777777', fontVariant: ['tabular-nums'] },
  dayIncome: { fontSize: 10.3, lineHeight: 16, color: PRIMARY_GREEN, fontVariant: ['tabular-nums'] },
  txRow: {
    minHeight: 72.6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 21,
    paddingRight: 22,
  },
  txIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11.3,
  },
  txInfo: { flex: 1, paddingTop: 4 },
  txTitle: { fontSize: 14, lineHeight: 20, color: TEXT_PRIMARY },
  txSub: { fontSize: 12, lineHeight: 16, color: '#777777', marginTop: 6.65 },
  txAmt: { fontSize: 16, color: TEXT_PRIMARY, fontVariant: ['tabular-nums'] },
});
