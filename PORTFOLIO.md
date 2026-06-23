# Portfolio Entry

## Tech Stack Summary

| Category       | Technologies                                                      |
| -------------- | ----------------------------------------------------------------- |
| Languages      | TypeScript                                                        |
| Frontend       | React Native, Expo, Expo Router, React Navigation                 |
| Backend        | None (offline-first, local-only)                                  |
| Databases      | SQLite (expo-sqlite)                                              |
| ML/AI          | —                                                                 |
| Infrastructure | Expo (managed workflow), iOS Simulator                            |
| Testing        | React Test Renderer                                               |
| Tooling        | Metro Bundler, npm, PapaParse (CSV), react-native-svg (charting)  |

---

## Projects

### Rich记账 (Personal Finance App)

**Type**: Mobile App (iOS)

**Languages**: TypeScript

**Frameworks/Tools**:
- React Native + Expo (SDK 54)
- Expo Router (file-based navigation)
- expo-sqlite (local SQLite database)
- react-native-svg (pie/line charts)
- react-native-reanimated (animations)
- PapaParse (CSV import/export)
- expo-file-system, expo-document-picker, expo-sharing (file handling)

**Description**: Offline-first personal finance app for iPhone inspired by "RICH 记账". Features calendar-based transaction tracking, custom numpad for amount-first entry, category pie charts, monthly trends, subcategory drill-down, and CSV/database import/export for data portability.

**Key Skills**:
- Mobile app development with React Native + Expo
- Local-first architecture with SQLite
- Custom UI components (numpad, calendar grid, icon picker)
- Data visualization (pie charts, line charts, bar charts)
- File handling (CSV parsing, document picker, sharing)
- Database schema design and migrations
- Privacy-focused design (no backend, no analytics)
- Chinese-language UI localization
- Design-fidelity workflow (mockup-first development)

**Path**: `/` (root — this is a single-project repository)

**Notable Implementation Details**:
- Custom numeric keypad replacing system keyboard
- Amount-first transaction entry UX pattern
- Calendar-first home screen with continuous date bands for consecutive entries
- Inline subcategory selection expanding under category grid
- Two CSV export formats (v1 legacy Chinese, v2 extended)
- Database seeding with 37 demo transactions + subcategories
- Grouped account display by type (cash, bank, credit, etc.)
- Expandable category/subcategory management
- Mockup-first design workflow (`docs/mockups.html`)

**Future Features** (planned):
- 账户转账 (account transfer) as a third record type
- 目标资产 (savings goal) visualization
- 预算/计划 (budgets) with transaction linking

---

## Notes for Knowledge Base Integration

When adding this project to your knowledge base, remember to include:

- [ ] **Date/Quarter**: When you worked on this (e.g., Q2 2026)
- [ ] **Team Size**: Solo project or team? (Solo)
- [ ] **Outcome/Metrics**: App completion status, any user feedback
- [ ] **Links**: GitHub repo URL, demo video, App Store link (if published)
- [ ] **Tags**: `mobile`, `react-native`, `expo`, `typescript`, `sqlite`, `personal-finance`, `offline-first`, `ios`, `data-visualization`, `privacy`
