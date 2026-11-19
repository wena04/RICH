import type {
  BudgetAmountEntry,
  BudgetEnvelope,
  BudgetEnvelopeKind,
  BudgetEnvelopeSummary,
  BudgetTabSummary,
  SavingsPlan,
  SavingsPlanStatus,
  SavingsPlanSummary,
} from '@/src/domain/types';
import {
  envelopeAmountForPeriod,
  envelopeBalance,
  monthsBetween,
  planFreezeForPeriod,
  planProgress,
  totalPlanSavingsCents,
} from '@/src/features/budgets/envelopes';
import { newId } from '@/src/utils/id';
import { monthStartIso, nextMonth } from '@/src/utils/month';

import type { AppDb } from '../db';

type EnvelopeRow = {
  id: string;
  kind: BudgetEnvelopeKind;
  name: string;
  icon: string;
  description: string | null;
  start_period: string;
  first_period_amount_cents: number | null;
  is_archived: number;
  sort_index: number;
};

type PlanRow = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  source_envelope_id: string;
  target_cents: number;
  monthly_cents: number;
  start_period: string;
  status: SavingsPlanStatus;
  ended_period: string | null;
  is_archived: number;
  sort_index: number;
};

const ENVELOPE_COLUMNS = `id, kind, name, icon, description, start_period, first_period_amount_cents,
  is_archived, sort_index`;

const PLAN_COLUMNS = `id, name, icon, description, source_envelope_id, target_cents, monthly_cents,
  start_period, status, ended_period, is_archived, sort_index`;

function toEnvelope(row: EnvelopeRow): BudgetEnvelope {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    icon: row.icon,
    description: row.description,
    startPeriod: row.start_period,
    firstPeriodAmountCents: row.first_period_amount_cents,
    isArchived: row.is_archived === 1,
    sortIndex: row.sort_index,
  };
}

function toPlan(row: PlanRow): SavingsPlan {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    description: row.description,
    sourceEnvelopeId: row.source_envelope_id,
    targetCents: row.target_cents,
    monthlyCents: row.monthly_cents,
    startPeriod: row.start_period,
    status: row.status,
    endedPeriod: row.ended_period,
    isArchived: row.is_archived === 1,
    sortIndex: row.sort_index,
  };
}

// ---------------------------------------------------------------------------
// Budget envelopes
// ---------------------------------------------------------------------------

export async function listEnvelopes(
  db: AppDb,
  opts: { includeArchived?: boolean } = {},
): Promise<BudgetEnvelope[]> {
  const rows = await db.getAllAsync<EnvelopeRow>(
    `SELECT ${ENVELOPE_COLUMNS} FROM budget_envelopes
     ${opts.includeArchived ? '' : 'WHERE is_archived = 0'}
     ORDER BY is_archived ASC, sort_index ASC, created_at ASC`,
  );
  return rows.map(toEnvelope);
}

export async function getEnvelope(db: AppDb, id: string): Promise<BudgetEnvelope | null> {
  const row = await db.getFirstAsync<EnvelopeRow>(
    `SELECT ${ENVELOPE_COLUMNS} FROM budget_envelopes WHERE id = ?`,
    [id],
  );
  return row ? toEnvelope(row) : null;
}

async function listAmountHistories(db: AppDb): Promise<Map<string, BudgetAmountEntry[]>> {
  const rows = await db.getAllAsync<{
    envelope_id: string;
    effective_period: string;
    amount_cents: number;
  }>('SELECT envelope_id, effective_period, amount_cents FROM budget_envelope_amounts');
  const byEnvelope = new Map<string, BudgetAmountEntry[]>();
  for (const row of rows) {
    const list = byEnvelope.get(row.envelope_id) ?? [];
    list.push({ effectivePeriod: row.effective_period, amountCents: row.amount_cents });
    byEnvelope.set(row.envelope_id, list);
  }
  return byEnvelope;
}

export type CreateEnvelopeInput = {
  kind: BudgetEnvelopeKind;
  name: string;
  icon: string;
  description: string | null;
  amountCents: number;
  startPeriod: string; // YYYY-MM
  firstPeriodAmountCents?: number | null;
};

export async function createEnvelope(db: AppDb, input: CreateEnvelopeInput): Promise<string> {
  const id = newId('env');
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    const next = await db.getFirstAsync<{ next_index: number }>(
      'SELECT COALESCE(MAX(sort_index) + 1, 0) AS next_index FROM budget_envelopes',
    );
    await db.runAsync(
      `INSERT INTO budget_envelopes (
         id, kind, name, icon, description, start_period, first_period_amount_cents,
         is_archived, sort_index, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        id,
        input.kind,
        input.name.trim(),
        input.icon,
        input.description?.trim() || null,
        input.startPeriod,
        input.kind === 'monthly' ? (input.firstPeriodAmountCents ?? null) : null,
        next?.next_index ?? 0,
        now,
        now,
      ],
    );
    await db.runAsync(
      `INSERT INTO budget_envelope_amounts (id, envelope_id, effective_period, amount_cents, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newId('enva'), id, input.startPeriod, input.amountCents, now, now],
    );
  });
  return id;
}

