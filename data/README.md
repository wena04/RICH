# Data folder

This folder is for **local data and samples** used during development.

## Critical privacy rule

- **Do not commit real personal finance data.**
- Your real exports/backups should live **only on your machine** (or in your own encrypted storage), never in git.

## What is committed

- `sample.csv`: a **privacy-safe** fake dataset that matches **CSV v1** exactly and can be used for demo/testing.

## What must stay local-only (never commit)

- Any real CSV exports (even if “anonymized”)
- Any database files (SQLite `.db`, `.sqlite`, `.sqlite3`, plus `-wal` / `-shm`)
- Any exports or backups you generate for migration

The repository `.gitignore` is configured to be safe-by-default, but you should still review `git status` before committing.

