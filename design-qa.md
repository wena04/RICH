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

Browser check (production web export, 393 × 852 and 375 × 667): empty state → create monthly →
create special → populated list → edit amount → reload persists → examples; no console errors.
Web limitation: React Native Web's `Alert.alert` is a no-op, so the validation alert and delete
confirmation only appear on native.

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