export async function updateEnvelopeDetails(
  db: AppDb,
  id: string,
  details: { name: string; icon: string; description: string | null },
): Promise<void> {
  await db.runAsync(
    'UPDATE budget_envelopes SET name = ?, icon = ?, description = ?, updated_at = ? WHERE id = ?',
    [details.name.trim(), details.icon, details.description?.trim() || null, new Date().toISOString(), id],
  );
}

/**
 * Change a budget's amount. Monthly budgets record the change from `effectivePeriod`
 * onward (earlier months keep their amount). Special budgets have one total, so the
 * change replaces it.
 */
export async function setEnvelopeAmount(
  db: AppDb,
  id: string,
  amountCents: number,
  effectivePeriod: string,
): Promise<void> {
  const envelope = await getEnvelope(db, id);
  if (!envelope) throw new Error('budget_not_found');
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    let period = effectivePeriod;
    if (envelope.kind === 'special') {
      await db.runAsync('DELETE FROM budget_envelope_amounts WHERE envelope_id = ?', [id]);
      period = envelope.startPeriod;
    } else if (monthsBetween(envelope.startPeriod, effectivePeriod) <= 0) {
      // Changing the amount in (or before) the first month replaces the first-month override too.
      period = envelope.startPeriod;
      await db.runAsync(
        'UPDATE budget_envelopes SET first_period_amount_cents = NULL WHERE id = ?',
        [id],
      );
    }
    await db.runAsync(
      `INSERT INTO budget_envelope_amounts (id, envelope_id, effective_period, amount_cents, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(envelope_id, effective_period) DO UPDATE SET
         amount_cents = excluded.amount_cents,
         updated_at = excluded.updated_at`,
      [newId('enva'), id, period, amountCents, now, now],
    );
    await db.runAsync('UPDATE budget_envelopes SET updated_at = ? WHERE id = ?', [now, id]);
  });
}

export async function setEnvelopeArchived(db: AppDb, id: string, archived: boolean): Promise<void> {
  await db.runAsync('UPDATE budget_envelopes SET is_archived = ?, updated_at = ? WHERE id = ?', [
    archived ? 1 : 0,
    new Date().toISOString(),
    id,
  ]);
}

export async function reorderEnvelopes(db: AppDb, orderedIds: readonly string[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [index, id] of orderedIds.entries()) {
      await db.runAsync('UPDATE budget_envelopes SET sort_index = ? WHERE id = ?', [index, id]);
    }
  });
}

/**
 * Deletes a budget. Assigned expenses are kept and become unassigned. Fails with a
 * foreign-key error while any savings plan still draws on it.
 */
export async function deleteEnvelope(db: AppDb, id: string): Promise<void> {
  await db.runAsync('DELETE FROM budget_envelopes WHERE id = ?', [id]);
}

/** 所属预算/计划: assign an expense to a budget, or pass null to unassign. */
export async function assignTransactionToEnvelope(
  db: AppDb,
  transactionId: string,
  envelopeId: string | null,
): Promise<void> {
  await db.runAsync('UPDATE transactions SET budget_envelope_id = ?, updated_at = ? WHERE id = ?', [
    envelopeId,
    new Date().toISOString(),
    transactionId,
  ]);
}

async function getSpentByEnvelope(db: AppDb, period: string): Promise<{
  monthly: Map<string, number>;
  allTime: Map<string, number>;
}> {
  const start = monthStartIso(period);
  const endExclusive = monthStartIso(nextMonth(period));
  const rows = await db.getAllAsync<{
    envelope_id: string;
    period_cents: number | null;
    all_time_cents: number | null;
  }>(
    `SELECT
       budget_envelope_id AS envelope_id,
       SUM(CASE WHEN date >= ? AND date < ? THEN amount_cents ELSE 0 END) AS period_cents,
       SUM(amount_cents) AS all_time_cents
     FROM transactions
     WHERE type = 'expense' AND budget_envelope_id IS NOT NULL
     GROUP BY budget_envelope_id`,
    [start, endExclusive],
  );
  return {
    monthly: new Map(rows.map((r) => [r.envelope_id, r.period_cents ?? 0])),
    allTime: new Map(rows.map((r) => [r.envelope_id, r.all_time_cents ?? 0])),
  };
}

export async function getEnvelopeSummaries(
  db: AppDb,
  period: string,
  opts: { includeArchived?: boolean } = {},
): Promise<BudgetEnvelopeSummary[]> {
  const [envelopes, histories, plans, spent] = await Promise.all([
    listEnvelopes(db, opts),
    listAmountHistories(db),
    listSavingsPlans(db, { includeArchived: true }),
    getSpentByEnvelope(db, period),
  ]);
  return envelopes.map((envelope) => {
    const amountCents = envelopeAmountForPeriod(envelope, histories.get(envelope.id) ?? [], period);
    const frozenCents = plans
      .filter((plan) => plan.sourceEnvelopeId === envelope.id)
      .reduce((total, plan) => total + planFreezeForPeriod(plan, period), 0);
    const spentCents =
      (envelope.kind === 'special' ? spent.allTime : spent.monthly).get(envelope.id) ?? 0;
    return {
      envelope,
      amountCents,
      frozenCents,
      spentCents,
      ...envelopeBalance(amountCents, frozenCents, spentCents),
    };
  });
}

