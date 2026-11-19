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

/**
 * Where a dragged row lands. A row below swaps once the dragged row's bottom edge passes its
 * midpoint, a row above once the top edge does — so a half-row drag moves one place. `heights`
 * are the rows' measured heights in list order; until every row is measured nothing moves.
 */
export function targetIndexForDrag(heights: readonly number[], from: number, translationY: number): number {
  if (from < 0 || from >= heights.length || heights.some((h) => !(h > 0))) return from;
  const tops: number[] = [];
  let y = 0;
  for (const h of heights) {
    tops.push(y);
    y += h;
  }
  const top = tops[from] + translationY;
  const bottom = top + heights[from];
  let index = from;
  heights.forEach((h, i) => {
    const middle = tops[i] + h / 2;
    if (i > from && bottom > middle) index += 1;
    if (i < from && top < middle) index -= 1;
  });
  return index;
}
