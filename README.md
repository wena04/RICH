# Rich记账 MVP

Personal finance iOS app inspired by "RICH 记账" — offline-first, privacy-focused.

<img src="https://img.shields.io/badge/platform-iOS-lightgrey" alt="iOS"> <img src="https://img.shields.io/badge/storage-SQLite-blue" alt="SQLite"> <img src="https://img.shields.io/badge/privacy-local--only-green" alt="Privacy">

## Features

- **Calendar-first home** — Month view with daily transaction list
- **Amount-first entry** — Custom numpad, category icon grid
- **Category pie chart** — Visualize spending by category
- **Monthly trends** — Expense vs income over time
- **Accounts** — Cash, bank, credit, stored value, investment
- **Import/Export** — CSV (v1 legacy, v2 extended) + database file

## Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Framework  | React Native + Expo               |
| Language   | TypeScript                        |
| Database   | SQLite (local-only)               |
| Navigation | Expo Router                       |
| UI         | Custom (matching RICH app design) |

## Privacy

This app keeps your data **private by default**:

- ✓ No backend servers
- ✓ No cloud sync
- ✓ No analytics or tracking
- ✓ Data stays on-device unless you export

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo dev server
npm run start

# Run on iOS Simulator
npm run ios
```

> **Note**: This app uses `expo-sqlite` which requires iOS/Android. It does not work in the web browser.

## Project Structure

```
app/                    # Expo Router screens
├── (tabs)/             # Tab navigation (Home, Charts)
├── transaction/        # Add/edit transaction
├── accounts.tsx        # Account management
├── categories.tsx      # Category management
└── import-export.tsx   # Data portability

src/                    # Business logic
├── db/                 # SQLite + migrations
├── domain/             # TypeScript types
├── features/           # Charts, import/export
└── utils/              # Helpers

docs/                   # Documentation
├── REQUIREMENTS.md     # Goals, scope, acceptance criteria
├── PRODUCT.md          # UX design, screens, flows
├── TECHNICAL.md        # Architecture, data model, formats
└── PROGRESS.md         # Implementation status
```

## Sample Data

The app automatically seeds **37 demo transactions** on first run, so you can explore all features immediately.

Demo data includes:

- 3 accounts (现金, Chase, 微信)
- 8 categories with subcategories (餐饮 → 早餐/午餐/晚餐/外卖/咖啡/聚餐, etc.)
- Transactions spanning the last 30 days with subcategory tags

Additional sample CSV for testing imports: `data/sample.csv`

## Design Workflow

We use a **mockup-first workflow** to match the original RICH app pixel-by-pixel:

1. Open `docs/mockups.html` in any browser (no build step)
2. Compare mockups against original screenshots
3. Port designs to React Native code

See [PROGRESS.md](docs/PROGRESS.md) for current design-fidelity status.

## Data Safety

Your real finance data must **NOT** be committed to git.

The `.gitignore` protects against accidental commits:

- All CSV files except `data/sample.csv`
- SQLite databases (`.db`, `.sqlite`)
- Export/backup files

## Documentation

| Doc                                     | Description                          |
| --------------------------------------- | ------------------------------------ |
| [REQUIREMENTS.md](docs/REQUIREMENTS.md) | Goals, scope, acceptance criteria    |
| [PRODUCT.md](docs/PRODUCT.md)           | UX design, screens, navigation       |
| [TECHNICAL.md](docs/TECHNICAL.md)       | Architecture, data model, formats    |
| [PROGRESS.md](docs/PROGRESS.md)         | Implementation status & future plans |
| [mockups.html](docs/mockups.html)       | Visual mockups (open in browser)     |

## License

MIT
