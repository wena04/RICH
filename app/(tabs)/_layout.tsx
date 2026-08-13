import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import {
  PRIMARY_GREEN,
  FAB_BACKGROUND,
  FAB_ICON,
  TAB_ICON_SELECTED,
  TEXT_MUTED,
} from '@/constants/Colors';
import { RICH_SIZE } from '@/constants/Design';

// Custom Tab Bar Component
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const isHomeActive = state.index === 0;
  const isChartsActive = state.index === 2;

  return (
    <View
      style={[
        styles.tabBar,
        {
          height: RICH_SIZE.tabBar + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {/* Home Tab */}
      <Pressable
        style={styles.tab}
        onPress={() => navigation.navigate('index')}
        accessibilityLabel="首页"
        accessibilityRole="tab"
        accessibilityState={{ selected: isHomeActive }}
      >
        <FontAwesome
          name="calendar-check-o"
          size={26}
          color={isHomeActive ? TAB_ICON_SELECTED : TEXT_MUTED}
        />
        <Text style={[styles.tabLabel, isHomeActive && styles.tabLabelActive]}>
          首页
        </Text>
        {isHomeActive ? <View style={styles.activeMarker} /> : null}
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
          <Text style={styles.fabPlus}>+</Text>
        </Pressable>
      </View>

      {/* Charts/Budget Tab */}
      <Pressable
        style={styles.tab}
        onPress={() => navigation.navigate('charts')}
        accessibilityLabel="预算/计划"
        accessibilityRole="tab"
        accessibilityState={{ selected: isChartsActive }}
      >
        <FontAwesome
          name="clock-o"
          size={24}
          color={isChartsActive ? TAB_ICON_SELECTED : TEXT_MUTED}
        />
        <Text style={[styles.tabLabel, isChartsActive && styles.tabLabelActive]}>
          预算/计划
        </Text>
        {isChartsActive ? <View style={styles.activeMarker} /> : null}
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
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
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDDDDD',
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
    color: TAB_ICON_SELECTED,
    fontWeight: '600',
  },
  activeMarker: { width: 18, height: 2, marginTop: -1, backgroundColor: PRIMARY_GREEN },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: RICH_SIZE.fab,
    height: RICH_SIZE.fab,
    borderRadius: RICH_SIZE.fab / 2,
    backgroundColor: FAB_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
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
  fabPlus: {
    color: FAB_ICON,
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 32,
  },
});
