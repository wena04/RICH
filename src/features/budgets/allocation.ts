/**
 * A parent category is the envelope. Child limits allocate parts of that
 * envelope; they must never be added on top of it and double-counted.
 */
export function sumChildLimitsCents(childLimitsCents: readonly number[]): number {
  return childLimitsCents.reduce((total, limit) => total + Math.max(0, limit), 0);
}

export function effectiveCategoryLimitCents(
  parentLimitCents: number | null | undefined,
  childLimitsCents: readonly number[],
): number {
  return Math.max(Math.max(0, parentLimitCents ?? 0), sumChildLimitsCents(childLimitsCents));
}

export function unallocatedCategoryLimitCents(
  parentLimitCents: number,
  childLimitsCents: readonly number[],
): number {
  return Math.max(parentLimitCents - sumChildLimitsCents(childLimitsCents), 0);
}
