import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { PRIMARY_GREEN } from '@/constants/Colors';

// Original geometry (measured at 3x): 49pt bar plus the safe area, a hairline top border,
// 40pt tab artwork with 10pt labels, and the 60pt add button rising 13.5pt above the bar.
const TAB_BAR_HEIGHT = 49;

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isHomeActive = state.index === 0;
  const isChartsActive = state.index === 2;

  return (
    <View
      style={[
        styles.tabBar,
        { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom },
      ]}
    >
      <Pressable
        style={styles.tab}
        onPress={() => navigation.navigate('index')}
        accessibilityLabel="首页"
        accessibilityRole="tab"
        accessibilityState={{ selected: isHomeActive }}
      >
        <Image
          source={
            isHomeActive
              ? require('../../assets/images/ui/tab-home-selected.png')
              : require('../../assets/images/ui/tab-home.png')
          }
          resizeMode="contain"
          style={styles.tabIcon}
        />
        <Text style={[styles.tabLabel, isHomeActive && styles.tabLabelActive]}>首页</Text>
      </Pressable>

      <View style={styles.fabContainer}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => router.push('/transaction/new')}
          accessibilityLabel="记一笔"
          accessibilityRole="button"
        >
          <Image
            source={require('../../assets/images/ui/tab-add.png')}
            style={styles.fabImage}
            accessible={false}
          />
        </Pressable>
      </View>

      <Pressable
        style={styles.tab}
        onPress={() => navigation.navigate('charts')}
        accessibilityLabel="预算/计划"
        accessibilityRole="tab"
        accessibilityState={{ selected: isChartsActive }}
      >
        <Image
          source={
            isChartsActive
              ? require('../../assets/images/ui/tab-budget-selected.png')
              : require('../../assets/images/ui/tab-budget.png')
          }
          resizeMode="contain"
          style={styles.tabIcon}
        />
        <Text style={[styles.tabLabel, isChartsActive && styles.tabLabelActive]}>
          预算/计划
        </Text>
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C0C0C0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: { width: 40, height: 40, marginTop: -2 },
  tabLabel: {
    marginTop: -3,
    fontSize: 10,
    lineHeight: 12,
    color: '#929292',
  },
  tabLabelActive: {
    color: '#000000',
    fontWeight: '600',
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
  },
  fab: {
    width: 60,
    height: 60,
    marginTop: -14,
  },
  fabImage: { width: 60, height: 60 },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
