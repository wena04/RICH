import assert from 'node:assert/strict';
import test from 'node:test';

import { fitFontSize } from '../utils/fitText';

test('short amounts keep the base size', () => {
  assert.equal(fitFontSize('¥25.50', 31, 160), 31);
});

test('long amounts shrink to fit, never below half', () => {
  assert.equal(fitFontSize('-¥29999999.97', 31, 157), 20.1);
  assert.equal(fitFontSize('-¥999999999999999.99', 31, 60), 15.5);
});

test('an unmeasured width leaves the base size', () => {
  assert.equal(fitFontSize('-¥29999999.97', 31, 0), 31);
});
