import assert from 'node:assert/strict';
import test from 'node:test';

import { layoutScale, scaleGeometry } from '../utils/layoutScale';

test('layoutScale is width / 393, clamped to [0.9, 430 / 393]', () => {
  assert.equal(layoutScale(393), 1);
  assert.equal(layoutScale(402), 402 / 393);
  assert.equal(layoutScale(320), 0.9);
  assert.equal(layoutScale(1024), 430 / 393);
});

test('scaleGeometry scales lengths and leaves type, borders, caps and hairlines', () => {
  const styles = {
    row: { minHeight: 72.6, paddingLeft: 21, marginTop: -2.6, fontSize: 14, lineHeight: 20, borderWidth: 1 },
    rule: { height: 0.33, width: '100%', maxWidth: 430, flex: 1 },
    header: { height: 44, paddingLeft: 20 },
    pill: { height: 24.7, paddingLeft: 8.6 },
  };
  const out = scaleGeometry(styles, 1.1, { header: true, pill: ['height'] });
  assert.deepEqual(out.row, { minHeight: 79.86, paddingLeft: 23.1, marginTop: -2.86, fontSize: 14, lineHeight: 20, borderWidth: 1 });
  assert.deepEqual(out.rule, styles.rule);
  assert.equal(out.header, styles.header);
  assert.deepEqual(out.pill, { height: 24.7, paddingLeft: 9.46 });
});

test('scaleGeometry at k = 1 returns the same sheet', () => {
  const styles = { a: { width: 10 } };
  assert.equal(scaleGeometry(styles, 1), styles);
});
