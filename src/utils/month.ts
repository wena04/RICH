export function currentMonth(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function monthStartIso(month: string): string {
  // month: YYYY-MM
  return `${month}-01`;
}

export function addMonths(month: string, delta: number): string {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) throw new Error('Invalid month');
  const year = Number(m[1]);
  const mon = Number(m[2]) - 1;
  const d = new Date(year, mon + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function nextMonth(month: string): string {
  return addMonths(month, 1);
}

