/**
 * Returns a copy of `items` with the item at `index` moved by `delta` places
 * (clamped to the list). Used by the budget list's sort mode.
 */
export function moveItem<T>(items: readonly T[], index: number, delta: number): T[] {
  const next = items.slice();
  if (index < 0 || index >= next.length) return next;
  const target = Math.max(0, Math.min(next.length - 1, index + delta));
  if (target === index) return next;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}
