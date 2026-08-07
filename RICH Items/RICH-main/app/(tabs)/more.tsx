import { useRouter } from 'expo-router';
import { StyleSheet, Pressable, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <FontAwesome name={icon as any} size={18} color={TEXT_SECONDARY} style={styles.menuIcon} />
      <Text style={styles.menuLabel}>{label}</Text>
      <FontAwesome name="chevron-right" size={14} color={TEXT_SECONDARY} />
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      
      {/* Green Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设置</Text>
          
          <View style={styles.menuGroup}>
            <MenuItem 
              icon="bank" 
              label="账户管理" 
              onPress={() => router.push('/accounts')} 
            />
            <MenuItem 
              icon="tags" 
              label="分类管理" 
              onPress={() => router.push('/categories')} 
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据</Text>
          
          <View style={styles.menuGroup}>
            <MenuItem 
              icon="download" 
              label="导出数据" 
              onPress={() => router.push('/import-export')} 
            />
            <MenuItem 
              icon="upload" 
              label="导入数据" 
              onPress={() => router.push('/import-export')} 
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          
          <View style={styles.menuGroup}>
            <MenuItem 
              icon="info-circle" 
              label="关于应用" 
              onPress={() => {}} 
            />
            <MenuItem 
              icon="shield" 
              label="隐私政策" 
              onPress={() => {}} 
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Rich记账 MVP</Text>
          <Text style={styles.appVersion}>本地存储 · 隐私优先</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
  },
  header: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIcon: {
    width: 24,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: TEXT_PRIMARY,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'transparent',
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  appVersion: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
});
