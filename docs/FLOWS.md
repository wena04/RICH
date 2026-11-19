# RICH 记账 — Navigation & Flow Map

> How the app currently fits together: the navigation graph, what every interactive
> element does *right now* (traced from source, not the mockups), and where flows
> dead-end or are missing.
>
> Traced from source in `app/`. Reflects the current state including the 账户转账
> transfer screen, persisted 目标资产 goal, real calculator arithmetic on the add-screen
> numpad, and the removal of the dead `components/TabBar.tsx`.

---

## 1. Route registry

### Root stack — `app/_layout.tsx`
| Route | Presentation | Notes |
|---|---|---|
| `(tabs)` | default | headerShown: false. Initial route. |
| `trends` | default | headerShown: false. 趋势图 sub-view. |
| `accounts` | default | headerShown: false. Asset/account management. |
| `categories` | default | headerShown: false. Category management. |
| `import-export` | default | headerShown: false. CSV and database data management. |
| `about`, `privacy` | default | headerShown: false. Product/privacy information. |
| `transaction/[id]` | default | headerShown: false. Detail. |
| `transaction/edit/[id]` | default | Polished transaction editor. |
| `transaction/adjust`, `transaction/transfer` | default | Balance and transfer flows. |
| `categories/add` | default | headerShown: false. Icon picker for custom categories. |
| `budget/envelope` | default | headerShown: false. Create (no params) or edit (`?id=`) a budget. |
| `budget/detail` | default | headerShown: false. One budget (`?id=`): remaining, category/subcategory breakdown, records. |
| `records` | default | headerShown: false. Records behind a chart row or budget (`?type&start&end&categoryId&subcategoryId&envelopeId`, `subcategoryId=none` = 未细分). |
| `budget/help` | default | headerShown: false. Original example pages (`?topic=budget\|plan`). |
| `budget/plans` | default | headerShown: false. 计划清单 list. |
| `budget/plan` | default | headerShown: false. Create (no params) or detail (`?id=`) a savings plan. |
| `budget/archived` | default | headerShown: false. Archived budgets and plans with 恢复. |
| `transaction/new` | **modal** | Add screen. |

### Tab layout — `app/(tabs)/_layout.tsx`
Uses a custom tab bar (`CustomTabBar`, defined inline in this file). Tabs:
- `index` (首页) — visible
- `add-placeholder` — `href: null` (hidden; center FAB occupies its slot)
- `charts` (预算/计划) — visible
- `transactions` — `href: null` (hidden)
- `more` — `href: null` (hidden)

Only **two** visible tabs + a center FAB. `more` and `transactions` have no tab entry.

---

## 2. The tab bar

- **`app/(tabs)/_layout.tsx` → `CustomTabBar`** — the only tab bar (the previous duplicate
  `components/TabBar.tsx` has been deleted as dead code).
  - 首页 tab → `navigation.navigate('index')`
  - Center **+ FAB** → `router.push('/transaction/new')`
  - 预算/计划 tab → `navigation.navigate('charts')`

---

## 3. Element-by-element behavior

### Center **+ FAB** (rendered on both tabs, part of the tab bar)
- **Trigger:** tap the black round + button.
- **Now:** `router.push('/transaction/new')` → opens the Add screen as a **modal**.
- Same on both 首页 and 预算/计划 (the tab bar is shared).
- `app/(tabs)/add-placeholder.tsx` is a `<Redirect href="/transaction/new" />`; a safety
  net for the hidden tab slot, not normally hit because the FAB pushes directly.

