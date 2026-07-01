# Original RICH 记账 — reference screenshots

Design reference for matching the original RICH 记账 app screen-for-screen. Used together with
the `docs/mockups.html` mockups and `docs/PROGRESS.md` design-fidelity notes.

## ⚠️ Privacy: images are git-ignored on purpose

The screenshots live under `original-app/screenshots/` and are **excluded from git** via
`.gitignore` (`docs/reference/rich-screens/**/screenshots/`), because they contain **real
financial data** (account names, balances, transaction notes). Keep them locally for
reference; **do not force-add them** to a repo that may be shared/public.

This `README.md` is committed (text only) so the design knowledge travels with the repo even
when the images don't. To reuse the references in another project, copy the
`original-app/screenshots/` folder over manually.

## Screenshot index

| File | Screen | What it shows |
| --- | --- | --- |
| `01-budget-empty.png` | 预算/计划 (budget) | Tab landing. Summary card (计划清单 / 结余 / 趋势图), empty-state "您还未创建预算" + 创建预算. |
| `02-home-calendar.png` | 首页 (calendar) | Month calendar with per-day highlights, today marker, then the grouped list. |
| `03-home-list.png` | 首页 (home, list) | Brand header + dropdown + avatar, month summary card, date-grouped transaction list. |
| `04-home-daily-sheet.png` | 首页 (daily sheet) | A single day's transactions as an expandable sheet (✕ close + 添加一笔支出/收入). |
| `05-add-expense.png` | 记一笔 (add) | 支出/收入 toggle, amount, ~22-category icon grid (with "…" subcategory badges), account + note, custom numpad. |
| `06-transaction-detail.png` | 支出编辑 (detail) | Single transaction card + 所属预算/计划 link row + 删除该笔支出. |
| `07-assets-accounts.png` | 资产管理 (assets) | 目标资产 goal (monument + %), 已有总资产, grouped accounts, 账户转账 button. |
| `08-account-transfer.png` | 账户转账 (transfer) | Transfer flow: 选择转出账户 → 选择转入账户 + amount + 添加备注 + numpad. |

## Key design takeaways (from these screens)

- **Navigation**: only 2 tabs + center FAB — 首页 and 预算/计划 (alarm-clock icon). Everything
  else is a pushed screen with a back arrow, no tab bar.
- **预算/计划** is a **budget** page (not charts). Summary card = 2 cells (left 计划清单, right
  stacked 结余 / 趋势图). Charts live in a secondary 趋势图 sub-view.
- **Dividers**: dashed under date headers and the amount input; solid for card splits and
  account rows; no divider between transaction rows (whitespace only).
- **Colors**: expense amounts are **black**; green only for income (`+`); coral for delete.
  Calendar entry highlight is a **lighter mint** (#B5EAD7).
- **Corners**: content cards are near-sharp (~4px); buttons/pills/badges/circles stay rounded.
- **Calendar**: consecutive entry days = one continuous band; today = outlined ring + dot;
  selected past date = gray circle; week starts Monday.
- **Features present in the original**: account transfer (账户转账), savings goal (目标资产),
  per-transaction 所属预算/计划 link, ~20 categories with subcategory ("…") badges.
