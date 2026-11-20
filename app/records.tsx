import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LedgerDays, groupLedgerByDay } from '@/components/rich/LedgerList';
import { ScreenHeader } from '@/components/rich/ScreenHeader';
import { CARD_BACKGROUND, PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import { listTransactions, type TransactionFilter, type TransactionListItem } from '@/src/db/repo/transactions';
import { centsToYuan } from '@/src/utils/money';
import { useScaledStyles } from '@/components/rich/useScaledStyles';

/** Route params. `subcategoryId=none` means records filed under the category itself. */
export type RecordsParams = {
  title?: string;
  subtitle?: string;
  type?: 'expense' | 'income';
  start?: string;
  end?: string;
  categoryId?: string;
  subcategoryId?: string;
  envelopeId?: string;
};

function toFilter(params: RecordsParams): TransactionFilter {
  return {
    type: params.type === 'income' || params.type === 'expense' ? params.type : undefined,
    start: params.start || undefined,
    endExclusive: params.end || undefined,
    categoryId: params.categoryId || undefined,
    subcategoryId: params.subcategoryId === 'none' ? null : params.subcategoryId || undefined,
    envelopeId: params.envelopeId || undefined,
  };
}

/** The records behind a chart row or a budget, grouped by day like Home. */
export default function RecordsScreen() {
  const styles = useScaledStyles(baseStyles);
  const router = useRouter();
  const params = useLocalSearchParams<RecordsParams>();
  const filter = useMemo(
    () => toFilter(params),
    // Params are strings; key the filter on their values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.type, params.start, params.end, params.categoryId, params.subcategoryId, params.envelopeId],
  );
  const [records, setRecords] = useState<TransactionListItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++requestRef.current;
    setFailed(false);
    try {
      const next = await listTransactions(await getDb(), filter);
      if (request === requestRef.current) setRecords(next);
    } catch (error) {
      console.error('Failed to load records:', error);
      if (request === requestRef.current) setFailed(true);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        requestRef.current += 1;
      };
    }, [refresh]),
  );

  const days = useMemo(() => groupLedgerByDay(records ?? []), [records]);
  const total = useMemo(() => (records ?? []).reduce((sum, r) => sum + r.amountCents, 0), [records]);
  const kindLabel = filter.type === 'income' ? '收入' : '支出';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader title={params.title || '记录'} onBack={() => router.back()} backgroundColor={PRIMARY_GREEN} />
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {failed ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>记录读取失败</Text>
            <Pressable onPress={() => void refresh()} style={styles.retry} accessibilityRole="button">
              <Text style={styles.retryText}>重新加载</Text>
            </Pressable>
          </View>
        ) : records === null ? (
          <View style={styles.state}>
            <ActivityIndicator color={PRIMARY_GREEN} />
          </View>
        ) : records.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>没有记录</Text>
          </View>
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                {params.subtitle ? `${params.subtitle} · ` : ''}
                {records.length} 笔
              </Text>
              {filter.type ? (
                <Text style={styles.summaryTotal}>
                  {kindLabel} ¥{centsToYuan(total)}
                </Text>
              ) : null}
            </View>
            <LedgerDays days={days} onOpen={(t) => router.push(`/transaction/${t.id}`)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  list: { flex: 1, backgroundColor: CARD_BACKGROUND },
  listContent: { paddingBottom: 40 },
  summary: {
    paddingHorizontal: 24.7,
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  summaryText: { fontSize: 12, color: TEXT_SECONDARY },
  summaryTotal: { fontSize: 14, color: TEXT_PRIMARY, fontVariant: ['tabular-nums'] },
  state: { paddingVertical: 80, alignItems: 'center', gap: 12 },
  stateTitle: { fontSize: 14, color: TEXT_SECONDARY },
  retry: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 4, backgroundColor: TEXT_PRIMARY },
  retryText: { color: CARD_BACKGROUND, fontSize: 13 },
});
