import type { SavingsPlan, SavingsPlanProgress } from '../../domain/types';
import { parseCurrencyToCents } from '../../utils/money';
import { BUDGET_EMOJI, characterCount } from './envelopeForm';
import { addPeriods, planDepositCount } from './envelopes';

export const PLAN_NAME_MAX = 14;
export const PLAN_DESCRIPTION_MAX = 30;
const MAX_AMOUNT_CENTS = 9_999_999_999;

/** Plan icons: the emoji from the original plan examples first, then the budget set. */
export const PLAN_EMOJI = Array.from(
  new Set(['✈️', '💆‍♀️', '⛩️', '💺', '☕️', '🍳', '🎮', '🚗', ...BUDGET_EMOJI]),
);

export const DEFAULT_PLAN_EMOJI = PLAN_EMOJI[0];

export type PlanFormInput = {
  name: string;
  icon: string | null;
  targetText: string;
  monthlyText: string;
  description: string;
  sourceEnvelopeId: string | null;
  /** The source budget's amount for the start month, used to cap the monthly freeze. */
  sourceAmountCents: number | null;
};

export type PlanFormValue = {
  name: string;
  icon: string;
  targetCents: number;
  monthlyCents: number;
  description: string | null;
  sourceEnvelopeId: string;
};

export type PlanFormField = 'name' | 'icon' | 'target' | 'source' | 'monthly' | 'description';

export type PlanFormResult =
  | { ok: true; value: PlanFormValue }
  | { ok: false; field: PlanFormField; message: string };

function parsePositiveCents(text: string): number | null {
  const cents = parseCurrencyToCents(text);
  return cents != null && cents > 0 && cents <= MAX_AMOUNT_CENTS ? cents : null;
}

export function validatePlanForm(input: PlanFormInput): PlanFormResult {
  const name = input.name.trim();
  if (!name) return { ok: false, field: 'name', message: '请填写计划名称' };
  if (characterCount(name) > PLAN_NAME_MAX) {
    return { ok: false, field: 'name', message: `计划名称不超过 ${PLAN_NAME_MAX} 个字` };
  }
  if (!input.icon) return { ok: false, field: 'icon', message: '请选择一个图标' };

  const targetCents = parsePositiveCents(input.targetText);
  if (targetCents == null) {
    return { ok: false, field: 'target', message: '目标金额需大于 0，最多保留两位小数' };
  }
  if (!input.sourceEnvelopeId) {
    return { ok: false, field: 'source', message: '请选择每月从哪个月度预算冻结' };
  }
  const monthlyCents = parsePositiveCents(input.monthlyText);
  if (monthlyCents == null) {
    return { ok: false, field: 'monthly', message: '每月冻结金额需大于 0，最多保留两位小数' };
  }
  if (monthlyCents > targetCents) {
    return { ok: false, field: 'monthly', message: '每月冻结金额不能超过目标金额' };
  }
  if (input.sourceAmountCents != null && monthlyCents > input.sourceAmountCents) {
    return { ok: false, field: 'monthly', message: '每月冻结金额不能超过所选预算的每月金额' };
  }

  const description = input.description.trim();
  if (characterCount(description) > PLAN_DESCRIPTION_MAX) {
    return { ok: false, field: 'description', message: `计划说明不超过 ${PLAN_DESCRIPTION_MAX} 个字` };
  }

  return {
    ok: true,
    value: {
      name,
      icon: input.icon,
      targetCents,
      monthlyCents,
      description: description || null,
      sourceEnvelopeId: input.sourceEnvelopeId,
    },
  };
}

/** Month whose deposit completes the plan (it counts as saved once that month ends). */
export function planFinalDepositPeriod(
  startPeriod: string,
  plan: { targetCents: number; monthlyCents: number },
): string | null {
  const count = planDepositCount(plan);
  return count > 0 ? addPeriods(startPeriod, count - 1) : null;
}

export function formatPeriodCN(period: string): string {
  const [year, month] = period.split('-');
  return `${year}年${Number(month)}月`;
}

/** Short status shown on plan cards: deposit progress, or a completion/end label. */
export function planStatusText(
  plan: Pick<SavingsPlan, 'status'>,
  progress: Pick<SavingsPlanProgress, 'completedDeposits' | 'totalDeposits' | 'isFullyFunded'>,
): string {
  if (plan.status === 'completed') return '已完成';
  if (plan.status === 'cancelled') return '已结束';
  if (progress.isFullyFunded) return '已攒够';
  return `${progress.completedDeposits}/${progress.totalDeposits}`;
}
