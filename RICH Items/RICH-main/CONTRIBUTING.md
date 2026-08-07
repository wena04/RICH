# Contributing

Contributions welcome if they remain **privacy-safe** and aligned with MVP scope.

## Privacy Rules

- **Never commit real finance data** — use `data/sample.csv` or synthetic data
- **No sensitive screenshots** — redact personal information
- **No telemetry** — analytics, tracking, ads, and cloud sync are explicit non-goals

## Project Scope

Scope is defined in:
- `docs/REQUIREMENTS.md` — Goals and acceptance criteria
- `docs/PRODUCT.md` — UX and screens
- `docs/TECHNICAL.md` — Architecture and data model

Changes outside scope should be documented as future ideas, not implemented.

## Code Structure

```
app/           # Expo Router screens
src/db/        # SQLite + migrations + repos
src/domain/    # TypeScript types
src/features/  # Charts, import/export
src/utils/     # Helpers
```

## Guidelines

- Keep domain logic separate from UI
- Validate all imports at the boundary layer
- Enforce data model invariants in code
- Use synthetic data in tests
- Exclude `balance_adjustment` from expense/income charts

## Adding Features

### New Chart
1. Define aggregation input/output
2. Implement deterministic query
3. Test with synthetic data

### New Category Behavior
1. Keep subcategories scoped to parent category
2. Each transaction has exactly one account
3. Enforce note ≤ 100 chars

## Documentation

Doc-only changes are welcome:
- Clarifying requirements
- Improving examples (fake data only)
- Tightening privacy practices
