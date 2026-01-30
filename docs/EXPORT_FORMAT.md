# Export format (CSV)

This app supports CSV export/import for portability, backups, and phone migration.

Important:

- Examples in this document use **fake data only**.
- Real personal finance CSV files must never be committed to git.

## General rules

- File encoding: UTF-8 (import should accept UTF-8 with or without BOM)
- Newline: `\n`
- Header row: required
- Amount:
  - CSV uses a decimal string with **2 fractional digits** (e.g., `12.34`).
  - The database stores money as integer cents; conversion occurs at import/export.

## CSV v1 (compatible)

CSV v1 is the baseline **legacy** format intended to be compatible with existing data exports (e.g. `record.csv`).

Characteristics:

- **Chinese headers**
- **No account column**
- **No subcategory column**
- Supports **expense/income only** (does not represent `balance_adjustment`)

### Columns (exact order)

1. `日期` (required) — `YYYY/MM/DD`
2. `收支类型` (required) — `支出` | `收入`
3. `类别` (required)
4. `金额` (required) — decimal string (2 dp)
5. `配注` (optional) — free text note

### Example header

```csv
日期,收支类型,类别,金额,配注
```

### Example rows (fake data)

```csv
2026/01/02,支出,餐饮,12.80,"Morning latte"
2026/01/03,支出,交通,6.20,"Metro ride"
2026/01/05,收入,兼职外快,120.00,"Side gig"
2026/01/08,支出,汽车/加油,35.00,"Fuel"
```

### v1 import rules

- The importer maps values:
  - `收支类型=支出` → internal `type=expense`
  - `收支类型=收入` → internal `type=income`
- Because v1 has **no account column**, import requires an **import target account**:
  - The user selects an account during import, and all imported rows are assigned to it, OR
  - The app uses a predefined default (e.g., last-used) and clearly displays it before import.
- Because v1 has **no subcategory column**, imported transactions set `subcategory` to null.
- Create missing categories as needed (categories are user-configurable).
- Validate safely:
  - Reject malformed dates (expected `YYYY/MM/DD`).
  - Reject invalid amounts.
  - Enforce the app note limit (≤ 100 characters) by rejecting over-limit values (preferred for MVP).

### v1 export rules

To preserve compatibility, v1 export should include only **expense** and **income** transactions, because `balance_adjustment` is not representable in v1.

## CSV v2 (optional extended export)

CSV v2 is an optional extended format that includes stable identifiers to improve round-trip behavior and reduce ambiguity when names change.

### Columns (exact order)

1. `date` (required)
2. `type` (required)
3. `amount` (required)
4. `account` (required)
5. `account_id` (optional; stable internal ID)
6. `category` (required for `expense`/`income`; empty for `balance_adjustment`)
7. `category_id` (optional)
8. `subcategory` (optional)
9. `subcategory_id` (optional)
10. `note` (optional; max 100)

### Example header

```csv
date,type,amount,account,account_id,category,category_id,subcategory,subcategory_id,note
```

### Example rows (fake data)

```csv
2026-01-02,expense,12.80,Cash,acc_cash,Food,cat_food,Coffee,sub_coffee,"Morning latte"
2026-01-05,income,3000.00,Bank,acc_bank,Salary,cat_salary,,, "Monthly salary"
2026-01-10,balance_adjustment,-25.00,Bank,acc_bank,,,,,,"Correction after bank statement"
```

### v2 notes

- v2 remains user-controlled and local-only.
- If IDs are missing, import can fall back to name matching.
- v2 does not introduce new product features; it only improves portability.

## Database file export/import

In addition to CSV, the app supports exporting and importing the SQLite database file for:

- Full-fidelity backup
- Fast phone migration without CSV parsing/round-trip ambiguity

Because the database file contains sensitive data, the app should clearly warn users to store it securely.
