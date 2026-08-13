import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/src/domain/categories';

import type { AppDb } from './db';
import { ensureCategory, ensureSubcategory } from './repo/categories';
import { getMeta, setMeta } from './repo/meta';

const STARTER_TAXONOMY_KEY = 'starter_taxonomy_v1';

const STARTER_SUBCATEGORIES: Record<string, string[]> = {
  餐饮: ['买菜', '校园餐饮', '咖啡', '外卖', '聚餐'],
  交通: ['公交地铁', '打车', '油费', '停车'],
  学习: ['学费', '书籍', '软件', '文具'],
  住房: ['房租', '水电网', '家具'],
  娱乐: ['电影', '游戏', '聚会'],
  付费会员: ['视频', '音乐', '云存储', '效率工具'],
  医疗: ['药品', '看诊', '健身'],
  旅行: ['交通', '住宿', '餐饮', '活动门票'],
};

/**
 * Creates useful categories, but never fake financial history. The marker makes
 * this a one-time bootstrap, so a category intentionally removed by the user
 * does not reappear on the next launch.
 */
export async function ensureStarterTaxonomy(db: AppDb): Promise<void> {
  if ((await getMeta(db, STARTER_TAXONOMY_KEY)) === 'complete') return;

  for (const category of DEFAULT_CATEGORIES) {
    const parent = await ensureCategory(db, category.name, category.icon, 'expense');
    for (const subcategory of STARTER_SUBCATEGORIES[category.name] ?? []) {
      await ensureSubcategory(db, parent.id, subcategory);
    }
  }

  for (const category of DEFAULT_INCOME_CATEGORIES) {
    await ensureCategory(db, category.name, category.icon, 'income');
  }

  await setMeta(db, STARTER_TAXONOMY_KEY, 'complete');
}
