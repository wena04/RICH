import { useCallback, useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CHART_GRAY, CHART_GRAY_ACTIVE, CHART_SERIES, CHART_BASELINE } from '@/components/charts/tokens';
import { INCOME_TEXT_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';
import { RICH_NUMERAL_FONT } from '@/constants/Design';
import type { MonthlyTotalsRow } from '@/src/features/charts/aggregations';
import { compactYuan, monthTick, monthTitle } from '@/src/features/charts/labels';
import { centsToYuan } from '@/src/utils/money';

type Kind = 'expense' | 'income';

type Props = {
  data: readonly MonthlyTotalsRow[];
  kind: Kind;
  selectedMonth: string;
  onSelect: (month: string) => void;
  width: number;
  plotHeight?: number;
};

const KIND_LABEL: Record<Kind, string> = { expense: '支出', income: '收入' };

function valueOf(row: MonthlyTotalsRow, kind: Kind) {
  return kind === 'expense' ? row.expenseCents : row.incomeCents;
}

function signedYuan(cents: number) {
  return cents < 0 ? `−¥${centsToYuan(-cents)}` : `¥${centsToYuan(cents)}`;
}

/**
 * Month columns for one series (支出 or 收入). The selected month is drawn in the series colour and
 * the rest in gray. Hovering (web, iPad pointer) or pressing and dragging across the plot moves a
 * crosshair and updates the readout above it; releasing, tapping, or VoiceOver's adjust gesture
 * selects that month.
 */
export function MonthlyColumns({ data, kind, selectedMonth, onSelect, width, plotHeight = 112 }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const plotRef = useRef<View>(null);
  const plotX = useRef(0);

  const count = data.length;
  const slot = count > 0 ? width / count : width;
  const barWidth = Math.max(6, Math.min(22, slot * 0.42));
  const max = Math.max(0, ...data.map((row) => valueOf(row, kind)));
  const selectedIndex = data.findIndex((row) => row.month === selectedMonth);
  const shownIndex = activeIndex ?? (selectedIndex >= 0 ? selectedIndex : count - 1);
  const shown = data[shownIndex];

  const measure = useCallback(() => {
    plotRef.current?.measureInWindow((x) => {
      plotX.current = x;
    });
  }, []);

  const indexAt = useCallback(
    (pageX: number) => {
      if (count === 0) return null;
      const index = Math.floor((pageX - plotX.current) / slot);
      return Math.max(0, Math.min(count - 1, index));
    },
    [count, slot],
  );

  const track = (event: GestureResponderEvent) => setActiveIndex(indexAt(event.nativeEvent.pageX));
  const release = (event: GestureResponderEvent) => {
    const index = indexAt(event.nativeEvent.pageX);
    setActiveIndex(null);
    if (index !== null) onSelect(data[index].month);
  };

  // Mouse and pen hover; touch goes through the responder handlers so it can select on release.
  const hover = (event: { nativeEvent: { pageX: number; pointerType?: string } }) => {
    if (event.nativeEvent.pointerType === 'touch') return;
    setActiveIndex(indexAt(event.nativeEvent.pageX));
  };

  if (!shown) return null;
  const shownValue = valueOf(shown, kind);
  const net = shown.incomeCents - shown.expenseCents;

  const step = (delta: number) => {
    const next = data[Math.max(0, Math.min(count - 1, (selectedIndex >= 0 ? selectedIndex : count - 1) + delta))];
    if (next) onSelect(next.month);
  };

  return (
    <View style={{ width }}>
      <View style={styles.readout} accessibilityLiveRegion="polite">
        <Text style={styles.readoutLabel}>
          {monthTitle(shown.month)}
          {KIND_LABEL[kind]}
        </Text>
        <Text style={styles.readoutValue} numberOfLines={1} adjustsFontSizeToFit>
          ¥{centsToYuan(shownValue)}
        </Text>
        <Text style={styles.readoutMeta} numberOfLines={1}>
          {kind === 'expense' ? '收入' : '支出'} ¥
          {centsToYuan(kind === 'expense' ? shown.incomeCents : shown.expenseCents)}
          {'  ·  '}结余{' '}
          <Text style={net < 0 ? undefined : styles.readoutPositive}>{signedYuan(net)}</Text>
        </Text>
      </View>

      <View
        ref={plotRef}
        onLayout={(_: LayoutChangeEvent) => measure()}
        style={styles.plot}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          measure();
          track(event);
        }}
        onResponderMove={track}
        onResponderRelease={release}
        onResponderTerminationRequest={() => true}
        onResponderTerminate={() => setActiveIndex(null)}
        onPointerMove={hover}
        onPointerLeave={() => setActiveIndex(null)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`近 ${count} 个月${KIND_LABEL[kind]}`}
        accessibilityValue={{
          text: `${monthTitle(data[selectedIndex >= 0 ? selectedIndex : count - 1].month)}，${KIND_LABEL[kind]} ${centsToYuan(
            valueOf(data[selectedIndex >= 0 ? selectedIndex : count - 1], kind),
          )} 元`,
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
      >
        <View pointerEvents="none" style={[styles.columns, { height: plotHeight }]}>
          {data.map((row, index) => {
            const value = valueOf(row, kind);
            // Leave headroom for the label over the tallest column.
            const height = max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * (plotHeight - 20)) : 0;
            const selected = index === selectedIndex;
            const active = index === activeIndex;
            return (
              <View key={row.month} style={[styles.slot, { width: slot }]}>
                {active ? <View style={styles.crosshair} /> : null}
                {selected && value > 0 ? (
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {compactYuan(value)}
                  </Text>
                ) : null}
                <View
                  style={[
                    styles.bar,
                    {
                      width: barWidth,
                      height,
                      backgroundColor: selected ? CHART_SERIES : active ? CHART_GRAY_ACTIVE : CHART_GRAY,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
        <View pointerEvents="none" style={styles.baseline} />
        <View pointerEvents="none" style={styles.ticks}>
          {data.map((row, index) => (
            <Text
              key={row.month}
              style={[styles.tick, { width: slot }, index === selectedIndex && styles.tickSelected]}
            >
              {monthTick(row.month)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { minHeight: 70, marginBottom: 6 },
  readoutLabel: { fontSize: 12, lineHeight: 17, color: TEXT_SECONDARY },
  readoutValue: {
    fontFamily: RICH_NUMERAL_FONT,
    fontSize: 28,
    lineHeight: 34,
    color: TEXT_PRIMARY,
  },
  readoutMeta: { fontSize: 12, lineHeight: 17, color: TEXT_SECONDARY, fontVariant: ['tabular-nums'] },
  readoutPositive: { color: INCOME_TEXT_GREEN },
  // Web: a pointer cursor, and no text selection while dragging across the plot.
  plot: { cursor: 'pointer', userSelect: 'none' } as object,
  columns: { flexDirection: 'row', alignItems: 'flex-end' },
  slot: { height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  crosshair: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth * 2,
    backgroundColor: CHART_BASELINE,
  },
  barLabel: {
    marginBottom: 3,
    fontSize: 10,
    lineHeight: 13,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
  },
  // 4pt rounded data end, square at the baseline.
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  baseline: { height: StyleSheet.hairlineWidth * 2, backgroundColor: CHART_BASELINE },
  ticks: { flexDirection: 'row', height: 17 },
  tick: { marginTop: 4, fontSize: 10, lineHeight: 13, color: TEXT_SECONDARY, textAlign: 'center' },
  tickSelected: { color: TEXT_PRIMARY, fontWeight: '600' },
});
