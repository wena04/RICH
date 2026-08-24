# RICH 记账

Offline-first personal finance app for iPhone, built with React Native and Expo. RICH 记账 keeps the
ledger in local SQLite and focuses on fast entry, clear category hierarchy, and user-controlled
backup and restore.

<img src="https://img.shields.io/badge/platform-iOS-lightgrey" alt="iOS"> <img src="https://img.shields.io/badge/Expo-SDK%2054-black" alt="Expo SDK 54"> <img src="https://img.shields.io/badge/privacy-local--only-green" alt="Privacy">

## Highlights

- Calendar-first home with daily and monthly expense/income totals.
- Amount-first expense and income entry with a custom calculator keypad.
- Typed categories (`expense`, `income`, or `both`) and expandable subcategories.
- Student-friendly starter taxonomy, including practical subcategories for food, transport,
  learning, housing, entertainment, subscriptions, health, and travel.
- Hierarchical monthly budgets: parent category envelopes, child allocations, real transaction
  spend, progress thresholds, and visible unallocated remainder without double counting.
- Accounts, balance adjustments, target-asset progress, and atomic two-sided transfers.
- Polished transaction detail and edit flows for amount, date, type, category path, account, and note.
- CSV v1/v2 portability plus full SQLite database backup and restore.

## First run and privacy

A fresh install starts with a clean ledger: **no fake balances and no demo transactions**. The app
creates a local `现金` account and useful starter categories/subcategories so a student can record a
real first entry immediately. Deleted starter categories are not recreated on every launch.

- No backend, sign-in, analytics, ads, or automatic cloud sync.
- Finance data stays on-device unless the user explicitly exports it.
- Money is stored as integer cents and dates as local `YYYY-MM-DD` values.

## Tech stack

| Layer | Technology |
| --- | --- |
| App | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router |
| Storage | `expo-sqlite` |
| Charts | `react-native-svg` |
| Portability | PapaParse, Expo file/document/sharing APIs |
| Tests | Node test runner + `tsx` |

## Run locally

```bash
npm install
npm run start
npm run ios
```

The production app targets iOS and Android. For a quick laptop preview, run `npm run web`; the web
SQLite layer is an Expo alpha feature, so final financial and interaction QA should still happen on
iOS or Android.

## Verification

Verified on August 12, 2026:

- TypeScript strict check passes: `npx tsc --noEmit`
- Category artwork stays source-controlled as individual SVGs: run `npm run icons:generate`
  after editing an icon, and `npm run icons:check` to verify the app registry and gallery.
- Unit suite passes: `npm test` — **37/37 tests**
- Expo production exports pass for iOS and Android
- Expo config, SDK dependency check, and `git diff --check` pass

Final release confidence still requires an on-device visual walkthrough and reference screenshots
across target iPhone sizes.

## Project map

```text
app/                    Expo Router screens and flows
components/             Shared UI and RICH visual components
src/db/                 SQLite schema, migrations, and repositories
src/domain/             Typed finance model and starter categories
src/features/           Budgets, charts, and import/export logic
src/__tests__/          Unit tests
docs/                   Product, technical, release, and research notes
```

## Documentation

| Document | Purpose |
| --- | --- |
| [Brand guide](docs/BRAND_GUIDE.md) | Canonical identity, naming, voice, logo, color, type, and marketing rules |
| [Product](docs/PRODUCT.md) | Current UX and product rules |
| [Features](docs/FEATURES.md) | Implemented surface, data model, and routes |
| [Technical](docs/TECHNICAL.md) | Architecture and data formats |
| [Components](docs/COMPONENTS.md) | Shared visual/component contracts |
| [Flows](docs/FLOWS.md) | End-to-end navigation and persistence flows |
| [Progress](docs/PROGRESS.md) | Verification and remaining work |
| [Apple release guide](docs/APPLE_RELEASE_2026.md) | 2026 App Store readiness and submission plan |
| [Competitive research](docs/COMPETITIVE_RESEARCH_2026.md) | Current Chinese-market product research |

## Data safety

Do not commit real finance data. The repository ignores CSV exports, SQLite databases, and backup
files, except for the non-sensitive `data/sample.csv` import fixture.

## License

MIT
