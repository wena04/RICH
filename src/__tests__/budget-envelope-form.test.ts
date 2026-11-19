import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  BUDGET_EMOJI,
  characterCount,
  envelopeUsedPercent,
  validateEnvelopeForm,
} from '../features/budgets/envelopeForm';

const valid = { name: '基本开支', icon: '🍚', amountText: '900', description: '日常三餐' };

describe('budget envelope form', () => {
  it('accepts a complete budget and converts the amount to cents', () => {
    assert.deepEqual(validateEnvelopeForm('monthly', valid), {
      ok: true,
      value: { name: '基本开支', icon: '🍚', amountCents: 90_000, description: '日常三餐' },
    });
  });

  it('trims fields and stores an empty description as null', () => {
    const result = validateEnvelopeForm('special', { ...valid, name: '  大促购物 ', description: '  ' });
    assert.equal(result.ok && result.value.name, '大促购物');
    assert.equal(result.ok && result.value.description, null);
  });

  it('requires a name of at most 10 characters, counting each Chinese character once', () => {
    assert.equal(validateEnvelopeForm('monthly', { ...valid, name: ' ' }).ok, false);
    assert.equal(validateEnvelopeForm('monthly', { ...valid, name: '大促购物(临时)' }).ok, true);
    const tooLong = validateEnvelopeForm('monthly', { ...valid, name: '一二三四五六七八九十一' });
    assert.equal(tooLong.ok === false && tooLong.field, 'name');
  });

  it('rejects zero, negative, and over-precise amounts with a kind-specific label', () => {
    for (const amountText of ['', '0', '-5', '1.234', 'abc']) {
      const result = validateEnvelopeForm('monthly', { ...valid, amountText });
      assert.equal(result.ok === false && result.field, 'amount', amountText);
    }
    const special = validateEnvelopeForm('special', { ...valid, amountText: '0' });
    assert.match(special.ok === false ? special.message : '', /预算总额/);
  });

  it('requires an icon', () => {
    const result = validateEnvelopeForm('monthly', { ...valid, icon: null });
    assert.equal(result.ok === false && result.field, 'icon');
  });

  it('counts emoji and CJK as single characters', () => {
    assert.equal(characterCount('预算🍚'), 3);
  });

  it('offers unique emoji choices', () => {
    assert.equal(new Set(BUDGET_EMOJI).size, BUDGET_EMOJI.length);
  });

  it('reports usage against what is available, flagging spend with nothing available', () => {
    assert.equal(envelopeUsedPercent(45_000, 90_000), 50);
    assert.equal(envelopeUsedPercent(0, 0), 0);
    assert.equal(envelopeUsedPercent(100, 0), 101);
  });
});
