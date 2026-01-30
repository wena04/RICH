# Contributing

This is a personal project, but contributions and suggestions are welcome as long as they remain **privacy-safe** and aligned with the MVP scope.

## Privacy-first contribution rules

- **Never commit real finance data**:
  - Do not add personal CSV exports, backups, or SQLite database files.
  - Use `data/sample.csv` or generate synthetic data only.
- **Never include sensitive screenshots**:
  - If you add references in `docs/reference/`, they must be redacted and contain no personal data.
- **Avoid “helpful” telemetry**:
  - Do not propose or add analytics, tracking, ads, or cloud sync (explicit non-goals for MVP).

## Project scope (MVP)

The MVP scope is defined in:

- `docs/REQUIREMENTS.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/EXPORT_FORMAT.md`

If you propose changes outside this scope, document them as a future idea rather than implementing them.

## Repo structure

- `docs/`: product, requirements, architecture, schema, and export format
- `data/`: privacy-safe sample data (committed) and local-only guidance
- `src/`: planned app source code location (not yet implemented)

## Code style (when implementation starts)

Expected tech direction:

- React Native + Expo
- SQLite local storage

Guidelines:

- Keep domain logic (transactions/categories/accounts) separate from UI components.
- Treat import/export as a boundary layer that must validate and sanitize inputs.
- Enforce invariants from `docs/DATA_MODEL.md` in code and tests.
- Prefer small, composable chart aggregation functions that are easy to test with synthetic data.

## How to add a new chart (guidance)

When adding a chart (within the existing visualization scope):

- **Define the aggregation input/output** clearly (time range, filters, grouping keys).
- **Implement a deterministic aggregation** from SQLite query results.
- **Use only synthetic data** in tests and examples.
- Ensure `balance_adjustment` remains excluded from expense/income charts as specified.

## How to add a new category/subcategory behavior (guidance)

- Ensure subcategories remain **scoped to a category**.
- Ensure each transaction still has **exactly one account**.
- Keep note length constraints (≤ 100 chars).

## Documentation changes

Documentation-only changes are very welcome:

- Clarifying acceptance criteria
- Improving import/export examples (fake data only)
- Tightening privacy rules and repository safety practices

