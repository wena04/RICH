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

/**
 * Spending outside the explicitly budgeted children still belongs to the
 * parent envelope. This includes transactions without a subcategory and
 * transactions assigned to a child that has no child-level budget.
 */
export function unallocatedCategorySpentCents(
  parentSpentCents: number,
  budgetedChildSpentCents: readonly number[],
): number {
  const budgetedChildSpent = budgetedChildSpentCents.reduce(
    (total, spent) => total + Math.max(0, spent),
    0,
  );
  return Math.max(parentSpentCents - budgetedChildSpent, 0);
}
