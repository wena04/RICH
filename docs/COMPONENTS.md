# RICH Component Specification

This document is the implementation contract for reusable UI. It is based on the archived
RICH screenshots in `RICH Items/`, the browser mockups in `docs/mockups.html`, and the current
React Native implementation. Reuse these parts before adding one-off screen styles.

Brand identity, naming, voice, logo, and external-use rules live in [BRAND_GUIDE.md](BRAND_GUIDE.md).

## 1. Visual foundations

### Color tokens

| Token | Value | Use |
|---|---:|---|
| `PRIMARY_GREEN` | `#3FDEAE` | App header fields, active navigation, icon accents |
| `PRIMARY_GREEN_DARK` | `#2C9B7A` | Pressed/strong green state |
| `TEXT_PRIMARY` | `#000000` | Main text, expense amounts, icon outlines |
| `TEXT_SECONDARY` | `#777777` | Labels and supporting values |
| `TEXT_MUTED` | `#999999` | Inactive navigation and placeholders |
| `CARD_BACKGROUND` | `#FFFFFF` | Cards, sheets, list bands |
| `BORDER_COLOR` | `#EAEAEA` | Solid inset separators |
| `ENTRY_GREEN` | `#A8E9DD` | Calendar dates that contain entries |
| `INCOME_GREEN` | `#3FDEAE` | Positive/income visualization |
| budget warning | `#E2A33A` | Budget usage from 80% through 100% |
| `EXPENSE_RED` | `#EC5E56` | Destructive actions and over-budget state, not expenses |
| chart teal | `#61CFCB` | Primary categorical chart segment |
| chart blue | `#88A8EE` | Secondary categorical chart segment |
| chart violet | `#9B8CFF` | Tertiary categorical chart segment |
| panel gray | `#F7F7F7` | Empty-state and bounded utility panels |
| page gray | `#F6F7F8` | Group separation and utility-screen backgrounds |

Core implementation source: `constants/Colors.ts`. The budget warning and chart hues are currently
defined in `docs/mockups.html` and should be exported from `Colors.ts` when this approved mockup is
ported to native code. Spacing, type, size, and radius constants are in `constants/Design.ts`.

Color use is deliberately restrained:

- Mint identifies RICH through header fields, selected details, and icon accents. It is not the
  default fill for every section.
- Black carries expense values and primary information. Green numbers mean income or a healthy
  remaining budget only.
- Amber and coral are state colors, not decoration. Coral appears only for destructive actions or
  an actual over-budget state.
- Teal, blue, and violet are reserved for categorical data visualization so chart segments remain
  distinguishable from income and warning semantics.

### Geometry rules

- Base spacing scale: `4, 8, 12, 16, 20, 24, 32`.
- Screen side inset: 16 px for dense tools, 20-24 px for original full-width cards.
- Content cards are square or near-square (`0-4` px radius). Do not turn page sections into
  floating rounded cards.
- Pills, category circles, avatars, and circular icon controls are intentional exceptions.
- Screen title: 17 px, weight 600. Section title: 14 px, weight 600.
- Body labels: 12-14 px. Numeric amount text uses tabular alignment where comparison matters.
- Use weights 400-600 for most UI. Weight 700 is reserved for the brand title, empty-state heading,
  and the primary label in the budget summary matrix.
- Dashed separators identify date/amount boundaries. Solid hairlines divide rows inside a card.
- Transaction rows use whitespace rather than solid separators.

## 2. Reusable primitives

### `RichBrandName`

Source: `components/rich/RichBrandName.tsx`

- Renders the exact 3x `Rich记账` title artwork recovered from the supplied Rich 1.1.0 app.
- The home header uses `size={40}` to reproduce the original 166 × 54 pt treatment. About and
  secondary product-identification surfaces may use smaller sizes through the same property.
- Preserve the artwork's bright `#00FFB2` circle, aspect ratio, and transparent background.

### `ScreenHeader`

Source: `components/rich/ScreenHeader.tsx`

| Property | Contract |
|---|---|
| Height | Minimum 44 px (standard iOS bar; the original screens use it) |
| Left/right action | 44 px slots by default; `actionWidth` may reserve more room for text actions |
| Back | Original `nav_icon_back_black` art, 16 px, left-aligned 16 px from the screen edge |
| Title | Absolutely centered, one line, 17/600 |
| Subtitle | Optional 10.5 px line below title |
| Background | White or `PRIMARY_GREEN`, supplied by the screen |
| Divider | Optional solid hairline via `borderBottom` |

