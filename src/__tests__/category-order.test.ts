import assert from 'node:assert/strict';
import test from 'node:test';

import { sortCategoriesForDisplay } from '../domain/categories';

const names = (list: { name: string }[]) => list.map((c) => c.name);

test('starter categories keep the original order, then the rest by name', () => {
  const shuffled = [{ name: '自定义乙' }, { name: '交通' }, { name: '自定义甲' }, { name: '餐饮' }, { name: '衣服' }];
  assert.deepEqual(names(sortCategoriesForDisplay(shuffled, 'expense')), ['餐饮', '衣服', '交通', '自定义甲', '自定义乙']);
});

test("income uses the income starters' order; 'all' puts expense starters first", () => {
  const mixed = [{ name: '奖金' }, { name: '工资' }, { name: '交通' }];
  assert.deepEqual(names(sortCategoriesForDisplay(mixed, 'income')), ['工资', '奖金', '交通']);
  assert.deepEqual(names(sortCategoriesForDisplay(mixed, 'all')), ['交通', '工资', '奖金']);
});

test('sorting does not change the input', () => {
  const input = [{ name: '交通' }, { name: '餐饮' }];
  sortCategoriesForDisplay(input);
  assert.deepEqual(names(input), ['交通', '餐饮']);
});
