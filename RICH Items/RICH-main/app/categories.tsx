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

import { Text, View } from '@/components/Themed';
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
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  listCategoriesWithSubcategoryCounts,
  listSubcategories,
  updateCategory,
  updateSubcategory,
} from '@/src/db/repo/categories';
import type { Category, Subcategory } from '@/src/domain/types';

// Category icons (matching the original RICH app)
const CATEGORY_ICONS: Record<string, string> = {
  '餐饮': 'cutlery',
  '衣服': 'shopping-bag',
  '交通': 'bus',
  '网费话费': 'mobile',
  '学习': 'book',
  '日用': 'home',
  '住房': 'building',
  '医疗': 'medkit',
  '发红包': 'gift',
  '汽车/加油': 'car',
  '娱乐': 'gamepad',
  '请客送礼': 'gift',
  '电器数码': 'laptop',
  '运动': 'futbol-o',
  '理发': 'scissors',
};

function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? 'tag';
}

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<Category & { subcategoryCount: number }>>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubEditModal, setShowSubEditModal] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [editSubcategoryName, setEditSubcategoryName] = useState('');

  const refresh = useCallback(async () => {
    const db = await getDb();
    const cats = await listCategoriesWithSubcategoryCounts(db);
    setCategories(cats);

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
    setShowEditModal(true);
  }

  function openEditSubcategory(subcategory: Subcategory) {
    setEditingSubcategory(subcategory);
    setEditSubcategoryName(subcategory.name);
    setShowSubEditModal(true);
  }

  async function onCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const db = await getDb();
    await createCategory(db, name);
    setNewCategoryName('');
    setShowAddModal(false);
    await refresh();
  }

  async function onSaveCategory() {
    if (!editingCategory) return;
    const name = editCategoryName.trim();
    if (!name) return;
    const db = await getDb();
    await updateCategory(db, { id: editingCategory.id, name });
    setShowEditModal(false);
    setEditingCategory(null);
    await refresh();
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
    await createSubcategory(db, expandedCategoryId, name);
    setNewSubcategoryName('');
    await refresh();
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
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={18} color={TEXT_PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle}>自定义</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category List */}
        {categories.map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <Pressable 
              style={styles.categoryRow}
              onPress={() => toggleExpand(category.id)}
            >
              <Pressable 
                style={styles.expandButton}
                onPress={() => toggleExpand(category.id)}
              >
                <FontAwesome 
                  name={expandedCategoryId === category.id ? 'caret-down' : 'caret-right'} 
                  size={16} 
                  color={TEXT_SECONDARY} 
                />
              </Pressable>
              
              <View style={styles.categoryIcon}>
                <FontAwesome 
                  name={getCategoryIcon(category.name) as any} 
                  size={18} 
                  color={PRIMARY_GREEN} 
                />
              </View>
              
              <Text style={styles.categoryName}>{category.name}</Text>
              
              <Pressable 
                style={styles.menuButton}
                onPress={() => openEditCategory(category)}
              >
                <FontAwesome name="ellipsis-h" size={16} color={TEXT_SECONDARY} />
              </Pressable>
            </Pressable>

            {/* Subcategories */}
            {expandedCategoryId === category.id && (
              <View style={styles.subcategoryList}>
                {subcategories.map((sub) => (
                  <Pressable 
                    key={sub.id}
                    style={styles.subcategoryRow}
                    onPress={() => openEditSubcategory(sub)}
                  >
                    <View style={styles.subcategoryIndent} />
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
                  />
                  {newSubcategoryName.trim() && (
                    <Pressable onPress={onCreateSubcategory}>
                      <FontAwesome name="plus-circle" size={20} color={PRIMARY_GREEN} />
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Category Button */}
      <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
        <Text style={styles.addButtonText}>+ 添加自定义</Text>
      </Pressable>

      {/* Add Category Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </Pressable>
              <Text style={styles.modalTitle}>添加自定义类目</Text>
              <Pressable onPress={onCreateCategory}>
                <Text style={styles.modalSave}>保存</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>分类名称</Text>
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="不超过6个字符"
                  style={styles.input}
                  placeholderTextColor={TEXT_SECONDARY}
                  maxLength={6}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
                  maxLength={6}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  categorySection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  expandButton: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${PRIMARY_GREEN}15`,
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
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  addButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
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
});
