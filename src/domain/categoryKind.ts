import type { CategoryKind } from './types';

/** A category used on both ledger sides must remain selectable on both. */
export function mergeCategoryKinds(
  existing: CategoryKind,
  incoming: CategoryKind,
): CategoryKind {
  return existing === incoming ? existing : 'both';
}
