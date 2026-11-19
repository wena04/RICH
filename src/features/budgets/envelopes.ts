import type {
  BudgetAmountEntry,
  BudgetEnvelope,
  SavingsPlan,
  SavingsPlanProgress,
} from '../../domain/types';

const PERIOD_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isPeriod(value: string): boolean {
  return PERIOD_RE.test(value);
}

function periodIndex(period: string): number {
  const m = PERIOD_RE.exec(period);
  if (!m) throw new Error(`Invalid period: ${period}`);
  return Number(m[1]) * 12 + (Number(m[2]) - 1);
}

/** Whole months from `from` to `to` (negative when `to` is earlier). */
export function monthsBetween(from: string, to: string): number {
  return periodIndex(to) - periodIndex(from);
}

export function addPeriods(period: string, delta: number): string {
  const index = periodIndex(period) + delta;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function latestEntry(
  history: readonly BudgetAmountEntry[],
  upTo?: string,
): BudgetAmountEntry | null {
  let best: BudgetAmountEntry | null = null;
  for (const entry of history) {
    if (upTo !== undefined && monthsBetween(entry.effectivePeriod, upTo) < 0) continue;
    if (!best || monthsBetween(best.effectivePeriod, entry.effectivePeriod) > 0) best = entry;
  }
  return best;
}

/**
 * Amount a budget provides for `period`.
 * Monthly: the latest amount change effective on or before the month, with an
 * optional first-month override. Special: the single (latest) total, for any period.
 */
export function envelopeAmountForPeriod(
  envelope: Pick<BudgetEnvelope, 'kind' | 'startPeriod' | 'firstPeriodAmountCents'>,
  history: readonly BudgetAmountEntry[],
  period: string,
): number {
  if (envelope.kind === 'special') {
    return Math.max(0, latestEntry(history)?.amountCents ?? 0);
  }
  if (monthsBetween(envelope.startPeriod, period) < 0) return 0;
  if (period === envelope.startPeriod && envelope.firstPeriodAmountCents != null) {
    return Math.max(0, envelope.firstPeriodAmountCents);
  }
  return Math.max(0, latestEntry(history, period)?.amountCents ?? 0);
}

export function envelopeBalance(amountCents: number, frozenCents: number, spentCents: number) {
  const availableCents = amountCents - frozenCents;
  return { availableCents, remainingCents: availableCents - spentCents };
}

type PlanSchedule = Pick<SavingsPlan, 'targetCents' | 'monthlyCents' | 'startPeriod' | 'endedPeriod'>;

export function planDepositCount(plan: Pick<SavingsPlan, 'targetCents' | 'monthlyCents'>): number {
  if (plan.targetCents <= 0 || plan.monthlyCents <= 0) return 0;
  return Math.ceil(plan.targetCents / plan.monthlyCents);
}

/** Deposit for the n-th frozen month (0-based); the last one is the remainder. */
export function planDepositForIndex(
  plan: Pick<SavingsPlan, 'targetCents' | 'monthlyCents'>,
  index: number,
): number {
  if (index < 0 || index >= planDepositCount(plan)) return 0;
  return Math.min(plan.monthlyCents, plan.targetCents - plan.monthlyCents * index);
}

/** Exclusive end of the freeze window: target reached, or the plan ended early. */
function freezeEndPeriod(plan: PlanSchedule): string {
  const scheduledEnd = addPeriods(plan.startPeriod, planDepositCount(plan));
  if (plan.endedPeriod && monthsBetween(plan.endedPeriod, scheduledEnd) > 0) {
    return monthsBetween(plan.startPeriod, plan.endedPeriod) < 0 ? plan.startPeriod : plan.endedPeriod;
  }
  return scheduledEnd;
}

/** Amount the plan freezes from its source budget in `period`. */
export function planFreezeForPeriod(plan: PlanSchedule, period: string): number {
  const offset = monthsBetween(plan.startPeriod, period);
  if (offset < 0 || monthsBetween(period, freezeEndPeriod(plan)) <= 0) return 0;
  return planDepositForIndex(plan, offset);
}

/**
 * A month's deposit counts as saved once that month has fully elapsed, so a plan
 * created this month shows 0/N (matching the original help examples).
 */
export function planProgress(plan: PlanSchedule, currentPeriod: string): SavingsPlanProgress {
  const totalDeposits = planDepositCount(plan);
  const end = freezeEndPeriod(plan);
  const countedUntil = monthsBetween(currentPeriod, end) < 0 ? end : currentPeriod;
  const completedDeposits = Math.min(
    totalDeposits,
    Math.max(0, monthsBetween(plan.startPeriod, countedUntil)),
  );
  let savedCents = 0;
  for (let i = 0; i < completedDeposits; i += 1) savedCents += planDepositForIndex(plan, i);
  return {
    totalDeposits,
    completedDeposits,
    savedCents,
    isFullyFunded: totalDeposits > 0 && completedDeposits === totalDeposits,
  };
}

/** 计划清单 total: money saved so far by plans that were not cancelled or archived. */
export function totalPlanSavingsCents(
  plans: readonly (PlanSchedule & Pick<SavingsPlan, 'status' | 'isArchived'>)[],
  currentPeriod: string,
): number {
  return plans
    .filter((plan) => plan.status !== 'cancelled' && !plan.isArchived)
    .reduce((total, plan) => total + planProgress(plan, currentPeriod).savedCents, 0);
}
