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

export const RICH_SIZE = {
  headerAction: 44,
  screenHeader: 64,
  tabBar: 62,
  fab: 58,
  minimumTouchTarget: 44,
} as const;
