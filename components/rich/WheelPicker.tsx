import { useEffect, useRef } from 'react';
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TEXT_PRIMARY } from '@/constants/Colors';

type Props = {
  items: readonly string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  /** VoiceOver name for the wheel, e.g. 月份. */
  accessibilityLabel: string;
  /** Which side of the picker this wheel is on; rows lean toward the picker's centre. */
  side: 'left' | 'right';
  width?: number | `${number}%`;
};

export const WHEEL_ROW = 36;
/** The standard iOS picker height. */
export const WHEEL_HEIGHT = 216;

// Measured from the original 选择时间 capture (402pt iPhone, 3x), by distance from the selected row:
// rows sit on a cylinder (centres 0 / 36 / 65.3 / 84.5pt out), flatten vertically, turn grey, and
// lean toward the picker's centre (the selected row sits 7.6pt outward of its column centre).
const DISTANCE = [-3, -2, -1, 0, 1, 2, 3];
const CENTRE_OFFSET = [-84.5, -65.3, -36, 0, 36, 65.3, 84.5];
const SCALE_Y = [0.35, 0.7, 0.97, 1, 0.97, 0.7, 0.35];
const OPACITY = [0.15, 0.32, 0.35, 1, 0.35, 0.32, 0.15];
const LEAN = [8.4, 6.6, 2.7, -7.6, 2.7, 6.6, 8.4]; // + toward the picker centre

/**
 * An iOS-style picker wheel (the original 选择时间 sheet). Scroll, or tap a row; VoiceOver swipes
 * up and down to adjust.
 */
export function WheelPicker({ items, selectedIndex, onChange, accessibilityLabel, side, width = '50%' }: Props) {
  const listRef = useRef<Animated.FlatList<string> | null>(null);
  const scrollY = useRef(new Animated.Value(selectedIndex * WHEEL_ROW)).current;
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIndex = useRef(selectedIndex);
  const padding = (WHEEL_HEIGHT - WHEEL_ROW) / 2;
  const toCentre = side === 'left' ? 1 : -1;

  // Follow outside changes (opening the sheet on another month) without fighting the finger.
  useEffect(() => {
    if (selectedIndex === lastIndex.current) return;
    lastIndex.current = selectedIndex;
    listRef.current?.scrollToOffset({ offset: selectedIndex * WHEEL_ROW, animated: false });
  }, [selectedIndex]);

  const settle = (offsetY: number) => {
    const index = Math.max(0, Math.min(items.length - 1, Math.round(offsetY / WHEEL_ROW)));
    if (index !== lastIndex.current) {
      lastIndex.current = index;
      onChange(index);
    }
  };

  const select = (index: number) => {
    listRef.current?.scrollToOffset({ offset: index * WHEEL_ROW, animated: true });
    if (index !== lastIndex.current) {
      lastIndex.current = index;
      onChange(index);
    }
  };

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: Platform.OS !== 'web',
    listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Web has no momentum-end event: settle once scrolling has been still for a moment.
      if (Platform.OS !== 'web') return;
      const y = event.nativeEvent.contentOffset.y;
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => settle(y), 140);
    },
  });

  return (
    <View
      style={{ width, height: WHEEL_HEIGHT, overflow: 'hidden' }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: items[selectedIndex] }}
      aria-valuetext={items[selectedIndex]}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) =>
        select(
          Math.max(
            0,
            Math.min(items.length - 1, selectedIndex + (event.nativeEvent.actionName === 'increment' ? 1 : -1)),
          ),
        )
      }
    >
      <Animated.FlatList
        ref={listRef}
        data={items as string[]}
        keyExtractor={(item, index) => `${index}-${item}`}
        initialScrollIndex={selectedIndex}
        getItemLayout={(_, index) => ({ length: WHEEL_ROW, offset: WHEEL_ROW * index, index })}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ROW}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: padding }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => settle(event.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(event) => {
          // A drag that ends without momentum never fires momentum-end.
          if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.05) settle(event.nativeEvent.contentOffset.y);
        }}
        renderItem={({ item, index }) => {
          // Distance d from the centre is (index·row − scrollY) / row; inputs must ascend in scrollY,
          // so walk the distances from +3 down to −3.
          const inputRange = DISTANCE.map((d) => (index - d) * WHEEL_ROW).reverse();
          const pick = (values: number[]) => [...values].reverse();
          const at = (values: number[]) =>
            scrollY.interpolate({ inputRange, outputRange: pick(values), extrapolate: 'clamp' });
          const translateY = at(CENTRE_OFFSET.map((offset, k) => offset - DISTANCE[k] * WHEEL_ROW));
          const translateX = at(LEAN.map((lean) => lean * toCentre));
          const scaleY = at(SCALE_Y);
          const opacity = scrollY.interpolate({
            inputRange: [(index - 3.6) * WHEEL_ROW, ...inputRange, (index + 3.6) * WHEEL_ROW],
            outputRange: [0, ...pick(OPACITY), 0],
            extrapolate: 'clamp',
          });
          return (
            <Pressable
              onPress={() => select(index)}
              style={styles.row}
              accessible={false}
              importantForAccessibility="no-hide-descendants"
            >
              <Animated.View style={{ opacity, transform: [{ translateY }, { translateX }, { scaleY }] }}>
                <Text style={styles.item} numberOfLines={1}>
                  {item}
                </Text>
              </Animated.View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: WHEEL_ROW, justifyContent: 'center' },
  // 18.8pt: "November" measures 81pt wide in the original.
  item: { fontSize: 18.8, color: TEXT_PRIMARY, textAlign: 'center' },
});
