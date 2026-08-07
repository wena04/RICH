import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import {
  isIsoDate,
  isoDateToLegacy,
  legacyDateToIso,
  toIsoDate,
} from '../utils/date';

describe('toIsoDate', () => {
  it('formats a Date as YYYY-MM-DD with leading zeros', () => {
    assert.equal(toIsoDate(new Date(2025, 0, 5)), '2025-01-05');
  });
});

describe('isIsoDate', () => {
  it('accepts YYYY-MM-DD', () => {
    assert.equal(isIsoDate('2025-01-05'), true);
  });

  it('rejects YYYY/MM/DD', () => {
    assert.equal(isIsoDate('2025/01/05'), false);
  });

  it('rejects empty strings', () => {
    assert.equal(isIsoDate(''), false);
  });
});

describe('CSV v1 date conversions', () => {
  it('converts YYYY/MM/DD → YYYY-MM-DD', () => {
    assert.equal(legacyDateToIso('2025/01/05'), '2025-01-05');
  });

  it('returns null for invalid legacy input', () => {
    assert.equal(legacyDateToIso('2025-01-05'), null);
  });

  it('converts YYYY-MM-DD → YYYY/MM/DD', () => {
    assert.equal(isoDateToLegacy('2025-01-05'), '2025/01/05');
  });

  it('returns null for invalid iso input', () => {
    assert.equal(isoDateToLegacy('2025/01/05'), null);
  });

  it('round-trips iso → legacy → iso', () => {
    const iso = '2025-01-05';
    const legacy = isoDateToLegacy(iso);
    assert.ok(legacy);
    assert.equal(legacyDateToIso(legacy!), iso);
  });
});
