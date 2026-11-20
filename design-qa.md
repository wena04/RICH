# Rich记账 visual QA

## Comparison target

- Source visual truth (private, off-repo in `~/Desktop/RICH-reference/RICH-original-reference-bundle/original-interaction-screenshots/`; removed from git because they contain real financial data):
  - `01-budget-empty.png` — budget/plan empty state
  - `02-home-list.png` — populated Home shell
  - `04-add-expense.png` — selected expense and keypad
  - `07-assets-accounts.png` — asset management
- Browser-rendered implementation:
  - `design-qa-assets/home-implementation.png`
  - `design-qa-assets/budget-implementation.png`
  - `design-qa-assets/add-implementation.png`
  - `design-qa-assets/accounts-implementation.png`
- Combined comparison input: `design-qa-assets/comparison.html`
- Latest live preview checked: `http://127.0.0.1:4173/`

## Viewport and normalization

- Supplied captures: 1179 × 2556 physical pixels, representing 393 × 852 CSS points at 3× density.
- Implementation captures: 862 × 1726 physical pixels, representing the Codex in-app browser viewport of 431 × 863 CSS pixels at 2× density.
- The comparison board displays both artifacts at 393 CSS pixels wide. The source iOS status bar/safe-area chrome is treated as platform chrome; implementation judgments use the aligned app-content region below it.
- No browser frame, tab strip, or surrounding desktop canvas appears in the implementation screenshots.

## States compared

- Home: expanded first-entry calendar and empty current-month transaction state.
- Budget/plan: no budget configured.
- Add expense: 交通 selected, amount ¥110.57, confirm enabled; account/note/date remain live local data.
- Asset management: default ¥10,000 goal, zero local balances, one Cash account.

## Full-view comparison evidence

- The Home shell now matches the supplied first-entry state: original Rich wordmark, account/profile controls, month pill, dual totals, expanded `MON–SUN` calendar, adjacent-month dates, today ring/dot, exact empty-box artwork, original empty copy, mint header proportion, and three-part bottom navigation.
- The budget screen matches the supplied structure: centered title, split white summary card, mint breathing room below the card, empty-state headline, three-segment donut example, black create action, and original tab artwork.
- The add-expense screen matches the supplied density and hierarchy: header toggle/date control, large amount line, four complete visible category rows with no clipped fifth row, selected-category ring, compact account/note bar, tall four-row keypad, operator rail, and two-row confirm button.
- Asset management uses the supplied dark radial canvas and castle artwork instead of a reconstructed drawing; the goal meter, asset total, grouped accounts, add actions, and transfer action retain the source composition.

## Focused region comparison evidence

- Typography: platform system UI typography preserves the source's iOS-style weights, compact labels, tabular monetary figures, and hierarchy. The display wordmark is the original raster asset rather than approximated text.
- Spacing/layout: Home header/card proportions, budget green band, category-grid viewport, account bar, and keypad were inspected separately because they materially determine screen density.
- Colors/tokens: primary mint is `#3FDEAE`, wordmark highlight is `#00FFB2`, destructive coral is `#EC5E56`, calendar entry mint is `#A8E9DD`, and control gray is `#F7F7F7`, matching the supplied assets/captures.
- Image quality: wordmark, app icon, header controls, tab icons, empty-box illustration, budget-progress illustration, asset canvas, castle, and known category icons are direct assets extracted from the supplied Rich app bundle. The 18-section picker now uses the original PNGs; SVGs remain only as a fallback for unknown custom/imported names.
- Copy/content: app-specific Chinese labels match the supplied screens. Differences in month, balances, account names, notes, and transaction rows are expected live-data differences rather than design drift.

## Findings

- No actionable P0, P1, or P2 fidelity findings remain.
- [P3] The browser evidence does not render the native iOS status bar or native safe-area inset. This is an expected platform-preview difference; the aligned content regions match after excluding that chrome.
- [P3] The implementation evidence uses current empty/local data while some supplied captures contain historical user transactions and accounts. Dynamic values were not copied into the product or repository.

## Comparison history

### Iteration 1 — blocked

- [P1] Home opened with the full calendar, materially changing the above-the-fold composition from the supplied compact month summary.
- [P2] Budget/plan included an extra visible month stepper and lacked the source's mint band below the summary card.
- [P2] Add expense exposed a fifth category row, compressed the keypad, and left the keypad visually short.
- [P2] Selecting a category automatically opened an inline subcategory region and added a breadcrumb strip absent from the supplied selected state.

### Fixes applied

