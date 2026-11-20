import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  View,
  Text,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ACCESSIBLE_GREEN,
  CATEGORY_FRAME_BACKGROUND,
  CONTROL_BACKGROUND,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/constants/Colors";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { getDb } from "@/src/db/db";
import {
  createCategory,
  createSubcategory,
  getCategoryByName,
  getSubcategoryByName,
} from "@/src/db/repo/categories";
import { CATEGORY_ICON_SECTIONS } from "@/src/domain/categoryIcons";
import type { CategoryKind } from "@/src/domain/types";
import { useLayoutScale, useScaledStyles } from '@/components/rich/useScaledStyles';

export default function AddCategoryScreen() {
  const styles = useScaledStyles(baseStyles, { keep: FIXED });
  const k = useLayoutScale();
  const router = useRouter();
  // With parentId this screen adds a subcategory (添加子类) to that category, like the original app.
  const { type: requestedType, parentId, parentName } = useLocalSearchParams<{
    type?: string;
    parentId?: string;
    parentName?: string;
  }>();
  const isSubcategory = Boolean(parentId);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<{ id: string; label: string } | null>(null);
  const kind: CategoryKind = requestedType === 'income' ? 'income' : 'expense';
  const [saving, setSaving] = useState(false);
  const { width: viewportWidth } = useWindowDimensions();
  const gridColumns = viewportWidth < 360 ? 4 : 5;
  const gridWidth = Math.max(0, Math.min(viewportWidth, 430) - 32 * k); // less the scaled 16pt insets
  const gridItemWidth = gridWidth / gridColumns;

  async function onDone() {
    if (saving || !selected) return;
    const finalName = (name.trim() || selected.label).slice(0, 6);
    setSaving(true);
    try {
      const db = await getDb();
      if (parentId) {
        if (await getSubcategoryByName(db, parentId, finalName)) {
          Alert.alert('名称已存在', `“${parentName ?? ''}”下已经有“${finalName}”。`);
          return;
        }
        await createSubcategory(db, parentId, finalName, selected.id);
        router.back();
        return;
      }
      const existing = await getCategoryByName(db, finalName);
      if (existing) {
        Alert.alert('名称已存在', `“${finalName}”已经是一个分类。`);
        return;
      }
      await createCategory(db, finalName, selected.id, kind);
      router.back();
    } catch (e) {
      console.error("Failed to add category:", e);
      Alert.alert('没有保存', e instanceof Error ? e.message : '请检查分类名称和图标。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.head}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerAction, styles.backAction, pressed && styles.headerActionPressed]}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Image source={require("../../assets/images/ui/nav_icon_back_black.png")} style={styles.backIcon} accessible={false} />
        </Pressable>
        <Text style={styles.title}>{isSubcategory ? '添加子类' : '添加自定义类目'}</Text>
        <Pressable
          onPress={onDone}
          disabled={!selected || saving}
          style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          accessibilityRole="button"
          accessibilityLabel={isSubcategory ? '保存子类' : '保存自定义分类'}
          accessibilityState={{ disabled: !selected || saving }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={ACCESSIBLE_GREEN} />
          ) : (
            <Text style={[styles.done, !selected && styles.doneOff]}>完成</Text>
          )}
        </Pressable>
      </View>

      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={(v) => setName(v.slice(0, 6))}
        placeholder={
          isSubcategory
            ? `请输入「${parentName ?? ''}」的子类名称（不超过6个字符）`
            : "请输入类目名称（不超过6个字符）"
        }
        placeholderTextColor={TEXT_SECONDARY}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.libraryIntro}>
          <View>
            <Text style={styles.libraryTitle}>选择图标</Text>
            <Text style={styles.libraryMeta}>完整分类图标库</Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countText}>
              {CATEGORY_ICON_SECTIONS.reduce((sum, section) => sum + section.items.length, 0)} 个
            </Text>
          </View>
        </View>
        {CATEGORY_ICON_SECTIONS.map(({ title, items }) => (
          <View key={title} style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.dash} />
            <View style={[styles.grid, { width: gridWidth }]}>
              {items.map(([label, id], i) => {
                const active = selected?.id === id && selected?.label === label;
                return (
                  <Pressable
                    key={label + i}
                    style={({ pressed }) => [
                      styles.item,
                      { width: gridItemWidth },
                      pressed && styles.itemPressed,
                    ]}
                    onPress={() => setSelected({ id, label })}
                    accessibilityRole="button"
                    accessibilityLabel={`选择${label}图标`}
                    accessibilityState={{ selected: active }}
                  >
                    <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                      <CategoryIcon
                        id={id}
                        name={label}
                        size={46}
                      />
                    </View>
                    <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Nav-bar controls keep the system size. */
const FIXED = { headerAction: true, headerActionPressed: true } as const;

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionPressed: { backgroundColor: CONTROL_BACKGROUND },
  // Original back chevron: nav_icon_back_black, 16pt from the screen edge.
  backAction: { alignItems: "flex-start" },
  backIcon: { width: 16, height: 16 },
  title: { fontSize: 17, fontWeight: "600", color: TEXT_PRIMARY },
  done: { fontSize: 14, fontWeight: "600", color: ACCESSIBLE_GREEN },
  doneOff: { color: "#B8B8B8" },
  nameInput: {
    paddingHorizontal: 18,
    minHeight: 54,
    paddingVertical: 14,
    fontSize: 14,
    color: TEXT_PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  libraryIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 3,
  },
  libraryTitle: { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  libraryMeta: { marginTop: 2, fontSize: 10, color: TEXT_SECONDARY },
  countPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F1F3F2' },
  countText: { fontSize: 10, fontWeight: '600', color: '#636966' },
  section: { paddingHorizontal: 16, paddingTop: 15 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: TEXT_PRIMARY, letterSpacing: 0.1 },
  dash: { borderBottomWidth: 1, borderBottomColor: "#EEE", borderStyle: "dashed", marginTop: 8, marginBottom: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", alignSelf: 'center' },
  item: { minHeight: 82, alignItems: "center", paddingVertical: 10 },
  itemPressed: { backgroundColor: CONTROL_BACKGROUND },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CATEGORY_FRAME_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  // Original selection treatment: ring inside the disc, disc stays #F7F7F7.
  iconWrapActive: { borderWidth: 1.7, borderColor: "#000000" },
  itemLabel: { fontSize: 10, color: "#4E5350" },
  itemLabelActive: { color: "#181A19", fontWeight: "600" },
});
