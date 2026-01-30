# Security Policy

This is a personal, offline-first finance app MVP. The primary security goal is **privacy by default**: your finance data stays on your device unless you explicitly export it.

## Threat model (MVP)

### In scope

- **Local device compromise**:
  - Lost/stolen phone
  - Malware on device
  - Untrusted physical access
- **Accidental data leakage**:
  - Committing real CSV exports/backups to git
  - Sharing exported backups insecurely
- **App-level bugs**:
  - Incorrect import parsing causing data loss
  - Incorrect aggregation causing misleading charts

### Out of scope

- Network-based attacks against backend services (there is no backend).
- Account takeover / authentication threats (single-user, local-only).

## What data is stored

Stored locally in SQLite:

- Transactions (amount, date, type, category/subcategory where applicable, account, optional note)
- Categories and subcategories (user-defined)
- Accounts (user-defined)
- Asset goals (visualization-only)

## What is intentionally NOT collected

- No analytics or tracking
- No crash reporting that uploads data
- No advertising identifiers
- No cloud sync
- No server-side logs (no servers)

## Backup/export risks and your responsibility

Exports contain sensitive information.

- **CSV exports** and **database file exports** may reveal spending patterns, merchants, locations (via notes), and other personal details.
- Store exports only in places you trust (ideally encrypted).
- Be careful when sharing files or screenshots.

This repository includes a `.gitignore` that is designed to prevent accidental commits of finance data, but you should still verify `git status` before committing.

## Reporting a vulnerability

If you discover a security issue:

- Prefer reporting privately using **GitHub Security Advisories** for this repository.
- If that’s not possible, open an issue with **no sensitive details** (no real data, no reproduction steps that expose private information) and request a private contact channel.

