import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import { centsToCurrencyString, parseCurrencyToCents } from '../utils/money';

describe('centsToCurrencyString', () => {
  it('formats whole yuan with two decimal places', () => {
    assert.equal(centsToCurrencyString(1200), '12.00');
  });

  it('preserves both decimal digits', () => {
    assert.equal(centsToCurrencyString(1234), '12.34');
  });

  it('left-pads the minor units when below ten cents', () => {
    assert.equal(centsToCurrencyString(1205), '12.05');
  });

  it('renders zero as 0.00', () => {
    assert.equal(centsToCurrencyString(0), '0.00');
  });

  it('renders negative cents with a leading minus', () => {
    assert.equal(centsToCurrencyString(-1234), '-12.34');
  });
});

describe('parseCurrencyToCents', () => {
  it('parses whole-number strings', () => {
    assert.equal(parseCurrencyToCents('12'), 1200);
  });

  it('parses one-decimal strings', () => {
    assert.equal(parseCurrencyToCents('12.3'), 1230);
  });

  it('parses two-decimal strings', () => {
    assert.equal(parseCurrencyToCents('12.34'), 1234);
  });

  it('parses negative values', () => {
    assert.equal(parseCurrencyToCents('-12.34'), -1234);
  });

  it('rejects three-decimal strings', () => {
    assert.equal(parseCurrencyToCents('12.345'), null);
  });

  it('rejects non-numeric strings', () => {
    assert.equal(parseCurrencyToCents('abc'), null);
  });

  it('rejects empty strings', () => {
    assert.equal(parseCurrencyToCents(''), null);
  });
});

describe('money round-trip', () => {
  it('survives cents → string → cents', () => {
    const samples = [0, 1, 99, 100, 1234, 100000, -1, -1234];
    for (const cents of samples) {
      const str = centsToCurrencyString(cents);
      assert.equal(parseCurrencyToCents(str), cents, `roundtrip failed for ${cents}`);
    }
  });
});
