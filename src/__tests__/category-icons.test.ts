import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../domain/categories';
import {
  CATEGORY_ICON_CATALOG_ITEMS,
  CATEGORY_ICON_NAMES,
  CATEGORY_ICON_SECTIONS,
  FALLBACK_CATEGORY_ICON,
  ICON_BY_CATEGORY_NAME,
  LEGACY_ICON_IDS,
  isCategoryIconName,
  resolveCategoryIconName,
} from '../domain/categoryIcons';

const iconDirectory = path.join(process.cwd(), 'assets/icons/categories');

describe('category icons', () => {
  it('registers exactly the vector artwork on disk', () => {
    const onDisk = readdirSync(iconDirectory)
      .filter((file) => /^icon_[a-z0-9]+\.svg$/.test(file))
      .map((file) => file.slice(0, -4))
      .sort();
    assert.deepEqual([...CATEGORY_ICON_NAMES].sort(), onDisk);
    assert.equal(onDisk.length, 123);
  });

  it('keeps every glyph free of a baked-in disc and limited to the two original inks', () => {
    for (const name of CATEGORY_ICON_NAMES) {
      const svg = readFileSync(path.join(iconDirectory, `${name}.svg`), 'utf8');
      assert.match(svg, /viewBox="0 0 48 48"/, name);
      // Traced originals paint with fills; redrawn glyphs (<desc>redrawn</desc>) with strokes.
      const paints = new Set(
        [...svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]).filter((paint) => paint !== 'none'),
      );
      assert.ok(paints.has('#000000'), `${name} has no ink layer`);
      for (const paint of paints) assert.ok(['#000000', '#02B17B'].includes(paint), `${name} uses ${paint}`);
      assert.doesNotMatch(svg, /#F7F7F7/i, `${name} still contains the disc`);
    }
  });

  it('uses the original 添加自定义类目 library, with art for every entry', () => {
    assert.equal(CATEGORY_ICON_SECTIONS.length, 18);
    assert.equal(CATEGORY_ICON_CATALOG_ITEMS.length, 134);
    for (const { section, label, iconName } of CATEGORY_ICON_CATALOG_ITEMS) {
      assert.ok(isCategoryIconName(iconName), `${section} / ${label} → ${iconName}`);
    }
  });

  it('draws every default category with original artwork', () => {
    for (const category of [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]) {
      assert.ok(isCategoryIconName(category.icon), `${category.name} stores ${category.icon}`);
      assert.equal(resolveCategoryIconName(category.icon, category.name), category.icon);
    }
  });

  it('prefers the icon a person chose over the name lookup', () => {
    assert.equal(ICON_BY_CATEGORY_NAME['咖啡'], 'icon_kafei');
    assert.equal(resolveCategoryIconName('icon_shuiguo', '咖啡'), 'icon_shuiguo');
  });

  it('resolves names, then legacy ids, then 其他', () => {
    assert.equal(resolveCategoryIconName(null, '餐饮'), 'icon_canyin');
    assert.equal(resolveCategoryIconName(null, '公交地铁'), 'icon_ditie');
    // A legacy id shared by two concepts follows the category name when the name is known…
    assert.equal(resolveCategoryIconName('redpacket', '收红包'), 'icon_shouhongbao');
    // …and its own mapping otherwise.
    assert.equal(resolveCategoryIconName('coffee', 'Starbucks'), 'icon_kafei');
    assert.equal(resolveCategoryIconName('unknown-id', '我的自定义'), FALLBACK_CATEGORY_ICON);
    assert.equal(resolveCategoryIconName(null, null), FALLBACK_CATEGORY_ICON);
  });

  it('maps every id written by earlier builds to existing artwork', () => {
    assert.equal(Object.keys(LEGACY_ICON_IDS).length, 114);
    for (const [legacy, iconName] of Object.entries(LEGACY_ICON_IDS)) {
      assert.ok(isCategoryIconName(iconName), `${legacy} → ${iconName}`);
    }
  });

  it('keeps the two bonus concepts visually distinct', () => {
    assert.equal(resolveCategoryIconName(null, '奖金'), 'icon_jiangjin');
    assert.equal(resolveCategoryIconName(null, '员工奖金'), 'icon_yuangongjiangjin');
  });
});
