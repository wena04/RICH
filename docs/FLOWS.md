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
| `transaction/[id]` | default | headerShown: false. Detail. |
| `transaction/edit/[id]` | default (header, title "编辑") | Edit form. |
| `categories/add` | default | headerShown: false. Icon picker for custom categories. |
| `budget/edit` | default | headerShown: false. Budget editor. |
| `transaction/new` | **modal**, title "Add transaction" | Add screen. |

**Routable but not explicitly listed in the stack** (expo-router auto-registers the
files; they render with the default native header): `accounts`, `categories`,
`import-export`, `transaction/adjust`, `transaction/transfer`.

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
| Calendar day cell tap | Sets `selectedDate` + toggles `filterDate` — **filters the list to that day**. Tap same day again to clear. |
| "查看全部" pill (when filtered) | Clears `filterDate` — shows full month again. |
| Transaction row tap | `router.push('/transaction/${t.id}')` → Detail. |
| "总支出 / 总收入" totals | Display only. |

Note: day-tap filtering is active — the list shows only the selected day when a filter is set.

### 预算/计划 tab — `app/(tabs)/charts.tsx`
| Element | Trigger → Result |
|---|---|
| Month ‹ / › | `setMonth(addMonths(m, ±1))` — reloads budget summary for that month. |
| 计划清单 card (left) | Shows total budget limit when set; `¥ 0.00` when empty. |
| 结余 row | Display only. Shows real current-month (income − expense). |
| 趋势图 row (right, with mini donut) | `router.push('/trends')` → 趋势图 screen. |
| Empty-state donut + legend | **Illustrative/hardcoded** when no budget exists. |
| **+ 创建预算** button | `router.push('/budget/edit?period=…')` → budget editor. |
| Filled state: category rows | Progress bars per category (spent vs limit). Real data. |
| **设置分类预算** button | `router.push('/budget/edit?period=…')` → budget editor. |

### 趋势图 — `app/trends.tsx`
| Element | Trigger → Result |
|---|---|
| Back chevron | `router.back()`. |
| Month ‹ / › | `setMonth(addMonths(m, ±1))` — reloads aggregations for that month. Real. |
| Category legend row tap | `setSelectedCategoryId(...)` → reveals the 子分类明细 drill-down card below (real data). |
| Pie chart / line chart | Display (real aggregations from DB). |
Fully wired to real data; no dead buttons here.

### Add — `app/transaction/new.tsx`
| Element | Trigger → Result |
|---|---|
| Back chevron | `router.back()` (dismisses modal). |
| 支出 / 收入 toggle | `setType('expense' | 'income')`. Real. (No 余额调整 option here — that lives only in the edit screen.) |
| Date button ("6月30日 ▼") | Opens `DatePickerModal` — pick any date. Real. |
| Category tile tap | `onSelectCategory(name)` → selects it + loads subcategories from DB. |
| **管理分类** green tile | `router.push('/categories')` → category management. |
| Subcategory tile tap | `setSelectedSubId(...)` (toggle). |
| **+ 添加 (add subcategory)** tile | Opens cross-platform Modal → `ensureSubcategory` on save. Works on all platforms. |
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
| **所属预算/计划** row | Shows `¥spent / ¥limit` for that category's monthly budget, or 未设置. Tap → `/budget/edit?period=…`. |
| Delete button (删除该笔…) | `Alert.alert` confirm → `deleteTransaction` → `router.back()`. Real. |

### Edit — `app/transaction/edit/[id].tsx`
Text-input based form (not the numpad UI).
| Element | Trigger → Result |
|---|---|
| Segment: 支出 / 收入 / **余额调整** | `setType(...)`. This is the only place 余额调整 is user-selectable as a type. |
| 金额 / 日期 / 分类 / 子分类 / 备注 | TextInputs. Category/sub are free-text names (`ensureCategory`/`ensureSubcategory` on save). |
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
Reached from 资产管理's 账户转账 button.
| Element | Trigger → Result |
|---|---|
| Back chevron | `router.back()`. |
| Date pill ("今天 ▼") | **No-op** (decorative; transfer is dated today). |
| 选择转出账户 / 选择转入账户 selectors | Toggle inline dropdowns; tapping an option sets `fromId` / `toId`. Real. |
| Numpad + backspace + "." | Edit the transfer amount. Real. |
| **+ / − operator keys** | **Static/decorative** here — rendered as plain `<View>`s with no press handler (no arithmetic on the transfer screen). |
| Note field | Optional; defaults to `转账 {from} → {to}`. |
| **确定** | `onConfirm()` → creates **two `balance_adjustment` transactions** (−X on source, +X on destination) → `router.back()`. Disabled unless amount>0 and from≠to. Real. |

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
| Category row / caret | `toggleExpand` → shows subcategories + inline "添加子分类..." input. |
| Category "⋯" menu | `openEditCategory` → Edit-category modal (rename / delete). |
| Subcategory row | `openEditSubcategory` → Edit-subcategory modal. |
| Inline "添加子分类..." + plus-circle | `onCreateSubcategory`. Real. |
| **+ 添加自定义** (bottom) | Opens Add-category modal. 保存 → `createCategory`. **Name only — no icon picker.** |
| Edit modals delete | Guarded by `canDelete…` then confirm. Real. |

