export function centsToCurrencyString(amountCents: number): string {
  const sign = amountCents < 0 ? "-" : "";
  const abs = Math.abs(amountCents);
  const major = Math.floor(abs / 100);
  const minor = String(abs % 100).padStart(2, "0");
  return `${sign}${major}.${minor}`;
}

// Alias for yuan formatting (same as centsToCurrencyString)
export const centsToYuan = centsToCurrencyString;

export function parseCurrencyToCents(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  // Accept: 12, 12.3, 12.34, -12.34
  if (!/^-?\d+(\.\d{1,2})?$/.test(v)) return null;
  const negative = v.startsWith("-");
  const [majorStr, minorStrRaw = ""] = v.replace("-", "").split(".");
  const major = Number(majorStr);
  const minor = Number((minorStrRaw + "00").slice(0, 2));
  const cents = major * 100 + minor;
  return negative ? -cents : cents;
}