- Made Home compact by default, with explicit accessible expand/collapse behavior on the month control.
- Removed the visible budget month strip and restored the 30-point mint spacing below the summary card.
- Constrained the category area to four visible rows while keeping additional/custom categories scrollable; restored the tall keypad and compact account/note bar.
- Kept ordinary category selection visually identical to the source and moved optional subcategory expansion to the existing ellipsis affordance.

### Iteration 2 — passed

- Post-fix captures are the four `design-qa-assets/*-implementation.png` files listed above.
- The combined comparison board confirms the earlier P1/P2 issues are resolved.
- Primary interactions tested: Home calendar expand/collapse, Home → Budget, center add action, category selection, numeric entry, subcategory ellipsis expansion, and Home → Asset management.
- Browser console errors checked after the final build: none.

### Iteration 3 — passed

- Corrected the first-entry Home state to the user's expanded-calendar screenshot: English weekday labels, leading/trailing dates, single month pill, original empty-box asset, exact `本月还没有收支记录` copy, and no extra unfiltered CTA.
- Replaced approximated category artwork with all 122 catalog-referenced PNGs from the supplied `Assets.car`, plus the original 还钱, settings, and three-dot assets. The original `TallyTypeinfo.plist` now drives a 18-section/134-item name-to-asset registry.
- Added a semantic SVG fallback beneath each original category PNG so a slow, interrupted, or failed image request can never leave an empty category circle; the exact original artwork replaces it immediately after loading.
- Replaced the reconstructed budget example donut with the supplied `icon_budget_progress` artwork.
- Rechecked Home, add-expense, the full icon picker, and the budget empty state in the browser after a production web export. No P1/P2 visual findings remain in these states.

## Original-parity pass (November 19, 2026)