**No icon picker anywhere.** The mockup's "添加自定义类目" with icon selection is
name-only in code; all icons come from a fixed `CATEGORY_ICONS` lookup, so
user-created categories always render the fallback `tag` icon.

### 我的 (More) — `app/(tabs)/more.tsx`
Reached via the home avatar. Not a visible tab.
| Menu item | Trigger → Result |
|---|---|
| 账户管理 | `router.push('/accounts')`. |
| 分类管理 | `router.push('/categories')`. |
| 导出数据 | `router.push('/import-export')`. |
| 导入数据 | `router.push('/import-export')` (same screen). |
| 关于应用 | `onPress={() => {}}` — **no-op.** |
| 隐私政策 | `onPress={() => {}}` — **no-op.** |

### 导入/导出 (Import/Export) — `app/import-export.tsx`
English-labeled, unstyled utility screen. All buttons real:
CSV v1 import (needs target account) / export, CSV v2 export, DB file export/import
(with overwrite confirm). Uses system share sheet + document picker.

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
        │  所属预算/计划 ─► ⚠ Alert "即将推出" │  账户转账 ─► transaction/transfer
        │  删除 (confirm) ─► back           │                (2× balance_adjustment)
        │
   [ + FAB ] ─► transaction/new (Add, modal)
                    │ 确定 ─► createTransaction ─► back
                    │ + / − keys ─► real calculator arithmetic
                    │ date ▼ ─► no-op
                    └ + 添加子类 ─► iOS Alert.prompt only

  (tabs)/more (我的)
     ├ 账户管理 ─► accounts
     ├ 分类管理 ─► categories ── + 添加自定义 ─► [Add-cat modal] (name only, no icon)
     ├ 导出数据 ─► import-export
     ├ 导入数据 ─► import-export
     ├ 关于应用 ─► no-op
     └ 隐私政策 ─► no-op

  ORPHAN (routable, no UI entry point):
     (tabs)/transactions ── rows ─► transaction/[id], "Add" ─► transaction/new
```

---

## 5. Placeholders / dead-ends / missing wiring

**Placeholder alerts ("即将推出"):**
1. 预算/计划 → **+ 创建预算** → alert. The entire budget-creation flow is missing.
2. Detail → **所属预算/计划** row → alert. No budget/plan linkage exists.

**No-op buttons (Pressable with empty/absent onPress, or non-interactive view):**
3. Home **month pill** "6月 ▼" — no handler; month is hardcoded to current.
4. Add screen **date "▼"** — no handler; date fixed to today, no date picker.
5. Transfer screen **date pill "今天 ▼"** — decorative; no date picker.
6. Transfer screen **+ / − operator keys** — plain `<View>`s, no handler (no arithmetic here).
7. More → **关于应用** and **隐私政策** — `onPress={() => {}}`.

**Partially wired / state-only:**
8. Home **calendar day tap** sets `selectedDate` but nothing reads it — no filtering/nav.
9. 预算/计划 **计划清单 ¥0.00** and the empty-state donut/legend are hardcoded, not data.

**Platform-gated (silently absent on Android):**
10. Add screen **+ 添加子类** subcategory prompt — iOS `Alert.prompt` only; not rendered on Android.

**In mockup but not wired in code:**
11. **Icon picker** for 添加自定义类目 — categories are created name-only; no icon selection.
    User categories fall back to the `tag` icon.
12. **管理分类 green tile** on the Add screen — not present; category management only via 我的.
13. **创建预算 flow / budget screens** — do not exist (alert only).
14. **所属预算/计划 linkage** on transactions — no data model wiring, alert only.

**Reachable in code but no UI entry point (orphan):**
15. `app/(tabs)/transactions.tsx` — a full working transaction list (`href: null`, hidden
    tab). No button navigates to it; home uses its own inline list instead.

**Recently closed gaps (now working):**
- **账户转账** — real screen at `app/transaction/transfer.tsx`, reached from 资产管理; creates
  two `balance_adjustment` entries.
- **目标资产** — persisted in `app_meta`, edited via a cross-platform Modal (no longer iOS-only).
- **Add-screen +/− numpad keys** — real calculator arithmetic (no longer both clear).
- **`components/TabBar.tsx`** — deleted (was a dead duplicate of `CustomTabBar`).

---

## 6. "To make the app feel whole" punch list (by impact)

1. **Wire the date picker** (Add-screen date "▼", Home month pill, Transfer date pill).
   Right now you can only ever record for *today* and only view the current month —
   highest-friction gap.
2. **Make the calendar day tap filter the list** (or navigate to that day). It looks
   interactive but does nothing.
3. **Build the 创建预算 flow** and turn 计划清单 / the empty-state donut into real data;
   then wire Detail's 所属预算/计划 to actual budgets. (Two alerts collapse into one feature.)
4. **Add an icon picker** to 添加自定义类目 so user categories aren't stuck on the `tag` icon.
5. **Give Android a subcategory-add path** on the Add screen (the iOS-only prompt makes the
   "+ 添加子类" tile invisible on Android).
6. **Wire 关于应用 / 隐私政策** (even to a simple static screen or the existing docs).
7. **Resolve the orphan:** either surface `(tabs)/transactions` (e.g. a "全部账单" entry)
   or delete it.
8. **Tidy the Transfer numpad:** its +/− keys are dead views — either remove them or give
   them the same real arithmetic the Add screen now has, for consistency.
