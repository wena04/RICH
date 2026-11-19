import type { BudgetEnvelopeKind } from '../../domain/types';
import { parseCurrencyToCents } from '../../utils/money';

export const ENVELOPE_NAME_MAX = 10;
export const ENVELOPE_DESCRIPTION_MAX = 30;
const MAX_AMOUNT_CENTS = 9_999_999_999; // ¥99,999,999.99

/**
 * Emoji choices for budgets. The original app used emoji as budget icons; this set
 * starts with every emoji shown in its budget help examples and tips.
 */
export const BUDGET_EMOJI = [
  '💰', '🍚', '🛒', '✈️', '💗', '🌞', '🎮', '📖', '❤️', '👜', '💅', '🥳',
  '👨‍👩‍👦', '🏠', '💌', '🌈', '📅', '🍑', '🎹', '☕️', '🍜', '🚗', '🎁', '👶',
  '🐶', '💊', '🏋️', '🎬', '📱', '💻', '🧳', '🎓', '💄', '👗', '🍰', '🏖️',
] as const;

export const DEFAULT_BUDGET_EMOJI = BUDGET_EMOJI[0];

export type EnvelopeFormInput = {
  name: string;
  icon: string | null;
  amountText: string;
  description: string;
};

export type EnvelopeFormValue = {
  name: string;
  icon: string;
  amountCents: number;
  description: string | null;
};

export type EnvelopeFormResult =
  | { ok: true; value: EnvelopeFormValue }
  | { ok: false; field: 'name' | 'icon' | 'amount' | 'description'; message: string };

/** Counts user-visible characters so each Chinese character counts once. */
export function characterCount(value: string): number {
  return Array.from(value).length;
}

export function amountLabel(kind: BudgetEnvelopeKind): string {
  return kind === 'monthly' ? '每月金额' : '预算总额';
}

export function validateEnvelopeForm(
  kind: BudgetEnvelopeKind,
  input: EnvelopeFormInput,
): EnvelopeFormResult {
  const name = input.name.trim();
  if (!name) return { ok: false, field: 'name', message: '请填写预算名称' };
  if (characterCount(name) > ENVELOPE_NAME_MAX) {
    return { ok: false, field: 'name', message: `预算名称不超过 ${ENVELOPE_NAME_MAX} 个字` };
  }
  if (!input.icon) return { ok: false, field: 'icon', message: '请选择一个图标' };

  const amountCents = parseCurrencyToCents(input.amountText);
  if (amountCents == null || amountCents <= 0 || amountCents > MAX_AMOUNT_CENTS) {
    return {
      ok: false,
      field: 'amount',
      message: `${amountLabel(kind)}需大于 0，最多保留两位小数`,
    };
  }

  const description = input.description.trim();
  if (characterCount(description) > ENVELOPE_DESCRIPTION_MAX) {
    return {
      ok: false,
      field: 'description',
      message: `用途说明不超过 ${ENVELOPE_DESCRIPTION_MAX} 个字`,
    };
  }

  return {
    ok: true,
    value: { name, icon: input.icon, amountCents, description: description || null },
  };
}

/** Spent share of what is available, for progress bars; >100 means overspent. */
export function envelopeUsedPercent(spentCents: number, availableCents: number): number {
  if (availableCents <= 0) return spentCents > 0 ? 101 : 0;
  return Math.round((spentCents / availableCents) * 100);
}
