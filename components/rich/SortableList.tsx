import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, type LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { moveItem, targetIndexForDrag } from '@/src/features/budgets/order';

export type SortableRowContext = {
  index: number;
  first: boolean;
  last: boolean;
  /** This row is being dragged. */
  dragging: boolean;
  /** Moves the row by `delta` places (the ↑ / ↓ buttons). */
  move: (delta: number) => void;
  /** The drag handle; dragging it moves the row at once. */
  handle: ReactNode;
};

type Props<T> = {
  items: readonly T[];
  keyOf: (item: T) => string;
  onReorder: (next: T[]) => void;
  renderRow: (item: T, context: SortableRowContext) => ReactNode;
  /** Called with `true` when a drag starts and `false` when it ends, e.g. to pause scrolling. */
  onDragActiveChange?: (active: boolean) => void;
  /** Hold time before a row (outside its handle) can be dragged. */
  longPressMs?: number;
};

type Drag = { key: string; from: number; to: number };

/**
 * A vertical list the person can reorder three ways: ↑ / ↓ buttons (also VoiceOver), dragging a
 * row's handle, or long-pressing anywhere else on the row and dragging. Rows can differ in height.
 */
export function SortableList<T>({
  items,
  keyOf,
  onReorder,
  renderRow,
  onDragActiveChange,
  longPressMs = 280,
}: Props<T>) {
  const heights = useRef(new Map<string, number>());
  const offsets = useRef(new Map<string, Animated.Value>());
  const lift = useRef(new Animated.Value(0)).current;
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const resetAfterReorder = useRef(false);

  const keys = useMemo(() => items.map(keyOf), [items, keyOf]);

  const offsetFor = (key: string) => {
    let value = offsets.current.get(key);
    if (!value) {
      value = new Animated.Value(0);
      offsets.current.set(key, value);
    }
    return value;
  };

  // After a drop, the new order renders; zero the offsets in the same frame so nothing jumps.
  useLayoutEffect(() => {
    if (!resetAfterReorder.current) return;
    resetAfterReorder.current = false;
    for (const value of offsets.current.values()) value.setValue(0);
  }, [keys]);

  const heightOf = (key: string) => heights.current.get(key) ?? 0;

  /** Slides the rows between the drag's origin and target to open a gap at the target. */
  const settleNeighbours = (current: Drag) => {
    const moving = heightOf(current.key);
    keys.forEach((key, index) => {
      if (key === current.key) return;
      let shift = 0;
      if (current.from < current.to && index > current.from && index <= current.to) shift = -moving;
      if (current.from > current.to && index >= current.to && index < current.from) shift = moving;
      Animated.timing(offsetFor(key), { toValue: shift, duration: 140, useNativeDriver: false }).start();
    });
  };

  const begin = (key: string) => {
    const from = keys.indexOf(key);
    if (from < 0) return;
    const next = { key, from, to: from };
    dragRef.current = next;
    setDrag(next);
    offsetFor(key).setValue(0);
    Animated.timing(lift, { toValue: 1, duration: 120, useNativeDriver: false }).start();
    onDragActiveChange?.(true);
  };

  const update = (translationY: number) => {
    const current = dragRef.current;
    if (!current) return;
    offsetFor(current.key).setValue(translationY);
    const to = targetIndexForDrag(keys.map(heightOf), current.from, translationY);
    if (to !== current.to) {
      const next = { ...current, to };
      dragRef.current = next;
      setDrag(next);
      settleNeighbours(next);
    }
  };

  const finish = () => {
    const current = dragRef.current;
    if (!current) return;
    dragRef.current = null;
    setDrag(null);
    Animated.timing(lift, { toValue: 0, duration: 120, useNativeDriver: false }).start();
    onDragActiveChange?.(false);
    if (current.to !== current.from) {
      resetAfterReorder.current = true;
      onReorder(moveItem(items, current.from, current.to - current.from));
    } else {
      Animated.timing(offsetFor(current.key), { toValue: 0, duration: 140, useNativeDriver: false }).start();
    }
  };

  // Gestures are created once per row; they call the latest handlers through this ref.
  const handlers = useRef({ begin, update, finish });
  handlers.current = { begin, update, finish };

  return (
    <View>
      {items.map((item, index) => {
        const key = keys[index];
        const dragging = drag?.key === key;
        return (
          <SortableRow
            key={key}
            rowKey={key}
            handlers={handlers}
            longPressMs={longPressMs}
            offset={offsetFor(key)}
            lift={lift}
            dragging={dragging}
            onMeasure={(height) => heights.current.set(key, height)}
            render={(handle) =>
              renderRow(item, {
                index,
                first: index === 0,
                last: index === items.length - 1,
                dragging,
                move: (delta) => onReorder(moveItem(items, index, delta)),
                handle,
              })
            }
          />
        );
      })}
    </View>
  );
}

type Handlers = { begin: (key: string) => void; update: (dy: number) => void; finish: () => void };

function SortableRow({
  rowKey,
  handlers,
  longPressMs,
  offset,
  lift,
  dragging,
  onMeasure,
  render,
}: {
  rowKey: string;
  handlers: { current: Handlers };
  longPressMs: number;
  offset: Animated.Value;
  lift: Animated.Value;
  dragging: boolean;
  onMeasure: (height: number) => void;
  render: (handle: ReactNode) => ReactNode;
}) {
  const [rowPan, handlePan] = useMemo(() => {
    const make = () =>
      Gesture.Pan()
        .runOnJS(true)
        .onStart(() => handlers.current.begin(rowKey))
        .onUpdate((event) => handlers.current.update(event.translationY))
        .onFinalize(() => handlers.current.finish());
    // The row starts only after the hold: an effectively infinite distance threshold keeps a quick
    // swipe (which should scroll, or do nothing) from activating it.
    return [make().activateAfterLongPress(longPressMs).minDistance(10000), make().minDistance(1)];
  }, [handlers, rowKey, longPressMs]);

  const handle = (
    <GestureDetector gesture={handlePan}>
      <View style={styles.handle} accessible={false} importantForAccessibility="no-hide-descendants">
        <View style={styles.handleBar} />
        <View style={styles.handleBar} />
        <View style={styles.handleBar} />
      </View>
    </GestureDetector>
  );

  const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  return (
    <GestureDetector gesture={rowPan}>
      <Animated.View
        onLayout={(event: LayoutChangeEvent) => onMeasure(event.nativeEvent.layout.height)}
        style={[
          { transform: dragging ? [{ translateY: offset }, { scale }] : [{ translateY: offset }] },
          dragging && styles.lifted,
        ]}
      >
        {render(handle)}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...(Platform.OS === 'web' ? ({ cursor: 'grab', touchAction: 'none' } as object) : null),
  },
  handleBar: { width: 16, height: 1.5, borderRadius: 1, backgroundColor: '#BBBBBB' },
  lifted: {
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
