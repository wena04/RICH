# Security Policy

Offline-first personal finance app. Primary goal: **privacy by default**.

## Threat Model

### In Scope
- **Device compromise**: Lost/stolen phone, malware, physical access
- **Data leakage**: Accidental git commits, insecure file sharing
- **App bugs**: Import parsing errors, incorrect aggregations

### Out of Scope
- Network attacks (no backend)
- Account takeover (no authentication)

## Data Storage

All data stored locally in SQLite:
- Transactions (amount, date, type, category, account, note)
- Categories and subcategories
- Accounts
- Asset goals

## Not Collected

- ✗ Analytics or tracking
- ✗ Crash reporting
- ✗ Advertising IDs
- ✗ Cloud sync
- ✗ Server logs

## Export Security

Exports contain sensitive information:
- Store in encrypted/trusted locations only
- Verify `git status` before commits
- `.gitignore` blocks common export patterns

## Reporting Vulnerabilities

1. Use **GitHub Security Advisories** (preferred)
2. Or open an issue with no sensitive details and request private contact
