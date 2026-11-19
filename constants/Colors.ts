/** Canonical light-only palette for RICH 记账. */

// Brand
// Sampled from the supplied Rich 1.1.0 app artwork and reference captures.
export const PRIMARY_GREEN = '#3FDEAE';
export const PRIMARY_GREEN_DARK = '#2C9B7A';
export const BRAND_HIGHLIGHT = '#00FFB2';
export const ACCESSIBLE_GREEN = '#14745B';

// Status and data
export const INCOME_GREEN = PRIMARY_GREEN;
export const INCOME_TEXT_GREEN = PRIMARY_GREEN_DARK;
export const BALANCE_ADJUST_BLUE = '#5C9CE6';
export const WARNING_AMBER = '#E2A33A';
export const DESTRUCTIVE_CORAL = '#EC5E56';
export const DESTRUCTIVE_TEXT = '#C43D4D';
export const CHART_TEAL = '#61CFCB';
export const CHART_BLUE = '#88A8EE';
export const CHART_VIOLET = '#9B8CFF';

// Compatibility alias. Coral is destructive/over-budget, not ordinary expense color.
export const EXPENSE_RED = DESTRUCTIVE_CORAL;

// Surfaces and rules
export const CARD_BACKGROUND = '#FFFFFF';
export const PAGE_BACKGROUND = '#F6F7F8';
export const LEDGER_PAPER = '#F7F7F7';
export const KEYPAD_BACKGROUND = '#F7F7F7';
export const CONTROL_BACKGROUND = '#F7F7F7';
export const CONTROL_PRESSED_BACKGROUND = '#ECECEC';
export const CONTROL_DISABLED_BACKGROUND = '#777777';
export const CATEGORY_FRAME_BACKGROUND = '#F7F7F7';
export const BORDER_COLOR = '#EAEAEA';
export const DASHED_RULE_COLOR = '#D8D8D8';
export const ENTRY_GREEN = '#A8E9DD';

// Text and decisive actions
export const TEXT_PRIMARY = '#000000';
export const TEXT_SECONDARY = '#777777';
export const TEXT_MUTED = '#999999';
export const ACTION_BACKGROUND = TEXT_PRIMARY;
export const ACTION_FOREGROUND = CARD_BACKGROUND;

// Compatibility aliases for existing consumers
export const TAB_BAR_BACKGROUND = CARD_BACKGROUND;
export const TAB_ICON_DEFAULT = TEXT_MUTED;
export const TAB_ICON_SELECTED = TEXT_PRIMARY;

export const FAB_BACKGROUND = ACTION_BACKGROUND;
export const FAB_ICON = ACTION_FOREGROUND;

const lightColors = {
  text: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  background: PAGE_BACKGROUND,
  tint: PRIMARY_GREEN,
  primary: PRIMARY_GREEN,
  card: CARD_BACKGROUND,
  border: BORDER_COLOR,
  tabIconDefault: TAB_ICON_DEFAULT,
  tabIconSelected: TAB_ICON_SELECTED,
  expense: EXPENSE_RED,
  income: INCOME_GREEN,
};

// Keep both keys for the themed helpers, while the product intentionally renders light-only.
const Colors = { light: lightColors, dark: lightColors };

export default Colors;
