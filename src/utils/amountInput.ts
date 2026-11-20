/**
 * Typing an amount on a digit keypad: `current` is what the person has typed so far ('' = nothing,
 * shown as ¥0.00). At most 9 digits before the point and 2 after; a leading point becomes "0.".
 */
export function pressAmountKey(current: string, key: string): string {
  if (key === '.') {
    if (current.includes('.')) return current;
    return current === '' ? '0.' : `${current}.`;
  }
  if (!/^\d$/.test(key)) return current;
  const [whole, fraction] = current.split('.');
  if (fraction !== undefined) return fraction.length >= 2 ? current : current + key;
  if (whole === '0') return key; // no leading zeros
  if (whole.length >= 9) return current;
  return current + key;
}

export function backspaceAmount(current: string): string {
  return current.slice(0, -1);
}
