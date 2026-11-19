import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import type { SavingsPlan } from '../domain/types';
import {
  envelopeAmountForPeriod,
  envelopeBalance,
  isPeriod,
  monthsBetween,
  planDepositCount,
  planDepositForIndex,
  planFreezeForPeriod,
  planProgress,
  totalPlanSavingsCents,
} from '../features/budgets/envelopes';

const monthly = { kind: 'monthly' as const, startPeriod: '2026-03', firstPeriodAmountCents: null };

function plan(overrides: Partial<SavingsPlan> = {}): SavingsPlan {
  return {
    id: 'plan_1',
    name: '夏日旅行计划',
    icon: '✈️',
    description: null,
    sourceEnvelopeId: 'env_1',
    targetCents: 500_000,
    monthlyCents: 50_000,
    startPeriod: '2026-03',
    status: 'active',
    endedPeriod: null,
    isArchived: false,
    sortIndex: 0,
    ...overrides,
  };
}

describe('periods', () => {
  it('validates YYYY-MM and counts months across years', () => {
    assert.equal(isPeriod('2026-12'), true);
    assert.equal(isPeriod('2026-13'), false);
    assert.equal(monthsBetween('2026-11', '2027-02'), 3);
    assert.equal(monthsBetween('2027-02', '2026-11'), -3);
  });
});

describe('budget envelope amounts', () => {
  const history = [
    { effectivePeriod: '2026-03', amountCents: 90_000 },
    { effectivePeriod: '2026-06', amountCents: 120_000 },
  ];

  it('gives nothing before a monthly budget starts', () => {
    assert.equal(envelopeAmountForPeriod(monthly, history, '2026-02'), 0);
  });

  it('keeps the amount that applied in past months after a change', () => {
    assert.equal(envelopeAmountForPeriod(monthly, history, '2026-05'), 90_000);
    assert.equal(envelopeAmountForPeriod(monthly, history, '2026-06'), 120_000);
    assert.equal(envelopeAmountForPeriod(monthly, history, '2027-01'), 120_000);
  });

  it('applies the first-month override only to the start month', () => {
    const env = { ...monthly, firstPeriodAmountCents: 30_000 };
    assert.equal(envelopeAmountForPeriod(env, history, '2026-03'), 30_000);
    assert.equal(envelopeAmountForPeriod(env, history, '2026-04'), 90_000);
  });

  it('treats a special budget as one total regardless of month', () => {
    const special = { kind: 'special' as const, startPeriod: '2026-11', firstPeriodAmountCents: null };
    const totals = [{ effectivePeriod: '2026-11', amountCents: 200_000 }];
    assert.equal(envelopeAmountForPeriod(special, totals, '2026-10'), 200_000);
    assert.equal(envelopeAmountForPeriod(special, totals, '2027-04'), 200_000);
  });

  it('reports overspending as a negative remainder after frozen savings', () => {
    assert.deepEqual(envelopeBalance(90_000, 50_000, 60_000), {
      availableCents: 40_000,
      remainingCents: -20_000,
    });
  });
});

describe('savings plans', () => {
  it('matches the original examples: target / monthly freeze = deposit count', () => {
    assert.equal(planDepositCount(plan()), 10); // ¥5000 at ¥500/月 → 0/10
    assert.equal(planDepositCount(plan({ targetCents: 160_000, monthlyCents: 20_000 })), 8);
    assert.equal(planDepositCount(plan({ targetCents: 400_000, monthlyCents: 80_000 })), 5);
  });

  it('makes the final deposit the remainder when the target is not a multiple', () => {
    const p = plan({ targetCents: 100_000, monthlyCents: 30_000 });
    assert.equal(planDepositCount(p), 4);
    assert.deepEqual([0, 1, 2, 3, 4].map((i) => planDepositForIndex(p, i)), [30_000, 30_000, 30_000, 10_000, 0]);
  });

  it('freezes the monthly amount from the start month until the target is reached', () => {
    const p = plan({ targetCents: 100_000, monthlyCents: 30_000 });
    assert.equal(planFreezeForPeriod(p, '2026-02'), 0);
    assert.equal(planFreezeForPeriod(p, '2026-03'), 30_000);
    assert.equal(planFreezeForPeriod(p, '2026-06'), 10_000);
    assert.equal(planFreezeForPeriod(p, '2026-07'), 0);
  });

  it('shows 0/N in the month the plan is created and counts elapsed months', () => {
    assert.deepEqual(planProgress(plan(), '2026-03'), {
      totalDeposits: 10,
      completedDeposits: 0,
      savedCents: 0,
      isFullyFunded: false,
    });
    assert.equal(planProgress(plan(), '2026-06').completedDeposits, 3);
    assert.equal(planProgress(plan(), '2026-06').savedCents, 150_000);
  });

  it('caps progress at the target once every deposit has elapsed', () => {
    const progress = planProgress(plan(), '2028-01');
    assert.equal(progress.completedDeposits, 10);
    assert.equal(progress.savedCents, 500_000);
    assert.equal(progress.isFullyFunded, true);
  });

  it('stops freezing from the month a plan is cancelled and keeps earlier deposits', () => {
    const cancelled = plan({ status: 'cancelled', endedPeriod: '2026-05' });
    assert.equal(planFreezeForPeriod(cancelled, '2026-04'), 50_000);
    assert.equal(planFreezeForPeriod(cancelled, '2026-05'), 0);
    assert.equal(planProgress(cancelled, '2026-09').completedDeposits, 2);
  });

  it('freezes nothing when a plan ends in its start month', () => {
    const p = plan({ status: 'cancelled', endedPeriod: '2026-03' });
    assert.equal(planFreezeForPeriod(p, '2026-03'), 0);
    assert.equal(planProgress(p, '2026-08').savedCents, 0);
  });

  it('totals savings only for plans that are neither cancelled nor archived', () => {
    const plans = [
      plan(),
      plan({ id: 'p2', status: 'cancelled', endedPeriod: '2026-05' }),
      plan({ id: 'p3', isArchived: true }),
    ];
    assert.equal(totalPlanSavingsCents(plans, '2026-05'), 100_000);
  });
});
