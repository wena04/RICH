import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { 
  Alert, 
  Pressable, 
  StyleSheet, 
  TextInput, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { ScreenHeader } from '@/components/rich';
import { Text, View } from '@/components/Themed';
import { CategoryIcon } from '@/components/CategoryIcon';
import { 
  PRIMARY_GREEN, 
  TEXT_PRIMARY, 
  TEXT_SECONDARY,
  EXPENSE_RED,
} from '@/constants/Colors';
import { getDb } from '@/src/db/db';
import {
  canDeleteCategory,
  canDeleteSubcategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  listCategoriesWithSubcategoryCounts,
  listSubcategories,
  updateCategory,
  updateSubcategory,
} from '@/src/db/repo/categories';
import type { Category, CategoryKind, Subcategory } from '@/src/domain/types';
import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/src/domain/categories';


export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<Category & { subcategoryCount: number }>>([]);
  const [filter, setFilter] = useState<'expense' | 'income' | 'all'>('expense');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubEditModal, setShowSubEditModal] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryKind, setEditCategoryKind] = useState<CategoryKind>('expense');
  
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [editSubcategoryName, setEditSubcategoryName] = useState('');

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          filter === 'all' || category.kind === filter || category.kind === 'both',
      ),
    [categories, filter],
  );

  const refresh = useCallback(async () => {
    const db = await getDb();
    const cats = await listCategoriesWithSubcategoryCounts(db);
    const order = new Map(
      [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].map((category, index) => [
        category.name,
        index,
      ]),
    );
    setCategories(
      [...cats].sort((a, b) => {
        const aOrder = order.get(a.name) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = order.get(b.name) ?? Number.MAX_SAFE_INTEGER;
        return aOrder === bOrder ? a.name.localeCompare(b.name, 'zh-CN') : aOrder - bOrder;
      }),
    );

    if (expandedCategoryId) {
      const subs = await listSubcategories(db, expandedCategoryId);
      setSubcategories(subs);
    } else {
      setSubcategories([]);
    }
  }, [expandedCategoryId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function toggleExpand(categoryId: string) {
    if (expandedCategoryId === categoryId) {
      setExpandedCategoryId(null);
      setSubcategories([]);
    } else {
      setExpandedCategoryId(categoryId);
      const db = await getDb();
      const subs = await listSubcategories(db, categoryId);
      setSubcategories(subs);
    }
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryKind(category.kind);
    setShowEditModal(true);
  }

  function openEditSubcategory(subcategory: Subcategory) {
    setEditingSubcategory(subcategory);
    setEditSubcategoryName(subcategory.name);
    setShowSubEditModal(true);
  }

  async function onSaveCategory() {
    if (!editingCategory) return;
    const name = editCategoryName.trim();
    if (!name) return;
    const db = await getDb();
    try {
      await updateCategory(db, { id: editingCategory.id, name, kind: editCategoryKind });
      setShowEditModal(false);
      setEditingCategory(null);
      await refresh();
    } catch (error) {
      Alert.alert('无法保存', error instanceof Error ? error.message : '分类名称可能已存在。');
    }
  }

  async function onDeleteCategory() {
    if (!editingCategory) return;
    const db = await getDb();
    const ok = await canDeleteCategory(db, editingCategory.id);
    if (!ok) {
      Alert.alert('无法删除', '该分类有子分类或已关联交易记录');
      return;
    }
    Alert.alert('删除分类?', '此操作无法撤销', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const db2 = await getDb();
          await deleteCategory(db2, editingCategory.id);
          setShowEditModal(false);
          setEditingCategory(null);
          if (expandedCategoryId === editingCategory.id) {
            setExpandedCategoryId(null);
          }
          await refresh();
        },
      },
    ]);
  }

  async function onCreateSubcategory() {
    if (!expandedCategoryId) return;
    const name = newSubcategoryName.trim();
    if (!name) return;
    const db = await getDb();
    try {
      await createSubcategory(db, expandedCategoryId, name);
      setNewSubcategoryName('');
      await refresh();
    } catch {
      Alert.alert('无法添加', '这个分类下已经有同名子分类。');
    }
  }

  async function onSaveSubcategory() {
    if (!editingSubcategory) return;
    const name = editSubcategoryName.trim();
    if (!name) return;
    const db = await getDb();
    await updateSubcategory(db, { id: editingSubcategory.id, name });
    setShowSubEditModal(false);
    setEditingSubcategory(null);
    await refresh();
  }

  async function onDeleteSubcategory() {
    if (!editingSubcategory) return;
    const db = await getDb();
    const ok = await canDeleteSubcategory(db, editingSubcategory.id);
    if (!ok) {
      Alert.alert('无法删除', '该子分类已关联交易记录');
      return;
    }
    Alert.alert('删除子分类?', '此操作无法撤销', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const db2 = await getDb();
          await deleteSubcategory(db2, editingSubcategory.id);
          setShowSubEditModal(false);
          setEditingSubcategory(null);
          await refresh();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScreenHeader title="自定义" onBack={() => router.back()} borderBottom />

      <View style={styles.filterBar}>
        {([
          ['expense', '支出'],
          ['income', '收入'],
          ['all', '全部'],
        ] as const).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === value }}
            onPress={() => {
              setFilter(value);
              setExpandedCategoryId(null);
            }}
            style={[styles.filterButton, filter === value && styles.filterButtonActive]}
          >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.introRow}>
        <Text style={styles.introTitle}>分类 → 子分类</Text>
        <Text style={styles.introHint}>点开分类即可整理第二层</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {/* Category List */}
        {visibleCategories.map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <View style={styles.categoryRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${expandedCategoryId === category.id ? '收起' : '展开'}${category.name}子分类`}
                accessibilityHint={`包含 ${category.subcategoryCount} 个子分类`}
                accessibilityState={{ expanded: expandedCategoryId === category.id }}
                style={({ pressed }) => [
                  styles.expandControl,
                  pressed && styles.expandControlPressed,
                ]}
                onPress={() => toggleExpand(category.id)}
              >
                <View style={styles.expandIndicator}>
                  <FontAwesome
                    name={expandedCategoryId === category.id ? 'caret-down' : 'caret-right'}
                    size={16}
                    color={TEXT_SECONDARY}
                  />
                </View>

                <View style={styles.categoryIcon}>
                  <CategoryIcon
                    id={category.icon ?? undefined}
                    name={category.name}
                    size={22}
                  />
                </View>

                <Text style={styles.categoryName}>{category.name}</Text>
                <View style={styles.categoryMetaPill}>
                  <Text style={styles.categoryMetaText}>{category.subcategoryCount} 个子类</Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`编辑${category.name}`}
                accessibilityHint="修改分类名称、用途或删除分类"
                style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
                onPress={() => openEditCategory(category)}
              >
                <FontAwesome name="ellipsis-h" size={16} color={TEXT_SECONDARY} />
              </Pressable>
            </View>

            {/* Subcategories */}
            {expandedCategoryId === category.id && (
              <View style={styles.subcategoryList}>
                {subcategories.map((sub) => (
                  <Pressable 
                    key={sub.id}
                    style={styles.subcategoryRow}
                    onPress={() => openEditSubcategory(sub)}
                    accessibilityRole="button"
                    accessibilityLabel={`编辑子分类${sub.name}`}
                  >
                    <View style={styles.subcategoryIndent} />
                    <View style={styles.subcategoryIcon}>
                      <CategoryIcon name={sub.name} size={18} />
                    </View>
                    <Text style={styles.subcategoryName}>{sub.name}</Text>
                    <FontAwesome name="ellipsis-h" size={14} color={TEXT_SECONDARY} />
                  </Pressable>
                ))}
                
                {/* Add subcategory inline */}
                <View style={styles.addSubcategoryRow}>
                  <View style={styles.subcategoryIndent} />
                  <TextInput
                    style={styles.addSubInput}
                    value={newSubcategoryName}
                    onChangeText={setNewSubcategoryName}
                    placeholder="添加子分类..."
                    placeholderTextColor={TEXT_SECONDARY}
                    maxLength={20}
                  />
                  {newSubcategoryName.trim() && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`添加子分类${newSubcategoryName.trim()}`}
                      style={styles.addSubcategoryButton}
                      onPress={onCreateSubcategory}
                    >
                      <FontAwesome name="plus-circle" size={20} color={PRIMARY_GREEN} />
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Non-overlapping footer action — opens the full icon picker */}
      <View style={styles.actionFooter}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="添加自定义分类"
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={() => router.push('/categories/add')}
        >
          <Text style={styles.addButtonText}>+ 添加自定义</Text>
        </Pressable>
      </View>

      {/* Edit Category Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.modalTitle}>编辑分类</Text>
              <Pressable onPress={onSaveCategory}>
                <Text style={styles.modalSave}>保存</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>分类名称</Text>
                <TextInput
                  value={editCategoryName}
                  onChangeText={setEditCategoryName}
                  style={styles.input}
                  placeholderTextColor={TEXT_SECONDARY}
                  maxLength={6}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>用于</Text>
                <View style={styles.kindToggle}>
                  {([
                    ['expense', '支出'],
                    ['income', '收入'],
                    ['both', '两者'],
                  ] as const).map(([value, label]) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: editCategoryKind === value }}
                      onPress={() => setEditCategoryKind(value)}
                      style={[
                        styles.kindButton,
                        editCategoryKind === value && styles.kindButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.kindText,
                          editCategoryKind === value && styles.kindTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable style={styles.deleteButton} onPress={onDeleteCategory}>
                <Text style={styles.deleteButtonText}>删除该分类</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Subcategory Modal */}
      <Modal visible={showSubEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowSubEditModal(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.modalTitle}>编辑子分类</Text>
              <Pressable onPress={onSaveSubcategory}>
                <Text style={styles.modalSave}>保存</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>子分类名称</Text>
                <TextInput
                  value={editSubcategoryName}
                  onChangeText={setEditSubcategoryName}
                  style={styles.input}
                  placeholderTextColor={TEXT_SECONDARY}
                  maxLength={20}
                />
              </View>

              <Pressable style={styles.deleteButton} onPress={onDeleteSubcategory}>
                <Text style={styles.deleteButtonText}>删除该子分类</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollBody: {
    paddingBottom: 8,
  },
  filterBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 3,
    backgroundColor: '#F1F3F2',
    borderRadius: 999,
  },
  filterButton: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  filterButtonActive: { backgroundColor: '#101A17' },
  filterText: { fontSize: 12, color: TEXT_SECONDARY },
  filterTextActive: { color: '#FFFFFF', fontWeight: '700' },
  introRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
  },
  introTitle: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  introHint: { fontSize: 10.5, color: TEXT_SECONDARY },
  categorySection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 10,
    backgroundColor: '#FFFFFF',
  },
  expandControl: {
    flex: 1,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandControlPressed: {
    backgroundColor: '#F7F8F7',
  },
  expandIndicator: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_PRIMARY,
  },
  categoryMetaPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 3,
    borderRadius: 999,
    backgroundColor: '#F1F4F2',
  },
  categoryMetaText: { fontSize: 9.5, color: TEXT_SECONDARY },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonPressed: {
    backgroundColor: '#F1F4F2',
  },
  subcategoryList: {
    backgroundColor: '#FAFAFA',
    paddingBottom: 8,
  },
  subcategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subcategoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  subcategoryIndent: {
    width: 72,
  },
  subcategoryName: {
    flex: 1,
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  addSubcategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addSubInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_PRIMARY,
    padding: 0,
  },
  addSubcategoryButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionFooter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  addButton: {
    width: '70%',
    minHeight: 48,
    alignSelf: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    opacity: 0.82,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'transparent',
  },
  modalCancel: {
    fontSize: 16,
    color: TEXT_SECONDARY,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  modalSave: {
    fontSize: 16,
    color: PRIMARY_GREEN,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  field: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_PRIMARY,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: TEXT_PRIMARY,
  },
  deleteButton: {
    backgroundColor: EXPENSE_RED,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  kindToggle: { flexDirection: 'row', backgroundColor: '#F1F3F2', padding: 3, borderRadius: 999 },
  kindButton: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 999 },
  kindButtonActive: { backgroundColor: '#101A17' },
  kindText: { fontSize: 12, color: TEXT_SECONDARY },
  kindTextActive: { color: '#FFFFFF', fontWeight: '600' },
});