### Home — `app/(tabs)/index.tsx`
| Element | Trigger → Result |
|---|---|
| Brand dropdown chevron (next to "Rich记账") | `router.push('/accounts')` → 资产管理 screen. |
| Avatar (top-right) | `router.push('/more')` → 我的 screen. |
| Month ‹ / › arrows | `goPrevMonth` / `goNextMonth` — loads transactions for that month. Real. |
| Month pill ("6月 ▼") | Display only (navigation via arrows). |
| Calendar day cell tap | Opens the original **day sheet** over the summary card (dimmed header, floating ✕, that day's group, 添加一笔支出/收入 → `/transaction/new?date=…`). |
| Transaction row tap | `router.push('/transaction/${t.id}')` → Detail. |
| "总支出 / 总收入" totals | Display only. |


### 预算/计划 tab — `app/(tabs)/charts.tsx`
| Element | Trigger → Result |
|---|---|
| 计划清单 card (left) | Total saved by active/completed plans and active count. Tap → `/budget/plans`. |
| 结余 row | Display only. Shows real current-month (income − expense). |
| 趋势图 row (right, with mini donut) | `router.push('/trends')` → 趋势图 screen. |
| Empty-state donut + legend | Original `icon_budget_progress` artwork when no budget exists. |
| **+ 创建预算** button | `router.push('/budget/envelope')` → new budget. |
| 我的预算 rows | Emoji, name, monthly/special badge, amount, spent/frozen/remaining. Tap → `/budget/detail?id=…`. |
| **+ 新预算** pill | `router.push('/budget/envelope')`. |
| Sort icon (`icon_list_sort`, 2+ budgets) | Sort mode (`SortableList`): drag a row's ≡ handle, or long-press the row and drag; ↑/↓ per row (also VoiceOver). Scrolling pauses while dragging. 完成 → `reorderEnvelopes`. |
| 已归档 N 项 | Shown when anything is archived → `/budget/archived`. |
| 看看别人怎么分预算 | `/budget/help?topic=budget`. |

### 计划清单 — `app/budget/plans.tsx`
| Element | Trigger → Result |
|---|---|
| 已攒 total | Saved by active/completed, non-archived plans. |
| Plan card | Emoji, name, target, 冻结预算「…」¥/月, deposits `n/N` or 已攒够/已完成/已结束. Tap → `/budget/plan?id=…`. |
| + 创建计划 / 示例 | `/budget/plan` / `/budget/help?topic=plan`. Empty state uses `icon_no_plan`. |

### 新建计划 / 计划详情 — `app/budget/plan.tsx`
| Element | Trigger → Result |
|---|---|
| 冻结预算 row | Sheet of monthly budgets with their monthly amount (+ 新预算). Required. |
| 每月冻结 / 目标金额 | Preview `共 N 期 … 预计 YYYY年M月 攒够`. Freeze ≤ target and ≤ the budget's amount. |
| 开始计划 | `createSavingsPlan` from this month → back. |
| Detail: 完成计划 | Shown once fully funded → `endSavingsPlan(completed)`. |
| Detail: 结束计划 | Confirm → `endSavingsPlan(cancelled)`; this month's freeze returns to the budget. |
| Detail: name/icon/description | Editable; 保存修改 appears when changed. |
| Detail: 归档计划 / 取消归档 | Completed or ended plans only → `setSavingsPlanArchived` → back. |

### 新建/编辑预算 — `app/budget/envelope.tsx`
| Element | Trigger → Result |
|---|---|
| 月度预算 / 专项预算 toggle | Create only; type is fixed after creation. |
| 示例 | `/budget/help?topic=budget`. |
| 保存 | Validates (name ≤ 10, amount > 0, description ≤ 30) → `createEnvelope` / `updateEnvelope` → back. Monthly amount edits apply from this month. |
| 归档预算 / 取消归档 (edit only) | `setEnvelopeArchived` → back. Blocked while a plan freezes the budget. |
| 删除该预算 (edit only) | Confirm → `deleteEnvelope`; assigned expenses become unassigned. Blocked while a plan draws on it. |

### 趋势图 — `app/trends.tsx`
| Element | Trigger → Result |
|---|---|
| Back chevron | `router.back()`. |
| 支出 / 收入 pills | Switch the series for the chart and the ranking. |
| Month ‹ / › | Select a month; the six-month window moves only when the month leaves it. |
| Month columns: hover (web, iPad pointer) or press-and-drag | Crosshair + readout (month total, the other type, 结余) follow the pointer. |
| Month columns: tap / release | Select that month. VoiceOver: adjustable (swipe up/down). |
| Category row | Has named subcategories → unfolds them (share of the category); otherwise → `/records`. |
| Subcategory row / 查看全部 N 笔 | `/records` filtered to that subcategory (未细分 = none) or the whole category. |
Fully wired to real data; no dead buttons here.

### 预算明细 — `app/budget/detail.tsx`
| Element | Trigger → Result |
|---|---|
| 编辑 | `/budget/envelope?id=…`. If the budget is deleted there, the detail shows 这个预算已删除. |
| Month ‹ / › (monthly budgets) | Between the budget's start month and this month. Special budgets show all time. |
| Summary | 本月剩余 / 超支, progress, 本月预算 · 已用 · 计划冻结 · 已用比例. |
| 支出构成 | The assigned expenses by category → subcategory (same list as 趋势图); rows open `/records` limited to the budget. |
| 本月记录 / 全部记录 | The assigned records, grouped by day like Home → `/transaction/[id]`. |

### Add — `app/transaction/new.tsx`
| Element | Trigger → Result |
|---|---|
| Back chevron | `router.back()` (dismisses modal). |
| 支出 / 收入 toggle | `setType('expense' | 'income')`. Real. (No 余额调整 option here — that lives only in the edit screen.) |
| Date button ("6月30日 ▼") | Opens `DatePickerModal` — pick any date. Real. |
| Category tile tap | Selects it and opens the full-width subcategory tray under its row (tap again to fold). Black ring marks the selection. |
| **管理分类** green tile | `router.push('/categories')` → category management. |
| Subcategory tile tap | `setSelectedSubId(...)` (toggle). Glyph-only tiles, same columns as the categories. |
| **添加子类** tile (category without subcategories) | `/categories/add?parentId=…` → name + icon from the full library → `createSubcategory(…, icon)`. |
| Account chip (bottom-left) | Toggles an inline account picker dropdown; tapping an option sets the account. Real. |
| Note field | Free text, capped 100 chars. Real. |
| **+ operator key** | `handleOperator('+')` → **real calculator arithmetic.** Stores the running value/op and resets the entry to "0"; the pending op is applied on the next operator press and on 确定. |
| **− operator key** | `handleOperator('-')` → same running-arithmetic behavior with subtraction. |
| Numpad digits / backspace / "." | Edit the current amount entry. Real. |
| **确定** (confirm) | `onSave()` → evaluates any pending +/− (`evalPending`), validates (total>0, category, account) → `createTransaction` → `router.back()`. Disabled until a category is chosen and amount ≠ 0. |

**管理分类** green tile is present on the Add screen (last cell in the category grid).

### Detail — `app/transaction/[id].tsx`
| Element | Trigger → Result |
|---|---|
| Back chevron | `router.back()`. |
| Card row (icon + note/amount + chevron) | `router.push('/transaction/edit/${id}')` → Edit. |
| **所属预算/计划** row | Expenses only: shows the assigned budget (emoji + name) or 未归入; 不适用 for income/adjustments. Tap → `BudgetPickerSheet` (不归入预算, budgets with that month's remaining, + 新预算) → `assignTransactionToEnvelope`. |
| Delete button (删除该笔…) | `Alert.alert` confirm → `deleteTransaction` → `router.back()`. Real. |

### Edit — `app/transaction/edit/[id].tsx`
| Element | Trigger → Result |
|---|---|
| Segment: 支出 / 收入 / **余额调整** | `setType(...)`. This is the only place 余额调整 is user-selectable as a type. |
| 金额 / 日期 / 分类 / 子分类 / 备注 | Uses the date picker, typed category IDs, parent-scoped subcategory IDs, and validated text fields. |
| 账户 chips | `setAccountId(...)`. |
| 保存 | `updateTransaction` → `router.back()`. Real, with validation. |
| 删除 | Confirm alert → delete → back. Real. |

### 资产管理 (Accounts) — `app/accounts.tsx`
| Element | Trigger → Result |
|---|---|
| Back chevron | `router.back()`. |
| 目标资产 goal row (pencil) | `onEditGoal()` → opens a **cross-platform Modal** (`showGoalModal`) with a text field + 保存. Saving persists to **`app_meta`** (survives reload; works on iOS and Android). |
| Per-group **+ 添加** (资金/信用/储值) | Opens the Add-account modal, pre-setting the type by group. Real. |
| Account row tap | `openEdit(account)` → opens Edit-account modal. |
| Add modal: 取消 / 保存 / type grid | 保存 → `createAccount` → refresh. Real. |
| Edit modal: 取消 / 保存 / type grid | 保存 → `updateAccount`. Real. |
| Edit modal **调整余额** | `router.push('/transaction/adjust', { accountId, accountName })` → Adjust screen. Real. |
| Edit modal **删除该账户** | `canDeleteAccount` guard → confirm alert → `deleteAccount`. Blocks if account has transactions. Real. |
| **账户转账** button (bottom) | `router.push('/transaction/transfer')` → **real Transfer screen.** |

### 账户转账 (Transfer) — `app/transaction/transfer.tsx`
Reached from 资产管理's 账户转账 button (new), or from a transfer's detail row (`?groupId=`, edit:
amount, accounts, date, and note prefilled; an automatic note is rebuilt from the accounts).
| Element | Trigger → Result |
|---|---|
| Back chevron | `router.back()`. |
| Date pill ("今天 ▼") | Opens `DatePickerModal`; the selected date is persisted on both sides. |
| 选择转出账户 / 选择转入账户 selectors | Toggle inline dropdowns; tapping an option sets `fromId` / `toId`. Real. |
| Numpad + backspace + "." | Edit the transfer amount. Real. |
| **+ / − operator keys** | Evaluate chained transfer arithmetic before confirmation. |
| Note field | Optional; defaults to `转账 {from} → {to}`. |
| **确定** | `createTransfer` (new) or `updateTransfer` (edit): **two `balance_adjustment` rows** (−X on source, +X on destination) sharing a `transfer_group_id`, in one SQLite transaction → `router.back()`. Disabled unless amount>0 and from≠to. Real. |

### 调整余额 (Adjust) — `app/transaction/adjust.tsx`
Reached only from the Accounts edit modal's 调整余额.
| Element | Trigger → Result |
|---|---|
| Back | `router.back()`. |
| Numpad + ± sign toggle | Edit target balance. Real. |
| 确定 | Creates a `balance_adjustment` transaction with delta = target − current → `router.back()`. Disabled when delta is 0. Real. |

### 分类管理 / 自定义 (Categories) — `app/categories.tsx`
| Element | Trigger → Result |
|---|---|
| Back | `router.back()`. |
| Category row / caret | `toggleExpand` → a row of subcategory icons ending with **添加子类**. |
| Category "⋯" menu | `openEditCategory` → Edit-category modal (rename / delete). |
| Subcategory row | `openEditSubcategory` → Edit-subcategory modal. |
| 添加子类 tile | `/categories/add?parentId=…` (name + icon). |
| **+ 添加自定义** (bottom) | Opens `/categories/add`, with expense/income/both type and the full source-controlled icon catalog. |
| Edit modals delete | Guarded by `canDelete…` then confirm. Real. |

### 我的 (More) — `app/(tabs)/more.tsx`
Reached via the home avatar. Not a visible tab.
| Menu item | Trigger → Result |
|---|---|
| 账户管理 | `router.push('/accounts')`. |
| 分类管理 | `router.push('/categories')`. |
| 导出数据 | `router.push('/import-export')`. |
| 导入数据 | `router.push('/import-export')` (same screen). |
| 关于应用 | `router.push('/about')`. |
| 隐私政策 | `router.push('/privacy')`. |

### 数据管理 (Import/Export) — `app/import-export.tsx`
Styled Chinese-first data management screen. It supports CSV v1 import/export, CSV v2 export,
and lossless current-database backup/restore. Database restore validates first and requires
destructive confirmation.

---

## 4. Navigation graph (ASCII)

```
                         ┌───────────────────────────────┐
                         │        Tab bar (shared)        │
                         │  首页 │  [ + FAB ]  │ 预算/计划  │
                         └───────────────────────────────┘
                             │        │              │
        ┌────────────────────┘        │              └──────────────┐
        ▼                             ▼                              ▼
  (tabs)/index  ─ brand ▾ ─►  accounts (资产管理)          (tabs)/charts (预算/计划)
   (首页 Home)                       │                              │
        │  avatar ─► (tabs)/more     │  + 添加 ─► [Add-acct modal]  │ 趋势图 ─► trends
        │            (我的)          │  目标资产 ─► [Goal modal→app_meta]
        │  row tap                   │  row tap ─► [Edit-acct modal]│
        ▼                            │        │ 调整余额 ─► transaction/adjust
  transaction/[id] (Detail)         │        │ 删除 (guarded)
        │  card row ─► transaction/edit/[id] │
        │  所属预算/计划 ─► [budget sheet]     │  账户转账 ─► transaction/transfer
        │  删除 (confirm) ─► back           │                (2× balance_adjustment)
        │
   [ + FAB ] ─► transaction/new (Add, modal)
                    │ 确定 ─► createTransaction ─► back
                    │ + / − keys ─► real calculator arithmetic
                    │ date ▼ ─► DatePickerModal
                    └ 添加子类 ─► categories/add?parentId (name + icon)

  (tabs)/more (我的)
     ├ 全部账单 ─► (tabs)/transactions ── rows ─► transaction/[id]
     ├ 账户管理 ─► accounts
     ├ 分类管理 ─► categories ── + 添加自定义 ─► categories/add (type + icon)
     ├ 导出数据 ─► import-export
     ├ 导入数据 ─► import-export
     ├ 关于应用 ─► about
     └ 隐私政策 ─► privacy

```

---

## 5. Intentional limits

- The Home month label is display-only; adjacent arrows are the month controls.
- The no-budget illustration is intentionally illustrative until the user creates a real budget.
- Final release acceptance still requires native-device visual, keyboard, safe-area, migration,
  restore, and accessibility walkthroughs.
