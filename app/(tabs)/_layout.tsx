import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import Colors, { PRIMARY_GREEN, FAB_BACKGROUND, FAB_ICON } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size ?? 24} style={{ marginBottom: -3 }} {...props} />;
}

// Custom center FAB button component
function AddButton() {
  const router = useRouter();
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.fabButton,
        { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
      ]}
      onPress={() => router.push('/transaction/new')}
    >
      <FontAwesome name="plus" size={24} color={FAB_ICON} />
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        headerShown: useClientOnlyValue(false, true),
        headerStyle: { backgroundColor: PRIMARY_GREEN },
        headerTintColor: '#1A1A1A',
        headerTitleStyle: { fontWeight: '600' },
      }}>
      {/* Home tab - left side */}
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          headerShown: false, // Home has custom green header
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      
      {/* Placeholder for center FAB - this creates the space */}
      <Tabs.Screen
        name="add-placeholder"
        options={{
          title: '',
          tabBarIcon: () => <AddButton />,
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // FAB handles navigation
          },
        }}
      />
      
      {/* Charts/Budget tab - right side */}
      <Tabs.Screen
        name="charts"
        options={{
          title: '预算/计划',
          headerTitle: '预算/计划',
          tabBarIcon: ({ color }) => <TabBarIcon name="pie-chart" color={color} />,
        }}
      />

      {/* Hidden tabs - accessible from within screens but not in tab bar */}
      <Tabs.Screen
        name="transactions"
        options={{
          href: null, // Hide from tab bar
          title: 'Transactions',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          href: null, // Hide from tab bar
          title: 'More',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: FAB_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
