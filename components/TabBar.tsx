import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text } from '@/components/Themed';
import { FAB_BACKGROUND, FAB_ICON, TEXT_PRIMARY, TEXT_MUTED } from '@/constants/Colors';

type TabBarProps = {
  visible?: boolean;
};

export function TabBar({ visible = true }: TabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (!visible) return null;

  const isHome = pathname === '/' || pathname === '/index' || pathname.startsWith('/(tabs)');
  const isCharts = pathname.includes('charts');

  const handleHomePress = () => {
    router.push('/');
  };

  const handleAddPress = () => {
    router.push('/transaction/new');
  };

  const handleChartsPress = () => {
    router.push('/charts');
  };

  return (
    <View style={styles.container}>
      {/* Home Tab */}
      <Pressable 
        style={styles.tab} 
        onPress={handleHomePress}
        accessibilityLabel="首页"
        accessibilityRole="tab"
      >
        <FontAwesome 
          name="home" 
          size={22} 
          color={isHome && !isCharts ? TEXT_PRIMARY : TEXT_MUTED} 
        />
        <Text style={[styles.label, isHome && !isCharts && styles.labelActive]}>
          首页
        </Text>
      </Pressable>

      {/* Center FAB */}
      <View style={styles.fabContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          onPress={handleAddPress}
          accessibilityLabel="记一笔"
          accessibilityRole="button"
        >
          <FontAwesome name="plus" size={20} color={FAB_ICON} />
        </Pressable>
      </View>

      {/* Charts/Budget Tab */}
      <Pressable 
        style={styles.tab} 
        onPress={handleChartsPress}
        accessibilityLabel="预算/计划"
        accessibilityRole="tab"
      >
        <FontAwesome 
          name="pie-chart" 
          size={20} 
          color={isCharts ? TEXT_PRIMARY : TEXT_MUTED} 
        />
        <Text style={[styles.label, isCharts && styles.labelActive]}>
          预算/计划
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 58,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
  },
  label: {
    fontSize: 10,
    color: TEXT_MUTED,
  },
  labelActive: {
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: FAB_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});

export default TabBar;
