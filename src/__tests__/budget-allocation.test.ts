import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  effectiveCategoryLimitCents,
  sumChildLimitsCents,
  unallocatedCategoryLimitCents,
  unallocatedCategorySpentCents,
} from '../features/budgets/allocation';

describe('hierarchical budget allocation', () => {
  it('does not add child allocations on top of the parent envelope', () => {
    assert.equal(effectiveCategoryLimitCents(100_000, [30_000, 20_000]), 100_000);
  });

  it('supports a child-only budget by deriving the parent envelope', () => {
    assert.equal(effectiveCategoryLimitCents(null, [30_000, 20_000]), 50_000);
  });

  it('raises the effective parent when child allocations exceed it', () => {
    assert.equal(effectiveCategoryLimitCents(40_000, [30_000, 20_000]), 50_000);
  });

  it('shows the unallocated part of a parent envelope', () => {
    assert.equal(unallocatedCategoryLimitCents(100_000, [30_000, 20_000]), 50_000);
  });

  it('never lets malformed negative limits reduce the allocation', () => {
    assert.equal(sumChildLimitsCents([30_000, -10_000]), 30_000);
    assert.equal(unallocatedCategoryLimitCents(20_000, [30_000]), 0);
  });

  it('keeps uncategorized and unbudgeted-child spending visible', () => {
    assert.equal(unallocatedCategorySpentCents(80_000, [30_000, 20_000]), 30_000);
  });

  it('never reports negative unallocated spending for inconsistent data', () => {
    assert.equal(unallocatedCategorySpentCents(20_000, [30_000]), 0);
  });
});
