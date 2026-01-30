/**
 * RICH app color theme - mint green inspired by original RICH 记账
 */

// Primary mint green color from original RICH app
export const PRIMARY_GREEN = '#3ECDA5';
export const PRIMARY_GREEN_DARK = '#2BB890';

// Semantic colors
export const EXPENSE_RED = '#FF6B6B';
export const INCOME_GREEN = '#4CAF50';
export const BALANCE_ADJUST_BLUE = '#5C9CE6';

// UI colors
export const CARD_BACKGROUND = '#FFFFFF';
export const BORDER_COLOR = '#E5E5E5';
export const TEXT_PRIMARY = '#1A1A1A';
export const TEXT_SECONDARY = '#666666';
export const TEXT_MUTED = '#999999';

// Tab bar
export const TAB_BAR_BACKGROUND = '#FFFFFF';
export const TAB_ICON_DEFAULT = '#999999';
export const TAB_ICON_SELECTED = '#1A1A1A';

// FAB (floating action button)
export const FAB_BACKGROUND = '#1A1A1A';
export const FAB_ICON = '#FFFFFF';

const Colors = {
  light: {
    text: TEXT_PRIMARY,
    textSecondary: TEXT_SECONDARY,
    background: '#F5F5F5',
    tint: PRIMARY_GREEN,
    primary: PRIMARY_GREEN,
    card: CARD_BACKGROUND,
    border: BORDER_COLOR,
    tabIconDefault: TAB_ICON_DEFAULT,
    tabIconSelected: TAB_ICON_SELECTED,
    expense: EXPENSE_RED,
    income: INCOME_GREEN,
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    background: '#1A1A1A',
    tint: PRIMARY_GREEN,
    primary: PRIMARY_GREEN,
    card: '#2A2A2A',
    border: '#333333',
    tabIconDefault: '#666666',
    tabIconSelected: '#FFFFFF',
    expense: EXPENSE_RED,
    income: INCOME_GREEN,
  },
};

export default Colors;
