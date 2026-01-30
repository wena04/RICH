# Redacted references

Use this folder for **privacy-safe**, **non-sensitive** reference notes.

## Screenshots (local-only reference)

The `screenshots/` folder contains UI screenshots of the original “RICH 记账” app provided for **personal reference**.

- **Do not commit these screenshots** to a public repository unless you have the rights to do so.
- Even when screenshots look “generic”, they can contain identifying context (names, amounts, dates).

This repo’s `.gitignore` ignores `docs/reference/rich-screens/**/screenshots/` by default to prevent accidental commits.

### File index

- `screenshots/01-home-calendar.png`: Home month calendar + daily transaction list
- `screenshots/02-expense-edit.png`: Expense edit + delete action + “belongs to budget/plan”
- `screenshots/03-add-expense-amount-first.png`: Amount-first add flow (expense/income tabs, category grid, account + note)
- `screenshots/04-assets-accounts.png`: Asset management overview (goal, total assets, account groups) + transfer entry
- `screenshots/05-budget-plan-empty.png`: Budget/plan landing (empty state) + trend/pie placeholders
- `screenshots/06-assets-accounts-scroll.png`: Asset management (scroll state; grouped accounts)
- `screenshots/07-account-balance-history.png`: Account balance update history view
- `screenshots/08-update-balance-keypad.png`: Update balance keypad flow (shows “balance decreases” indicator)
- `screenshots/09-set-asset-goal.png`: Set target asset goal (milestone)
- `screenshots/10-profile-export-reminder.png`: Profile (“Mine”) page (export data, reminders, help, privacy policy)
- `screenshots/11-category-customize-list.png`: Category customization list + add custom
- `screenshots/12-add-custom-category.png`: Add custom category (icon selection, name limit shown)

## Analysis

See `SCREENSHOT_NOTES.md` for detailed observations and `FEATURE_GAP_ANALYSIS.md` for differences vs the MVP plan.

Allowed:

- Text descriptions of flows (e.g., “amount-first entry: amount → category → account”)
- Redacted UI notes without personal data

Not allowed:

- Real transactions
- Real merchant names tied to your personal history
- Bank statements
- Photos/screenshots with identifying information
- Any CSV export containing real data