Use on pushed screens with a centered title. Contextual composer headers such as 记一笔 and
账户转账 may keep a custom layout because they combine type/date controls.

Current users: 资产管理, 自定义, 添加自定义类目, 设置分类预算, 趋势图, transaction detail,
调整余额, 数据管理, 关于应用, 隐私政策, 我的.

### `RichChevron`

Source: `components/rich/RichChevron.tsx`

- Original chevron artwork: `dark` (black `icon_right_unfold`, `icon_unfold_left`, `icon_fold`,
  `icon_unfold`) and `muted` (#777777 `icon_arrow_unfold`, `icon_small_gray_back`).
- Negative margins collapse each PNG's transparent canvas padding, so the chevron takes up only its
  glyph's footprint in layout. `scale` multiplies the original size.
- Use instead of icon-font chevrons. Rows matched pixel-for-pixel against a capture (detail,
  资产管理) place `icon_right_unfold` directly with measured padding.

### `MonthStepper`

Source: `components/rich/MonthStepper.tsx`

- Previous and next controls meet a 44 px touch target by default.
- Center label has an 84 px stable minimum width so month changes do not move adjacent content.
- `plain` is used for analytics/budget; `pill` is used inside the home summary.
- Compact contexts may lower `buttonSize` while retaining hit slop.

### `DashedDivider`

Source: `components/rich/DashedDivider.tsx`

- Manual 1 px dash rendering avoids inconsistent React Native dashed borders.
- Default dash is 4 px with a 4 px gap in `#D8D8D8`.
- Use beneath transaction date summaries, amount displays, and icon-picker section labels.
- Do not use between ordinary setting/account rows; those use a solid hairline.

### `ProgressBar`

Source: `components/rich/ProgressBar.tsx`

- Takes a numeric percentage and clamps visual fill to `0...100`.
- Keeps the actual percentage available to surrounding text, including values above 100.
- Default height is 7 px; category/subcategory bars use 5-8 px.
- Budget color rule: green below 80%, amber from 80-100%, coral above 100%.
- Exposes the React Native `progressbar` accessibility role and current value.

### `MoneyNumpad`

Source: `components/rich/MoneyNumpad.tsx`

| Part | Specification |
|---|---|
| Layout | 3:1 digit grid to operator column |
| Digit rows | Four rows, 54 px each by default |
| Key surface | Flat light-gray field, no rounded key rectangles or grid borders |
| Digits | 22 px, weight 500 |
| Operators | 28 px; caller supplies `+/-` or `+/- sign` actions |
| Confirm | Black, spans all operator-column space below operators |
| Backspace | Black tag-shaped key with white multiplication mark, matching the original control |

Current users: new transaction, account transfer, balance adjustment. Calculation state remains
owned by each flow; the component owns only presentation and input events.

### `CategoryIcon`

Source: `components/icons/CategoryIcon.tsx`

- Draws one of the 123 original glyphs (vector, `react-native-svg`) with no background.
- `size` is the art canvas in points: 48 in the entry grid and 自定义 subcategory row, 40 in the
  subcategory tray and 自定义 category rows, 34 in ledger rows and the detail card.
- The caller draws the frame: a #F7F7F7 circle the same size as `size`; selected adds a 1.7pt black
  ring inside the circle (interior stays #F7F7F7); unselected entries dim to 50% once another
  category is selected. In the #F7F7F7 subcategory tray the circle is omitted.
- Original inks by default (#000000, accent #02B17B); `color` / `accentColor` recolour them.
- Resolution order: stored original icon → original icon for the category name → legacy id from an
  earlier build → 其他 (`src/domain/categoryIcons`).
- Do not substitute emoji or icon-font glyphs for a category icon.

### `MonthlyColumns`

Source: `components/charts/MonthlyColumns.tsx` (labels in `src/features/charts/labels.ts`)

- One series at a time (支出 or 收入), one column per month. The selected month is #2C9B7A (the
  only chart green that clears 3:1 on white) with its value printed on top; other months are
  #DEDEDE. 4pt rounded tops, square at a hairline #D8D8D8 baseline, month ticks below.
- The readout above the plot (month, total, the other type, 结余) follows the pointer: hover on web
  and iPad, press-and-drag on touch, with a crosshair on the active column. It replaces a floating
  tooltip so a finger never covers it. Tap or release selects a month.
- Accessibility: the plot is one `adjustable` element; swipe up/down moves the selected month.

### `CategoryBreakdownList`

Source: `components/charts/CategoryBreakdownList.tsx` (data from `src/features/charts/breakdown.ts`)

- Ranked rows, largest first: 36pt #F7F7F7 disc with the category glyph, name, whole-number share
  (shares add up to 100), amount, and a 5pt #2C9B7A meter of the share of the total.
- A category with named subcategories unfolds (chevron down/up) into 52pt subcategory rows
  indented under the name: 28pt disc, share of the category, 3pt mint meter. Records filed under the
  category itself appear as 未细分 with the category glyph at 50%. 查看全部 N 笔 closes the group.
- Every row leads to its records (`/records`); a category with no subcategories goes there
  directly. Hover lightens the row on web.
- Identity comes from the glyph and name, not colour, so the list never needs more than one hue.

### `MonthPickerSheet` and `WheelPicker`

Sources: `components/rich/MonthPickerSheet.tsx`, `components/rich/WheelPicker.tsx`

- The original 选择时间 sheet (owner capture): white sheet over a 20% black scrim; Cancel (black,
  left) · 选择时间 (gray, centre) · OK (`#3FDEAE`, right); a month wheel and a year wheel over one
  #F3F3F4 rounded band. Labels follow the phone language like the system picker did (11月 / 2026年,
  or November / 2026 with Cancel / OK).
- `WheelPicker`: 36pt rows, seven visible, rows shrink and fade away from the centre; snaps on
  scroll, tap a row to jump to it, VoiceOver adjusts it.

### `SortableList`

Source: `components/rich/SortableList.tsx` (`react-native-gesture-handler`; drop math in
`src/features/budgets/order.ts`)

- Three ways to reorder: drag the ≡ handle (three 16×1.5pt #BBBBBB bars in a 44pt target, starts at
  once), long-press the row (280ms) and drag, or the row's ↑/↓ buttons, which stay for VoiceOver.
- The dragged row lifts (white, soft shadow, 1.02 scale) and follows the finger; neighbours slide
  to open the gap once its edge passes their midpoint. Rows may differ in height.
- `onDragActiveChange` lets the screen pause its ScrollView while a row is held.
- The app root is wrapped in `GestureHandlerRootView` (`app/_layout.tsx`).

### `LedgerList`

Source: `components/rich/LedgerList.tsx`

- `groupLedgerByDay`, `LedgerDayHeader`, `LedgerRow`, `LedgerDays`: Home's day groups (date,
  stacked − / + totals, 5.5/4.5 dashed rule, 72.6pt rows, 10pt #F7F7F7 band between days). Home,
  the day sheet, budget detail, and the filtered records screen all draw records with it.

### `DatePickerModal`

Source: `components/DatePickerModal.tsx`

- Cross-platform modal with month navigation and Monday-first dates.
- Receives/returns ISO `YYYY-MM-DD`; formatting belongs to `formatIsoDateCN`.
- Used by new transaction and account transfer.

### `AssetGoalIllustration`

Source: `components/rich/AssetGoalIllustration.tsx`

- 146 x 182 px default frame based on the original 资产管理 composition.
- Accepts progress `0...100` and renders a vertical mint meter plus percentage.
- This is a domain illustration, not a generic card; keep its aspect ratio stable.

## 3. Composite component patterns

### Bottom navigation

Implementation: `app/(tabs)/_layout.tsx`.

- Exactly two visible tabs: 首页 and 预算/计划, with a centered black add button.
- Base height 62 px plus the device bottom safe-area inset.
- Active icon and label are near-black with a mint detail inside the icon; inactive is gray.
- The center button is 58 px and rises 28 px above the bar.
- The plus mark is lightweight text, not the heavier FontAwesome plus glyph.
- Pushed/modal screens never display this bar.

### Category tile grid

- Five equal columns; tile width is always 20% of the available row.
- Icon frame is circular and does not resize when selected or badged.
- Label is one line and centered below the icon.
- The selected main category receives an outline; subcategories appear in a full-width zone directly
  beneath that category's row.
- `管理分类` is a mint circular tile at the end of the main category catalog.
- `添加` is the final option in an expanded subcategory zone.

### Transaction date group

- Date label on the left, daily expense and income stacked on the right.
- Dashed divider immediately below the date summary.
- Ledger item: circular icon, title/category stack, amount right aligned.
- Expense amount is black; income is green with a plus sign.
- Separate dates with a 10-14 px light-gray band.

### Budget summary matrix

- White square-edged rectangle on the green header.
- Left 50%: 计划清单 title and bottom-right amount.
- Right: 结余 above 趋势图, divided by a solid hairline.
- Left/right division uses the brand green hairline.
- No shadow or rounded corners. The geometry, title, and two right rows stay identical in empty and
  configured states.

### Budget/plan screen

The page has one persistent stack: green title field, budget summary matrix, white scroll body,
then the standard bottom navigation. Changing budget state must not replace that frame.

| State | Body contract |
|---|---|
| Empty | No month stepper. Center `您还未创建预算`, then one square `#F5F6F7` panel containing the three-part example donut, leader labels, one sentence, and a black rectangular `+ 创建预算` command. |
| Configured | Compact month stepper; unframed monthly total band; 6 px overall progress; 8 px gray section break; square category list with solid row hairlines; black rectangular `+ 设置分类预算` command. |

- The monthly total shows spent amount first and limit second; budget remaining appears on the
  right below the progress track.
- Category rows use the stored two-tone `CategoryIcon` in a 28-32 px gray circle. Do not substitute
  FontAwesome glyphs when a RICH category icon exists.
- Progress is mint below 80%, amber from 80% through 100%, and coral only above 100%. Text displays
  the real percentage even though the visual fill clamps at 100%.
- The body scrolls independently. The summary matrix and bottom navigation must remain visible at
  compact iPhone heights.
- `趋势图` opens the analytics subview; it does not turn the tab itself into an analytics dashboard.

### Account group

- White square-edged group on green, with a heading/total/add row.
- Account rows use solid inset dividers, 30 px circular account icons, name, balance, chevron.
- `+ 添加` is a pill because it is a compact command, not a content card.
- 账户转账 is a centered black rectangular command below the account groups.

### Modal form sheet

- Dim backdrop; white bottom sheet; 取消/title/保存 header.
- Input fields may use a 6 px control radius. Avoid rounded cards around fields.
- Destructive controls are coral and require confirmation when data will be deleted/overwritten.

## 4. Screen composition map

| Screen | Primary reusable parts |
|---|---|
| 首页 | custom brand header, `MonthStepper`, calendar grid, `DashedDivider`, transaction groups, bottom nav |
| 记一笔 | contextual header, `DatePickerModal`, category grid, inline subcategory zone, `MoneyNumpad` |
| 收入 entry | same composer with `DEFAULT_INCOME_CATEGORIES` |
| 预算/计划 | budget summary matrix, `MonthStepper` when needed, `ProgressBar`, bottom nav |
| 趋势图 | `ScreenHeader`, 支出/收入 pills + `MonthStepper` filter row, `MonthlyColumns`, `CategoryBreakdownList` |
| 预算明细 | `ScreenHeader`, `MonthStepper`, `ProgressBar`, `CategoryBreakdownList`, `LedgerDays` |
| 记录 (filtered) | `ScreenHeader`, `LedgerDays` |
| 交易详情 | `ScreenHeader`, square detail card, rectangular coral delete button |
| 资产管理 | `ScreenHeader`, `AssetGoalIllustration`, account groups |
| 账户转账 | contextual date header, `DatePickerModal`, account selectors, `MoneyNumpad` |
| 调整余额 | `ScreenHeader`, before/after rows, `MoneyNumpad` |
| 自定义 | `ScreenHeader`, category rows, nested subcategory rows, centered add command |
| 添加自定义类目 | `ScreenHeader`, `DashedDivider`, five-column `CategoryIcon` catalog |
| 数据管理 | `ScreenHeader`, flat action sections, account chips, destructive restore confirmation |

## 5. Component acceptance checklist

Before adding or changing a component:

1. Verify its reference frame in `RICH Items/` and `docs/mockups.html`.
2. Use tokens from `Colors.ts` and `Design.ts`; do not introduce near-duplicate values casually.
3. Keep fixed controls dimensionally stable across selected, pressed, loading, and empty states.
4. Test at a compact iPhone viewport and a modern tall iPhone viewport.
5. Confirm bottom content remains above the device safe area.
6. Confirm every visible Pressable has a real action and an accessible label where the meaning is not textual.
7. Run TypeScript, unit tests, and an Expo production export after shared-component changes.
