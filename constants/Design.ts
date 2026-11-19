import type { TextStyle } from 'react-native';

export const RICH_SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const RICH_RADIUS = {
  card: 3,
  control: 6,
  soft: 8,
  sheet: 16,
  pill: 999,
} as const;

export const RICH_TYPE = {
  screenTitle: { fontSize: 17, fontWeight: '600' as const },
  sectionTitle: { fontSize: 14, fontWeight: '600' as const },
  body: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '400' as const },
  caption: { fontSize: 10.5, fontWeight: '400' as const },
  amount: {
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  },
} as const;

/** Original Rich rounded bold numerals (digits, ¥, + − . only). */
export const RICH_NUMERAL_FONT = 'RichRounded';

export const RICH_SIZE = {
  headerAction: 44,
  screenHeader: 44, // UINavigationBar height; the original screens use the standard bar
  tabBar: 62,
  fab: 58,
  minimumTouchTarget: 44,
} as const;

/**
 * How far the 记一笔 / 账户转账 header row tucks up into the safe area. The original sits its
 * 24.7pt pills just under the status bar: on Dynamic Island iPhones the safe area (59pt) is 5pt
 * taller than the status bar (54pt), so the 44pt row moves up 13.8pt (measured); on notch iPhones
 * and Android the safe area is the status bar, so it moves up only enough to keep the pills 1pt
 * below it. Web previews have no inset and don't move.
 */
export function composerHeaderTuck(safeAreaTop: number): number {
  if (safeAreaTop <= 0) return 0;
  return safeAreaTop >= 54 ? 13.8 : Math.min(safeAreaTop, 8.65);
}
