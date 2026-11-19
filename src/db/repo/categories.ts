import type { Category, CategoryKind, Subcategory } from '@/src/domain/types';
import { mergeCategoryKinds } from '@/src/domain/categoryKind';
import { newId } from '@/src/utils/id';

import type { AppDb } from '../db';

export async function listCategories(db: AppDb): Promise<Category[]> {
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    icon: string | null;
    kind: CategoryKind;
  }>(
    'SELECT id, name, icon, kind FROM categories ORDER BY name ASC'
  );
  return rows.map((r) => ({ id: r.id, name: r.name, icon: r.icon, kind: r.kind }));
}

export async function listCategoriesWithSubcategoryCounts(
  db: AppDb
): Promise<Array<Category & { subcategoryCount: number }>> {
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    icon: string | null;
    kind: CategoryKind;
    sub_cnt: number;
  }>(
    `
    SELECT c.id, c.name, c.icon, c.kind, COUNT(s.id) AS sub_cnt
    FROM categories c
    LEFT JOIN subcategories s ON s.category_id = c.id
    GROUP BY c.id, c.name, c.icon, c.kind
    ORDER BY c.name ASC
    `
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    kind: r.kind,
    subcategoryCount: r.sub_cnt ?? 0,
  }));
}

export async function getCategoryByName(db: AppDb, name: string): Promise<Category | null> {
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    icon: string | null;
    kind: CategoryKind;
  }>(
    'SELECT id, name, icon, kind FROM categories WHERE name = ?',
    [name.trim()]
  );
  return row ? { id: row.id, name: row.name, icon: row.icon, kind: row.kind } : null;
}

export async function createCategory(
  db: AppDb,
  name: string,
  icon?: string | null,
  kind: CategoryKind = 'both',
): Promise<Category> {
  const n = name.trim();
  const now = new Date().toISOString();
  const id = newId('cat');
  await db.runAsync(
    `
    INSERT INTO categories (id, name, icon, kind, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [id, n, icon ?? null, kind, now, now]
  );
  return { id, name: n, icon: icon ?? null, kind };
}

export async function updateCategory(
  db: AppDb,
  input: { id: string; name: string; kind?: CategoryKind },
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `
    UPDATE categories
    SET name = ?, kind = COALESCE(?, kind), updated_at = ?
    WHERE id = ?
    `,
    [input.name.trim(), input.kind ?? null, now, input.id]
  );
}

export async function canDeleteCategory(db: AppDb, id: string): Promise<boolean> {
  const txRow = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(1) AS cnt FROM transactions WHERE category_id = ?',
    [id]
  );
  if ((txRow?.cnt ?? 0) !== 0) return false;

  const subRow = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(1) AS cnt FROM subcategories WHERE category_id = ?',
    [id]
  );
  return (subRow?.cnt ?? 0) === 0;
}

export async function deleteCategory(db: AppDb, id: string): Promise<void> {
  // Subcategories are scoped to category; prevent deletion if subcategories exist or category is in use.
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function getCategoryById(db: AppDb, id: string): Promise<Category | null> {
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    icon: string | null;
    kind: CategoryKind;
  }>(
    'SELECT id, name, icon, kind FROM categories WHERE id = ?',
    [id]
  );
  return row ? { id: row.id, name: row.name, icon: row.icon, kind: row.kind } : null;
}

export async function ensureCategory(
  db: AppDb,
  name: string,
  icon?: string | null,
  kind: CategoryKind = 'both',
): Promise<Category> {
  const existing = await getCategoryByName(db, name);
  if (existing) {
    const nextIcon = icon && !existing.icon ? icon : (existing.icon ?? null);
    // If imported or newly entered transactions use the same category name on
    // both sides of the ledger, keep it visible in both composers.
    const nextKind = mergeCategoryKinds(existing.kind, kind);
    if (nextIcon !== existing.icon || nextKind !== existing.kind) {
      await db.runAsync(
        'UPDATE categories SET icon = ?, kind = ?, updated_at = ? WHERE id = ?',
        [nextIcon, nextKind, new Date().toISOString(), existing.id],
      );
      return { ...existing, icon: nextIcon, kind: nextKind };
    }
    return existing;
  }
  return await createCategory(db, name, icon, kind);
}

type SubcategoryRow = { id: string; name: string; category_id: string; icon: string | null };

function toSubcategory(row: SubcategoryRow): Subcategory {
  return { id: row.id, name: row.name, categoryId: row.category_id, icon: row.icon };
}

export async function listAllSubcategories(db: AppDb): Promise<Subcategory[]> {
  const rows = await db.getAllAsync<SubcategoryRow>(
    `SELECT id, name, category_id, icon FROM subcategories ORDER BY category_id ASC, name ASC`,
  );
  return rows.map(toSubcategory);
}

export async function listSubcategories(db: AppDb, categoryId: string): Promise<Subcategory[]> {
  const rows = await db.getAllAsync<SubcategoryRow>(
    `
    SELECT id, name, category_id, icon
    FROM subcategories
    WHERE category_id = ?
    ORDER BY created_at ASC, name ASC
    `,
    [categoryId]
  );
  return rows.map(toSubcategory);
}

export async function getSubcategoryByName(
  db: AppDb,
  categoryId: string,
  name: string
): Promise<Subcategory | null> {
  const row = await db.getFirstAsync<SubcategoryRow>(
    `
    SELECT id, name, category_id, icon
    FROM subcategories
    WHERE category_id = ? AND name = ?
    `,
    [categoryId, name.trim()]
  );
  return row ? toSubcategory(row) : null;
}

export async function getSubcategoryById(db: AppDb, id: string): Promise<Subcategory | null> {
  const row = await db.getFirstAsync<SubcategoryRow>(
    `
    SELECT id, name, category_id, icon
    FROM subcategories
    WHERE id = ?
    `,
    [id]
  );
  return row ? toSubcategory(row) : null;
}

export async function createSubcategory(
  db: AppDb,
  categoryId: string,
  name: string,
  icon: string | null = null
): Promise<Subcategory> {
  const n = name.trim();
  const now = new Date().toISOString();
  const id = newId('sub');
  await db.runAsync(
    `
    INSERT INTO subcategories (id, category_id, name, icon, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [id, categoryId, n, icon, now, now]
  );
  return { id, categoryId, name: n, icon };
}

export async function updateSubcategory(
  db: AppDb,
  input: { id: string; name: string; icon?: string | null }
): Promise<void> {
  const now = new Date().toISOString();
  if (input.icon === undefined) {
    await db.runAsync('UPDATE subcategories SET name = ?, updated_at = ? WHERE id = ?', [
      input.name.trim(),
      now,
      input.id,
    ]);
    return;
  }
  await db.runAsync('UPDATE subcategories SET name = ?, icon = ?, updated_at = ? WHERE id = ?', [
    input.name.trim(),
    input.icon,
    now,
    input.id,
  ]);
}

export async function canDeleteSubcategory(db: AppDb, id: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(1) AS cnt FROM transactions WHERE subcategory_id = ?',
    [id]
  );
  return (row?.cnt ?? 0) === 0;
}

export async function deleteSubcategory(db: AppDb, id: string): Promise<void> {
  await db.runAsync('DELETE FROM subcategories WHERE id = ?', [id]);
}

export async function ensureSubcategory(
  db: AppDb,
  categoryId: string,
  name: string,
  icon: string | null = null
): Promise<Subcategory> {
  const existing = await getSubcategoryByName(db, categoryId, name);
  if (existing) return existing;
  return await createSubcategory(db, categoryId, name, icon);
}
