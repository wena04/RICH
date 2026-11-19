import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  formatPeriodCN,
  PLAN_EMOJI,
  planFinalDepositPeriod,
  planStatusText,
  validatePlanForm,
} from '../features/budgets/planForm';

const valid = {
  name: '夏日旅行计划',
  icon: '✈️',
  targetText: '5000',
  monthlyText: '500',
  description: '',
  sourceEnvelopeId: 'env_1',
  sourceAmountCents: 90_000,
};

describe('savings plan form', () => {
  it('accepts the original example plan', () => {
    assert.deepEqual(validatePlanForm(valid), {
      ok: true,
      value: {
        name: '夏日旅行计划',
        icon: '✈️',
        targetCents: 500_000,
        monthlyCents: 50_000,
        description: null,
        sourceEnvelopeId: 'env_1',
      },
    });
  });

  it('allows names as long as the longest original example', () => {
    assert.equal(validatePlanForm({ ...valid, name: 'Delonghi咖啡机计划' }).ok, true);
  });

  it('requires a monthly source budget', () => {
    const result = validatePlanForm({ ...valid, sourceEnvelopeId: null });
    assert.equal(result.ok === false && result.field, 'source');
  });

  it('rejects a monthly freeze above the target or above the source budget', () => {
    const overTarget = validatePlanForm({ ...valid, targetText: '400', monthlyText: '500' });
    assert.equal(overTarget.ok === false && overTarget.field, 'monthly');
    const overBudget = validatePlanForm({ ...valid, sourceAmountCents: 40_000 });
    assert.match(overBudget.ok === false ? overBudget.message : '', /所选预算/);
  });

  it('rejects missing or malformed amounts', () => {
    for (const targetText of ['', '0', '-1', '1.005']) {
      const result = validatePlanForm({ ...valid, targetText });
      assert.equal(result.ok === false && result.field, 'target', targetText);
    }
    const monthly = validatePlanForm({ ...valid, monthlyText: '0' });
    assert.equal(monthly.ok === false && monthly.field, 'monthly');
  });

  it('predicts the month of the final deposit, including a remainder deposit', () => {
    assert.equal(planFinalDepositPeriod('2026-11', { targetCents: 500_000, monthlyCents: 50_000 }), '2027-08');
    assert.equal(planFinalDepositPeriod('2026-11', { targetCents: 100_000, monthlyCents: 30_000 }), '2027-02');
    assert.equal(formatPeriodCN('2027-08'), '2027年8月');
  });

  it('labels card status by progress, then completion or ending', () => {
    const progress = { completedDeposits: 3, totalDeposits: 10, isFullyFunded: false };
    assert.equal(planStatusText({ status: 'active' }, progress), '3/10');
    assert.equal(planStatusText({ status: 'active' }, { ...progress, isFullyFunded: true }), '已攒够');
    assert.equal(planStatusText({ status: 'completed' }, progress), '已完成');
    assert.equal(planStatusText({ status: 'cancelled' }, progress), '已结束');
  });

  it('offers the original example emoji first without duplicates', () => {
    assert.equal(PLAN_EMOJI[0], '✈️');
    assert.equal(new Set(PLAN_EMOJI).size, PLAN_EMOJI.length);
  });
});
