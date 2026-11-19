import { EXPENSE_RED, PRIMARY_GREEN, WARNING_AMBER } from '@/constants/Colors';
import type { BudgetEnvelopeKind } from '@/src/domain/types';

/** The original 月度预算 / 专项预算 badges. */
export const KIND_BADGE: Record<BudgetEnvelopeKind, number> = {
  monthly: require('../../assets/images/budget/icon_month_budget.png'),
  special: require('../../assets/images/budget/icon_special_budget.png'),
};

export const KIND_LABEL: Record<BudgetEnvelopeKind, string> = {
  monthly: '月度预算',
  special: '专项预算',
};

/** Progress colour by share used: mint, amber from 80%, coral once over. */
export function budgetProgressColor(percent: number): string {
  if (percent > 100) return EXPENSE_RED;
  if (percent >= 80) return WARNING_AMBER;
  return PRIMARY_GREEN;
}
