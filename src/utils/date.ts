export function isoDateToday(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isIsoDate(value: string): boolean {
  // Basic validation for MVP; further validation can be added if needed.
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function legacyDateToIso(value: string): string | null {
  // v1 CSV legacy format: YYYY/MM/DD
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function isoDateToLegacy(value: string): string | null {
  // v1 CSV legacy format: YYYY/MM/DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  return `${m[1]}/${m[2]}/${m[3]}`;
}

