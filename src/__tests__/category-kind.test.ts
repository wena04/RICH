import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { mergeCategoryKinds } from '../domain/categoryKind';

describe('category kind reconciliation', () => {
  it('keeps a category on its existing ledger side when the type agrees', () => {
    assert.equal(mergeCategoryKinds('expense', 'expense'), 'expense');
    assert.equal(mergeCategoryKinds('income', 'income'), 'income');
  });

  it('widens a mixed-use category so neither side is hidden', () => {
    assert.equal(mergeCategoryKinds('expense', 'income'), 'both');
    assert.equal(mergeCategoryKinds('income', 'expense'), 'both');
  });

  it('preserves explicit both-side visibility', () => {
    assert.equal(mergeCategoryKinds('both', 'expense'), 'both');
    assert.equal(mergeCategoryKinds('income', 'both'), 'both');
  });
});
