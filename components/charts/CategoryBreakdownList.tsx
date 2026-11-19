import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CHART_SERIES, CHART_SERIES_LIGHT, CHART_TRACK } from '@/components/charts/tokens';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { RichChevron } from '@/components/rich/RichChevron';
import { CATEGORY_FRAME_BACKGROUND, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';
import type { Breakdown, CategorySlice, SubcategorySlice } from '@/src/features/charts/breakdown';
import { centsToYuan } from '@/src/utils/money';

export type RecordsTarget = {
  categoryId: string;
  /** Omitted for the whole category; `null` for records with no subcategory. */
  subcategoryId?: string | null;
  title: string;
};

type Props = {
  breakdown: Breakdown;
  /** Opens the records behind a row. */
  onOpenRecords: (target: RecordsTarget) => void;
};

export const UNSPLIT_LABEL = '未细分';

/** A category unfolds only when at least part of it is filed under a named subcategory. */
export function hasNamedSubcategories(category: CategorySlice): boolean {
  return category.subcategories.some((s) => s.subcategoryId !== null);
}

function Meter({ percent, color, height }: { percent: number; color: string; height: number }) {
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      {percent > 0 ? (
        <View
          style={{
            width: `${Math.max(percent, 1.5)}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: color,
          }}
        />
      ) : null}
    </View>
  );
}

function SubcategoryRow({
  category,
  slice,
  onPress,
}: {
  category: CategorySlice;
  slice: SubcategorySlice;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const name = slice.name ?? UNSPLIT_LABEL;
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.subRow, (pressed || hovered) && styles.rowHover]}
      accessibilityRole="button"
      accessibilityLabel={`${category.name} › ${name}，¥${centsToYuan(slice.totalCents)}，占${category.name} ${slice.percentOfCategory}%，${slice.count} 笔`}
      accessibilityHint="查看记录"
    >
      <View style={[styles.subDisc, slice.subcategoryId === null && styles.unsplitDisc]}>
        <CategoryIcon
          id={slice.subcategoryId ? slice.icon : category.icon}
          name={slice.subcategoryId ? slice.name : category.name}
          size={28}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.line}>
          <Text style={styles.subName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.percent}>{slice.percentOfCategory}%</Text>
          <Text style={styles.subAmount}>¥{centsToYuan(slice.totalCents)}</Text>
          <RichChevron tone="muted" scale={0.75} />
        </View>
        <Meter percent={slice.percentOfCategory} color={CHART_SERIES_LIGHT} height={3} />
      </View>
    </Pressable>
  );
}

function CategoryRow({
  category,
  expanded,
  onPress,
}: {
  category: CategorySlice;
  expanded: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const unfolds = hasNamedSubcategories(category);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.row, (pressed || hovered) && styles.rowHover]}
      accessibilityRole="button"
      accessibilityState={unfolds ? { expanded } : undefined}
      accessibilityLabel={`${category.name}，¥${centsToYuan(category.totalCents)}，占 ${category.percent}%，${category.count} 笔`}
      accessibilityHint={unfolds ? (expanded ? '收起子分类' : '展开子分类') : '查看记录'}
    >
      <View style={styles.disc}>
        <CategoryIcon id={category.icon} name={category.name} size={36} />
      </View>
      <View style={styles.body}>
        <View style={styles.line}>
          <Text style={styles.name} numberOfLines={1}>
            {category.name}
          </Text>
          <Text style={styles.percent}>{category.percent}%</Text>
          <Text style={styles.amount}>¥{centsToYuan(category.totalCents)}</Text>
          <RichChevron tone="muted" direction={unfolds ? (expanded ? 'up' : 'down') : 'right'} scale={0.75} />
        </View>
        <Meter percent={category.percent} color={CHART_SERIES} height={5} />
      </View>
    </Pressable>
  );
}

/**
 * Ranked categories (largest first) with their share of the total; a category with subcategories
 * unfolds to show each subcategory's share of that category. Every row leads to its records.
 */
export function CategoryBreakdownList({ breakdown, onOpenRecords }: Props) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const toggle = (category: CategorySlice) => {
    if (!hasNamedSubcategories(category)) {
      onOpenRecords({ categoryId: category.categoryId, title: category.name });
      return;
    }
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(category.categoryId)) next.delete(category.categoryId);
      else next.add(category.categoryId);
      return next;
    });
  };

  return (
    <View>
      {breakdown.categories.map((category) => {
        const open = expanded.has(category.categoryId);
        return (
          <View key={category.categoryId}>
            <CategoryRow category={category} expanded={open} onPress={() => toggle(category)} />
            {open ? (
              <View style={styles.subList}>
                {category.subcategories.map((slice) => (
                  <SubcategoryRow
                    key={slice.subcategoryId ?? 'none'}
                    category={category}
                    slice={slice}
                    onPress={() =>
                      onOpenRecords({
                        categoryId: category.categoryId,
                        subcategoryId: slice.subcategoryId,
                        title: `${category.name} › ${slice.name ?? UNSPLIT_LABEL}`,
                      })
                    }
                  />
                ))}
                <Pressable
                  onPress={() => onOpenRecords({ categoryId: category.categoryId, title: category.name })}
                  style={({ pressed }) => [styles.allLink, pressed && styles.rowHover]}
                  accessibilityRole="button"
                  accessibilityLabel={`查看${category.name}全部 ${category.count} 笔记录`}
                >
                  <Text style={styles.allLinkText}>查看全部 {category.count} 笔</Text>
                  <RichChevron tone="muted" scale={0.75} />
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  rowHover: { backgroundColor: '#FAFAFA' },
  disc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0, gap: 7 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontSize: 14, lineHeight: 20, color: TEXT_PRIMARY },
  percent: { flex: 1, fontSize: 12, lineHeight: 16, color: TEXT_SECONDARY, fontVariant: ['tabular-nums'] },
  amount: { fontSize: 15, lineHeight: 20, color: TEXT_PRIMARY, fontVariant: ['tabular-nums'] },
  track: { width: '100%', backgroundColor: CHART_TRACK, overflow: 'hidden' },
  subList: { paddingBottom: 4 },
  subRow: {
    minHeight: 52,
    paddingLeft: 63, // the subcategory art sits under the category name
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  subDisc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unsplitDisc: { opacity: 0.5 },
  subName: { flexShrink: 1, fontSize: 13, lineHeight: 18, color: TEXT_PRIMARY },
  subAmount: { fontSize: 13, lineHeight: 18, color: TEXT_PRIMARY, fontVariant: ['tabular-nums'] },
  allLink: {
    minHeight: 44,
    paddingLeft: 63,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  allLinkText: { fontSize: 12, lineHeight: 16, color: TEXT_SECONDARY },
});
