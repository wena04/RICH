import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
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

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Array<Category & { subcategoryCount: number }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  const [editCategoryName, setEditCategoryName] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [editSubcategoryName, setEditSubcategoryName] = useState('');

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );
  const selectedSubcategory = useMemo(
    () => subcategories.find((s) => s.id === selectedSubcategoryId) ?? null,
    [subcategories, selectedSubcategoryId]
  );

  const refresh = useCallback(async () => {
    const db = await getDb();
    const cats = await listCategoriesWithSubcategoryCounts(db);
    setCategories(cats);

    if (selectedCategoryId) {
      const subs = await listSubcategories(db, selectedCategoryId);
      setSubcategories(subs);
      if (selectedSubcategoryId && !subs.some((s) => s.id === selectedSubcategoryId)) {
        setSelectedSubcategoryId(null);
      }
    } else {
      setSubcategories([]);
      setSelectedSubcategoryId(null);
    }
  }, [selectedCategoryId, selectedSubcategoryId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  function selectCategory(c: Category) {
    setSelectedCategoryId(c.id);
    setEditCategoryName(c.name);
    setSelectedSubcategoryId(null);
    setEditSubcategoryName('');
  }

  function selectSubcategory(s: Subcategory) {
    setSelectedSubcategoryId(s.id);
    setEditSubcategoryName(s.name);
  }

  async function onCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const db = await getDb();
    await createCategory(db, name);
    setNewCategoryName('');
    await refresh();
  }

  async function onSaveCategory() {
    if (!selectedCategoryId) return;
    const name = editCategoryName.trim();
    if (!name) return;
    const db = await getDb();
    await updateCategory(db, { id: selectedCategoryId, name });
    await refresh();
  }

  async function onDeleteCategory() {
    if (!selectedCategoryId) return;
    const db = await getDb();
    const ok = await canDeleteCategory(db, selectedCategoryId);
    if (!ok) {
      Alert.alert(
        'Cannot delete category',
        'This category has subcategories and/or is referenced by existing transactions.'
      );
      return;
    }
    Alert.alert('Delete category?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const db2 = await getDb();
          await deleteCategory(db2, selectedCategoryId);
          setSelectedCategoryId(null);
          await refresh();
        },
      },
    ]);
  }

  async function onCreateSubcategory() {
    if (!selectedCategoryId) return;
    const name = newSubcategoryName.trim();
    if (!name) return;
    const db = await getDb();
    await createSubcategory(db, selectedCategoryId, name);
    setNewSubcategoryName('');
    await refresh();
  }

  async function onSaveSubcategory() {
    if (!selectedSubcategoryId) return;
    const name = editSubcategoryName.trim();
    if (!name) return;
    const db = await getDb();
    await updateSubcategory(db, { id: selectedSubcategoryId, name });
    await refresh();
  }

  async function onDeleteSubcategory() {
    if (!selectedSubcategoryId) return;
    const db = await getDb();
    const ok = await canDeleteSubcategory(db, selectedSubcategoryId);
    if (!ok) {
      Alert.alert('Cannot delete subcategory', 'This subcategory is referenced by existing transactions.');
      return;
    }
    Alert.alert('Delete subcategory?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const db2 = await getDb();
          await deleteSubcategory(db2, selectedSubcategoryId);
          setSelectedSubcategoryId(null);
          await refresh();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categories</Text>
      <Text style={styles.subtitle}>
        Categories are user-configurable. Subcategory is optional and scoped to a category.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Existing</Text>
        {categories.length === 0 ? (
          <Text>No categories yet.</Text>
        ) : (
          <View style={styles.list}>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => selectCategory(c)}
                style={[styles.row, c.id === selectedCategoryId && styles.rowActive]}>
                <Text style={styles.rowName}>{c.name}</Text>
                <Text style={styles.rowMeta}>{c.subcategoryCount} sub</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {selectedCategory ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Edit category</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput value={editCategoryName} onChangeText={setEditCategoryName} style={styles.input} />
          </View>
          <View style={styles.actions}>
            <Pressable onPress={onSaveCategory} style={styles.primary}>
              <Text style={styles.primaryText}>Save</Text>
            </Pressable>
            <Pressable onPress={onDeleteCategory} style={styles.danger}>
              <Text style={styles.dangerText}>Delete</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardTitle}>Subcategories</Text>
          {subcategories.length === 0 ? (
            <Text style={styles.hint}>No subcategories for this category.</Text>
          ) : (
            <View style={styles.list}>
              {subcategories.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => selectSubcategory(s)}
                  style={[styles.row, s.id === selectedSubcategoryId && styles.rowActive]}>
                  <Text style={styles.rowName}>{s.name}</Text>
                  <Text style={styles.rowMeta}>sub</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Add subcategory</Text>
            <TextInput
              value={newSubcategoryName}
              onChangeText={setNewSubcategoryName}
              placeholder="e.g. Coffee"
              style={styles.input}
            />
          </View>
          <Pressable onPress={onCreateSubcategory} style={styles.primary} disabled={!newSubcategoryName.trim()}>
            <Text style={styles.primaryText}>Create subcategory</Text>
          </Pressable>

          {selectedSubcategory ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.cardTitle}>Edit subcategory</Text>
              <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  value={editSubcategoryName}
                  onChangeText={setEditSubcategoryName}
                  style={styles.input}
                />
              </View>
              <View style={styles.actions}>
                <Pressable onPress={onSaveSubcategory} style={styles.primary}>
                  <Text style={styles.primaryText}>Save</Text>
                </Pressable>
                <Pressable onPress={onDeleteSubcategory} style={styles.danger}>
                  <Text style={styles.dangerText}>Delete</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add new category</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            placeholder="e.g. Food"
            style={styles.input}
          />
        </View>
        <Pressable onPress={onCreateCategory} style={styles.primary} disabled={!newCategoryName.trim()}>
          <Text style={styles.primaryText}>Create</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  cardTitle: {
    fontWeight: '700',
  },
  hint: {
    opacity: 0.7,
  },
  list: {
    gap: 6,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowActive: {
    borderColor: 'rgba(127,127,127,0.8)',
  },
  rowName: {
    fontWeight: '600',
  },
  rowMeta: {
    opacity: 0.7,
    fontSize: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
    borderRadius: 10,
    padding: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.3)',
    alignItems: 'center',
  },
  primaryText: {
    fontWeight: '600',
  },
  danger: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(193, 18, 31, 0.4)',
    alignItems: 'center',
  },
  dangerText: {
    color: '#c1121f',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(127,127,127,0.15)',
    marginVertical: 6,
  },
});

