/** Chart label formatting (kept free of React Native so tests can import it). */

export function monthTick(month: string): string {
  return `${Number(month.slice(5, 7))}月`;
}

export function monthTitle(month: string): string {
  return `${month.slice(0, 4)}年${Number(month.slice(5, 7))}月`;
}

/** Bar-top label: one decimal below ¥1,000, whole yuan below ¥10,000, then 万 (¥95.5, ¥8000, ¥1.2万). */
export function compactYuan(cents: number): string {
  const yuan = cents / 100;
  const trim = (value: number, digits: number) => String(Number(value.toFixed(digits)));
  if (Math.abs(yuan) < 1000) return `¥${trim(yuan, 1)}`;
  if (Math.abs(yuan) < 10000) return `¥${Math.round(yuan)}`;
  return `¥${trim(yuan / 10000, 1)}万`;
}
