import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { CATEGORY_ICON_IDS, CATEGORY_ICON_XML } from '../../components/categoryIconRegistry.generated';
import { CATEGORY_ICON_CATALOG_ITEMS, CATEGORY_ICON_SECTIONS } from '../domain/categoryIconCatalog';
import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../domain/categories';
import { iconIdForCategory } from '../domain/categoryIcons';

describe('category icon semantics', () => {
  it('maps the main bookkeeping categories to distinct icons', () => {
    assert.equal(iconIdForCategory('餐饮'), 'food');
    assert.equal(iconIdForCategory('交通'), 'bus');
    assert.equal(iconIdForCategory('住房'), 'house');
    assert.equal(iconIdForCategory('医疗'), 'medkit');
  });

  it('gives starter subcategories useful icons without storing another column', () => {
    assert.equal(iconIdForCategory('校园餐饮'), 'bowl');
    assert.equal(iconIdForCategory('咖啡'), 'coffee');
    assert.equal(iconIdForCategory('公交地铁'), 'metro');
    assert.equal(iconIdForCategory('水电网'), 'drop');
  });

  it('keeps income aliases visually consistent', () => {
    assert.equal(iconIdForCategory('工资薪水'), 'wallet');
    assert.equal(iconIdForCategory('兼职外快'), 'clockyen');
    assert.equal(iconIdForCategory('投资理财'), 'chart');
    assert.equal(iconIdForCategory('退款返款'), 'refund');
  });

  it('uses the sealed-envelope icon for received red packets', () => {
    assert.equal(iconIdForCategory('收红包'), 'redpacket');
  });

  it('falls back safely for custom names', () => {
    assert.equal(iconIdForCategory('我的自定义'), 'grid');
    assert.equal(iconIdForCategory(null), 'grid');
  });

  it('keeps the full custom-category catalog registered and semantically addressable', () => {
    const registered = new Set<string>(CATEGORY_ICON_IDS);
    const iconForRepeatedLabel = new Map<string, string>();

    assert.equal(CATEGORY_ICON_SECTIONS.length, 18);
    assert.equal(CATEGORY_ICON_CATALOG_ITEMS.length, 134);

    for (const { section, label, iconId } of CATEGORY_ICON_CATALOG_ITEMS) {
      assert.ok(registered.has(iconId), `${section} / ${label} references missing icon ${iconId}`);
      assert.equal(iconIdForCategory(label), iconId, `${section} / ${label} has a mismatched name fallback`);

      const previousIcon = iconForRepeatedLabel.get(label);
      assert.ok(!previousIcon || previousIcon === iconId, `${label} uses both ${previousIcon} and ${iconId}`);
      iconForRepeatedLabel.set(label, iconId);
    }
  });

  it('keeps every default category icon registered', () => {
    const registered = new Set<string>(CATEGORY_ICON_IDS);
    for (const category of [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]) {
      assert.ok(registered.has(category.icon), `${category.name} references missing icon ${category.icon}`);
    }
  });

  it('keeps generated runtime icons in exact sync with individual SVG sources', () => {
    const iconDirectory = path.join(process.cwd(), 'assets/icons/categories');
    const sourceIds = readdirSync(iconDirectory)
      .filter((filename) => /^ic-[a-z0-9]+\.svg$/.test(filename))
      .map((filename) => filename.slice(3, -4))
      .sort();

    assert.deepEqual([...CATEGORY_ICON_IDS].sort(), sourceIds);
    assert.equal(Object.keys(CATEGORY_ICON_XML).length, sourceIds.length);
  });

  it('keeps the two bonus concepts visually distinct', () => {
    assert.equal(iconIdForCategory('奖金'), 'briefcaseyen');
    assert.equal(iconIdForCategory('员工奖金'), 'trophyyen');
  });
});