// ---------------------------------------------------------------------------
// Savings plans
// ---------------------------------------------------------------------------

export async function listSavingsPlans(
  db: AppDb,
  opts: { includeArchived?: boolean } = {},
): Promise<SavingsPlan[]> {
  const rows = await db.getAllAsync<PlanRow>(
    `SELECT ${PLAN_COLUMNS} FROM savings_plans
     ${opts.includeArchived ? '' : 'WHERE is_archived = 0'}
     ORDER BY is_archived ASC, sort_index ASC, created_at ASC`,
  );
  return rows.map(toPlan);
}

export type CreateSavingsPlanInput = {
  name: string;
  icon: string;
  description: string | null;
  sourceEnvelopeId: string;
  targetCents: number;
  monthlyCents: number;
  startPeriod: string; // YYYY-MM
};

export async function createSavingsPlan(db: AppDb, input: CreateSavingsPlanInput): Promise<string> {
  const id = newId('plan');
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    const next = await db.getFirstAsync<{ next_index: number }>(
      'SELECT COALESCE(MAX(sort_index) + 1, 0) AS next_index FROM savings_plans',
    );
    await db.runAsync(
      `INSERT INTO savings_plans (
         id, name, icon, description, source_envelope_id, target_cents, monthly_cents,
         start_period, status, ended_period, is_archived, sort_index, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL, 0, ?, ?, ?)`,
      [
        id,
        input.name.trim(),
        input.icon,
        input.description?.trim() || null,
        input.sourceEnvelopeId,
        input.targetCents,
        input.monthlyCents,
        input.startPeriod,
        next?.next_index ?? 0,
        now,
        now,
      ],
    );
  });
  return id;
}

/**
 * Ends a plan as completed or cancelled. Freezing stops from `period` (inclusive),
 * so the current month's frozen amount returns to the source budget.
 */
export async function endSavingsPlan(
  db: AppDb,
  id: string,
  status: Exclude<SavingsPlanStatus, 'active'>,
  period: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE savings_plans
     SET status = ?,
         ended_period = CASE WHEN ? < start_period THEN start_period ELSE ? END,
         updated_at = ?
     WHERE id = ? AND status = 'active'`,
    [status, period, period, new Date().toISOString(), id],
  );
}

export async function setSavingsPlanArchived(db: AppDb, id: string, archived: boolean): Promise<void> {
  await db.runAsync('UPDATE savings_plans SET is_archived = ?, updated_at = ? WHERE id = ?', [
    archived ? 1 : 0,
    new Date().toISOString(),
    id,
  ]);
}

export async function reorderSavingsPlans(db: AppDb, orderedIds: readonly string[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [index, id] of orderedIds.entries()) {
      await db.runAsync('UPDATE savings_plans SET sort_index = ? WHERE id = ?', [index, id]);
    }
  });
}

export async function getSavingsPlanSummaries(
  db: AppDb,
  period: string,
  opts: { includeArchived?: boolean } = {},
): Promise<SavingsPlanSummary[]> {
  const [plans, envelopes] = await Promise.all([
    listSavingsPlans(db, opts),
    listEnvelopes(db, { includeArchived: true }),
  ]);
  const names = new Map(envelopes.map((e) => [e.id, e.name]));
  return plans.map((plan) => ({
    plan,
    sourceEnvelopeName: names.get(plan.sourceEnvelopeId) ?? '',
    progress: planProgress(plan, period),
    currentFreezeCents: planFreezeForPeriod(plan, period),
  }));
}

// ---------------------------------------------------------------------------
// Budget tab
// ---------------------------------------------------------------------------

/** 结余: income minus expenses for the month. Balance adjustments and transfers are excluded. */
export async function getMonthBalanceCents(db: AppDb, period: string): Promise<number> {
  const row = await db.getFirstAsync<{ balance_cents: number | null }>(
    `SELECT SUM(CASE WHEN type = 'income' THEN amount_cents
                     WHEN type = 'expense' THEN -amount_cents
                     ELSE 0 END) AS balance_cents
     FROM transactions
     WHERE date >= ? AND date < ?`,
    [monthStartIso(period), monthStartIso(nextMonth(period))],
  );
  return row?.balance_cents ?? 0;
}

export async function getBudgetTabSummary(db: AppDb, period: string): Promise<BudgetTabSummary> {
  const [balanceCents, envelopes, plans] = await Promise.all([
    getMonthBalanceCents(db, period),
    getEnvelopeSummaries(db, period),
    getSavingsPlanSummaries(db, period),
  ]);
  return {
    period,
    balanceCents,
    plansSavedCents: totalPlanSavingsCents(
      plans.map((p) => p.plan),
      period,
    ),
    envelopes,
    plans,
  };
}
