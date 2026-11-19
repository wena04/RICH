import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { moveItem } from '../features/budgets/order';

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