Re-checked every screen against the original captures (plus a fresh capture of the original
add-entry tray from the owner's phone), measuring at the same 1179 × 2556 / 3× scale with canvas
pixel analysis (`/tmp` tooling, not committed). Fixed:

| Screen | Was | Now (matches original) |
| --- | --- | --- |
| Add entry | Tray only from "…" badge; inset rounded card; grey labels; no visible selection ring (the original PNG's baked-in circle covered the border); 77pt rows; 80pt keypad rows; regular digits; grey 确定; segmented 支出/收入; plain date | Tray on any category tap, full-width #F7F7F7 band with `icon_tally_arrow` caret, glyph-only items; black labels; ring drawn above the artwork; 86pt rows (orig 86.7); 56pt keypad rows; original rounded numerals (`RichRounded`, OFL subset of the bundled font) and keypad artwork; black 确定; separate pills + 今天 pill |
| Subcategories | No add path for categories without subcategories; name-only popup; no stored icon | 添加子类 page (name + full icon library), icon stored (migration v10); 自定义 shows a row of subcategory icons + 添加子类 |
| Home | Bold rows/totals; hyphen minus; 60pt rows; inline day filter with duplicate header; heavy calendar | Regular weights, "−" amounts, "– ¥ x" day totals, 72pt rows; day tap opens the original day sheet; 38pt calendar rows, thin today ring, light weekday labels, compact 6月 pill |
| Detail | 支出详情 with date/account grid, bold | 支出编辑 card: record row + 所属预算/计划 only |
| 资产管理 | No rays; red flag marker; bold amounts; outlined 添加; type subtitles; inline 账户转账 | `icon_shine` rays, leader line + edit icon, rounded-numeral total, original account artwork, bare balances, filled 添加 pills, floating 账户转账 |
| Transfer | Green title bar, field labels, full-width selectors, 0/100 counter | White header with 今天 pill, centered pill selectors, double-arrow artwork, centered 添加备注 |

Known remaining difference: the starter subcategory set differs from the owner's personal
categories by design (fresh installs get the student starter taxonomy). (Correction, later the same
day: the original's selected category interior is #F7F7F7 with a 1.7pt inner ring, not white; the
separated disc now reproduces it exactly. The web preview draws that ring at 1pt because Chromium
rounds border widths; native renders 1.7pt.)

## Icon and geometry pass (November 19, 2026, second pass)

The first pass compared screens element by element. This pass aligned whole screens: the
original captures come from a 393pt device with a 59pt top safe area, so each capture was shifted
up 59pt (the add and transfer screens instead by their header row, which the original places 8.3pt
below the safe area) and every element was measured against the web export at 3×. Every
FontAwesome glyph was also replaced with artwork from the original `Assets.car` (116 UI images
extracted; `components/rich/RichChevron.tsx` wraps the chevron set).

| Screen | Was | Now (matches original) |
| --- | --- | --- |
| Tab bar | 28pt icons, budget tab used `icon_clock`, green underline, bold 12pt labels, drawn `+` with shadow, 62pt bar | `tab_home`/`tab_calendar` (+ selected) at 40pt, 10pt labels (#000 selected / #929292), `add_new` 60pt button 14pt above a 49pt bar with a #C0C0C0 hairline |
| Screen headers | 64pt tall; back chevron centred in its touch slot (14pt too far right) | 44pt bar; `nav_icon_back_black` 16pt from the edge (all ScreenHeader and budget/category screens) |
| Home | Title art 18pt low; 44pt account/profile buttons; 16pt card margins; tall calendar header; 30pt day circles; future days black; mint strip above the tab bar | Title art at 11.3pt, 40pt buttons, 20pt card margins, measured month pill/totals/weekday/row offsets, 28pt circles and bands, future days #777777, list fonts/margins/dashes from the original; white list to the tab bar |
| Day sheet | Thin X in a drawn circle; sheet flush with the card | `close_clear` art; sheet 5.3pt below the card top; button 21pt above the home indicator |
| Budget tab | 60pt header; bold 15pt 计划清单; drawn trend donut; 280pt example art; bold button | 46pt header; 19pt 计划清单, 15pt 结余/趋势图, `icon_trend_chart_small`; 210×98 `icon_budget_progress`; 284×44 regular-weight button; measured empty-state spacing |
| Detail | 16pt margins, 84pt row, 未归入 shown | 24.3pt margins, 74.7/55.7pt rows, `icon_right_unfold`, blank until assigned |
| 资产管理 | Total 40pt; 18pt info gap; 66pt group headers; text 添加 pills; 24pt account icons | Total 31pt; info column 30pt right of the art; 60.7pt headers; `create_item` pill art; 20pt account art, hairline row rules, `icon_right_unfold` |
| Add entry / transfer | Header 21.7pt low; 44pt amount; 4/4 dashes; 32pt pills | Header 8.2pt below the safe area; 35pt amount with a 40pt cursor; 7/6.7 #E3E3E3 dashes; 54×24.7 pills; 48pt category art on a 72.9pt column pitch; unselected category art at 50% opacity once one is selected (measured: strokes #7F7F7F, disc #FBFBFB); `icon_describe` note icon; 272.4pt transfer selectors |
| Icons elsewhere | FontAwesome chevrons, plus, times, check, ellipsis, carets, warning, menu icons | Original `icon_arrow_unfold`/`icon_small_gray_back`/`icon_fold`/`icon_unfold`, `icon_add_custom` (添加子类), `icon_cancel`, `symbol_add`, `btn_select`, `icon_three_dot`, `icon_menu_normal`/`icon_menu_selected`, `icon_warning`, and `icon_clipboard_list`/`icon_asset_management`/`icon_sort`/`icon_data_export`/`icon_clipboard`/`icon_help_center`/`icon_agreement`/`icon_change_money`/`icon_add` for menus |

The menu-icon choices on 我的 and 数据管理 are judgement calls: those screens have no original
capture, so each row uses the closest-named original artwork.

## Budget envelopes (November 18, 2026) — designed, not source-verified

The original populated budget list and create/edit budget pages have no screenshots, and the app
bundle exposes no layouts or copy. These screens reuse original artwork and match the replica's
existing patterns; they are **not** pixel-verified against Rich 1.1.0.

| Screen | Original evidence used | Designed to match |
| --- | --- | --- |
| Populated Budget tab (`我的预算` list) | `icon_budget_create` (`+ 新预算` pill), `icon_month_budget` / `icon_special_budget` badges, help-page row layout (emoji · name · amount · description) | Budget tab header/summary card, `ProgressBar` |
| Create/edit budget (`app/budget/envelope.tsx`) | Budget types and fields from the backup schema; emoji icons from help examples | Add-entry type toggle and large amount line, `添加自定义类目` icon grid, coral delete button from 支出编辑 |
| Budget/plan examples (`app/budget/help.tsx`) | All eight original help images | Plain header, horizontal paging |
| 计划清单 (`app/budget/plans.tsx`) | Plan-help card layout (gray card, emoji, 冻结预算「…」¥/月, target, `0/N`), `plan_clock` / `plan_clock_finish`, `icon_no_plan` | Budget list header/footer patterns |
| Create plan / plan detail (`app/budget/plan.tsx`) | Fields from the backup `deposit_plan` schema, `icon_plan_finish` | Budget editor form, account-sheet picker |
| Budget sort mode, 已归档 (`app/budget/archived.tsx`) | `icon_list_sort`; `sort_index` / `is_archived` in the backup schema | Drag-to-reorder (≡ handle, or long-press the row) plus ↑/↓ buttons kept for VoiceOver; the original's exact drag affordance is not captured |

Browser check (production web export, 393 × 852 and 375 × 667): empty state → create monthly →
create special → populated list → edit amount → reload persists → examples; no console errors.
Web limitation: React Native Web's `Alert.alert` is a no-op, so the validation alert and delete
confirmation only appear on native.

## New original captures (November 19, 2026)

The owner captured four more original screens; they replace earlier designs:

| Screen | Original | Now |
| --- | --- | --- |
| Home month pill | Opens 选择时间: month + year wheels, Cancel / OK, gray selection band, future years listed | `MonthPickerSheet` + `WheelPicker`; was a calendar toggle, and Home could not leave the current month at all |
| 创建预算 | Three steps: 选择你想创建的预算类型 (专项 / 月度 cards with `icon_check_button_gray/black`, `icon_examples`, gray example box, 下一步 bar) → 输入预算名称 (emoji disc + field + `icon_describe`, 5-column emoji grid starting 🔴🔵⚫⚪😀) → 设置预算金额 (green, ¥0.00, 请输入…预算金额, 3-column keypad, 完成) | `app/budget/create*.tsx`; was one designed form (now edit-only) |

Captures saved privately as `09-home-month-picker.png` … `12-budget-create-amount.png` (plus
`13-add-expense-tray-402pt.png`) in the off-repo screenshot folder: 1206 × 2622, a 402pt iPhone at
3×. Measured with column/row pixel scans against the web export rendered at 402 × 874; positions
are anchored to the navigation title (the browser has no safe areas) or, for the keypad, to the
home indicator. Result: within about 1pt everywhere — picker sheet, band (37.7pt, radius 5.5),
wheel rows (cylinder offsets 36 / 65.3 / 84.5pt, greying and leaning toward the centre), header
items, type cards, check squares, 示例 tag and example box, 下一步 bar (#1F6E56, text #9FEED6),
name field and emoji grid, amount, prompt, and keypad (which spans the width less 11.6pt, as in the
original). Not captured: how the original folds the calendar (swipe on the card here), the
enabled 下一步 colour (black here), and the emoji grid past its fifth row.

## Trends and budget detail (November 19, 2026) — designed, not source-verified

No capture exists for the original 趋势图 or a budget detail page; the bundle only has
`icon_trend_chart` (a monitor with a pie and ranked bars), used here as the empty state.

| Screen | Original evidence used | Designed to match |
| --- | --- | --- |
| 趋势图 (`app/trends.tsx`) | `icon_trend_chart` empty art; 支出/收入 pill geometry from 记一笔 | Ranked bars (shown in the original art) with category glyph discs; month columns with a live readout instead of a tooltip |
| 预算明细 (`app/budget/detail.tsx`) | `icon_month_budget` / `icon_special_budget` badges; Home ledger rows | Budget tab list row, emoji disc, `ProgressBar` |
| Filtered records (`app/records.tsx`) | Home day groups and rows (shared `LedgerList`, pixel-identical to Home) | — |

Browser check (production web export, 393 × 852 and 375 × 667): three months of records → June
ranking (79% / 21%) → hover April → drag to May and release → stepper back → unfold 餐饮
(50 / 34 / 16%) → subcategory records → 交通 records → 收入 → empty July → budget detail (¥436.50
left, 外卖 60% / 咖啡 40%) → 编辑 → back. No console errors.

## Open Questions

- The original budget/plan creation, help, archive, recurrence, deposit-plan, and accumulation-plan pages are not covered by supplied screenshots. Their assets and backup schema are available, but the encrypted App Store executable does not expose its Swift source or view hierarchy. These flows remain outside this passed visual-QA scope.
- Live financial content intentionally remains local and is not copied from supplied backup material.

## Implementation Checklist

- [x] Original app icon, wordmark, controls, tab icons, and asset illustration used.
- [x] Expanded first-entry Home and collapsible calendar verified.
- [x] Exact empty-month illustration and original copy verified.
- [x] Original category icons, category order, complete four-row viewport, and full picker verified.
- [x] Budget empty state verified.
- [x] Add-expense selected and empty states verified.
- [x] Extra categories remain accessible without changing the initial four-row composition.
- [x] Asset management verified.
- [x] Console checked with no errors.

## Follow-up Polish

- Native-device screenshots can be added later to document the exact iOS safe-area/status-bar rendering, but this does not block the current fidelity result.

final result: passed
