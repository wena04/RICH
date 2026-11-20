import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { backspaceAmount, pressAmountKey } from '../utils/amountInput';

const type = (keys: string) => [...keys].reduce(pressAmountKey, '');

describe('amount keypad', () => {
  it('builds amounts', () => {
    assert.equal(type('1250'), '1250');
    assert.equal(type('12.5'), '12.5');
    assert.equal(type('.5'), '0.5');
    assert.equal(type('007'), '7');
  });
  it('limits decimals and length', () => {
    assert.equal(type('1.234'), '1.23');
    assert.equal(type('1..2'), '1.2');
    assert.equal(type('1234567890'), '123456789');
  });
  it('deletes the last key', () => {
    assert.equal(backspaceAmount('12.5'), '12.');
    assert.equal(backspaceAmount(''), '');
  });
});
