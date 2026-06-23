import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { Text } from '@/components/Themed';
import Colors, { PRIMARY_GREEN, FAB_BACKGROUND, FAB_ICON, TEXT_PRIMARY, TEXT_MUTED } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// Custom Tab Bar Component
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  
  const isHomeActive = state.index === 0;
  const isChartsActive = state.index === 2;

  return (
    <View style={styles.tabBar}>
      {/* Home Tab */}
      <Pressable
        style={styles.tab}
        onPress={() => navigation.navigate('index')}
        accessibilityLabel="首页"
        accessibilityRole="tab"
      >
        <FontAwesome
          name="home"
          size={26}
          color={isHomeActive ? TEXT_PRIMARY : TEXT_MUTED}
        />
        <Text style={[styles.tabLabel, isHomeActive && styles.tabLabelActive]}>
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
          onPress={() => router.push('/transaction/new')}
          accessibilityLabel="记一笔"
          accessibilityRole="button"
        >
          <FontAwesome name="plus" size={24} color={FAB_ICON} />
        </Pressable>
      </View>

      {/* Charts/Budget Tab */}
      <Pressable
        style={styles.tab}
        onPress={() => navigation.navigate('charts')}
        accessibilityLabel="预算/计划"
        accessibilityRole="tab"
      >
        <FontAwesome
          name="pie-chart"
          size={24}
          color={isChartsActive ? TEXT_PRIMARY : TEXT_MUTED}
        />
        <Text style={[styles.tabLabel, isChartsActive && styles.tabLabelActive]}>
          预算/计划
        </Text>
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: PRIMARY_GREEN },
        headerTintColor: '#1A1A1A',
        headerTitleStyle: { fontWeight: '600' },
      }}>
      {/* Home tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
        }}
      />
      
      {/* Placeholder for center FAB */}
      <Tabs.Screen
        name="add-placeholder"
        options={{
          href: null,
        }}
      />
      
      {/* Charts/Budget tab */}
      <Tabs.Screen
        name="charts"
        options={{
          title: '预算/计划',
        }}
      />

      {/* Hidden tabs */}
      <Tabs.Screen
        name="transactions"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 8,
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
    gap: 4,
    paddingVertical: 10,
  },
  tabLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  tabLabelActive: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: FAB_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
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
