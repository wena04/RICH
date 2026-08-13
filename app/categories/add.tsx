import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  View,
  Text,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from "@/constants/Colors";
import { CategoryIcon } from "@/components/CategoryIcon";
import { getDb } from "@/src/db/db";
import { createCategory, getCategoryByName } from "@/src/db/repo/categories";
import { CATEGORY_ICON_SECTIONS } from "@/src/domain/categoryIconCatalog";
import type { CategoryKind } from "@/src/domain/types";

export default function AddCategoryScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<{ id: string; label: string } | null>(null);
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [saving, setSaving] = useState(false);

  async function onDone() {
    if (saving || !selected) return;
    const finalName = (name.trim() || selected.label).slice(0, 6);
    setSaving(true);
    try {
      const db = await getDb();
      const existing = await getCategoryByName(db, finalName);
      if (existing) {
        Alert.alert('名称已存在', `“${finalName}”已经是一个分类。`);
        return;
      }
      await createCategory(db, finalName, selected.id, kind);
      router.back();
    } catch (e) {
      console.error("Failed to add category:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <FontAwesome name="chevron-left" size={18} color={TEXT_PRIMARY} />
        </Pressable>
        <Text style={styles.title}>添加自定义类目</Text>
        <Pressable onPress={onDone} disabled={!selected}>
          <Text style={[styles.done, !selected && styles.doneOff]}>完成</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={(v) => setName(v.slice(0, 6))}
        placeholder="请输入类目名称（不超过6个字符）"
        placeholderTextColor={TEXT_SECONDARY}
      />

      <View style={styles.kindSection}>
        <Text style={styles.kindLabel}>用于</Text>
        <View style={styles.kindToggle}>
          {([
            ['expense', '支出'],
            ['income', '收入'],
            ['both', '两者'],
          ] as const).map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: kind === value }}
              onPress={() => setKind(value)}
              style={[styles.kindButton, kind === value && styles.kindButtonActive]}
            >
              <Text style={[styles.kindText, kind === value && styles.kindTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

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
            <View style={styles.grid}>
              {items.map(([label, id], i) => {
                const active = selected?.id === id && selected?.label === label;
                return (
                  <Pressable
                    key={label + i}
                    style={styles.item}
                    onPress={() => setSelected({ id, label })}
                    accessibilityRole="button"
                    accessibilityLabel={`选择${label}图标`}
                    accessibilityState={{ selected: active }}
                  >
                    <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                      <CategoryIcon
                        id={id}
                        size={25}
                        color={active ? '#181A19' : '#858B88'}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "600", color: TEXT_PRIMARY },
  done: { fontSize: 14, fontWeight: "600", color: PRIMARY_GREEN },
  doneOff: { color: "#B8B8B8" },
  nameInput: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 14,
    color: TEXT_PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  kindSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  kindLabel: { fontSize: 12, color: TEXT_SECONDARY },
  kindToggle: { flexDirection: 'row', padding: 2, backgroundColor: '#F1F3F2', borderRadius: 999 },
  kindButton: { minWidth: 56, paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center', borderRadius: 999 },
  kindButtonActive: { backgroundColor: '#101A17' },
  kindText: { fontSize: 11, color: TEXT_SECONDARY },
  kindTextActive: { color: '#FFFFFF', fontWeight: '600' },
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
  grid: { flexDirection: "row", flexWrap: "wrap" },
  item: { width: `${100 / 5}%`, minHeight: 70, alignItems: "center", paddingVertical: 10 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F7F8F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  iconWrapActive: { backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#1A1A1A" },
  itemLabel: { fontSize: 10, color: "#4E5350" },
  itemLabelActive: { color: "#181A19", fontWeight: "600" },
});
