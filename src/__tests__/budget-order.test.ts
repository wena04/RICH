import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { moveItem, targetIndexForDrag } from '../features/budgets/order';

describe('budget sort order', () => {
  const list = ['基本开支', '网购预算', '旅游出行', '兴趣爱好'];

  it('moves an item up or down by one place', () => {
    assert.deepEqual(moveItem(list, 2, -1), ['基本开支', '旅游出行', '网购预算', '兴趣爱好']);
    assert.deepEqual(moveItem(list, 0, 1), ['网购预算', '基本开支', '旅游出行', '兴趣爱好']);
  });

  it('clamps moves at either end and never mutates the input', () => {
    assert.deepEqual(moveItem(list, 0, -1), list);
    assert.deepEqual(moveItem(list, 3, 5), list);
    assert.deepEqual(moveItem(list, 9, 1), list);
    assert.deepEqual(list, ['基本开支', '网购预算', '旅游出行', '兴趣爱好']);
  });
});

describe('targetIndexForDrag', () => {
  const rows = [68, 68, 68, 68];
  it('stays put until the row passes a neighbour’s midpoint', () => {
    assert.equal(targetIndexForDrag(rows, 0, 0), 0);
    assert.equal(targetIndexForDrag(rows, 0, 33), 0);
    assert.equal(targetIndexForDrag(rows, 0, 35), 1);
    assert.equal(targetIndexForDrag(rows, 0, 140), 2);
  });
  it('moves up and clamps at both ends', () => {
    assert.equal(targetIndexForDrag(rows, 3, -35), 2);
    assert.equal(targetIndexForDrag(rows, 3, -1000), 0);
    assert.equal(targetIndexForDrag(rows, 1, 1000), 3);
  });
  it('handles rows of different heights', () => {
    // Row 1 is tall: the dragged row's bottom edge must pass its midpoint (at 40 + 60 = 100).
    assert.equal(targetIndexForDrag([40, 120, 40], 0, 55), 0);
    assert.equal(targetIndexForDrag([40, 120, 40], 0, 65), 1);
  });
  it('does nothing until every row is measured', () => {
    assert.equal(targetIndexForDrag([68, 0, 68], 0, 200), 0);
  });
});
